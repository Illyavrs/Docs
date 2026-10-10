---
title: 設定
description: 整個服務會讀取的所有環境變數。
---

在 `.env` 設定這些值（不要提交）。`infra/setup.ps1` 與 `setup.sh` 會替你產生密鑰。

## 必填

| 變數                         | 用途                                                                  |
| ---------------------------- | --------------------------------------------------------------------- |
| `POSTGRES_PASSWORD`          | 資料庫密碼。保留產生的 hex；未編碼的 `@`、`:` 等符號會讓連線 URL 失效 |
| `SESSION_SECRET`             | 至少 32 bytes，用來簽署網站 session。更換會讓所有人登出               |
| `INTERNAL_SERVICE_KEY`       | Resonance 與 Sanctuary 之間的信任金鑰                                 |
| `PUBLIC_ORIGIN`              | 瀏覽器使用的來源。正式環境強制為 `https://<ILLYA_DOMAIN>`             |
| `COOKIE_SECURE`              | 本機 HTTP 為 `false`，正式環境強制 `true`                             |
| `ILLYA_DOMAIN`、`ACME_EMAIL` | 正式網域與 ACME 聯絡信箱                                              |

## 帳號與郵件

| 變數                             | 用途                                                                    |
| -------------------------------- | ----------------------------------------------------------------------- |
| `BOOTSTRAP_ADMIN_*`              | 建立第一位管理員。用完請清空                                            |
| `SMTP_HOST`、`SMTP_FROM`         | 啟用信箱驗證與忘記密碼                                                  |
| `SMTP_USERNAME`、`SMTP_PASSWORD` | 必須成對設定或都不設定                                                  |
| `SMTP_TLS`、`SMTP_PORT`          | 預設 STARTTLS／587；`implicit` 使用 465                                 |
| `MAIL_ENCRYPTION_KEY`            | 獨立的 64 位 hex 金鑰，加密待寄的連結。請私下備份；新金鑰無法讀取舊佇列 |
| `MAIL_ALLOW_LOCAL_DEV`           | 僅供隔離的 loopback 郵件測試。請保持 `false`                            |

沒有 SMTP 時，信箱驗證與忘記密碼會顯示為不可用；註冊與登入仍可使用。變更郵件設定後執行 `docker compose up -d --force-recreate sanctuary`。重設連結有效 15 分鐘，驗證連結有效 24 小時。

## 選用功能

| 變數                                 | 用途                                                          |
| ------------------------------------ | ------------------------------------------------------------- |
| `OSU_CLIENT_ID`、`OSU_CLIENT_SECRET` | 官方 osu! API 憑證，用於官方圖譜搜尋與中繼資料                |
| `OSU_API_INTERVAL_MS`                | 官方 API 請求的最小間隔（預設與最小值皆為 1000）              |
| `KALEIDOSCOPE_DOWNLOAD_URL`          | 啟動器套件的公開 HTTPS 連結；設定後 `/connect` 會顯示下載按鈕 |
| `RUST_LOG`                           | 日誌過濾                                                      |

## 網路

Bridge 子網預設為 `172.30.91.0/24`（Caddy 為 `.10`，Serendipity 為 `.11`）。Sanctuary 只信任這兩個位址的 forwarded header，Resonance 只信任 Caddy。若子網與你的網路衝突，請同時修改子網、兩個 `ipv4_address`，以及兩個 Rust 服務的 `TRUSTED_PROXY_CIDRS`。不要把所有外部來源都列為可信任代理。

## 本機開發

```sh
docker compose -f compose.yaml -f compose.dev.yaml up -d postgres
```

PostgreSQL 會監聽 `127.0.0.1:15432`，供主機端測試與 `npm run dev` 使用。
