let handler = async (m, { conn }) => {
  const user = m.mentionedJid?.[0] 
            || m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] 
            || m.quoted?.sender;

  if (!user) {
    await conn.sendMessage(m.chat, { 
      text: '☁️ *𝙿𝚘𝚛 𝚏𝚊𝚟𝚘𝚛, 𝚁𝚎𝚜𝚙𝚘𝚗𝚍𝚎 𝚘 𝚖𝚎𝚗𝚌𝚒𝚘𝚗𝚊 𝙰𝚕 𝚞𝚜𝚞𝚊𝚛𝚒𝚘 𝚚𝚞𝚎 𝚍𝚎𝚜𝚎𝚊𝚜 𝚍𝚎𝚐𝚛𝚊𝚍𝚊𝚛*.', 
      contextInfo: { stanzaId: m.key.id, participant: m.sender, quotedMessage: m.message } 
    });
    await conn.sendMessage(m.chat, { react: { text: '🏞️', key: m.key } });
    return;
  }

  try {
    const metadata = await conn.groupMetadata(m.chat);
    const admins = metadata.participants.filter(p => p.admin !== null).map(p => p.id);

    if (!admins.includes(user)) {
      await conn.sendMessage(m.chat, { 
        text: '☁️ *𝙴𝚜𝚝𝚎 𝚞𝚜𝚞𝚊𝚛𝚒𝚘 𝚗𝚘 𝚎𝚜 𝚊𝚍𝚖𝚒𝚗*.', 
        contextInfo: { stanzaId: m.key.id, participant: m.sender, quotedMessage: m.message } 
      });
      await conn.sendMessage(m.chat, { react: { text: '🧾', key: m.key } });
      return;
    }

    await conn.groupParticipantsUpdate(m.chat, [user], 'demote');
    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
  } catch (e) {
    console.error(e);
  }
};

handler.customPrefix = /^\.?demote/i;
handler.command = new RegExp();
handler.group = true;
handler.admin = true;
export default handler;