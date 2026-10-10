---
title: Configuration
description: Every environment variable the stack reads.
---

Set these in `.env` (never commit it). `infra/setup.ps1` and `setup.sh` generate the secrets for you.

## Required

| Variable                     | Purpose                                                                                                  |
| ---------------------------- | -------------------------------------------------------------------------------------------------------- |
| `POSTGRES_PASSWORD`          | Database password. Keep the generated hex; unescaped symbols such as `@` or `:` break the connection URL |
| `SESSION_SECRET`             | At least 32 bytes; signs website sessions. Changing it signs everyone out                                |
| `INTERNAL_SERVICE_KEY`       | Trust between Resonance and Sanctuary                                                                    |
| `PUBLIC_ORIGIN`              | Origin browsers use. Production forces `https://<ILLYA_DOMAIN>`                                          |
| `COOKIE_SECURE`              | `false` for local HTTP, forced `true` in production                                                      |
| `ILLYA_DOMAIN`, `ACME_EMAIL` | Production domain and ACME contact                                                                       |

## Accounts and mail

| Variable                         | Purpose                                                                                                                |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `BOOTSTRAP_ADMIN_*`              | Creates the first administrator. Clear after first use                                                                 |
| `SMTP_HOST`, `SMTP_FROM`         | Enable email verification and password reset                                                                           |
| `SMTP_USERNAME`, `SMTP_PASSWORD` | Set both or neither                                                                                                    |
| `SMTP_TLS`, `SMTP_PORT`          | STARTTLS on 587 by default; `implicit` uses 465                                                                        |
| `MAIL_ENCRYPTION_KEY`            | Independent 64-character hex key that encrypts queued links. Back it up privately; a new key cannot read the old queue |
| `MAIL_ALLOW_LOCAL_DEV`           | Isolated loopback mail testing only. Keep `false`                                                                      |

Without SMTP, verification and password reset show as unavailable; registration and sign-in still work. After changing mail settings run `docker compose up -d --force-recreate sanctuary`. Reset links last 15 minutes and verification links 24 hours.

## Optional features

| Variable                             | Purpose                                                                          |
| ------------------------------------ | -------------------------------------------------------------------------------- |
| `OSU_CLIENT_ID`, `OSU_CLIENT_SECRET` | Official osu! API credentials for official beatmap search and metadata           |
| `OSU_API_INTERVAL_MS`                | Minimum delay between official API requests (default and minimum 1000)           |
| `KALEIDOSCOPE_DOWNLOAD_URL`          | Public HTTPS link to the launcher package; shows a download button on `/connect` |
| `RUST_LOG`                           | Log filter                                                                       |

## Network

The bridge subnet defaults to `172.30.91.0/24` (Caddy `.10`, Serendipity `.11`). Sanctuary trusts forwarded headers only from those two addresses and Resonance only from Caddy. If the subnet collides with your network, change the subnet, both `ipv4_address` values and `TRUSTED_PROXY_CIDRS` on both Rust services together. Never list all external sources as trusted proxies.

## Local development

```sh
docker compose -f compose.yaml -f compose.dev.yaml up -d postgres
```

PostgreSQL then listens on `127.0.0.1:15432` for host-side tests and `npm run dev`.
