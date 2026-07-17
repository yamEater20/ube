import { IPositionProvider } from "./iPositionProvider";

class CameraFollowingPositionProvider extends IPositionProvider {
    constructor(initialPosition, getFollowingFunc, depth) {
        this._position = initialPosition ?? Vector({x: 0, y: 0});
        this._getFollowingFunc;

        this.isMoving = false;
    }

    getPosition() {
        return this._position;
    }

    update(timeDelta) {

    }

    getSubPixels() {
        if (this.scale != 1) throw new Error("Not implemented");

        const truncPosition = this.getPosition();
        const floatPosition = this._getPositionUnTruncated();
        return floatPosition.addPoint(truncPosition);
    }

    // _getPositionUnTruncated() {
    //     return this._position.addPoint(this._getScreenShakeOffset()).scalar(this.depth);
    // }

    _moveToTarget(timeDelta, targetPosition) {
		var v = targetPosition.addPoint(this._position.scalar(-1));
		const mag = v.magnitude();
        //TODO: try 0.5
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