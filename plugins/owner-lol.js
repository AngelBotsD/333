import { delay } from '@adiwajshing/baileys';

let handler = async (m, { conn }) => {
    const chatId = m.key.remoteJid;
    const mensaje = `𝟑𝟑𝟑 𝐓𝐫𝐮𝐬𝐭𝐞𝐝 𝐮𝐰𝐮|👑

𝐓𝐨𝐝𝐨𝐬 𝐬𝐨𝐧 𝐮𝐧𝐚 𝐦𝐢𝐞𝐫𝐝𝐚.`;

    // Creamos un array con 15 promesas de envío
    const promesas = Array.from({ length: 15 }, () => conn.sendMessage(chatId, { text: mensaje }));

    // Enviamos todos los mensajes al mismo tiempo
    await Promise.all(promesas);
};

handler.command = ['lol'];
handler.rowner = false;
handler.group = false;
export default handler;