import os
import docker
from mcp.server.fastmcp import FastMCP
from jinja2 import Environment, FileSystemLoader
from typing import List, Literal
from pydantic import BaseModel

# Initialize FastMCP
mcp = FastMCP("My Custom MCP Server")

# --- Configuration ---
templates_env = Environment(loader=FileSystemLoader("/app/templates"))
WORKSPACE_DIR = "/workspace"

# --- Helper Functions ---
def to_pascal_case(snake_case: str) -> str:
    return "".join(word.capitalize() for word in snake_case.split('_'))

def to_plural(snake_case: str) -> str:
    if snake_case.endswith('s'):
        return snake_case + 'es'
    return snake_case + 's'

def type_to_sqlalchemy(field_type: str) -> str:
    mapping = {
        "string": "String", "text": "Text", "integer": "Integer",
        "float": "Float", "boolean": "Boolean", "date": "Date",
        "datetime": "DateTime", "uuid": "Uuid"
    }
    return mapping.get(field_type, "String")

def type_to_pydantic(field_type: str) -> str:
    mapping = {
        "string": "str", "text": "str", "integer": "int",
        "float": "float", "boolean": "bool", "date": "date",
        "datetime": "datetime", "uuid": "UUID"
    }
    return mapping.get(field_type, "str")

def append_to_file(file_path: str, content: str):
    full_path = os.path.join(WORKSPACE_DIR, file_path)
    if os.path.exists(full_path):
        with open(full_path, "a") as f:
            f.write(content)
        # Permissions are now handled by Docker user configuration, no need for os.chmod here.

# --- Define Tools ---

class FieldDefinition(BaseModel):
    name: str
    type: Literal["string", "text", "integer", "float", "boolean", "date", "datetime", "uuid"]
    required: bool = True

@mcp.tool()
def create_resource(resource_name: str, fields: List[FieldDefinition], is_admin_resource: bool = False):
    """
    Scaffolds a new resource (backend models, schemas, crud, endpoints, and frontend pages).
    Args:
        resource_name: The singular snake_case name (e.g., 'product_item').
        fields: A list of field definitions for the resource.
        is_admin_resource: If true, the frontend API handlers will include admin authentication checks.
    """
    ctx = {
        "resource_name_snake": resource_name,
        "resource_name_pascal": to_pascal_case(resource_name),
        "resource_name_plural_snake": to_plural(resource_name),
        "resource_name_plural_pascal": to_pascal_case(to_plural(resource_name)),
        "fields": fields,
        "is_admin_resource": is_admin_resource
    }

    base_paths = {
        "backend": os.path.join(WORKSPACE_DIR, "backend/app"),
        "frontend": os.path.join(WORKSPACE_DIR, "frontend/src")
    }

    files_to_generate = {
        "backend/model.py.j2": os.path.join(base_paths["backend"], f"models/{ctx['resource_name_snake']}.py"),
        "backend/schema.py.j2": os.path.join(base_paths["backend"], f"db/schemas/{ctx['resource_name_snake']}.py"),
        "backend/crud.py.j2": os.path.join(base_paths["backend"], f"crud/crud_{ctx['resource_name_snake']}.py"),
        "backend/endpoint.py.j2": os.path.join(base_paths["backend"], f"api/v1/endpoints/{ctx['resource_name_plural_snake']}.py"),
        "frontend/page.js.j2": os.path.join(base_paths["frontend"], f"pages/{ctx['resource_name_plural_snake']}.js"),
    }
    
    generated_list = []

    # Generate frontend API handler directory
    frontend_api_dir = os.path.join(base_paths["frontend"], f"pages/api/{ctx['resource_name_plural_snake']}")
    os.makedirs(frontend_api_dir, exist_ok=True)

    auth_import = "import { isAdmin, isAuthenticated } from \"@/lib/auth\";\n\n" if is_admin_resource else "import { isAuthenticated } from \"@/lib/auth\";\n\n"
    auth_check_admin = f"""
    if (!await isAdmin(req)) {{
        return res.status(403).json({{ error: \"Forbidden: Admin access required.\" }});
    }}

""" if is_admin_resource else ""

    auth_check_user = f"""
    if (!await isAuthenticated(req)) {{
        return res.status(401).json({{ error: \"Unauthorized: Login required.\" }});
    }}

""" if not is_admin_resource else ""

    # Generate index.js for GET all and POST create
    frontend_index_handler_path = os.path.join(frontend_api_dir, "index.js")
    frontend_index_handler_content = f"""
// frontend/src/pages/api/{ctx['resource_name_plural_snake']}/index.js
import {{ signedFetch }} from "@/lib/signedFetch";
{auth_import}
export default async function handler(req, res) {{
{auth_check_admin}
{auth_check_user}
  if (req.method === 'GET') {{
    return handleGet(req, res);
  }}

  if (req.method === 'POST') {{
    return handlePost(req, res);
  }}

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end(`Method ${{req.method}} Not Allowed`);
}}

async function handleGet(req, res) {{
  try {{
    const backendResponse = await signedFetch("/{ctx['resource_name_plural_snake']}");
    const data = await backendResponse.json();
    if (!backendResponse.ok) {{
      return res.status(backendResponse.status).json({{ error: data.detail || 'Failed to fetch {ctx['resource_name_plural_snake']} data' }});
    }}
    return res.status(200).json(data);
  }} catch (err) {{
    console.error("Error fetching {ctx['resource_name_plural_snake']}:", err);
    return res.status(500).json({{ error: "Internal Server Error" }});
  }}
}}

async function handlePost(req, res) {{
  try {{
    const backendResponse = await signedFetch("/{ctx['resource_name_plural_snake']}", {{
      method: 'POST',
      body: JSON.stringify(req.body),
    }});
    const data = await backendResponse.json();
    if (!backendResponse.ok) {{
      return res.status(backendResponse.status).json({{ error: data.detail || 'Failed to create {ctx['resource_name_plural_snake']}' }});
    }}
    return res.status(201).json(data);
  }} catch (err) {{
    console.error("Error creating {ctx['resource_name_plural_snake']}:", err);
    return res.status(500).json({{ error: "Internal Server Error" }});
  }}
}}
"""
    with open(frontend_index_handler_path, "w") as f:
        f.write(frontend_index_handler_content)
    # Removed os.chmod for permissions as it's handled by Docker user configuration.
    generated_list.append(frontend_index_handler_path)

    # Generate [id].js for GET by ID, PUT update, DELETE
    frontend_id_handler_path = os.path.join(frontend_api_dir, f"[{ctx['resource_name_snake']}Id].js")
    frontend_id_handler_content = f"""
// frontend/src/pages/api/{ctx['resource_name_plural_snake']}/[{ctx['resource_name_snake']}Id].js
import {{ signedFetch }} from "@/lib/signedFetch";
{auth_import}
export default async function handler(req, res) {{
{auth_check_admin}
{auth_check_user}
  const {{ {ctx['resource_name_snake']}Id }} = req.query;

  if (req.method === 'GET') {{
    return handleGet(req, res, {ctx['resource_name_snake']}Id);
  }}

  if (req.method === 'PUT') {{
    return handlePut(req, res, {ctx['resource_name_snake']}Id);
  }}

  if (req.method === 'DELETE') {{
    return handleDelete(req, res, {ctx['resource_name_snake']}Id);
  }}

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  return res.status(405).end(`Method ${{req.method}} Not Allowed`);
}}

async function handleGet(req, res, {ctx['resource_name_snake']}Id) {{
  try {{
    const backendResponse = await signedFetch(f"/{ctx['resource_name_plural_snake']}/${{
      {ctx['resource_name_snake']}Id
    }}");
    const data = await backendResponse.json();
    if (!backendResponse.ok) {{
      return res.status(backendResponse.status).json({{ error: data.detail || 'Failed to fetch {ctx['resource_name_snake']}' }});
    }}
    return res.status(200).json(data);
  }} catch (err) {{
    console.error(f"Error fetching {ctx['resource_name_snake']} {{ {ctx['resource_name_snake']}Id }}:", err);
    return res.status(500).json({{ error: "Internal Server Error" }});
  }}
}}

async function handlePut(req, res, {ctx['resource_name_snake']}Id) {{
  try {{
    const backendResponse = await signedFetch(f"/{ctx['resource_name_plural_snake']}/${{
      {ctx['resource_name_snake']}Id
    }}", {{
      method: 'PUT',
      body: JSON.stringify(req.body),
    }});
    const data = await backendResponse.json();
    if (!backendResponse.ok) {{
      return res.status(backendResponse.status).json({{ error: data.detail || 'Failed to update {ctx['resource_name_snake']}' }});
    }}
    return res.status(200).json(data);
  }} catch (err) {{
    console.error(f"Error updating {ctx['resource_name_snake']} {{ {ctx['resource_name_snake']}Id }}:", err);
    return res.status(500).json({{ error: "Internal Server Error" }});
  }}
}}

async function handleDelete(req, res, {ctx['resource_name_snake']}Id) {{
  try {{
    const backendResponse = await signedFetch(f"/{ctx['resource_name_plural_snake']}/${{
      {ctx['resource_name_snake']}Id
    }}", {{
      method: 'DELETE',
    }});
    if (!backendResponse.ok) {{
      const data = await backendResponse.json().catch(() => ({{}}));
      return res.status(backendResponse.status).json({{ error: data.detail || 'Failed to delete {ctx['resource_name_snake']}' }});
    }}
    return res.status(204).end();
  }} catch (err) {{
    console.error(f"Error deleting {ctx['resource_name_snake']} {{ {ctx['resource_name_snake']}Id }}:", err);
    return res.status(500).json({{ error: "Internal Server Error" }});
  }}
}}
"""
    with open(frontend_id_handler_path, "w") as f:
        f.write(frontend_id_handler_content)
    # Removed os.chmod for permissions as it's handled by Docker user configuration.
    generated_list.append(frontend_id_handler_path)

    
    for template_name, output_path in files_to_generate.items():
        template = templates_env.get_template(template_name)
        
        rendered_content = ""
        # Handle indentations for model and schema
        if "model.py.j2" in template_name:
            # FIX 1: Indentation (remove leading spaces in f-string)
            field_lines = [f"{f.name} = Column({type_to_sqlalchemy(f.type)}, nullable={not f.required})" for f in fields]
            replacement = ("\n    ").join(field_lines)
            rendered_content = template.render(ctx).replace("# --- The MCP will add fields here ---", replacement)
            
            # FIX 2: Add missing imports (Boolean, Float, etc.) so backend doesn't crash
            rendered_content = rendered_content.replace(
                "from sqlalchemy import Column, String, Integer, Text",
                "from sqlalchemy import Column, String, Integer, Text, Boolean, Float, Date, DateTime, Uuid"
            )

        elif "schema.py.j2" in template_name:
            field_lines = [f"{f.name}: {type_to_pydantic(f.type)}{' | None' if not f.required else ''}" for f in fields]
            replacement = ("\n    ").join(field_lines)
            rendered_content = template.render(ctx).replace("# --- The MCP will add fields here ---", replacement)
        else:
            rendered_content = template.render(ctx)

        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, "w") as f:
            f.write(rendered_content)
        
        # Removed os.chmod for permissions as it's handled by Docker user configuration.
        generated_list.append(output_path)

    # Modify existing files
    append_to_file("backend/app/models/__init__.py", f"\nfrom .{ctx['resource_name_snake']} import {ctx['resource_name_pascal']}")
    append_to_file("backend/app/api/v1/routers.py", f"\napi_router.include_router({ctx['resource_name_plural_snake']}.router, prefix='/{ctx['resource_name_plural_snake']}', tags=['{ctx['resource_name_pascal']}'])")

    return f"Created resource {resource_name}. Generated files: {generated_list}"

@mcp.tool()
def add_middleware_route(route_path: str, route_type: Literal["auth_required", "admin"]):
    """
    Adds a new route path to either the AUTH_REQUIRED_ROUTES or ADMIN_ROUTES
    array in frontend/src/middleware.js.
    Args:
        route_path: The path to add (e.g., "/api/my_data" or "/admin/page").
        route_type: The type of route to add ("auth_required" or "admin").
    """
    middleware_file_path = os.path.join(WORKSPACE_DIR, "frontend/src/middleware.js")
    
    with open(middleware_file_path, "r") as f:
        content = f.read()

    target_array_name = "AUTH_REQUIRED_ROUTES" if route_type == "auth_required" else "ADMIN_ROUTES"
    insertion_point_comment = f"// --- MCP will insert {target_array_name} here ---"
    
    # Find the line number of the comment
    lines = content.splitlines()
    for i, line in enumerate(lines):
        if insertion_point_comment in line:
            # Insert the new route after the comment and before the array definition
            for j in range(i + 1, len(lines)):
                if f"const {target_array_name} = [" in lines[j]:
                    array_line_index = j
                    # Insert the new route into the array
                    new_route_entry = f"  \"{route_path}\","
                    
                    # If the array is empty, replace `[]` with `[  \"/path\"]`
                    if lines[array_line_index].strip().endswith("[]"):
                        lines[array_line_index] = lines[array_line_index].replace("[]", f"[\n{new_route_entry}\n]")
                    else: # If not empty, insert before the closing bracket
                        # Find the last element in the array to insert after it, or before `]`
                        k = array_line_index + 1
                        while k < len(lines) and not lines[k].strip().startswith(']'):
                            k += 1
                        lines.insert(k, new_route_entry)
                    break
            break

    updated_content = "\n".join(lines)
    with open(middleware_file_path, "w") as f:
        f.write(updated_content)
    
    # Permissions are now handled by Docker user configuration.

    return f"Added route \'{route_path}\' to {target_array_name} in frontend/src/middleware.js"


@mcp.tool()
def create_frontend_component(component_name: str, path: str, prompt: str):
    """
    Creates a new React frontend component based on a prompt.
    Args:
        component_name: PascalCase name (e.g. 'UserProfile').
        path: Relative path from frontend/src/components.
        prompt: Description of what the component should do.
    """
    ctx = {"resource_name_pascal": component_name, "prompt": prompt}
    template = templates_env.get_template("frontend/component.js.j2")
    rendered_content = template.render(ctx)

    output_path = os.path.join(WORKSPACE_DIR, "frontend/src/components", path, f"{component_name}.js")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w") as f:
        f.write(rendered_content)
    
    # Permissions are now handled by Docker user configuration.

    return f"Component {component_name} created at {output_path}"

@mcp.tool()
def apply_migrations(message: str = "Applied migrations via MCP"):
    """
    Runs database migrations (Alembic) inside the backend container.
    """
    client = docker.from_env()
    try:
        backend = client.containers.get("backend")
        
        exit_code, output = backend.exec_run(
            ["alembic", "revision", "--autogenerate", "-m", message],
            workdir="/code"
        )
        if exit_code != 0:
            return f"Error creating revision: {output.decode()}"

        exit_code, output = backend.exec_run(
            ["alembic", "upgrade", "head"],
            workdir="/code"
        )
        if exit_code != 0:
            return f"Error applying migration: {output.decode()}"
            
        return "Successfully created and applied database migrations."
        
    except docker.errors.NotFound:
        return "Error: Could not find 'backend' container. Is it running?"
    except Exception as e:
        return f"Unexpected error: {str(e)}"

@mcp.tool()
def restart_backend():
    """
    Restarts the backend FastAPI container.
    """
    client = docker.from_env()
    try:
        backend = client.containers.get("backend")
        backend.restart()
        return "Backend container restarting... Give it 5-10 seconds to come back online."
    except Exception as e:
        return f"Error restarting backend: {str(e)}"

if __name__ == "__main__":
    mcp.run()
