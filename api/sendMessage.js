const axios = require('axios');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { name, email, message, timestamp } = req.body || {};

  const BOT = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!BOT || !CHAT_ID) {
    return res.status(500).json({ ok: false, error: 'Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in environment' });
  }

  const text = `🔌 *New Comms Telemetry Received!*\n\n` +
               `⏱️ *Timestamp:* \`${timestamp || new Date().toISOString()}\`\n\n` +
               `👤 *Sender Name:* \`${name || 'anonymous'}\`\n` +
               `✉️ *Routing Addr:* \`${email || 'n/a'}\`\n\n` +
               `📝 *Payload Message:*\n"${message || ''}"`;

  const telegramUrl = `https://api.telegram.org/bot${BOT}/sendMessage`;

  try {
    const resp = await axios.post(telegramUrl, {
      chat_id: CHAT_ID,
      text,
      parse_mode: 'Markdown'
    }, { timeout: 10000 });

    return res.status(200).json({ ok: true, result: resp.data });
  } catch (err) {
    console.error('Telegram proxy error:', err?.response?.data || err.message || err);
    return res.status(500).json({ ok: false, error: err?.response?.data || err.message || 'Request failed' });
  }
};
