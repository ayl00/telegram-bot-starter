import axios from "axios";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

export async function tgSend(chat_id, text, extra = {}) {
  return axios.post(`${API_BASE}/sendMessage`, {
    chat_id, text, parse_mode: "HTML", ...extra
  });
}

export function parseCommand(text) {
  if (!text) return { cmd: null, args: "" };
  const m = text.trim().match(/^\/([a-zA-Z0-9_]+)(?:\s+(.+))?$/);
  if (!m) return { cmd: null, args: "" };
  return { cmd: m[1].toLowerCase(), args: m[2] || "" };
}
