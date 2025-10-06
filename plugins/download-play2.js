import axios from "axios"
import yts from "yt-search"

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
  const posibles = ["720p", "480p", "360p"] // Prioridad de calidad

  let videoDownloadUrl = null
  let apiUsada = "Desconocida"
  let calidadElegida = "Desconocida"

  const apis = [
    { name: "MayAPI", url: q => `https://mayapi.ooguy.com/ytdl?url=${encodeURIComponent(videoUrl)}&type=mp4&quality=${q}&apikey=may-0595dca2` },
    { name: "NeoxR", url: q => `https://api.neoxr.eu/api/youtube?url=${encodeURIComponent(videoUrl)}&type=video&quality=${q}&apikey=russellxz` },
    { name: "AdonixAPI", url: q => `https://api-adonix.ultraplus.click/download/ytmp4?apikey=AdonixKeyz11c2f6197&url=${encodeURIComponent(videoUrl)}&quality=${q}` },
    { name: "Adofreekey", url: q => `https://api-adonix.ultraplus.click/download/ytmp4?apikey=Adofreekey&url=${encodeURIComponent(videoUrl)}&quality=${q}` }
  ]

  try {
    outer: for (const api of apis) {
      for (const q of posibles) {
        try {
          const res = await axios.get(api.url(q), { timeout: 10000 })
          const url = res.data?.result?.url || res.data?.data?.url
          if (url) {
            videoDownloadUrl = url
            apiUsada = api.name
            calidadElegida = q
            break outer
          }
        } catch(e) { continue }
      }
    }

    if (!videoDownloadUrl) throw new Error("No se pudo obtener el video")

    // Streaming directo
    const dlStream = await axios.get(videoDownloadUrl, { responseType: "stream", timeout: 0 })

    await conn.sendMessage(
      msg.key.remoteJid,
      {
        video: dlStream.data,
        mimetype: "video/mp4",
        fileName: `${title}.mp4`,
        caption: `
> *𝚈𝚃𝙼𝙿4 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝚁*

⭒ 🎵 - *Título:* ${title}
⭒ 🎤 - *Artista:* ${artista}
⭒ 🕑 - *Duración:* ${duration}
⭒ 📺 - *Calidad:* ${calidadElegida}
⭒ 🌐 - *API usada:* ${apiUsada}

» Video enviado 🎧
        `.trim(),
        supportsStreaming: true,
        contextInfo: { isHd: true }
      },
      { quoted: msg }
    )

    await conn.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } })

  } catch(e) {
    console.error(e)
    await conn.sendMessage(msg.key.remoteJid, { text: `⚠️ Error al descargar el video:\n\n${e.message}` }, { quoted: msg })
  }
}

handler.command = ["play2"]
export default handler