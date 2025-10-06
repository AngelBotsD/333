import axios from "axios"
import yts from "yt-search"
import fs from "fs"
import path from "path"
import { promisify } from "util"
import { pipeline } from "stream"

const streamPipe = promisify(pipeline)
const MAX_FILE_SIZE = 60 * 1024 * 1024

const handler = async (msg, { conn, text }) => {
  const chat = msg.key.remoteJid

  if (!text || !text.trim()) {
    return conn.sendMessage(
      chat,
      { text: "🎬 Ingresa el nombre del video de YouTube.\n\nEjemplo:\n.ytmp4 karma police" },
      { quoted: msg }
    )
  }

  await conn.sendMessage(chat, { react: { text: "🕒", key: msg.key } })

  try {
    // 🔍 Buscar video por texto
    const search = await yts(text)
    if (!search.videos || search.videos.length === 0)
      throw new Error("No se encontró ningún video con ese nombre.")

    const video = search.videos[0]
    const videoUrl = video.url

    let videoDownloadUrl = null
    let calidadElegida = "Desconocida"
    let apiUsada = "Desconocida"

    const tryApi = (apiName, urlBuilder) => {
      return new Promise(async (resolve, reject) => {
        const controller = new AbortController()
        try {
          const apiUrl = urlBuilder() // dejamos que la API elija su calidad
          const r = await axios.get(apiUrl, { timeout: 60000, signal: controller.signal })
          if (r.data?.status && (r.data?.result?.url || r.data?.data?.url)) {
            resolve({
              url: r.data.result?.url || r.data.data?.url,
              quality: r.data?.result?.quality || r.data?.data?.quality || "Desconocida",
              api: apiName,
              controller
            })
          } else {
            reject(new Error(`${apiName}: No entregó URL válido`))
          }
        } catch (err) {
          reject(new Error(`${apiName}: ${err.message}`))
        }
      })
    }

    // 🔹 Tus 4 APIs personales
    const sylphyApi = tryApi("Sylphy", () => `https://api.sylphy.xyz/download/ytmp4?url=${encodeURIComponent(videoUrl)}&apikey=sylphy-fbb9`)
    const adonixApi = tryApi("Adonix", () => `https://api-adonix.ultraplus.click/download/ytmp4?apikey=AdonixKeyno3h1z7435&url=${encodeURIComponent(videoUrl)}`)
    const mayApi = tryApi("MayAPI", () => `https://mayapi.ooguy.com/ytdl?url=${encodeURIComponent(videoUrl)}&type=mp4&apikey=may-0595dca2`)
    const skyApi = tryApi("SkyAPI", () => `https://api-sky.ultraplus.click/ytdl?url=${encodeURIComponent(videoUrl)}&type=mp4&apikey=Russellxz`)

    // 🔹 Promise.any -> el primero que funcione
    let winner
    try {
      winner = await Promise.any([sylphyApi, adonixApi, mayApi, skyApi])
    } catch (err) {
      throw new Error("No se pudo obtener el video de ninguna API.")
    }

    ;[sylphyApi, adonixApi, mayApi, skyApi].forEach(p => {
      if (p !== winner && p.controller) p.controller.abort()
    })

    videoDownloadUrl = winner.url
    calidadElegida = winner.quality
    apiUsada = winner.api

    const info = await yts(videoUrl)
    const videoInfo = info.videos?.[0] || {}
    const title = videoInfo.title || "Desconocido"
    const artista = videoInfo.author?.name || "Desconocido"
    const duration = videoInfo.timestamp || "Desconocida"

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
      chat,
      {
        video: fs.readFileSync(file),
        mimetype: "video/mp4",
        fileName: `${title}.mp4`,
        caption: `
> *𝚈𝚃𝙼𝙿4 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝚁*

⭒ 🎵 - *Título:* ${title}
⭒ 🎤 - *Artista:* ${artista}
⭒ 🕑 - *Duración:* ${duration}
⭒ 📺 - *Calidad:* ${calidadElegida}
⭒ 🌐 - *API:* ${apiUsada}

» VIDEO ENVIADO 🎧
» DISFRÚTALO CAMPEÓN..

> \`\`\`© Powered by hernandez.xyz\`\`\`
`.trim(),
        supportsStreaming: true,
        contextInfo: { isHd: true }
      },
      { quoted: msg }
    )

    fs.unlinkSync(file)
    await conn.sendMessage(chat, { react: { text: "✅", key: msg.key } })

  } catch (e) {
    console.error(e)
    await conn.sendMessage(chat, { text: `⚠️ Error al descargar el video:\n\n${e.message}` }, { quoted: msg })
  }
}

handler.command = ["play2"]
export default handler