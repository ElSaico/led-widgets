var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export default class LEDPanel {
    constructor(el, resolution, ledSize = {x: 4, y: 5}, bgColor = 'black', offColor = '#444444') {
        this.offColor = offColor;
        el.setAttribute('width', (resolution.x * ledSize.x).toString());
        el.setAttribute('height', (resolution.y * ledSize.y).toString());
        el.style.backgroundColor = bgColor;
        el.innerHTML = '';
        this.resolution = resolution;
        this.leds = Array.from(Array(resolution.x).keys()).map(x => Array.from(Array(resolution.y).keys()).map(y => {
            const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
            ellipse.setAttribute('fill', offColor);
            ellipse.setAttribute('rx', (ledSize.x / 2).toString());
            ellipse.setAttribute('ry', (ledSize.y / 2).toString());
            ellipse.setAttribute('cx', (ledSize.x * (x + 0.5)).toString());
            ellipse.setAttribute('cy', (ledSize.y * (y + 0.5)).toString());
            el.appendChild(ellipse);
            return ellipse;
        }));
    }
    clearAll() {
        clearInterval(this.timer);
        for (let i = 0; i < this.resolution.y; ++i) {
            this.clearRow(i);
        }
    }
    clearRow(i) {
        for (let j = 0; j < this.resolution.x; ++j) {
            this.leds[j][i].setAttribute('fill', this.offColor);
        }
    }
    clearCol(j) {
        for (let i = 0; i < this.resolution.y; ++i) {
            this.leds[j][i].setAttribute('fill', this.offColor);
        }
    }
    drawRow(i, row, color) {
        [...row].forEach((col, j) => this.leds[j][i].setAttribute('fill', col === '1' ? color : this.offColor));
    }
    drawCol(j, col, color) {
        [...col].forEach((row, i) => this.leds[j][i].setAttribute('fill', row === '1' ? color : this.offColor));
    }
    drawMatrix(data, color) {
        data.forEach((row, i) => this.drawRow(i, row, color));
    }
    drawBitmap(bitmap, color, yOffset) {
        bitmap.crop(this.resolution.x, bitmap.height(), -yOffset);
        this.drawMatrix(bitmap.todata(1), color);
    }
    drawLooping(bitmap, color, interval) {
        let offset = 0;
        this.timer = setInterval(() => {
            offset = (offset+1) % bitmap.width();
            const leftWidth = Math.min(bitmap.width() - offset, this.resolution.x);
            const newBitmap = bitmap.clone().crop(leftWidth, bitmap.height(), offset);
            if (newBitmap.width() < this.resolution.x) {
                newBitmap.concat(bitmap.clone().crop(this.resolution.x - leftWidth, bitmap.height()));
            }
            this.drawMatrix(newBitmap.todata(1), color);
        }, interval);
    }
    drawFixed(font, text, color, offset) {
        clearInterval(this.timer);
        this.drawBitmap(font.draw(text), color, offset);
    }
    drawLoopable(font, text, color, interval) {
        clearInterval(this.timer);
        const bitmap = font.draw(text);
        if (bitmap.width() > this.resolution.x) {
            bitmap.crop(bitmap.width() + 2*font.headers.fbbx, bitmap.height());
            this.drawLooping(bitmap, color, interval);
        } else {
            const offset = (this.resolution.x - bitmap.width()) / 2;
            this.drawBitmap(bitmap, color, offset);
        }
    }
    // time spent: (bitmap width + x resolution) * interval
    drawScroll(font, text, color, interval) {
        return __awaiter(this, void 0, void 0, function* () {
            clearInterval(this.timer);
            const bitmap = font.draw(text);
            for (let offset = -this.resolution.x; offset <= bitmap.width(); ++offset) {
                const newBitmap = bitmap.clone().crop(this.resolution.x, bitmap.height(), offset);
                this.drawMatrix(newBitmap.todata(1), color);
                yield new Promise(cb => setTimeout(cb, interval));
            }
        });
    }
    // time spent: 2 * y resolution (typically 8) * interval
    drawAnimatedVertical(font, text, color, interval) {
        return __awaiter(this, void 0, void 0, function* () {
            clearInterval(this.timer);
            const bitmap = font.draw(text);
            const offset = (this.resolution.x - bitmap.width()) / 2;
            bitmap.crop(this.resolution.x, bitmap.height(), -offset);
            for (let i = 0; i < this.resolution.y; ++i) {
                const rowBitmap = bitmap.clone().crop(bitmap.width(), 1, 0, this.resolution.y - i - 1);
                this.drawRow(i, rowBitmap.todata(0), color);
                yield new Promise(cb => setTimeout(cb, interval));
            }
            for (let i = 0; i < this.resolution.y; ++i) {
                yield new Promise(cb => setTimeout(cb, interval));
                this.clearRow(i);
            }
        });
    }
    // time spent: 2 * bitmap width * interval
    drawAnimatedHorizontal(font, text, color, interval) {
        return __awaiter(this, void 0, void 0, function* () {
            clearInterval(this.timer);
            let bitmap = font.draw(text);
            if (this.resolution.x < bitmap.width()) {
              bitmap = bitmap.crop(this.resolution.x, this.resolution.y);
            }
            const offset = (this.resolution.x - bitmap.width()) >> 1;
            for (let j = 0; j < bitmap.width(); ++j) {
                const colBitmap = bitmap.clone().crop(1, bitmap.height(), j, 0);
                this.drawCol(offset+j, colBitmap.todata(0).replaceAll('\n', ''), color);
                yield new Promise(cb => setTimeout(cb, interval));
            }
            for (let j = 0; j < bitmap.width(); ++j) {
                yield new Promise(cb => setTimeout(cb, interval));
                this.clearCol(offset+j);
            }
        });
    }
}