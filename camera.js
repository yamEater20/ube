import {framesToMs, Vector} from './math.js';
import {CTX} from './graphics.js';
import * as Text from './text.js';
import {msToFrames, Timer} from './time.js';

const SCREEN_SHAKES = [
	Vector({x: 0, y: 0}),
	Vector({x: -2, y: -2}),
	Vector({x: -2, y: -2}),
	Vector({x: 0, y: -2}),
	Vector({x: 0, y: -2}),
	Vector({x: 2, y: 0}),
	Vector({x: 2, y: 0}),
	Vector({x: 0, y: 0}),
	Vector({x: 0, y: 0}),
];

class Camera {
    constructor() {
        this._position = Vector({x: 0, y: 0});
        this._targetPosition = Vector({x: 0, y: 0});
        this.screenShakePos = Vector({x: 0, y: 0});
        this.screenshakeTime = 0;

        this.strength = 0;
        this.shakeTimer = new Timer(1000);
    }

    getPosition() {
        return this._position.addPoint(this.screenShakePos).trunc();
    }

    shakeScreen(strength = 1, duration = 250) {
        this.shakeTimer.restart(duration);
        this.strength = Math.max(this.strength, strength);
    }

    update(time) {
        // this._position.x = Math.floor(Math.sin(TrueTime.time / 1000) * 10);
        
        if (this.shakeTimer.finished()) {
            this.screenShakePos = Vector({x: 0, y: 0});
        } else {
            this.shakeTimer.update(time.delta);

            let index = this.shakeTimer.framesRemaining() % SCREEN_SHAKES.length;
            
            this.screenShakePos = SCREEN_SHAKES[index].scalar(this.strength);
            const canvas = document.getElementsByTagName("canvas")[0];
            canvas.style.backgroundPosition = `top ${this.screenShakePos.x * 3}px left ${this.screenShakePos.y * 2}px`;
        }

        this._moveToTarget();
    }

    drawRect(x, y, w, h, color) {
        CTX.fillStyle = color ? color : "#29ADFF";
        CTX.fillRect(x + this.getPosition().x, y + this.getPosition().y, w, h);
    }
    
    drawPixel(x, y, color) {
        CTX.fillStyle = color ? color : 'black';
        CTX.fillRect(x + this.getPosition().x, y + this.getPosition().y, 1, 1);
    }
    
    drawEllipse(x, y, rad, colorA, colorB) {
        x += this.getPosition().x;
        y += this.getPosition().y;
    
        const grad = CTX.createRadialGradient(x,y,0,x,y,rad);
        grad.addColorStop(0,colorA);
        grad.addColorStop(1,colorB ? colorB : colorA);
    
        CTX.fillStyle = grad;
        CTX.beginPath();
        CTX.ellipse(x, y, rad, rad, 0, 0, Math.PI * 2, true);
        CTX.fill();
    }
    
    drawImage(img, x, y) {
        CTX.drawImage(img, this.getPosition().x + x, this.getPosition().y + y);
    }

    drawSprite(sprite, x, y) {
        sprite.draw(x, y, this.getPosition());
    }

    writeText(txt, size, pos, color, spacing) {
        Text.writeText(txt, size, pos.addPoint(this.getPosition()), color, spacing);
    }

    drawLine(x0, y0, x1, y1, color) {
        CTX.fillStyle = color;
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = (x0 < x1) ? 1 : -1;
        const sy = (y0 < y1) ? 1 : -1;
        let err = dx - dy;
        while (true) {
            CTX.fillRect(x0 + this.getPosition().x, y0 + this.getPosition().y, 1, 1); // Do what you need to for this
            if (Math.abs(x0 - x1) < 0.01 && Math.abs(y0 - y1) < 0.01) break;
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x0 += sx;
            }
            if (e2 < dx) {
                err += dx;
                y0 += sy;
            }
        }
    }

    moveToPosition(pos) {
        this._targetPosition = pos;
    }

    _moveToTarget() {
		var v = this._targetPosition.addPoint(this._position.scalar(-1));
		const mag = v.magnitude();
        if (mag < 0.01) {
            this._position = this._targetPosition;
			return;
		}

		const speed = Math.min(6, mag / 4);
		v = v.scalar(speed / mag * TrueTime.delta / 16.6);
		this._position = this._position.addPoint(v);
    }
}

const camera = new Camera();
// camera._position = Vector({x: 5, y: 20});
const staticCamera = new Camera();

export {
    camera,
    staticCamera
}