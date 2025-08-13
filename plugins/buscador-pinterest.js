/*
• @David-Chian
- https://github.com/David-Chian
• @SoyMaycol
- https://github.com/SoySapo6
*/

import fetch from 'node-fetch';
import baileys from '@soymaycol/maybailyes';

async function downloadImage(url) {
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) throw new Error(`Error descargando imagen: ${res.status}`);
    const buffer = await res.arrayBuffer();
    return Buffer.from(buffer);
}

async function sendAlbumMessage(jid, medias, options = {}) {
    if (typeof jid !== "string") throw new TypeError(`jid must be string, received: ${jid}`);
    if (medias.length < 2) throw new RangeError("Se necesitan al menos 2 imágenes para un álbum");

    const caption = options.text || options.caption || "";
    const delay = !isNaN(options.delay) ? options.delay : 500;
    delete options.text;
    delete options.caption;
    delete options.delay;

    const album = baileys.generateWAMessageFromContent(
        jid,
        { messageContextInfo: {}, albumMessage: { expectedImageCount: medias.length } },
        {}
    );

    await conn.relayMessage(album.key.remoteJid, album.message, { messageId: album.key.id });

    for (let i = 0; i < medias.length; i++) {
        const { type, data } = medias[i];
        const img = await baileys.generateWAMessage(
            album.key.remoteJid,
            { [type]: data, ...(i === 0 ? { caption } : {}) },
            { upload: conn.waUploadToServer }
        );
        img.message.messageContextInfo = {
            messageAssociation: { associationType: 1, parentMessageKey: album.key },
        };
        await conn.relayMessage(img.key.remoteJid, img.message, { messageId: img.key.id });
        await baileys.delay(delay);
    }
    return album;
}

const pinterest = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return conn.reply(m.chat, `❀ Por favor, ingresa lo que deseas buscar por Pinterest.`, m);

    await m.react('🕒');
    conn.reply(m.chat, '✧ *Descargando imágenes de Pinterest...*', m, {
        contextInfo: {
            externalAdReply: {
                mediaUrl: null,
                mediaType: 1,
                showAdAttribution: true,
                title: packname,
                body: dev,
                previewType: 0,
                thumbnail: icono,
                sourceUrl: redes
            }
        }
    });

    try {
        const res = await fetch(`https://api.dorratz.com/v2/pinterest?q=${encodeURIComponent(text)}`);
        const data = await res.json();

        if (!Array.isArray(data) || data.length < 2) {
            return conn.reply(m.chat, '✧ No se encontraron suficientes imágenes para un álbum.', m);
        }

        // Descargamos las imágenes siguiendo redirecciones
        const images = [];
        for (let img of data.slice(0, 10)) {
            const url = img.image_large_url || img.image_small_url;
            if (!url) continue;
            const buffer = await downloadImage(url);
            images.push({ type: "image", data: buffer });
        }

        if (images.length < 2) {
            return conn.reply(m.chat, '✧ No se pudieron obtener suficientes imágenes válidas.', m);
        }

        const caption = `❀ *Resultados de búsqueda para:* ${text}`;
        await sendAlbumMessage(m.chat, images, { caption, quoted: m });

        await m.react('✅');
    } catch (error) {
        console.error(error);
        await m.react('❌');
        conn.reply(m.chat, '⚠︎ Hubo un error al obtener las imágenes de Pinterest.', m);
    }
};

pinterest.help = ['pinterest <query>'];
pinterest.tags = ['buscador', 'descargas'];
pinterest.command = ['pinterest', 'pin']
pinterest.register = true;
pinterest.group = true;

export default pinterest;
