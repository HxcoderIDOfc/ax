# Axynera Vision

Vision API ringan untuk Axynera AI, ditujukan untuk Google Cloud Run CPU-only.

## Fitur V1

- Deteksi objek umum memakai YOLO11n
- Deteksi dan hitung `person`
- Confidence score
- Bounding box tiap objek
- Endpoint health check
- Maksimum upload default 10 MB
- Siap dijalankan di Cloud Run 2 vCPU + 4 GiB
- Scale-to-zero (`minScale: 0`)

## Endpoint

### `GET /health`

```json
{
  "ok": true,
  "model": "yolo11n.pt"
}
```

### `POST /v1/detect`

Upload gambar sebagai multipart field bernama `file`.

```bash
curl -X POST "https://YOUR-CLOUD-RUN-URL/v1/detect" \
  -F "file=@photo.jpg"
```

Contoh response:

```json
{
  "ok": true,
  "image": {
    "filename": "photo.jpg",
    "width": 1280,
    "height": 720
  },
  "summary": {
    "objects": 3,
    "persons": 1
  },
  "detections": [
    {
      "label": "person",
      "confidence": 0.9721,
      "box": {
        "x1": 120.4,
        "y1": 44.2,
        "x2": 560.9,
        "y2": 710.1,
        "width": 440.5,
        "height": 665.9
      }
    }
  ],
  "inference_ms": 418.22,
  "model": "yolo11n.pt"
}
```

## Jalankan lokal

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8080
```

Lalu buka `http://localhost:8080/docs` untuk Swagger UI.

## Docker

```bash
docker build -t axynera-vision .
docker run --rm -p 8080:8080 axynera-vision
```

## Deploy Cloud Run

```bash
gcloud run deploy axynera-vision \
  --source . \
  --region asia-southeast2 \
  --cpu 2 \
  --memory 4Gi \
  --concurrency 2 \
  --min 0 \
  --max 2 \
  --timeout 60 \
  --allow-unauthenticated
```

Atau build image terlebih dahulu lalu ganti `IMAGE_URL` pada `service.yaml`.

## Environment

| Variable | Default | Fungsi |
|---|---|---|
| `VISION_MODEL` | `yolo11n.pt` | Model Ultralytics |
| `VISION_CONF` | `0.25` | Minimum confidence |
| `MAX_IMAGE_BYTES` | `10485760` | Batas upload gambar |

## Rencana V2

- OCR untuk screenshot error/kode
- UI/layout parser
- Scene classification
- Image hash cache
- API key/rate limit
- Output context ringkas khusus untuk Nera

> YOLO object detection dapat mengetahui bahwa ada orang/objek dan posisinya, tetapi belum memahami cerita kompleks pada gambar seperti VLM besar. Nera dapat melakukan reasoning dari hasil terstruktur ini.
