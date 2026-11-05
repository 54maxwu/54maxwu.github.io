# 裝置快傳

入口：工具箱 → 裝置快傳，或開啟 transfer/index.html。兩台裝置都保持頁面開啟；一台建立邀請，另一台掃 QR Code 或輸入配對碼，按「加入」。配對後可選取或拖入檔案、傳送文字；接收者同意後才會傳送內容。

## 配對與傳輸

保留免登入、QR 配對、WebRTC、接收確認與 NAT 穿透。預設採用隨機 100 位元的雙人邀請，無同網路自動探索、公開多人房或永久配對；避免同一個公用 Wi-Fi 的使用者互相看見裝置。頁面會顯示是否使用中繼。檔案內容與文字不會存到 Worker，也不支援離線接收或續傳。

接收方在瀏覽器內組合檔案並提供手動下載，單批最多 20 個檔案、合計 128 MiB。下一批接收完成後會取代上一次的下載連結；請先儲存所需檔案。房間連結等同邀請憑證，請只提供給預期的接收者。房間在最後一個人離開後不保留連線或資料；仍持有原邀請者可再次使用相同房碼。

## 部署 Cloudflare Worker

在專案根目錄執行：

```powershell
wrangler login
./transfer-worker/deploy.ps1
```

Worker 使用免費方案可建立的 SQLite Durable Object，僅轉送 WebRTC 的 SDP。部署腳本也會發布快傳頁面與 QR Code 的本機依賴。預期入口為 https://quick-transfer.54maxwu.workers.dev/transfer/ ，工具箱的入口則隨原網站發布。若用不同帳號或網域，調整 app.js 的 API 與 worker.mjs 的允許來源。

### 選配：跨網路 TURN

1. 在 Cloudflare Realtime 建立 TURN Key，取得金鑰 ID 和 API Token。
2. 在專案根目錄設定下列 Secret。依 CLI 提示輸入值；RELAY_PASSCODE 請使用獨立的高強度隨機密碼，只提供給允許使用中繼的人。

```powershell
wrangler secret put TURN_KEY_ID --config transfer-worker/wrangler.toml
wrangler secret put TURN_API_TOKEN --config transfer-worker/wrangler.toml
wrangler secret put RELAY_PASSCODE --config transfer-worker/wrangler.toml
```

兩台裝置加入同一房間前，在「跨網路連線選項」輸入中繼密碼。Worker 驗證後才簽發 10 分鐘的 ICE 憑證。瀏覽器仍優先嘗試直連；TURN 只轉送加密資料，通常會產生流量費用。此密碼適合個人或小團隊；若要對外開放付費中繼，應再加入使用者身分、用量上限及速率限制。請勿把長效金鑰放到前端、Git 或邀請連結。Worker、STUN、TURN 分工不同，Cloudflare Tunnel 並不是瀏覽器 WebRTC 的 TURN 中繼。

## 本機驗證

```powershell
wrangler dev --config transfer-worker/wrangler.toml --port 8787
python -m http.server 8080 --bind 127.0.0.1
```

開兩個分頁到 http://127.0.0.1:8080/transfer/index.html ，以邀請連結配對，測試拒收、取消、傳文字及接收多檔。正式部署後，另用 Wi-Fi 與行動網路測試，確認需要時畫面會顯示 Cloudflare 中繼。
