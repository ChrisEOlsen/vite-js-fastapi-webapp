FROM python:3.10-slim

# 1. Install 'uv'
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Set the working directory for the application
WORKDIR /workspace/backend
ENV PYTHONPATH "${PYTHONPATH}:/workspace/backend"

# 2. Copy dependency files and install
COPY pyproject.toml .
RUN uv pip compile pyproject.toml -o requirements.txt && \
    uv pip install --system --no-cache -r requirements.txt

# 3. Create a non-root user
ARG UID=1000
ARG GID=1000
RUN groupadd --gid $GID user && \
    useradd --uid $UID --gid $GID -m user

# 4. Copy all application files
# Note: This COPY is relative to the build context (./backend)
COPY --chown=user:user ./app ./app
COPY --chown=user:user ./alembic ./alembic
COPY --chown=user:user ./alembic.ini .

# 5. Switch to the non-root user
USER user

EXPOSE 80

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "80", "--reload"]
