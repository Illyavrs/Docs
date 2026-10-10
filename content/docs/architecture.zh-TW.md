---
title: 架構
description: 服務組成、請求如何路由，以及資料存放在哪裡。
---

Illyaverse 把網站、社群 API、遊戲協定與啟動器拆成獨立的部分。父 repository 擁有共用型別、migration 與部署；五個產品以 submodule 各自保留歷史。

```text
瀏覽器 ──────────┐
osu! stable ─────┤
lazer + 橋接 ────┴──> Caddy ──> Serendipity（網站）
                          ├───> Sanctuary   （API、帳號、成績）
                          └───> Resonance   （遊戲協定）
Serendipity ──> Sanctuary          Resonance ──> Sanctuary
Sanctuary、Resonance ──> PostgreSQL 17 與共用 /data
```

| 服務        | 連接埠  | 健康檢查                        | 職責                                                    |
| ----------- | ------- | ------------------------------- | ------------------------------------------------------- |
| Serendipity | 3000    | `GET /`                         | Next.js 網站，三種語言                                  |
| Sanctuary   | 8080    | `/health/live`、`/health/ready` | session、角色、圖譜、媒體、成績、replay、聊天、稽核     |
| Resonance   | 8081    | `/health`                       | stable legacy 端點、lazer OAuth 與 API v2 子集、SignalR |
| PostgreSQL  | 5432    | `pg_isready`                    | 全部持久化資料與 migration 狀態                         |
| Caddy       | 80、443 | `/healthz`                      | HTTPS、Host 與路徑路由、壓縮、上傳大小限制              |

## 路由

- `/api/v1/*` 與 `/media/*` 交給 Sanctuary。
- `/web/*`、`/osu/*`、`/d/*`、`/oauth/*`、`/api/v2/*`、`/signalr/*`、`/spectator`、`/multiplayer`、`/metadata` 與遊戲用主機交給 Resonance。
- 其餘全部交給 Serendipity。

## 啟動順序

Sanctuary 先連線 PostgreSQL、執行 migration、建立選用的初始管理員，再開始監聽。Compose 會等真正 ready 後才啟動 Resonance、Serendipity，最後是 Caddy。

## 資料與權限

- `migrations/` 是 schema 的唯一來源。`crates/illya-domain` 放領域型別與驗證；`crates/resonance-protocol` 讓 wire 程式碼保持純粹可測試。查詢使用動態 SQLx，建置不需要真實資料庫。
- 權限來自角色的 permission 字串，由 Sanctuary 在 API 邊界檢查；隱藏的 UI 只是呈現。寫入會在交易內重新驗證操作者的 session、限制與權限，並留下稽核事件。
- 瀏覽器的寫入請求會對照 `PUBLIC_ORIGIN` 檢查。Sanctuary 只信任 Caddy 與 Serendipity 容器位址的 forwarded header。
- Sanctuary 與 Resonance 把同一個 volume 掛在 `/data`（`media`、`maps`、`replays`），並都以 UID／GID `10001` 執行。沒有任何東西以靜態目錄公開；只有 API 定義的路由會讀檔。

## 客戶端

玩家使用 Kaleidoscope，並保存 HTTPS 伺服器網址。stable 會帶入 `-devserver <網域>`（443 連接埠）；lazer 會在遊戲啟動前載入 Transfiguration 橋接。兩者都拒絕官方 `ppy.sh` 主機，也絕不會退回官方伺服器。見[讓玩家連線](./connecting-players.md)與 [Kaleidoscope](./kaleidoscope.md)。
