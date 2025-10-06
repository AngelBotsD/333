import axios from "axios";
import yts from "yt-search";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import { pipeline } from "stream";

const streamPipe = promisify(pipeline);
const MAX_FILE_SIZE = 60 * 1024 * 1024;

const ADONIX_API = "https://api-adonix.ultraplus.click/download/ytmp4";
const ADONIX_KEY = "AdonixKeyno3h1z7435";

async function downloadToFile(url, filePath) {
  const res = await axios.get(url, { responseType: "stream" });
  await streamPipe(res.data, fs.createWriteStream(filePath));
  return filePath;
}

async function getAdonixVideo(url) {
  const res = await axios.get(ADONIX_API, {
    params: { url, apikey: ADONIX_KEY }
  });
  if (!res.data?.status || !res.data?.result?.url) {
    throw new Error("Adonix no devolvió un link válido.");
  }
  return { url: res.data.result.url, quality: res.data.result.quality || "Desconocida" };
}

const handler = async (msg, { conn, text }) => {
  const chat = msg.key.remoteJid;

  if (!text || !text.trim()) {
    return conn.sendMessage(chat, { text: "🎬 Ingresa el nombre del video de YouTube.\n\nEjemplo:\n.ytmp4 karma police" }, { quoted: msg });
  }

  await conn.sendMessage(chat, { react: { text: "🕒", key: msg.key } });

  const search = await yts(text);
  if (!search.videos || search.videos.length === 0) {
    return conn.sendMessage(chat, { text: "❌ No se encontró ningún video." }, { quoted: msg });
  }

  const video = search.videos[0];
  const videoUrl = video.url;
  const { title, author, timestamp: duration, thumbnail } = video;

  // preview
  const caption = `
> *𝚈𝚃𝙼𝙿4 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝚁*

⭒ 🎵 - *Título:* ${title}
⭒ 🎤 - *Artista:* ${author?.name || "Desconocido"}
⭒ 🕑 - *Duración:* ${duration}
⭒ 📺 - *Calidad:* auto
⭒ 🌐 - *API:* Adonix

» VIDEO ENVIADO 🎧
». DISFRÚTALO CAMPEÓN..
`.trim();

  await conn.sendMessage(chat, { image: { url: thumbnail }, caption }, { quoted: msg });

  try {
    const { url: downloadUrl, quality } = await getAdonixVideo(videoUrl);

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

handler.command = ["ytmp4", "play2"];
export default handler;