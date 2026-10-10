---
title: 部署
description: 在自己的網域上以自動 HTTPS 運行 Illyaverse。
---

預設的 Compose 檔案在本機執行網站與 API。正式環境則用 override 檔案加上你的 DNS 與 HTTPS。

## Volume

| Volume          | 內容                                                                        |
| --------------- | --------------------------------------------------------------------------- |
| `postgres_data` | PostgreSQL 17 資料                                                          |
| `shared_data`   | `/data/media`、`/data/maps`、`/data/replays`（Sanctuary 與 Resonance 共用） |
| `caddy_data`    | TLS 憑證與 ACME 狀態                                                        |
| `caddy_config`  | Caddy 執行期設定                                                            |

不要只改 PostgreSQL 的 image tag 來升級主版本，這不會升級既有資料。

## 正式網域與 HTTPS

1. 在 `.env` 設定 `ILLYA_DOMAIN` 與 `ACME_EMAIL`。
2. 把根網域與下列子網域的 A／AAAA 記錄指向主機：`osu`、`c`、`ce`、`c4`、`api`、`spectator`、`bss`、`a`、`b`。只有確定 IPv6 真的能連到主機時才發布。
3. 開放 TCP 80 與 443（HTTP/3 另需 UDP 443）。
4. 每次都帶上兩個 Compose 檔案啟動：

```sh
docker compose -f compose.yaml -f compose.production.yaml config --quiet
docker compose -f compose.yaml -f compose.production.yaml up -d --build --wait
```

正式 override 會移除本機 3000 與 8081 的連接埠對應，只公開 Caddy 的 80／443，並強制 `PUBLIC_ORIGIN=https://<ILLYA_DOMAIN>` 與 secure cookie。Caddy 負責取得與續訂憑證，需要正確的 DNS 與持久化的 `caddy_data`。

瀏覽器一律使用根網域。遊戲用的主機（`osu.`、`c.`、`ce.`、`c4.`、`api.`、`spectator.`、`bss.`、`a.`、`b.`）會導向遊戲協定服務。

## 選用：文件站

這個文件站是獨立的 repository（`apps/docs`，submodule），不屬於 Illyaverse 的 Compose 部署。請另外建置與執行，並放在任何反向代理之後：

```sh
docker build -t illyaverse-docs apps/docs
docker run -d -p 3000:3000 illyaverse-docs
```

## 更新

先備份（見[備份與還原](./backup-and-restore.md)）。接著更新原始碼，並用相同的 `-f` 檔案再次執行 `up -d --build --wait`。`docker compose down` 會保留 volume，`down -v` 會刪除你的資料。

`migrations/*.sql` 必須維持 UTF-8（無 BOM）與 LF 換行。已套用的 migration 絕對不能修改，請新增版本。checksum 不符會讓啟動因版本不一致而停止；遇到時請停止、保留備份與原始碼，且不要修改 `_sqlx_migrations`。

## 健康檢查

```sh
docker compose logs --tail 100 sanctuary resonance serendipity caddy
docker compose exec sanctuary curl --fail http://127.0.0.1:8080/health/ready
docker compose exec resonance curl --fail http://127.0.0.1:8081/health
```

兩個端點都會讀取資料庫，所以通過代表資料存取正常。

## 擴充

媒體儲存是單機的。要執行多個副本，需要先有共用的物件儲存，以及共用的限流與聊天事件傳輸。
