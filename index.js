const { Client, RemoteAuth } = require('whatsapp-web.js');
const mongoose = require('mongoose');
const { MongoStore } = require('wwebjs-mongo');

// Configuration
const MONGO_URI = process.env.MONGO_URI;
const PHONE_NUMBER = "241XXXXXXXX"; // Ton numéro au format international (ex pour le Gabon: 241...)

mongoose.connect(MONGO_URI).then(async () => {
    const store = new MongoStore({ mongoose: mongoose });
    
    const client = new Client({
        authStrategy: new RemoteAuth({
            store: store,
            backupSyncIntervalMs: 300000
        }),
        puppeteer: {
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable',
        }
    });

    // --- GESTION DU CODE DE JUMELAGE ---
    client.on('qr', async (qr) => {
        // Au lieu d'afficher le QR, on demande un code de jumelage
        try {
            const pairingCode = await client.requestPairingCode(PHONE_NUMBER);
            console.log('---------------------------------');
            console.log('VOTRE CODE DE JUMELAGE EST : ', pairingCode);
            console.log('---------------------------------');
        } catch (err) {
            console.error("Erreur lors de la génération du code :", err);
        }
    });

    client.on('ready', () => {
        console.log('🚀 Bot en ligne avec succès !');
    });

    // --- COMMANDES ---
    client.on('message', async (msg) => {
        // !menu
        if (msg.body === '!menu') {
            msg.reply("🤖 *Menu*\n\n!spam_[texte]_[nombre]\n!download (réponds à une vue unique)");
        }

        // !spam (avec petite pause pour éviter le ban direct)
        if (msg.body.startsWith('!spam')) {
            const parts = msg.body.split('_');
            const texte = parts[1];
            const nombre = parseInt(parts[2]);

            if (nombre > 100) return msg.reply("⚠️ Trop de messages ! Max 100.");
            
            for (let i = 0; i < nombre; i++) {
                await client.sendMessage(msg.from, texte);
                await new Promise(res => setTimeout(res, 500)); // Pause de 0.5s
            }
        }

        // !download (Récupérer vue unique)
        if (msg.hasQuotedMsg && msg.body === '!download') {
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
});
