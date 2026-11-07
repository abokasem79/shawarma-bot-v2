const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        browser: ["Shawarma Bot", "Chrome", "1.0"]
    });

    if (!sock.authState.creds.registered) {
        const num = process.env.PHONE_NUMBER;
        if (num) {
            const clean = num.replace(/[^0-9]/g, '');
            setTimeout(async () => {
                try {
                    const code = await sock.requestPairingCode(clean);
                    console.log(`\n==============================`);
                    console.log(`PAIRING CODE FOR ${clean}: ${code}`);
                    console.log(`كود الربط: ${code}`);
                    console.log(`==============================\n`);
                } catch(e){ console.log("Error:", e.message) }
            }, 3000);
        }
    }

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', (u) => {
        if (u.connection === 'open') console.log('✅ Connected - البوت جاهز!');
        if (u.connection === 'close' && u.lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) startBot();
    });
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;
        const txt = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").toLowerCase();
        if (txt.includes('مرحبا') || txt === 'hi' || txt.includes('menu') || txt.includes('السلام')) {
            await sock.sendMessage(msg.key.remoteJid, { text: "أهلا بمطعم الشاورما 🌯\n1- دجاج 3د\n2- لحم 3.5د\nاكتب رقم الوجبة" });
        }
    });
}
startBot();
