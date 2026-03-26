FROM python:3.11-slim

# Install system dependencies
# libimage-exiftool-perl  → ExifTool binary (added to PATH automatically)
# libraw-dev              → LibRaw C library required by rawpy (RAW camera format conversion)
# libgl1-mesa-glx         → OpenCV runtime dependency
# libglib2.0-0            → GLib runtime (OpenCV/GTK)
RUN apt-get update && apt-get install -y \
    libimage-exiftool-perl \
    libraw-dev \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
