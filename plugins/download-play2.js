import axios from "axios"
import yts from "yt-search"
import fs from "fs"
import path from "path"
import { promisify } from "util"
import { pipeline } from "stream"

const streamPipe = promisify(pipeline)
const MAX_FILE_SIZE = 60 * 1024 * 1024

const handler = async (msg, { conn, text }) => {
  if (!text || !text.trim()) {
    return conn.sendMessage(
      msg.key.remoteJid,
      { text: "🎬 Ingresa el nombre de algún video" },
      { quoted: msg }
    )
  }

  await conn.sendMessage(msg.key.remoteJid, { react: { text: "🕒", key: msg.key } })

  const search = await yts({ query: text, hl: "es", gl: "MX" })
  const video = search.videos[0]
  if (!video) {
    return conn.sendMessage(
      msg.key.remoteJid,
      { text: "❌ Sin resultados." },
      { quoted: msg }
    )
  }

  const { url: videoUrl, title, timestamp: duration, author } = video
  const artista = author.name
  const posibles = ["1080p","720p","480p","360p","240p","144p"]

  let videoDownloadUrl = null
  let apiUsada = "Desconocida"

  const tryDownload = async () => {
    let winner = null
    let intentos = 0

    while (!winner && intentos < 2) {
      intentos++
      try {
        const tryApi = (apiName, urlBuilder) => new Promise(async (resolve, reject) => {
          const controller = new AbortController()
          try {
            for (const q of posibles) {
              const apiUrl = urlBuilder(q)
              const r = await axios.get(apiUrl, { timeout: 10000, signal: controller.signal })
              if (r.data?.status && (r.data?.result?.url || r.data?.data?.url)) {
                resolve({
                  url: r.data.result?.url || r.data.data?.url,
                  api: apiName,
                  controller
                })
                return
              }
            }
            reject(new Error(`${apiName}: No entregó un URL válido`))
          } catch (err) {
            if (
              err.message &&
              (err.message.toLowerCase().includes("aborted") ||
               err.message.toLowerCase().includes("canceled"))
            ) return
            reject(new Error(`${apiName}: ${err.message}`))
          }
        })

        const mayApi = tryApi("MayAPI", q => `https://mayapi.ooguy.com/ytdl?url=${encodeURIComponent(videoUrl)}&type=mp4&quality=${q}&apikey=may-0595dca2`)
        const neoxApi = tryApi("NeoxR", q => `https://api.neoxr.eu/api/youtube?url=${encodeURIComponent(videoUrl)}&type=video&quality=${q}&apikey=russellxz`)
        const adonixApi = tryApi("AdonixAPI", q => `https://api-adonix.ultraplus.click/download/ytmp4?apikey=AdonixKeyz11c2f6197&url=${encodeURIComponent(videoUrl)}&quality=${q}`)
        const adofreeApi = tryApi("Adofreekey", q => `https://api-adonix.ultraplus.click/download/ytmp4?apikey=Adofreekey&url=${encodeURIComponent(videoUrl)}&quality=${q}`)

        winner = await Promise.any([mayApi, neoxApi, adonixApi, adofreeApi])
        ;[mayApi, neoxApi, adonixApi, adofreeApi].forEach(p => { if (p !== winner && p.controller) p.controller.abort() })
      } catch (e) {
        if (intentos >= 2) throw new Error("No se pudo obtener el video después de 2 intentos.")
      }
    }

    return winner
  }

  try {
    const winner = await tryDownload()
    videoDownloadUrl = winner.url
    apiUsada = winner.api

    // Descargar archivo y enviar
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
> *𝚈𝚃𝙼𝙿4 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝚁*

⭒ 🎵 - *𝚃í𝚝ulo:* ${title}
⭒ 🎤 - *𝙰rtista:* ${artista}
⭒ 🕑 - *𝙳uración:* ${duration}
⭒ 📺 - *𝙲alidad:* ${winner.quality || "Desconocida"}
⭒ 🌐 - *𝙰pi:* ${apiUsada}

» 𝙑𝙸𝘿𝙴𝙊 𝙴𝙽𝙑𝙸𝘼𝘿𝙾 🎧
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