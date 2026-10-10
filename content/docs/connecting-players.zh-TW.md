---
title: 讓玩家連線
description: 玩家要做什麼才能連線，以及你必須提供什麼。
---

玩家依照你網站上的「連線教學」頁操作。這一頁說明背後的東西。

## 你要提供的

- 有正確 DNS 與受信任 HTTPS 的公開網域（見[部署](./deployment.md)）。公開伺服器上，玩家完全不需要修改 hosts。
- 啟動器的下載連結：把 `KALEIDOSCOPE_DOWNLOAD_URL` 設為 HTTPS 網址並重新建立 Serendipity。未設定前，連線教學頁會告訴玩家連結尚未公開。
- 若要信箱驗證與忘記密碼，需要可用的 SMTP（見[設定](./configuration.md)）。

## 各客戶端如何連線

| 客戶端     | 方式                                                                                                                |
| ---------- | ------------------------------------------------------------------------------------------------------------------- |
| osu!stable | 建立帶有 `-devserver <你的網域>` 的捷徑（只填根網域，不含協定、路徑或連接埠；固定 443），或使用 Kaleidoscope 啟動器 |
| osu!lazer  | Kaleidoscope 以 Transfiguration 橋接啟動官方安裝。沿用圖譜庫與遊戲設定；只有登入資料會依伺服器分開保存              |

兩種方式都拒絕官方 `ppy.sh` 位址，連線失敗也絕不會退回官方伺服器。

## 支援的 lazer 版本

Transfiguration 針對套件內 `compatibility.json` 列出的確切 stock 檔案建置（目前為 `2026.1005.1-tachyon`、runtime 10.0.12）。版本字串相同但檔案雜湊不同時仍會被拒絕。lazer 更新後，請提供新的啟動器與橋接套件；不要只替換 DLL。

## 在一台 Windows 電腦上測試

本機測試伺服器使用 `illya.test`，不需要購買網域。

```powershell
.\infra\setup-client-test.ps1
docker compose --env-file .env.client-test.local -p illyaverse-client-test -f compose.yaml -f compose.client-test.yaml up -d --build --wait
```

這會建立 `.env.client-test.local`，使用自己的 volume 與網路，只公開 `127.0.0.1:80` 與 `443`。Caddy 會為根網域與遊戲主機（`osu`、`c`、`ce`、`c4`、`api`、`spectator`、`bss`、`a`、`b`）簽發本機憑證。你必須：

1. 在 hosts 把這些主機名稱對應到 `127.0.0.1`。
2. 匯出並信任 Caddy 的公開根憑證（`/data/caddy/pki/authorities/local/root.crt`）。絕不要匯出 `root.key` 或整個 Caddy volume。

`infra/connect-client-test.ps1` 會自動化檢查與信任步驟。Kaleidoscope 絕不會修改 hosts 或安裝憑證，也絕不會略過 TLS 驗證。

## 開放註冊之前

實際測試你支援的 stable 與 lazer 確切版本：登入、聊天、下載、遊玩、成績提交與 replay、多人遊戲與重新連線。已驗證的內容見[狀態](./status.md)。
