# Architecture — Let Him Cook

## 1. Architecture Style

Let Him Cook will use a **modular monolith architecture**.

The frontend and backend will be separate applications. The backend will remain a single deployable application organized into feature-based modules.

This approach keeps the initial development process simple while allowing individual responsibilities to evolve as the application grows.

Microservices are not required for the initial MVP.

## 2. Technology Stack

### Frontend
- React
- TypeScript
- Vite
- Ant Design

### Backend
- Node.js
- Express
- TypeScript
- Knex.js

### Database
- PostgreSQL
- Knex migrations and seeds

### External Integrations
- AI model provider API
- Recipe data source or provider
- YouTube Data API or another authorized video-search source

## 3. Application Responsibilities

### Frontend

The frontend is responsible for:
- Rendering the user interface.
- Collecting ingredients and user preferences.
- Displaying AI-generated explanations and recipe recommendations.
- Showing recipe details and cooking tutorials.
- Managing shopping-list interactions.
- Communicating with the backend through HTTP APIs.

The frontend must not connect directly to PostgreSQL or expose private API credentials.

### Backend

The backend is responsible for:
- Exposing REST API endpoints.
- Validating incoming requests.
- Enforcing authentication and authorization where required.
- Coordinating recipe discovery and AI interactions.
- Managing application business logic.
- Calculating missing ingredients.
- Accessing PostgreSQL through Knex.
- Communicating with external AI, recipe, and video providers.
- Handling errors and returning consistent API responses.

### Database

PostgreSQL will persist application data, including:
- User accounts and preferences.
- Saved recipes and recipe metadata.
- Ingredient records and ingredient relationships.
- User ingredient inventories, if supported.
- Shopping lists and their items.
- Conversation history, when persistence is required.

Database schema changes must be managed through Knex migrations.

## 4. Backend Module Responsibilities

### AI Module
Handles communication with the AI provider, prompt construction, structured responses, and conversational context.

It must not be responsible for inventing database records or independently determining exact shopping-list calculations.

### Recipe Module
Handles recipe discovery, retrieval, filtering, ingredient matching, and recipe-related data.

Recipe data should retain its source and any relevant attribution or licensing requirements.

### Ingredient Module
Handles ingredient normalization, ingredient matching, and comparisons between available and required ingredients.

### Shopping List Module
Creates and manages shopping lists based on selected recipes and ingredients already available to the user.

Missing-ingredient calculations should use application logic and structured data.

### User Module
Handles user-related operations, saved preferences, and user-specific data access.

### Database Module
Provides the configured Knex instance and database-related utilities.

Modules should share functionality through explicit interfaces rather than accessing each other's internal implementation unnecessarily.

## 5. Request Flow

A typical request follows this sequence:

1. The frontend sends an HTTP request to the Express API.
2. Middleware handles applicable cross-cutting concerns.
3. The route validates and forwards the request to the appropriate feature module.
4. The module executes application logic and accesses external providers or PostgreSQL as needed.
5. The backend validates and formats the response.
6. The frontend displays the result.

## 6. AI Design Principles

- Use AI to interpret natural-language requests and explain recommendations.
- Retrieve existing recipes when reliable sources are available.
- Keep recipe facts and source references separate from AI-generated explanations.
- Validate structured AI outputs before using them.
- Treat external content and user input as untrusted data.
- Handle provider failures, rate limits, and timeouts gracefully.
- Keep AI credentials exclusively on the backend.
- Never rely on AI alone for exact ingredient comparisons or shopping-list calculations.

## 7. API Design

Use versioned REST endpoints when appropriate, with `/api/v1` as the initial API prefix.

Examples:
- `POST /api/v1/ai/chat`
- `POST /api/v1/recipes/search`
- `GET /api/v1/recipes/:id`
- `POST /api/v1/shopping-lists`
- `GET /api/v1/shopping-lists`
- `PATCH /api/v1/shopping-lists/:id/items/:itemId`

Use consistent HTTP status codes, request validation, and error response formats.

Protect private resources with authentication and authorization.

## 8. Security and Configuration

- Load secrets from backend environment variables.
- Keep local environment files out of version control.
- Validate and constrain user input.
- Use parameterized database operations through Knex.
- Apply appropriate authentication, authorization, rate limiting, and CORS configuration.
- Avoid logging passwords, tokens, API keys, or other sensitive data.

## 9. Development Principles

- Prefer simple, maintainable implementations.
- Organize code by feature and responsibility.
- Avoid unnecessary architectural layers and dependencies.
- Use TypeScript consistently.
- Use migrations for database schema changes.
- Add tests for important business logic and API behavior.
- Update this document when significant architectural decisions change.

## 10. Future Scalability

Keep the initial architecture as a modular monolith.

Consider introducing background jobs, caching, or separate services only when actual requirements justify them, such as long-running tasks, high traffic, or independently scalable workloads.

## Backend Architecture Guidelines

### Preferred Architecture

Use a simple, feature-based modular architecture for the backend.

**Default request flow:**

`Routes → Controllers → Repositories → PostgreSQL`

Do not create a service layer. Keep the architecture simple and avoid unnecessary abstraction.

### Layer Responsibilities

#### 1. Routes
- Define API endpoints and HTTP methods.
- Connect endpoints to their corresponding controllers.
- Keep route files focused on routing only.

#### 2. Controllers
- Read and validate request parameters, query parameters, and request bodies.
- Handle HTTP status codes and responses.
- Coordinate the operation by calling the appropriate repository.
- Contain straightforward business logic when appropriate.
- Pass unexpected errors to Express error-handling middleware.
- Avoid writing database queries directly in controllers.

#### 3. Repositories
- Handle database operations using Knex and PostgreSQL.
- Keep SQL queries and database access logic in the repository.
- Return data to the calling controller.
- Avoid handling HTTP requests or responses.
- Avoid placing unrelated business logic in repositories.

### AI Integration

- Keep AI provider communication and configuration inside the AI module.
- Never expose AI provider API keys to the frontend.
- Keep provider-specific request and response handling separate from HTTP controllers.
- For simple AI endpoints, a controller may call the AI module directly.
- Handle multi-step workflows (such as interpreting user intent, retrieving recipes, ranking results, and generating recommendations) within the AI module without introducing a service layer.
- Use structured data and application logic for recipe matching, ingredient comparisons, and shopping-list calculations. Do not rely on AI-generated guesses for exact database facts or calculations.

### Project Structure

Use feature-based folders and create only the files required by each feature.

Example:

```text
backend/src/
├── config/
├── middleware/
├── database/
│   └── knex.ts
├── modules/
│   ├── recipes/
│   │   ├── recipe.routes.ts
│   │   ├── recipe.controller.ts
│   │   ├── recipe.repository.ts
│   │   └── recipe.types.ts
│   ├── ingredients/
│   ├── shopping-list/
│   ├── ai/
│   └── users/
├── app.ts
└── server.ts

backend/
├── migrations/
├── seeds/
└── tests/
```

### General Development Rules

- Prefer straightforward, readable, and maintainable code.
- Follow the existing project structure and conventions.
- Do not introduce unnecessary design patterns, abstractions, or dependencies.
- Avoid creating files that only re-export functions or pass calls between layers without adding value.
- Keep database queries in repositories and HTTP handling in controllers.
- Validate incoming data and handle errors consistently.
- Use TypeScript types for request data, database results, and application logic where appropriate.
- Make changes incrementally and avoid unrelated refactoring.
- If a new abstraction is necessary, explain briefly why it is needed.
