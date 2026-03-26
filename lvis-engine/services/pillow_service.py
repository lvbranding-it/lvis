from PIL import Image, ImageChops
import io
import base64
import struct
from models.response import PillowFindings


JPEG_MAGIC = b'\xff\xd8\xff'
PNG_MAGIC = b'\x89PNG\r\n\x1a\n'
TIFF_MAGIC_LE = b'II*\x00'
TIFF_MAGIC_BE = b'MM\x00*'


def analyze_file(image_base64: str, file_type: str) -> PillowFindings:
    """
    Pillow-based file integrity analysis.
    Validates file structure, headers, and ICC profiles.
    """
    image_data = base64.b64decode(image_base64)
    flags = []
    integrity_score = 0.0

    # Magic byte validation
    expected_magic = None
    if 'jpeg' in file_type.lower() or 'jpg' in file_type.lower():
        expected_magic = JPEG_MAGIC
    elif 'png' in file_type.lower():
        expected_magic = PNG_MAGIC

    if expected_magic and not image_data[:len(expected_magic)] == expected_magic:
        flags.append(f"File header (magic bytes) does not match declared file type {file_type}")
        integrity_score += 40

    try:
        img = Image.open(io.BytesIO(image_data))

        # Verify image integrity
        try:
            img.verify()
        except Exception as e:
            flags.append(f"Image verification failed: {str(e)}")
            integrity_score += 30
            # Re-open after verify (PIL verify closes the file)
            img = Image.open(io.BytesIO(image_data))

        # Re-open for further analysis
        img = Image.open(io.BytesIO(image_data))

        # Mode/bit depth check
        mode = img.mode
        if mode not in ('RGB', 'RGBA', 'L', 'CMYK', 'P', 'I', 'F'):
            flags.append(f"Unusual image mode: {mode}")
            integrity_score += 10

        # ICC profile check
        icc = img.info.get('icc_profile')
        if not icc:
            flags.append("No embedded ICC color profile found")
            integrity_score += 5

        # EXIF thumbnail check for JPEG
        if 'jpeg' in file_type.lower() or 'jpg' in file_type.lower():
            exif_data = img.info.get('exif', b'')
            if len(exif_data) > 100:
                # Check if embedded thumbnail dimensions don't match main image
                try:
                    from PIL.ExifTags import TAGS
                    exif_dict = img.getexif()
                    thumb_width = exif_dict.get(0xA002)
                    thumb_height = exif_dict.get(0xA003)
                    if thumb_width and thumb_height:
                        if thumb_width != img.width or thumb_height != img.height:
                            # Normal — thumbnail is usually smaller
                            pass
                except Exception:
                    pass

        # Format vs extension consistency
        format_map = {'JPEG': 'jpeg', 'PNG': 'png', 'TIFF': 'tiff', 'HEIC': 'heic'}
        if img.format and img.format in format_map:
            if format_map[img.format] not in file_type.lower():
                flags.append(f"Image format ({img.format}) inconsistent with declared MIME type ({file_type})")
                integrity_score += 20

        integrity_score = min(max(integrity_score, 0), 100)

        return PillowFindings(
            integrity_score=round(integrity_score, 2),
            integrity_flags=flags
        )

    except Exception as e:
        return PillowFindings(
            integrity_score=50.0,
            integrity_flags=[f"Pillow analysis error: {str(e)}"]
        )
