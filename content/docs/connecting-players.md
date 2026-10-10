---
title: Connecting players
description: What players do to connect, and what you must provide.
---

Players follow the **Connect** page on your site. This page explains what sits behind it.

## What you provide

- A public domain with working DNS and trusted HTTPS ([Deployment](./deployment.md)). Players never edit their hosts file on a public server.
- A download link for the launcher: set `KALEIDOSCOPE_DOWNLOAD_URL` to an HTTPS URL and recreate Serendipity. Until it is set, the Connect page tells players the link is not public yet.
- Working SMTP if you want email verification and password reset ([Configuration](./configuration.md)).

## How each client connects

| Client     | Method                                                                                                                                                                          |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| osu!stable | A shortcut with `-devserver <your-domain>` (root domain only, no scheme, path or port; always port 443), or the Kaleidoscope launcher                                           |
| osu!lazer  | Kaleidoscope launches the official install with the Transfiguration bridge. The beatmap library and game settings are reused; only sign-in data is stored separately per server |

Both paths reject official `ppy.sh` addresses, and a failed connection never falls back to the official servers.

## Supported lazer version

Transfiguration is built for exact stock files listed in the package's `compatibility.json` (currently `2026.1005.1-tachyon`, runtime 10.0.12). Matching version text is not enough if the file hashes differ. After a lazer update, ship a new launcher and bridge package; do not replace the DLL alone.

## Testing on one Windows PC

A local test server uses `illya.test`, which needs no purchased domain.

```powershell
.\infra\setup-client-test.ps1
docker compose --env-file .env.client-test.local -p illyaverse-client-test -f compose.yaml -f compose.client-test.yaml up -d --build --wait
```

This creates `.env.client-test.local`, uses its own volumes and network, and publishes only `127.0.0.1:80` and `443`. Caddy signs a local certificate for the root domain and the game hosts (`osu`, `c`, `ce`, `c4`, `api`, `spectator`, `bss`, `a`, `b`). You must:

1. Map those hostnames to `127.0.0.1` in your hosts file.
2. Export Caddy's public root certificate (`/data/caddy/pki/authorities/local/root.crt`) and trust it. Never export `root.key` or the whole Caddy volume.

`infra/connect-client-test.ps1` automates the check and the trust step. Kaleidoscope never edits hosts or installs certificates, and never skips TLS verification.

## Before opening registration

Test the exact stable and lazer versions you support: sign-in, chat, download, play, score submission and replay, multiplayer and reconnect. See [Status](./status.md) for what has already been verified.
