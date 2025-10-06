import axios from "axios";
import yts from "yt-search";
import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import { promisify } from "util";
import { pipeline } from "stream";

const streamPipe = promisify(pipeline);

// ==== CONFIG DE TU API ====
const API_BASE = process.env.API_BASE || "https://api-sky.ultraplus.click";
const API_KEY  = process.env.API_KEY  || "Russellxz"; // <-- tu API Key

// ==== UTILIDADES ====
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
    params: { url, format }, // format: 'audio' o 'video'
    headers: { Authorization: `Bearer ${API_KEY}` },
    timeout: 60000
  });
  if (!r.data || r.data.status !== "true" || !r.data.data) {
    throw new Error("API inválida o sin datos");
  }
  return r.data.data;
}

// ==== COMANDO PRINCIPAL ====
const handler = async (msg, { conn, text }) => {
  const pref = global.prefixes?.[0] || ".";

  if (!text || !text.trim()) {
    return conn.sendMessage(
      msg.key.remoteJid,
      { text: `✳️ Usa:\n${pref}play <término>\nEj: *${pref}play* bad bunny diles` },
      { quoted: msg }
    );
  }

  // reacción de carga
  await conn.sendMessage(msg.key.remoteJid, {
    react: { text: "⏳", key: msg.key }
  });

  // búsqueda en YouTube
  const res = await yts(text);
  const video = res.videos?.[0];
  if (!video) {
    return conn.sendMessage(msg.key.remoteJid, { text: "❌ Sin resultados." }, { quoted: msg });
  }

  const { url: videoUrl, title, thumbnail, author, timestamp: duration, views } = video;
  const viewsFmt = (views || 0).toLocaleString();

  const caption = `
❦𝑳𝑨 𝑺𝑼𝑲𝑰 𝑩𝑶𝑻❦

📀 𝙸𝚗𝚏𝚘 𝚍𝚎𝚕 𝚊𝚞𝚍𝚒𝚘:
❥ 𝑻𝒊𝒕𝒖𝒍𝒐: ${title}
❥ 𝑫𝒖𝒓𝒂𝒄𝒊𝒐𝒏: ${duration}
❥ 𝑽𝒊𝒔𝒕𝒂𝒔: ${viewsFmt}
❥ 𝑨𝒖𝒕𝒐𝒓: ${author?.name || "Desconocido"}
❥ 𝑳𝒊𝒏𝒌: ${videoUrl}
❥ API: api-sky.ultraplus.click

🎵 𝑳𝒂 𝑺𝒖𝒌𝒊 𝑩𝒐𝒕 - Audio
`.trim();

  // envía preview
  await conn.sendMessage(msg.key.remoteJid, { image: { url: thumbnail }, caption }, { quoted: msg });

  // descarga y envío
  await conn.sendMessage(msg.key.remoteJid, { text: "🎶 Descargando audio..." }, { quoted: msg });
  await downloadAudio(conn, msg, videoUrl, title);
};

// ==== DESCARGA DE AUDIO ====
async function downloadAudio(conn, msg, videoUrl, title) {
  const chatId = msg.key.remoteJid;

  const data = await callMyApi(videoUrl, "audio");
  const mediaUrl = data.audio || data.video;
  if (!mediaUrl) throw new Error("No se pudo obtener audio");

  const tmp = path.join(process.cwd(), "tmp");
  if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });

  const urlPath = new URL(mediaUrl).pathname || "";
  const ext = (urlPath.split(".").pop() || "").toLowerCase();
  const isMp3 = ext === "mp3";

  const inFile = path.join(tmp, `${Date.now()}_in.${ext || "bin"}`);
  await downloadToFile(mediaUrl, inFile);

  let outFile = inFile;
  if (!isMp3) {
    const tryOut = path.join(tmp, `${Date.now()}_out.mp3`);
    try {
      await new Promise((resolve, reject) =>
        ffmpeg(inFile)
          .audioCodec("libmp3lame")
          .audioBitrate("128k")
          .format("mp3")
          .save(tryOut)
          .on("end", resolve)
          .on("error", reject)
      );
      outFile = tryOut;
      try { fs.unlinkSync(inFile); } catch {}
    } catch {
      outFile = inFile;
    }
  }

  const sizeMB = fileSizeMB(outFile);
  if (sizeMB > 99) {
    try { fs.unlinkSync(outFile); } catch {}
    await conn.sendMessage(chatId, { text: `❌ El archivo de audio pesa ${sizeMB.toFixed(2)}MB (>99MB).` }, { quoted: msg });
    return;
  }

  const buffer = fs.readFileSync(outFile);
  await conn.sendMessage(chatId, {
    audio: buffer,
    mimetype: "audio/mpeg",
    fileName: `${title}.mp3`
  }, { quoted: msg });

  try { fs.unlinkSync(outFile); } catch {}
}

// ==== METADATOS ====
handler.command = ["play", "audio"];
handler.help = ["play <término>", "audio <nombre>"];
handler.tags = ["descargas"];

export default handler;