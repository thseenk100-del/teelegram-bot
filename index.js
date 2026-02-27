const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

const app = express();
app.use(express.json());

const token = process.env.BOT_TOKEN;
const adminId = process.env.ADMIN_ID;

if (!token || !adminId) {
  console.log("❌ تأكد من BOT_TOKEN و ADMIN_ID");
  process.exit(1);
}

const bot = new TelegramBot(token);
const PORT = process.env.PORT || 8080;
const DOMAIN = process.env.RAILWAY_STATIC_URL || process.env.RAILWAY_PUBLIC_DOMAIN;

if (!DOMAIN) {
  console.log("❌ الدومين غير موجود");
  process.exit(1);
}

const webhookURL = `https://${DOMAIN}/webhook`;

/* ====== Webhook ====== */
app.post("/webhook", (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

/* ====== فحص السيرفر ====== */
app.get("/", (req, res) => {
  res.send("Bot is running");
});

/* ====== تحقق أدمن ====== */
function isAdmin(id) {
  return id.toString() === adminId.toString();
}

/* ====== لوحة التحكم ====== */
bot.onText(/\/start/, (msg) => {
  if (!isAdmin(msg.from.id)) {
    return bot.sendMessage(msg.chat.id, "❌ غير مصرح لك");
  }

  bot.sendMessage(msg.chat.id, "لوحة التحكم 👇", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "📝 نشر نص", callback_data: "text" }],
        [{ text: "📷 نشر صورة", callback_data: "photo" }],
        [{ text: "📄 نشر PDF", callback_data: "pdf" }],
        [{ text: "🎬 نشر فيديو", callback_data: "video" }],
        [{ text: "📢 نشر للقناة", callback_data: "channel" }]
      ]
    }
  });
});

/* ====== التعامل مع الأزرار ====== */
bot.on("callback_query", async (query) => {
  if (!isAdmin(query.from.id)) {
    return bot.answerCallbackQuery(query.id, { text: "غير مصرح" });
  }

  const chatId = query.message.chat.id;

  try {

    if (query.data === "text") {
      bot.sendMessage(chatId, "أرسل النص الآن:");
      bot.once("message", (msg) => {
        bot.sendMessage(chatId, msg.text);
      });
    }

    if (query.data === "photo") {
      bot.sendMessage(chatId, "أرسل الصورة الآن:");
      bot.once("message", (msg) => {
        if (msg.photo) {
          const photoId = msg.photo[msg.photo.length - 1].file_id;
          bot.sendPhoto(chatId, photoId, { caption: "تم النشر" });
        }
      });
    }

    if (query.data === "pdf") {
      bot.sendMessage(chatId, "أرسل ملف PDF:");
      bot.once("message", (msg) => {
        if (msg.document) {
          bot.sendDocument(chatId, msg.document.file_id);
        }
      });
    }

    if (query.data === "video") {
      bot.sendMessage(chatId, "أرسل الفيديو:");
      bot.once("message", (msg) => {
        if (msg.video) {
          bot.sendVideo(chatId, msg.video.file_id);
        }
      });
    }

    if (query.data === "channel") {
      bot.sendMessage(chatId, "أرسل معرف القناة مثل:\n@channelusername");
      bot.once("message", async (msg) => {
        const channel = msg.text;
        await bot.sendMessage(channel, "📢 منشور من البوت");
        bot.sendMessage(chatId, "✅ تم النشر في القناة");
      });
    }

    bot.answerCallbackQuery(query.id);

  } catch (err) {
    console.log("خطأ:", err);
  }
});

/* ====== تشغيل السيرفر وضبط Webhook ====== */
app.listen(PORT, async () => {
  console.log(`🚀 يعمل على المنفذ ${PORT}`);

  try {
    await bot.deleteWebHook();
    await bot.setWebHook(webhookURL);
    console.log("✅ Webhook تم بنجاح");
  } catch (err) {
    console.log("❌ فشل Webhook:", err.response?.body || err);
  }
});
