require("dotenv").config();
const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

const token = process.env.BOT_TOKEN;
if (!token) {
  console.error("❌ BOT_TOKEN غير موجود");
  process.exit(1);
}

const app = express();
app.use(express.json());

const bot = new TelegramBot(token);

const PORT = process.env.PORT || 3000;
const DOMAIN = process.env.RAILWAY_PUBLIC_DOMAIN;

if (!DOMAIN) {
  console.error("❌ RAILWAY_PUBLIC_DOMAIN غير موجود");
  process.exit(1);
}

const WEBHOOK_URL = `https://${DOMAIN}/bot${token}`;

// ========= أوامر البوت =========

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "مرحباً بك 👋 اختر من القائمة:", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "نشر صورة", callback_data: "photo" }],
        [{ text: "نشر PDF", callback_data: "pdf" }],
        [{ text: "نشر فيديو", callback_data: "video" }]
      ]
    }
  });
});

bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;

  try {
    if (query.data === "photo") {
      await bot.sendPhoto(
        chatId,
        "https://via.placeholder.com/600x400",
        {
          caption: "هذه صورة مع نص 👌",
          reply_markup: {
            inline_keyboard: [
              [{ text: "زيارة الموقع", url: "https://google.com" }]
            ]
          }
        }
      );
    }

    if (query.data === "pdf") {
      await bot.sendDocument(
        chatId,
        "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        { caption: "هذا ملف PDF 📄" }
      );
    }

    if (query.data === "video") {
      await bot.sendVideo(
        chatId,
        "https://www.w3schools.com/html/mov_bbb.mp4",
        {
          caption: "هذا فيديو 🎬",
          reply_markup: {
            inline_keyboard: [
              [{ text: "فتح الرابط", url: "https://youtube.com" }]
            ]
          }
        }
      );
    }

    await bot.answerCallbackQuery(query.id);
  } catch (err) {
    console.error("خطأ:", err.message);
  }
});

// ========= Webhook Endpoint =========

app.post(`/bot${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// ========= تشغيل السيرفر ثم ضبط webhook =========

app.listen(PORT, async () => {
  console.log("🚀 السيرفر يعمل على المنفذ", PORT);

  try {
    await bot.deleteWebHook();
    await bot.setWebHook(WEBHOOK_URL);
    console.log("✅ Webhook تم ضبطه بنجاح");
  } catch (error) {
    console.error("❌ فشل ضبط Webhook:", error.message);
  }
});
