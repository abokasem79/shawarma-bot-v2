const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const axios = require('axios');

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if(connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('انقطع الاتصال، إعادة محاولة...', shouldReconnect);
            if(shouldReconnect) startBot();
        } else if(connection === 'open') {
            console.log('✅ البوت اشتغل! رقم 0562 متصل الآن');
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if(!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        console.log(`رسالة جديدة من ${from}: ${text}`);

        // إذا وصلت صورة فاتورة أو PDF
        const isImage = !!msg.message.imageMessage;
        const isDoc = !!msg.message.documentMessage;

        if(isImage || isDoc) {
            console.log('📄 فاتورة وصلت! جاري إرسالها لـ Odoo...');
            
            // هنا سنضيف رابط Odoo لاحقاً
            await sock.sendMessage(from, { text: 'تم استلام الفاتورة بنجاح ✅ جاري تسجيلها في Odoo' });
        }
    });
}

startBot();
