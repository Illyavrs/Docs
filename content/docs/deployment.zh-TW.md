---
title: 部署
description: 以 Docker Compose 部署 Illyaverse，可直接 HTTPS 或透過 Cloudflare Tunnel。
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

## 快速開始

需要 Docker Engine 與 Compose **2.24.4 以上**，以及包含所有 submodule 的完整 checkout。

```sh
sh infra/setup.sh   # 產生含隨機密鑰與管理員密碼的 .env
```

接著依網路環境選擇：

| 情況                                | 使用方式                                                           |
| ----------------------------------- | ------------------------------------------------------------------ |
| 只在本機測試                        | `docker compose up -d --build --wait`（http://localhost:3000）     |
| 公開伺服器，可開放 80／443          | [方案 A：直接 HTTPS](#方案-a直接-https不使用-cloudflare)           |
| 在 NAT 後面，或想用 Cloudflare 代理 | [方案 B：Cloudflare Tunnel](#方案-bcloudflare-tunnel)              |

之後每次執行 `docker compose` 都要帶上相同的 `-f` 檔案，否則 Compose 會退回本機設定。

## 方案 A：直接 HTTPS（不使用 Cloudflare）

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

## 方案 B：Cloudflare Tunnel

主機沒有公網 IP、無法開放連接埠，或想用 Cloudflare 代理時使用。此時 Caddy 在內部網路只提供純 HTTP，由 `cloudflared` 容器主動連線到 Cloudflare，不對主機公開任何連接埠。請不要與 `compose.production.yaml` 同時使用。

1. 網域必須已加入 Cloudflare，建議使用根網域（例如 `example.com`）。免費的通用憑證只涵蓋一層子網域，所以 `osu.example.com` 可用，`osu.illya.example.com` 則不行。
2. 在 Cloudflare Zero Trust 進入 Networks > Tunnels，建立 Cloudflared tunnel，並複製 token（很長的 `eyJ...` 字串）。
3. 在該 tunnel 新增兩筆 Public Hostname，服務類型都選 `HTTP`，URL 填 `caddy:80`：
   - 根網域（子網域留空）
   - 同網域下的 `*`（涵蓋 `osu`、`c`、`ce`、`c4`、`api`、`spectator`、`bss`、`a`、`b`）

   Cloudflare 會自動建立對應且開啟代理的 CNAME。若已有 `*` 記錄，請先刪除。每筆記錄都必須指向 `<tunnel-id>.cfargotunnel.com`；指向其他 tunnel 會出現錯誤 1033。
4. 在 `.env` 設定 `ILLYA_DOMAIN=example.com`、`PUBLIC_ORIGIN=https://example.com`、`COOKIE_SECURE=true` 與 `CLOUDFLARE_TUNNEL_TOKEN=<token>`。`ACME_EMAIL` 不會用到。
5. 每次都帶上 tunnel override 啟動：

```sh
docker compose -f compose.yaml -f compose.tunnel.yaml config --quiet
docker compose -f compose.yaml -f compose.tunnel.yaml up -d --build --wait
```

`compose.tunnel.yaml` 會強制 secure cookie、移除本機 3000 與 8081 的連接埠對應，並讓 `cloudflared` 以固定位址（`172.30.91.12`）啟動。`infra/Caddyfile.tunnel` 關閉 ACME，只信任該位址，並從 `Cf-Connecting-Ip` 取得玩家真實 IP，再以單一 `X-Forwarded-For` 轉發，供 Sanctuary 與 Resonance 做速率限制。請不要同時公開 Caddy 的 80 連接埠，否則客戶端可能繞過 Cloudflare。

Cloudflare 免費方案的請求主體上限為 100 MB，Caddy 的上傳限制（約 68 MB）已低於此值。小型 VM 的記憶體可能不足以編譯 Rust 與 Next.js 的 image，可在別處建置，再用 `docker save | ssh <主機> docker load` 傳送，然後以 `up -d --no-build --wait` 啟動。

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
