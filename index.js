'use strict';
const BootBot = require('bootbot');
const REPLY_SIM_NAO = [{title: 'Sim', payload: 'INICIO_SIM'},
  {title: 'Não', payload: 'INICIO_NAO'}];

const bot = new BootBot({
  accessToken: process.env.FB_ACCESS_TOKEN,
  verifyToken: process.env.FB_VERIFY_TOKEN,
  appSecret: process.env.FB_APP_SECRET
});

var gProjectId = process.env.GCLOUD_PROJECT;
var gKey = process.env.GCLOUD_KEY;

var translate = require('@google-cloud/translate');
var translateClient = translate({
  projectId: process.env.GCLOUD_PROJECT,
  key: gKey
});
translateClient.translate('me sinto feliz', 'en', function(err, translation) {
  if (!err) {
    console.log(translation);
  } else {
    console.log(err);
  }
});

const erroGenerico = convo =>
    convo.getUserProfile().then((user) => {
        convo.say(`${user.first_name}, tivemos dificuldades para encontrar um filme. Tente novamente por favor.`);
        convo.end();
    });

const askMovie = (convo) => {
    convo.getUserProfile().then(user => console.log(user.first_name + ' askMovie'));
    convo.ask('Qual frase te descreve melhor no momento?', (payload) => {
        if(typeof payload.message === 'undefined'){
            convo.end();
            chat.getUserProfile().then((user) => {
                chat.say({
                    text: `Olá, ${user.first_name}! tudo bem? Já te indicou um filme, ok?`,
                    quickReplies: REPLY_SIM_NAO
                });
            });
        }

        let messageText = payload.message.text;
        if(typeof messageText == 'string' && (messageText.length >= 10)){
            convo.set('contextMessage', messageText);

            try {
                convo.sendTypingIndicator(1000)
                  .then( () => getTranslate(convo));
                  // .then( () => getSentiment(convo))
                  // .then( () => getMovies(convo));
            } catch(err) {
                return erroGenerico(convo);
            }
        } else {
            convo.sendTypingIndicator(1000).then(() => verificaTentativas(convo));
        }
    });
};

const getTranslate = (convo) => {
    let message = convo.get('contextMessage');
    try {
      return translateClient.translate(message, 'en', function(err, translation) {
        if (!err) {
          console.log(translation);
          return translation
        } else {
          return erroGenerico(convo);
        }
      });
    } catch(err) {
      console.log(err);
        return erroGenerico(convo);
    }
};

const verificaTentativas = (convo) => {
    convo.getUserProfile().then(user => console.log(user.first_name + ' verificaTentativas'));
    let tentativasEntrada = convo.get('tentativa');
    if(typeof tentativasEntrada === 'undefined' || tentativasEntrada == null || !tentativasEntrada){
        tentativasEntrada = 0;
    }
    tentativasEntrada += 1;
    convo.set('tentativa', tentativasEntrada);

    switch (tentativasEntrada) {
    case 1:
        convo.say('Acho que você poderia escrever mais algumas palavras, certo? ;)');
        break;
    case 2:
        convo.say('Infelizmente não entender como você está se sentindo no momento, desculpe! Até a pŕoxima ;)');
        return convo.end();
    }
    if (tentativasEntrada < 2 ){
        convo.sendTypingIndicator(1000).then(() => askMovie(convo));
    }
};

bot.on('postback:PAYLOAD_NEW_MOVIE', (payload, chat) => {
  chat.getUserProfile().then((user) => {
      chat.say({
          text: `Olá, ${user.first_name}! tudo bem? Já te indicou um filme, ok?`,
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
