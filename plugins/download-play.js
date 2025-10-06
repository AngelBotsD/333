import axios from "axios";
import yts from "yt-search";

const API_BASE = process.env.API_BASE || "https://api-sky.ultraplus.click";
const API_KEY  = process.env.API_KEY  || "Russellxz";

const handler = async (msg, { conn, text }) => {
  if (!text || !text.trim()) {
    return conn.sendMessage(
      msg.key.remoteJid,
      { text: "🎶 *𝙸𝚗𝚐𝚛𝚎𝚜𝚊 𝚎𝚕 𝙽𝚘𝚖𝚋𝚛𝚎 𝙳𝚎 𝙰𝚕𝚐𝚞𝚗𝚊 𝙲𝚊𝚗𝚌𝚒𝚘𝚗*." },
      { quoted: msg }
    );
  }

  const doProcess = async (retry = false) => {
    await conn.sendMessage(msg.key.remoteJid, { 
      react: { text: retry ? "🛠️" : "🕒", key: msg.key } 
    });

    const res = await yts({ query: text, hl: "es", gl: "MX" });
    const song = res.videos[0];
    if (!song) {
      return conn.sendMessage(
        msg.key.remoteJid,
        { text: "❌ *𝙽𝚘 𝙷𝚞𝚋𝚘 𝚁𝚎𝚜𝚞𝚕𝚝𝚊𝚍𝚘𝚜*." },
        { quoted: msg }
      );
    }

    const { url: videoUrl, title, timestamp: duration, author, thumbnail } = song;
    const artista = author.name;

    const extractUrl = (data) => {
      const search = (obj) => {
        if (!obj) return null;
        if (typeof obj === "string" && obj.includes("http")) {
          if (/\.(mp3|m4a|opus|webm)$/i.test(obj)) return obj;
        }
        if (typeof obj === "object") {
          for (const key in obj) {
            const found = search(obj[key]);
            if (found) return found;
          }
        }
        return null;
      };
      return search(data);
    };

    const tryApi = async (apiName, url) => {
      const r = await axios.get(url, { timeout: 10000 });
      const audioUrl = extractUrl(r.data);
      if (audioUrl) return { url: audioUrl, api: apiName };
      throw new Error(`${apiName}: No entregó URL válido`);
    };

    const apis = [
      tryApi("Sky", `${API_BASE}/ytdl?url=${encodeURIComponent(videoUrl)}&apikey=${API_KEY}&type=mp3&quality=128`),
      tryApi("MyAPI", `https://mayapi.ooguy.com/ytdl?url=${encodeURIComponent(videoUrl)}&type=mp3&quality=64&apikey=may-0595dca2`),
      tryApi("Adonix", `https://api-adonix.ultraplus.click/download/ytmp3?apikey=AdonixKeyno3h1z7435&url=${encodeURIComponent(videoUrl)}&quality=64`)
    ];

    try {
      const winner = await Promise.any(apis);
      const audioDownloadUrl = winner.url;

      await conn.sendMessage(msg.key.remoteJid, {  
        image: { url: thumbnail },  
        caption: `
> *𝙰𝚄𝙳𝙸𝙾 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝚁*
⭒ ִֶָ७ ꯭🎵˙⋆｡ - *𝚃𝚒́𝚝𝚞𝚕𝚘:* ${title}
⭒ ִֶָ७ ꯭🎤˙⋆｡ - *𝙰𝚛𝚝𝚒𝚜𝚝𝚊:* ${artista}
⭒ ִֶָ७ ꯭🕑˙⋆｡ - *𝙳𝚞𝚛𝚊𝚌𝚒ó𝚗:* ${duration}
⭒ ִֶָ७ ꯭📺˙⋆｡ - *𝙲𝚊𝚕𝚒𝚍𝚊𝚍:* 128kbps
⭒ ִֶָ७ ꯭🌐˙⋆｡ - *𝙰𝚙𝚒:* ${winner.api}

» *𝘌𝘕𝘝𝘐𝘈𝘕𝘋𝘖 𝘈𝘜𝘋𝘐𝘖* 🎧
» *𝘈𝘎𝘜𝘈𝘙𝘋𝘌 𝘜𝘕 𝘗𝘖𝘊𝘖*...
⇆‌ ㅤ◁ㅤㅤ❚❚ㅤㅤ▷ㅤ↻
> \`\`\`© 𝖯𝗈𝗐𝖾𝗋𝖾𝗱 𝖻𝗒 𝗁𝖾𝗋𝗇𝖺𝗇𝖽𝖾𝗓.𝗑𝗒𝗓\`\`\`
`.trim()
      }, { quoted: msg });

      await conn.sendMessage(msg.key.remoteJid, {  
        audio: { url: audioDownloadUrl },  
        mimetype: "audio/mpeg",  
        fileName: `${title.slice(0, 30)}.mp3`.replace(/[^\w\s.-]/gi, ''),  
        ptt: false  
      }, { quoted: msg });  

      await conn.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } });

    } catch (e) {
      if (!retry) return await doProcess(true);
      const errorMsg = `❌ *Error:* ${e.message || "Ninguna API respondió"}\n\n🔸 *Posibles soluciones:*\n• Verifica el nombre de la canción\n• Intenta con otro tema\n• Prueba más tarde`;
      await conn.sendMessage(msg.key.remoteJid, { text: errorMsg }, { quoted: msg });
    }
  };

  await doProcess(false);
};

handler.command = ["play"];
export default handler;