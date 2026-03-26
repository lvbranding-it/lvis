import subprocess
import json
import base64
import tempfile
import os
import re
from typing import Any
from models.response import ExifToolFindings

def _exiftool_bin() -> str:
    """Return the exiftool binary path, resolved at call time so dotenv is loaded."""
    return os.getenv("EXIFTOOL_PATH", "exiftool")


CRITICAL_EXIF_FIELDS = [
    "Make", "Model", "DateTimeOriginal", "CreateDate", "ModifyDate",
    "FileModifyDate", "Software", "ImageWidth", "ImageHeight",
    "ExifImageWidth", "ExifImageHeight", "ColorSpace", "Compression",
    "XResolution", "YResolution", "BitsPerSample",
]

EDITING_SOFTWARE_PATTERNS = [
    r"adobe\s*photoshop", r"adobe\s*lightroom", r"capture\s*one",
    r"gimp", r"affinity\s*photo", r"luminar", r"darktable",
    r"on1\s*photo", r"photomatix", r"topaz", r"skylum",
]


def analyze_exif(image_base64: str, file_type: str) -> ExifToolFindings:
    """
    Extract and analyze EXIF/XMP/IPTC metadata using ExifTool.
    Returns ExifToolFindings with provenance and integrity scores.
    """
    # Decode base64 to temp file
    image_data = base64.b64decode(image_base64)

    suffix = ".jpg" if "jpeg" in file_type.lower() or "jpg" in file_type.lower() else \
             ".png" if "png" in file_type.lower() else \
             ".tiff" if "tiff" in file_type.lower() else \
             ".cr2" if "cr2" in file_type.lower() else \
             ".cr3" if "cr3" in file_type.lower() else \
             ".nef" if "nef" in file_type.lower() else \
             ".arw" if "arw" in file_type.lower() else \
             ".dng" if "dng" in file_type.lower() else \
             ".orf" if "orf" in file_type.lower() else \
             ".rw2" if "rw2" in file_type.lower() else \
             ".raf" if "raf" in file_type.lower() else ".jpg"

    flags = []
    raw_metadata = {}

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(image_data)
        tmp_path = tmp.name

    try:
        # Run ExifTool with full metadata extraction
        result = subprocess.run(
            [_exiftool_bin(), "-json", "-G", "-struct", "-XMP:All", "-IPTC:All", tmp_path],
            capture_output=True,
            text=True,
            timeout=30
        )

        if result.returncode != 0:
            return ExifToolFindings(
                provenance_score=50.0,
                integrity_score=50.0,
                flags=["ExifTool extraction failed"],
                raw={}
            )

        metadata_list = json.loads(result.stdout)
        if not metadata_list:
            return ExifToolFindings(
                provenance_score=60.0,
                integrity_score=60.0,
                flags=["No metadata returned by ExifTool"],
                raw={}
            )

        raw_metadata = metadata_list[0]

        # ── Provenance Analysis ───────────────────────────────────────────

        provenance_score = 0.0

        # Camera make/model present?
        has_make = bool(raw_metadata.get("EXIF:Make") or raw_metadata.get("Make"))
        has_model = bool(raw_metadata.get("EXIF:Model") or raw_metadata.get("Model"))

        if not has_make:
            flags.append("Camera make not present in metadata")
            provenance_score += 20
        if not has_model:
            flags.append("Camera model not present in metadata")
            provenance_score += 15

        # Original capture timestamp?
        date_original = raw_metadata.get("EXIF:DateTimeOriginal") or raw_metadata.get("DateTimeOriginal")
        date_create = raw_metadata.get("EXIF:CreateDate") or raw_metadata.get("CreateDate")
        date_modify = raw_metadata.get("EXIF:ModifyDate") or raw_metadata.get("ModifyDate")
        file_modify = raw_metadata.get("File:FileModifyDate") or raw_metadata.get("FileModifyDate")

        if not date_original:
            flags.append("Original capture timestamp (DateTimeOriginal) missing")
            provenance_score += 25

        # Timestamp consistency check
        if date_original and date_modify and date_modify != date_original:
            flags.append(f"ModifyDate differs from DateTimeOriginal — file was edited after capture")
            provenance_score += 10

        # Software history
        software = raw_metadata.get("EXIF:Software") or raw_metadata.get("Software") or ""
        xmp_history = raw_metadata.get("XMP:HistorySoftwareAgent") or \
                      raw_metadata.get("XMP-xmpMM:HistorySoftwareAgent") or ""

        software_str = f"{software} {xmp_history}".lower()
        editing_detected = any(
            re.search(pattern, software_str)
            for pattern in EDITING_SOFTWARE_PATTERNS
        )
        if editing_detected:
            flags.append(f"Editing software detected in metadata: {software.strip()}")
            provenance_score += 10

        # GPS stripped (not necessarily suspicious, but worth noting)
        has_gps = bool(raw_metadata.get("GPS:GPSLatitude") or raw_metadata.get("GPS:GPSLongitude"))
        if not has_gps:
            flags.append("GPS coordinates not present (common in published images)")
            # Not a strong concern — don't increase score

        # ── Integrity Analysis ────────────────────────────────────────────

        integrity_score = 0.0

        # File format validation
        file_type_meta = raw_metadata.get("File:FileType") or raw_metadata.get("FileType") or ""
        image_width = raw_metadata.get("EXIF:ImageWidth") or raw_metadata.get("ExifImageWidth")
        image_height = raw_metadata.get("EXIF:ImageHeight") or raw_metadata.get("ExifImageHeight")

        if not image_width or not image_height:
            flags.append("Image dimensions not found in EXIF metadata")
            integrity_score += 15

        # ICC profile
        has_icc = bool(
            raw_metadata.get("ICC_Profile:ProfileDescription") or
            raw_metadata.get("ICC-Profile:ProfileDescription") or
            raw_metadata.get("ColorSpace")
        )
        if not has_icc:
            flags.append("No ICC color profile embedded")
            integrity_score += 5

        # Multiple software saves (XMP history)
        history_instances = raw_metadata.get("XMP:HistoryAction") or []
        if isinstance(history_instances, list) and len(history_instances) > 1:
            flags.append(f"XMP history indicates {len(history_instances)} edit operations")
            integrity_score += min(len(history_instances) * 5, 30)

        # Clamp scores to 0-100
        provenance_score = min(max(provenance_score, 0), 100)
        integrity_score = min(max(integrity_score, 0), 100)

        return ExifToolFindings(
            provenance_score=round(provenance_score, 2),
            integrity_score=round(integrity_score, 2),
            flags=flags,
            raw=raw_metadata
        )

    except subprocess.TimeoutExpired:
        return ExifToolFindings(
            provenance_score=50.0,
            integrity_score=50.0,
            flags=["ExifTool timed out"],
            raw={}
        )
    except Exception as e:
        return ExifToolFindings(
            provenance_score=50.0,
            integrity_score=50.0,
            flags=[f"ExifTool error: {str(e)}"],
            raw={}
        )
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
