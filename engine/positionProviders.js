import { IPositionProvider } from "./iPositionProvider.js";

export class Truncated extends IPositionProvider {
    constructor(basePositionProvider) {
        super();
        this._basePositionProvider = basePositionProvider;
    }

    getPosition() {
        return this._getPositionUnTruncated().trunc();
    }

    _getPositionUnTruncated() {
        return this._basePositionProvider.getPosition();
    }

    getSubPixels() {
        const truncPosition = this.getPosition();
        const floatPosition = this._getPositionUnTruncated();
        return floatPosition.subtract(truncPosition);
    }
}

export class WithDepth extends IPositionProvider {
    constructor(basePositionProvider, depth) {
        super();
        this._basePositionProvider = basePositionProvider;
        this.depth = depth;
    }

    getPosition() {
        return this._basePositionProvider.getPosition().scalar(this.depth);
    }
}

export class SmoothFollow extends IPositionProvider {
    constructor(initialPosition, followablePositionProvider) {
        super();
        this._position = initialPosition ?? Vector({x: 0, y: 0});
        this._followablePositionProvider = followablePositionProvider;

        this.isMoving = false;
    }

    getPosition() {
        return this._position;
    }

    update(timeDelta) {
        
        const pos = this._followablePositionProvider.getPosition();
        this._moveToTarget(timeDelta, pos);
    }

    _moveToTarget(timeDelta, targetPosition) {
		var v = targetPosition.addPoint(this._position.scalar(-1));
		const mag = v.magnitude();
        if (mag < 1) {
            this._position = targetPosition;
			if (mag < 0.1) this.isMoving = false;
            return;
		}

        this.isMoving = true;

		const speed = Math.min(6, mag / 3) * 0.04;
		v = v.scalar(speed / mag * timeDelta);
		this._position = this._position.addPoint(v);
    }
}