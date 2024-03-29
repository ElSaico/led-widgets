import { $Font } from './node_modules/bdfparser/dist/esm/bdfparser.js';
import fetchline from './node_modules/fetchline/dist/esm/index.js';

import LEDPanel from './led.js';

function connect() {
    return new WebSocket("ws://localhost:8080/");
}

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const font = await $Font(fetchline('fonts/metro.bdf'));
    const filename = params.get('filename');
    const file = await fetch(`labels/${filename}`);

    const panel = new LEDPanel(document.getElementById('panel'), {x: 80, y: 8});
    panel.drawLoopable(font, await file.text(), '#bfff00', 100);

    let ws = connect();
    ws.onopen = () => {
        ws.send(JSON.stringify({
            "request": "Subscribe",
            "events": {
              "FileWatcher": ["Changed"]
            },
            "id": filename
        }));
    }
    ws.onclose = () => {
        setTimeout(() => { ws = connect; }, 10000);
    };
    ws.onmessage = event => {
        const data = JSON.parse(event.data);
        if (data.status) return;
        if (data.event.source === 'FileWatcher' && data.event.type === 'Changed' && data.data.fileName === filename) {
            panel.drawLoopable(font, data.data.lines[0], '#bfff00', 100);
        }
    };
});