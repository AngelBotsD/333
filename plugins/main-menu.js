const handler = async (m, { conn }) => {
  let menu = `👋🏻 𝖧𝗈𝗅𝖺! 𝖻𝗂𝖾𝗇𝗏𝖾𝗇𝗂𝖽𝗈 𝖺𝗅 𝗆𝖾𝗇𝗎𝗀𝗋𝗎𝗉𝗈 𝖽𝖾 *𝖻𝖺𝗄𝗂-𝖡𝗈𝗍 𝖨𝖠* 𝖺𝗾𝗎𝗂́ 𝖾𝗇𝖼𝗈𝗇𝗍𝗋𝖺𝗋𝖺́𝗌 𝗅𝗈𝗌 𝖼𝗈𝗆𝖺𝗇𝖽𝗈𝗌 𝗉𝖺𝗋𝖺 𝗆𝖺𝗇𝗍𝖾𝗇𝖾𝗋 𝗎𝗇 𝗍𝗈𝗍𝖺𝗅 𝗈𝗋𝖽𝖾𝗇 𝖽𝖾 𝗍𝗎́ 𝗀𝗋𝗎𝗉𝗈!

*𐚁 ֹ ִ *𝖨𝗇𝖿𝗈𝗋𝗆𝖺𝖼𝗂𝗈𝗇* ୧❕ ֹ ִ*
  ৎ٠࣪⭑☕𝄢 -mylid
  ৎ٠࣪⭑☕𝄢 -owner
  ৎ٠࣪⭑☕𝄢 -reporte
  ৎ٠࣪⭑☕𝄢 -ping
  ৎ٠࣪⭑☕𝄢 -uptime


*𐚁 ֹ ִ *𝖬𝖾𝗇𝗎𝗌 𝖽𝗂𝗌𝗉𝗈𝗇𝗂𝖻𝗅𝖾𝗌* ୧📋 ֹ ִ*
  ৎ٠࣪⭑🍄𝄢 -menu
  ৎ٠࣪⭑🍄𝄢 -menuff
  ৎ٠࣪⭑🍄𝄢 -menugrupos


*𐚁 ֹ ִ *𝖯𝖺𝗋𝖺 𝗀𝗋𝗎𝗉𝗈𝗌* ୧👥 ֹ ִ*
  ৎ٠࣪⭑🍜𝄢 -abrirgrupo
  ৎ٠࣪⭑🍜𝄢 -antiarabe
  ৎ٠࣪⭑🍜𝄢 -antilink
  ৎ٠࣪⭑🍜𝄢 -cerrargrupo
  ৎ٠࣪⭑🍜𝄢 -del
  ৎ٠࣪⭑🍜𝄢 -demote
  ৎ٠࣪⭑🍜𝄢 -fantasmas
  ৎ٠࣪⭑🍜𝄢 -kick
  ৎ٠࣪⭑🍜𝄢 -kickall
  ৎ٠࣪⭑🍜𝄢 -kickfan
  ৎ٠࣪⭑🍜𝄢 -link
  ৎ٠࣪⭑🍜𝄢 -modoadmins
  ৎ٠࣪⭑🍜𝄢 -mute
  ৎ٠࣪⭑🍜𝄢 -n
  ৎ٠࣪⭑🍜𝄢 -promote
  ৎ٠࣪⭑🍜𝄢 -reglas
  ৎ٠࣪⭑🍜𝄢 -ruletaban
  ৎ٠࣪⭑🍜𝄢 -setfoto
  ৎ٠࣪⭑🍜𝄢 -setinfo
  ৎ٠࣪⭑🍜𝄢 -setname
  ৎ٠࣪⭑🍜𝄢 -setreglas
  ৎ٠࣪⭑🍜𝄢 -setwelcome
  ৎ٠࣪⭑🍜𝄢 -todos
  ৎ٠࣪⭑🍜𝄢 -unban
  ৎ٠࣪⭑🍜𝄢 -unmute
  ৎ٠࣪⭑🍜𝄢 -.on welcome


*𐚁 ֹ ִ *𝖯𝖺𝗋𝖺 𝖥𝗋𝖾𝖾 𝖥𝗂𝗋𝖾* ୧👺 ֹ ִ*
  ৎ٠࣪⭑🎮𝄢 -vs4
  ৎ٠࣪⭑🎮𝄢 -vs6
  ৎ٠࣪⭑🎮𝄢 -cuadrilatero
  ৎ٠࣪⭑🎮𝄢 -hexagonal
  ৎ٠࣪⭑🎮𝄢 -interna
  ৎ٠࣪⭑🎮𝄢 -scrim


*𐚁 ֹ ִ *𝖣𝖾𝗌𝖼𝖺𝗋𝗀𝖺𝖽𝗈𝗋𝖾𝗌* ୧📥 ֹ ִ*
  ৎ٠࣪⭑🌴𝄢 -facebook
  ৎ٠࣪⭑🌴𝄢 -instagram
  ৎ٠࣪⭑🌴𝄢 -mediafire
  ৎ٠࣪⭑🌴𝄢 -play
  ৎ٠࣪⭑🌴𝄢 -play2
  ৎ٠࣪⭑🌴𝄢 -playpro
  ৎ٠࣪⭑🌴𝄢 -spotify
  ৎ٠࣪⭑🌴𝄢 -tiktok
  ৎ٠࣪⭑🌴𝄢 -whatmusic
  ৎ٠࣪⭑🌴𝄢 -ytmp3
  ৎ٠࣪⭑🌴𝄢 -ytmp4


*𐚁 ֹ ִ *𝖧𝖾𝗋𝗋𝖺𝗆𝗂𝖾𝗇𝗍𝖺𝗌* ୧🛠 ֹ ִ*
  ৎ٠࣪⭑🔧𝄢 -ver
  ৎ٠࣪⭑🔧𝄢 -img


*𐚁 ֹ ִ *𝖬𝗂𝗇𝗂 𝖩𝗎𝖾𝗀𝗈𝗌* ୧🎮 ֹ ִ*
  ৎ٠࣪⭑🧩𝄢 -acertijo
  ৎ٠࣪⭑🧩𝄢 -cachuda
  ৎ٠࣪⭑🧩𝄢 -cachudo
  ৎ٠࣪⭑🧩𝄢 -casar
  ৎ٠࣪⭑🧩𝄢 -divorcio
  ৎ٠࣪⭑🧩𝄢 -enana
  ৎ٠࣪⭑🧩𝄢 -enano
  ৎ٠࣪⭑🧩𝄢 -fea
  ৎ٠࣪⭑🧩𝄢 -feo
  ৎ٠࣪⭑🧩𝄢 -gay
  ৎ٠࣪⭑🧩𝄢 -juegos
  ৎ٠࣪⭑🧩𝄢 -kiss
  ৎ٠࣪⭑🧩𝄢 -lesbiana
  ৎ٠࣪⭑🧩𝄢 -manca
  ৎ٠࣪⭑🧩𝄢 -manco
  ৎ٠࣪⭑🧩𝄢 -matrimonios
  ৎ٠࣪⭑🧩𝄢 -meme
  ৎ٠࣪⭑🧩𝄢 -negra
  ৎ٠࣪⭑🧩𝄢 -negro
  ৎ٠࣪⭑🧩𝄢 -pajera
  ৎ٠࣪⭑🧩𝄢 -pajero
  ৎ٠࣪⭑🧩𝄢 -pareja
  ৎ٠࣪⭑🧩𝄢 -personalidad
  ৎ٠࣪⭑🧩𝄢 -peruana
  ৎ٠࣪⭑🧩𝄢 -peruano
  ৎ٠࣪⭑🧩𝄢 -poema
  ৎ٠࣪⭑🧩𝄢 -ppt
  ৎ٠࣪⭑🧩𝄢 -puta
  ৎ٠࣪⭑🧩𝄢 -puto
  ৎ٠࣪⭑🧩𝄢 -rata
  ৎ٠࣪⭑🧩𝄢 -ship
  ৎ٠࣪⭑🧩𝄢 -pegar
  ৎ٠࣪⭑🧩𝄢 -verdad


*𐚁 ֹ ִ *𝖨𝖠* ୧🫀 ֹ ִ*
  ৎ٠࣪⭑🔍𝄢 -dalle
  ৎ٠࣪⭑🔍𝄢 -gemini
  ৎ٠࣪⭑🔍𝄢 -imagen
  ৎ٠࣪⭑🔍𝄢 -luminai
  ৎ٠࣪⭑🔍𝄢 -pixai
  ৎ٠࣪⭑🔍𝄢 -tts
  ৎ٠࣪⭑🔍𝄢 -visión
  ৎ٠࣪⭑🔍𝄢 -vision2


*𐚁 ֹ ִ *𝖲𝗍𝗂𝖼𝗄𝖾𝗋𝗌* ୧🎭 ֹ ִ*
  ৎ٠࣪⭑🎨𝄢 -tourl
  ৎ٠࣪⭑🎨𝄢 -brat
  ৎ٠࣪⭑🎨𝄢 -mixemoji
  ৎ٠࣪⭑🎨𝄢 -qc
  ৎ٠࣪⭑🎨𝄢 -s

*𐚁 ֹ ִ *𝖯𝖺𝗋𝖺 𝖾𝗅 𝖼𝗋𝖾𝖺𝖽𝗈𝗋* ୧👑 ֹ ִ*
  ৎ٠࣪⭑👨🏻‍💻𝄢 -tiempo
  ৎ٠࣪⭑👨🏻‍💻𝄢 -addlista
  ৎ٠࣪⭑👨🏻‍💻𝄢 -addowner
  ৎ٠࣪⭑👨🏻‍💻𝄢 -antideletepri
  ৎ٠࣪⭑👨🏻‍💻𝄢 -eren
  ৎ٠࣪⭑👨🏻‍💻𝄢 -autoadmin
  ৎ٠࣪⭑👨🏻‍💻𝄢 -aviso
  ৎ٠࣪⭑👨🏻‍💻𝄢 -bc
  ৎ٠࣪⭑👨🏻‍💻𝄢 -botfoto
  ৎ٠࣪⭑👨🏻‍💻𝄢 -botname
  ৎ٠࣪⭑👨🏻‍💻𝄢 -dellista
  ৎ٠࣪⭑👨🏻‍💻𝄢 -delmenu
  ৎ٠࣪⭑👨🏻‍💻𝄢 -delmenugrupo
  ৎ٠࣪⭑👨🏻‍💻𝄢 -delmenuowner
  ৎ٠࣪⭑👨🏻‍💻𝄢 -delowner
  ৎ٠࣪⭑👨🏻‍💻𝄢 -fechasgp
  ৎ٠࣪⭑👨🏻‍💻𝄢 -git
  ৎ٠࣪⭑👨🏻‍💻𝄢 -join
  ৎ٠࣪⭑👨🏻‍💻𝄢 -listgrupos
  ৎ٠࣪⭑👨🏻‍💻𝄢 -listowner
  ৎ٠࣪⭑👨🏻‍💻𝄢 -priv
  ৎ٠࣪⭑👨🏻‍💻𝄢 -re
  ৎ٠࣪⭑👨🏻‍💻𝄢 -rest

> © 𝖻𝖺𝗄𝗂-𝖡𝗈𝗍 𝖨𝖠 𝖝 𝗁𝖾𝗋𝗇𝖺𝗇𝖽𝖾𝗓-𝗑𝗒𝗓
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