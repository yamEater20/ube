import { lerp, VectorDown } from "../engine/math.js";

export class RectDrawable {
    constructor(size, color) {
        this.size = size ?? VectorOne;
        this._color = color ?? "#ff0000";
    }

    draw(x, y, camera, color) {
        camera.getRenderTarget().drawRect(
            x, y,
            this.size.x, this.size.y,
            color ?? this._color
        );
    }
}

export class OpacityDrawableDecorator {
    constructor(drawable) {
        this._drawable = drawable;
        this._currentOpacity = 1;

        this.color = "#ffffff";
    }

    reset(opacityStart, opacityEnd, fadeTime, color) {
        this._opacityStart = opacityStart;
        this._currentOpacity = opacityStart;
        
        this._opacityEnd = opacityEnd;
        this._fadeTime = fadeTime;
        this._time = 0;

        this.color = color;
    }

    draw(x, y, camera) {
        //TODO: generalize this to draw for any color.
        // I think you should write a camera.drawWithColor...?
        // Or, maybe make a DrawableColorable decorator????
        camera.getRenderTarget().drawWithOpacity(
            () => this._drawable.draw(x, y, camera, this.color),
            this._currentOpacity
        );
    }

    update(timeDelta) {
        this._time += timeDelta;
        const t = this._time / this._fadeTime;
        this._currentOpacity = lerp(this._opacityStart, this._opacityEnd, t);
    }
}
