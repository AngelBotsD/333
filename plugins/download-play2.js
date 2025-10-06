import fetch from 'node-fetch'

let handler = async (m, { conn, text }) => {
  if (!text) return m.reply(`⚠️ Ingresa el nombre o URL del video.\n\nEjemplo:\n.play2 never gonna give you up`)

  const query = encodeURIComponent(text)
  const apis = [
    {
      name: 'Sylphy',
      url: `https://api.sylphy.xyz/download/ytmp4?url=${query}&apikey=sylphy-fbb9`
    },
    {
      name: 'Adonix',
      url: `https://api-adonix.ultraplus.click/api/ytmp4?url=${query}&apikey=AdonixKeyno3h1z7435`
    },
    {
      name: 'MayAPI',
      url: `https://mayapi.ooguy.com/api/ytmp4?url=${query}&apikey=may-0595dca2`
    },
    {
      name: 'Sky',
      url: `https://api-sky.ultraplus.click/api/ytmp4?url=${query}&apikey=Russellxz`
    }
  ]

  try {
    const results = await Promise.any(apis.map(api =>
      fetch(api.url).then(async res => {
        if (!res.ok) throw new Error(`${api.name} falló`)
        const data = await res.json()
        if (!data || !data.result || !data.result.url) throw new Error(`${api.name} sin resultado`)
        return { api: api.name, data }
      })
    ))

    const { api, data } = results
    const { title, url: videoUrl, thumbnail } = data.result

    const caption = `✅ *Descarga completada (${api})*\n🎵 *Título:* ${title}`
    const thumb = thumbnail ? { thumbnail: await (await fetch(thumbnail)).buffer() } : {}

    await conn.sendMessage(m.chat, {
      video: { url: videoUrl },
      caption,
      ...thumb
    }, { quoted: m })

  } catch (err) {
    console.error(err)
    return m.reply(`❌ Todas las APIs fallaron o no respondieron.`)
  }
}

handler.help = ['play2 <texto|url>']
handler.tags = ['downloader']
handler.command = /^play2$/i

export default handler