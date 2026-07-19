import {Vector} from './math.js';
import {PIXEL_GAME_SIZE} from './graphics.js';
import { DummyRenderTarget } from './renderTarget.js';

export class DummyCamera {
    getRenderTarget() {return new DummyRenderTarget();}

    getPosition() {return Vector({x: 0, y: 0});}

    shakeScreen(strength = 1, duration = 250) {}

    update(timeDelta) {}
}

export class Camera {
    constructor(renderTarget, positionProvider) {
        this._renderTarget = renderTarget;
        this.scale = 1;

        this._positionProvider = positionProvider;

        this.extents = PIXEL_GAME_SIZE;
    }

    getPosition() {
        return this._positionProvider
            .getPosition()
            .add(-this.extents.x/2, -this.extents.y/2);
    }

    _getScreenShakeOffset() {
        return this._screenShakeOffsetProvider.getOffset();
    }

    // getPosition() {
    //     return this._getPositionUnTruncated().trunc().scalar(-1);
    // }

    getRenderTarget() {return this._renderTarget;}

    update(timeDelta) {
        const myPosition = this.getPosition();

        //TODO: This is a code smell. Reset Transform doesn''t belong on a render target.
        //I think the correct way to do this is to remove the renderTarget abstraction
        //And have a bunch of pure functions that drawRect, drawImage, drawEllipse, etc.
        this._renderTarget.reset(myPosition.scalar(-1), this.scale);
    }
}