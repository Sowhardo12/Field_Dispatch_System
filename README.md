# Dispatch System — Technician Allocation & Work Order Management

A backend service for dispatching work orders to technicians using automated classification, geolocation-based scoring, and asynchronous queue processing.

## Core Feature: Technician Allocation Algorithm

When a work order is dispatched, the system automatically finds and assigns the best available technician:

1. **Lock & Validate** — Worker picks up the job, opens a DB transaction, locks the work order row (`FOR UPDATE`), and confirms status is `DISPATCHED`.
2. **AI Classification** — Determines if the job is `universal` or requires a specific type (`electrician`, `plumber`, `hvac`, `appliance_repair`, `it_network`).
3. **Candidate Query** — Locks eligible technicians: all technicians for universal jobs, or type-matched + universal technicians otherwise.
4. **Scoring** — Each candidate scored on:
   - Distance from client (Haversine formula)
   - Current active workload (`OFFERED` / `IN_PROGRESS` count)
5. **Dynamic Sorting**:
   - Universal jobs → nearest first, then least busy
   - Specific jobs → least busy first, then nearest
6. **Assignment** — Top candidate assigned, work order set to `OFFERED`, transaction committed, WebSocket notification sent, connection released.

## Why a Message Queue (Bull)?

- **Non-blocking** — Assignment logic runs off the HTTP request cycle.
- **Concurrency** — `concurrency: 5` processes multiple assignments in parallel without overloading the DB.
- **Reliability** — Built-in retries handle transient failures (e.g., no technician available).
- **Scalability** — Absorbs spikes in work order volume without degrading API responsiveness.

## Work Order Lifecycle

| Step | Actor | Action | Status |
|---|---|---|---|
| 1 | Client | Creates order | `CREATED` |
| 2 | Admin/Dispatcher | Dispatches → added to queue | `DISPATCHED` |
| 3 | System (queue processor) | Assigns technician | `OFFERED` |
| 4 | Technician | Accepts (`/accept`) | `IN_PROGRESS` |
| 5 | Technician | Completes work | `COMPLETED` |
| 6 | Client/Admin | Closes order | `CLOSED` |

**Business rule:** A technician can only accept an order if its status is `OFFERED`; any other state throws an error.

## Supported Technician Types

```ts
export const ALLOWED_TECHNICIAN_TYPES = [
  'electrician',
  'plumber',
  'hvac',
  'appliance_repair',
  'it_network',
  'universal',
] as const;
```

## Supported Service Areas (Dhaka)

| Area | Latitude | Longitude |
|---|---|---|
| Dhanmondi | 23.7461 | 90.3742 |
| Gulshan | 23.7925 | 90.4078 |
| Banani | 23.7937 | 90.4047 |
| Mirpur | 23.8223 | 90.3654 |
| Uttara | 23.8759 | 90.3795 |
| Mohakhali | 23.7772 | 90.4005 |
| Badda | 23.7806 | 90.4267 |
| Farmgate | 23.7561 | 90.3872 |
| Motijheel | 23.7330 | 90.4172 |
| Old Dhaka | 23.7099 | 90.4071 |

## Getting Started

```bash
docker-compose up          # start Postgres + MongoDB containers
npm run start:dev          # start backend
```

Health check: `GET http://localhost:3000/api/v1/health`

### Testing

```bash
npm run test
npm run test:e2e           # if run twice, reset DB first: docker-compose down -v
```

### AI Test Script

```bash
cd <service-folder>
npx ts-node test-llm.ts
```

## Database Access

**Postgres**
```bash
docker exec -it dispatch_postgres psql -U postgres -d dispatch_db
\dt   # list tables
```

**MongoDB**
```bash
docker exec -it dispatch_mongodb mongosh
show dbs
use dispatch_db
show collections
db.dispatch_logs.find().pretty()
```

## Config Notes

- JWT token duration: `auth.service.ts` → `generateTokenPair()`
- `clientId` on order creation is extracted from the JWT payload via `@CurrentUser('id')` decorator (`common/decorator/current-user-decorator.ts`)

## API Reference

### Auth

**Register**

POST /api/v1/auth/register
Body: { "email": "...", "password": "...", "full_name": "...", "role": "CLIENT" | "ADMIN" | "DISPATCHER" | "TECHNICIAN" }


**Login**

POST /api/v1/auth/login
Body: { "email": "...", "password": "..." }


### Work Orders

| Action | Method & Route | Role |
|---|---|---|
| Create order | `POST /api/v1/work-orders` | CLIENT |
| Dispatch order | `PATCH /api/v1/work-orders/:id/dispatch` | ADMIN/DISPATCHER |
| Accept order | `PATCH /api/v1/work-orders/:id/accept` | TECHNICIAN |
| Submit execution log | `POST /api/v1/work-orders/:id/logs` | TECHNICIAN |
| Complete order | `PATCH /api/v1/work-orders/:id/complete` | TECHNICIAN |
| Close order | `PATCH /api/v1/work-orders/:id/close` | CLIENT/ADMIN |

**Create order**
```bash
curl -X POST localhost:3000/api/v1/work-orders \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"REPAIR AC","description":"AC unit blowing warm air."}'
```

**Dispatch**
```bash
curl -X PATCH localhost:3000/api/v1/work-orders/:id/dispatch \
  -H "Authorization: Bearer <token>"
```

**Accept**
```bash
curl -X PATCH localhost:3000/api/v1/work-orders/:id/accept \
  -H "Authorization: Bearer <token>"
```

**Submit log**
```bash
curl -X POST localhost:3000/api/v1/work-orders/:id/logs \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"checklists":["Power verified","Capacitor replaced"],"hardware_metadata":{"serial":"HVAC-9921","refrigerant":"R410A"},"technician_notes":"Replaced faulty dual-run capacitor."}'
```

**Complete**
```bash
curl -X PATCH localhost:3000/api/v1/work-orders/:id/complete \
  -H "Authorization: Bearer <token>"
```

**Close**
```bash
curl -X PATCH localhost:3000/api/v1/work-orders/:id/close \
  -H "Authorization: Bearer <token>"
```

## Known Issues & Fixes (Engineering Log)

- **`PG_CONNECTION` resolution failure** — NestJS couldn't reliably resolve constructor-injected dependencies for `PostgresService`. Fixed with an explicit factory provider (`inject: [PG_CONNECTION]`) to guarantee instantiation order.
- **`@CurrentUser` decorator bug** — `if (!request.use)` typo prevented `clientId` extraction; corrected to `if (!request.user)`.
- **Queue not processing dispatched orders** — Root cause was a raw SQL typo (`work-orders` instead of `work_orders`). Using an ORM (TypeORM/Prisma) would have caught this at compile time instead of silently failing at runtime.

## Current Allocation Limitation

The original allocation logic assigned technicians purely by least active workload, ignoring job type and location. This has since been replaced by the scored, type-aware, distance-weighted algorithm described above.