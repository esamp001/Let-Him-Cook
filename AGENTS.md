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

#### TheMealDB Ingredient-Match Walkthrough

In `themealdb.client.ts`, `summaryGroups` contains one group of recipe search results per requested ingredient. For example, searching for chicken and potato might produce:

```text
Chicken: 101, 101, 202
Potato:  101, 303
```

1. `new Map<string, number>()` starts a lookup from recipe ID to the number of requested ingredients it matches. It is empty at first.
2. For each ingredient group, the array method `.map((meal) => readText(meal, 'idMeal'))` extracts recipe IDs. This array method is distinct from the `Map` collection.
3. `.filter(...)` removes missing IDs. `new Set(...)` keeps each ID only once *within that ingredient group*, so duplicate `101` results for chicken add only one match.
4. For each unique ID, `ingredientMatchCounts.get(id) ?? 0` reads its current count or starts at zero. `.set(id, count + 1)` stores the increased count.

After both groups, the Map contains `101 → 2`, `202 → 1`, and `303 → 1`. Recipe `101` matched both ingredients. These counts support ingredient-based ranking; they are computed from provider results rather than guessed by AI.

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

1. Receive the user's message
Express validates the request and passes it to the AI module.
2. Understand the intent
The AI identifies chicken and potatoes as available ingredients and interprets the user's preference for easy, inexpensive cooking.
3. Retrieve candidate recipes
The recipe module searches available recipe sources or your own recipe database, then matches ingredients and constraints.
4. Rank and explain recommendations
The AI helps explain why each recipe suits the user. The application supplies the actual recipe data.
5. Find a relevant tutorial
A video-provider integration retrieves matching cooking videos, such as YouTube results.
6. Calculate missing ingredients
Regular application code compares the selected recipe against the user's available ingredients and generates the shopping list.

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
- `GET /api/v1/recipes`
- `POST /api/v1/auth/sign-in`, `GET /api/v1/auth/me`
- `GET /api/v1/community/my-recipes`, `POST /api/v1/community/recipes/:recipeId/submit`
- `GET /api/v1/shopping-list/items`, `PATCH /api/v1/shopping-list/items/:itemId`
- `GET /api/v1/moderation/recipes` (admin only)

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

## 11. AI Provider Strategy

### MVP

The MVP may use **Ollama with Qwen3 4B** as the AI provider. Qwen3 4B is an open-weight model that can run on the same development machine or VPS as the backend, avoiding per-request cloud-provider quotas during early development.

- Keep the model provider entirely inside the AI module.
- The Express controller must continue to call a provider-neutral function such as `generateRecipeSuggestions(message, cuisinePreference)`.
- Keep Ollama private on `localhost:11434`; never expose its port directly to the public internet.
- Validate every model response with the existing structured schema before returning it to the frontend.
- Treat AI-generated recipes as suggestions. Recipe facts, ingredient comparisons, and shopping-list calculations remain application logic.

The initial self-hosted deployment may run the following on one low-traffic VPS:

```text
Internet
  -> Nginx / HTTPS
  -> Express backend
     -> PostgreSQL
     -> Ollama on localhost:11434
        -> Qwen3 4B
```

This setup is appropriate for development, a portfolio, or a low-traffic MVP. It should limit concurrent AI generations so that model inference does not starve the backend or database of CPU and memory.

### Future Scale

When demand or response-time requirements grow, keep the backend API and AI module contract unchanged while moving inference to dedicated infrastructure:

```text
Nginx / load balancer
  -> Express application instances
  -> dedicated AI inference workers
     -> GPU-hosted Qwen3 8B or larger model
```

- Start by moving Ollama to a separate, stronger host when the shared VPS is no longer sufficient.
- Use GPU-backed inference and an inference server such as vLLM when concurrent throughput becomes important.
- Add a queue, rate limiting, monitoring, and health checks before running multiple AI workers.
- Scale horizontally by adding inference workers behind an internal load balancer.
- Maintain PostgreSQL backups and keep PostgreSQL and AI worker ports private.

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
- Conversational cooking plans use `POST /api/v1/ai/chat`. The client sends the current structured plan and latest message. When a user supplies available ingredients and asks what they can cook, extract the intent once and search recipes immediately without a follow-up question. Ask one to five follow-up questions only when the request is genuinely incomplete.
- Keep a conversation plan separate from display messages. For the MVP it may live in frontend state; persist it with a conversation ID only when saved or resumable conversations are needed.

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
│   │   └── interfaces/
│   │       └── ExternalRecipe.ts
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

## Community Recipes, Roles, and Moderation

Let Him Cook grows its Filipino recipe coverage through community contributions. These features require an authenticated account and must not be enabled for unauthenticated users. The rules below are implemented; see "Accounts, Data Ownership, and Moderation (Implemented)" for where each one lives in the code.

### Recipe Visibility and Lifecycle

- A contributor may keep a recipe `private`, submit it as `pending_review`, or—after approval—have it become `published`.
- Published community recipes may appear in the Community recipe catalog and in personalized recipe results when they meet the user's hard filters.
- Moderators may move a published recipe to `needs_review`, `unpublished`, or `rejected`. Do not permanently remove recipes solely from negative reactions.
- Preserve source URLs and attribution when a submission is imported from an external source. Do not publish copied content without appropriate permission.

### Authentication and Authorization Prerequisites

- Add a users module and authenticated user identity before enabling submissions, reactions, saved recipes, reports, or moderator actions.
- Define at least `user` and `admin` roles. Only admins may approve, reject, unpublish, restore, or review reports.
- Enforce ownership checks for private recipes and submissions. Never trust a user ID provided solely by the frontend.
- Store authorization decisions on the backend and protect all private and moderation endpoints.

### Community Feedback

- A favorite or save is private to the user and must not be treated as a global quality vote.
- Allow at most one `helpful` or `not_helpful` reaction per authenticated user per recipe; users may change or remove their reaction.
- Keep `not_helpful` separate from a report. Reports require a reason such as incorrect recipe, not Filipino, unsafe, spam, or copyright concern.
- Negative feedback may lower a recipe's ranking and flag it for moderator review when defined thresholds are met. It must not automatically delete a recipe.

### Recommendation Ranking

Apply ranking in this order:

1. Apply hard constraints first: published/allowed source, cuisine, dietary restrictions, and user constraints.
2. Rank primarily by available-ingredient coverage and missing required ingredients.
3. Use community quality only as a secondary tie-breaker. A popular recipe with poor ingredient coverage must not outrank a recipe the user can cook with their available ingredients.

For the MVP, use ingredient matching as the primary sort. Authenticated reactions and moderation now exist, so reaction counts (`helpful_count`, `not_helpful_count`) may be used as the secondary tie-breaker; this ranking change is not implemented yet.

### Suggested Future UI

- Keep the `For you` tab for current chat results filtered by the user's available ingredients and preferences.
- Add a `Community` tab for published recipes that supports browsing by cuisine, ingredient, popularity, and newest publication.
- Place `Add recipe` within a user-owned recipe area, not on the chat-results surface.

## Accounts, Data Ownership, and Moderation (Implemented)

### Data Ownership

- My Recipes, saved recipes (favorites), the shopping list, and chat conversations belong to the signed-in user and are stored in PostgreSQL: `community_recipes.author_user_id`, `saved_recipes`, `shopping_list_items`, and `chat_conversations`. Each has a `user_id` foreign key with `ON DELETE CASCADE`, so deleting an account deletes its data.
- Backend modules: `community` (`/api/v1/community`), `favorites` (`/api/v1/favorites`), `shopping-list` (`/api/v1/shopping-list/items`), and `conversations` (`/api/v1/conversations`). All are protected by `requireAuth`.
- Signed-out visitors can browse and chat. Saving recipes, favorites, the shopping list, and chat history show a sign-in prompt (`SignInPrompt`) and return the user to the page afterwards. Chats started as a guest are saved to the account when the user signs in.

### Roles

- Roles are `user` and `admin` (`users.role`). Admin-only routes use `requireAuth` then `requireRole('admin')`, which returns `403`.
- The admin account is created only by the admin seed (`Backend/seeds/01_admin_user.ts`), which `Backend/migrate-all-tenants.bat` runs after the migrations. It inserts the admin into `users` with `role = 'admin'` and a verified email when no account uses `ADMIN_EMAIL`; if one already exists, it changes nothing. There is no other way to create or promote an admin: no script, endpoint, or UI.
- The admin's email, name, and password come from `ADMIN_EMAIL`, `ADMIN_NAME`, and `ADMIN_PASSWORD` in `Backend/.env`. Without them, development defaults are used (`admin@lethimcook.local`, `Let Him Cook Admin`, `Admin@12345`); in production the seed refuses to run with the default password.
- The admin-only Moderation page is `/Moderation` and appears in the account menu for admins.

### Content Visibility

- Lifecycle: `private` → `pending_review` (owner submits, verified email required) → `published` (admin approves). Admins may also reject, unpublish, or restore; flagged recipes become `needs_review`.
- Allowed moderator transitions and submission rules live in `Backend/src/back-end-helpers/community-moderation.helpers.ts` (`getNextModerationStatus`, `canSubmitForReview`). The Moderation page mirrors them to offer only valid actions.
- Only `published` recipes appear in the public recipe browse and accept reactions or reports. The owner and admins can still read feedback for their unpublished recipes. Every moderator action is recorded in `recipe_moderation_events`.

### Community Feedback

- One `helpful` or `not_helpful` reaction per user per recipe; reacting again changes it, and it can be removed. Owners cannot rate or report their own recipes.
- Reports need a reason; a user may have only one open report per recipe.
- `shouldFlagForReview` moves a published recipe to `needs_review` after 3 open reports from different users, or after at least 5 `not_helpful` reactions that outnumber `helpful` ones. Flagging hides the recipe for review; it never deletes it. When an admin decides on a flagged recipe, its open reports are resolved.

### Account Security

- Rate limits (`Backend/src/middleware/rateLimits.ts`, in memory per server process): sign-in 10 per 15 minutes, sign-up 5 per hour, account emails 5 per 15 minutes, and link confirmations 20 per 15 minutes per IP. Set `TRUST_PROXY_HOPS=1` behind Nginx so limits see the real client IP.
- Email verification: sign-up emails a 24-hour link to `/Verify-Email`. Google accounts are verified automatically. Unverified users can sign in, but submitting, rating, and reporting community recipes require `requireVerifiedEmail`.
- Password reset: `/api/v1/auth/password-reset/request` always answers the same way, so emails cannot be discovered. The 30-minute link opens `/Reset-Password`; using it changes the password, verifies the email, and signs out every session.
- Emailed tokens and session tokens are stored only as SHA-256 hashes (`auth_tokens`, `user_sessions`). Each link works once, and a newer link replaces older unused ones.
- Sign out of all devices: `POST /api/v1/auth/sign-out-all` deletes every session for the user.
- Expired sessions and link tokens are deleted by `startSessionCleanupJob`, which runs at server start and then hourly.
- Emails are sent with nodemailer using the `SMTP_*` settings. When `SMTP_HOST` is empty in development, the email is printed to the backend console instead (development-only scaffolding); in production a missing SMTP configuration is an error.


## Coding Standards

- Before planning or changing code in this repository, read this entire section, including every subsection and example. Use the `follow-my-coding` skill to review applicable rules before editing and check the finished changes against them.
- Keep code simple and direct. Avoid redundant intermediate variables or extra layers that only rename or pass along the same value; create a variable when it makes the code clearer, is reused, or holds a changed result.
- Before adding or changing code, inspect comparable existing files and follow their established structure, naming, validation, error-handling, and formatting patterns. Copy the relevant existing approach for consistency unless it does not fit the new requirement or conflicts with these standards; when deviating, keep the alternative minimal and explain why it is needed.

### Dynamic Application Data Standard

- Use dynamic data throughout the production application. Recipe results, chat responses, users, preferences, shopping lists, community content, and other application records must come from the appropriate API, database, provider, or current user state rather than hardcoded sample records.
- Do not place mock, placeholder, demo, or static application records in production pages, components, controllers, repositories, or provider workflows.
- Static data is allowed when it represents fixed configuration, schemas, enums, validation rules, UI labels, or other values that are intentionally constant rather than application records.
- Mock or static application records may be used only in tests, test fixtures, seeds, or explicitly identified development-only scaffolding. Keep that data isolated so it cannot silently appear in production behavior.

### Database Migration Standard

- Create and modify schema through Knex's schema builder (`knex.schema`, `table`, and column helpers) by default.
- Use `knex.raw()` only when PostgreSQL-specific SQL is required or Knex cannot express the operation clearly, such as an advanced constraint, index option, or database feature.
- When raw SQL is necessary, keep it narrowly scoped, parameterized where it accepts values, and add a short comment explaining why the Knex schema builder is insufficient.

### Reusable Helper Standard

- Do not define reusable helper functions in controllers, repositories, pages, or UI component files.
- Put backend helpers in `Backend/src/back-end-helpers/`, with focused files such as `ingredient.helpers.ts` or `recipe-draft.helpers.ts`.
- Put frontend helpers in `Frontend/src/front-end-helpers/`, with focused files such as `recipe.helpers.ts` or `formatters.helpers.ts`.
- Export helpers as named exports from those files, then import them only into the controllers, repositories, pages, components, or modules that need them.
- Put reusable React state or side-effect logic in `Frontend/src/hooks/`, not in a helper file.
- Helper files must contain focused, named exports and must not contain HTTP request handling, database queries, React components, or provider-client calls.
- Create a dedicated helper file in the designated helper directory even when a helper is initially used by one file if it improves readability or is likely to be reused; do not mix helper implementation into the caller file.
- In both `Backend/src/back-end-helpers/` and `Frontend/src/front-end-helpers/`, add a multi-line JSDoc comment immediately above every helper function. The comment must state the function name, return value, parameters, and a short description of its purpose.

### Backend Error Handling Standard

- Keep backend error handling simple and avoid unnecessary abstractions.
- Use functional error objects, error-code types, and type guards for expected operational failures that need distinct HTTP responses.
- Place reusable error factories and type guards in `Backend/src/back-end-helpers/` and import them only where needed.
- Do not introduce custom error classes or an error-class hierarchy unless a concrete requirement cannot be expressed clearly with the functional approach.
- Validate every incoming request body, route parameter, and query parameter with `safeParse` before using it. After a successful validation check, immediately destructure `parsedRequest.data` and use those validated values instead of accessing `request.body` or repeating `parsedRequest.data.field`.
- Keep one surrounding `try/catch` for a controller operation. Do not put another `try/catch` inside it for each awaited call; let a rejected call reach the surrounding catch.
- Validate data at the boundary that reads it: PostgreSQL recipe rows in the repository and TheMealDB meal records in the provider client. Skip an individual recipe missing required details such as ingredients or cooking steps; do not treat an empty collection as a provider failure. Let failed requests and invalid top-level provider responses reach the surrounding error handler.
- Use inline `if` conditions and `throw new Error(...)` when a controller-owned result violates its contract. Do not repeat repository or provider-client validation in the controller.
- When a controller computes values that it passes in the response, declare those result variables with `let` in the request handler before the surrounding `try`, assign them inside the `try`, and then use them in the response. Give arrays explicit types when needed. Keep these variables inside the handler, never at module scope where requests could share them.

### Authentication and Sign-In Redirect Standard

- The backend decides who may access data. Protect every private API route (for example personal recipes, saves, reactions, reports, and submissions) with the `requireAuth` middleware, and read the signed-in user from `response.locals.authUser`. Never trust a user ID sent by the frontend.
- Admin routes must also use `requireRole('admin')` from `Backend/src/middleware/requireRole.ts` after `requireAuth`, which returns `403` for other roles.
- Community actions that need a confirmed email (submitting, rating, reporting) also use `requireVerifiedEmail`. Public routes that show extra details to signed-in users use `optionalAuth`.
- Rate-limit public account endpoints (sign-in, sign-up, emails, link confirmations) with the limiters in `Backend/src/middleware/rateLimits.ts`.
- Frontend sign-in gates and prompts only improve the experience; they never replace the backend check.
- When the frontend asks a user to sign in, send them to the login page with the current page as `redirect`, built with `buildLoginPath(currentPath)` from `Frontend/src/front-end-helpers/auth-redirect.helpers.ts`.
- After a successful sign-in (email or Google), return the user to that page. Pass every `redirect` value through `getSafeRedirectPath` (frontend and backend helpers) so only same-site paths are used and the app cannot be used as an open redirect.

```tsx
<Button
  type="primary"
  onClick={() => navigate(buildLoginPath(`${location.pathname}${location.search}`))}
>
  Sign in
</Button>
```

### Data Ownership Standard

- Every user-owned table has a `user_id` (or `author_user_id`) column with a foreign key to `users` and `ON DELETE CASCADE`.
- Repository queries for user-owned data always filter by the signed-in user's ID from `response.locals.authUser.id`, for example `.where({ id: itemId, user_id: userId })`. Never accept an owner ID from the request.
- When a user asks for another user's record, respond `404` (not found), not `403`, so record IDs cannot be probed.
- When the client creates record IDs (such as chat conversation IDs), check the existing owner before an upsert so one user can never overwrite another user's record.
- `table.timestamps(true, true, true)` creates camelCase `createdAt` and `updatedAt` columns; use those names in queries and indexes.
- Serialize arrays with `JSON.stringify` before writing them to `jsonb` columns; the `pg` driver otherwise sends JavaScript arrays as PostgreSQL arrays.

### Frontend Shared State Standard

- Share app-wide state, such as the signed-in user and saved recipes, through a React context instead of loading it separately in each component.
- Create the context object in `Frontend/src/context/`, the provider component in `Frontend/src/components/` (for example `CurrentUserProvider.tsx`), and a hook in `Frontend/src/hooks/` that reads it and throws when used outside the provider (for example `useCurrentUser`).
- Wrap providers around `<App />` in `main.tsx`. Data that belongs to one user must reload when `currentUser.id` changes and clear when the user signs out.
- Type API payloads at the call site with `ApiResponse<TData>` from `Frontend/src/types/interfaces/ApiResponse.ts`.

### TypeScript Declaration and Naming Standard

- Place imports first, followed by type declarations at the very top of the file.
- Put each named interface in its own dedicated file in both `Frontend/src` and `Backend/src`. Give component props specific names such as `DashboardPageProps` and import them into the component. Do not declare interfaces inside pages, components, clients, controllers, or helper files.
- Place top-level constant declarations immediately after type declarations, before functions and component definitions.
- Use `camelCase` for variables, functions, function parameters, and object properties.
- Use `PascalCase` only for interfaces, types, React components, and class names when a class is specifically required.
- Use `as const` for object and array literals that are intended to be read-only, such as static configuration, schemas, fixed options, and constant lookup values.
- Do not use `as const` for objects that must be updated or mutated during execution.
- For multiple asynchronous operations, use `async`/`await` in a `for...of` loop so each operation finishes before the next begins; do not use `Promise.all`.

### Schema Organization Standard

- Define Zod schemas in a dedicated `*.schemas.ts` file within the owning module, for example `Backend/src/modules/recipes/recipe.schemas.ts`.
- Import schemas into controllers, provider clients, repositories, or workflows that need runtime validation; do not define Zod schemas inline in those files.
- Keep inferred types and type aliases in the module's `*.types.ts` file when useful. Put every named interface in its own file and import it directly where needed.

### Frontend Component & Page Standard

- Do **NOT** use `React.FC` or `React.FunctionComponent`.
- Explicitly type props directly in the component parameter signature:
- Use `export default` for pages:

```tsx
import type { DashboardPageProps } from '../types/interfaces/DashboardPageProps';

const DashboardPage = ({ }: DashboardPageProps) => {
  return (
    // ...
  );
};

export default DashboardPage;
```

### Frontend Form State Standard

- Type form state with a named interface in its own file under `Frontend/src/types/interfaces/`, and pass it to `useState`, for example `useState<LoginForm>({ ... })`. Give every field an initial value.
- Attach `onChange` to the input control that fires it (`Input`, `Input.Password`, `Select`, `Checkbox`), never to `Form.Item`, which has no `onChange` prop.
- Update one field with the functional updater so each change builds on the latest state: `setForm((previousForm) => ({ ...previousForm, field: newValue }))`. Do not spread the current render's state variable, such as `{ ...userForm, name: value }`.
- Read the new value from the event that the control provides: `event.target.value` for text inputs and `event.target.checked` for checkboxes. `Select` passes the value directly.
- When the control is inside a `Form.Item` with a `name`, Ant Design already controls its `value`, so do not also set `value` from state. Use the form state only when the page needs the values before submit; otherwise read them from the `Form` `onFinish` values.

```tsx
const [userForm, setUserForm] = useState<LoginForm>({
  name: '',
  email: '',
  password: '',
  keepSignedIn: false,
});

<Input
  placeholder="Juan dela Cruz"
  autoComplete="name"
  onChange={(event) => setUserForm((previousForm) => ({ ...previousForm, name: event.target.value }))}
  style={styles.input}
/>

<Checkbox onChange={(event) => setUserForm((previousForm) => ({ ...previousForm, keepSignedIn: event.target.checked }))}>
  Keep me signed in
</Checkbox>
```

### Import Statement Standard

- Always write import statements inline on a single line; do not break named imports across multiple lines:

```tsx
import { ArrowLeftOutlined, ClockCircleOutlined, FireOutlined, HeartOutlined, HeartFilled, PlusOutlined } from '@ant-design/icons';
```

### JSX Prop Formatting Standard

- When a JSX element or component has two or more props, put each prop on its own line, indented one level deeper than the opening tag.
- Put the closing `>` or `/>` on its own line, aligned with the opening tag, and place the children on the lines between the opening and closing tags.
- Keep an element with zero or one prop on a single line, for example `<div style={styles.heading}>` or `<Checkbox style={styles.checkbox}>Keep me signed in</Checkbox>`.

```tsx
<Form.Item
  name="name"
  label="Name"
  rules={[{ required: true, message: 'Enter your name.' }]}
  style={styles.formItem}
>
  <Input
    placeholder="Juan dela Cruz"
    autoComplete="name"
    style={styles.input}
  />
</Form.Item>
```

### Frontend Styling Standard

- Use inline React styles in the owning `.tsx` file for component and page presentation.
- Define reusable style values as typed `CSSProperties` objects near the top of that file, then pass them through the `style` prop.
- Do not create or import `App.css`, page-level, or component-level CSS files for application presentation.
- Keep only genuinely global browser and theme rules in `index.css`.
- Write every `CSSProperties` object with one property per line, indented one level inside the braces, with no comma after the last property. Put the closing brace on its own line, aligned with the declaration.
- In a `Record<string, CSSProperties>` styles map, put each style key on its own line and format its object the same way.

```tsx
const avatarButtonStyle: CSSProperties = {
  width: 40,
  height: 40,
  minWidth: 40,
  padding: 0,
  borderRadius: '50%',
  border: `2px solid ${culinaryPalette.border}`,
  background: culinaryPalette.surface
};

const styles: Record<string, CSSProperties> = {
  heading: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6
  },
  formItem: {
    marginBottom: 16
  }
};
```

### Frontend Fetch Standard

- Prefer the native `fetch` API for ordinary backend requests. Do not introduce an HTTP client library or wrapper unless it solves a concrete repeated need.
- Keep a request flow direct and readable: set loading state, call `fetch`, parse JSON once, check both `response.ok` and the expected response data, then update state.
- Type the parsed API payload at the call site and show the API error message when one is supplied.
- Always clear loading state in `finally` and handle a non-`Error` thrown value with a safe fallback message.

```tsx
try {
  const apiResponse = await fetch('/api/v1/example', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  const response = await apiResponse.json() as ApiResponse;

  if (!apiResponse.ok || !response.data) {
    throw new Error(response.error?.message ?? 'Unable to complete the request.');
  }

  setData(response.data);
} catch (error) {
  setError(error instanceof Error ? error.message : 'Unable to complete the request.');
} finally {
  setIsLoading(false);
}
```

### Ant Design Component Standard

- Prefer an existing Ant Design component for interactive UI controls before creating a native HTML or custom equivalent.
- Use native HTML controls only when Ant Design does not provide a suitable component or when a documented accessibility requirement requires one.
- Keep Ant Design component styling aligned with the application's theme using supported component props and inline styles in the owning `.tsx` file.


