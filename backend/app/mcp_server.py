import os
import subprocess
from mcp.server.fastmcp import FastMCP
from jinja2 import Environment, FileSystemLoader
from typing import List
from pydantic import BaseModel
import ast
import re

# Initialize FastMCP
mcp = FastMCP("Backend MCP")

# --- Configuration ---
# Matches your cli.py paths
TEMPLATES_DIR = "/workspace/backend/app/templates"
WORKSPACE_DIR = "/workspace"
templates_env = Environment(loader=FileSystemLoader(TEMPLATES_DIR))

# --- Helper Functions (Copied/Adapted from cli.py) ---
def to_pascal_case(snake_case: str) -> str: 
    return "".join(word.capitalize() for word in snake_case.split('_'))

def to_plural(snake_case: str) -> str:
    if snake_case.endswith('y'): return snake_case[:-1] + 'ies'
    if snake_case.endswith('s'): return snake_case + 'es'
    return snake_case + 's'

def type_to_sqlalchemy(field_type: str) -> str:
    mapping = {"string": "String", "text": "Text", "integer": "Integer", "float": "Float", "boolean": "Boolean", "date": "Date", "datetime": "DateTime", "uuid": "Uuid"}
    return mapping.get(field_type, "String")

def type_to_pydantic(field_type: str) -> str:
    mapping = {"string": "str", "text": "str", "integer": "int", "float": "float", "boolean": "bool", "date": "date", "datetime": "datetime", "uuid": "UUID"}
    return mapping.get(field_type, "str")

# --- MCP Tools ---

@mcp.tool()
def create_resource(resource_name: str, fields: List[str]):
    """
    Scaffolds the data layer: backend models, schemas, CRUD, endpoints, and frontend API handlers.
    Args:
        resource_name: The singular snake_case name (e.g., 'product_item').
        fields: List of fields in 'name:type:required' format (e.g. ['title:string:true']).
    """
    # Parse fields locally since we can't share the 'Field' class easily with pure strings input
    parsed_fields = []
    for f in fields:
        parts = f.split(':')
        if len(parts) != 3: 
            return f"Error: Field '{f}' must be in 'name:type:required' format."
        name, ftype, req = parts[0].strip(), parts[1].strip(), parts[2].strip().lower()
        if ftype not in ["string", "text", "integer", "float", "boolean", "date", "datetime", "uuid"]:
            return f"Error: Invalid field type: {ftype}"
        parsed_fields.append({"name": name, "type": ftype, "required": req in ['true', '1', 't', 'y', 'yes']})

    ctx = {
        "resource_name_snake": resource_name,
        "resource_name_pascal": to_pascal_case(resource_name),
        "resource_name_plural_snake": to_plural(resource_name),
        "fields": parsed_fields,
        "type_to_sqlalchemy": type_to_sqlalchemy,
        "type_to_pydantic": type_to_pydantic
    }

    base_paths = {
        "backend": os.path.join(WORKSPACE_DIR, "backend/app"),
        "frontend": os.path.join(WORKSPACE_DIR, "frontend/src")
    }

    # Using f-strings carefully to avoid syntax errors in python versions < 3.12 
    r_snake = ctx["resource_name_snake"]
    r_plural = ctx["resource_name_plural_snake"]

    files_to_generate = {
        "backend/model.py.j2": os.path.join(base_paths["backend"], f"models/{r_snake}.py"),
        "backend/schema.py.j2": os.path.join(base_paths["backend"], f"db/schemas/{r_snake}.py"),
        "backend/crud.py.j2": os.path.join(base_paths["backend"], f"crud/crud_{r_snake}.py"),
        "backend/endpoint.py.j2": os.path.join(base_paths["backend"], f"api/v1/endpoints/{r_plural}.py"),
        "frontend/api_index.js.j2": os.path.join(base_paths["frontend"], f"pages/api/{r_plural}/index.js"),
        "frontend/api_id.js.j2": os.path.join(base_paths["frontend"], f"pages/api/{r_plural}/[{r_snake}_id].js"),
    }
    
    generated_list = []
    for template_name, output_path in files_to_generate.items():
        template = templates_env.get_template(template_name)
        rendered_content = template.render(ctx)
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, "w") as f: 
            f.write(rendered_content)
        # Fix permissions so local user can edit
        try: os.chmod(output_path, 0o666)
        except: pass
        generated_list.append(output_path)

    # --- Modify backend router ---
    routers_file_path = os.path.join(base_paths["backend"], "api/v1/routers.py")
    if os.path.exists(routers_file_path):
        with open(routers_file_path, "r+") as f:
            content = f.read()
            new_import = f"from app.api.v1.endpoints import {r_plural}"
            if new_import not in content:
                lines = content.splitlines()
                imports = [line for line in lines if line.startswith("from")]
                other_lines = [line for line in lines if not line.startswith("from") and line.strip()]
                
                if new_import not in imports:
                    imports.append(new_import)
                    imports.sort()
                
                content = "\n".join(imports) + "\n\n" + "\n".join(other_lines)
            
            new_router = f"api_router.include_router({r_plural}.router)"
            if new_router not in content:
                content += f"\n{new_router}"
            
            f.seek(0); f.write(content); f.truncate()

    # --- Modify models/__init__.py ---
    models_init_path = os.path.join(base_paths["backend"], "models/__init__.py")
    if os.path.exists(models_init_path):
        new_model_import = f"from .{r_snake} import {ctx['resource_name_pascal']}"
        with open(models_init_path, "r+") as f:
            lines = f.read().splitlines()
            if new_model_import not in lines:
                f.write(f"\n{new_model_import}")

    return f"Created resource {resource_name}. Generated {len(generated_list)} files."

@mcp.tool()
def create_frontend_page(page_name: str):
    """
    Creates a new, minimal Next.js frontend page.
    Args:
        page_name: The name for the page and its file (e.g., 'poster-board').
    """
    ctx = {"page_name_pascal": to_pascal_case(page_name)}
    template = templates_env.get_template("frontend/page.js.j2")
    rendered_content = template.render(ctx)
    output_path = os.path.join(WORKSPACE_DIR, "frontend/src/pages", f"{page_name}.js")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w") as f: 
        f.write(rendered_content)
    
    # Fix permissions
    try: os.chmod(output_path, 0o666)
    except: pass
    
    return f"Successfully created frontend page at frontend/src/pages/{page_name}.js"

@mcp.tool()
def create_frontend_component(component_name: str, path: str = ""):
    """
    Creates a new, minimal React frontend component.
    Args:
        component_name: PascalCase name for the component (e.g., 'UserProfile').
        path: Relative path from frontend/src/components (e.g., 'users').
    """
    ctx = {"component_name": component_name}
    template = templates_env.get_template("frontend/component.js.j2")
    rendered_content = template.render(ctx)

    output_dir = os.path.join(WORKSPACE_DIR, "frontend/src/components", path)
    output_path = os.path.join(output_dir, f"{component_name}.js")
    
    os.makedirs(output_dir, exist_ok=True)
    with open(output_path, "w") as f:
        f.write(rendered_content)
    
    # Fix permissions
    try: os.chmod(output_path, 0o666)
    except: pass

    relative_path = os.path.join("frontend/src/components", path, f"{component_name}.js")
    return f"Successfully created component at {relative_path}"

@mcp.tool()
def create_api_client(file_path: str, resource_name: str, fields: List[str]):
    """
    Injects API client hooks and handlers into a frontend file.
    Args:
        file_path: The path to the component or page file relative to `frontend/src`.
        resource_name: The singular snake_case name of the resource to use.
        fields: List of the resource's field definitions in 'name:type:required' format.
    """
    full_path = os.path.join(WORKSPACE_DIR, "frontend/src", file_path)

    if not os.path.exists(full_path):
        return f"Error: File not found at {full_path}"

    parsed_fields = []
    for f in fields:
        parts = f.split(':')
        if len(parts) != 3:
             return f"Error: Field '{f}' must be in 'name:type:required' format."
        name, ftype, req = parts[0].strip(), parts[1].strip(), parts[2].strip().lower()
        parsed_fields.append({"name": name, "type": ftype, "required": req in ['true', '1', 't', 'y', 'yes']})

    ctx = {
        "resource_name_snake": resource_name,
        "resource_name_plural_snake": to_plural(resource_name),
        "fields": parsed_fields,
    }

    template = templates_env.get_template("frontend/api_client.js.j2")
    api_client_code = template.render(ctx)

    try:
        with open(full_path, "r+") as f:
            content = f.read()
            # Find the function signature line to inject the code
            match = re.search(r"export default function \w+\(.*\) {", content)
            if not match:
                return f"Error: Could not find a default exported function component in {file_path}."
            
            injection_point = match.end()
            new_content = content[:injection_point] + "\n" + api_client_code + content[injection_point:]
            
            # Also add useState and useEffect to the react import
            if "import React" in new_content:
                new_content = re.sub(r"import React from 'react';", "import React, { useState, useEffect } from 'react';", new_content)
            
            f.seek(0)
            f.write(new_content)
            f.truncate()
            
        return f"Successfully injected API client code into {file_path}"
    except Exception as e:
        return f"Error injecting code: {str(e)}"

@mcp.tool()
def audit_resource(resource_name: str):
    """
    Audits the alignment between Backend Pydantic schemas and Frontend usage for a given resource.
    Checks for:
    1. Missing required fields in frontend usage.
    2. Case mismatches (snake_case vs camelCase).
    """
    r_snake = resource_name
    r_plural = to_plural(resource_name)
    
    # 1. Analyze Backend Schema
    schema_path = os.path.join(WORKSPACE_DIR, "backend/app/db/schemas", f"{r_snake}.py")
    if not os.path.exists(schema_path):
        return f"Error: Schema file not found at {schema_path}"

    required_fields = []
    all_fields = []
    
    try:
        with open(schema_path, "r") as f:
            tree = ast.parse(f.read())
            
        for node in tree.body:
            if isinstance(node, ast.ClassDef) and node.name.endswith("Create"):
                for item in node.body:
                    if isinstance(item, ast.AnnAssign):
                        field_name = item.target.id
                        # Check if optional (this is a basic heuristic)
                        is_optional = False
                        if item.value is not None: # Has default value
                             is_optional = True
                        
                        # Check for Optional[...] type hint
                        if isinstance(item.annotation, ast.Subscript) and getattr(item.annotation.value, 'id', '') == 'Optional':
                            is_optional = True
                        
                        all_fields.append(field_name)
                        if not is_optional:
                            required_fields.append(field_name)
    except Exception as e:
        return f"Error parsing schema: {str(e)}"

    if not all_fields:
        return f"No fields found in {schema_path}. Ensure a 'Create' class exists."

    # 2. Analyze Frontend Usage
    frontend_dir = os.path.join(WORKSPACE_DIR, "frontend/src")
    report = [f"--- Audit Report for '{resource_name}' ---"]
    
    # Find files referencing the resource API path
    api_path = f"/api/{r_plural}"
    relevant_files = []
    
    # Walk through frontend src
    for root, dirs, files in os.walk(frontend_dir):
        for file in files:
            if file.endswith(".js") or file.endswith(".jsx") or file.endswith(".ts") or file.endswith(".tsx"):
                full_path = os.path.join(root, file)
                try:
                    with open(full_path, "r") as f:
                        content = f.read()
                        if api_path in content or r_snake in content or r_plural in content:
                            relevant_files.append((full_path, content))
                except:
                    pass

    if not relevant_files:
        report.append("No frontend files found referencing this resource.")
        return "\n".join(report)

    issues_found = 0
    
    for fpath, content in relevant_files:
        rel_path = os.path.relpath(fpath, WORKSPACE_DIR)
        file_issues = []
        
        # Check for snake_case vs camelCase mismatches
        for field in all_fields:
            if "_" in field:
                camel_cased = "".join(word.capitalize() if i > 0 else word for i, word in enumerate(field.split('_')))
                
                # If backend expects snake_case, but frontend has camelCase and NOT snake_case
                if camel_cased in content and field not in content:
                    file_issues.append(f"  - Potential Case Mismatch: Backend expects '{field}', found '{camel_cased}'")
        
        # Check for missing required fields (Basic existence check)
        # We only check this if there looks like a payload creation (e.g., JSON.stringify)
        if "JSON.stringify" in content or "body:" in content:
            missing_req = []
            for req in required_fields:
                if req not in content:
                    # Very basic heuristic: if the exact field name isn't in the file, warn.
                    # This might flag false positives if fields are constructed dynamically.
                    missing_req.append(req)
            
            if missing_req:
                file_issues.append(f"  - Missing Required Fields (Backend expects these): {', '.join(missing_req)}")

        if file_issues:
            issues_found += 1
            report.append(f"\nIn {rel_path}:")
            report.extend(file_issues)

    if issues_found == 0:
        report.append("\nNo obvious issues found. Frontend seems aligned with Backend Schema.")
    else:
        report.append("\nNote: This tool uses text matching. Ensure fields are passed correctly in the payload.")

    return "\n".join(report)

@mcp.tool()
def apply_migrations(message: str = "New migration"):
    """
    Generates and applies database migrations using Alembic.
    """
    try:
        # Run revision
        result_rev = subprocess.run(
            ["alembic", "revision", "--autogenerate", "-m", message],
            capture_output=True, text=True, cwd=os.path.join(WORKSPACE_DIR, "backend")
        )
        if result_rev.returncode != 0:
            return f"Error creating revision: {result_rev.stderr}"

        # Run upgrade
        result_up = subprocess.run(
            ["alembic", "upgrade", "head"],
            capture_output=True, text=True, cwd=os.path.join(WORKSPACE_DIR, "backend")
        )
        if result_up.returncode != 0:
            return f"Error applying migrations: {result_up.stderr}"

        return "Database migrations applied successfully."
    except Exception as e:
        return f"Unexpected error: {str(e)}"

@mcp.tool()
def read_logs(lines: int = 50, level: str = None):
    """
    Reads the backend application logs.
    Args:
        lines: Number of recent lines to read (default 50).
        level: Filter by log level (e.g., 'ERROR', 'WARNING'). If None, returns all.
    """
    log_file = os.path.join(WORKSPACE_DIR, "backend/logs/backend.log")
    if not os.path.exists(log_file):
        return f"Log file not found at {log_file}. Ensure the application has started."

    try:
        with open(log_file, "r") as f:
            all_lines = f.readlines()
        
        filtered_lines = []
        if level:
            level_upper = level.upper()
            # strict check for " - LEVEL - " to avoid matching logger names like 'uvicorn.error'
            # or use regex for more robustness if format changes, but standard format is consistent.
            check_str = f" - {level_upper} - "
            filtered_lines = [line for line in all_lines if check_str in line]
        else:
            filtered_lines = all_lines
        
        # Get last N lines
        result = filtered_lines[-lines:] if lines > 0 else filtered_lines
        
        if not result:
            return "No logs found matching criteria."
            
        return "".join(result)
    except Exception as e:
        return f"Error reading logs: {str(e)}"

if __name__ == "__main__":
    mcp.run()
