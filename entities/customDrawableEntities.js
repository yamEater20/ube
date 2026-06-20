export class OpacityDrawableDecorator {
    constructor(drawable, opacityStart, opacityEnd, fadeTime) {
        this._drawable = drawable;
        this._opacityStart = opacityStart;
        this._opacityEnd = opacityEnd;
        this._fadeTime = fadeTime;

        this._time = 0;
        this._currentOpacity = opacityStart;
    }

    draw(x, y, camera) {
        camera.drawWithOpacity(
            () => this._drawable.draw(x, y, camera),
            this._currentOpacity
        );
    }

    update(timeDelta) {
        this._time += timeDelta;
        const t = this._time / this._fadeTime;
        this._currentOpacity = lerp(this._opacityStart, this._opacityEnd, t);
    }
}

export class RectDrawable {
    constructor(color) {
        this._color = color;
    }

    draw(x, y, camera) {
        camera.drawRect(x, y, 1, 1, this._color);
    }
}
