const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    downloadContentFromMessage
} = require("@whiskeysockets/baileys");

const P = require("pino");
const qrcode = require("qrcode-terminal");
const yts = require("yt-search");
const http = require("http");

const PREFIX = ".";
const BOT_NAME = "DaveBot";
const AUTH_DIR = process.env.AUTH_DIR || "./auth_info";
const PORT = process.env.PORT || 10000;

let startTime = Date.now();

const menu = `
╭━━━『 🤖 DAVEBOT 』━━━╮
┃ 👑 Owner Only Mode
┃ ⚡ Status: Online
╰━━━━━━━━━━━━━━━━━━━━╯

╭━━『 🏠 BASIC 』━━╮
┃ • .ping
┃ • .hello
┃ • .menu
┃ • .online
┃ • .about
┃ • .owner
┃ • .help
┃ • .uptime
╰━━━━━━━━━━━━━━━━╯

╭━━『 😂 FUN 』━━╮
┃ • .joke
┃ • .fact
┃ • .flirt
┃ • .roast
┃ • .compliment
┃ • .mood
┃ • .luck
┃ • .fortune
┃ • .8ball
┃ • .riddle
┃ • .answer
╰━━━━━━━━━━━━━━╯

╭━━『 💕 SOCIAL 』━━╮
┃ • .girlfrend
┃ • .boyfriend
┃ • .crush
┃ • .soulmate
┃ • .bestie
┃ • .enemy
┃ • .brother
┃ • .sister
┃ • .bestcouple
┃ • .duo
┃ • .trio
┃ • .twins
┃ • .bodyguard
┃ • .partner
┃ • .rate
┃ • .compatibility
╰━━━━━━━━━━━━━━━━━╯

╭━━『 🎮 GAMES 』━━╮
┃ • .rps
┃ • .coinflip
┃ • .dice
┃ • .number
┃ • .quiz
┃ • .math
┃ • .scramble
╰━━━━━━━━━━━━━━━╯

╭━━『 👥 GROUP 』━━╮
┃ • .gmenu
┃ • .tag all
┃ • .kick
┃ • .delete
┃ • .rules
╰━━━━━━━━━━━━━━━╯

╭━━『 🎵 MUSIC 』━━╮
┃ • .play
╰━━━━━━━━━━━━━━━╯

╭━━『 🎲 CHALLENGE 』━━╮
┃ • .dare
┃ • .truth
╰━━━━━━━━━━━━━━━━━━━╯

╭━━『 👑 DAVE KEYZ HYPE 』━━╮
┃ • .who is the best
┃ • .who is the richest
┃ • .who is the coolest
┃ • .who is the GOAT
┃ • .who is the greatest
┃ • .who is the smartest
╰━━━━━━━━━━━━━━━━━━━━━━╯

💫 Powered by ${BOT_NAME}
`;

const jokes = [
    "Why did the computer go to the doctor? Because it had a virus 😂",
    "I told my phone I needed a break... now it won't stop showing me vacation ads 😂",
    "Why was the math book sad? It had too many problems 😭😂",
    "My Wi-Fi and I have a complicated relationship. It keeps disconnecting 😂"
];

const facts = [
    "Honey never spoils when properly stored. 🍯",
    "Octopuses have three hearts. 🐙",
    "A day on Venus is longer than its year. 🌍",
    "Bananas are berries botanically speaking. 🍌"
];

const compliments = [
    "You dey burst brain 😂🔥",
    "Your vibes are actually unmatched 😎✨",
    "You bring good energy everywhere you go 💯❤️",
    "You're one of the real ones 🤝🔥"
];

const roasts = [
    "Your Wi-Fi has more connection than your brain today 😂",
    "Even Google doesn't know what you're thinking 😭😂",
    "You're not slow... you're just loading permanently 😂",
    "If confusion was a person... oh wait 😂"
];

const dares = [
    "Send your funniest emoji combination 😂",
    "Type your next message using only emojis for one message 😭",
    "Say 'I am the GOAT' three times 😂",
    "Send a completely random harmless GIF to the group."
];

const truths = [
    "What's your most used emoji? 😂",
    "What's your favourite football club? ⚽",
    "What's the funniest thing you've seen today?",
    "What's one food you could eat every day? 🍕"
];

function randomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function randomPercent() {
    return Math.floor(Math.random() * 101);
}

function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
}

function getMentionedJid(msg) {
    const context = msg.message?.extendedTextMessage?.contextInfo;

    if (context?.mentionedJid?.length) {
        return context.mentionedJid[0];
    }

    if (context?.participant) {
        return context.participant;
    }

    return null;
}

async function startBot() {
    const { state, saveCreds } =
        await useMultiFileAuthState(AUTH_DIR);

    const sock = makeWASocket({
        auth: state,
        logger: P({ level: "silent" }),
        browser: ["DaveBot", "Chrome", "1.0.0"]
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log("\n📱 Scan this QR code with WhatsApp:\n");
            qrcode.generate(qr, { small: true });
        }

        if (connection === "open") {
            startTime = Date.now();
            console.log("\n✅ DaveBot is connected!");
            console.log("👑 Owner-only mode is ON");
        }

        if (connection === "close") {
            const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !==
                DisconnectReason.loggedOut;

            console.log("❌ Connection closed.");

            if (shouldReconnect) {
                console.log("🔄 Reconnecting...");
                startBot();
            } else {
                console.log(
                    "⚠️ Logged out. Scan a new QR code."
                );
            }
        }
    });

    sock.ev.on("messages.upsert", async ({ messages }) => {
        try {
            const msg = messages[0];

            if (!msg || !msg.message) return;

            // OWNER ONLY
            if (!msg.key.fromMe) return;

            const jid = msg.key.remoteJid;

            if (!jid) return;

            const text =
                msg.message.conversation ||
                msg.message.extendedTextMessage?.text ||
                "";

            if (!text) return;

            const body = text.trim();
            const command = body.toLowerCase();

            /*
            =========================
                DAVE KEYZ AUTO-HYPE
            =========================
            */

            if (command === ".who is the best") {
                await sock.sendMessage(jid, {
                    text: "👑 Obviously, Dave Keyz! 🔥😂"
                });
            }

            else if (command === ".who is the richest") {
                await sock.sendMessage(jid, {
                    text: "💰 Dave Keyz, obviously! 💸👑😂"
                });
            }

            else if (command === ".who is the coolest") {
                await sock.sendMessage(jid, {
                    text: "😎 Obviously Dave Keyz! 🥶🔥👑"
                });
            }

            else if (command === ".who is the goat") {
                await sock.sendMessage(jid, {
                    text: "🐐 Dave Keyz! Obviously! 👑🔥😂"
                });
            }

            else if (command === ".who is the greatest") {
                await sock.sendMessage(jid, {
                    text: "🏆 Dave Keyz! No debate! 👑🔥"
                });
            }

            else if (command === ".who is the smartest") {
                await sock.sendMessage(jid, {
                    text: "🧠 Dave Keyz, easy! 👑🔥😂"
                });
            }

            /*
            =========================
                 BASIC COMMANDS
            =========================
            */

            if (command === ".ping") {
                await sock.sendMessage(jid, {
                    text: "🏓 Pong!\n⚡ DaveBot is alive!"
                });
            }

            else if (command === ".hello") {
                await sock.sendMessage(jid, {
                    text: "👋 Hello boss! ❤️\nDaveBot is here 😎🔥"
                });
            }

            else if (
                command === ".menu" ||
                command === ".help"
            ) {
                await sock.sendMessage(jid, {
                    text: menu
                });
            }

            else if (command === ".online") {
                await sock.sendMessage(jid, {
                    text: "🟢 DaveBot is online and running! ⚡"
                });
            }

            else if (command === ".about") {
                await sock.sendMessage(jid, {
                    text:
                        "🤖 *DaveBot*\n\n" +
                        "⚡ Personal WhatsApp bot\n" +
                        "👑 Owner-only mode\n" +
                        "🔥 Fun • Games • Groups • Music"
                });
            }

            else if (command === ".owner") {
                await sock.sendMessage(jid, {
                    text: "👑 Owner: Dave\n🔥 Powered by DaveBot"
                });
            }

            else if (command === ".uptime") {
                await sock.sendMessage(jid, {
                    text:
                        `⏱️ *DaveBot Uptime*\n\n${formatUptime(
                            Date.now() - startTime
                        )}`
                });
            }

            /*
            =========================
                  FUN COMMANDS
            =========================
            */

            else if (command === ".joke") {
                await sock.sendMessage(jid, {
                    text: `😂 ${randomItem(jokes)}`
                });
            }

            else if (command === ".fact") {
                await sock.sendMessage(jid, {
                    text: `🧠 *Did you know?*\n\n${randomItem(facts)}`
                });
            }

            else if (command === ".flirt") {
                await sock.sendMessage(jid, {
                    text:
                        "😏✨ DaveBot says: You're looking like someone with premium vibes 😂❤️"
                });
            }

            else if (command === ".roast") {
                const target = getMentionedJid(msg);

                await sock.sendMessage(jid, {
                    text: target
                        ? `🔥 @${target.split("@")[0]} ${randomItem(roasts)} 😂`
                        : `🔥 ${randomItem(roasts)}`
                });
            }

            else if (command === ".compliment") {
                const target = getMentionedJid(msg);

                await sock.sendMessage(
                    jid,
                    {
                        text: target
                            ? `❤️ @${target.split("@")[0]} — ${randomItem(
                                  compliments
                              )}`
                            : `❤️ ${randomItem(compliments)}`
                    },
                    target
                        ? { mentions: [target] }
                        : {}
                );
            }

            else if (command === ".mood") {
                const moods = [
                    "😎 Chilling",
                    "🔥 Feeling unstoppable",
                    "😂 In a funny mood",
                    "😴 Sleepy",
                    "⚡ Full energy"
                ];

                await sock.sendMessage(jid, {
                    text: `😎 Today's mood: ${randomItem(moods)}`
                });
            }

            else if (command === ".luck") {
                await sock.sendMessage(jid, {
                    text:
                        `🍀 Your luck today is *${randomPercent()}%*!\n` +
                        "Good luck boss 😂🔥"
                });
            }

            else if (command === ".fortune") {
                const fortunes = [
                    "🔮 Something good is coming your way.",
                    "🔮 Today might surprise you.",
                    "🔮 Your next idea could be your best one yet.",
                    "🔮 Keep going — good things take time."
                ];

                await sock.sendMessage(jid, {
                    text: randomItem(fortunes)
                });
            }

            else if (command === ".8ball") {
                const answers = [
                    "🎱 Yes.",
                    "🎱 Definitely!",
                    "🎱 Probably 😂",
                    "🎱 Ask again later.",
                    "🎱 Not looking good 😭",
                    "🎱 Nope 😂"
                ];

                await sock.sendMessage(jid, {
                    text: randomItem(answers)
                });
            }

            /*
            =========================
                 SOCIAL COMMANDS
            =========================
            */

            else if (
                command === ".girlfrend" ||
                command === ".girlfriend"
            ) {
                const target = getMentionedJid(msg);

                if (target) {
                    await sock.sendMessage(
                        jid,
                        {
                            text:
                                `💖 @${target.split("@")[0]} is your girlfriend ❤️🥰`
                        },
                        { mentions: [target] }
                    );
                } else {
                    await sock.sendMessage(jid, {
                        text:
                            "💖 Someone is your girlfriend ❤️🥰\n😂 Mention someone to make it personal!"
                    });
                }
            }

            else if (command === ".boyfriend") {
                const target = getMentionedJid(msg);

                if (target) {
                    await sock.sendMessage(
                        jid,
                        {
                            text:
                                `💙 @${target.split("@")[0]} is your boyfriend ❤️🥰`
                        },
                        { mentions: [target] }
                    );
                } else {
                    await sock.sendMessage(jid, {
                        text:
                            "💙 Someone is your boyfriend ❤️🥰\n😂 Mention someone to make it personal!"
                    });
                }
            }

            else if (command === ".crush") {
                const target = getMentionedJid(msg);

                await sock.sendMessage(
                    jid,
                    {
                        text: target
                            ? `😍 @${target.split("@")[0]} is your crush ❤️😂`
                            : "😍 You have a secret crush 😂❤️"
                    },
                    target
                        ? { mentions: [target] }
                        : {}
                );
            }

            else if (command === ".soulmate") {
                const target = getMentionedJid(msg);

                await sock.sendMessage(
                    jid,
                    {
                        text: target
                            ? `💕 @${target.split("@")[0]} is your soulmate 🥰❤️`
                            : "💕 Your soulmate is somewhere out there 😂❤️"
                    },
                    target
                        ? { mentions: [target] }
                        : {}
                );
            }

            else if (command === ".bestie") {
                const target = getMentionedJid(msg);

                await sock.sendMessage(
                    jid,
                    {
                        text: target
                            ? `🤝 @${target.split("@")[0]} is your bestie 😂❤️`
                            : "🤝 You need to mention someone as your bestie 😂"
                    },
                    target
                        ? { mentions: [target] }
                        : {}
                );
            }

            else if (command === ".enemy") {
                const target = getMentionedJid(msg);

                await sock.sendMessage(
                    jid,
                    {
                        text: target
                            ? `😈 @${target.split("@")[0]} is your enemy 😂🔥`
                            : "😈 Your enemy has been detected 😂"
                    },
                    target
                        ? { mentions: [target] }
                        : {}
                );
            }

            else if (command === ".brother") {
                const target = getMentionedJid(msg);

                await sock.sendMessage(
                    jid,
                    {
                        text: target
                            ? `🫂 @${target.split("@")[0]} is your brother 💙😂`
                            : "🫂 Mention someone to make them your brother 😂"
                    },
                    target
                        ? { mentions: [target] }
                        : {}
                );
            }

            else if (command === ".sister") {
                const target = getMentionedJid(msg);

                await sock.sendMessage(
                    jid,
                    {
                        text: target
                            ? `👭 @${target.split("@")[0]} is your sister 💖😂`
                            : "👭 Mention someone to make them your sister 😂"
                    },
                    target
                        ? { mentions: [target] }
                        : {}
                );
            }

            else if (command === ".bestcouple") {
                const target = getMentionedJid(msg);

                await sock.sendMessage(
                    jid,
                    {
                        text: target
                            ? `💑 You two are the best couple 😂❤️`
                            : "💑 Mention someone to make a couple 😂❤️"
                    },
                    target
                        ? { mentions: [target] }
                        : {}
                );
            }

            else if (command === ".duo") {
                await sock.sendMessage(jid, {
                    text: "👯 You and your chosen partner are officially a duo 🔥"
                });
            }

            else if (command === ".trio") {
                await sock.sendMessage(jid, {
                    text: "👨‍👩‍👦 Trio mode activated 😂🔥"
                });
            }

            else if (command === ".twins") {
                const target = getMentionedJid(msg);

                await sock.sendMessage(
                    jid,
                    {
                        text: target
                            ? `👯 @${target.split("@")[0]} is your twin 😂🔥`
                            : "👯 Mention someone to find your twin!"
                    },
                    target
                        ? { mentions: [target] }
                        : {}
                );
            }

            else if (command === ".bodyguard") {
                const target = getMentionedJid(msg);

                await sock.sendMessage(
                    jid,
                    {
                        text: target
                            ? `🛡️ @${target.split("@")[0]} is now your bodyguard 😂🔥`
                            : "🛡️ Your imaginary bodyguard has arrived 😂"
                    },
                    target
                        ? { mentions: [target] }
                        : {}
                );
            }

            else if (command === ".partner") {
                const target = getMentionedJid(msg);

                await sock.sendMessage(
                    jid,
                    {
                        text: target
                            ? `🤝 @${target.split("@")[0]} is your partner 😂🔥`
                            : "🤝 Mention someone to choose your partner!"
                    },
                    target
                        ? { mentions: [target] }
                        : {}
                );
            }

            else if (command === ".rate") {
                const target = getMentionedJid(msg);
                const rating = Math.floor(Math.random() * 101);

                await sock.sendMessage(
                    jid,
                    {
                        text: target
                            ? `⭐ @${target.split("@")[0]} gets *${rating}/100* 😂🔥`
                            : `⭐ Your rating is *${rating}/100* 😂`
                    },
                    target
                        ? { mentions: [target] }
                        : {}
                );
            }

            else if (command === ".compatibility") {
                const target = getMentionedJid(msg);
                const percentage = randomPercent();

                await sock.sendMessage(
                    jid,
                    {
                        text: target
                            ? `💞 Compatibility with @${target.split("@")[0]}: *${percentage}%* ❤️😂`
                            : `💞 Your compatibility score: *${percentage}%* 😂`
                    },
                    target
                        ? { mentions: [target] }
                        : {}
                );
            }

            /*
            =========================
                    GAMES
            =========================
            */

            else if (command === ".coinflip") {
                await sock.sendMessage(jid, {
                    text:
                        Math.random() < 0.5
                            ? "🪙 Heads!"
                            : "🪙 Tails!"
                });
            }

            else if (command === ".dice") {
                const number =
                    Math.floor(Math.random() * 6) + 1;

                await sock.sendMessage(jid, {
                    text: `🎲 You rolled *${number}*!`
                });
            }

            else if (command === ".rps") {
                const choices = [
                    "✊ Rock",
                    "📄 Paper",
                    "✂️ Scissors"
                ];

                await sock.sendMessage(jid, {
                    text: `🎮 DaveBot chooses: *${randomItem(
                        choices
                    )}*`
                });
            }

            else if (command === ".number") {
                const number =
                    Math.floor(Math.random() * 100) + 1;

                await sock.sendMessage(jid, {
                    text:
                        `🔢 I'm thinking of a number between 1 and 100.\n` +
                        `Your clue: it's *${number % 2 === 0 ? "even" : "odd"}* 😂`
                });
            }

            else if (command === ".quiz") {
                const questions = [
                    "🧠 What is the capital of Nigeria?",
                    "🧠 How many players are on a football team on the pitch?",
                    "🧠 Which planet is known as the Red Planet?"
                ];

                await sock.sendMessage(jid, {
                    text: randomItem(questions)
                });
            }

            else if (command === ".math") {
                const a = Math.floor(Math.random() * 20) + 1;
                const b = Math.floor(Math.random() * 20) + 1;

                await sock.sendMessage(jid, {
                    text: `🧮 What is *${a} + ${b}*? 🤔`
                });
            }

            else if (command === ".scramble") {
                const words = [
                    "football",
                    "computer",
                    "whatsapp",
                    "javascript",
                    "victory"
                ];

                const word = randomItem(words);

                const scrambled = word
                    .split("")
                    .sort(() => Math.random() - 0.5)
                    .join("");

                await sock.sendMessage(jid, {
                    text:
                        `🔤 Unscramble this word:\n\n*${scrambled}*`
                });
            }

            /*
            =========================
                 RIDDLE / CHALLENGE
            =========================
            */

            else if (command === ".riddle") {
                await sock.sendMessage(jid, {
                    text:
                        "🧩 *Riddle:*\n\n" +
                        "What has keys but cannot open locks? 🤔"
                });
            }

            else if (command === ".answer") {
                await sock.sendMessage(jid, {
                    text: "🧠 Answer: A keyboard! ⌨️😂"
                });
            }

            else if (command === ".dare") {
                await sock.sendMessage(jid, {
                    text:
                        `🎲 *DARE*\n\n${randomItem(dares)}`
                });
            }

            else if (command === ".truth") {
                await sock.sendMessage(jid, {
                    text:
                        `🤔 *TRUTH*\n\n${randomItem(truths)}`
                });
            }

            /*
            =========================
                    GROUP
            =========================
            */

            else if (command === ".gmenu") {
                if (!jid.endsWith("@g.us")) {
                    await sock.sendMessage(jid, {
                        text: "❌ This command is for groups only."
                    });
                    return;
                }

                await sock.sendMessage(jid, {
                    text:
                        `👥 *DAVEBOT GROUP MENU*\n\n` +
                        `📢 .tag all\n` +
                        `👢 .kick\n` +
                        `🗑️ .delete\n` +
                        `📜 .rules\n\n` +
                        `👑 Owner-only mode`
                });
            }

            else if (command === ".tag all") {
                if (!jid.endsWith("@g.us")) {
                    await sock.sendMessage(jid, {
                        text: "❌ This command is for groups only."
                    });
                    return;
                }

                const metadata =
                    await sock.groupMetadata(jid);

                const participants =
                    metadata.participants.map(
                        (p) => p.id
                    );

                await sock.sendMessage(
                    jid,
                    {
                        text:
                            "📢 *Everyone has been tagged!*\n\n" +
                            participants
                                .map(
                                    (p) =>
                                        `@${p.split("@")[0]}`
                                )
                                .join(" "),
                        mentions: participants
                    }
                );
            }

            else if (command === ".kick") {
                if (!jid.endsWith("@g.us")) {
                    await sock.sendMessage(jid, {
                        text: "❌ .kick is for groups only."
                    });
                    return;
                }

                const target = getMentionedJid(msg);

                if (!target) {
                    await sock.sendMessage(jid, {
                        text:
                            "⚠️ Reply to a person's message or mention them with .kick"
                    });
                    return;
                }

                try {
                    await sock.groupParticipantsUpdate(
                        jid,
                        [target],
                        "remove"
                    );

                    await sock.sendMessage(jid, {
                        text:
                            `👢 @${target.split("@")[0]} has been removed.`,
                        mentions: [target]
                    });
                } catch (error) {
                    console.error(error);

                    await sock.sendMessage(jid, {
                        text:
                            "❌ I couldn't remove that member. Make sure this account is a group admin."
                    });
                }
            }

            else if (command === ".delete") {
                const context =
                    msg.message?.extendedTextMessage
                        ?.contextInfo;

                const quotedKey =
                    context?.stanzaId
                        ? {
                              remoteJid: jid,
                              fromMe:
                                  context.participant ===
                                  sock.user?.id,
                              id: context.stanzaId,
                              participant:
                                  context.participant
                          }
                        : null;

                if (!quotedKey) {
                    await sock.sendMessage(jid, {
                        text:
                            "🗑️ Reply to the message you want me to delete, then type *.delete*."
                    });
                    return;
                }

                try {
                    await sock.sendMessage(jid, {
                        delete: quotedKey
                    });
                } catch (error) {
                    console.error(error);

                    await sock.sendMessage(jid, {
                        text:
                            "❌ I couldn't delete that message."
                    });
                }
            }

            else if (command === ".ship") {
                const target = getMentionedJid(msg);
                const percentage = randomPercent();

                await sock.sendMessage(
                    jid,
                    {
                        text: target
                            ? `💞 @${target.split("@")[0]} is your ship partner! *${percentage}%* compatible 😂❤️`
                            : `💞 Your ship score is *${percentage}%* 😂❤️\nMention someone to make it personal!`
                    },
                    target
                        ? { mentions: [target] }
                        : {}
                );
            }

            else if (command === ".rules") {
                await sock.sendMessage(jid, {
                    text:
                        "📜 *GROUP RULES*\n\n" +
                        "1️⃣ Respect everyone.\n" +
                        "2️⃣ No unnecessary spam.\n" +
                        "3️⃣ No harmful content.\n" +
                        "4️⃣ Have fun 😂🔥"
                });
            }

            /*
            =========================
                     MUSIC
            =========================
            */

            else if (command.startsWith(".play")) {
                const song =
                    body.substring(5).trim();

                if (!song) {
                    await sock.sendMessage(jid, {
                        text:
                            "🎵 Usage:\n.play song name"
                    });
                    return;
                }

                try {
                    await sock.sendMessage(jid, {
                        text:
                            `🔎 Searching for "${song}"...`
                    });

                    const result =
                        await yts(song);

                    const video =
                        result.videos[0];

                    if (!video) {
                        await sock.sendMessage(jid, {
                            text:
                                "❌ Song not found."
                        });
                        return;
                    }

                    await sock.sendMessage(jid, {
                        text:
                            `🎵 *${video.title}*\n\n` +
                            `👤 ${video.author.name}\n` +
                            `⏱️ ${video.timestamp}\n\n` +
                            `▶️ ${video.url}`
                    });
                } catch (error) {
                    console.error(error);

                    await sock.sendMessage(jid, {
                        text:
                            "❌ Something went wrong while searching."
                    });
                }
            }

        } catch (error) {
            console.error(
                "❌ Message error:",
                error
            );
        }
    });
}

startBot();