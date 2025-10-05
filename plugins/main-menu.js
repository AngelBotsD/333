const handler = async (m, { conn }) => {
  let menu = `𝗆𝗂 𝗉𝖾𝗇𝖾 𝗇𝖾𝗀𝗋𝗈 𝗒 𝖿𝖾𝗈
`

  await conn.sendMessage(m.chat, {
    react: { text: '🧾', key: m.key }
  })

  await conn.sendMessage(
    m.chat,
    {
      image: { url: "https://cdn.russellxz.click/33f7b6d5.jpeg" },
      caption: menu,
      mentions: [m.sender]
    },
    { quoted: m }
  )
}

handler.customPrefix = /^\.?(menu|menuall)$/i;
handler.command = new RegExp;
export default handler;