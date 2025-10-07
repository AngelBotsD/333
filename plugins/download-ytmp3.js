// comandos/ytmp3.js — Sky API (solo audio con info coqueta 💅)
import axios from "axios";
import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import yts from "yt-search";

const API_BASE = process.env.API_BASE || "https://api-sky.ultraplus.click";
const API_KEY  = process.env.API_KEY  || "Russellxz"; // tu API key

const isYouTube = (u = "") =>
  /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|music\.youtube\.com)\//i.test(u);

const fmtSec = (s) => {
  const n = Number(s || 0);
  const h = Math.floor(n / 3600);
  const m = Math.floor((n % 3600) / 60);
  const sec = n % 60;
  return (h ? `${h}:` : "") + `${m.toString().padStart(2,"0")}:${sec.toString().padStart(2,"0")}`;
};

// ==== Llama a tu Sky API (solo audio) ====
async function getYTFromSkyAudio(url) {
  const { data: api, status: http } = await axios.get(
    `${API_BASE}/api/download/yt.php`,
    {
      params: { url, format: "audio" },
      headers: { Authorization: `Bearer ${API_KEY}` },
      timeout: 30000,
      validateStatus: s => s >= 200 && s < 600
    }
  );
  if (http !== 200 || !api || api.status !== "true" || !api.data?.audio) {
    const msgErr = api?.error || `HTTP ${http}`;
    throw new Error(`No se pudo obtener audio (${msgErr}).`);
  }
  return api.data; // { title, audio, duration, thumbnail }
}

// ==== Transcodifica el source a MP3 128k ====
async function transcodeToMp3Tmp(srcUrl, outName = `ytmp3-${Date.now()}.mp3`) {
  const tmpDir = path.resolve("./tmp");
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  const outPath = path.join(tmpDir, outName);

  const resp = await axios.get(srcUrl, { responseType: "stream", timeout: 120000 });
  await new Promise((resolve, reject) => {
    ffmpeg(resp.data)
      .audioCodec("libmp3lame")
      .audioBitrate("128k")
      .format("mp3")
      .save(outPath)
      .on("end", resolve)
      .on("error", reject);
  });

  return outPath;
}

// ==== Handler principal ====
const handler = async (msg, { conn, text, usedPrefix, command }) => {
  const chatId = msg.key.remoteJid;
  const pref = (global.prefixes && global.prefixes[0]) || usedPrefix || ".";

  if (!text || !isYouTube(text)) {
    return conn.sendMessage(chatId, {
      text:
`✳️ 𝙐𝙨𝙤 𝙘𝙤𝙧𝙧𝙚𝙘𝙩𝙤:
${pref}${command} <enlace de YouTube>

📌 𝙀𝙟𝙚𝙢𝙥𝙡𝙤:
${pref}${command} https://youtu.be/dQw4w9WgXcQ`
    }, { quoted: msg });
  }

  await conn.sendMessage(chatId, { react: { text: "⏳", key: msg.key } });

  try {
    // 1) Llama a tu API (solo audio)
    const d = await getYTFromSkyAudio(text);
    const title = d.title || "Desconocido";
    const audioSrc = String(d.audio);
    const thumb = d.thumbnail || "";
    const author = d.author || {};

    // 2) Duración segura (si no viene, buscar con yt-search)
    let durationTxt = d.duration ? fmtSec(d.duration) : "—";
    if (durationTxt === "—") {
      try {
        const id = text.includes("youtu.be/")
          ? text.split("youtu.be/")[1].split("?")[0]
          : new URL(text).searchParams.get("v");
        const info = await yts({ videoId: id });
        if (info?.seconds) durationTxt = fmtSec(info.seconds);
      } catch {}
    }

    // 3) Info coqueta ✨
    const infoMsg = 
`> *𝙰𝚄𝙳𝙸𝙾 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝚁*

⭒ ִֶָ७ ꯭🎵˙⋆｡ - *𝚃𝚒́𝚝𝚞𝚕𝚘:* ${title}
⭒ ִֶָ७ ꯭🎤˙⋆｡ - *𝙰𝚛𝚝𝚒𝚜𝚝𝚊:* ${author?.name || "Desconocido"}
⭒ ִֶָ७ ꯭🕑˙⋆｡ - *𝙳𝚞𝚛𝚊𝚌𝚒ó𝚗:* ${durationTxt}
⭒ ִֶָ७ ꯭📺˙⋆｡ - *𝙲𝚊𝚕𝚒𝚍𝚊𝚍:* 128kbps
⭒ ִֶָ७ ꯭🌐˙⋆｡ - *𝙰𝚙𝚒:* adonix

» *𝘌𝘕𝘝𝘐𝘈𝘕𝘋𝘖 𝘈𝘜𝘋𝘐𝘖* 🎧
» *𝘈𝘎𝘜𝘈𝘙𝘋𝘌 𝘜𝘕 𝘗𝘖𝘊𝘖*...

⇆‌ ㅤ◁ㅤㅤ❚❚ㅤㅤ▷ㅤ↻

> \`\`\`© 𝖯𝗈𝗐𝖾𝗋𝖾𝗱 𝖻𝗒 angel.𝗑𝗒𝗓\`\`\``;

    // 4) Muestra miniatura o texto
    if (thumb) {
      await conn.sendMessage(chatId, { image: { url: thumb }, caption: infoMsg }, { quoted: msg });
    } else {
      await conn.sendMessage(chatId, { text: infoMsg }, { quoted: msg });
    }

    // 5) Transcode → MP3 (128k)
    const filePath = await transcodeToMp3Tmp(audioSrc, `ytmp3-${Date.now()}.mp3`);
    const buf = fs.readFileSync(filePath);

    // 6) Enviar audio (sin límite)
    await conn.sendMessage(chatId, {
      audio: buf,
      mimetype: "audio/mpeg",
      fileName: `${title}.mp3`,
      caption: `🎶 *${title}* — descargado con éxito 💫`
    }, { quoted: msg });

    try { fs.unlinkSync(filePath); } catch {}
    await conn.sendMessage(chatId, { react: { text: "✅", key: msg.key } });

  } catch (err) {
    console.error("❌ Error en ytmp3 (Sky):", err?.message || err);
    await conn.sendMessage(chatId, {
      text: `❌ *Error:* ${err?.message || "Fallo al procesar el audio."}`
    }, { quoted: msg });
    await conn.sendMessage(chatId, { react: { text: "❌", key: msg.key } });
  }
};

handler.command  = ["ytmp3", "yta"];
handler.help     = ["ytmp3 <url>", "yta <url>"];
handler.tags     = ["descargas"];

export default handler;