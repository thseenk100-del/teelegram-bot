require("dotenv").config();
const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

const token = process.env.BOT_TOKEN;
const adminId = process.env.ADMIN_ID;
const railwayUrl = process.env.RAILWAY_STATIC_URL;

if (!token || !adminId || !railwayUrl) {
  console.error("❌ تأكد من المتغيرات BOT_TOKEN + ADMIN_ID");
  process.exit(1);
}

const app = express();
app.use(express.json());

const bot = new TelegramBot(token);
const PORT = process.env.PORT || 8080;

/* ===== Webhook ===== */
app.post("/webhook", (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

/* ===== التحقق من الأدمن ===== */
function isAdmin(id) {
  return id.toString() === adminId.toString();
}

/* ===== القائمة الرئيسية ===== */
bot.onText(/\/start/, (msg) => {
  if (!isAdmin(msg.from.id)) {
    return bot.sendMessage(msg.chat.id, "❌ غير مصرح لك");
  }

  bot.sendMessage(msg.chat.id, "لوحة التحكم 👇", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "📷 نشر صورة", callback_data: "photo" }],
        [{ text: "📄 نشر PDF", callback_data: "pdf" }],
        [{ text: "🎬 نشر فيديو", callback_data: "video" }],
        [{ text: "📢 نشر للقناة", callback_data: "channel" }]
      ]
    }
  });
});

/* ===== الأزرار ===== */
bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;

  if (!isAdmin(query.from.id)) {
    return bot.answerCallbackQuery(query.id, { text: "غير مصرح" });
  }

  try {

    if (query.data === "photo") {
      await bot.sendPhoto(
        chatId,
        "https://via.placeholder.com/600x400",
        {
          caption: "صورة تجريبية",
          reply_markup: {
            inline_keyboard: [
              [{ text: "Google", url: "https://google.com" }]
            ]
          }
        }
      );
    }

    if (query.data === "pdf") {
      await bot.sendDocument(
        chatId,
        "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        { caption: "ملف PDF" }
      );
    }

    if (query.data === "video") {
      await bot.sendVideo(
        chatId,
        "https://www.w3schools.com/html/mov_bbb.mp4",
        { caption: "فيديو تجريبي" }
      );
    }

    if (query.data === "channel") {
      await bot.sendMessage(
        chatId,
        "أرسل الآن معرف القناة مثل:\n@channelusername"
      );

      bot.once("message", async (msg) => {
        const channel = msg.text;

        await bot.sendMessage(channel, "📢 هذا منشور تجريبي من البوت");

        await bot.sendMessage(chatId, "✅ تم النشر في القناة");
      });
    }

    await bot.answerCallbackQuery(query.id);

  } catch (err) {
    console.error("خطأ:", err.message);
  }
});

/* ===== تشغيل السيرفر ===== */
app.listen(PORT, async () => {
  console.log(`🚀 يعمل على المنفذ ${PORT}`);

  const webhookUrl = `https://${railwayUrl}/webhook`;

  try {
    await bot.deleteWebHook();
    await bot.setWebHook(webhookUrl);
    console.log("✅ Webhook تم بنجاح");
  } catch (error) {
    console.error("❌ فشل Webhook:", error.response?.body || error.message);
  }
});
