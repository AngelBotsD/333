const { useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore, fetchLatestBaileysVersion } = (await import("@whiskeysockets/baileys"));
import qrcode from "qrcode";
import NodeCache from "node-cache";
import fs from "fs";
import path from "path";
import pino from "pino";
import chalk from "chalk";
import * as ws from "ws";
const { CONNECTING } = ws;
import { makeWASocket } from "../lib/simple.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
if (!(global.conns instanceof Array)) global.conns = [];

let handler = async (m, { conn, args, usedPrefix, command }) => {
  const subBots = [...new Set([...global.conns.filter(c => c.user && c.ws.socket && c.ws.socket.readyState !== ws.CLOSED)])];
  if (subBots.length >= 50) return m.reply("No se han encontrado espacios para *Sub-Bots* disponibles.");

  let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.fromMe ? conn.user.jid : m.sender;
  let id = `${who.split`@`[0]}`;
  let pathYukiJadiBot = path.join(`./jadibot/`, id);
  if (!fs.existsSync(pathYukiJadiBot)) fs.mkdirSync(pathYukiJadiBot, { recursive: true });

  await yukiJadiBot({ pathYukiJadiBot, m, conn, args, usedPrefix, command });
};

handler.help = ['qr', 'code'];
handler.tags = ['serbot'];
handler.command = ['qr', 'code'];
export default handler;

export async function yukiJadiBot(options) {
  let { pathYukiJadiBot, m, conn, args, usedPrefix, command } = options;

  if (command === 'code') {
    command = 'qr';
    args.unshift('code');
  }

  const mcode = args.some(a => /(--code|code)/.test(a));
  const pathCreds = path.join(pathYukiJadiBot, "creds.json");
  if (!fs.existsSync(pathYukiJadiBot)) fs.mkdirSync(pathYukiJadiBot, { recursive: true });

  try {
    if (args[0])
      fs.writeFileSync(pathCreds, JSON.stringify(JSON.parse(Buffer.from(args[0], "base64").toString("utf-8")), null, '\t'));
  } catch {
    conn.reply(m.chat, `✳️ Usa correctamente el comando » ${usedPrefix + command} code`, m);
    return;
  }

  const rtx = `
✦ 𝗩𝗶𝗻𝗰𝘂𝗹𝗮𝗰𝗶𝗼́𝗻 𝗽𝗼𝗿 𝗖𝗼́𝗱𝗶𝗴𝗼 𝗤𝗥 ✦

① Abre 𝗪𝗵𝗮𝘁𝘀𝗔𝗽𝗽 en tu teléfono  
② Pulsa ⋮ *Más opciones* → *Dispositivos vinculados*  
③ Presiona *"Vincular un dispositivo"*  
④ Escanea el código QR que aparecerá aquí`.trim();

  const rtx2 = `
✧ 𝗩𝗶𝗻𝗰𝘂𝗹𝗮𝗰𝗶𝗼́𝗻 𝗽𝗼𝗿 𝗖𝗼́𝗱𝗶𝗴𝗼 𝗠𝗮𝗻𝘂𝗮𝗹 ✧

① Abre 𝗪𝗵𝗮𝘁𝘀𝗔𝗽𝗽 → *Dispositivos vinculados*  
② Toca *"Vincular con número"*  
③ Introduce el código que aparecerá aquí`.trim();

  let { version } = await fetchLatestBaileysVersion();
  const msgRetryCache = new NodeCache();
  const { state, saveState, saveCreds } = await useMultiFileAuthState(pathYukiJadiBot);

  const connectionOptions = {
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
    },
    msgRetryCache,
    browser: mcode ? ['Ubuntu', 'Chrome', '110.0.5585.95'] : ['SubBot', 'Chrome', '2.0.0'],
    version,
    generateHighQualityLinkPreview: true
  };

  let sock = makeWASocket(connectionOptions);
  sock.isInit = false;

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, isNewLogin, qr } = update;

    if (qr && !mcode) {
      const qrImage = await qrcode.toBuffer(qr, { scale: 8 });
      const sent = await conn.sendMessage(m.chat, { image: qrImage, caption: rtx }, { quoted: m });
      if (sent?.key) setTimeout(() => conn.sendMessage(m.chat, { delete: sent.key }), 30000);
    }

    if (qr && mcode) {
      let secret = await sock.requestPairingCode(m.sender.split`@`[0]);
      secret = secret.match(/.{1,4}/g)?.join("-");
      await conn.sendMessage(m.chat, { text: rtx2 }, { quoted: m });
      const msg = await m.reply(`🧩 *Código:* ${secret}`);
      if (msg?.key) setTimeout(() => conn.sendMessage(m.chat, { delete: msg.key }), 40000);
    }

    const reason = lastDisconnect?.error?.output?.statusCode;
    if (connection === 'close') {
      if (reason === DisconnectReason.loggedOut || reason === 401) {
        console.log(chalk.redBright(`[❌] Sesión ${path.basename(pathYukiJadiBot)} cerrada. Borrando datos...`));
        fs.rmSync(pathYukiJadiBot, { recursive: true, force: true });
      } else {
        console.log(chalk.yellowBright(`[⚠️] Reconectando subbot ${path.basename(pathYukiJadiBot)}...`));
        setTimeout(() => yukiJadiBot(options), 5000);
      }
    }

    if (connection === 'open') {
      const name = sock.user?.name || 'Anónimo';
      console.log(chalk.greenBright(`✅ Subbot ${name} (${path.basename(pathYukiJadiBot)}) vinculado correctamente.`));
      global.conns.push(sock);
      await joinChannels(sock);
    }
  });

  sock.ev.on('creds.update', saveCreds);
}

async function joinChannels(conn) {
  if (!global.ch) return;
  for (const channelId of Object.values(global.ch)) {
    await conn.newsletterFollow(channelId).catch(() => { });
  }
}