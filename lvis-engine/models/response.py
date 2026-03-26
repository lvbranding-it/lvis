from pydantic import BaseModel, Field
from typing import Optional, List
from dataclasses import dataclass


class ExifToolFindings(BaseModel):
    provenance_score: float = Field(ge=0, le=100)
    integrity_score: float = Field(ge=0, le=100)
    flags: List[str] = []
    raw: dict = {}


class OpenCVFindings(BaseModel):
    manipulation_score: float = Field(ge=0, le=100)
    ela_score: float = Field(ge=0, le=100)
    ela_map_base64: Optional[str] = None
    noise_uniformity_score: float = Field(ge=0, le=100)
    clone_score: float = Field(ge=0, le=100)
    flagged_regions: List[dict] = []


class PillowFindings(BaseModel):
    integrity_score: float = Field(ge=0, le=100)
    integrity_flags: List[str] = []


class TechnicalFindings(BaseModel):
    exiftool: ExifToolFindings
    opencv: OpenCVFindings
    pillow: PillowFindings
    # Derived technical floor scores for LV Authenticity Index
    technical_provenance_floor: float
    technical_integrity_floor: float
    technical_manipulation_floor: float
    # Present only when input was a RAW camera file — JPEG for use with Claude
    converted_jpeg_base64: Optional[str] = None
