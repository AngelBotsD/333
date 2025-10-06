import axios from "axios"
import yts from "yt-search"
import fs from "fs"
import path from "path"
import { promisify } from "util"
import { pipeline } from "stream"

const streamPipe = promisify(pipeline)
const MAX_FILE_SIZE = 60 * 1024 * 1024
const MAX_TIMEOUT = 15000 // 15 segundos por intento

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

    // 🔹 Función para intentar API con reintentos silenciosos
    const tryApi = (apiName, urlBuilder) => {
      return new Promise(async (resolve, reject) => {
        let intentos = 0
        const maxIntentos = 2

        const attempt = async () => {
          intentos++
          const controller = new AbortController()
          try {
            const apiUrl = urlBuilder()
            const r = await axios.get(apiUrl, { timeout: MAX_TIMEOUT, signal: controller.signal })
            if (r.data?.status && (r.data?.result?.url || r.data?.data?.url)) {
              const url = r.data?.result?.url || r.data?.data?.url
              const quality = r.data?.result?.quality || r.data?.data?.quality || "Desconocida"
              resolve({ url, quality, api: apiName, controller })
            } else {
              throw new Error(`${apiName}: No entregó URL válido`)
            }
          } catch (err) {
            if (intentos < maxIntentos) {
              console.log(`${apiName} abortado, reintentando... (${intentos}/${maxIntentos})`)
              await attempt() // reintento silencioso
            } else {
              reject(new Error(`${apiName}: ${err.message}`))
            }
          }
        }

        attempt()
      })
    }

    // 🔹 Solo Adonix y MayAPI
    const adonixApi = tryApi("Adonix", () =>
      `https://api-adonix.ultraplus.click/download/ytmp4?apikey=AdonixKeyno3h1z7435&url=${encodeURIComponent(videoUrl)}`
    )
    const mayApi = tryApi("MayAPI", () =>
      `https://mayapi.ooguy.com/ytdl?url=${encodeURIComponent(videoUrl)}&type=mp4&apikey=may-0595dca2`
    )

    // 🔹 Promise.any -> gana la primera API que responda correctamente
    let winner
    try {
      winner = await Promise.any([adonixApi, mayApi])
    } catch (err) {
      throw new Error("No se pudo obtener el video de ninguna API.")
    }

    ;[adonixApi, mayApi].forEach(p => {
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