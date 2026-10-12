---
title: Status
description: What has been verified with real clients and what is still pending.
---

Passing automated tests is not the same as working in a real game client. This page separates the two.

## Verified by real play

- **stable and lazer**: sign-in, score submission, replay retrieval and chat.
- **lazer multiplayer**: room creation and playing a round.
- **Website**: registration, beatmap search and download, scores, profiles and rankings, checked by hand; chat, notifications and the admin tools are covered by automated browser tests.

## Covered by automated tests only

- stable encrypted score submission and replay binding.
- Historical official difficulty imports may omit `BeatmapID` and `BeatmapSetID`. Only the authenticated official API plus an exact original-file checksum and matching ruleset establish the canonical IDs in that case. Supplied IDs, including malformed or mismatched values, remain strictly checked. Original `.osu` bytes are never rewritten. Covered by resolver integration tests; affected real-client plays require deployment verification.
- Player replay resubmission: bounded `.osr` parsing and decompression, account and map binding, atomic private replay storage, idempotent retries and mandatory staff review. Offline lazer IDs are accepted only by the manual-review parser; native publication continues to require strict identity binding. These summaries are claims, not gameplay verification. Failed native replay accuracy falls back to legacy judgement counters when the partial maximum cannot be reconstructed. Resubmissions retain stable/lazer client identity and separate `submission_origin=replay`; normal native publication cannot approve them.
- Relax (RX) partitions, pp calculation and score conversion.
- Room score tokens, rounds and recovery after restart.
- Launcher guard, cleanup and compatibility rejection.

## Not verified yet

- Spectating on stable and lazer.
- Private messages in the game client.
- Replay playback inside the game.
- Launcher logout, restart and bridge clean-up as a full player checklist.
- Rooms: if a player quits mid-round, lazer still tries to submit that round and logs `room_score_token_revoked`. This is expected: aborted rounds are intentionally rejected and it does not affect scores.

## Release

- The launcher package is an **unsigned Debug build**. A signed Release build, a published release, signing keys and independent update feeds for the launcher and bridge are still to do.
- Release builds of the Rust workspace on Windows currently fail with a build-script error (Windows error 5, cause unknown). Debug builds and the Docker images are unaffected.
- Source has not been pushed to GitHub and a fresh recursive clone has not been tested.

## Reporting a problem

Include the client (stable or lazer), its exact version, the time, and for lazer the latest `runtime.log` and `network.log` with query strings removed.
