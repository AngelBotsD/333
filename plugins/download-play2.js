import axios from "axios"
import yts from "yt-search"
import fs from "fs"
import path from "path"
import { promisify } from "util"
import { pipeline } from "stream"

const streamPipe = promisify(pipeline)
const MAX_FILE_SIZE = 60 * 1024 * 1024 // 60MB

const handler = async (msg, { conn, text }) => {
  if (!text?.trim()) {
    return conn.sendMessage(msg.key.remoteJid, { text: "🎬 Ingresa el nombre o URL de un video" }, { quoted: msg })
  }

  await conn.sendMessage(msg.key.remoteJid, { react: { text: "🕒", key: msg.key } })

  // Buscar el video en YouTube
  const search = await yts({ query: text, hl: "es", gl: "MX" })
  const video = search.videos[0]
  if (!video) {
    return conn.sendMessage(msg.key.remoteJid, { text: "❌ No se encontraron resultados." }, { quoted: msg })
  }

  const { url: videoUrl, title, timestamp: duration, author } = video
  const artista = author.name

  // Definición de APIs y calidades
  const qualities = ["1080p", "720p", "480p", "360p"]
  const apis = [
    { name: "Sylphy", base: q => `https://api.sylphy.xyz/download/ytmp4?url=${encodeURIComponent(videoUrl)}&quality=${q}&apikey=sylphy-fbb9` },
    { name: "Adonix", base: q => `https://api-adonix.ultraplus.click/download/ytmp4?url=${encodeURIComponent(videoUrl)}&quality=${q}&apikey=AdonixKeyno3h1z7435` },
    { name: "MayAPI", base: q => `https://mayapi.ooguy.com/api/ytmp4?url=${encodeURIComponent(videoUrl)}&quality=${q}&apikey=may-0595dca2` },
    { name: "SkyAPI", base: q => `https://api-sky.ultraplus.click/api/ytmp4?url=${encodeURIComponent(videoUrl)}&quality=${q}&apikey=Russellxz` }
  ]

  // Compiten todas las APIs y calidades al mismo tiempo
  const tryDownload = async () => {
    const controllers = []
    try {
      const winner = await Promise.any(
        apis.flatMap(api =>
          qualities.map(q => {
            const controller = new AbortController()
            controllers.push(controller)
            const apiUrl = api.base(q)

            return axios
              .get(apiUrl, { timeout: 10000, signal: controller.signal })
              .then(res => {
                const url =
                  res.data?.result?.url ||
                  res.data?.data?.url ||
                  res.data?.result?.download_url ||
                  res.data?.url

                if (!url || !url.startsWith("http")) throw new Error("No URL válida")
                return { api: api.name, quality: q, url }
              })
          })
        )
      )

      // Cancelar el resto de solicitudes
      controllers.forEach(c => c.abort())
      return winner
    } catch (e) {
      controllers.forEach(c => c.abort())
      throw new Error("❌ Ninguna API devolvió un enlace válido.")
    }
  }

  try {
    const winner = await tryDownload()
    const { url: videoDownloadUrl, api: apiUsada, quality } = winner

    // Descargar y enviar el video
    const tmp = path.join(process.cwd(), "tmp")
    if (!fs.existsSync(tmp)) fs.mkdirSync(tmp)
    const file = path.join(tmp, `${Date.now()}_vid.mp4`)

    const dl = await axios.get(videoDownloadUrl, { responseType: "stream", timeout: 0 })
    let totalSize = 0
    dl.data.on("data", chunk => {
      totalSize += chunk.length
      if (totalSize > MAX_FILE_SIZE) dl.data.destroy()
    })

    await streamPipe(dl.data, fs.createWriteStream(file))

    const stats = fs.statSync(file)
    if (stats.size > MAX_FILE_SIZE) {
      fs.unlinkSync(file)
      throw new Error("El archivo excede el límite de 60 MB permitido por WhatsApp.")
    }

    await conn.sendMessage(
      msg.key.remoteJid,
      {
        video: fs.readFileSync(file),
        mimetype: "video/mp4",
        fileName: `${title}.mp4`,
        caption: `
> 🎞️ *YTMP4 DOWNLOADER RÁPIDO*

🎵 *Título:* ${title}
🎤 *Artista:* ${artista}
🕒 *Duración:* ${duration}
📺 *Calidad:* ${quality}
🌐 *API usada:* ${apiUsada}

✅ *Video descargado correctamente*
        `.trim(),
        supportsStreaming: true,
        contextInfo: { isHd: true }
      },
      { quoted: msg }
    )

    fs.unlinkSync(file)
    await conn.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } })
  } catch (e) {
    console.error(e)
    await conn.sendMessage(
      msg.key.remoteJid,
      { text: `⚠️ Error al descargar el video:\n\n${e.message}` },
      { quoted: msg }
    )
  }
}

handler.command = ["play2"]
export default handler