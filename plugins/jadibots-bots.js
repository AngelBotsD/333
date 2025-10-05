
import ws from 'ws'

let handler = async (m, { conn, usedPrefix }) => {
  try {
    await showSubBotInfo(conn, m, usedPrefix)
  } catch (e) {
    console.error(e)
    await conn.sendMessage(m.chat, { text: '☠ Error al invocar la sombra de los SubBots...' }, { quoted: m })
  }
}

async function showSubBotInfo(conn, m, usedPrefix) {
  try {
    let uniqueUsers = new Map()
    if (!global.conns || !Array.isArray(global.conns)) global.conns = []

    for (const connSub of global.conns) {
      if (connSub.user && connSub.ws?.socket?.readyState !== ws.CLOSED) {
        const jid = connSub.user.jid
        const numero = jid?.split('@')[0]
        let nombre = connSub.user.name
        if (!nombre && typeof conn.getName === 'function') {
          try {
            nombre = await conn.getName(jid)
          } catch { nombre = `Alma ${numero}` }
        }
        uniqueUsers.set(jid, nombre || `Alma ${numero}`)
      }
    }

    const uptime = process.uptime() * 1000
    const formatUptime = clockString(uptime)
    const totalUsers = uniqueUsers.size

    let txt = `✦ SUBS ACTIVOS ✦\n\n`
    txt += `⌛ Tiempo de vigilia: ${formatUptime}\n`
    txt += `★ Total conectados: ${totalUsers}\n`

    if (totalUsers > 0) {
      txt += `\n☾ LISTA DE SUBS ☽\n\n`
      let i = 1
      for (const [jid, nombre] of uniqueUsers) {
        const numero = jid.split('@')[0]
        txt += `✧ ${i++}. ${nombre}\n`
        txt += `⤷ https://wa.me/${numero}\n\n`
      }
    } else {
      txt += `⚠ No hay SubBots conectados ahora...\n⤷ Únete al ritual: https://chat.whatsapp.com/HztBH5HP4kpBE86Nbuax4i?mode=ems_copy_c`
    }

    let buttons = [
      [`★ Ser SubBot ★`, `.code`, null]
    ]

    try {
      await conn.sendButton(m.chat, txt.trim(),
        `Invoca tu sombra y conviértete en SubBot`,
        null, buttons, m)
    } catch {
      try {
        let buttonList = [
          {
            buttonId: `.code`,
            buttonText: { displayText: `★ Ser SubBot ★` },
            type: 1
          }
        ]
        await conn.sendMessage(m.chat, {
          text: txt.trim(),
          footer: `Invoca tu sombra y conviértete en SubBot`,
          buttons: buttonList,
          headerType: 1
        }, { quoted: m })
      } catch {
        await conn.sendMessage(m.chat, {
          text: txt.trim() + `\n\n★ Para ser SubBot usa: .code`
        }, { quoted: m })
      }
    }
  } catch (e) {
    console.error('Error en showSubBotInfo:', e)
    await conn.sendMessage(m.chat, { text: '☠ Error en el plano de los SubBots...' }, { quoted: m })
  }
}

function clockString(ms) {
  const d = Math.floor(ms / 86400000)
  const h = Math.floor(ms / 3600000) % 24
  const m = Math.floor(ms / 60000) % 60
  const s = Math.floor(ms / 1000) % 60
  return `${d}d ${h}h ${m}m ${s}s`
}

handler.command = ['listjadibot', 'bots']
handler.help = ['bots']
handler.tags = ['serbot']
handler.register = false

export default handler