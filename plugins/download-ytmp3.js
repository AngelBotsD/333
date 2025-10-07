// comandos/ytmp3.js — Sky API (solo audio, sin selección)
import axios from "axios";
import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";

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
    const title = d.title || "YouTube";
    const durationTxt = d.duration ? fmtSec(d.duration) : "—";
    const thumb = d.thumbnail || "";
    const audioSrc = String(d.audio);

    // 2) Aviso de descarga
    const caption =
`⚡ 𝗬𝗼𝘂𝗧𝘂𝗯𝗲 — 𝗔𝘂𝗱𝗶𝗼

✦ 𝗧𝗶́𝘁𝘂𝗹𝗼: ${title}
✦ 𝗗𝘂𝗿𝗮𝗰𝗶𝗼́𝗻: ${durationTxt}
✦ 𝗦𝗼𝘂𝗿𝗰𝗲: api-sky.ultraplus.click
────────────
🤖 𝙎𝙪𝙠𝙞 𝘽𝙤𝙩`;

    if (thumb) {
      await conn.sendMessage(chatId, { image: { url: thumb }, caption }, { quoted: msg });
    } else {
      await conn.sendMessage(chatId, { text: caption }, { quoted: msg });
    }

    await conn.sendMessage(chatId, { text: "🎧 Procesando audio, espera un momento..." }, { quoted: msg });

    // 3) Transcode → MP3 (128k)
    const filePath = await transcodeToMp3Tmp(audioSrc, `ytmp3-${Date.now()}.mp3`);
    const buf = fs.readFileSync(filePath);

    // 4) Enviar como audio (sin límite)
    await conn.sendMessage(chatId, {
      audio: buf,
      mimetype: "audio/mpeg",
      fileName: `${title}.mp3`,
      caption:
`🎵 𝗬𝗧 𝗠𝗣𝟯 — 𝗟𝗶𝘀𝘁𝗼

✦ 𝗧𝗶́𝘁𝘂𝗹𝗼: ${title}
✦ 𝗗𝘂𝗿𝗮𝗰𝗶𝗼́𝗻: ${durationTxt}
✦ 𝗦𝗼𝘂𝗿𝗰𝗲: api-sky.ultraplus.click

🤖 𝙎𝙪𝙠𝙞 𝘽𝙤𝙩`
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