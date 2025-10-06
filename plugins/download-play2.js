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

  await conn.sendMessage(chat, {
    react: { text: "🕒", key: msg.key }
  })

  try {
    // 🔍 Buscar video por texto
    const search = await yts(text)
    if (!search.videos || search.videos.length === 0) {
      throw new Error("No se encontró ningún video con ese nombre.")
    }

    const video = search.videos[0]
    const videoUrl = video.url

    const posibles = ["2160p", "1440p", "1080p", "720p", "480p", "360p", "240p", "144p"]
    let videoDownloadUrl = null
    let calidadElegida = "Desconocida"
    let apiUsada = "Desconocida"
    let errorLogs = []

    const tryApi = (apiName, urlBuilder) => {
      return new Promise(async (resolve, reject) => {
        let intentos = 0
        const maxIntentos = 2
        const attempt = async () => {
          intentos++
          const controller = new AbortController()
          try {
            for (const q of posibles) {
              const apiUrl = urlBuilder(q)
              const r = await axios.get(apiUrl, {
                timeout: 60000,
                signal: controller.signal
              })
              if (r.data?.status && (r.data?.result?.url || r.data?.data?.url)) {
                resolve({
                  url: r.data.result?.url || r.data.data?.url,
                  quality: r.data?.result?.quality || r.data?.data?.quality || q,
                  api: apiName,
                  controller
                })
                return
              }
            }
            throw new Error(`${apiName}: No entregó un URL válido`)
          } catch (err) {
            if (intentos < maxIntentos) {
              console.log(`${apiName} abortado, reintentando... (${intentos}/${maxIntentos})`)
              await attempt()
            } else {
              reject(new Error(`${apiName}: ${err.message}`))
            }
          }
        }
        attempt()
      })
    }

    // 🔹 Tus APIs personalizadas
    const sylphyApi = tryApi("Sylphy", q =>
      `https://api.sylphy.xyz/download/ytmp4?url=${encodeURIComponent(videoUrl)}&apikey=sylphy-fbb9`
    )

    const adonixApi = tryApi("Adonix", q =>
      `https://api-adonix.ultraplus.click/download/ytmp4?apikey=AdonixKeyno3h1z7435&url=${encodeURIComponent(videoUrl)}&quality=${q}`
    )

    const mayApi = tryApi("MayAPI", q =>
      `https://mayapi.ooguy.com/ytdl?url=${encodeURIComponent(videoUrl)}&type=mp4&quality=${q}&apikey=may-0595dca2`
    )

    const skyApi = tryApi("SkyAPI", q =>
      `https://api-sky.ultraplus.click/ytdl?url=${encodeURIComponent(videoUrl)}&type=mp4&quality=${q}&apikey=Russellxz`
    )

    let winner
    try {
      winner = await Promise.any([sylphyApi, adonixApi, mayApi, skyApi])
    } catch (err) {
      throw new Error("No se pudo obtener el video en ninguna calidad.\n\nLogs:\n" + errorLogs.join("\n"))
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

⭒ ִֶָ७ ꯭🎵˙⋆｡ - *𝚃𝚒́𝚝𝚞𝚕𝚘:* ${title}
⭒ ִֶָ७ ꯭🎤˙⋆｡ - *𝙰𝚛𝚝𝚒𝚜𝚝𝚊:* ${artista}
⭒ ִֶָ७ ꯭🕑˙⋆｡ - *𝙳𝚞𝚛𝚊𝚌𝚒ó𝚗:* ${duration}
⭒ ִֶָ७ ꯭📺˙⋆｡ - *𝙲𝚊𝚕𝚒𝚍𝚊𝚍:* ${calidadElegida}
⭒ ִֶָ७ ꯭🌐˙⋆｡ - *𝙰𝚙𝚒:* ${apiUsada}

» 𝙑𝙄𝘿𝙀𝙊 𝙀𝙉𝙑𝙄𝘼𝘿𝙊  🎧
» 𝘿𝙄𝙎𝙁𝙍𝙐𝙏𝘼𝙇𝙊 𝘾𝘼𝙈𝙋𝙀𝙊𝙉..

⇆‌ ㅤ◁ㅤㅤ❚❚ㅤㅤ▷ㅤ↻

> \`\`\`© 𝖯𝗈𝗐𝖾𝗋𝖾𝖽 𝖻𝗒 𝗁𝖾𝗋𝗇𝖺𝗇𝖽𝖾𝗓.𝗑𝗒𝗓\`\`\`
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