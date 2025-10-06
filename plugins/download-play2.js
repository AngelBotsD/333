import yts from "yt-search"
import ytdl from "ytdl-core"
import fs from "fs"
import path from "path"
import { pipeline } from "stream"
import { promisify } from "util"

const streamPipeline = promisify(pipeline)
const MAX_FILE_SIZE = 60 * 1024 * 1024 // 60 MB WhatsApp limit

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
    const tmpDir = path.join(process.cwd(), "tmp")
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir)
    const filePath = path.join(tmpDir, `${Date.now()}_video.mp4`)

    // Stream de descarga con ytdl
    const videoStream = ytdl(videoUrl, { quality: "highestvideo", filter: "videoandaudio" })

    let totalSize = 0
    videoStream.on("data", chunk => {
      totalSize += chunk.length
      if (totalSize > MAX_FILE_SIZE) {
        videoStream.destroy(new Error("El archivo excede el límite de 60 MB permitido por WhatsApp."))
      }
    })

    // Guardar en disco mientras se descarga
    await streamPipeline(videoStream, fs.createWriteStream(filePath))

    // Enviar a WhatsApp
    await conn.sendMessage(
      msg.key.remoteJid,
      {
        video: fs.createReadStream(filePath),
        mimetype: "video/mp4",
        fileName: `${title}.mp4`,
        caption: `
> *𝚈𝚃𝙼𝙿4 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝚁*

⭒ 🎵 - *Título:* ${title}
⭒ 🎤 - *Artista:* ${artista}
⭒ 🕑 - *Duración:* ${duration}
⭒ 📺 - *Calidad:* Full HD
⭒ 🌐 - *Fuente:* YouTube

» Video enviado 🎧
        `.trim(),
        supportsStreaming: true,
        contextInfo: { isHd: true }
      },
      { quoted: msg }
    )

    fs.unlinkSync(filePath) // Borrar archivo temporal
    await conn.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } })

  } catch (e) {
    console.error(e)
    await conn.sendMessage(msg.key.remoteJid, { text: `⚠️ Error al descargar el video:\n\n${e.message}` }, { quoted: msg })
  }
}

handler.command = ["play2"]
export default handler