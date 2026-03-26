from fastapi import APIRouter, Depends, HTTPException, Header
from models.request import AnalyzeRequest
from models.response import TechnicalFindings
from services.exiftool_service import analyze_exif
from services.opencv_service import analyze_image
from services.pillow_service import analyze_file
from services.raw_converter import is_raw_file, convert_raw_to_jpeg_base64
import os

router = APIRouter()


def verify_api_key(x_api_key: str = Header(...)):
    expected = os.getenv("LVIS_ENGINE_API_KEY")
    if not expected or x_api_key != expected:
        raise HTTPException(status_code=401, detail="Invalid API key")


@router.post("/analyze", response_model=TechnicalFindings)
async def analyze(request: AnalyzeRequest, _: None = Depends(verify_api_key)):
    """
    Perform technical forensic analysis on an image.
    Returns ExifTool + OpenCV + Pillow findings.

    For RAW camera files: converts to JPEG internally via rawpy.
    The converted JPEG base64 is returned as `converted_jpeg_base64` for use
    by the Next.js caller when sending the image to Claude.
    """
    # Detect RAW input and convert to JPEG for image-analysis services
    jpeg_base64 = request.image_base64
    converted_jpeg: str | None = None

    if is_raw_file(request.file_name):
        converted = convert_raw_to_jpeg_base64(request.image_base64, request.file_name)
        if converted:
            jpeg_base64 = converted
            converted_jpeg = converted

    # ExifTool runs on the original bytes (reads RAW metadata natively)
    exif_findings = analyze_exif(request.image_base64, request.file_type)

    # OpenCV and Pillow run on JPEG (either original or converted from RAW)
    opencv_findings = analyze_image(jpeg_base64)
    pillow_findings = analyze_file(jpeg_base64, 'image/jpeg' if converted_jpeg else request.file_type)

    # Derive technical floor scores for LV Authenticity Index
    # These are the minimum scores Claude cannot override downward
    technical_provenance_floor = exif_findings.provenance_score
    technical_integrity_floor = max(
        exif_findings.integrity_score,
        pillow_findings.integrity_score
    )
    technical_manipulation_floor = opencv_findings.manipulation_score

    return TechnicalFindings(
        exiftool=exif_findings,
        opencv=opencv_findings,
        pillow=pillow_findings,
        technical_provenance_floor=technical_provenance_floor,
        technical_integrity_floor=technical_integrity_floor,
        technical_manipulation_floor=technical_manipulation_floor,
        converted_jpeg_base64=converted_jpeg,
    )
