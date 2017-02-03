'use strict';
const BootBot = require('bootbot');
const REPLY_SIM_NAO = [{title: 'Sim', payload: 'INICIO_SIM'},
  {title: 'Não', payload: 'INICIO_NAO'}];

const bot = new BootBot({
  accessToken: process.env.FB_ACCESS_TOKEN,
  verifyToken: process.env.FB_VERIFY_TOKEN,
  appSecret: process.env.FB_APP_SECRET
});

bot.on('message', (payload, chat) => {
  const text = payload.message.text;
  chat.say(`Echo: ${text}`);
});

export const erroGenerico = convo =>
    convo.getUserProfile().then((user) => {
        convo.say(`${user.first_name}, tivemos dificuldades para encontrar um filme. Tente novamente por favor.`);
        convo.end();
    });

export const askMovie = (convo) => {
    convo.getUserProfile().then(user => console.log(user.first_name + ' askMovie'));
    convo.ask('Qual frase te descreve melhor no momento?', (payload) => {
        if(typeof payload.message === 'undefined'){
            convo.end();
            chat.getUserProfile().then((user) => {
                chat.say({
                    text: `Olá, ${user.first_name}! Escolha umas das frases a seguir que eu irei te indicar um bom filme, ok?`,
                    quickReplies: REPLY_SIM_NAO
                });
            });
        }

        let messageText = payload.message.text;
        convo.sendTypingIndicator(1000);
    });
};

bot.on('postback:PAYLOAD_NEW_MOVIE', (payload, chat) => {
  chat.getUserProfile().then((user) => {
      chat.say({
          text: `Olá, ${user.first_name}! Escolha umas das frases a seguir que eu irei te indicar um bom filme, ok?`,
          quickReplies: REPLY_SIM_NAO
      });
  });
});

bot.on('quick_reply:INICIO_SIM', (payload, chat) => {
    chat.conversation(convo =>
      convo.sendTypingIndicator(1000).then(() => askMovie(convo))
    );
});

bot.on('quick_reply:INICIO_NAO', (payload, chat) => {
  chat.getUserProfile().then((user) => {
      chat.say(`Ia te indicar um filme legal ${user.first_name}. Até a próxima ;)`);
  });
});

bot.setPersistentMenu([
    {
        type: 'postback',
        title: 'Quero um indicação de filme',
        payload: 'PAYLOAD_NEW_MOVIE'
    }
]);

bot.start(process.env.PORT);
