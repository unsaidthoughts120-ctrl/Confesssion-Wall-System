// api/send.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body = req.body;
    // Basic validation
    if (!body || typeof body !== 'object') {
      res.status(400).json({ error: 'Invalid body' });
      return;
    }
    const receiver = (body.receiver || '').toString().slice(0, 80).trim();
    const message = (body.message || '').toString().slice(0, 2000).trim();
    const sender = body.sender ? body.sender.toString().slice(0, 60).trim() : null;
    const source = body.source ? body.source.toString().slice(0, 100).trim() : '';

    if (!receiver || !message) {
      res.status(400).json({ error: 'Both receiver and message are required' });
      return;
    }

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
      res.status(500).json({ error: 'Server not configured (missing token or chat id)' });
      return;
    }

    // Prepare a safe message text for Telegram
    const text = [
      `📣 *New Confession*`,
      `*To:* ${escapeMarkdown(receiver)}`,
      `*From:* ${sender ? escapeMarkdown(sender) : '_Anonymous_'}`,
      `*Message:*`,
      escapeMarkdown(message),
      `\n_meta: ${escapeMarkdown(source)} (${new Date().toLocaleString()})`
    ].join("\n");

    const tgUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

    const payload = {
      chat_id: CHAT_ID,
      text: text,
      parse_mode: 'MarkdownV2'
    };

    const resp = await fetch(tgUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const respJson = await resp.json();

    if (!resp.ok || !respJson.ok) {
      // Telegram returned an error
      const errMsg = respJson.description || 'Telegram API error';
      res.status(502).json({ error: errMsg, tg: respJson });
      return;
    }

    res.status(200).json({ ok: true, result: respJson.result });
  } catch (err) {
    console.error('send error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// escape minimal MarkdownV2 special chars for Telegram
function escapeMarkdown(text = '') {
  return text
    .replaceAll('\\', '\\\\')
    .replaceAll('_', '\\_')
    .replaceAll('*', '\\*')
    .replaceAll('[', '\\[')
    .replaceAll(']', '\\]')
    .replaceAll('(', '\\(')
    .replaceAll(')', '\\)')
    .replaceAll('~', '\\~')
    .replaceAll('`', '\\`')
    .replaceAll('>', '\\>')
    .replaceAll('#', '\\#')
    .replaceAll('+', '\\+')
    .replaceAll('-', '\\-')
    .replaceAll('=', '\\=')
    .replaceAll('|', '\\|')
    .replaceAll('{', '\\{')
    .replaceAll('}', '\\}')
    .replaceAll('.', '\\.')
    .replaceAll('!', '\\!');
}

