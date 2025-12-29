```text
  ______                   ____                                
 |  ____|                 |  _ \                               
 | |__   __ _ ___ _   _   | |_) |_ __ ___  ___ _____________   
 |  __| / _` / __| | | |  |  _ <| '__/ _ \/ _ \_  /_  / | | |  
 | |___| (_| \__ \ |_| |  | |_) | | |  __/  __// / / /| |_| |  
 |______\__,_|___/\__, |  |____/|_|  \___|\___/___/___|\__, |  
                   __/ |                                __/ |  
                  |___/                                |___/   
```

# FastAPI + Next.js Fullstack Template (MCP Enabled)

**The AI-Native Web Starter.**

This project is a production-ready template designed to bridge the gap between modern web development and AI agents. By integrating the Model Context Protocol (MCP) directly into the backend, it empowers your AI assistant to understand, scaffold, and manage your application's infrastructure in real-time, making development truly "Easy Breezy".

## 🚀 Features

*   **Backend:** FastAPI, SQLAlchemy (Async), PostgreSQL, Alembic.
*   **Frontend:** Next.js 15, Tailwind CSS 4, Framer Motion.
*   **AI Integration:** Built-in MCP server for agent-driven development.
*   **DevOps:** Docker Compose, Traefik-ready.

## 🛠️ Project Structure

*   **`backend/`**: Python FastAPI application (contains the `mcp_server.py`).
*   **`frontend/`**: Next.js 15 application.
*   **`postgres_data/`**: Persistent database storage.

## 🏁 Getting Started

### Prerequisites

*   Docker & Docker Compose
*   Git
*   An external Docker network named `proxy` (run `docker network create proxy`).

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/ChrisEOlsen/mcp-fullstack-template.git
    cd mcp-fullstack-template
    ```

2.  **Configure Environment:**

    Create a `.env` file in the root directory (copy `.env.example` if available or use the snippet below):

    ```env
    UID=1000
    GID=1000
    APP_NAME=myapp
    DOMAIN=myapp.localhost
    API_PREFIX=/api/v1
    DB_USER=postgres
    DB_PASSWORD=secret
    EXPECTED_HMAC_SECRET=supersecretkey
    BACKEND_URL=http://backend:80
    ```

3.  **Build and Run:**

    ```bash
    docker compose up --build -d
    ```

    *   Frontend: `http://localhost:5173`
    *   Backend: `http://localhost/docs`

## 🤖 MCP Tools Integration

To enable your AI agent to control this project, register the included MCP server in your client configuration (e.g., `settings.json` for Gemini CLI):

```json
"default_api": {
  "command": "docker",
  "args": [
    "exec",
    "-i",
    "backend",
    "python",
    "-m",
    "app.mcp_server" 
  ]
}
```

## 📜 License

[MIT](LICENSE)
