# Vite.js + FastAPI Web Application Template

This is a template repository for building full-stack web applications with a Vite.js (React) frontend and a FastAPI backend.

## Project Structure

*   **`backend/`**: FastAPI backend service.
*   **`frontend/`**: Vite.js (React) frontend application.
*   **`postgres_data/`**: Docker volume for PostgreSQL data.

## Getting Started

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd vite-js-fastapi-webapp
    ```

2.  **Environment Variables:**

    Create a `.env` file in the project root based on `.env.example` (if provided) and fill in your database credentials and other necessary environment variables.

    ```bash
    cp .env.example .env
    # Edit .env with your settings
    ```

3.  **Build and Run with Docker Compose:**

    ```bash
    docker compose up --build -d
    ```

    This will:

    *   Build the `backend` and `frontend` Docker images.
    *   Start the PostgreSQL database service.
    *   Start the FastAPI backend service.
    *   Start the Vite.js frontend development server.

4.  **Access the Application:**

    *   Frontend: `http://localhost:3000` (or whatever port you configured)
    *   Backend API Docs: `http://localhost:80/docs` (or whatever port you configured)

## Database Migrations (Alembic)

Migrations are managed by Alembic within the `backend` service. After making changes to your SQLAlchemy models, you can generate and apply migrations using the integrated MCP CLI:

*   **Generate a new migration:**

    ```bash
    docker compose run --rm backend python -m app.cli apply-migrations --message "Your descriptive message"
    ```

*   **Upgrade the database to the latest revision:**

    ```bash
    docker compose run --rm backend python -m app.cli apply-migrations
    ```

## Gemini CLI Configuration for MCP Tools

To use the MCP tools (e.g., `create-resource`, `apply-migrations`) via the Gemini CLI, update your `settings.json` file with the following `default_api` entry. This configuration runs commands within the `backend` service container, which now hosts the MCP CLI.

**`settings.json` Entry:**

```json
"default_api": {
  "command": "docker",
  "args": [
    "compose",
    "run",
    "--rm",
    "--user",
    "$(id -u):$(id -g)",
    "backend",
    "python",
    "-m",
    "app.cli"
  ]
}
```

**How to Use:**

Once configured, you can call the MCP commands directly from the Gemini CLI.

*   **To create a new resource (e.g., 'task' with 'description' and 'is_completed' fields):**
    ```bash
    create-resource task "description:string:true" "is_completed:boolean:false"
    ```
*   **To apply database migrations:**
    ```bash
    apply-migrations --message "A descriptive migration message"
    ```

**Important Notes:**

*   The `--user root` flag is necessary for `create-resource` to write files into the `frontend/src` directory, as the `backend` container's default user typically doesn't have cross-service write permissions.
*   Ensure your `docker compose` services (especially `postgres` and `backend`) are running before attempting to use commands like `apply-migrations`.
