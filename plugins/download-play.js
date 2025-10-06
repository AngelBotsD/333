import axios from "axios";
import yts from "yt-search";
import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import { promisify } from "util";
import { pipeline } from "stream";
const streamPipe = promisify(pipeline);

const API_BASE = process.env.API_BASE || "https://api-sky.ultraplus.click";
const API_KEY  = process.env.API_KEY  || "Russellxz";

const pending = {};

async function downloadToFile(url, filePath) {
  const res = await axios.get(url, { responseType: "stream" });
  await streamPipe(res.data, fs.createWriteStream(filePath));
  return filePath;
}

function fileSizeMB(filePath) {
  const b = fs.statSync(filePath).size;
  return b / (1024 * 1024);
}

function extractUrl(data) {
  const search = (obj) => {
    if (!obj) return null;
    if (typeof obj === "string" && obj.includes("http") && /\.(mp3|m4a|opus|webm)$/i.test(obj)) return obj;
    if (typeof obj === "object") for (const k in obj) {
      const f = search(obj[k]);
      if (f) return f;
    }
    return null;
  };
  return search(data);
}

async function tryApi(apiName, url) {
  const r = await axios.get(url, { timeout: 10000 });
  const audioUrl = extractUrl(r.data);
  if (audioUrl) return { url: audioUrl, api: apiName };
  throw new Error(`${apiName}: no devolvió audio válido`);
}

async function getAudioFromAPIs(videoUrl) {
  const apis = [
    tryApi("Sky", `${API_BASE}/ytdl?url=${encodeURIComponent(videoUrl)}&apikey=${API_KEY}&type=mp3&quality=128`),
    tryApi("MyAPI", `https://mayapi.ooguy.com/ytdl?url=${encodeURIComponent(videoUrl)}&type=mp3&quality=64&apikey=may-0595dca2`),
    tryApi("Adonix", `https://api-adonix.ultraplus.click/download/ytmp3?apikey=AdonixKeyno3h1z7435&url=${encodeURIComponent(videoUrl)}&quality=64`)
  ];
  return await Promise.any(apis);
}

const handler = async (msg, { conn, text }) => {
  if (!text || !text.trim()) {
    return conn.sendMessage(msg.key.remoteJid, {
      text: "🎶 Ingresa el nombre de alguna canción.\nEjemplo: .play bad bunny diles"
    }, { quoted: msg });
  }

  await conn.sendMessage(msg.key.remoteJid, { react: { text: "⏳", key: msg.key } });

  const res = await yts(text);
  const video = res.videos?.[0];
  if (!video) {
    return conn.sendMessage(msg.key.remoteJid, { text: "❌ No se encontraron resultados." }, { quoted: msg });
  }

  const { url: videoUrl, title, timestamp: duration, author, views, thumbnail } = video;
  const caption = `
❦𝑳𝑨 𝑺𝑼𝑲𝑰 𝑩𝑶𝑻❦

🎵 *Título:* ${title}
🎤 *Artista:* ${author?.name || "Desconocido"}
🕒 *Duración:* ${duration}
👁️ *Vistas:* ${(views || 0).toLocaleString()}
🌐 *Fuente:* YouTube
📥 *API:* api-sky.ultraplus.click

📄 Reacciona o responde:
☛ 👍 Audio MP3
☛ 📄 Audio como Documento

© 𝐋𝐚 𝐒𝐮𝐤𝐢 𝐁𝐨𝐭 ✨
`.trim();

  const preview = await conn.sendMessage(msg.key.remoteJid, {
    image: { url: thumbnail },
    caption
  }, { quoted: msg });

  pending[preview.key.id] = { chatId: msg.key.remoteJid, videoUrl, title, commandMsg: msg };
  await conn.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } });

  if (!conn._audioListener) {
    conn._audioListener = true;
    conn.ev.on("messages.upsert", async ev => {
      for (const m of ev.messages) {
        const react = m.message?.reactionMessage;
        if (react) {
          const { key, text: emoji } = react;
          const job = pending[key.id];
          if (job && ["👍", "📄"].includes(emoji)) {
            await handleAudioDownload(conn, job, emoji === "📄", job.commandMsg);
          }
        }
      }
    });
  }
};

async function handleAudioDownload(conn, job, asDocument, quoted) {
  const { chatId, videoUrl, title } = job;
  try {
    await conn.sendMessage(chatId, { text: "🎧 Descargando audio, por favor espere..." }, { quoted });
    const winner = await getAudioFromAPIs(videoUrl);
    const tmpDir = path.join(process.cwd(), "tmp");
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    const fileIn = path.join(tmpDir, `${Date.now()}_in.webm`);
    await downloadToFile(winner.url, fileIn);

    const fileOut = path.join(tmpDir, `${Date.now()}_out.mp3`);
    await new Promise((resolve, reject) =>
      ffmpeg(fileIn)
        .audioCodec("libmp3lame")
        .audioBitrate("128k")
        .format("mp3")
        .save(fileOut)
        .on("end", resolve)
        .on("error", reject)
    );

    const sizeMB = fileSizeMB(fileOut);
    if (sizeMB > 99) {
      try { fs.unlinkSync(fileOut); } catch {}
      return conn.sendMessage(chatId, { text: `❌ El archivo pesa ${sizeMB.toFixed(2)}MB (>99MB)` }, { quoted });
    }

    const buffer = fs.readFileSync(fileOut);
    await conn.sendMessage(chatId, {
      [asDocument ? "document" : "audio"]: buffer,
      mimetype: "audio/mpeg",
      fileName: `${title}.mp3`,
      caption: asDocument ? undefined : `🎧 ${title}\n🎤 ${winner.api}\n© La Suki Bot`
    }, { quoted });

    try { fs.unlinkSync(fileOut); fs.unlinkSync(fileIn); } catch {}
    await conn.sendMessage(chatId, { react: { text: "✅", key: quoted.key } });
  } catch (e) {
    await conn.sendMessage(chatId, { text: `❌ Error: ${e.message}` }, { quoted });
  }
}

handler.command = ["play", "playpro"];
handler.tags = ["audio"];
handler.help = ["play <nombre>"];
export default handler;