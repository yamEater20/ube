import { PIXEL_GAME_SIZE } from "./graphics.js";
import { IPositionProvider } from "./iPositionProvider.js";

export class CameraFollowingPositionProvider extends IPositionProvider {
    constructor(initialPosition, followablePositionProvider, depth) {
        super();
        this._position = initialPosition ?? Vector({x: 0, y: 0});
        this._followablePositionProvider = followablePositionProvider;
        this.depth = depth;

        this.isMoving = false;
    }

    getPosition() {
        return this._position.scalar(this.depth).trunc();
    }

    update(timeDelta) {
        const pos = this._followablePositionProvider.getPosition();
        this._moveToTarget(timeDelta, pos);
    }

    getSubPixels() {
        const truncPosition = this.getPosition();
        const floatPosition = this._getPositionUnTruncated();
        return floatPosition.subtract(truncPosition);
    }

    _getPositionUnTruncated() {
        return this._position.scalar(this.depth);
    }

    _moveToTarget(timeDelta, targetPosition) {
		var v = targetPosition.addPoint(this._position.scalar(-1));
		const mag = v.magnitude();
        if (mag < 0.5) {
            this._position = targetPosition;
			if (mag < 0.01) this.isMoving = false;
            return;
		}

        this.isMoving = true;

		const speed = Math.min(6, mag / 3) * 0.04;
		v = v.scalar(speed / mag * timeDelta);
		this._position = this._position.addPoint(v);
    }
}