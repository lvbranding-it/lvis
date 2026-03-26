"""
RAW camera file converter — converts RAW formats to JPEG for forensic analysis.

Supported formats: CR2, CR3, NEF, ARW, DNG, ORF, RW2, RAF
Uses rawpy (libraw bindings) for decoding, imageio for encoding.

Returns base64-encoded JPEG bytes suitable for OpenCV, Pillow, and Claude vision.
"""

import base64
import io
import tempfile
import os
from typing import Optional

RAW_EXTENSIONS = {'.cr2', '.cr3', '.nef', '.arw', '.dng', '.orf', '.rw2', '.raf'}


def is_raw_file(file_name: str) -> bool:
    """Check if a filename has a RAW camera extension."""
    ext = os.path.splitext(file_name.lower())[1]
    return ext in RAW_EXTENSIONS


def convert_raw_to_jpeg_base64(image_base64: str, file_name: str) -> Optional[str]:
    """
    Convert a RAW camera file (base64-encoded) to a JPEG base64 string.

    Returns:
        JPEG base64 string if conversion succeeded, None otherwise.
    """
    try:
        import rawpy
        import imageio
    except ImportError:
        # rawpy not installed — gracefully return None
        # The caller should fall back to using the original bytes
        return None

    try:
        raw_bytes = base64.b64decode(image_base64)
        ext = os.path.splitext(file_name.lower())[1] or '.raw'

        # Write to a temp file — rawpy requires file path or file-like object
        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
            tmp.write(raw_bytes)
            tmp_path = tmp.name

        try:
            with rawpy.imread(tmp_path) as raw:
                # use_camera_wb: respect camera white balance
                # no_auto_bright: preserve original exposure
                rgb = raw.postprocess(use_camera_wb=True, no_auto_bright=False, output_bps=8)

            # Encode to JPEG in memory
            buf = io.BytesIO()
            imageio.imwrite(buf, rgb, format='JPEG', quality=92)
            buf.seek(0)
            return base64.b64encode(buf.read()).decode('utf-8')

        finally:
            os.unlink(tmp_path)

    except Exception as e:
        print(f'[raw_converter] Conversion failed for {file_name}: {e}')
        return None
