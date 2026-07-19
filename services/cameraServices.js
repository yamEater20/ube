import { IPositionProvider } from "../engine/iPositionProvider.js";
import { VectorZero, Vector, VectorLeft, VectorUp, VectorRight, VectorDown } from "../engine/math.js";
import { Timer } from "../engine/time.js";
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

export class DummyScreenShakeOffsetProvider extends IPositionProvider {
    getPosition() {
        return VectorZero;
    }

    update(timeDelta) {}
}

export class ScreenShakeOffsetProvider extends IPositionProvider {
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
        this._screenShakePos = VectorZero;
    }

    update(timeDelta) {
        this._shakeTimer.update(timeDelta);

        if (this._shakeTimer.finished()) {
            this._screenShakePos = VectorZero;
        } else {
            //Lerp between
            const index = this._shakeTimer.framesRemaining() % SCREEN_SHAKES.length;
            this._screenShakePos = SCREEN_SHAKES[index].scalar(this._strength);
        }
    }

    getPosition() {
        return this._screenShakePos;
    }
}

export class OnCameraMovePushPlayer {
    constructor(playerPhysObj, mainCamera, mainCameraPositionProvider) {
        this._playerPhysObj = playerPhysObj;
        this._mainCamera = mainCamera;
        this._mainCameraPositionProvider = mainCameraPositionProvider;
    }

    //Technically antipattern - should have a mainCameraProvider.
    isMoving() {
        return this._mainCameraPositionProvider.isMoving;
    }

    update(timeDelta) {
        const isMoving = this._mainCameraPositionProvider.isMoving;
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

    update(timeDelta) {}
}