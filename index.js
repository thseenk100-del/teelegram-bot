require("dotenv").config();
const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

const token = process.env.BOT_TOKEN;
const domain = process.env.APP_DOMAIN;

if (!token) {
  console.error("BOT_TOKEN غير موجود");
  process.exit(1);
}

if (!domain) {
  console.error("APP_DOMAIN غير موجود");
  process.exit(1);
}

const app = express();
app.use(express.json());

const bot = new TelegramBot(token);

const PORT = process.env.PORT || 8080;

/* ========= Webhook Endpoint ========= */
app.post(`/bot${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

/* ========= القائمة الرئيسية ========= */
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "اختر من القائمة 👇", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "📷 نشر صورة", callback_data: "photo" }],
        [{ text: "📄 نشر PDF", callback_data: "pdf" }],
        [{ text: "🎬 نشر فيديو", callback_data: "video" }],
        [{ text: "🔗 أزرار ديناميكية", callback_data: "buttons" }]
      ]
    }
  });
});

/* ========= الأزرار ========= */
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
        {
          caption: "هذا ملف PDF 📄"
        }
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
              [{ text: "يوتيوب", url: "https://youtube.com" }]
            ]
          }
        }
      );
    }

    if (query.data === "buttons") {
      await bot.sendMessage(chatId, "مثال أزرار بروابط:", {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "Google", url: "https://google.com" },
              { text: "YouTube", url: "https://youtube.com" }
            ]
          ]
        }
      });
    }

    await bot.answerCallbackQuery(query.id);
  } catch (err) {
    console.error("خطأ:", err.message);
  }
});

/* ========= تشغيل السيرفر وضبط Webhook ========= */
app.listen(PORT, async () => {
  console.log(`السيرفر يعمل على المنفذ ${PORT}`);

  const webhookUrl = `https://${domain}/bot${token}`;

  try {
    await bot.deleteWebHook();
    await bot.setWebHook(webhookUrl);
    console.log("Webhook تم ضبطه بنجاح");
  } catch (error) {
    console.error("فشل ضبط Webhook:", error.message);
  }
});
