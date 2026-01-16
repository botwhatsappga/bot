const { Client, LocalAuth } = require('whatsapp-web.js');

// On récupère juste ton numéro de téléphone dans les variables Render
const PHONE_NUMBER = +24174569963; 

if (!PHONE_NUMBER) {
    console.error("❌ ERREUR : La variable PHONE_NUMBER est manquante sur Render !");
    process.exit(1);
}

const client = new Client({
    authStrategy: new LocalAuth(), // Session stockée localement (sera effacée au reboot)
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: '/usr/bin/google-chrome-stable'
    }
});

// --- CONNEXION PAR CODE ---
client.on('qr', async () => {
    try {
        const pairingCode = await client.requestPairingCode(PHONE_NUMBER);
        console.log('---------------------------------');
        console.log('👉 TON CODE DE JUMELAGE : ', pairingCode);
        console.log('---------------------------------');
    } catch (err) {
        console.error("Erreur de génération du code :", err);
    }
});

client.on('ready', () => {
    console.log('✅ Bot connecté et prêt (Sans MongoDB) !');
});

// --- TES COMMANDES ---
client.on('message', async (msg) => {
    const body = msg.body;

    if (body === '!menu') {
        msg.reply("🤖 *BOT PARFAIT v1 (Simple)*\n\n" +
                  "1. !spam_[texte]_[nombre]\n" +
                  "2. !download (réponds à une vue unique)");
    }

    // Commande SPAM
    if (body.startsWith('!spam')) {
        const parts = body.split('_');
        const texte = parts[1];
        const nombre = parseInt(parts[2]);

        if (isNaN(nombre) || nombre > 100) return msg.reply("⚠️ Max 100 messages.");
        
        for (let i = 0; i < nombre; i++) {
            await client.sendMessage(msg.from, texte);
            await new Promise(r => setTimeout(r, 600)); 
        }
    }

    // Commande DOWNLOAD (Vue unique)
    if (msg.hasQuotedMsg && body === '!download') {
        const quotedMsg = await msg.getQuotedMessage();
        if (quotedMsg.isViewOnce) {
            const media = await quotedMsg.downloadMedia();
            if (media) {
                await client.sendMessage(msg.from, media, { caption: "🔓 Déverrouillé !" });
            }
        }
    }
});

client.initialize();
