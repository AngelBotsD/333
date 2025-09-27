import { downloadContentFromMessage } from "@whiskeysockets/baileys";

const handler = async (msg, { conn }) => {
  try {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted) {
      return await conn.sendMessage(msg.key.remoteJid, {
        text: "❌ *𝙳𝚎𝚋𝚎𝚜 𝚁𝚎𝚜𝚙𝚘𝚗𝚍𝚎𝚛 𝚊 𝚞𝚗 𝚅𝚒𝚍𝚎𝚘, 𝙽𝚘𝚝𝚊 𝚍𝚎 𝚅𝚘𝚣 𝚘 𝙸𝚖𝚊𝚐𝚎𝚗 𝚍𝚎 𝚘𝚗𝚎 𝚟𝚒𝚎𝚠 𝙿𝚊𝚛𝚊 𝚁𝚎𝚎𝚗𝚟𝚒𝚊𝚛𝚕𝚊"
      }, { quoted: msg });
    }

    const unwrap = m => {
      let node = m;
      while (
        node?.viewOnceMessage?.message ||
        node?.viewOnceMessageV2?.message ||
        node?.viewOnceMessageV2Extension?.message ||
        node?.ephemeralMessage?.message
      ) {
        node =
          node.viewOnceMessage?.message ||
          node.viewOnceMessageV2?.message ||
          node.viewOnceMessageV2Extension?.message ||
          node.ephemeralMessage?.message;
      }
      return node;
    };

    const inner = unwrap(quoted);

    let mediaType, mediaMsg;
    if (inner.imageMessage) {
      mediaType = "image"; mediaMsg = inner.imageMessage;
    } else if (inner.videoMessage) {
      mediaType = "video"; mediaMsg = inner.videoMessage;
    } else if (inner.audioMessage || inner.voiceMessage || inner.pttMessage) {
      mediaType = "audio";
      mediaMsg = inner.audioMessage || inner.voiceMessage || inner.pttMessage;
    } else {
      return await conn.sendMessage(msg.key.remoteJid, {
        text: "❌ *Error:* El mensaje citado no contiene un archivo compatible."
      }, { quoted: msg });
    }

    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: "🏞️", key: msg.key }
    });

    const stream = await downloadContentFromMessage(mediaMsg, mediaType);
    let buf = Buffer.alloc(0);
    for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);

    const credit = "";
    const opts = { mimetype: mediaMsg.mimetype };

    if (mediaType === "image") {
      opts.image = buf;
      opts.caption = credit;
    } else if (mediaType === "video") {
      opts.video = buf;
      opts.caption = credit;
    } else {
      opts.audio = buf;
      opts.ptt = mediaMsg.ptt ?? true;
      if (mediaMsg.seconds) opts.seconds = mediaMsg.seconds;
    }

    await conn.sendMessage(msg.key.remoteJid, opts, { quoted: msg });

    if (mediaType === "audio") {
      await conn.sendMessage(msg.key.remoteJid, {
        text: credit
      }, { quoted: msg });
    }

    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: "✅", key: msg.key }
    });

  } catch (err) {
    console.error("❌ *𝙷𝚞𝚋𝚘 𝚞𝚗 𝙴𝚛𝚛𝚘𝚛*.", err);
    await conn.sendMessage(msg.key.remoteJid, {
      text: "❌ *𝙷𝚞𝚋𝚘 𝚞𝚗 𝚎𝚛𝚛𝚘𝚛 𝚊𝚕 𝚙𝚛𝚘𝚌𝚎𝚜𝚊𝚛*."
    }, { quoted: msg });
  }
};

handler.command = ["ver", "reenviar"];
export default handler;