import { IPositionProvider } from "../engine/iPositionProvider.js";
import { VectorZero, Vector, VectorLeft, VectorUp, VectorRight, VectorDown, lerpVector, framesToMs } from "../engine/math.js";
import { msToFrames, Timer } from "../engine/time.js";
import { POOL_TYPES } from "../entities/poolTypes.js";

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

export class ScreenShakePositionProvider extends IPositionProvider {
    constructor(basePositionProvider) {
        super();
        this._basePositionProvider = basePositionProvider;
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
        this._screenShakePos = VectorZero;
    }

    update(timeDelta) {
        this._shakeTimer.update(timeDelta);

        if (this._shakeTimer.finished()) {
            this._screenShakePos = VectorZero;
        } else {
            const currentFrame = this._shakeTimer.framesRemaining();
            const index = currentFrame % SCREEN_SHAKES.length;
            const nextIndex = (currentFrame + 1) % SCREEN_SHAKES.length;

            const curScreenShakePos = SCREEN_SHAKES[index];
            const nextScreenShakePos = SCREEN_SHAKES[nextIndex];

            const lerpTime = (this._shakeTimer._durationMs - framesToMs(currentFrame)) / framesToMs(1);
            this._screenShakePos = lerpVector(curScreenShakePos, nextScreenShakePos, lerpTime).scalar(this._strength);
        }
    }

    getPosition() {
        return this._basePositionProvider.getPosition().addPoint(this._screenShakePos);
    }
}

export class OnCameraMovePushPlayer {
    constructor(playerPhysObj, mainCamera, movingPositionProvider) {
        this._playerPhysObj = playerPhysObj;
        this._mainCamera = mainCamera;
        this._movingPositionProvider = movingPositionProvider;
    }

    //Technically antipattern - should have a mainCameraProvider.
    isMoving() {
        return this._movingPositionProvider.isMoving;
    }

    update(timeDelta) {
        const isMoving = this._movingPositionProvider.isMoving;
        if (isMoving) {
            this.onCameraMove(this._mainCamera);
        }
    }
    
    onCameraMove(camera) {
        const cameraPos = camera.getPosition();
        
        const playerPhysObj = this._playerPhysObj;
        const playerPos = playerPhysObj.globalPosition();

        const playerWidth = playerPhysObj.hitbox.width;
        const playerHeight = playerPhysObj.hitbox.height;

        const playerExtents = playerPos.add(playerWidth, playerHeight);
        const cameraExtents = cameraPos.addPoint(camera.extents);

        let movingHorizontally = false;

        if (playerExtents.x > cameraExtents.x) {
            playerPhysObj.moveDirection(-1, VectorLeft);
            movingHorizontally = true;
        } else if (playerExtents.y > cameraExtents.y) {
            playerPhysObj.moveDirection(-1, VectorUp);
            playerPhysObj.setYVelocity(Math.min(playerPhysObj.getYVelocity(), -0.13));
        } else if (cameraPos.x > playerPos.x) {
            playerPhysObj.moveDirection(1, VectorRight);
            movingHorizontally = true;
        } else if (cameraPos.y > playerPos.y) {
            playerPhysObj.moveDirection(1, VectorDown);
        }

        if (movingHorizontally && Math.abs(playerPhysObj.getXVelocity()) < 0.13) {
            playerPhysObj.setXVelocity(0);
        }
    }
}

export class SnapToRoomPositionProvider extends IPositionProvider {
    constructor(registrarWithRooms) {
        super();
        this._registrarWithRooms = registrarWithRooms;
    }

    getPosition() {
        return this._registrarWithRooms
            .getPool(POOL_TYPES.CAMERA_FOLLOW)
            .get()[0]
            .globalPosition();
    }
}