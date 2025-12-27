FROM python:3.10-slim

WORKDIR /app

# First, install all dependencies as the root user
RUN pip install uv
COPY pyproject.toml .
RUN uv pip compile pyproject.toml -o requirements.txt
RUN uv pip install --system --no-cache -r requirements.txt

# Now, copy the application code
COPY ./app /app/app
COPY ./templates /app/templates

# Create a non-root user and switch to it for runtime
RUN useradd -m -u 1000 user
USER user

ENV PYTHONPATH=/app

CMD ["python", "app/server.py"]