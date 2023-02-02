import './node_modules/modern-async/dist/modern-async.umd.js';
import { $Font } from './node_modules/bdfparser/dist/esm/bdfparser.js';
import fetchline from './node_modules/fetchline/dist/esm/index.js';

import LEDPanel from './led.js';

const COLOR_IBM = '#ff9900';
const COLOR_METRO = '#bfff00';

function connect() {
  return new WebSocket("ws://localhost:8080/");
}

document.addEventListener('DOMContentLoaded', async () => {
  const fontIbm = await $Font(fetchline('fonts/ibm8x8.bdf'));
  const fontMetro = await $Font(fetchline('fonts/metro.bdf'));
  const panel = new LEDPanel(document.getElementById('panel'), {x: 200, y: 8});
  const queue = new modernAsync.Queue(1);

  let ws = connect();
  ws.onopen = () => {
    ws.send(JSON.stringify({
      request: 'Subscribe',
      events: {
        Raw: ['Action']
      },
      id: 'alerts'
    }));
  }
  ws.onclose = () => {
    setTimeout(() => { ws = connect; }, 10000);
  };
  ws.onmessage = event => {
    const data = JSON.parse(event.data);
    if (data.status) return;

    const message = data.data.arguments.alertMessage;
    if (!message) return;
    switch (data.data.name) {
      case 'Alert trigger: Fixed':
        queue.exec(async () => {
          await panel.drawLoopable(fontIbm, message, COLOR_IBM, 25);
        });
        break;
      case 'Alert trigger: Scroll':
        queue.exec(async () => {
          await panel.drawScroll(fontIbm, message, COLOR_IBM, 25);
        });
        break;
      case 'Alert trigger: Animated H':
        queue.exec(async () => {
          await panel.drawAnimatedHorizontal(fontMetro, message, COLOR_METRO, 50);
        });
        break;
      case 'Alert trigger: Animated V':
        queue.exec(async () => {
          await panel.drawAnimatedVertical(fontMetro, message, COLOR_METRO, 250);
        });
        break;
    }
  };
});