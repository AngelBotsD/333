import yts from "yt-search"
import ytdl from "ytdl-core"
import { PassThrough } from "stream"

const handler = async (msg, { conn, text }) => {
  if (!text || !text.trim()) {
    return conn.sendMessage(msg.key.remoteJid, { text: "🎬 Ingresa el nombre de algún video" }, { quoted: msg })
  }

  await conn.sendMessage(msg.key.remoteJid, { react: { text: "🕒", key: msg.key } })

  const search = await yts({ query: text, hl: "es", gl: "MX" })
  const video = search.videos[0]
  if (!video) return conn.sendMessage(msg.key.remoteJid, { text: "❌ Sin resultados." }, { quoted: msg })

  const { url: videoUrl, title, timestamp: duration, author } = video
  const artista = author.name

  try {
    // Obtener info para asegurarnos que hay formatos válidos
    const info = await ytdl.getInfo(videoUrl)
    const format = ytdl.chooseFormat(info.formats, { quality: "highest", filter: "audioandvideo" })
    if (!format || !format.url) throw new Error("No se encontró un formato válido para descargar.")

    // Stream PassThrough para WhatsApp
    const stream = new PassThrough()
    ytdl(videoUrl, { quality: format.itag, filter: "audioandvideo" }).pipe(stream)

    await conn.sendMessage(
      msg.key.remoteJid,
      {
        video: stream,
        mimetype: "video/mp4",
        fileName: `${title}.mp4`,
        caption: `
> *𝚈𝚃𝙼𝙿4 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝚁*

⭒ 🎵 - *Título:* ${title}
⭒ 🎤 - *Artista:* ${artista}
⭒ 🕑 - *Duración:* ${duration}
⭒ 📺 - *Calidad:* Full
⭒ 🌐 - *Fuente:* YouTube

» Video enviado 🎧
        `.trim(),
        supportsStreaming: true,
        contextInfo: { isHd: true }
      },
      { quoted: msg }
    )

    await conn.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } })
  } catch (e) {
    console.error(e)
    await conn.sendMessage(msg.key.remoteJid, { text: `⚠️ Error al descargar el video:\n\n${e.message}` }, { quoted: msg })
  }
}

handler.command = ["play2"]
export default handler