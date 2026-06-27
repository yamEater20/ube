import {framesToMs, Vector} from './math.js';
import {PIXEL_GAME_SIZE} from './graphics.js';
import * as Text from './text.js';
import {msToFrames, Timer} from './time.js';

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
    constructor(ctx, initialPosition, getFollowingFunc, screenShakeOffsetProvider, depth) {
        this._ctx = ctx;
        this._position = initialPosition ?? Vector({x: 0, y: 0});
        this.scale = 1;

        this._getFollowingFunc = getFollowingFunc;
        this.isMoving = false;

        this._screenShakeOffsetProvider = screenShakeOffsetProvider;

        this.depth = depth ?? 1;
    }

    _getScreenShakeOffset() {
        return this._screenShakeOffsetProvider.getOffset();
    }

    _getPositionUnTruncated() {
        return this._position.addPoint(this._getScreenShakeOffset()).scalar(this.scale * this.depth);
    }

    getPosition() {
        return this._getPositionUnTruncated().trunc().scalar(-1);
    }

    getSubPixels() {
        if (this.scale != 1) throw new Error("Not implemented");

        const truncPosition = this.getPosition();
        const floatPosition = this._getPositionUnTruncated();
        return floatPosition.addPoint(truncPosition);
    }

    update(timeDelta) {
        this._ctx.reset();

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
                const rotateAroundX = options.rotateAround?.x ?? 0;
                const rotateAroundY = options.rotateAround?.y ?? 0;
                this._ctx.translate(dx+rotateAroundX, dy+rotateAroundY);
                this._ctx.rotate(options.rotation);
                this._ctx.translate(-dx-rotateAroundX, -dy-rotateAroundY);
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

    drawCanvas(canvas, scale, subpixels) {
        this._ctx.save();
        this._ctx.scale(scale, scale);
        this._ctx.drawImage(canvas, -subpixels.x, -subpixels.y);
        this._ctx.restore();
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

		const speed = Math.min(6, mag / 3) * 0.04;
		v = v.scalar(speed / mag * timeDelta);
		this._position = this._position.addPoint(v);
    }
}

class IScreenShakeOffsetProvider {
    getOffset() {
        throw new Error("Must implement");
    }
}

// camera._position = Vector({x: 5, y: 20});
const staticCamera = new Camera();

export {
    Camera,
    IScreenShakeOffsetProvider,
    staticCamera
}