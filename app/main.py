import io
import os
import time
from typing import Any

from fastapi import FastAPI, File, HTTPException, UploadFile
from PIL import Image
from ultralytics import YOLO

APP_NAME = "Axynera Vision"
MODEL_NAME = os.getenv("VISION_MODEL", "yolo11n.pt")
MAX_IMAGE_BYTES = int(os.getenv("MAX_IMAGE_BYTES", str(10 * 1024 * 1024)))
CONFIDENCE = float(os.getenv("VISION_CONF", "0.25"))

app = FastAPI(title=APP_NAME, version="0.1.0")
model = YOLO(MODEL_NAME)


@app.get("/")
def root() -> dict[str, Any]:
    return {
        "ok": True,
        "name": APP_NAME,
        "version": "0.1.0",
        "endpoints": ["GET /health", "POST /v1/detect"],
    }


@app.get("/health")
def health() -> dict[str, Any]:
    return {"ok": True, "model": MODEL_NAME}


@app.post("/v1/detect")
async def detect(file: UploadFile = File(...)) -> dict[str, Any]:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=415, detail="file_must_be_an_image")

    raw = await file.read(MAX_IMAGE_BYTES + 1)
    if len(raw) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="image_too_large")

    try:
        image = Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception as exc:
        raise HTTPException(status_code=400, detail="invalid_image") from exc

    started = time.perf_counter()
    results = model.predict(image, conf=CONFIDENCE, verbose=False)
    elapsed_ms = round((time.perf_counter() - started) * 1000, 2)

    detections: list[dict[str, Any]] = []
    person_count = 0

    for result in results:
        names = result.names
        if result.boxes is None:
            continue

        for box in result.boxes:
            class_id = int(box.cls[0].item())
            label = str(names[class_id])
            confidence = round(float(box.conf[0].item()), 4)
            x1, y1, x2, y2 = [round(float(v), 2) for v in box.xyxy[0].tolist()]

            if label == "person":
                person_count += 1

            detections.append(
                {
                    "label": label,
                    "confidence": confidence,
                    "box": {
                        "x1": x1,
                        "y1": y1,
                        "x2": x2,
                        "y2": y2,
                        "width": round(x2 - x1, 2),
                        "height": round(y2 - y1, 2),
                    },
                }
            )

    detections.sort(key=lambda item: item["confidence"], reverse=True)

    return {
        "ok": True,
        "image": {
            "filename": file.filename,
            "width": image.width,
            "height": image.height,
        },
        "summary": {
            "objects": len(detections),
            "persons": person_count,
        },
        "detections": detections,
        "inference_ms": elapsed_ms,
        "model": MODEL_NAME,
    }
