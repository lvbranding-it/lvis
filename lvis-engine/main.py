from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import analyze, health
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="LVIS Forensic Engine",
    description="Technical forensic image analysis: ExifTool + OpenCV + Pillow",
    version="1.0.0",
    docs_url="/docs" if os.getenv("ENVIRONMENT", "development") != "production" else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(analyze.router)
