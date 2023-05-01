import { $Font } from './node_modules/bdfparser/dist/esm/bdfparser.js';
import fetchline from './node_modules/fetchline/dist/esm/index.js';

import LEDPanel from './led.js';

function connect() {
    return new WebSocket("ws://localhost:8080/");
}

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const font = await $Font(fetchline('fonts/metro.bdf'));
    const ledLabel = new LEDPanel(document.getElementById('label'), {x: 120, y: 8});
    const ledValue = new LEDPanel(document.getElementById('value'), {x: 120, y: 8});

    const entries = {};
    for (const [key, value] of params.entries()) {
        const file = await fetch(`labels/${key}`);
        entries[key] = {
            label: value,
            value: await file.text()
        }
    }
    const filenames = Object.keys(entries);

    let i = 0;
    setInterval(() => {
        const entry = entries[filenames[i++ % filenames.length]];
        ledLabel.drawFixed(font, entry.label, '#bfff00', 0);
        ledValue.drawLoopable(font, entry.value, '#bfff00', 100);    
    }, 3000);

    let ws = connect();
    ws.onopen = () => {
        filenames.forEach(filename => {
            ws.send(JSON.stringify({
                "request": "Subscribe",
                "events": {
                    "FileWatcher": ["Changed"]
                },
                "id": filename
            }));
        });
    }
    ws.onclose = () => {
        setTimeout(() => { ws = connect; }, 10000);
    };
    ws.onmessage = event => {
        const data = JSON.parse(event.data);
        if (data.status) return;
        if (data.event.source === 'FileWatcher' && data.event.type === 'Changed') {
            entries[data.data.fileName].value = data.data.lines[0];
        }
    };
});