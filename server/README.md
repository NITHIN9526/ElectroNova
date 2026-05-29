# ElectroNova Proxy

This small Express proxy keeps your Telegram bot token on the server. The client calls `/api/sendMessage` and the server forwards the message to Telegram.

Quick start:

1. Install dependencies

```bash
cd server
npm install
```

2. Create `.env` from `.env.example` and fill in `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`.

3. Start the proxy

```bash
npm start
```

Ensure the proxy is reachable from the frontend (same host/port or configure CORS/proxy). For local testing, run the proxy and open the static site in a browser.
