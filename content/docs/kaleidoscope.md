---
title: Kaleidoscope launcher
description: What the launcher does, how it handles lazer data, and how to build it.
---

Kaleidoscope is a Windows GUI launcher. It starts stable or lazer against your server, shows status, and cleans up the temporary bridge it loads into lazer.

## Server URL

Players enter an HTTPS base URL such as `https://your-illyaverse.example`: a full ASCII DNS name with no credentials, path, query or fragment. IP addresses, single-label hosts, trailing dots and `ppy.sh` names are rejected. lazer may use a custom HTTPS port; stable always uses 443, so the launcher disables stable for other ports.

The URL is captured at launch. Changing it affects the next launch only. If the bridge is missing, incompatible or the connection fails, the launcher stops; it never switches to the official servers.

## lazer data

- The launcher reuses the installed game's beatmap library (`client.realm`, `files`) and game settings (`game.ini`). It detects normal, portable and `storage.ini` locations and stops if it cannot confirm one safely, rather than creating an empty library.
- Only seven sign-in values are stored separately, in `auth.illyaverse.json` in the same data folder and keyed by server origin: `Username`, `Token`, `SaveUsername`, `SavePassword`, `WasSupporter`, `UserOnlineStatus`, `PMFriendsOnly`. Switching servers never reuses another server's token.
- One lazer data folder supports one running game. The launcher closes the selected install first and refuses other detected lazer processes.

## Clean-up

After the game exits normally, a separate guard process removes the bridge DLL it placed, but only if it is unchanged and still identifiable. After a crash or power loss, opening the launcher shows the recovery result; use **Retry cleanup** if files remain. It will not delete unknown rulesets. The `.kaleidoscope.lock` files in `rulesets` are intentional mutexes and do not mean the game is running.

## Building

Debug GUI package on a Windows machine with Rust (MSVC), .NET 10 SDK and Node.js 22 or newer:

```powershell
.\tools\kaleidoscope\scripts\package-launcher.ps1 -BuildProfile Debug
```

The script embeds the production web UI, assembles the bridge and verifies directory and ZIP hashes. It does not start the game.

Release builds run through manual CI producers on a dedicated Windows runner (`[self-hosted, Windows, X64, illyaverse-native]`): `build-kaleidoscope.yml` in this repository for the launcher and `build-production.yml` in Transfiguration for the bridge. Both read-only workflows require reviewers on their protected environments, check that the checkout matches the dispatched commit, and upload build inputs with provenance. Publishing is a separate step. The runner needs Git, Node.js 24, the .NET 10 SDK, MSVC with the Windows SDK, and a `x86_64-pc-windows-msvc` Rust toolchain.
