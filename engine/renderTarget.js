import * as Text from './text.js';

export class IRenderTarget {
    update(timeDelta) {throw new Error("Must implement")}

    drawWithOpacity(func, opacity) {throw new Error("Must implement")}

    drawRect(x, y, w, h, color) {throw new Error("Must implement")}

    drawRectOutline(x, y, w, h, color) {throw new Error("Must implement")}
    
    drawPixel(x, y, color) {throw new Error("Must implement")}
    
    drawEllipse(x, y, rad, colorA, colorB) {throw new Error("Must implement")}

    drawImage(image, dx, dy, options) {throw new Error("Must implement")}

    writeText(txt, size, pos, color, spacing) {throw new Error("Must implement")}

    drawLine(x0, y0, x1, y1, color) {throw new Error("Must implement")}

    drawCanvas(canvas, scale, subpixels) {throw new Error("Must implement")}

    getImage() {throw new Error("Must implement")}

    clear() {throw new Error("Must implement")}
}

export class CanvasRenderTarget extends IRenderTarget {
    constructor(canvas, context) {
        super();
        this._canvas = canvas;
        this._context = context;
    }

    reset(position, scale) {
        this._context.reset();
        this._context.setTransform(1, 0, 0, 1, position.x * scale, position.y * scale);
    }

    drawWithOpacity(func, opacity) {
        this._context.save();
        this._context.globalAlpha = opacity;
        func(this);
        this._context.restore();
    }

    drawRect(x, y, w, h, color) {
        this._context.fillStyle = color ? color : "#29ADFF";
        this._context.fillRect(x, y, w, h);
    }

    drawRectOutline(x, y, w, h, color) {
        this._context.strokeStyle = color;
        this._context.strokeRect(x, y, w, h);
    }
    
    drawPixel(x, y, color) {
        this._context.fillStyle = color ? color : 'black';
        this._context.fillRect(x, y, 1, 1);
    }
    
    drawEllipse(x, y, rad, colorA, colorB) {
        const grad = this._context.createRadialGradient(x,y,0,x,y,rad);
        grad.addColorStop(0,colorA);
        grad.addColorStop(1,colorB ? colorB : colorA);
    
        this._context.fillStyle = grad;
        this._context.beginPath();
        this._context.ellipse(x, y, rad, rad, 0, 0, Math.PI * 2, true);
        this._context.fill();
    }

    drawImage(image, dx, dy, options) {
        if (options) {
            this._context.save();

            if (options.sWidth) {
                options.dWidth = options.dWidth ?? options.sWidth;
                options.dHeight = options.dHeight ?? options.sHeight;
            }
    
            if (options.flip) {
                this._context.translate(dx+options.dWidth, 0);
                this._context.scale(-1, 1);
                this._context.translate(-dx, 0);
            }

            if (options.rotation) {
                const rotateAroundX = options.rotateAround?.x ?? 0;
                const rotateAroundY = options.rotateAround?.y ?? 0;
                this._context.translate(dx+rotateAroundX, dy+rotateAroundY);
                this._context.rotate(options.rotation);
                this._context.translate(-dx-rotateAroundX, -dy-rotateAroundY);
            }
    
            if (options.sWidth) {
                this._context.drawImage(
                    image,
                    options.sx, options.sy,
                    options.sWidth, options.sHeight,
                    dx, dy,
                    options.dWidth, options.dHeight
                );
            } else {
                this._context.drawImage(image, dx, dy);
            }

            this._context.restore();

        } else {
            this._context.drawImage(image, dx, dy);
        }
    }

    writeText(txt, size, pos, color, spacing) {
        Text.writeText(this, txt, size, pos.addPoint(this.getPosition()), color, spacing);
    }

    drawLine(x0, y0, x1, y1, color) {
        this._context.fillStyle = color;
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = (x0 < x1) ? 1 : -1;
        const sy = (y0 < y1) ? 1 : -1;
        let err = dx - dy;
        while (true) {
            this._context.fillRect(x0, y0, 1, 1);
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

    drawRenderTarget(renderTarget, scale, subpixels) {
        this._context.save();
        this._context.scale(scale, scale);
        this._context.drawImage(renderTarget.getImage(), subpixels.x, subpixels.y);
        this._context.restore();
    }

    getImage() {return this._canvas;}

    clear() {
        this._context.clearRect(0, 0, this._canvas.width, this._canvas.height)
    }
}

export class DummyRenderTarget extends IRenderTarget {
    update(timeDelta) {}
    
    drawWithOpacity(func, opacity) {}

    drawRect(x, y, w, h, color) {}

    drawRectOutline(x, y, w, h, color) {}
    
    drawPixel(x, y, color) {}
    
    drawEllipse(x, y, rad, colorA, colorB) {}

    drawImage(image, dx, dy, options) {}

    writeText(txt, size, pos, color, spacing) {}

    drawLine(x0, y0, x1, y1, color) {}

    drawCanvas(canvas, scale, subpixels) {}

    getImage() {return new Image();}

    clear() {}
}