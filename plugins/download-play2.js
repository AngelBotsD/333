import axios from "axios";
import yts from "yt-search";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import { pipeline } from "stream";

const streamPipe = promisify(pipeline);

// ==== CONFIG DE TU API ====
const API_BASE = "https://api-adonix.ultraplus.click";
const API_KEY  = "AdonixKeyno3h1z7435";

// ===== UTILIDADES =====
async function downloadToFile(url, filePath) {
  const res = await axios.get(url, { responseType: "stream" });
  await streamPipe(res.data, fs.createWriteStream(filePath));
  return filePath;
}

function fileSizeMB(filePath) {
  const b = fs.statSync(filePath).size;
  return b / (1024 * 1024);
}

async function callMyApi(url, format) {
  const r = await axios.get(`${API_BASE}/api/download/yt.php`, {
    params: { url, format }, // format: 'audio' | 'video'
    headers: { Authorization: `Bearer ${API_KEY}` },
    timeout: 60000
  });
  if (!r.data || r.data.status !== "true" || !r.data.data) {
    throw new Error("API inválida o sin datos");
  }
  return r.data.data;
}

// ===== COMANDO PRINCIPAL =====
const handler = async (msg, { conn, text }) => {
  if (!text || !text.trim()) {
    return conn.sendMessage(msg.key.remoteJid, {
      text: "✳️ Usa: .play2 <término>\nEj: .play2 bad bunny diles"
    }, { quoted: msg });
  }

  await conn.sendMessage(msg.key.remoteJid, { react: { text: "⏳", key: msg.key } });

  // búsqueda
  const res = await yts(text);
  const video = res.videos?.[0];
  if (!video) return conn.sendMessage(msg.key.remoteJid, { text: "❌ Sin resultados." }, { quoted: msg });

  const { url: videoUrl, title, timestamp: duration, views, author, thumbnail } = video;
  const viewsFmt = (views || 0).toLocaleString();

  const caption = `
❦𝑳𝑨 𝑺𝑼𝑲𝑰 𝑩𝑶𝑻❦

📀 𝙸𝚗𝚏𝚘 𝚍𝚎𝚕 𝚟𝚒𝚍𝚎𝚘:
❥ 𝑻𝒊𝒕𝒖𝒍𝒐: ${title}
❥ 𝑫𝒖𝒓𝒂𝒄𝒊𝒐𝒏: ${duration}
❥ 𝑽𝒊𝒔𝒕𝒂𝒔: ${viewsFmt}
❥ 𝑨𝒖𝒕𝒐𝒓: ${author?.name || author || "Desconocido"}
❥ 𝑳𝒊𝒏𝒌: ${videoUrl}
❥ API: api-adonix.ultraplus.click
❦𝑳𝑨 𝑺𝑼𝑲𝑰 𝑩𝑶𝑻❦
`.trim();

  await conn.sendMessage(msg.key.remoteJid, { image: { url: thumbnail }, caption }, { quoted: msg });

  // descarga directa
  const data = await callMyApi(videoUrl, "video");
  const mediaUrl = data.video || data.audio;
  if (!mediaUrl) return conn.sendMessage(msg.key.remoteJid, { text: "❌ No se pudo obtener el video." }, { quoted: msg });

  const tmp = path.join(process.cwd(), "tmp");
  if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });
  const file = path.join(tmp, `${Date.now()}_vid.mp4`);
  await downloadToFile(mediaUrl, file);

  const sizeMB = fileSizeMB(file);
  if (sizeMB > 99) {
    try { fs.unlinkSync(file); } catch {}
    return conn.sendMessage(msg.key.remoteJid, { text: `❌ El video pesa ${sizeMB.toFixed(2)}MB (>99MB).` }, { quoted: msg });
  }

  await conn.sendMessage(msg.key.remoteJid, {
    video: fs.readFileSync(file),
    mimetype: "video/mp4",
    fileName: `${title}.mp4`,
    caption: `🎬 𝐀𝐪𝐮𝐢́ 𝐭𝐢𝐞𝐧𝐞𝐬 𝐭𝐮 𝐯𝐢𝐝𝐞𝐨~ 💫\n• API: api-adonix.ultraplus.click\n© 𝐋𝐚 𝐒𝐮𝐤𝐢 𝐁𝐨𝐭`
  }, { quoted: msg });

  try { fs.unlinkSync(file); } catch {}
};

// ===== METADATOS =====
handler.command = ["play2", "videoplay"];
handler.help = ["play2 <término>"];
handler.tags = ["descargas"];

export default handler;