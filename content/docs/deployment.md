---
title: Deployment
description: Run Illyaverse with Docker Compose, with direct HTTPS or behind Cloudflare Tunnel.
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

## Quick start

Needs Docker Engine with Compose **2.24.4 or newer** and a checkout with all submodules.

```sh
sh infra/setup.sh   # creates .env with random secrets and an admin password
```

Then pick how the site reaches the internet:

| Situation                                              | Use                                                      |
| ------------------------------------------------------ | -------------------------------------------------------- |
| Local testing only                                     | `docker compose up -d --build --wait` (http://localhost:3000) |
| Public server with open ports 80/443                   | [Option A: direct HTTPS](#option-a-direct-https-without-cloudflare) |
| Behind NAT, or you want Cloudflare in front            | [Option B: Cloudflare Tunnel](#option-b-cloudflare-tunnel) |

Always pass the same `-f` files on every later `docker compose` command, or Compose will fall back to the local configuration.

## Option A: direct HTTPS (without Cloudflare)

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

## Option B: Cloudflare Tunnel

Use this when the host has no public IP or open ports, or you want Cloudflare's proxy in front. Caddy then speaks plain HTTP on the internal network, a `cloudflared` container connects out to Cloudflare, and no host ports are published. Do not combine this with `compose.production.yaml`.

1. Your domain must be a zone on Cloudflare, preferably the root domain (for example `example.com`). The free universal certificate covers one subdomain level, so `osu.example.com` works but `osu.illya.example.com` does not.
2. In Cloudflare Zero Trust, open Networks > Tunnels, create a Cloudflared tunnel, and copy the token (the long `eyJ...` string).
3. Add two Public Hostnames to the tunnel, both with service type `HTTP` and URL `caddy:80`:
   - the root domain (leave the subdomain empty)
   - `*` on the same domain (covers `osu`, `c`, `ce`, `c4`, `api`, `spectator`, `bss`, `a`, `b`)

   Cloudflare creates the matching proxied CNAME records. If a `*` record already exists, delete it first. Each record must point to `<tunnel-id>.cfargotunnel.com`; a record pointing at another tunnel returns error 1033.
4. In `.env` set `ILLYA_DOMAIN=example.com`, `PUBLIC_ORIGIN=https://example.com`, `COOKIE_SECURE=true` and `CLOUDFLARE_TUNNEL_TOKEN=<token>`. `ACME_EMAIL` is not used.
5. Start with the tunnel override, every time:

```sh
docker compose -f compose.yaml -f compose.tunnel.yaml config --quiet
docker compose -f compose.yaml -f compose.tunnel.yaml up -d --build --wait
```

`compose.tunnel.yaml` forces secure cookies, removes the local 3000 and 8081 port mappings, and starts `cloudflared` at a fixed address (`172.30.91.12`). `infra/Caddyfile.tunnel` disables ACME, trusts only that address, and reads the real player IP from `Cf-Connecting-Ip`. It forwards that as a single `X-Forwarded-For`, which Sanctuary and Resonance use for rate limits. Do not publish Caddy's port 80 as well, or clients could bypass Cloudflare.

Cloudflare's free plan limits request bodies to 100 MB; Caddy's upload limit (about 68 MB) is already below it. A host built for a small VM may lack the memory to compile the Rust and Next.js images; build them elsewhere and transfer them with `docker save | ssh <host> docker load`, then start with `up -d --no-build --wait`.

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
