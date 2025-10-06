import axios from "axios"
import yts from "yt-search"
import fs from "fs"
import path from "path"
import { promisify } from "util"
import { pipeline } from "stream"

const streamPipe = promisify(pipeline)
const MAX_FILE_SIZE = 60 * 1024 * 1024 // 60 MB

const handler = async (msg, { conn, text }) => {
  const chat = msg.key.remoteJid
  if (!text || !text.trim()) {
    return conn.sendMessage(chat, { text: "🎬 Ingresa el nombre de algún video" }, { quoted: msg })
  }

  await conn.sendMessage(chat, { react: { text: "🕒", key: msg.key } })

  const search = await yts({ query: text, hl: "es", gl: "MX" })
  const video = search.videos[0]
  if (!video) {
    return conn.sendMessage(chat, { text: "❌ Sin resultados." }, { quoted: msg })
  }

  const { url: videoUrl, title, timestamp: duration, author } = video
  const artista = author.name

  const apis = [
    { name: "Sylphy", url: `https://api.sylphy.xyz/download/ytmp4?url=${encodeURIComponent(videoUrl)}&apikey=sylphy-fbb9` },
    { name: "Adonix", url: `https://api-adonix.ultraplus.click/download/ytmp4?url=${encodeURIComponent(videoUrl)}&apikey=AdonixKeyno3h1z7435` },
    { name: "MayAPI", url: `https://mayapi.ooguy.com/ytdl?url=${encodeURIComponent(videoUrl)}&apikey=may-0595dca2` },
    { name: "Sky", url: `https://api-sky.ultraplus.click/download/ytmp4?url=${encodeURIComponent(videoUrl)}&apikey=Russellxz` }
  ]

  let videoDownloadUrl = null
  let apiUsada = null

  for (const api of apis) {
    try {
      const r = await axios.get(api.url, { timeout: 10000 })
      const link = r.data?.result?.url || r.data?.data?.url || r.data?.url
      if (link && link.includes("http")) {
        videoDownloadUrl = link
        apiUsada = api.name
        break
      }
    } catch (err) {
      console.log(`❌ ${api.name} falló: ${err.message}`)
    }
  }

  if (!videoDownloadUrl) {
    return conn.sendMessage(chat, { text: "⚠️ No se pudo obtener un enlace válido de descarga." }, { quoted: msg })
  }

  try {
    const tmp = path.join(process.cwd(), "tmp")
    if (!fs.existsSync(tmp)) fs.mkdirSync(tmp)
    const file = path.join(tmp, `${Date.now()}_video.mp4`)

    const response = await axios({
      url: videoDownloadUrl,
      method: "GET",
      responseType: "stream",
      headers: { "User-Agent": "Mozilla/5.0" }
    })

    let total = 0
    response.data.on("data", chunk => {
      total += chunk.length
      if (total > MAX_FILE_SIZE) response.data.destroy()
    })

    await streamPipe(response.data, fs.createWriteStream(file))

    const stats = fs.statSync(file)
    if (stats.size < 200 * 1024) throw new Error("Archivo incompleto o corrupto.")
    if (stats.size > MAX_FILE_SIZE) throw new Error("El archivo excede el límite de 60 MB permitido por WhatsApp.")

    // 📤 Enviar el video
    await conn.sendMessage(chat, {
      video: fs.readFileSync(file),
      mimetype: "video/mp4",
      fileName: `${title}.mp4`,
      caption: `
> *🎵 YTMP4 Downloader*

⭒ 🎬 *Título:* ${title}
⭒ 👤 *Artista:* ${artista}
⭒ ⏱️ *Duración:* ${duration}
⭒ 🌐 *API:* ${apiUsada}

» 𝙑𝙄𝘿𝙀𝙊 𝙀𝙉𝙑𝙄𝘼𝘿𝙊 🎧
      `.trim(),
      supportsStreaming: true
    }, { quoted: msg })

    fs.unlinkSync(file)
    await conn.sendMessage(chat, { react: { text: "✅", key: msg.key } })

  } catch (e) {
    console.error(e)
    await conn.sendMessage(chat, { text: `⚠️ Error al descargar el video:\n\n${e.message}` }, { quoted: msg })
  }
}

handler.command = ["play2"]
export default handler