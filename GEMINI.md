# Gemini CLI Guidelines for Frontend Scaffolding

When using the `mcp` tools, observe the following:

### `create-frontend-page` and `create-frontend-component`:

These tools generate **minimal scaffolding code** only. After their execution, you **must proceed to implement the user's full request** by filling in the generated page or component with the necessary UI elements, logic, and styling. Do not consider the task complete after just scaffolding.

### API Resource Integration (`create-api-client`):

When integrating API resources into a page or component using the `create-api-client` tool, pay close attention to the user's requirements for the new feature:

*   **Determine required API operations:** Assess whether the requested feature necessitates `GET`, `CREATE`, `UPDATE`, or `DELETE` functionality (or a subset thereof).
*   **Default API availability:** The `create-resource` tool generates a backend API with all CRUD operations. However, the frontend implementation (via `create-api-client`) should only expose the operations explicitly or implicitly required by the user's feature request.

### Clarification and Insufficient Information:

If the user's prompt provides **insufficient information** to fully implement the requested feature (e.g., unclear UI design, ambiguous data interaction, missing styling details), you **must request clarification** from the user. Do not make assumptions beyond what the `mcp` tools provide as boilerplate.


### Unecessary Steps During Development Mode
This tech stack makes use of Hot Module Replacement. But if you must rebuild the application its best just to run docker compose up -d --build <container-name>