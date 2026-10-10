---
title: Deployment
description: Run Illyaverse on your own domain with automatic HTTPS.
---

The default Compose file runs the site and API locally. Production adds your DNS and HTTPS through an override file.

## Volumes

| Volume          | Contents                                                                         |
| --------------- | -------------------------------------------------------------------------------- |
| `postgres_data` | PostgreSQL 17 data                                                               |
| `shared_data`   | `/data/media`, `/data/maps`, `/data/replays` (shared by Sanctuary and Resonance) |
| `caddy_data`    | TLS certificates and ACME state                                                  |
| `caddy_config`  | Caddy runtime config                                                             |

Do not change only the PostgreSQL image tag to upgrade a major version; existing data would not be upgraded.

## Production domain and HTTPS

1. Set `ILLYA_DOMAIN` and `ACME_EMAIL` in `.env`.
2. Point A/AAAA records for the root domain and these subdomains at the host: `osu`, `c`, `ce`, `c4`, `api`, `spectator`, `bss`, `a`, `b`. Publish IPv6 only if it really reaches the host.
3. Allow TCP 80 and 443 (UDP 443 for HTTP/3).
4. Start with both Compose files, every time:

```sh
docker compose -f compose.yaml -f compose.production.yaml config --quiet
docker compose -f compose.yaml -f compose.production.yaml up -d --build --wait
```

The production override removes the local 3000 and 8081 port mappings, publishes only Caddy on 80/443, and forces `PUBLIC_ORIGIN=https://<ILLYA_DOMAIN>` with secure cookies. Caddy obtains and renews certificates; it needs working DNS and a persistent `caddy_data` volume.

Browsers should always use the root domain. The game hosts (`osu.`, `c.`, `ce.`, `c4.`, `api.`, `spectator.`, `bss.`, `a.`, `b.`) route to the game protocol service.

## Optional documentation site

This documentation site is its own repository (`apps/docs`, a submodule) and is not part of the Illyaverse Compose stack. Build and run it separately, behind any reverse proxy:

```sh
docker build -t illyaverse-docs apps/docs
docker run -d -p 3000:3000 illyaverse-docs
```

## Updating

Back up first ([Backup and restore](./backup-and-restore.md)). Then pull the new source and run the same `up -d --build --wait` command with the same `-f` files. `docker compose down` keeps volumes; `down -v` deletes your data.

Migrations in `migrations/*.sql` must stay UTF-8 without BOM and LF line endings. Applied migrations must never be edited; add a new version instead. A changed checksum stops startup with a version mismatch. If that happens, stop, keep your backups and the original source, and do not edit `_sqlx_migrations`.

## Health checks

```sh
docker compose logs --tail 100 sanctuary resonance serendipity caddy
docker compose exec sanctuary curl --fail http://127.0.0.1:8080/health/ready
docker compose exec resonance curl --fail http://127.0.0.1:8081/health
```

Both endpoints read the database, so a passing check means data access works.

## Scaling

Media storage is single-host. To run more than one replica you first need shared object storage and a shared transport for rate limits and chat events.
