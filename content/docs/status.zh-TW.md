---
title: 狀態
description: 哪些已用真實客戶端驗證，哪些仍待處理。
---

自動化測試通過，不等於在真實遊戲客戶端上能用。這一頁把兩者分開。

## 已用真實遊玩驗證

- **stable 與 lazer**：登入、成績提交、replay 取得與聊天。
- **lazer 多人遊戲**：建立房間並遊玩一局。
- **網站**：註冊、圖譜搜尋與下載、成績、個人頁與排行榜已手動確認；聊天、通知與管理工具由自動化瀏覽器測試涵蓋。

## 只有自動化測試涵蓋

- stable 加密的成績提交與 replay 綁定。
- Relax（RX）分區、pp 計算與分數換算。
- 房間成績 token、回合，以及重啟後的復原。
- 啟動器的監護程序、清理與相容性拒絕。

## 尚未驗證

- stable 與 lazer 的觀戰。
- 遊戲內的私訊。
- 遊戲內播放 replay。
- 啟動器的登出、重新啟動與橋接清理的完整玩家檢查流程。
- 房間：玩家在回合中途離開時，lazer 仍會嘗試提交該回合並記錄 `room_score_token_revoked`。這是預期行為：中止的回合刻意被拒絕，不影響成績。

## 發行

- 啟動器套件是**未簽署的 Debug 建置**。簽署的 Release 建置、正式發布、簽署金鑰，以及啟動器與橋接各自獨立的更新來源都還沒完成。
- Windows 上 Rust workspace 的 Release 建置目前因 build script 錯誤（Windows error 5，原因不明）而失敗。Debug 建置與 Docker image 不受影響。
- 原始碼尚未推送到 GitHub，也還沒測試過全新的 recursive clone。

## 回報問題

請附上客戶端（stable 或 lazer）、確切版本、發生時間；lazer 請附上最新的 `runtime.log` 與 `network.log`（去掉 query 字串）。
