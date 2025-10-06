import axios from "axios"
import yts from "yt-search"
import fs from "fs"
import path from "path"
import { promisify } from "util"
import { pipeline } from "stream"

const streamPipe = promisify(pipeline)
const MAX_FILE_SIZE = 60 * 1024 * 1024 // 60MB

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

  const tryApi = (apiName, url) => new Promise(async (resolve, reject) => {
    try {
      const r = await axios.get(url, { timeout: 12000 })
      const link = r.data?.result?.url || r.data?.data?.url || r.data?.url
      if (link) resolve({ url: link, api: apiName })
      else reject(new Error(`${apiName} no devolvió URL válido`))
    } catch (err) {
      reject(new Error(`${apiName}: ${err.message}`))
    }
  })

  try {
    // 🔗 APIs en competencia (calidad automática)
    const apis = [
      tryApi("Sylphy", `https://api.sylphy.xyz/download/ytmp4?url=${encodeURIComponent(videoUrl)}&apikey=sylphy-fbb9`),
      tryApi("Adonix", `https://api-adonix.ultraplus.click/download/ytmp4?url=${encodeURIComponent(videoUrl)}&apikey=AdonixKeyno3h1z7435`),
      tryApi("MayAPI", `https://mayapi.ooguy.com/ytdl?url=${encodeURIComponent(videoUrl)}&apikey=may-0595dca2`),
      tryApi("Sky", `https://api-sky.ultraplus.click/download/ytmp4?url=${encodeURIComponent(videoUrl)}&apikey=Russellxz`)
    ]

    // 🥇 Gana la primera que responda correctamente
    const winner = await Promise.any(apis)
    const { url: videoDownloadUrl, api: apiUsada } = winner

    console.log(`✅ API ganadora: ${apiUsada}`)

    // 📥 Descarga temporal
    const tmp = path.join(process.cwd(), "tmp")
    if (!fs.existsSync(tmp)) fs.mkdirSync(tmp)
    const file = path.join(tmp, `${Date.now()}_video.mp4`)

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

    // 📤 Enviar video
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