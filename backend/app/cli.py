import os
import subprocess
import typer
from jinja2 import Environment, FileSystemLoader
from typing import List
from typing_extensions import Annotated
import re

# --- Typer App Initialization ---
app = typer.Typer(help="Master Control Program for project scaffolding and management.")

# --- Configuration ---
TEMPLATES_DIR = "/workspace/backend/app/templates"
WORKSPACE_DIR = "/workspace"
templates_env = Environment(loader=FileSystemLoader(TEMPLATES_DIR))

# --- Helper Functions ---
def to_pascal_case(snake_case: str) -> str: return "".join(word.capitalize() for word in snake_case.split('_'))
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

class Field:
    def __init__(self, definition: str):
        try:
            parts = definition.split(':')
            if len(parts) != 3: raise ValueError("Field definition must be in 'name:type:required' format.")
            self.name, self.type = parts[0].strip(), parts[1].strip()
            self.required = parts[2].strip().lower() in ['true', '1', 't', 'y', 'yes']
            if self.type not in ["string", "text", "integer", "float", "boolean", "date", "datetime", "uuid"]: raise ValueError(f"Invalid field type: {self.type}")
        except Exception as e:
            typer.echo(f"Error parsing field definition '{definition}': {e}", err=True)
            raise typer.Exit(code=1)

# --- CLI Commands ---

@app.command("create-resource")
def create_resource(
    resource_name: Annotated[str, typer.Argument(help="The singular snake_case name of the resource (e.g., 'product_item').")],
    fields: Annotated[List[str], typer.Argument(help="List of field definitions in 'name:type:required' format.")]
):
    """
    Scaffolds the data layer: backend models, schemas, CRUD, endpoints, and frontend API handlers.
    """
    typer.echo(f"Creating resource: {resource_name}")
    parsed_fields = [Field(f) for f in fields]
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

    files_to_generate = {
        "backend/model.py.j2": os.path.join(base_paths["backend"], f"models/{ctx["resource_name_snake"]}.py"),
        "backend/schema.py.j2": os.path.join(base_paths["backend"], f"db/schemas/{ctx["resource_name_snake"]}.py"),
        "backend/crud.py.j2": os.path.join(base_paths["backend"], f"crud/crud_{ctx["resource_name_snake"]}.py"),
        "backend/endpoint.py.j2": os.path.join(base_paths["backend"], f"api/v1/endpoints/{ctx["resource_name_plural_snake"]}.py"),
        "frontend/api_index.js.j2": os.path.join(base_paths["frontend"], f"pages/api/{ctx["resource_name_plural_snake"]}/index.js"),
        "frontend/api_id.js.j2": os.path.join(base_paths["frontend"], f"pages/api/{ctx["resource_name_plural_snake"]}/[{ctx["resource_name_snake"]}Id].js"),
    }
    
    generated_list = []
    for template_name, output_path in files_to_generate.items():
        template = templates_env.get_template(template_name)
        rendered_content = template.render(ctx)
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, "w") as f: f.write(rendered_content)
        generated_list.append(output_path.replace(WORKSPACE_DIR, "/backend")) # Show path relative to project root

    typer.echo("Generated files:")
    for path in generated_list: typer.echo(f"- {path}")

    # --- Modify backend router ---
    routers_file_path = os.path.join(base_paths["backend"], "api/v1/routers.py")
    with open(routers_file_path, "r+") as f:
        content = f.read()
        plural_snake = ctx["resource_name_plural_snake"]
        new_import = f"from app.api.v1.endpoints import {plural_snake}"
        if new_import not in content:
            # Add new import alphabetically
            lines = content.splitlines()
            imports = [line for line in lines if line.startswith("from")]
            imports.append(new_import)
            imports.sort()
            
            router_inits = [line for line in lines if "APIRouter()" in line or "api_router.include_router" in line]
            
            new_content = "\n".join(imports) + "\n\n" + "\n".join(router_inits)
            content = new_content

        new_router = f"api_router.include_router({plural_snake}.router)"
        if new_router not in content:
            content += f"\n{new_router}"
        
        f.seek(0); f.write(content); f.truncate()
    typer.echo("Updated backend router.")

    # --- Modify models/__init__.py for Alembic autodiscovery ---
    models_init_path = os.path.join(base_paths["backend"], "models/__init__.py")
    new_model_import = f"from .{ctx['resource_name_snake']} import {ctx['resource_name_pascal']}"
    with open(models_init_path, "r+") as f:
        content = f.read()
        if new_model_import not in content:
            f.write(f"\n{new_model_import}")
    typer.echo("Updated models package for autodiscovery.")
    
    typer.secho(f"Successfully created resource '{resource_name}'.", fg=typer.colors.GREEN)


@app.command("create-frontend-page")
def create_frontend_page(
    page_name: Annotated[str, typer.Argument(help="The name for the page and its file (e.g., 'poster-board').")]
):
    """
    Creates a new, minimal Next.js frontend page.
    """
    typer.echo(f"Creating frontend page: {page_name}")
    ctx = {"page_name_pascal": to_pascal_case(page_name)}
    template = templates_env.get_template("frontend/page.js.j2")
    rendered_content = template.render(ctx)
    output_path = os.path.join(WORKSPACE_DIR, "frontend/src/pages", f"{page_name}.js")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w") as f: f.write(rendered_content)
    typer.secho(f"Successfully created frontend page at frontend/src/pages/{page_name}.js", fg=typer.colors.GREEN)

@app.command("create-frontend-component")
def create_frontend_component(
    component_name: Annotated[str, typer.Argument(help="PascalCase name for the component (e.g., 'UserProfile').")],
    path: Annotated[str, typer.Argument(help="Relative path from frontend/src/components (e.g., 'users').")] = ""
):
    """
    Creates a new, minimal React frontend component.
    """
    typer.echo(f"Creating frontend component: {component_name}")
    
    ctx = {"component_name": component_name}
    template = templates_env.get_template("frontend/component.js.j2")
    rendered_content = template.render(ctx)

    output_dir = os.path.join(WORKSPACE_DIR, "frontend/src/components", path)
    output_path = os.path.join(output_dir, f"{component_name}.js")
    
    os.makedirs(output_dir, exist_ok=True)
    with open(output_path, "w") as f:
        f.write(rendered_content)

    relative_path = os.path.join("frontend/src/components", path, f"{component_name}.js")
    typer.secho(f"Successfully created component at {relative_path}", fg=typer.colors.GREEN)

@app.command("create-api-client")
def create_api_client(
    file_path: Annotated[str, typer.Argument(help="The path to the component or page file relative to `frontend/src`.")],
    resource_name: Annotated[str, typer.Argument(help="The singular snake_case name of the resource to use (e.g., 'post_item').")],
    fields: Annotated[List[str], typer.Argument(help="List of the resource's field definitions in 'name:type:required' format.")]
):
    """
    Injects API client hooks and handlers into a frontend file.
    """
    typer.echo(f"Injecting API client for '{resource_name}' into {file_path}")
    full_path = os.path.join(WORKSPACE_DIR, "frontend/src", file_path)

    if not os.path.exists(full_path):
        typer.echo(f"Error: File not found at {full_path}", err=True)
        raise typer.Exit(code=1)

    parsed_fields = [Field(f) for f in fields]
    ctx = {
        "resource_name_snake": resource_name,
        "resource_name_plural_snake": to_plural(resource_name),
        "fields": parsed_fields,
    }

    template = templates_env.get_template("frontend/api_client.js.j2")
    api_client_code = template.render(ctx)

    with open(full_path, "r+") as f:
        content = f.read()
        # Find the function signature line to inject the code
        match = re.search(r"export default function \w+\(.*\) {", content)
        if not match:
            typer.echo(f"Error: Could not find a default exported function component in {file_path}.", err=True)
            raise typer.Exit(code=1)
        
        injection_point = match.end()
        new_content = content[:injection_point] + "\n" + api_client_code + content[injection_point:]
        
        # Also add useState and useEffect to the react import
        new_content = re.sub(r"import React from 'react';", "import React, { useState, useEffect } from 'react';", new_content)

        f.seek(0)
        f.write(new_content)
        f.truncate()

    typer.secho(f"Successfully injected API client code into {file_path}", fg=typer.colors.GREEN)


@app.command("audit-resource")
def audit_resource(
    resource_name: Annotated[str, typer.Argument(help="The singular snake_case name of the resource to audit.")]
):
    """
    Checks for alignment errors between Backend Pydantic Schemas and Frontend usage.
    """
    typer.echo(f"Auditing resource: {resource_name}")
    
    # 1. Analyze Backend Schema
    schema_path = os.path.join(WORKSPACE_DIR, "backend/app/db/schemas", f"{resource_name}.py")
    if not os.path.exists(schema_path):
        typer.echo(f"Error: Schema file not found at {schema_path}", err=True)
        raise typer.Exit(code=1)

    # Note: We can't easily run the python analysis inside this script if it relies on app context, 
    # but since it uses 'ast', we can implement a similar logic here or assume this script runs in an env 
    # where it can inspect files.
    # To keep it simple and consistent with 'mcp_server', we will reproduce the logic or call a shared module if possible.
    # Since they are separate entry points, I will duplicate the lightweight analysis logic here for the CLI user.
    
    import ast
    
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
                        is_optional = False
                        if item.value is not None: is_optional = True
                        if isinstance(item.annotation, ast.Subscript) and getattr(item.annotation.value, 'id', '') == 'Optional':
                            is_optional = True
                        all_fields.append(field_name)
                        if not is_optional:
                            required_fields.append(field_name)
    except Exception as e:
        typer.echo(f"Error parsing schema: {e}", err=True)
        raise typer.Exit(code=1)

    # 2. Analyze Frontend Usage
    frontend_dir = os.path.join(WORKSPACE_DIR, "frontend/src")
    typer.echo(f"Scanning frontend directory: {frontend_dir}")
    
    r_plural = to_plural(resource_name)
    api_path = f"/api/{r_plural}"
    
    issues_count = 0
    
    for root, dirs, files in os.walk(frontend_dir):
        for file in files:
            if file.endswith(".js") or file.endswith(".jsx") or file.endswith(".ts") or file.endswith(".tsx"):
                full_path = os.path.join(root, file)
                try:
                    with open(full_path, "r") as f:
                        content = f.read()
                        if api_path in content or resource_name in content or r_plural in content:
                            # Analyze this file
                            rel_path = os.path.relpath(full_path, WORKSPACE_DIR)
                            file_issues = []
                            
                            for field in all_fields:
                                if "_" in field:
                                    camel_cased = "".join(word.capitalize() if i > 0 else word for i, word in enumerate(field.split('_')))
                                    if camel_cased in content and field not in content:
                                        file_issues.append(f"  - Potential Case Mismatch: Backend expects '{field}', found '{camel_cased}'")
                            
                            if "JSON.stringify" in content or "body:" in content:
                                missing = [req for req in required_fields if req not in content]
                                if missing:
                                    file_issues.append(f"  - Missing Required Fields: {', '.join(missing)}")
                                    
                            if file_issues:
                                issues_count += 1
                                typer.echo(f"\nIn {rel_path}:")
                                for issue in file_issues:
                                    typer.echo(issue)
                except Exception as e:
                    pass
    
    if issues_count == 0:
        typer.secho("\nNo obvious issues found. Frontend seems aligned.", fg=typer.colors.GREEN)
    else:
        typer.secho(f"\nFound potential issues in {issues_count} files.", fg=typer.colors.YELLOW)

@app.command("read-logs")
def read_logs(
    lines: Annotated[int, typer.Option(help="Number of recent lines to read.")] = 50,
    level: Annotated[str, typer.Option(help="Filter by log level (ERROR, INFO, etc.)")] = None
):
    """
    Reads and displays the backend application logs.
    """
    log_file = os.path.join(WORKSPACE_DIR, "backend/logs/backend.log")
    if not os.path.exists(log_file):
        typer.echo(f"Log file not found at {log_file}.", err=True)
        raise typer.Exit(code=1)

    try:
        with open(log_file, "r") as f:
            all_lines = f.readlines()
        
        filtered = all_lines
        if level:
            level_upper = level.upper()
            check_str = f" - {level_upper} - "
            filtered = [line for line in all_lines if check_str in line]
        
        result = filtered[-lines:]
        for line in result:
            typer.echo(line, nl=False)
    except Exception as e:
        typer.echo(f"Error reading logs: {e}", err=True)
        raise typer.Exit(code=1)

@app.command("apply-migrations")
def apply_migrations(
    message: Annotated[str, typer.Option(help="Message for the Alembic revision.")] = "New migration"
):
    """
    Generates and applies database migrations.
    """
    typer.echo("Applying database migrations...")
    try:
        subprocess.run(
            ["alembic", "revision", "--autogenerate", "-m", message],
            check=True, cwd=os.path.join(WORKSPACE_DIR, "backend")
        )
        subprocess.run(
            ["alembic", "upgrade", "head"],
            check=True, cwd=os.path.join(WORKSPACE_DIR, "backend")
        )
        typer.secho("Database migrations applied successfully.", fg=typer.colors.GREEN)
    except subprocess.CalledProcessError as e:
        typer.echo(f"Error applying migrations: {e}", err=True)
        raise typer.Exit(code=1)

if __name__ == "__main__":
    app()
