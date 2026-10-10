---
title: 備份與還原
description: 建立一致的備份，並還原到全新的 project。
---

可用的備份必須在同一個時間點取得三樣東西：資料庫、整個 `shared_data` volume，以及部署密鑰。只有資料庫 dump，或只有上傳的圖片，都不夠。

## 備份

1. 讓網站進入維護狀態，並停止所有寫入者：Sanctuary、Resonance，以及任何會碰資料庫或 `/data` 的自訂程序。保持 PostgreSQL 運行。
2. 在寫入者停止後，記錄私有的基準：來源 commit、image ID、PostgreSQL 主版本、已套用的 migration 版本與 checksum、各資料表的 row 數，以及 `/data` 檔案路徑、SHA-256 與 UID／GID。
3. 用你實際的 compose project 名稱與一個新的、不存在的私有輸出目錄執行 helper：

```sh
docker compose -p illyaverse -f compose.yaml -f compose.production.yaml stop sanctuary resonance
node infra/recovery-backup.mjs --project illyaverse --output /private-backups/illyaverse-01 --writers-stopped
```

完整的備份包含 `illyaverse.dump`、`shared-data.tar.gz` 與 `manifest.json`（`format` 為 `illyaverse-recovery-v1`、`complete` 為 `true`，並通過 artifact 雜湊驗證）。任何步驟失敗時，保留該不完整目錄供診斷，不要重複使用，改用新目錄重試。確認 manifest 與雜湊都正確後，才重新啟動服務。

4. 將 `.env` 與其他密鑰私下與備份放在一起：`POSTGRES_PASSWORD`、`SESSION_SECRET`、`INTERNAL_SERVICE_KEY`、`MAIL_ENCRYPTION_KEY` 與任何 SMTP 憑證。已排隊的郵件連結只能用原本的 `MAIL_ENCRYPTION_KEY` 解密。
5. Caddy 憑證（`caddy_data`、`caddy_config`）是獨立的。若要保留，請停止 Caddy 後為這兩個 volume 做快照。

備份包含帳號、待寄郵件與玩家檔案，請加密並限制存取。

## 還原

只還原到**全新**的 project：全新空白的 PostgreSQL 17 與全新的 `shared_data` volume，並在隔離的主機上，保持 DNS、公開入口與 Caddy 關閉。若發現已有容器、volume 或資料，請停止；絕不要用 `--clean`、`down -v` 或覆寫檔案來強行還原。

1. 驗證備份（`infra/recovery-lib.mjs` 的 `verifyBackup`），並載入 manifest 指定的確切 Sanctuary image。
2. 只啟動 PostgreSQL，確認 `public` schema 沒有任何資料表。
3. 複製 dump 進去，用 `pg_restore --list` 檢查，再以 `--exit-on-error --no-owner --no-acl` 還原，不使用 `--clean`。
4. 把 `shared-data.tar.gz` 解到新 volume，保留數字擁有者（服務以 `10001:10001` 執行）。
5. 啟動 Sanctuary 之前，把 migration、row 數與 `/data` 檔案清單及雜湊與你的基準比對。`_sqlx_migrations` 必須與來源的版本與 checksum 一致。
6. 用 manifest 記錄的 image 啟動 Sanctuary、Resonance 與 Serendipity，並檢查兩個健康端點。
7. 用原帳號登入，讀取一張圖譜、一個媒體檔與一個 replay。最後才恢復 SMTP 與對外流量。

只有 readiness 不能證明資料完整；row 數、檔案雜湊與真實登入才可以。

## 用可丟棄的資料演練

```sh
node infra/disposable-recovery-drill.mjs --dry-run
ILLYA_ALLOW_DISPOSABLE_TEST=1 node infra/disposable-recovery-drill.mjs
```

演練會建立可丟棄的來源與還原 project，用同一個 helper 備份、還原，並比對 migration、row、sequence、schema、檔案雜湊與擁有者。演練通過只證明流程在測試資料上可行，不代表你自己的備份是好的。
