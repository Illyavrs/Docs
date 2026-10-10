---
title: Kaleidoscope 啟動器
description: 啟動器做什麼、如何處理 lazer 資料，以及如何建置。
---

Kaleidoscope 是 Windows 的圖形啟動器。它讓 stable 或 lazer 連到你的伺服器、顯示狀態，並清理載入 lazer 的暫存橋接。

## 伺服器網址

玩家填入 HTTPS 基底網址，例如 `https://your-illyaverse.example`：完整的 ASCII DNS 名稱，不含登入資訊、路徑、查詢參數或 fragment。IP、單段主機名稱、尾端句點與 `ppy.sh` 名稱都會被拒絕。lazer 可以使用自訂 HTTPS 連接埠；stable 固定 443，所以其他連接埠時啟動器會停用 stable。

網址在啟動時固定，之後修改只影響下一次啟動。橋接缺少、不相容或連線失敗時，啟動器會停止，絕不會切回官方伺服器。

## lazer 資料

- 啟動器沿用已安裝遊戲的圖譜庫（`client.realm`、`files`）與遊戲設定（`game.ini`）。它會辨識一般、portable 與 `storage.ini` 位置；無法安全確認時會停止，而不是建立空白圖譜庫。
- 只有七項登入資料另外保存，位於同一資料夾的 `auth.illyaverse.json`，並依伺服器來源區分：`Username`、`Token`、`SaveUsername`、`SavePassword`、`WasSupporter`、`UserOnlineStatus`、`PMFriendsOnly`。切換伺服器絕不會沿用另一個伺服器的 token。
- 同一個 lazer 資料夾同時只支援一個遊戲。啟動器會先關閉所選安裝，並拒絕其他偵測到的 lazer 程序。

## 清理

遊戲正常結束後，獨立的監護程序會移除它放入的橋接 DLL，但只在檔案未被更動且仍可辨識時才刪除。當機或斷電後，開啟啟動器會顯示復原結果；若有殘留，使用「重試清理」。它不會刪除未知的 ruleset。`rulesets` 裡的 `.kaleidoscope.lock` 是刻意保留的互斥鎖，不代表遊戲正在執行。

## 建置

在已安裝 Rust（MSVC）、.NET 10 SDK 與 Node.js 22 以上的 Windows 上建置 Debug GUI 套件：

```powershell
.\tools\kaleidoscope\scripts\package-launcher.ps1 -BuildProfile Debug
```

腳本會內嵌正式版網頁介面、組裝橋接，並驗證目錄與 ZIP 雜湊。它不會啟動遊戲。

Release 建置透過專用 Windows runner（`[self-hosted, Windows, X64, illyaverse-native]`）上的手動 CI 產出：啟動器用本 repository 的 `build-kaleidoscope.yml`，橋接用 Transfiguration 的 `build-production.yml`。兩個 workflow 都是唯讀，需要受保護環境的審核者，會檢查 checkout 與派送的 commit 一致，並上傳含來源證明的建置輸入。發布是另一個步驟。runner 需要 Git、Node.js 24、.NET 10 SDK、含 Windows SDK 的 MSVC，以及 `x86_64-pc-windows-msvc` 的 Rust 工具鏈。
