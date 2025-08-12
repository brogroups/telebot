//
// Telegram bot kodi (Node.js, to'liq funksional)
//
// Ushbu kod foydalanuvchilarga fayllarni (APK va boshqa)
// ulashish, tilni o'zgartirish imkonini beradi. Adminlar
// esa fayllarni yuklash, o'chirish va statistikani ko'rishlari mumkin.

const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs').promises;

const BOT_TOKEN = '7796089637:AAH5OxqUmqGBMuyUoZ1Ee-WYbhbk5_sOMJ4';
const MAIN_ADMIN_ID = '6972232777';

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Ma'lumotlarni faylga saqlash va yuklash
const dataFile = 'bot_data.json';
let userLangs = new Map();
let uploadedFiles = new Map();
let requiredChannels = new Map();
let admins = new Set([MAIN_ADMIN_ID]); // Asosiy admin ID'si

async function saveData() {
    const data = {
        userLangs: Array.from(userLangs.entries()),
        uploadedFiles: Array.from(uploadedFiles.entries()),
        requiredChannels: Array.from(requiredChannels.entries()),
        admins: Array.from(admins)
    };
    await fs.writeFile(dataFile, JSON.stringify(data));
}

async function loadData() {
    try {
        const data = JSON.parse(await fs.readFile(dataFile, 'utf8'));
        userLangs = new Map(data.userLangs);
        uploadedFiles = new Map(data.uploadedFiles || []);
        requiredChannels = new Map(data.requiredChannels);
        admins = new Set(data.admins || [MAIN_ADMIN_ID]);
    } catch (error) {
        console.log('Ma\'lumotlar fayli topilmadi yoki bo\'sh. Yangi fayl yaratiladi.');
    }
}

loadData();

// Foydalanuvchi holatlarini saqlash uchun Map
const userStates = new Map();
const tempFileMap = new Map(); // Yangi vaqtinchalik xotira

// --- TILGA MOS MATN VA TUGMALAR ---
const texts = {
    'uz': {
        'welcome': "Assalomu alaykum! Iltimos, tilni tanlang:",
        'main_menu_text': "Bosh menyu",
        'apps_list': "Mavjud ilovalar va fayllar ro'yxati:",
        'admin_panel_title': "🤖 Admin paneli",
        'stats_text': "📊 Bot statistikasi:\n\n• Foydalanuvchilar: %s ta\n• Yuklangan fayllar: %s ta\n• Ulanilgan kanallar: %s ta",
        'send_file_prompt': "➡️ Istalgan turdagi fayl yuboring.",
        'file_saved': "✅ Fayl muvaffaqiyatli saqlandi!",
        'not_admin': "⛔ Siz admin emassiz!",
        'channels_list': "🔗 Ulanilgan kanallar ro'yxati:",
        'add_channel_prompt_id': "➡️ Kanal ID'sini yuboring. Misol: `@kanal_uz`",
        'add_channel_prompt_link': "➡️ Kanalning taklif havolasini yuboring. Misol: `https://t.me/kanal_uz`",
        'channel_added': "✅ Kanal muvaffaqiyatli qo'shildi!",
        'post_to_users_prompt': "📝 Bot foydalanuvchilariga yuborish uchun matn va rasm/fayl yuboring.",
        'post_to_users_sent': "✅ Xabar foydalanuvchilarga muvaffaqiyatli yuborildi!",
        'join_channel_prompt': "Botdan foydalanish uchun quyidagi kanalga obuna bo'ling:",
        'check_subscribe': "Obunani tekshirish",
        'already_joined': "Siz allaqachon obuna bo'lgansiz!",
        'choose_file_to_delete': "O'chirish uchun faylni tanlang:",
        'no_files_found': "🚫 Hozirda hech qanday fayl yo'q.",
        'no_channels_found': "🚫 Hozirda hech qanday kanal yo'q.",
        'file_deleted': "✅ Fayl o'chirildi.",
        'channel_deleted_success': "✅ Kanal o'chirildi.",
        'channel_not_found': "🚫 Kanal topilmadi yoki bot admin emas.",
        'file_upload_error': "❌ Faylni yuklashda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.",
        'change_lang_text': "🇺🇿 Tilni tanlang:",
        'lang_changed': "✅ Til muvaffaqiyatli o'zgartirildi!",
        'add_admin_prompt': "➡️ Yangi adminning ID'sini yuboring.",
        'admin_added': "✅ Yangi admin muvaffaqiyatli qo'shildi!",
        'admin_already_exists': "❌ Bu foydalanuvchi allaqachon admin.",
        'remove_admin_prompt': "➡️ O'chirish uchun adminni tanlang:",
        'admin_removed': "✅ Admin muvaffaqiyatli o'chirildi!",
        'no_other_admins': "🚫 Hozirda boshqa adminlar yo'q."
    },
    'ru': {
        'welcome': "Здравствуйте! Пожалуйста, выберите язык:",
        'main_menu_text': "Главное меню",
        'apps_list': "Список доступных приложений и файлов:",
        'admin_panel_title': "🤖 Панель администратора",
        'stats_text': "📊 Статистика бота:\n\n• Пользователи: %s\n• Загруженные файлы: %s\n• Привязанные каналы: %s",
        'send_file_prompt': "➡️ Отправьте файл любого типа.",
        'file_saved': "✅ Файл успешно сохранен!",
        'not_admin': "⛔ Вы не являетесь администратором!",
        'channels_list': "🔗 Список привязанных каналов:",
        'add_channel_prompt_id': "➡️ Отправьте ID канала. Пример: `@kanal_ru`",
        'add_channel_prompt_link': "➡️ Отправьте ссылку на канал. Пример: `https://t.me/kanal_ru`",
        'channel_added': "✅ Канал успешно добавлен!",
        'post_to_users_prompt': "📝 Отправьте текст и изображение/файл для публикации пользователям бота.",
        'post_to_users_sent': "✅ Сообщение успешно отправлено пользователям!",
        'join_channel_prompt': "Чтобы использовать бота, подпишитесь на канал:",
        'check_subscribe': "Проверить подписку",
        'already_joined': "Вы уже подписаны!",
        'choose_file_to_delete': "Выберите файл для удаления:",
        'no_files_found': "🚫 Сейчас нет файлов.",
        'no_channels_found': "🚫 Сейчас нет каналов.",
        'file_deleted': "✅ Файл удален.",
        'channel_deleted_success': "✅ Канал удален.",
        'channel_not_found': "🚫 Канал не найден или бот не является администратором.",
        'file_upload_error': "❌ Произошла ошибка при загрузке файла. Пожалуйста, попробуйте еще раз.",
        'change_lang_text': "🇺🇿 Выберите язык:",
        'lang_changed': "✅ Язык успешно изменен!",
        'add_admin_prompt': "➡️ Отправьте ID нового администратора.",
        'admin_added': "✅ Новый администратор успешно добавлен!",
        'admin_already_exists': "❌ Этот пользователь уже является администратором.",
        'remove_admin_prompt': "➡️ Выберите администратора для удаления:",
        'admin_removed': "✅ Администратор успешно удален!",
        'no_other_admins': "🚫 Сейчас нет других администраторов."
    },
    'en': {
        'welcome': "Hello! Please select a language:",
        'main_menu_text': "Main Menu",
        'apps_list': "List of available apps and files:",
        'admin_panel_title': "🤖 Admin Panel",
        'stats_text': "📊 Bot statistics:\n\n• Users: %s\n• Uploaded files: %s\n• Linked channels: %s",
        'send_file_prompt': "➡️ Send any type of file.",
        'file_saved': "✅ File saved successfully!",
        'not_admin': "⛔ You are not an admin!",
        'channels_list': "🔗 List of linked channels:",
        'add_channel_prompt_id': "➡️ Send the channel ID. Example: `@channel_uz`",
        'add_channel_prompt_link': "➡️ Send the channel invite link. Example: `https://t.me/channel_uz`",
        'channel_added': "✅ Channel added successfully!",
        'post_to_users_prompt': "📝 Send the text and image/file for the post to bot users.",
        'post_to_users_sent': "✅ Message sent to users successfully!",
        'join_channel_prompt': "To use the bot, please subscribe to the following channel:",
        'check_subscribe': "Check subscription",
        'already_joined': "You have already subscribed!",
        'choose_file_to_delete': "Choose a file to delete:",
        'no_files_found': "🚫 No files found.",
        'no_channels_found': "🚫 No channels found.",
        'file_deleted': "✅ File deleted.",
        'channel_deleted_success': "✅ Channel deleted.",
        'channel_not_found': "🚫 Channel not found or bot is not an admin.",
        'file_upload_error': "❌ An error occurred while uploading the file. Please try again.",
        'change_lang_text': "🇺🇿 Choose a language:",
        'lang_changed': "✅ Language changed successfully!",
        'add_admin_prompt': "➡️ Send the new admin's ID.",
        'admin_added': "✅ New admin added successfully!",
        'admin_already_exists': "❌ This user is already an admin.",
        'remove_admin_prompt': "➡️ Select an admin to remove:",
        'admin_removed': "✅ Admin removed successfully!",
        'no_other_admins': "🚫 No other admins found."
    }
};

// --- KLAVIATURALAR (Reply keyboards) ---
function getMainMenuKeyboard(lang, userId) {
    const is_admin = admins.has(userId.toString());
    let keyboard = [
        [{ text: "📂 Ilovalar" }, { text: "🇺🇿 Tilni almashtirish" }]
    ];
    if (is_admin) {
        keyboard.push([{ text: "⚙️ Admin panel" }]);
    }
    return {
        keyboard: keyboard,
        resize_keyboard: true,
        one_time_keyboard: false
    };
}

function getAdminPanelKeyboard(lang, userId) {
    let keyboard = [
        [{ text: "📊 Statistika" }, { text: "🔗 Kanallar" }],
        [{ text: "⬆️ Fayl yuklash" }, { text: "❌ Fayl o'chirish" }],
        [{ text: "👥 Foydalanuvchilarga e'lon" }],
        [{ text: "🔙 Orqaga" }]
    ];
    
    // Faqat asosiy admin uchun "Admin qo'shish" tugmasini qo'shamiz
    if (userId.toString() === MAIN_ADMIN_ID.toString()) {
        keyboard.unshift([{ text: "➕ Admin qo'shish" }, { text: "➖ Admin o'chirish" }]);
    }
    
    return {
        keyboard: keyboard,
        resize_keyboard: true,
        one_time_keyboard: false
    };
}

function getBackKeyboard(lang) {
    return {
        keyboard: [
            [{ text: "🔙 Orqaga" }]
        ],
        resize_keyboard: true,
        one_time_keyboard: false
    };
}

function getCancelKeyboard(lang) {
     return {
        keyboard: [
            [{ text: "↩️ Bekor qilish" }]
        ],
        resize_keyboard: true,
        one_time_keyboard: false
    };
}



// --- YORDAMCHI FUNKSIYALAR ---
async function checkSubscription(userId) {
    if (requiredChannels.size === 0) return true;

    for (const [channelId, channelLink] of requiredChannels) {
        try {
            const member = await bot.getChatMember(channelId, userId);
            if (member.status !== 'member' && member.status !== 'creator' && member.status !== 'administrator') {
                return false;
            }
        } catch (error) {
            console.error(`Kanalga a'zolikni tekshirishda xatolik: ${channelId}`, error.message);
            return false;
        }
    }
    return true;
}

// Fayllarni to'g'ridan-to'g'ri yuborish funksiyasi
async function sendAllFiles(chatId, lang) {
    const allFiles = [...uploadedFiles.values()];

    if (allFiles.length > 0) {
        await bot.sendMessage(chatId, texts[lang].apps_list);
        for (const file of allFiles) {
            try {
                // Faylni file_id orqali yuborish
                await bot.sendDocument(chatId, file.fileId, { caption: file.fileName });
            } catch (error) {
                console.error(`Fayl yuborishda xatolik (${file.fileName}):`, error);
                await bot.sendMessage(chatId, `❌ "${file.fileName}" faylini yuborishda xatolik yuz berdi.`);
            }
        }
    } else {
        await bot.sendMessage(chatId, texts[lang].no_files_found);
    }
}

function getLanguageKeyboard(lang) {
    return {
        inline_keyboard: [
            [{ text: '🇺🇿 Oʻzbek', callback_data: 'set_lang_uz' }],
            [{ text: '🇷🇺 Русский', callback_data: 'set_lang_ru' }],
            [{ text: '🇬🇧 English', callback_data: 'set_lang_en' }]
        ]
    };
}


// --- /START BUYRUG'I ---
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    if (!userLangs.has(userId)) {
        userLangs.set(userId, 'uz');
        await saveData();
        return bot.sendMessage(chatId, texts.uz.welcome, { reply_markup: getLanguageKeyboard('uz') });
    }

    const lang = userLangs.get(userId);
    const isSubscribed = await checkSubscription(userId);

    if (!isSubscribed) {
        const keyboard = { inline_keyboard: [] };
        for (const [channelId, channelLink] of requiredChannels) {
            keyboard.inline_keyboard.push([{ text: `Obuna bo'lish`, url: channelLink }]);
        }
        keyboard.inline_keyboard.push([{ text: texts[lang].check_subscribe, callback_data: 'check_subscribe' }]);
        return bot.sendMessage(chatId, texts[lang].join_channel_prompt, { reply_markup: keyboard });
    }
    
    await sendAllFiles(chatId, lang);
    await bot.sendMessage(chatId, texts[lang].main_menu_text, { reply_markup: getMainMenuKeyboard(lang, userId) });
});

// --- CALLBACK QUERY QAYTA ISHLASH ---
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const data = query.data;
    await bot.answerCallbackQuery(query.id);
    
    const lang = userLangs.get(userId) || 'uz';

    if (data.startsWith('set_lang_')) {
        const newLang = data.split('_')[2];
        userLangs.set(userId, newLang);
        await saveData();
        bot.deleteMessage(chatId, query.message.message_id);
        bot.sendMessage(chatId, texts[newLang].main_menu_text, { reply_markup: getMainMenuKeyboard(newLang, userId) });
        return;
    }
    
    if (data === 'check_subscribe') {
         const isSubscribed = await checkSubscription(userId);
         if (isSubscribed) {
            bot.editMessageText(texts[lang].already_joined, { chat_id: chatId, message_id: query.message.message_id });
            await sendAllFiles(chatId, lang);
            bot.sendMessage(chatId, texts[lang].main_menu_text, { reply_markup: getMainMenuKeyboard(lang, userId) });
         } else {
            bot.sendMessage(chatId, texts[lang].join_channel_prompt, { reply_markup: query.message.reply_markup });
         }
         return;
    }

    if (!admins.has(userId.toString())) return;
    
    if (data.startsWith('delete_file_')) {
        const fileIndex = data.split('_')[2];
        const fileIdToDelete = tempFileMap.get(fileIndex); // Qisqa indeks orqali haqiqiy fileId topiladi
        if (fileIdToDelete && uploadedFiles.has(fileIdToDelete)) {
            uploadedFiles.delete(fileIdToDelete);
            await saveData();
            bot.deleteMessage(chatId, query.message.message_id);
            bot.sendMessage(chatId, texts[lang].file_deleted, { reply_markup: getAdminPanelKeyboard(lang, userId) });
        }
        tempFileMap.clear(); // Ish tugagandan so'ng xotira tozalanadi
    }
    
    if (data.startsWith('delete_channel_')) {
        const channelIdToDelete = data.split('_')[2];
        if (requiredChannels.has(channelIdToDelete)) {
            requiredChannels.delete(channelIdToDelete);
            await saveData();
            bot.deleteMessage(chatId, query.message.message_id);
            bot.sendMessage(chatId, texts[lang].channel_deleted_success, { reply_markup: getAdminPanelKeyboard(lang, userId) });
        }
    }
    
    if (data.startsWith('remove_admin_')) {
        const adminIdToRemove = data.split('_')[2];
        if (admins.has(adminIdToRemove)) {
            admins.delete(adminIdToRemove);
            await saveData();
            bot.deleteMessage(chatId, query.message.message_id);
            bot.sendMessage(chatId, texts[lang].admin_removed, { reply_markup: getAdminPanelKeyboard(lang, userId) });
        }
    }
    
    if (data === 'admin_back') {
        bot.deleteMessage(chatId, query.message.message_id);
        bot.sendMessage(chatId, texts[lang].main_menu_text, { reply_markup: getMainMenuKeyboard(lang, userId) });
    }
});

// --- MATNLI XABARLARGA JAVOB BERISH (Reply keyboard) ---
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;
    const lang = userLangs.get(userId) || 'uz';
    const state = userStates.get(userId);

    // Buyruqlarni e'tiborsiz qoldiramiz, ular o'ziga xos tinglovchilarda qayta ishlanadi
    if (msg.text && msg.text.startsWith('/')) {
        return;
    }
    
    // Adminning asosiy menudagi harakatlari
    if (admins.has(userId.toString())) {
        if (text === "⚙️ Admin panel") {
            userStates.delete(userId);
            return bot.sendMessage(chatId, texts[lang].admin_panel_title, { reply_markup: getAdminPanelKeyboard(lang, userId) });
        }
        
        // Admin panel ichidagi harakatlar
        switch (text) {
            case "🔙 Orqaga":
                userStates.delete(userId);
                bot.sendMessage(chatId, texts[lang].main_menu_text, { reply_markup: getMainMenuKeyboard(lang, userId) });
                break;
            case "↩️ Bekor qilish":
                userStates.delete(userId);
                bot.sendMessage(chatId, texts[lang].admin_panel_title, { reply_markup: getAdminPanelKeyboard(lang, userId) });
                break;
            case "➕ Admin qo'shish":
                // Faqat asosiy admin bu funksiyadan foydalana oladi
                if (userId.toString() !== MAIN_ADMIN_ID.toString()) return;
                userStates.set(userId, 'awaiting_new_admin_id');
                bot.sendMessage(chatId, texts[lang].add_admin_prompt, { reply_markup: getCancelKeyboard(lang) });
                break;
            case "➖ Admin o'chirish":
                // Faqat asosiy admin bu funksiyadan foydalana oladi
                if (userId.toString() !== MAIN_ADMIN_ID.toString()) return;
                
                const otherAdmins = [...admins].filter(id => id !== MAIN_ADMIN_ID);
                if (otherAdmins.length === 0) {
                    return bot.sendMessage(chatId, texts[lang].no_other_admins, { reply_markup: getAdminPanelKeyboard(lang, userId) });
                }

                const removeAdminKeyboard = { inline_keyboard: [] };
                for (const adminId of otherAdmins) {
                    removeAdminKeyboard.inline_keyboard.push([{ text: `Admin ID: ${adminId}`, callback_data: `remove_admin_${adminId}` }]);
                }
                bot.sendMessage(chatId, texts[lang].remove_admin_prompt, { reply_markup: removeAdminKeyboard });
                break;
            case "📊 Statistika":
                const userCount = userLangs.size;
                const fileCount = uploadedFiles.size;
                const channelCount = requiredChannels.size;
                const statsText = texts[lang].stats_text
                    .replace('%s', userCount)
                    .replace('%s', fileCount)
                    .replace('%s', channelCount);
                bot.sendMessage(chatId, statsText, { reply_markup: getBackKeyboard(lang) });
                break;
            case "⬆️ Fayl yuklash":
                userStates.set(userId, 'awaiting_file');
                bot.sendMessage(chatId, texts[lang].send_file_prompt, { reply_markup: getCancelKeyboard(lang) });
                break;
            case "❌ Fayl o'chirish":
                userStates.delete(userId);
                if (uploadedFiles.size === 0) {
                    return bot.sendMessage(chatId, texts[lang].no_files_found, { reply_markup: getAdminPanelKeyboard(lang, userId) });
                }
                
                // Yangi logikaga ko'ra klaviatura yaratish
                tempFileMap.clear(); // Avvalgi ma'lumotlarni tozalaymiz
                const deleteFileKeyboard = { inline_keyboard: [] };
                let index = 0;
                for (const [fileId, file] of uploadedFiles) {
                    const callbackData = `delete_file_${index}`;
                    tempFileMap.set(index.toString(), fileId); // Qisqa indeksni haqiqiy ID bilan bog'lash
                    deleteFileKeyboard.inline_keyboard.push([{ text: file.fileName, callback_data: callbackData }]);
                    index++;
                }
                bot.sendMessage(chatId, texts[lang].choose_file_to_delete, { reply_markup: deleteFileKeyboard });
                break;
            case "🔗 Kanallar":
                userStates.delete(userId);
                const channelsKeyboard = { inline_keyboard: [] };
                if (requiredChannels.size === 0) {
                    channelsKeyboard.inline_keyboard.push([{ text: texts[lang].no_channels_found, callback_data: 'empty_callback' }]);
                } else {
                    for (const [channelId, channelLink] of requiredChannels) {
                        channelsKeyboard.inline_keyboard.push([{ text: channelId, callback_data: `delete_channel_${channelId}` }]);
                    }
                }
                channelsKeyboard.inline_keyboard.push([{ text: "🔗 Kanal qo'shish", callback_data: 'admin_add_channel' }]);
                channelsKeyboard.inline_keyboard.push([{ text: "🔙 Orqaga", callback_data: 'admin_back' }]);
                bot.sendMessage(chatId, texts[lang].channels_list, { reply_markup: channelsKeyboard });
                break;
            case "👥 Foydalanuvchilarga e'lon":
                userStates.set(userId, 'awaiting_post_to_users');
                bot.sendMessage(chatId, texts[lang].post_to_users_prompt, { reply_markup: getCancelKeyboard(lang) });
                break;
            default:
                if (state === 'awaiting_new_admin_id') {
                    const newAdminId = text.trim();
                    if (admins.has(newAdminId)) {
                        bot.sendMessage(chatId, texts[lang].admin_already_exists, { reply_markup: getAdminPanelKeyboard(lang, userId) });
                    } else {
                        admins.add(newAdminId);
                        await saveData();
                        bot.sendMessage(chatId, texts[lang].admin_added, { reply_markup: getAdminPanelKeyboard(lang, userId) });
                    }
                    userStates.delete(userId);
                } else if (state === 'awaiting_channel_id') {
                    const channelId = msg.text.trim();
                    try {
                        const chat = await bot.getChat(channelId);
                        if (chat.type === 'channel') {
                            userStates.set(userId, 'awaiting_channel_link');
                            userStates.set(`${userId}_channel_id`, channelId);
                            bot.sendMessage(chatId, texts[lang].add_channel_prompt_link, { reply_markup: getCancelKeyboard(lang) });
                        } else {
                            bot.sendMessage(chatId, "Bu kanal ID'si emas. Iltimos, to'g'ri kanal ID'sini kiriting.", { reply_markup: getCancelKeyboard(lang) });
                        }
                    } catch (error) {
                        console.error(error);
                        bot.sendMessage(chatId, texts[lang].channel_not_found, { reply_markup: getCancelKeyboard(lang) });
                    }
                } else if (state === 'awaiting_channel_link') {
                    const channelId = userStates.get(`${userId}_channel_id`);
                    const channelLink = msg.text.trim();
                    if (channelLink.startsWith('https://t.me/')) {
                        requiredChannels.set(channelId, channelLink);
                        await saveData();
                        bot.sendMessage(chatId, texts[lang].channel_added, { reply_markup: getAdminPanelKeyboard(lang, userId) });
                    } else {
                        bot.sendMessage(chatId, "Noto'g'ri kanal havolasi. Iltimos, `https://t.me/` bilan boshlanadigan havola kiriting.", { reply_markup: getCancelKeyboard(lang) });
                    }
                    userStates.delete(userId);
                } else if (state === 'awaiting_post_to_users') {
                    for (const [user_id, lang_code] of userLangs) {
                        try {
                            await bot.sendMessage(user_id, text);
                        } catch (error) {
                            console.error(`Foydalanuvchiga xabar yuborishda xatolik (ID: ${user_id}):`, error);
                        }
                    }
                    bot.sendMessage(chatId, texts[lang].post_to_users_sent, { reply_markup: getAdminPanelKeyboard(lang, userId) });
                } else {
                     bot.sendMessage(chatId, texts[lang].main_menu_text, { reply_markup: getMainMenuKeyboard(lang, userId) });
                }
                break;
        }
    } else { // Oddiy foydalanuvchilar uchun
        switch (text) {
            case "📂 Ilovalar":
                 await sendAllFiles(chatId, lang);
                 // Bu yerda menyuni yangilash uchun yangi xabar yuboriladi
                 bot.sendMessage(chatId, texts[lang].main_menu_text, { reply_markup: getMainMenuKeyboard(lang, userId) });
                break;
            case "🇺🇿 Tilni almashtirish":
                bot.sendMessage(chatId, texts[lang].change_lang_text, { reply_markup: getLanguageKeyboard(lang) });
                break;
            default:
                bot.sendMessage(chatId, texts[lang].main_menu_text, { reply_markup: getMainMenuKeyboard(lang, userId) });
                break;
        }
    }
});

// --- FAYL QAYTA ISHLASH (ADMIN UCHUN) ---
bot.on('document', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const state = userStates.get(userId);
    
    if (!admins.has(userId.toString())) return;

    const lang = userLangs.get(userId) || 'uz';
    const document = msg.document;
    
    if (state === 'awaiting_file') {
         try {
            uploadedFiles.set(document.file_id, { fileName: document.file_name, fileId: document.file_id });
            await saveData();
            bot.sendMessage(chatId, texts[lang].file_saved, { reply_markup: getAdminPanelKeyboard(lang, userId) });
        } catch (error) {
            console.error('Faylni saqlashda xatolik:', error);
            bot.sendMessage(chatId, texts[lang].file_upload_error, { reply_markup: getAdminPanelKeyboard(lang, userId) });
        }
    } else if (state === 'awaiting_post_to_users') {
        for (const [user_id, lang_code] of userLangs) {
             try {
                await bot.sendDocument(user_id, document.file_id, { caption: msg.caption });
            } catch (error) {
                console.error(`Foydalanuvchiga xabar yuborishda xatolik (ID: ${user_id}):`, error);
            }
        }
        bot.sendMessage(chatId, texts[lang].post_to_users_sent, { reply_markup: getAdminPanelKeyboard(lang, userId) });
    }
    userStates.delete(userId);
});

// Bot kanalga admin sifatida qo'shilganda
bot.on('chat_join_request', async (request) => {
    try {
        await bot.approveChatJoinRequest(request.chat.id, request.from.id);
    } catch (error) {
        console.error('Bot a\'zolik so\'rovini qabul qila olmadi:', error);
    }
});

bot.on('polling_error', (err) => {
    console.error('Polling xatosi:', err);
});