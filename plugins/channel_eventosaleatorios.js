const encuestas = [
  {
    pregunta: "RETO DEL DIA 🗣️🔥: ¿Tienes amigos? 👀",
    opciones: ["😃 Sí", "😔 No"]
  },
  {
    pregunta: "RETO DEL DIA 🗣️🔥: ¿Volverías con tu ex? 💔",
    opciones: ["Sí 💘", "¡Jamás! 🚫"]
  },
  {
    pregunta: "RETO DEL DIA 🗣️🔥: ¿Reaccionarías a este mensaje? 😏",
    opciones: ["Claro 🫡", "No gracias 😶"]
  }
];

const mensajes = [
  "Si reaccionas este mensaje eres gey 🏳️‍🌈",
  "Sumemos 100 más de seguidores en menos de 2 días! >:)",
  "¡Reacciona con un emoji de corazón antes de 5 segundos!!! 💓",
  "¡Háganme spam UwU!",
];

const handler = async (m, { conn }) => {
  const tipo = Math.random() < 0.5 ? "mensaje" : "encuesta";

  try {
    if (tipo === "mensaje") {
      const mensaje = mensajes[Math.floor(Math.random() * mensajes.length)];
      await conn.sendMessage(m.sender, {
        text: `🔥 *RETO DEL DÍA PARA SEGUIDORES* 🗣️🔥:\n\n${mensaje}`
      });
    } else {
      const encuesta = encuestas[Math.floor(Math.random() * encuestas.length)];
      await conn.sendPoll(m.sender, encuesta.pregunta, encuesta.opciones);
    }
  } catch (e) {
    await conn.reply(m.chat, '❌ No pude mandarte el reto por privado. ¿Tienes el chat abierto conmigo? 😢', m);
  }
};

handler.help = ['evento'];
handler.tags = ['canal'];
handler.command = ['evento', 'eventoaleatorio'];
handler.register = true;
handler.channel = true;

export default handler;
