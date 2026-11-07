const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const pino = require('pino');

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: ['Shawarma Bot', 'Chrome', '1.0']
    });
    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            console.log('SCAN QR:');
            qrcode.generate(qr, { small: true });
            if (process.env.PHONE_NUMBER && !sock.authState.creds.registered) {
                const num = process.env.PHONE_NUMBER.replace(/[^0-9]/g, '');
                setTimeout(async () => {
                    const code = await sock.requestPairingCode(num);
                    console.log(`PAIRING CODE FOR ${num}: ${code}`);
                }, 3000);
            }
        }
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('Bot online!');
        }
    });
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;
        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        if (text.toLowerCase().includes('منيو') || text.toLowerCase().includes('menu')) {
            await sock.sendMessage(from, { text: '🌯 أهلا بك!\n1- شاورما دجاج\n2- شاورما لحم\n3- عربي' });
        }
    });
}
startBot();
