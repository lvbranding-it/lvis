import cv2
import numpy as np
import base64
import tempfile
import os
from typing import List, Dict, Any
from models.response import OpenCVFindings


def analyze_image(image_base64: str) -> OpenCVFindings:
    """
    Perform computer vision forensic analysis:
    - Error Level Analysis (ELA)
    - Noise uniformity analysis
    - Clone stamp detection
    """
    image_data = base64.b64decode(image_base64)
    nparr = np.frombuffer(image_data, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img_bgr is None:
        return OpenCVFindings(
            manipulation_score=0.0,
            ela_score=0.0,
            ela_map_base64=None,
            noise_uniformity_score=0.0,
            clone_score=0.0,
            flagged_regions=[]
        )

    ela_score, ela_map_b64, ela_regions = perform_ela(img_bgr, image_data)
    noise_score, noise_regions = analyze_noise(img_bgr)
    clone_score, clone_regions = detect_clones(img_bgr)

    # Combine into overall manipulation score (weighted)
    manipulation_score = ela_score * 0.5 + noise_score * 0.3 + clone_score * 0.2
    manipulation_score = min(max(manipulation_score, 0), 100)

    all_regions = ela_regions + noise_regions + clone_regions

    return OpenCVFindings(
        manipulation_score=round(manipulation_score, 2),
        ela_score=round(ela_score, 2),
        ela_map_base64=ela_map_b64,
        noise_uniformity_score=round(noise_score, 2),
        clone_score=round(clone_score, 2),
        flagged_regions=all_regions
    )


def perform_ela(img_bgr: np.ndarray, original_bytes: bytes) -> tuple:
    """
    Error Level Analysis: Re-save image at 90% JPEG quality and compute difference.
    High-error regions indicate areas that were previously saved at lower quality
    (indicating post-processing).
    """
    flagged_regions = []

    # Re-save at quality=90 to temp file
    with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp:
        tmp_path = tmp.name

    try:
        encode_params = [cv2.IMWRITE_JPEG_QUALITY, 90]
        cv2.imwrite(tmp_path, img_bgr, encode_params)
        resaved = cv2.imread(tmp_path)
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)

    if resaved is None or resaved.shape != img_bgr.shape:
        return 0.0, None, []

    # Compute absolute difference and amplify
    diff = cv2.absdiff(img_bgr.astype(np.float32), resaved.astype(np.float32))
    diff_amplified = np.clip(diff * 10, 0, 255).astype(np.uint8)

    # Compute ELA score: mean intensity of amplified difference
    ela_mean = np.mean(diff_amplified)
    ela_max = np.max(diff_amplified)

    # Score 0-100: higher difference = more concern
    # Typical authentic JPEG: ela_mean < 5
    # Edited content: ela_mean > 15
    ela_score = min(ela_mean * 4, 100)

    # Find high-error regions (blocks with high ELA)
    gray_diff = cv2.cvtColor(diff_amplified, cv2.COLOR_BGR2GRAY)
    h, w = gray_diff.shape
    block_size = 64
    threshold = 30

    for y in range(0, h - block_size, block_size):
        for x in range(0, w - block_size, block_size):
            block = gray_diff[y:y+block_size, x:x+block_size]
            if np.mean(block) > threshold:
                flagged_regions.append({
                    'x': int(x), 'y': int(y),
                    'w': block_size, 'h': block_size,
                    'type': 'ela_anomaly'
                })

    # Encode ELA map as base64 thumbnail for display
    small = cv2.resize(diff_amplified, (320, int(320 * h / w)))
    _, buffer = cv2.imencode('.jpg', small, [cv2.IMWRITE_JPEG_QUALITY, 70])
    ela_map_b64 = base64.b64encode(buffer.tobytes()).decode('utf-8')

    return ela_score, ela_map_b64, flagged_regions[:10]  # Limit regions


def analyze_noise(img_bgr: np.ndarray) -> tuple:
    """
    Noise uniformity analysis. Pasted/composited regions tend to have
    unnaturally low noise variance compared to surrounding areas.
    """
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

    # Compute noise map via high-pass filter
    blur = cv2.GaussianBlur(gray.astype(np.float32), (5, 5), 0)
    noise = gray.astype(np.float32) - blur

    h, w = noise.shape
    block_size = 64
    variances = []
    flagged_regions = []

    for y in range(0, h - block_size, block_size):
        for x in range(0, w - block_size, block_size):
            block = noise[y:y+block_size, x:x+block_size]
            variances.append(np.var(block))

    if not variances:
        return 0.0, []

    mean_var = np.mean(variances)
    std_var = np.std(variances)

    # Regions with variance more than 2 std below mean = suspiciously smooth
    threshold = mean_var - 2 * std_var

    idx = 0
    for y in range(0, h - block_size, block_size):
        for x in range(0, w - block_size, block_size):
            if idx < len(variances) and variances[idx] < threshold and threshold > 0:
                flagged_regions.append({
                    'x': int(x), 'y': int(y),
                    'w': block_size, 'h': block_size,
                    'type': 'noise_anomaly'
                })
            idx += 1

    # Score: coefficient of variation of block variances
    # High CV = more heterogeneous noise = more suspicious
    cv = std_var / mean_var if mean_var > 0 else 0
    noise_score = min(cv * 50, 100)

    return round(noise_score, 2), flagged_regions[:10]


def detect_clones(img_bgr: np.ndarray) -> tuple:
    """
    Clone stamp detection via normalized cross-correlation on image blocks.
    Finds duplicate regions that may indicate content was cloned/stamped.
    """
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape

    # Resize to manageable size for performance
    max_dim = 512
    scale = min(max_dim / h, max_dim / w, 1.0)
    if scale < 1.0:
        new_h, new_w = int(h * scale), int(w * scale)
        gray = cv2.resize(gray, (new_w, new_h))
        h, w = new_h, new_w

    block_size = 16
    stride = 8
    clone_pairs = []
    clone_score = 0.0

    # Extract all blocks
    blocks = {}
    for y in range(0, h - block_size, stride):
        for x in range(0, w - block_size, stride):
            block = gray[y:y+block_size, x:x+block_size]
            # Use normalized template matching
            key = (y, x)
            blocks[key] = block

    # Compare blocks (sample for performance)
    keys = list(blocks.keys())
    sample_size = min(len(keys), 200)
    import random
    sampled_keys = random.sample(keys, sample_size)

    for i, k1 in enumerate(sampled_keys):
        for k2 in sampled_keys[i+1:]:
            b1, b2 = blocks[k1], blocks[k2]
            # Euclidean distance normalized by block size
            dist = np.sqrt(np.mean((b1.astype(float) - b2.astype(float))**2))
            if dist < 3.0:  # Very similar blocks
                spatial_dist = np.sqrt((k1[0]-k2[0])**2 + (k1[1]-k2[1])**2)
                if spatial_dist > block_size * 2:  # Not adjacent
                    clone_pairs.append({
                        'x': int(k1[1]), 'y': int(k1[0]),
                        'w': block_size, 'h': block_size,
                        'type': 'clone_detection'
                    })

    # Score based on number of suspicious pairs
    clone_score = min(len(clone_pairs) * 5, 100)

    return round(clone_score, 2), clone_pairs[:10]
