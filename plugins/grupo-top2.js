let user = a => '@' + a.split('@')[0]

function handler(m, { groupMetadata, command, conn }) {
    let participants = [...groupMetadata.participants.map(v => v.id)]
    
    if (participants.length < 5) return conn.reply(m.chat, '❌ No hay suficientes participantes en el grupo.', m)

    let categorias = [
        { name: 'personas que hicieron el amor', emoji: '❤️', singleLine: true },
        { name: 'personas que se gustan', emoji: '💘', singleLine: true },
        { name: 'personas geys o lesbianas', emoji: '🏳️‍🌈', singleLine: false },
        { name: 'personas que les gusta Maycol', emoji: '😍', singleLine: false },
        { name: 'personas pervertidas', emoji: '😏', singleLine: false },
    ]

    let replyText = ''
    let mentions = []

    for (let cat of categorias) {
        let seleccion = []
        while (seleccion.length < 5) {
            let u = participants[Math.floor(Math.random() * participants.length)]
            if (!seleccion.includes(u)) seleccion.push(u)
        }

        replyText += `📊 *Top 5 de ${cat.name.toUpperCase()}* ${cat.emoji}\n`

        if (cat.singleLine) {
            // Una sola línea con todos los usuarios separados por " y "
            replyText += seleccion.map(user).join(' y ') + '\n\n'
        } else {
            // Top 5 normal, línea por línea
            replyText += `1. 🥇 ${user(seleccion[0])}\n`
            replyText += `2. 🥈 ${user(seleccion[1])}\n`
            replyText += `3. 🥉 ${user(seleccion[2])}\n`
            replyText += `4. 🎖️ ${user(seleccion[3])}\n`
            replyText += `5. ✨ ${user(seleccion[4])}\n\n`
        }

        mentions.push(...seleccion)

        // Evitamos repetir usuarios en la siguiente categoría
        participants = participants.filter(u => !seleccion.includes(u))
        if (participants.length < 5) participants = [...groupMetadata.participants.map(v => v.id)]
    }

    conn.reply(m.chat, replyText, m, { mentions })
}

handler.help = ['top2']
handler.command = ['top2']
handler.tags = ['group']
handler.group = true
handler.register = false

export default handler
