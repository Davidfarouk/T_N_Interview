# Tree Nation — X Visits = 1 Tree

A backend service that tracks customer shop visits and plants a virtual tree every X visits. Includes a live dashboard frontend.

---

## How It Works

A physical device at the shop entrance detects when a customer walks in and sends an HTTP event to this service. The service:

1. Records the visit and updates the customer's last-seen timestamp
2. Counts the customer's total visits
3. Every **X visits** (configurable), increments their tree counter
4. Exposes a dashboard showing live stats, a customer leaderboard, and a visit log

---

## Quick Start (Docker — recommended)

The fastest way to run the project. No Node.js installation required.

```bash
docker compose up --build
```

Then open **http://localhost:3000** in your browser.

To change the visits-per-tree threshold:

```bash
VISITS_PER_TREE=5 docker compose up --build
```

---

## Manual Setup (without Docker)

**Requirements:** Node.js 20+

```bash
# 1. Install dependencies
npm install

# 2. Start the development server (auto-restarts on file changes)
npm run dev
```

Then open **http://localhost:3000**.

**To run the production build:**

```bash
npm run build   # compiles TypeScript → dist/
npm start       # runs the compiled output
```

---

## Running Tests

```bash
npm test
```

Tests use an in-memory SQLite database — no file is created, nothing persists between runs.

```
✓ POST /customers > creates a customer and returns 201
✓ POST /customers > rejects an empty name with 400
✓ POST /customers > rejects a missing name with 400
✓ GET /customers  > returns an empty array when no customers exist
✓ GET /customers  > returns all created customers
✓ POST /visits    > returns 404 when customer does not exist
✓ POST /visits    > records a visit and returns correct totals
... (17 tests total)
```

---

## API Reference

Base URL: `http://localhost:3000`

Interactive documentation is available at **http://localhost:3000/docs** (Swagger UI).

---

### Customers

#### `POST /customers`
Create a new customer.

**Request body:**
```json
{ "name": "Alice" }
```

**Response `201`:**
```json
{ "id": 1, "name": "Alice", "createdAt": "2024-04-13T10:00:00.000Z" }
```

---

#### `GET /customers`
List all customers with their visit counts and trees planted.

**Response `200`:**
```json
[
  {
    "id": 1,
    "name": "Alice",
    "totalVisits": 9,
    "treesPlanted": 3,
    "lastSeenAt": "2024-04-13T14:00:00.000Z",
    "createdAt": "2024-04-13T10:00:00.000Z"
  }
]
```

---

#### `GET /customers/:id`
Get a single customer by ID.

**Response `200`:** Same shape as a single item in `GET /customers`.
**Response `404`:** `{ "message": "Customer not found", "statusCode": 404 }`

---

### Visits

#### `POST /visits`
Record a shop visit for a customer. This is the endpoint the physical device calls.

**Request body:**
```json
{ "customerId": 1 }
```

**Response `200`:**
```json
{
  "success": true,
  "treePlanted": true,
  "totalVisits": 3,
  "totalTrees": 1,
  "visitsUntilNextTree": 3
}
```

**Response `404`:** Customer not found.

---

#### `GET /visits`
List the 50 most recent visits with customer names.

**Query params:** `?limit=50` (max 200)

**Response `200`:**
```json
[
  {
    "id": 42,
    "customerId": 1,
    "customerName": "Alice",
    "visitedAt": "2024-04-13T14:00:00.000Z"
  }
]
```

---

### Stats

#### `GET /stats/hourly`
Returns visit counts aggregated by hour, newest first.

**Response `200`:**
```json
[
  { "hour": "2024-04-13 14:00", "visits": 12 },
  { "hour": "2024-04-13 13:00", "visits": 7 }
]
```

---

### Config

#### `GET /config`
Returns the current runtime configuration.

**Response `200`:**
```json
{ "visitsPerTree": 3 }
```

---

## Configuration

All settings are controlled via environment variables.

| Variable         | Default | Description                                  |
|------------------|---------|----------------------------------------------|
| `PORT`           | `3000`  | Port the server listens on                   |
| `VISITS_PER_TREE`| `3`     | How many visits before a tree is planted     |

Example:
```bash
PORT=8080 VISITS_PER_TREE=5 npm run dev
```

---

## Project Structure

```
src/
├── config/         # Environment variable parsing
├── db/             # Database connection and migrations
├── frontend/       # Single-page dashboard (HTML/CSS/JS)
├── plugins/        # Swagger documentation setup
├── repositories/   # All SQL queries — the only layer that touches the DB
├── routes/         # HTTP endpoint definitions
├── schemas/        # Request/response shape validation
├── services/       # Business logic (tree-planting rules)
├── tests/          # Integration tests
├── app.ts          # Builds the Fastify server (used by both server and tests)
└── server.ts       # Entry point — starts the server
```

The architecture follows a strict layered pattern:

```
HTTP Request → Route → Service → Repository → Database
```

Each layer has one job. Routes handle HTTP. Services handle business rules. Repositories handle SQL. Nothing crosses those boundaries.

---

## Assumptions

- **Customer identity is pre-known.** The physical device sends a `customerId` that already exists in the system. Customer registration is a separate flow handled via `POST /customers`.
- **Visit = entry only.** The device fires one event when the customer walks in. There is no check-out concept — duration is not tracked.
- **One shop.** The system is designed for a single shop. Multi-location support would require adding a `shopId` to visits.
- **Visits are always legitimate.** No deduplication is applied (e.g. a customer who walks in and out twice in a minute gets two visits). The physical device is assumed to handle this logic.
- **SQLite is sufficient.** For a single-shop deployment with low concurrent traffic, SQLite with WAL mode provides adequate performance. A migration to PostgreSQL would be needed for multi-server deployments.

---

## Technical Decisions

| Decision | Rationale |
|---|---|
| **Fastify** over Express | Faster, built-in schema validation via JSON Schema, native TypeScript support, Swagger integration with zero extra work |
| **SQLite** over PostgreSQL | Zero infrastructure setup, embedded in the process, sufficient for the scale described, WAL mode handles concurrent reads |
| **better-sqlite3** over node-sqlite3 | Synchronous API is simpler and faster for single-writer SQLite use cases |
| **Repository pattern** | All SQL is isolated in `repositories/`. Swapping the database only requires changing those files |
| **Transactions in visit processing** | Recording a visit and planting a tree are one atomic operation — if the server crashes mid-way, the data stays consistent |
| **Vanilla JS frontend** | The spec asks for "a simple frontend". No framework overhead, no build step, zero dependencies |
