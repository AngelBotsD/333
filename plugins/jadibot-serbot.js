const { useMultiFileAuthState, makeCacheableSignalKeyStore, fetchLatestBaileysVersion, DisconnectReason } = (await import("@whiskeysockets/baileys"));
import qrcode from "qrcode";
import NodeCache from "node-cache";
import fs from "fs";
import path from "path";
import pino from "pino";
import chalk from "chalk";
import * as ws from "ws";
import { makeWASocket } from "../lib/simple.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
if (!(global.conns instanceof Array)) global.conns = [];

let handler = async (m, { conn, args, usedPrefix, command }) => {
  const subBots = global.conns.filter(c => c.user && c.ws.socket && c.ws.socket.readyState !== ws.CLOSED);
  if (subBots.length >= 50) return m.reply("🚫 No hay más espacios para sub-bots disponibles.");

  let who = m.mentionedJid?.[0] || m.sender;
  let id = who.split`@`[0];
  let pathJadi = path.join(`./jadibot/`, id);

  if (fs.existsSync(pathJadi) && command === "code") {
    fs.rmSync(pathJadi, { recursive: true, force: true }); // 🔥 Forzamos modo pairing limpio
  }

  fs.mkdirSync(pathJadi, { recursive: true });
  await yukiJadiBot({ pathJadi, m, conn, args, usedPrefix, command });
};

handler.help = ['qr', 'code'];
handler.tags = ['serbot'];
handler.command = ['qr', 'code'];
export default handler;

export async function yukiJadiBot(options) {
  let { pathJadi, m, conn, args, usedPrefix, command } = options;

  const pairing = command === "code";
  const pathCreds = path.join(pathJadi, "creds.json");
  const { version } = await fetchLatestBaileysVersion();
  const msgRetryCache = new NodeCache();
  const { state, saveCreds } = await useMultiFileAuthState(pathJadi);

  const connectionOptions = {
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })) },
    msgRetryCache,
    browser: ['SubBot', 'Chrome', '2.0.0'],
    version,
    generateHighQualityLinkPreview: true
  };

  let sock = makeWASocket(connectionOptions);
  sock.isInit = false;

  const textQR = `
✦ 𝗩𝗶𝗻𝗰𝘂𝗹𝗮𝗰𝗶𝗼́𝗻 𝗽𝗼𝗿 𝗖𝗼́𝗱𝗶𝗴𝗼 𝗤𝗥 ✦

① Abre 𝗪𝗵𝗮𝘁𝘀𝗔𝗽𝗽 en tu teléfono  
② Pulsa ⋮ *Más opciones* → *Dispositivos vinculados*  
③ Presiona *"Vincular un dispositivo"*  
④ Escanea el código QR que aparecerá aquí`.trim();

  const textCode = `
✧ 𝗩𝗶𝗻𝗰𝘂𝗹𝗮𝗰𝗶𝗼́𝗻 𝗽𝗼𝗿 𝗖𝗼́𝗱𝗶𝗴𝗼 ✧

① Abre 𝗪𝗵𝗮𝘁𝘀𝗔𝗽𝗽 → *Dispositivos vinculados*  
② Toca *"Vincular con número"*  
③ Introduce este código:`.trim();

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr && !pairing) {
      const qrImage = await qrcode.toBuffer(qr, { scale: 8 });
      const sent = await conn.sendMessage(m.chat, { image: qrImage, caption: textQR }, { quoted: m });
      if (sent?.key) setTimeout(() => conn.sendMessage(m.chat, { delete: sent.key }), 30000);
    }

    if (pairing && !sock.authState.creds.registered) {
      try {
        let code = await sock.requestPairingCode(m.sender.split`@`[0]);
        code = code.match(/.{1,4}/g)?.join("-");
        await conn.sendMessage(m.chat, { text: `${textCode}\n\n🧩 *${code}*` }, { quoted: m });
      } catch (err) {
        console.log("❌ Error generando código:", err);
        m.reply("❌ No se pudo generar el código de vinculación, intenta otra vez.");
      }
    }

    if (connection === "open") {
      const name = sock.user?.name || "Desconocido";
      console.log(chalk.greenBright(`✅ Subbot ${name} (${path.basename(pathJadi)}) vinculado correctamente.`));
      global.conns.push(sock);
    }

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;
      if (reason === DisconnectReason.loggedOut || reason === 401) {
        fs.rmSync(pathJadi, { recursive: true, force: true });
        console.log(chalk.redBright(`[❌] Sesión ${path.basename(pathJadi)} cerrada.`));
      }
    }
  });

  sock.ev.on("creds.update", saveCreds);
}