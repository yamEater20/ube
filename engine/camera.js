import {framesToMs, Vector} from './math.js';
import {PIXEL_GAME_SIZE} from './graphics.js';
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

export class DummyCamera {
    getPosition() {return Vector({x: 0, y: 0});}

    shakeScreen(strength = 1, duration = 250) {}

    update(timeDelta) {}

    drawWithOpacity(func, opacity) {}

    drawRect(x, y, w, h, color) {}

    drawRectOutline(x, y, w, h, color) {}
    
    drawPixel(x, y, color) {}
    
    drawEllipse(x, y, rad, colorA, colorB) {}

    drawImage(image, dx, dy, options) {}

    writeText(txt, size, pos, color, spacing) {}

    drawLine(x0, y0, x1, y1, color) {}
}

class Camera {
    constructor(ctx, initialPosition, getFollowingFunc) {
        this._ctx = ctx;
        this._position = initialPosition ?? Vector({x: 0, y: 0});
        this.screenShakePos = Vector({x: 0, y: 0});
        this.screenshakeTime = 0;
        this.scale = 1;

        this.strength = 0;
        this.shakeTimer = new Timer(1000);

        this._getFollowingFunc = getFollowingFunc;
        this.isMoving = false;
    }

    getPosition() {
        return this._position.addPoint(this.screenShakePos).scalar(this.scale).trunc().scalar(-1);
    }

    shakeScreen(strength = 1, duration = 250) {
        this.shakeTimer.restart(duration);
        this.strength = Math.max(this.strength, strength);
    }

    update(timeDelta) {
        if (this.shakeTimer.finished()) {
            this.screenShakePos = Vector({x: 0, y: 0});
        } else {
            this.shakeTimer.update(timeDelta);

            const index = this.shakeTimer.framesRemaining() % SCREEN_SHAKES.length;
            this.screenShakePos = SCREEN_SHAKES[index].scalar(this.strength);
            const canvas = document.getElementsByTagName("canvas")[0];
            canvas.style.backgroundPosition = `top ${this.screenShakePos.x * 3}px left ${this.screenShakePos.y * 2}px`;
        }

        //TODO: change this pool to a queue for cinematics, remove hardcoded logic
        this._moveToTarget(timeDelta, this._getFollowingFunc().globalPosition().add(-PIXEL_GAME_SIZE.x/2, -PIXEL_GAME_SIZE.y/2));

        const myPosition = this.getPosition();
        this._ctx.setTransform(1, 0, 0, 1, myPosition.x * this.scale, myPosition.y * this.scale);
        this._ctx.scale(this.scale, this.scale);
    }

    drawWithOpacity(func, opacity) {
        this._ctx.save();
        this._ctx.globalAlpha = opacity;
        func(this);
        this._ctx.restore();
    }

    drawRect(x, y, w, h, color) {
        this._ctx.fillStyle = color ? color : "#29ADFF";
        this._ctx.fillRect(x, y, w, h);
    }

    drawRectOutline(x, y, w, h, color) {
        this._ctx.strokeStyle = color;
        this._ctx.strokeRect(x, y, w, h);
    }
    
    drawPixel(x, y, color) {
        this._ctx.fillStyle = color ? color : 'black';
        this._ctx.fillRect(x, y, 1, 1);
    }
    
    drawEllipse(x, y, rad, colorA, colorB) {
        const grad = this._ctx.createRadialGradient(x,y,0,x,y,rad);
        grad.addColorStop(0,colorA);
        grad.addColorStop(1,colorB ? colorB : colorA);
    
        this._ctx.fillStyle = grad;
        this._ctx.beginPath();
        this._ctx.ellipse(x, y, rad, rad, 0, 0, Math.PI * 2, true);
        this._ctx.fill();
    }

    drawImage(image, dx, dy, options) {
        if (options) {
            this._ctx.save();

            if (options.sWidth) {
                options.dWidth = options.dWidth ?? options.sWidth;
                options.dHeight = options.dHeight ?? options.sHeight;
            }
    
            if (options.flip) {
                this._ctx.translate(dx+options.dWidth, 0);
                this._ctx.scale(-1, 1);
                this._ctx.translate(-dx, 0);
            }

            if (options.rotation) {
                this._ctx.translate(dx+4, dy+4);
                this._ctx.rotate(options.rotation);
                this._ctx.translate(-dx-4, -dy-4);
                
                // let uberOffset = Vector({x: 0, y: 0});
                // switch (this.direction) {
                //     case VectorUp:
                //         break;
                //     case VectorLeft:
                //         uberOffset.x = -TILE_SIZE;
                //         break;
                //     case VectorRight:
                //         uberOffset.y = -TILE_SIZE;
                //         break;
                //     case VectorDown:
                //         uberOffset.x = -TILE_SIZE;
                //         uberOffset.y = -TILE_SIZE;
                //     default:
                //         break;
                // }

                // CTX.translate(-x + uberOffset.x, -y + uberOffset.y);
            }
    
            if (options.sWidth) {
                this._ctx.drawImage(
                    image,
                    options.sx, options.sy,
                    options.sWidth, options.sHeight,
                    dx, dy,
                    options.dWidth, options.dHeight
                );
            } else {
                this._ctx.drawImage(image, dx, dy);
            }

            this._ctx.restore();

        } else {
            this._ctx.drawImage(image, dx, dy);
        }
    }

    writeText(txt, size, pos, color, spacing) {
        Text.writeText(this, txt, size, pos.addPoint(this.getPosition()), color, spacing);
    }

    drawLine(x0, y0, x1, y1, color) {
        this._ctx.fillStyle = color;
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = (x0 < x1) ? 1 : -1;
        const sy = (y0 < y1) ? 1 : -1;
        let err = dx - dy;
        while (true) {
            this._ctx.fillRect(x0, y0, 1, 1); // Do what you need to for this
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

    drawCanvas(canvas) {
        this._ctx.scale(7, 7);
        this._ctx.drawImage(canvas, 0, 0);
    }

    _moveToTarget(timeDelta, targetPosition) {
		var v = targetPosition.addPoint(this._position.scalar(-1));
		const mag = v.magnitude();
        if (mag < 1) {
            this._position = targetPosition;
            this.isMoving = false;
			return;
		}

        this.isMoving = true;

		const speed = Math.min(6, mag / 3) * 0.05;
		v = v.scalar(speed / mag * timeDelta);
		this._position = this._position.addPoint(v);
    }
}

// camera._position = Vector({x: 5, y: 20});
const staticCamera = new Camera();

export {
    Camera,
    staticCamera
}