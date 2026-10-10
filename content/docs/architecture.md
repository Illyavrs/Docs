---
title: Architecture
description: The services, how requests are routed, and where data lives.
---

Illyaverse splits the website, the community API, the game protocol and the launcher into separate pieces. The parent repository owns shared types, migrations and deployment; the five products keep their own histories as submodules.

```text
Browser ─────────┐
osu! stable ─────┤
lazer + bridge ──┴──> Caddy ──> Serendipity (website)
                          ├───> Sanctuary   (API, accounts, scores)
                          └───> Resonance   (game protocol)
Serendipity ──> Sanctuary          Resonance ──> Sanctuary
Sanctuary, Resonance ──> PostgreSQL 17 and shared /data
```

| Service     | Port    | Health                          | Responsibility                                                  |
| ----------- | ------- | ------------------------------- | --------------------------------------------------------------- |
| Serendipity | 3000    | `GET /`                         | Next.js website, three languages                                |
| Sanctuary   | 8080    | `/health/live`, `/health/ready` | Sessions, roles, beatmaps, media, scores, replays, chat, audit  |
| Resonance   | 8081    | `/health`                       | stable legacy endpoints, lazer OAuth and API v2 subset, SignalR |
| PostgreSQL  | 5432    | `pg_isready`                    | All persistent data and migration state                         |
| Caddy       | 80, 443 | `/healthz`                      | HTTPS, host and path routing, compression, upload limits        |

## Routing

- `/api/v1/*` and `/media/*` go to Sanctuary.
- `/web/*`, `/osu/*`, `/d/*`, `/oauth/*`, `/api/v2/*`, `/signalr/*`, `/spectator`, `/multiplayer`, `/metadata` and the game hosts go to Resonance.
- Everything else goes to Serendipity.

## Startup

Sanctuary connects to PostgreSQL, runs migrations, creates the optional bootstrap administrator and then listens. Compose waits for real readiness before starting Resonance, Serendipity and finally Caddy.

## Data and permissions

- `migrations/` is the schema's source of truth. `crates/illya-domain` holds domain types and validation; `crates/resonance-protocol` keeps wire code pure and testable. Queries are dynamic SQLx, so builds need no live database.
- Permissions come from role permission strings and are checked in Sanctuary at the API boundary; hidden UI is only presentation. Writes re-verify the actor's session, restriction and permission inside the transaction, and leave audit events.
- Browser mutations are checked against `PUBLIC_ORIGIN`. Sanctuary trusts forwarded headers only from the Caddy and Serendipity container addresses.
- Sanctuary and Resonance mount the same volume at `/data` (`media`, `maps`, `replays`) and both run as UID/GID `10001`. Nothing is served as a static directory; only API-defined routes read files.

## Clients

Players use Kaleidoscope with a saved HTTPS server URL. stable gets `-devserver <domain>` on port 443; lazer gets the Transfiguration bridge loaded before the game starts. Both refuse official `ppy.sh` hosts and never fall back to the official servers. See [Connecting players](./connecting-players.md) and [Kaleidoscope](./kaleidoscope.md).
