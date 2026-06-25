FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir gunicorn "uvicorn[standard]"

COPY . .

RUN mkdir -p media/products media/thumbs

# Run the application
CMD ["gunicorn", "server:app", "-k", "uvicorn.workers.UvicornWorker", "-w", "4", "-b", "0.0.0.0:8001", "--timeout", "90"]
