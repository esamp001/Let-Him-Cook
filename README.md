# AI Cooking Assistant — Product Requirements (MVP)

## 1. Product Overview

### Working concept
An AI-powered cooking assistant that helps people decide what to cook using ingredients they already have, find a relevant cooking tutorial, and create a shopping list for anything missing.

### Problem
People often have only a limited set of ingredients at home and don't know:
- What meals they can make with what they have.
- Which recipe best fits their preferences, time, budget, and equipment.
- How to cook the selected meal.
- Which additional ingredients they need to buy.

### Product vision
Help users go from **“What can I cook with what I have?”** to **“I know what to cook, how to make it, and what I need to buy.”**

### Product approach
AI should be central to the user experience, but it should not be responsible for every operation. Use AI to understand the user's situation and personalize recommendations; use reliable data sources and deterministic backend logic for recipe retrieval, video lookup, ingredient comparison, and shopping-list calculations.

---

## 2. Target User Experience

The experience should feel like chatting with a helpful cooking assistant—not filling out a long recipe search form.

### Example conversation

**User:**
> I have chicken and potatoes in my refrigerator. I don't want anything spicy, and I only have ₱100 to spend on additional ingredients. What can I cook?

**AI assistant:**
- Understands the available ingredients.
- Records the no-spicy preference.
- Takes the additional-ingredient budget into account.
- Recommends suitable recipes.
- Explains why each recipe fits.
- Shows what ingredients the user already has and what is missing.

**User:**
> I don't have onions or garlic. Can you suggest something else?

**AI assistant:**
- Uses the existing conversation context.
- Updates the available ingredients.
- Re-ranks recipes or suggests reasonable adaptations.
- Avoids requiring ingredients the user has said they do not have, unless clearly marked as items to buy.

**User:**
> I'll make the chicken and potato soup.

**AI assistant:**
- Retrieves the selected recipe's ingredient list and instructions.
- Finds relevant cooking videos.
- Shows recipe details and a suitable video.
- Creates a shopping list containing only missing ingredients.
- Checks the estimated additional cost against the user's budget when price data is available.

---

## 3. Core Features

### 3.1 Conversational ingredient input
Users can describe their situation in natural language.

Examples:
- “I have chicken, potatoes, and eggs.”
- “I need a cheap dinner for two.”
- “I don't want anything spicy.”
- “I only have 20 minutes.”
- “I don't have an oven.”
- “Can I replace coconut milk?”

The system should extract and maintain relevant details:
- Available ingredients and quantities, when supplied.
- Ingredients the user does not have.
- Dietary restrictions and preferences.
- Disliked ingredients.
- Budget and currency.
- Number of servings.
- Time available.
- Cooking equipment.
- Meal type or cuisine preference.

Do not require the user to provide every detail. Ask a short follow-up question only when a missing detail materially affects the recommendation.

### 3.2 AI-assisted recipe discovery
Recommend recipes that fit the user's ingredients and constraints.

Each recommendation should show:
- Recipe name and image, when available.
- Short description.
- Estimated preparation and cooking time.
- Difficulty, when known.
- Ingredients already available.
- Missing ingredients.
- Why the recipe was recommended.
- Source or provenance of recipe data.

Rank recipes using factors such as:
1. Compatibility with dietary restrictions and explicit dislikes.
2. Availability of required ingredients.
3. Fit with budget, cooking time, and equipment.
4. User preferences and requested meal type.

Explicit safety restrictions must not be overridden to improve a match score.

### 3.3 Recipe details
When a user selects a recipe, show:
- Ingredient names and quantities.
- Clear preparation and cooking steps.
- Serving size.
- Estimated time.
- Relevant notes and substitutions, if supported by reliable information.
- Recipe source.
- A relevant cooking tutorial.

Clearly distinguish required ingredients from optional ingredients.

### 3.4 Cooking-video discovery
Search for existing cooking videos that match the selected recipe.

Possible implementation:
- Use the YouTube Data API to search for videos.
- Search with the recipe name and relevant terms.
- Rank results using available metadata and AI assistance if useful.
- Display title, channel, thumbnail, and link or embedded player where permitted.

Important:
- A video is a cooking reference, not automatically a verified recipe source.
- Do not claim that a video contains a complete ingredient list unless that information has actually been checked.
- Do not assume every video description contains accurate quantities or instructions.
- If no good match is found, say so and offer another search or a verified written recipe.

### 3.5 Shopping-list generation
Compare the selected recipe's structured ingredient list against the user's inventory.

Show:
- **Already have:** ingredients that are available.
- **Need to buy:** required ingredients that are missing.
- **Optional:** ingredients that are not essential.
- Quantities needed, where known.
- Estimated cost, only when supported by price data.

The backend should perform ingredient comparisons and quantity calculations. AI can help normalize ingredient names and suggest substitutions, but should not be the sole source of arithmetic.

Handle equivalent ingredient names carefully (for example, “scallions” and “spring onions”). Do not assume two ingredients are interchangeable when the difference could materially affect the dish.

### 3.6 Conversational refinement
Users should be able to refine results without restarting:
- “Make it cheaper.”
- “Give me something faster.”
- “I don't have an oven.”
- “Use only the ingredients I already have.”
- “Can I substitute this ingredient?”
- “Make it less salty.”

Maintain the relevant conversation state and update the recommendations accordingly.

---

## 4. AI vs. Traditional Application Logic

AI is a core part of the experience, but different tasks should use the most reliable approach.

| Task | Recommended approach | Reason |
|---|---|---|
| Understand natural-language requests | AI | Interprets flexible wording and multiple constraints |
| Extract ingredients, budget, preferences, and time | AI with structured output | Converts conversation into usable data |
| Retrieve candidate recipes | Recipe database/API | Provides real, traceable recipe records |
| Rank and explain recipe recommendations | Hybrid: application rules + AI | Combines predictable constraints with personalization |
| Find YouTube videos | YouTube Data API/search | Retrieves actual videos |
| Assess video relevance | Metadata/rules, optionally AI | Helps identify videos that fit the selected recipe |
| Compare owned and required ingredients | Backend code | Predictable and testable |
| Calculate missing quantities and totals | Backend code | Avoids unreliable free-form arithmetic |
| Suggest substitutions | AI, grounded in recipe data | Supports flexible requests; must account for allergies and cooking behavior |
| Recognize ingredients in photos | Vision-capable model, later phase | Useful enhancement, not required for the MVP |

### Guiding principle
**AI interprets and recommends. The application retrieves, verifies, calculates, and presents.**

Do not use an LLM call for every simple operation if regular code can do it more reliably and cheaply.

---

## 5. Recommended Technical Design

The architecture should allow the AI provider and recipe data source to change without requiring a complete rewrite.

### High-level flow

```text
Web / Mobile-Friendly Chat Interface
                 |
                 v
             Backend API
                 |
                 v
        AI Conversation Layer
     - Interpret user intent
     - Extract constraints
     - Maintain conversation context
     - Request recipe recommendations
                 |
                 v
       Recipe Retrieval Layer
     - Search recipe database/API
     - Return structured recipe records
                 |
                 +--------------------+
                 |                    |
                 v                    v
       Recommendation Logic     Video Search
       - Apply hard constraints  - YouTube Data API
       - Score recipe matches    - Find relevant videos
       - Rank candidates         - Return video metadata
                 |
                 v
       Recipe Detail Response
                 |
                 v
       Shopping-List Calculator
       - Compare inventory
       - Calculate missing items
       - Estimate cost if data exists
                 |
                 v
       Results shown to the user
```

### Suggested backend responsibilities
- API routes and request validation.
- AI provider integration.
- Conversation state management.
- Recipe search and normalization.
- Recommendation ranking and hard-constraint checks.
- YouTube search integration.
- Inventory and shopping-list calculations.
- Error handling, rate limiting, and logging.
- Secrets and API keys stored on the server, never in frontend code.

### Suggested data entities
A first version may need records representing:

**User pantry**
- Ingredient ID/name.
- Quantity and unit, if known.
- Optional expiration date.
- User confirmation status.

**Recipe**
- ID and title.
- Description.
- Ingredients with quantities and units.
- Required vs. optional ingredients.
- Instructions.
- Preparation and cooking time.
- Servings.
- Dietary/allergen metadata, if verified.
- Source and attribution details.

**Video**
- Video ID and URL.
- Title and channel.
- Thumbnail.
- Source metadata.
- Associated recipe and relevance status, where known.

**Conversation/session**
- User's current ingredients.
- Constraints and preferences.
- Selected recipe.
- Recent conversation context.

These are conceptual entities, not a final database schema. The actual schema should reflect the selected recipe source, application stack, and data licensing requirements.

---

## 6. Recipe Data Strategy

Recipe quality is one of the product's most important dependencies.

For the MVP:
1. Choose a recipe API or a small curated recipe collection.
2. Confirm its license, attribution rules, pricing, quotas, and commercial-use terms.
3. Store or cache recipe information only where the source's terms permit it.
4. Preserve source links and attribution.
5. Use structured ingredients and instructions wherever possible.
6. Treat AI-generated adaptations as suggestions, not as verified source recipes.
7. Clearly identify which information is sourced, estimated, or AI-generated.

Do not assume a YouTube video provides complete, accurate, structured recipe information. Use a separate recipe record as the source of the ingredient list and shopping calculations whenever possible.

---

## 7. Budget and Price Handling

A user may say they can spend ₱100 on missing ingredients.

The app should:
- Keep the user's existing ingredients separate from their additional budget.
- Calculate which required items are missing.
- Estimate costs only when current, geographically relevant price data is available.
- Show that prices are estimates and can vary by store and location.
- Avoid promising that a recipe fits the budget if price information is unavailable or incomplete.
- Offer lower-cost alternatives when appropriate.

Do not let the language model invent local prices and present them as verified prices.

---

## 8. Food Safety and Trust

Because the product involves food, safe and transparent recommendations matter.

- Ask users to confirm uncertain ingredient identifications.
- Do not claim food is safe based only on appearance or smell.
- Support food-storage and expiration reminders only with appropriate safety guidance.
- Treat allergies as hard constraints, not preferences that can be ignored.
- Flag possible allergens when reliable recipe data provides them.
- Avoid unsupported claims that a substitution is safe for a specific allergy.
- Provide safe cooking guidance for meat and other higher-risk foods.
- Clearly distinguish verified recipe instructions from AI-generated advice.
- If information is uncertain, say so rather than inventing details.

---

## 9. MVP Scope

### Build first
1. Conversational ingredient and preference input.
2. AI extraction of ingredients and constraints into structured data.
3. Recipe retrieval from a reliable, structured source.
4. Recipe ranking based on ingredient match and user constraints.
5. Recipe detail view with source and instructions.
6. YouTube video search for a selected recipe.
7. Shopping-list generation based on missing ingredients.
8. Follow-up conversation that updates recommendations.
9. Loading, empty, and error states.
10. Basic tests for ingredient matching, hard constraints, quantities, and shopping-list calculations.

### Defer until later
- Photo recognition of an entire refrigerator.
- Voice conversations.
- Automatic grocery ordering.
- Nutrition and calorie planning.
- Advanced meal calendars.
- Social features and shared pantries.
- Complex personalization based on long-term user behavior.
- Real-time price comparison across many stores.

The first release should prove that users can successfully move from ingredients to a suitable recipe, a useful tutorial, and a correct shopping list.

---

## 10. Success Metrics

Measure whether the product solves the user's problem, not just whether people send messages to the AI.

Potential MVP metrics:
- Percentage of ingredient searches that produce useful recipe results.
- Percentage of users who select a recommended recipe.
- Percentage who open a suggested cooking video.
- Percentage who generate or use a shopping list.
- Rate of recipe results rejected due to missing ingredients or violated preferences.
- User-reported usefulness and recipe accuracy.
- AI cost per successful recipe discovery.
- Response time and API error rate.
- Return usage over time.

---

## 11. Suggested Development Plan

### Phase 1 — Define and validate
- Confirm target users and main use cases.
- Design the conversational flow and recipe result cards.
- Select a recipe data source.
- Define what counts as a successful recipe match.

### Phase 2 — Build the core experience
- Create the responsive web interface.
- Implement backend API routes.
- Integrate an AI model for structured intent extraction.
- Retrieve and rank existing recipes.
- Show recipe details and missing ingredients.

### Phase 3 — Add videos and shopping lists
- Integrate YouTube search.
- Associate videos with selected recipes.
- Implement inventory comparison and shopping-list calculations.
- Add price estimates only if a suitable data source is available.

### Phase 4 — Test and improve
- Test natural-language requests with varied ingredients and constraints.
- Test no-result and API-failure cases.
- Verify recipe source attribution and data permissions.
- Test allergy and other hard constraints.
- Track cost, latency, and user success.
- Improve recommendations based on real user feedback.

### Phase 5 — Expand based on evidence
- Add photo recognition, saved pantry, personalization, or native mobile features only when user feedback supports them.

---

## 12. Product Principles

1. **Conversation first:** Users should be able to explain their situation naturally.
2. **Use what they have:** Prioritize ingredients already available.
3. **Be honest:** Distinguish verified facts, estimates, and AI-generated suggestions.
4. **Real recipes and videos:** Do not fabricate sources or imply a video was verified when it was not.
5. **Practical shopping lists:** Calculate missing ingredients from structured data.
6. **Respect constraints:** Allergies, dislikes, equipment, time, and budget should influence recommendations.
7. **Affordable to operate:** Use AI where it adds value and deterministic code for predictable tasks.
8. **MVP before complexity:** Validate the core workflow before building advanced features.

---

## 13. One-Sentence Product Definition

**An AI cooking assistant that understands what you have, finds recipes you can realistically make, connects you to relevant cooking tutorials, and tells you exactly what ingredients you still need.**
