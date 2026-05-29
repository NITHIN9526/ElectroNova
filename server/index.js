require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.post('/api/sendMessage', async (req, res) => {
  const { name, email, message, timestamp } = req.body || {};

  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    return res.status(500).json({ ok: false, error: 'Server not configured with Telegram credentials' });
  }

  const text = `🔌 *New Comms Telemetry Received!*\n\n` +
               `⏱️ *Timestamp:* \`${timestamp || new Date().toISOString()}\`\n\n` +
               `👤 *Sender Name:* \`${name || 'anonymous'}\`\n` +
               `✉️ *Routing Addr:* \`${email || 'n/a'}\`\n\n` +
               `📝 *Payload Message:*\n"${message || ''}"`;

  const telegramUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;

  try {
    const resp = await axios.post(telegramUrl, {
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text,
      parse_mode: 'Markdown'
    }, { timeout: 10000 });

    return res.json({ ok: true, result: resp.data });
  } catch (err) {
    console.error('Telegram proxy error:', err?.response?.data || err.message || err);
    return res.status(500).json({ ok: false, error: err?.response?.data || err.message || 'Request failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server listening on port ${PORT}`);
});
