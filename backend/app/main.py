import os
import uuid
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, HTTPException, status
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from rembg import new_session, remove

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("bglyt-backend")

session = None
OUTPUTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "outputs")
os.makedirs(OUTPUTS_DIR, exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    global session
    logger.info("Initializing rembg session...")
    try:
        session = new_session("u2net")
        logger.info("Rembg session initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize rembg session: {e}")
        raise RuntimeError(f"Failed to load rembg session: {e}")
    yield
    logger.info("Shutting down backend services.")

app = FastAPI(
    title="BGlyt Background Removal API",
    description="FastAPI service utilizing WithoutBG to remove background from images.",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_FILE_SIZE = 15 * 1024 * 1024
ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp"
}

@app.post("/api/remove-background")
async def remove_background(file: UploadFile = File(...)):
    global session
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Background removal engine is not initialized yet. Please try again shortly."
        )

    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type '{file.content_type}'. Only JPEG, PNG, and WEBP are supported."
        )

    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large ({(file_size / 1024 / 1024):.2f}MB). Maximum allowed size is 10MB."
        )

    file_ext = os.path.splitext(file.filename or "")[1] or ".jpg"
    temp_input_filename = f"in_{uuid.uuid4().hex}{file_ext}"
    temp_input_path = os.path.join(OUTPUTS_DIR, temp_input_filename)

    output_filename = f"out_{uuid.uuid4().hex}.png"
    output_path = os.path.join(OUTPUTS_DIR, output_filename)

    os.makedirs(OUTPUTS_DIR, exist_ok=True)

    try:
        with open(temp_input_path, "wb") as buffer:
            while chunk := await file.read(1024 * 1024):
                buffer.write(chunk)

        logger.info(f"Processing background removal for file: {file.filename}")
        from PIL import Image
        input_image = Image.open(temp_input_path)
        result = remove(input_image, session=session)
        result = result.convert("RGBA")
        white_bg = Image.new("RGBA", result.size, (255, 255, 255, 0))
        white_bg.paste(result, (0, 0), result)
        white_bg.save(output_path, "PNG")
        logger.info(f"Background removal success. Output saved to {output_path}")

        import base64
        with open(output_path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode("utf-8")

        return {
            "success": True,
            "image": f"data:image/png;base64,{encoded_string}"
        }

    except Exception as e:
        logger.error(f"Error during background removal: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Background removal processing failed: {str(e)}"
        )

    finally:
        for p in (temp_input_path, output_path):
            if os.path.exists(p):
                try:
                    os.remove(p)
                except Exception as cleanup_err:
                    logger.error(f"Failed to remove temporary file {p}: {cleanup_err}")

@app.get("/api/health")
async def health():
    return {
        "status": "healthy",
        "engine_ready": session is not None
    }
