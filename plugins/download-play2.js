import axios from "axios";
import yts from "yt-search";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import { pipeline } from "stream";

const streamPipe = promisify(pipeline);
const MAX_FILE_SIZE = 60 * 1024 * 1024;

// Config panel SKY premium
const SKY_BASE = "https://api-sky.ultraplus.click";
const SKY_KEY = "Russellxz"; // Tu API Key del panel premium

// Descarga directa por stream
async function downloadToFile(url, filePath) {
  const res = await axios.get(url, { responseType: "stream", timeout: 0 });
  await streamPipe(res.data, fs.createWriteStream(filePath));
  return filePath;
}

// Llama tu panel SKY para obtener link directo del video
async function getSkyVideo(url) {
  const res = await axios.get(`${SKY_BASE}/ytdl`, {
    params: { url, apikey: SKY_KEY }
  });
  if (!res.data?.status || !res.data?.result?.url) {
    throw new Error("SKY no devolvió un link válido.");
  }
  return { url: res.data.result.url, quality: res.data.result.quality || "Desconocida" };
}

const handler = async (msg, { conn, text }) => {
  const chat = msg.key.remoteJid;

  if (!text || !text.trim()) {
    return conn.sendMessage(chat, { text: "🎬 Ingresa el nombre del video de YouTube.\n\nEjemplo:\n.play2 karma police" }, { quoted: msg });
  }

  // reacción de carga
  await conn.sendMessage(chat, { react: { text: "🕒", key: msg.key } });

  // búsqueda rápida
  const search = await yts(text);
  if (!search.videos || search.videos.length === 0) {
    return conn.sendMessage(chat, { text: "❌ No se encontró ningún video." }, { quoted: msg });
  }

  const video = search.videos[0];
  const videoUrl = video.url;
  const { title, author, timestamp: duration, thumbnail } = video;

  // preview mientras se descarga
  const caption = `
> *𝚈𝚃𝙼𝙿4 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝚁*

⭒ 🎵 - *Título:* ${title}
⭒ 🎤 - *Artista:* ${author?.name || "Desconocido"}
⭒ 🕑 - *Duración:* ${duration}
⭒ 📺 - *Calidad:* auto
⭒ 🌐 - *API:* SKY

» VIDEO ENVIADO 🎧
». DISFRÚTALO CAMPEÓN..
`.trim();

  await conn.sendMessage(chat, { image: { url: thumbnail }, caption }, { quoted: msg });

  try {
    const { url: downloadUrl, quality } = await getSkyVideo(videoUrl);

    const tmp = path.join(process.cwd(), "tmp");
    if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });

    const file = path.join(tmp, `${Date.now()}_vid.mp4`);
    const dl = await axios.get(downloadUrl, { responseType: "stream", timeout: 0 });

    let totalSize = 0;
    dl.data.on("data", chunk => {
      totalSize += chunk.length;
      if (totalSize > MAX_FILE_SIZE) dl.data.destroy();
    });

    await streamPipe(dl.data, fs.createWriteStream(file));

    const stats = fs.statSync(file);
    if (stats.size > MAX_FILE_SIZE) {
      fs.unlinkSync(file);
      throw new Error("El archivo excede el límite de 60 MB permitido por WhatsApp.");
    }

    await conn.sendMessage(chat, {
      video: fs.readFileSync(file),
      mimetype: "video/mp4",
      fileName: `${title}.mp4`,
      caption,
      supportsStreaming: true
    }, { quoted: msg });

    fs.unlinkSync(file);
    await conn.sendMessage(chat, { react: { text: "✅", key: msg.key } });

  } catch (e) {
    console.error(e);
    await conn.sendMessage(chat, { text: `⚠️ Error al descargar el video:\n\n${e.message}` }, { quoted: msg });
  }
};

handler.command = ["play2", "ytmp4"];
export default handler;