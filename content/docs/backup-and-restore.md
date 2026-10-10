---
title: Backup and restore
description: Take a consistent backup and restore it into a fresh project.
---

A usable backup needs three things taken at the same moment: the database, the whole `shared_data` volume, and your deployment secrets. A database dump alone, or uploaded images alone, is not enough.

## Back up

1. Put the site in maintenance and stop every writer: Sanctuary, Resonance and any custom process that touches the database or `/data`. Keep PostgreSQL running.
2. Record private baselines now, after writers stop: source commit, image IDs, PostgreSQL major version, applied migration versions and checksums, row counts per table, and `/data` file paths with SHA-256 and UID/GID.
3. Run the helper with your real compose project name and a new, non-existing, private output directory:

```sh
docker compose -p illyaverse -f compose.yaml -f compose.production.yaml stop sanctuary resonance
node infra/recovery-backup.mjs --project illyaverse --output /private-backups/illyaverse-01 --writers-stopped
```

A complete backup contains `illyaverse.dump`, `shared-data.tar.gz` and `manifest.json` (`format` is `illyaverse-recovery-v1`, `complete` is `true`, artifact hashes verified). If any step fails, keep the partial directory for diagnosis, never reuse it, and retry in a new directory. Restart the services only after the manifest and hashes check out.

4. Store your `.env` and other secrets with the backup, privately: `POSTGRES_PASSWORD`, `SESSION_SECRET`, `INTERNAL_SERVICE_KEY`, `MAIL_ENCRYPTION_KEY` and any SMTP credentials. The queued email links can only be decrypted with the original `MAIL_ENCRYPTION_KEY`.
5. Caddy certificates (`caddy_data`, `caddy_config`) are separate. Stop Caddy and snapshot those two volumes if you want to keep them.

Backups contain accounts, queued mail and player files. Encrypt them and restrict access.

## Restore

Restore only into a **fresh** project, with a new empty PostgreSQL 17 and a new `shared_data` volume, on an isolated host with DNS, public ingress and Caddy off. If you find existing containers, volumes or data, stop; never use `--clean`, `down -v` or overwrite files to force it.

1. Verify the backup (`verifyBackup` in `infra/recovery-lib.mjs`) and load the exact Sanctuary image named in the manifest.
2. Start only PostgreSQL. Confirm the `public` schema has no tables.
3. Copy the dump in, check it with `pg_restore --list`, then restore with `--exit-on-error --no-owner --no-acl` and no `--clean`.
4. Extract `shared-data.tar.gz` into the new volume with numeric ownership preserved (the services run as `10001:10001`).
5. Compare migrations, row counts and the `/data` file list and hashes with your baselines before starting Sanctuary. `_sqlx_migrations` must match the versions and checksums of the source.
6. Start Sanctuary, Resonance and Serendipity from the images recorded in the manifest, and check both health endpoints.
7. Sign in with an original account and read a beatmap, a media file and a replay. Re-enable SMTP and traffic last.

Readiness alone does not prove the data is intact; row counts, file hashes and a real sign-in do.

## Practice on disposable data

```sh
node infra/disposable-recovery-drill.mjs --dry-run
ILLYA_ALLOW_DISPOSABLE_TEST=1 node infra/disposable-recovery-drill.mjs
```

The drill creates throwaway source and restore projects, takes a backup with the same helper, restores it and compares migrations, rows, sequences, schema, file hashes and ownership. A passing drill proves the procedure on test data, not that your own backup is good.
