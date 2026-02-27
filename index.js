require("dotenv").config();
const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

const token = process.env.BOT_TOKEN;
if (!token) {
  console.error("BOT_TOKEN is missing!");
  process.exit(1);
}

const app = express();
app.use(express.json());

const bot = new TelegramBot(token);

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.RAILWAY_STATIC_URL;

// ===== Webhook Setup =====
bot.setWebHook(`${BASE_URL}/bot${token}`);

app.post(`/bot${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// ====== أوامر البوت ======

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "مرحباً بك 👋\nاختر من القائمة:", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "نشر صورة", callback_data: "photo" }],
        [{ text: "نشر PDF", callback_data: "pdf" }],
        [{ text: "نشر فيديو", callback_data: "video" }],
      ],
    },
  });
});

bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;

  if (query.data === "photo") {
    await bot.sendPhoto(
      chatId,
      "https://via.placeholder.com/600x400",
      {
        caption: "هذه صورة مع نص 👌",
        reply_markup: {
          inline_keyboard: [
            [{ text: "زيارة الموقع", url: "https://google.com" }],
          ],
        },
      }
    );
  }

  if (query.data === "pdf") {
    await bot.sendDocument(
      chatId,
      "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      {
        caption: "هذا ملف PDF 📄",
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
            [{ text: "فتح الرابط", url: "https://youtube.com" }],
          ],
        },
      }
    );
  }

  bot.answerCallbackQuery(query.id);
});

app.listen(PORT, () => {
  console.log("Bot is running on webhook mode 🚀");
});
