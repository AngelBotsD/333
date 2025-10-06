import fetch from "node-fetch";
import yts from "yt-search";
import Jimp from "jimp";

async function resizeImage(buffer, size = 300) {
  const image = await Jimp.read(buffer);
  return image.resize(size, size).getBufferAsync(Jimp.MIME_JPEG);
}

async function fetchVideo(url, title) {
  const apiCalls = [];

  // 1️⃣ Adonix API
  apiCalls.push((async () => {
    const apiURL = `https://api-adonix.ultraplus.click/download?apikey=AdonixKeyno3h1z7435&url=${encodeURIComponent(url)}&format=mp4`;
    const res = await fetch(apiURL);
    const json = await res.json();
    if (!json?.status || !json?.result?.url) throw new Error("Adonix no tiene URL válida");
    return { url: json.result.url, title: json.result.title || title };
  })());

  // 2️⃣ Sylphy API
  apiCalls.push((async () => {
    const apiURL = `https://api.sylphy.xyz/download/ytmp4?url=${encodeURIComponent(url)}&apikey=sylphy-fbb9`;
    const res = await fetch(apiURL);
    const json = await res.json();
    if (!json?.status || !json.res?.url) throw new Error("Sylphy no tiene URL válida");
    return { url: json.res.url, title: json.res.title || title };
  })());

  // 3️⃣ MayAPI
  apiCalls.push((async () => {
    const q = "720"; // Calidad por defecto, puedes cambiar
    const apiURL = `https://mayapi.ooguy.com/ytdl?url=${encodeURIComponent(url)}&type=mp4&quality=${q}&apikey=may-0595dca2`;
    const res = await fetch(apiURL);
    const json = await res.json();
    if (!json?.status || !json.url) throw new Error("MayAPI no tiene URL válida");
    return { url: json.url, title: json.title || title };
  })());

  // Promise.any devuelve la primera que se resuelva correctamente
  return Promise.any(apiCalls);
}

const handler = async (m, { conn, text, command }) => {
  await m.react('🔎');
  await m.react('🔍');
  await m.react('🌟');

  if (!text?.trim()) {
    return conn.reply(m.chat, `❌ Dime el nombre del video que buscas`, m);
  }

  try {
    const search = await yts.search({ query: text, pages: 1 });
    if (!search.videos.length) return m.reply("❌ No se encontró nada con ese nombre.");

    const videoInfo = search.videos[0];
    const { title, thumbnail, timestamp, views, ago, url, author } = videoInfo;

    const thumbFileRes = await conn.getFile(thumbnail);
    const thumb = thumbFileRes.data;
    const thumbResized = await resizeImage(thumb, 300);

    const fkontak2 = {
      key: { fromMe: false, participant: "0@s.whatsapp.net" },
      message: {
        documentMessage: {
          title: "𝗗𝗘𝗦𝗖𝗔𝗥𝗚𝗔𝗡𝗗𝗢",
          fileName: global.botname || "Bot",
          jpegThumbnail: thumb
        }
      }
    };

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
┃✎ *Canal:* ${author?.name || 'Desconocido'} 
┃✎ *Vistas:* ${vistas} 
┃✎ *Duración:* ${timestamp}
┃✎ *Publicado:* ${ago}`;

    await conn.sendMessage(
      m.chat,
      {
        image: thumb,
        caption: infoMessage,
      },
      { quoted: fkontak2 }
    );

    if (["play2"].includes(command)) {
      try {
        const videoData = await fetchVideo(url, title);

        await m.react('📽️');
        await conn.sendMessage(
          m.chat,
          {
            video: { url: videoData.url },
            fileName: `${videoData.title || title}.mp4`,
            mimetype: "video/mp4",
            thumbnail: thumb
          },
          { quoted: fkontak }
        );

      } catch (err) {
        console.error("❌ Error en play2:", err.message);
        return m.reply(`⚠️ Ocurrió un error al descargar el video: ${err.message}`);
      }
    }

  } catch (error) {
    console.error("❌ Error:", error);
    return m.reply(`⚠️ Ocurrió un error: ${error.message}`);
  }
};

handler.command = handler.help = ["play2"];
handler.tags = ["downloader"];

export default handler;

function formatViews(views) {
  if (typeof views !== "number" || isNaN(views)) return "Desconocido";
  return views >= 1000
    ? (views / 1000).toFixed(1) + "k (" + views.toLocaleString() + ")"
    : views.toString();
}