require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.BOT_TOKEN;

if (!token) {
    console.error("❌ BOT_TOKEN غير موجود في Environment Variables");
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

const channel = "@your_channel_username"; // ضع يوزر القناة
const ADMIN_ID = 123456789; // ضع Telegram ID الخاص بك

let userState = {};
let tempPost = {};

bot.onText(/\/start/, (msg) => {

    if (msg.from.id !== ADMIN_ID) {
        return bot.sendMessage(msg.chat.id, "❌ هذا البوت للإدارة فقط.");
    }

    const keyboard = {
        reply_markup: {
            inline_keyboard: [
                [{ text: "📢 نشر نص", callback_data: "text" }],
                [{ text: "🖼 نشر صورة", callback_data: "photo" }],
                [{ text: "🎥 نشر فيديو", callback_data: "video" }],
                [{ text: "📄 نشر PDF", callback_data: "pdf" }]
            ]
        }
    };

    bot.sendMessage(msg.chat.id, "اختر نوع المنشور:", keyboard);
});

bot.on("callback_query", (query) => {

    const userId = query.from.id;

    if (userId !== ADMIN_ID) {
        return bot.answerCallbackQuery(query.id, {
            text: "غير مصرح 🚫",
            show_alert: true
        });
    }

    userState[userId] = query.data;
    bot.sendMessage(userId, "أرسل المحتوى الآن:");
    bot.answerCallbackQuery(query.id);
});

bot.on("message", async (msg) => {

    const userId = msg.from.id;
    if (userId !== ADMIN_ID) return;

    const state = userState[userId];
    if (!state) return;

    // حفظ المحتوى
    if (state !== "awaiting_buttons") {
        tempPost[userId] = {
            type: state,
            text: msg.text,
            caption: msg.caption,
            photo: msg.photo,
            video: msg.video,
            document: msg.document
        };

        userState[userId] = "awaiting_buttons";

        return bot.sendMessage(userId,
`هل تريد إضافة أزرار؟

اكتب كل زر بهذا الشكل:
اسم الزر - الرابط

مثال:
موقعنا - https://example.com
واتساب - https://wa.me/966XXXXXXXXX

أو اكتب: بدون`
        );
    }

    // مرحلة إنشاء الأزرار
    let buttons = null;

    if (msg.text.toLowerCase() !== "بدون") {

        const lines = msg.text.split("\n");
        const keyboard = [];

        for (let line of lines) {
            const parts = line.split("-");
            if (parts.length < 2) continue;

            keyboard.push([{
                text: parts[0].trim(),
                url: parts[1].trim()
            }]);
        }

        if (keyboard.length > 0) {
            buttons = {
                reply_markup: {
                    inline_keyboard: keyboard
                }
            };
        }
    }

    const post = tempPost[userId];

    try {

        if (post.type === "text" && post.text) {
            await bot.sendMessage(channel, post.text, buttons || {});
        }

        if (post.type === "photo" && post.photo) {
            const fileId = post.photo[post.photo.length - 1].file_id;
            await bot.sendPhoto(channel, fileId, {
                caption: post.caption || "",
                ...(buttons || {})
            });
        }

        if (post.type === "video" && post.video) {
            await bot.sendVideo(channel, post.video.file_id, {
                caption: post.caption || "",
                ...(buttons || {})
            });
        }

        if (post.type === "pdf" && post.document) {
            await bot.sendDocument(channel, post.document.file_id, buttons || {});
        }

        await bot.sendMessage(userId, "✅ تم النشر بنجاح");
    } catch (err) {
        console.error(err);
        await bot.sendMessage(userId, "❌ حدث خطأ أثناء النشر");
    }

    delete userState[userId];
    delete tempPost[userId];
});