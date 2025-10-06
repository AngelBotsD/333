import fetch from "node-fetch";
import yts from "yt-search";

const handler = async (m, { conn, text, command }) => {
  if (!text?.trim()) {
    return conn.reply(m.chat, `🛠️ Dime el nombre del video que buscas`, m);
  }

  try {
    // Buscar video en YouTube
    const search = await yts.search({ query: text, pages: 1 });
    if (!search.videos.length) return m.reply("❌ No se encontró nada con ese nombre.");

    const videoInfo = search.videos[0];
    const { url, title } = videoInfo;

    if (command === "play2") {
      const apiURL = `https://api.sylphy.xyz/download/ytmp4?url=${encodeURIComponent(url)}&apikey=sylphy-fbb9`;
      const res = await fetch(apiURL);
      const json = await res.json();

      if (!json?.status || !json.res?.url) {
        return m.reply("❌ No se pudo descargar el video desde Sylphy.");
      }

      await conn.sendMessage(
        m.chat,
        {
          video: { url: json.res.url },
          fileName: `${json.res.title || title}.mp4`,
          mimetype: "video/mp4",
        },
        { quoted: m }
      );
    }

  } catch (error) {
    console.error("❌ Error:", error);
    return m.reply(`⚠️ Ocurrió un error: ${error.message}`);
  }
};

handler.command = handler.help = ["play2"];
handler.tags = ["downloader"];

export default handler;