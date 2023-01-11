import { $Font } from './node_modules/bdfparser/dist/esm/bdfparser.js';
import fetchline from './node_modules/fetchline/dist/esm/index.js';

import LEDPanel from './led.js';

function connect() {
    return new WebSocket("ws://localhost:8080/");
}

document.addEventListener('DOMContentLoaded', async () => {
    let ws = connect();
    const font = await $Font(fetchline('fonts/metro.bdf'));
    const panel = new LEDPanel(document.getElementById('panel'), {x: 80, y: 8});
    panel.drawLoopable(font, 'teste', '#bfff00', 100);

    ws.onopen = () => {
        ws.send(JSON.stringify({
            "request": "Subscribe",
            "events": {
              "File Watcher": ["Changed"]
            },
            "id": "123"
        }));
    }
    ws.onclose = () => {
        setTimeout(() => { ws = connect; }, 10000);
    };
});