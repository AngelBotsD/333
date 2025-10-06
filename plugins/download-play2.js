import fetch from "node-fetch";
import yts from "yt-search";
import axios from "axios";
import Jimp from "jimp";

const FORMAT_VIDEO = ["360", "480", "720", "1080", "1440", "4k"];

async function resizeImage(buffer, size = 300) {
  const image = await Jimp.read(buffer);
  return image.resize(size, size).getBufferAsync(Jimp.MIME_JPEG);
}

const handler = async (m, { conn, text, command }) => {
  await m.react('🔎');
await m.react('🔍');
await m.react('🌟');

  if (!text?.trim()) {
    return conn.reply(m.chat, `${emoji} Dime el nombre de la canción o video que buscas`, m, rcanal);
  }

  try {
    const search = await yts.search({ query: text, pages: 1 });
    if (!search.videos.length) return m.reply("❌ No se encontró nada con ese nombre.");

    const videoInfo = search.videos[0];
    const { title, thumbnail, timestamp, views, ago, url, author } = videoInfo;

    const [thumbFileRes, thumb2Res] = await Promise.all([
      conn.getFile(thumbnail),
      fetch('https://files.catbox.moe/f8qrut.png')
    ]);

    const thumb = thumbFileRes.data;
    const thumbResized = await resizeImage(thumb, 300); 
    const thumb2 = Buffer.from(await thumb2Res.arrayBuffer());

    const res3 = await fetch('https://files.catbox.moe/wfd0ze.jpg');
    const thumb3 = Buffer.from(await res3.arrayBuffer());

    const fkontak2 = {
      key: { fromMe: false, participant: "0@s.whatsapp.net" },
      message: {
        documentMessage: {
          title: "𝗗𝗘𝗦𝗖𝗔𝗥𝗚𝗔𝗡𝗗𝗢",
          fileName: botname,
          jpegThumbnail: thumb3
        }
      }
    }

    const fkontak = {
      key: { fromMe: false, participant: "0@s.whatsapp.net" },
      message: {
        orderMessage: {
          itemCount: 1,
          status: 1,
          surface: 1,
          message: `「 ${title} 」`,
          orderTitle: "Mejor Bot",
          thumbnail: thumbResized 
        }
      }
    };

    const vistas = formatViews(views);

    const infoMessage = `★ ${global.botname || 'Bot'} ★

  ┏☾ *Titulo:* 「 ${title} 」 
┏┛  *Canal:* ${author?.name || 'Desconocido'} 
┃✎ *Vistas:* ${vistas} 
┃✎ *Duración:* ${timestamp}
┃✎ *Publicado:* ${ago}
┃
┗⌼ ᴅᴇsᴄᴀʀɢᴀɴᴅᴏ...`;

    await conn.sendMessage(
      m.chat,
      {
        image: thumb,
        caption: infoMessage,
        contextInfo: {
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: channelRD.id,
            newsletterName: channelRD.name,
            serverMessageId: -1
          }
        }
      },
      { quoted: fkontak2 }
    );

    if (["play"].includes(command)) {
      try {
        const apiURL = `https://api.sylphy.xyz/download/ytmp3?apikey=sylphy_2962&url=${encodeURIComponent(url)}`;
        const res = await fetch(apiURL);
        const json = await res.json();

        if (!json?.status || !json.res?.url) {
          return m.reply("❌ No se pudo descargar el audio desde Sylphy.");
        }
await m.react('🎧');

        await conn.sendMessage(
          m.chat,
          {
            audio: { url: json.res.url },
            mimetype: "audio/mpeg",
            fileName: `${json.res.title || title}.mp3`
           // ptt: true
          },
          { quoted: fkontak }
        );

      } catch (err) {
        console.error("❌ Error en play:", err.message);
        return m.reply(`⚠️ Ocurrió un error: ${err.message}`);
      }
    }

    if (["play2"].includes(command)) {
      try {
        const apiURL = `https://api.sylphy.xyz/download/ytmp4?url=${encodeURIComponent(url)}&apikey=sylphy-fbb9`;
        const res = await fetch(apiURL);
        const json = await res.json();

        if (!json?.status || !json.res?.url) {
          return m.reply("❌ No se pudo descargar el video desde Sylphy.");
        }
await m.react('📽️');
        await conn.sendMessage(
          m.chat,
          {
            video: { url: json.res.url },
            fileName: `${json.res.title || title}.mp4`,
            mimetype: "video/mp4",
            thumbnail: thumb
          },
          { quoted: fkontak }
        );

      } catch (err) {
        console.error("❌ Error en play2:", err.message);
        return m.reply(`⚠️ Ocurrió un error: ${err.message}`);
      }
    }

  } catch (error) {
    console.error("❌ Error:", error);
    return m.reply(`⚠️ Ocurrió un error: ${error.message}`);
  }
};

handler.command = handler.help = ["play", "play2"];
handler.tags = ["downloader"];

export default handler;

function formatViews(views) {
  if (typeof views !== "number" || isNaN(views)) return "Desconocido";
  return views >= 1000
    ? (views / 1000).toFixed(1) + "k (" + views.toLocaleString() + ")"
    : views.toString();
}