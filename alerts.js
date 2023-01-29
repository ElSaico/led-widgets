import { $Font } from './node_modules/bdfparser/dist/esm/bdfparser.js';
import fetchline from './node_modules/fetchline/dist/esm/index.js';

import LEDPanel from './led.js';

const COLOR_IBM = '#ff9900';
const COLOR_METRO = '#bfff00';

function connect() {
  return new WebSocket("ws://localhost:8080/");
}

function displayUser(name, login, anonymous) {
  if (anonymous) return 'anônimo';
  return /\p{ASCII}+/u.test(name) ? name : login;
}

function pluralize(amount, singular, plural) {
  return amount === 1 ? `${amount} ${singular}` : `${amount} ${plural}`;
}

function latinize(text) {
  return text.replaceAll('\u2212', '-');
}

document.addEventListener('DOMContentLoaded', async () => {
  const fontIbm = await $Font(fetchline('fonts/ibm8x8.bdf'));
  const fontMetro = await $Font(fetchline('fonts/metro.bdf'));
  const panel = new LEDPanel(document.getElementById('panel'), {x: 200, y: 8});

  let ws = connect();
  ws.onopen = () => {
    ws.send(JSON.stringify({
      request: 'Subscribe',
      events: {
        Twitch: ['Follow', 'Cheer', 'Raid', 'Sub', 'ReSub', 'GiftSub', 'GiftBomb']
      },
      id: 'alerts'
    }));
  }
  ws.onclose = () => {
    setTimeout(() => { ws = connect; }, 10000);
  };
  ws.onmessage = async event => {
    const data = JSON.parse(event.data);
    if (data.status) return;

    // TODO counters
    // TODO shoutout
    if (data.event.source === 'Twitch') {
      let title, game;
      let userName = displayUser(data.data.displayName, data.data.userName, data.data.isAnonymous);
      let message = data.data.message;
      switch (data.event.type) {
        case 'Follow':
          title = 'Novo passageiro no Comboio';
          userName = displayUser(data.data.user_name, data.data.user_login, false);
          break;
        case 'Cheer':
          title = `${pluralize(data.data.message.bits, 'bit enviado', 'bits enviados')} para o Comboio`;
          userName = displayUser(data.data.message.displayName, data.data.message.userName, data.data.message.isAnonymous);
          message = data.data.message.message;
          break;
        case 'Raid':
          title = `Embarque de uma raid com ${pluralize(data.data.viewerCount, 'pessoa', 'pessoas')}`;
          break;
        case 'Sub':
          title = 'Passe adquirido pela primeira vez';
          break;
        case 'ReSub':
          title = `Passe renovado, somando ${data.data.cumulativeMonths} meses`;
          break;
        case 'GiftSub':
          if (data.data.fromSubBomb) return;
          title = `Passe doado por ${userName}`;
          userName = displayUser(data.data.recipientDisplayName, data.data.recipientUsername, false);
          break;
        case 'GiftBomb':
          title = `Doação de ${data.data.gifts} passes simultâneos`;
          break;
      }
      if (title) {
        // TODO can we call TTS from here?
        await panel.drawScroll(fontIbm, title, COLOR_IBM, 25);
      }
      if (userName) {
        await panel.drawAnimatedVertical(fontMetro, userName, COLOR_METRO, 250);
      }
      if (game) {
        await panel.drawAnimatedHorizontal(fontMetro, game, COLOR_METRO, 50);
      }
      if (message) {
        await panel.drawScroll(fontIbm, message, COLOR_IBM, 25);
      }
    }
  };
});