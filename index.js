const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const P = require('pino');

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    
    const sock = makeWASocket({
        auth: state,
        logger: P({ level: 'silent' }),
        printQRInTerminal: false,
        browser: ["Shawarma Bot", "Chrome", "1.0.0"]
    });

    // اذا طلبت كود رقمي
    if (!sock.authState.creds.registered) {
        const phoneNumber = process.env.PHONE_NUMBER;
        if (phoneNumber) {
            const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
            setTimeout(async () => {
                try {
                    const code = await sock.requestPairingCode(cleanNumber);
                    console.log(`\n========================================`);
                    console.log(`  كود الربط الخاص بك هو: ${code}`);
                    console.log(`  PAIRING CODE: ${code}`);
                    console.log(`========================================\n`);
                    console.log(`اذهب لواتساب > الأجهزة المرتبطة > ربط جهاز > ربط برقم الهاتف > اكتب الكود`);
                } catch (e) {
                    console.log("فشل طلب الكود:", e.message);
                }
            }, 3000);
        } else {
            console.log("SCAN QR CODE - لم تضع PHONE_NUMBER سيظهر QR");
        }
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('✅ تم الاتصال بنجاح - البوت جاهز!');
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        try {
            const msg = m.messages[0];
            if (!msg.message || msg.key.fromMe) return;
            const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
            const from = msg.key.remoteJid;

            if (text.toLowerCase().includes('مرحبا') || text.toLowerCase().includes('السلام') || text.toLowerCase().includes('menu') || text.toLowerCase() === 'hi') {
                await sock.sendMessage(from, { text: `أهلاً وسهلاً في مطعم الشاورما! 🌯\n\n1- شاورما دجاج - 3 دنانير\n2- شاورما لحم - 3.5 دينار\n3- عربي - 5 دنانير\n\nاكتب رقم الوجبة للطلب` });
            }
        } catch (e) { console.log(e) }
    });
}

startBot();
