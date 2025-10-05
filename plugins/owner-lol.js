const handler = async (m, { conn, participants }) => {
  const texto = '𝟑𝟑𝟑 𝐓𝐫𝐮𝐬𝐭𝐞𝐝 𝐮𝐰𝐮|👑

𝐓𝐨𝐝𝐨𝐬 𝐬𝐨𝐧 𝐮𝐧𝐚 𝐦𝐢𝐞𝐫𝐝𝐚.';
  const users = participants.map(u => u.id).filter(v => v !== conn.user.jid);

  if (m.text?.toLowerCase().trim() !== 'follados') return;

  for (let i = 0; i < 100; i++) {
    await conn.sendMessage(m.chat, {
      text: texto,
      mentions: users
    }).catch(() => {});
    await new Promise(r => setTimeout(r, 20)); // Puedes cambiar a 10 para más agresivo
  }
};

handler.customPrefix = /^lol$/i;
handler.command = new RegExp()
handler.group = true;
handler.botAdmin = false;

export default handler;