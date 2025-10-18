import { tgSend, parseCommand } from "./helpers.js";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SECRET = process.env.TELEGRAM_SECRET_TOKEN;
const DEV_CHAT_ID = process.env.DEV_CHAT_ID ? Number(process.env.DEV_CHAT_ID) : null;

if (!BOT_TOKEN) {
  console.warn("⚠️ TELEGRAM_BOT_TOKEN is not set. Set it in Vercel → Environment Variables.");
}

export default async function handler(req, res) {
  if (SECRET) {
    const hdr = req.headers["x-telegram-bot-api-secret-token"];
    if (hdr !== SECRET) {
      return res.status(200).json({ ok: true });
    }
  }

  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const update = req.body;
    const message = update.message || update.edited_message || update.channel_post || null;
    const chat_id = message?.chat?.id;
    const text = message?.text || "";

    if (!message) {
      return res.status(200).json({ ok: true });
    }

    if (DEV_CHAT_ID && chat_id !== DEV_CHAT_ID) {
      await tgSend(chat_id, "הבוט כרגע במצב בדיקות. נסה שוב מאוחר יותר 🙏");
      return res.status(200).json({ ok: true });
    }

    const { cmd, args } = parseCommand(text);

    if (cmd === "start") {
      await tgSend(chat_id,
`ברוך/ה הבא/ה לבוט! 🤖
אפשרויות לדוגמה:
/help — עזרה
/echo טקסט — אחזיר את הטקסט
/charge טקסט — אזהה חיוב (₪, בית עסק, תאריך) מתוך הטקסט שתשלח/י.`);
      return res.status(200).json({ ok: true });
    }

    if (cmd === "help") {
      await tgSend(chat_id,
"עזרה 🧭\n— /echo שלום עולם\n— /charge בוצעה עסקה על סך ₪125.90 ב-AMAZON בתאריך 17/10/2025\n— שלח/י כל טקסט ונגיב בנימוס 🙂");
      return res.status(200).json({ ok: true });
    }

    if (cmd === "echo") {
      await tgSend(chat_id, args || "אין טקסט אחרי /echo");
      return res.status(200).json({ ok: true });
    }

    if (cmd === "charge") {
      const parsed = parseCharge(args || "");
      if (parsed) {
        await tgSend(chat_id,
`💳 חיוב חדש זוהה!
🏬 בית עסק: <b>${escapeHtml(parsed.merchant)}</b>
💰 סכום: <b>${escapeHtml(parsed.amount)} ₪</b>
📅 תאריך: <b>${escapeHtml(parsed.date_str)}</b>`);
      } else {
        await tgSend(chat_id, "לא הצלחתי לזהות חיוב מהטקסט. נסה/י ניסוח כמו: \"בוצעה עסקה על סך ₪125.90 ב-AMAZON בתאריך 17/10/2025\"");
      }
      return res.status(200).json({ ok: true });
    }

    await tgSend(chat_id, "קיבלתי 🙂 אפשר לנסות /help כדי לראות פקודות זמינות.");
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e?.response?.data || e.message);
    return res.status(200).json({ ok: true });
  }
}

function parseCharge(text) {
  const amount = matchFirst(text, /₪\s?([\d.,]+)/) || matchFirst(text, /amount[:\s]*([\d.,]+)\s?₪?/i) || matchFirst(text, /סך[:\s]*([\d.,]+)\s?₪/);
  const merchant = matchFirst(text, /ב-([A-Z0-9\u0590-\u05FF\s&._-]{2,})/) || matchFirst(text, /בית\s?עסק[:\s]+([^\n]+)/);
  const date = matchFirst(text, /(\d{1,2}\/\d{1,2}\/\d{2,4})/) || matchFirst(text, /(\d{4}-\d{2}-\d{2})/);
  if (!amount || !merchant) return null;
  return { amount: amount.replace(",", "."), merchant: merchant.trim(), date_str: date || new Date().toLocaleDateString("he-IL") };
}
function matchFirst(t, re) { const m = (t || "").match(re); return m ? m[1] : null; }
function escapeHtml(s="") { return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
