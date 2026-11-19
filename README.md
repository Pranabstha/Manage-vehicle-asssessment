# Manage Vehicle

A small vehicle telemetry system. A generator sends GPS pings to Kafka. The backend saves every ping to a TimescaleDB hypertable, keeps the latest one per vehicle in Redis, and serves both through an Express API that the React app reads.

```
generator ──▶ Kafka ──▶ backend consumer ──┬──▶ TimescaleDB (history) ──────┬──▶ Express API ──▶ React UI
                                           └──▶ Redis (latest per vehicle) ─┘
```

## Requirements covered

| Requirement                                    | Where                                                           |
| ---------------------------------------------- | --------------------------------------------------------------- |
| Consume telemetry from Kafka                   | `backend/src/consumers/vehicle_telemetry.consumer.ts`           |
| Store it in a TimescaleDB hypertable           | `backend/migrations/20261119062024_create_vehicle_telemetry.ts` |
| Cache each vehicle's latest telemetry in Redis | `backend/src/repositories/vehicle_telemetry.repository.ts`      |
| `GET /api/vehicles` with latest telemetry      | `backend/src/services/vehicle.service.ts`                       |
| `GET /api/vehicles/:id/telemetry?from&to`      | `backend/src/controllers/vehicle_telemetry.controller.ts`       |
| Vehicle CRUD                                   | `backend/src/routes/vehicle.routes.ts`                          |
| Table of vehicles with latest telemetry        | `frontend/src/VehiclesTable.tsx`                                |
| Telemetry history drawer                       | `frontend/src/VehicleDetail.tsx`                                |
| Create and update form                         | `frontend/src/VehicleForm.tsx`                                  |
| Compose: backend, frontend, DB, Kafka, Redis   | `docker-compose.yml`                                            |
| Sample telemetry generator                     | `generator/index.ts`, run as the `generator` service in Compose |

---

## Quick start

**Requirements:** Docker with Compose.

The whole project starts with one command from the repo root. First copy `.env.example` to `.env`, which holds the database credentials and ports, then build and start every service with Docker Compose. The first build takes a few minutes, and once the backend logs that it is listening, the app is ready at http://localhost:5132.

```bash
cp .env.example .env
docker compose up --build
```

To stop it, press `Ctrl+C` or run `docker compose down`. There are no volumes, so `down` also clears the database, and the next start begins again with the five sample vehicles.

| Service                | URL / port                |
| ---------------------- | ------------------------- |
| Frontend               | http://localhost:5132     |
| Backend API            | http://localhost:8000/api |
| Postgres (TimescaleDB) | `localhost:5433`          |
| Kafka                  | `localhost:9094`          |
| Redis                  | `localhost:6379`          |

On start, the backend runs the migrations and seeds five sample vehicles. The generator then sends a ping for each vehicle every **5 seconds**.

## Using the app

Open http://localhost:5132.

- **Vehicles table:** shows each vehicle's latest speed, location and update time refreshed every 5 seconds.
- **Add vehicle / Edit:** "Add vehicle" and each row's **Edit** link open the same form.
- **Delete:** asks for confirmation first, because it also removes the vehicle's history.
- **View:** opens a drawer with the vehicle's details, its latest ping, and its telemetry history for a time range you pick (the last hour by default). If the range ends at the current time, it moves forward as new pings arrive. History is shown ten rows per page and fetched from the API one page at a time.

## API

| Method   | Path                                               | Notes                                                                                 |
| -------- | -------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `GET`    | `/api/vehicles`                                    | All vehicles, each with `latest_telemetry` from Redis (`null` before its first ping). |
| `GET`    | `/api/vehicles/:id`                                | One vehicle.                                                                          |
| `POST`   | `/api/vehicles`                                    | Body: `{ "registration": "ABC-123", "name": "Hino 500" }`                             |
| `PUT`    | `/api/vehicles/:id`                                | Same body as `POST`.                                                                  |
| `DELETE` | `/api/vehicles/:id`                                | Also deletes its telemetry and Redis entry.                                           |
| `GET`    | `/api/vehicles/:id/telemetry?from&to&limit&offset` | History, newest first. See below.                                                     |

### Telemetry history parameters

Returns `{ items, total, limit, offset }`.

| Parameter | Default      | Notes                    |
| --------- | ------------ | ------------------------ |
| `from`    | one hour ago | Optional, ISO 8601 time. |
| `to`      | now          | Optional, ISO 8601 time. |
| `limit`   | `100`        | Maximum `1000`.          |
| `offset`  | `0`          |                          |

## Tests

```bash
cd backend && npm test
```

Unit tests cover the telemetry message, vehicle input, id and paging parsers, using Node's built-in test runner.

## Running services outside Docker

**Requirements:** Node 24 or later, since the backend and generator load `.ts` files directly. All three apps read the root `.env`.

1. Start the infrastructure in Docker:

   ```bash
   docker compose up -d postgres kafka redis
   ```

2. Run each app with npm, each in its own terminal:

   ```bash
   # Backend
   cd backend
   npm install
   npm run migrate:latest
   npm run seed:run
   npm run dev
   ```

   ```bash
   # Generator
   cd generator
   npm install
   npm start
   ```

   ```bash
   # Frontend
   cd frontend
   npm install
   npm run dev
   ```

The Vite dev server runs on http://localhost:5173 and proxies `/api` to the backend.

## Project layout

| Path               | Description                                                                                                                                                                                                         |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `backend/`         | Express 5 and TypeScript, split into `routes`, `controllers`, `services` and `repositories`. `consumers/` plays the role of a controller for Kafka messages.                                                        |
| `generator/`       | One Node script that publishes sample telemetry.                                                                                                                                                                    |
| `frontend/`        | Vite, React 19 and Ant Design 6. `VehiclesTable.tsx` is the page, with `VehicleForm.tsx` and `VehicleDetail.tsx` (the history drawer) opened from it. In Docker, nginx serves it and proxies `/api` to the backend. |
| `shared/types/`    | The API's JSON types, shared by all three apps.                                                                                                                                                                     |
| `shared/limits.ts` | The validation limits and the history page size cap, so the form and the API always agree.                                                                                                                          |

## Design notes

### Latest telemetry in Redis

The latest ping for each vehicle is stored in one Redis hash, `vehicle_latest_telemetry`, with the vehicle id as the field. Listing vehicles is then one Postgres query plus one `HGETALL`.

The list itself comes from Postgres, and Redis only fills in `latest_telemetry`, so a leftover cache entry can't bring back a deleted vehicle.

### Hypertable primary key

The hypertable's primary key is `(vehicle_id, ts)`. TimescaleDB requires the time column in any unique key anyway, and it also means a message Kafka delivers twice is simply ignored on insert.

### Message validation

The consumer checks every message before writing it. If Postgres rejected a message, kafkajs would retry it forever and nothing behind it on that partition would get processed.

Bad JSON, a timestamp that isn't ISO 8601, out-of-range coordinates, a negative speed, an id too large for Postgres and telemetry for a vehicle that doesn't exist are all logged and skipped.

### Message ordering

The generator uses the vehicle id as the Kafka message key. Kafka keeps messages in order within a partition, which is what makes the simple "overwrite the latest" update in Redis safe.

### New vehicles

The generator asks the API for the vehicle list every tick, so a vehicle created in the UI starts reporting on the next tick, within 5 seconds.

### Zero-setup startup

Migrations and the seed run when the backend container starts, so a fresh `docker compose up` needs no manual setup.

### Frontend data fetching

The vehicles page calls `GET /api/vehicles` when it loads and again every 5 seconds, the generator's default interval, so the latest telemetry columns keep up with new pings. The endpoint reads one Redis hash plus the vehicles table, so polling it is cheap at this fleet size. After a save or delete, the list is updated from the API response straight away instead of waiting for the next refresh, and the drawer fetches history when it opens, when the range changes, and when a new ping moves a range that ends at the current time.

## Assumptions

Most ManageVehicle customers run small fleets of roughly 5 to 50 vehicles, so I seeded five vehicles (three trucks, a bus and a van) around the state capitals, with speeds up to 100 km/h. There is only one customer, so there is no login and no company separation.

The registration (number plate) is unique per vehicle and works as its natural identifier. It is stored in upper case, so `abc-123` and `ABC-123` count as the same vehicle. `ts` is when the device took the reading, everything is stored in UTC, and speed is in km/h.

The brief's `GET /api/vehicles//telemetry` is read as `GET /api/vehicles/:id/telemetry`. `from` and `to` are optional and default to the last hour, and I added `limit` and `offset` so a long range can't return an unbounded response. "Basic CRUD" means create, read one, update and delete. Deleting a vehicle also deletes its telemetry (`ON DELETE CASCADE`) and its Redis entry.

The brief allows either a detail page or a drawer. I used a drawer, as there is little information to display.

## Potential improvements

### Multi-tenancy

ManageVehicle is a SaaS service, thus each customer organization has its own account. A real version would have a companies table and a company_id column on vehicles and vehicle_telemetry, which would be indexed first by company_id, as well as a login with token which contains the user's company_id, allowing every repository query to filter on it. Registration would become unique to each firm, the Redis hash would be divided by company, and Postgres row-level security on both tables would serve as a backup in the event that a query missed the filter. Devices would also authenticate while providing telemetry, and the consumer would verify that the vehicle belonged to the company.

### Data and pipeline

TimescaleDB retention and compression policies should be enabled. Work diary recordings are subject to legal requirements, thus old pings must be retained, but they do not need to be uncompressed. Redis should only be updated when the incoming `ts` is newer, most likely via a simple script, because a late message might replace a newer one. Invalid messages should be moved to a dead-letter topic rather than just being logged. To improve performance, history paging should utilize a cursor on ts instead of offset because Postgres still reads and discards every missed row, resulting in slower deep pages over large ranges.

### Product

The vehicles table polls the API every 5 seconds. With many users or large fleets, new pings should be pushed to the UI over WebSockets or SSE instead. Speeding and fatigue alerts would be a natural next feature, because they fit what the product already does around compliance and work diaries.

### Robustness and testing

The generator's fetch has no timeout, so a hung backend would stall it. The parsers have unit tests, but the services and the frontend don't, and one end-to-end test should run the whole pipeline in Compose to check that a ping reaches both Postgres and Redis.

### Production

Postgres needs a volume, because right now the data is lost on `docker compose down`. Kafka should have more partitions so several backend instances can share the load, and Redis, the backend and the generator should have health checks like Postgres and Kafka do. Hosting would most likely be AWS Sydney, so customer data stays in Australia.
