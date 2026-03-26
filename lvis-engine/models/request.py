from pydantic import BaseModel, Field
from typing import Optional


class AnalyzeRequest(BaseModel):
    image_base64: str = Field(..., description="Base64-encoded image data")
    file_name: str
    file_type: str
    case_purpose: Optional[str] = None
