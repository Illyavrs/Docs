---
title: Roles and permissions
description: How roles, permissions and moderation actions work.
---

An account can hold several roles; their permissions are combined. `*` grants everything. Every other permission is matched by exact name, with no hierarchy or prefix inheritance. Public registration grants the `player` role. Never give `*` to that role.

The admin panel shows the areas an account has permission for (for example `chat.moderate` alone is enough for the chat area), and the API checks permission on every call. `admin.view` allows reading admin beatmap metadata and implies no write access.

## Permissions

| Permission                           | Allows                                                                              |
| ------------------------------------ | ----------------------------------------------------------------------------------- |
| `roles.manage`                       | Create, edit, assign and remove roles within your own permissions                   |
| `users.moderate`                     | See account emails; restrict or unrestrict other accounts                           |
| `users.sessions.revoke`              | Revoke website, stable and lazer sign-ins of accounts you may manage                |
| `chat.moderate`                      | Look up players and set or clear timed chat silences                                |
| `beatmaps.moderate`                  | Change beatmap difficulty status                                                    |
| `beatmaps.rank.request`              | Submit rank requests                                                                |
| `beatmaps.rank.review`               | See the request queue and reject requests (approval also needs `beatmaps.moderate`) |
| `beatmaps.upload`, `beatmaps.import` | Upload server beatmaps; import from the official site                               |
| `scores.moderate`                    | Review scores; recalculate pp one by one or in bulk from the admin Recalculate tab  |
| `announcements.manage`               | Draft, edit, publish and archive announcements                                      |
| `audit.read`                         | Read the admin action log                                                           |
| `chat.send`, `social.manage`         | Send chat; manage own friends and blocks                                            |

## Built-in roles and rules

- `player`, `moderator` and `administrator` cannot be deleted. `administrator` must keep `*`. Custom roles can only be deleted once no account holds them.
- At least one unrestricted account with `*` must always remain.
- A role manager with limited permissions can only add or remove permissions they hold, cannot lower a higher-permission account, and cannot revoke its sign-ins.
- Restricting an account needs `users.moderate`; restricting one with `*` also needs `*`, and nobody can restrict themselves.
- `beatmap_nominator` has chat, upload, import, moderate, request and review permissions only. Role names carry no authority.

## Role badges

A role can show as a coloured badge on profiles, like groups on osu-web. In the role form, tick **Show this role as a badge**, give it a short label of up to 8 characters (for example `MOD` or `DEV`) and pick a colour. The badge appears under the player's name on the website and in the lazer profile; hovering shows the full role name. Roles that are not marked as badges, such as `player`, stay hidden. Built-in `moderator` and `administrator` start with `MOD` and `ADMIN` badges; their colours and labels can be changed, but the administrator name and permissions cannot.

## Beatmap statuses and rank requests

Status belongs to each difficulty: Graveyard, WIP, Pending, Unranked, Ranked or Loved. New uploads start in Graveyard. Ranking one difficulty never changes its siblings.

Players can request ranking for their own unranked uploads and for official Pending or Graveyard sets. A set can have one pending request; a player can hold 5 open requests and send 10 in 24 hours. Reasons are 1 to 1000 characters. Approval picks specific difficulties and sends the expected revision of the request and of each difficulty. A stale revision returns 409 instead of overwriting.

## Other moderation

- **Scores**: reviews carry an expected `moderation_revision`; a stale review returns 409 `score_moderation_conflict`.
- **Score recalculation**: the admin **Recalculate** tab recomputes pp for stored scores. Filter by player (name or ID), Normal or Relax, ruleset, date range, beatmap ID, review status, current pp range or explicit score IDs, and optionally only scores calculated with an older method. Preview shows the count, a split by type and ruleset, and the newest matches before anything changes. A job then runs in the background, one at a time, and can be cancelled; scores already processed keep their new pp. Each job lists the largest pp changes and every skipped or failed score. Failed and rejected scores and restricted players are never recalculated. Every score records the calculation method it used, which is how "older method" is detected. Starting, cancelling and finishing a job are audited, and a job stops if its operator loses `scores.moderate`.
- **Chat silence**: a future time up to 30 days and a 1 to 500 character reason (private, audit only). It only blocks new messages; the player can still sign in, play and read.
- **Sign-in revocation**: does not restrict the account. Long-lived connections notice at their next authentication check.
- **Announcements**: edits carry the current `revision`; a mismatch returns 409 `announcement_conflict`. Drafts and archived items are never served publicly.

Every admin write re-reads the actor's sign-in, restriction and permissions inside its transaction and commits together with its audit record.
