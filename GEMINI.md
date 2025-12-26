# Gemini Workflow: Full-Stack Resource Addition Guide (FastAPI + Next.js)

This document outlines the complete, step-by-step recipe for adding a new API resource to this application. Following this pattern ensures consistency, maintainability, and scalability.

The instructions are written for an LLM agent.

**Objective**: Add a new resource named "Widget".

---

## Part 1: Backend (FastAPI) - 5 Steps

**Summary**: Create the database model, data schemas, CRUD operations, API endpoints, and register the new API router.

### Step 1: Create the Database Model

1.  **Action**: Create a new file named `widget.py` in the `backend/app/models/` directory.
2.  **Content**: Define the SQLAlchemy model for the `widgets` table.

    ```python
    # /backend/app/models/widget.py
    from sqlalchemy import Column, String, Integer, Text
    from .user import Base # Assumes Base is in a shared location

    class Widget(Base):
        __tablename__ = "widgets"
        id = Column(Integer, primary_key=True, index=True)
        name = Column(String, index=True, nullable=False)
        description = Column(Text, nullable=True)
    ```
3.  **Action**: Open `backend/app/models/__init__.py` and import the new `Widget` model to ensure it's discoverable by Alembic and the startup table creation logic.

### Step 2: Define the Pydantic Schemas

1.  **Action**: Create a new file named `widget.py` in the `backend/app/db/schemas/` directory.
2.  **Content**: Define the Pydantic schemas for data validation and serialization.

    ```python
    # /backend/app/db/schemas/widget.py
    from pydantic import BaseModel
    from typing import Optional

    class WidgetBase(BaseModel):
        name: str
        description: Optional[str] = None

    class WidgetCreate(WidgetBase):
        pass

    class WidgetUpdate(WidgetBase):
        pass

    class WidgetInDBBase(WidgetBase):
        id: int
        class Config:
            from_attributes = True

    class Widget(WidgetInDBBase):
        pass
    ```

### Step 3: Create the CRUD Logic

1.  **Action**: Create a new file named `crud_widget.py` in the `backend/app/crud/` directory.
2.  **Content**: Define the CRUD class for the `Widget` model using the generic `CRUDBase`.

    ```python
    # /backend/app/crud/crud_widget.py
    from app.db.base import CRUDBase
    from app.models.widget import Widget
    from app.db.schemas.widget import WidgetCreate, WidgetUpdate

    class CRUDWidget(CRUDBase[Widget, WidgetCreate, WidgetUpdate]):
        pass

    widget = CRUDWidget(Widget)
    ```

### Step 4: Create the API Endpoint (Router)

1.  **Action**: Create a new file named `widget.py` in the `backend/app/api/v1/endpoints/` directory.
2.  **Content**: Define the FastAPI router and its HTTP endpoints.

    ```python
    # /backend/app/api/v1/endpoints/widget.py
    from fastapi import APIRouter, Depends, HTTPException
    from sqlalchemy.ext.asyncio import AsyncSession
    from typing import List

    from app.crud.crud_widget import widget as crud_widget
    from app.db import connections
    from app.db.schemas.widget import Widget, WidgetCreate, WidgetUpdate

    router = APIRouter()

    @router.post("/", response_model=Widget)
    async def create_widget(widget_in: WidgetCreate, db: AsyncSession = Depends(connections.get_db)):
        return await crud_widget.create(db, obj_in=widget_in)

    @router.get("/", response_model=List[Widget])
    async def read_widgets(db: AsyncSession = Depends(connections.get_db), skip: int = 0, limit: int = 100):
        return await crud_widget.get_multi(db, skip=skip, limit=limit)
    
    # ... Implement other endpoints (GET by ID, PUT, DELETE) ...
    ```

### Step 5: Include the New Router

1.  **Action**: Open `backend/app/api/v1/routers.py`.
2.  **Modification**: Import the new widget router and include it in the main `api_router`.

    ```python
    # /backend/app/api/v1/routers.py
    from fastapi import APIRouter
    from app.api.v1.endpoints import users, widget # 1. Import

    api_router = APIRouter()
    api_router.include_router(users.router, prefix="/users", tags=["Users"])
    api_router.include_router(widget.router, prefix="/widgets", tags=["Widgets"]) # 2. Include
    ```

---

## Part 2: Frontend (Next.js) - 3 Steps

**Summary**: Create the API service, build the page component, and add the new page to the site's navigation.

### Step 1: Create the API Service

1.  **Action**: Create a new file named `widgets.js` in the `frontend/src/services/api/` directory.
2.  **Content**: Define functions to make requests to the backend API. The URLs should be relative paths to leverage the Next.js proxy.

    ```javascript
    // /frontend/src/services/api/widgets.js
    
    export const fetchWidgets = async () => {
        try {
            const response = await fetch(`/api/v1/widgets/`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error("Failed to fetch widgets:", error);
            return [];
        }
    };
    
    // ... Implement createWidget, updateWidget, etc. ...
    ```

### Step 2: Create the Page Component

1.  **Action**: Create a new directory named `widgets` inside `frontend/src/app/`.
2.  **Action**: Inside the new `widgets` directory, create a file named `page.js`.
3.  **Content**: Create the React component for the page. Use the `'use client'` directive to allow for state and user interaction.

    ```javascript
    // /frontend/src/app/widgets/page.js
    'use client';
    
    import { useState } from 'react';
    import { fetchWidgets } from '@/services/api/widgets'; // Assuming '@' alias is configured for src
    
    export default function WidgetsPage() {
        const [widgets, setWidgets] = useState([]);
        const [loading, setLoading] = useState(false);
    
        const handleFetch = async () => {
            setLoading(true);
            const data = await fetchWidgets();
            setWidgets(data);
            setLoading(false);
        };
    
        return (
            <div className="p-8">
                <h1 className="text-4xl font-bold mb-4">Manage Widgets</h1>
                <button onClick={handleFetch} disabled={loading}>
                    {loading ? 'Loading...' : 'Fetch Widgets'}
                </button>
                <pre>{JSON.stringify(widgets, null, 2)}</pre>
            </div>
        );
    }
    ```

### Step 3: Add Navigation

1.  **Action**: Open the shared Header component (e.g., `frontend/src/components/Header.js`).
2.  **Modification**: Add a Next.js `<Link>` component to the navigation so users can access the new page.

    ```jsx
    import Link from 'next/link';

    // ... inside the Header component's return statement ...
    <nav>
        <Link href="/">Home</Link>
        <Link href="/about">About</Link>
        <Link href="/widgets">Widgets</Link> {/* <-- Add this link */}
    </nav>
    ```