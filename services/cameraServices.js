import { IScreenShakeOffsetProvider } from "../engine/camera.js";
import { VectorZero, Vector } from "../engine/math.js";
import { Timer } from "../engine/time.js";

const SCREEN_SHAKES = [
	Vector({x: 0, y: 0}),
	Vector({x: -1, y: -1}),
	Vector({x: -1, y: -1}),
	Vector({x: 0, y: -1}),
	Vector({x: 0, y: -1}),
	Vector({x: 1, y: 0}),
	Vector({x: 1, y: 0}),
	Vector({x: 0, y: 0}),
	Vector({x: 0, y: 0}),
];

export class DummyScreenShakeOffsetProvider extends IScreenShakeOffsetProvider {
    getOffset() {
        return VectorZero;
    }
}

export class ScreenShakeOffsetProvider extends IScreenShakeOffsetProvider {
    constructor() {
        super();
        this._strength = 0;
        this._shakeTimer = new Timer();
        this._screenShakePos = Vector({x: 0, y: 0});
        this.shakeScreen = this.shakeScreen.bind(this);
        this.isShaking = this.isShaking.bind(this);
    }

    shakeScreen(strength = 1, duration = 250) {
        if (this._shakeTimer.running())
            this._strength = Math.max(this._strength, strength);
        else
            this._strength = strength;
        this._shakeTimer.restart(duration);
    }

    isShaking() {
        return this._shakeTimer.running();
    }

    cancelScreenShake() {
        this._shakeTimer.stop();
    }

    update(timeDelta) {
        this._shakeTimer.update(timeDelta);

        if (this._shakeTimer.finished()) {
            this._screenShakePos = VectorZero;
        } else {
            const index = this._shakeTimer.framesRemaining() % SCREEN_SHAKES.length;
            this._screenShakePos = SCREEN_SHAKES[index].scalar(this._strength);
        }
    }

    getOffset() {
        return this._screenShakePos;
    }
}