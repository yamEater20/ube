import { Vector, VectorZero } from "../engine/math.js";
import { Entity } from "../engine/entity.js";
import { POOL_TYPES } from "./poolTypes.js";
import { toggleDebugAll, debugOptions } from "../engine/debug.js";
import { DrawableEntity } from "../engine/drawableEntity.js";
import { Sprite, SPRITE_LK } from "../engine/sprites.js";

export class Root extends Entity {
	constructor(trueTime, worldTime, worldCameras, inputProvider, registrar, a, b) {
		super();
        this._trueTime = trueTime;
		this._worldTime = worldTime;
		this._worldCameras = worldCameras;
		this._inputProvider = inputProvider;
		this._registrar = registrar;

		this._worldPaused = false;

		this._shouldReset = false;

		this._midgroundEntity = new DrawableEntity(
			this,
			new Sprite(SPRITE_LK.BG_LAYERS_IMGS[1]),
			Vector({x: 0, y: 0})
		);

		this._midgroundEntity2 = new DrawableEntity(
			this,
			new Sprite(SPRITE_LK.BG_LAYERS_IMGS[2]),
			Vector({x: 0, y: 0})
		);

		this.staticCam = [];

		this.onCameraMove;
		this._a = a;
		this._b = b;
	}

	_getMainLayerCamera() {
		return this._worldCameras[2];
	}

	globalPosition() {
		return VectorZero;
	}

	draw() {
		const mainCamera = this._getMainLayerCamera();
		this._registrar.getPool(POOL_TYPES.DRAWABLE).foreach(item => item.draw(mainCamera));

		this._midgroundEntity.draw(this._worldCameras[0]);
		this._midgroundEntity2.draw(this._worldCameras[1]);

		if (debugOptions.showHitboxes) this._registrar.getPool(POOL_TYPES.DRAWABLE_DEBUG).foreach(item => item.draw(mainCamera));
	}

	update() {
		this._trueTime.tick();
		this._worldTime.tick();

		this._inputProvider.update(this._trueTime.delta);

		const input = this._inputProvider.getInput();

		//Debug only
		if (input.debugPressed) toggleDebugAll();
		if (input.noClipPressed) debugOptions.noClip = !debugOptions.noClip;
		if (input.debugHitboxesPressed) debugOptions.showHitboxes = !debugOptions.showHitboxes;
		// if (input.nextRoomPressed) this._registrar.getRoomsPool().nextRoom();
		if (input.showAllPressed) debugOptions.showAll = !debugOptions.showAll;

		this._a.update(this._worldTime.delta);
		this._b.update(this._worldTime.delta);
		this._worldCameras.forEach(c => c.update(this._trueTime.delta));

		//TODO: fix
		
		this.onCameraMove.update();
		const isMainCameraMoving = this.onCameraMove.isMoving();

		if (!isMainCameraMoving) {
			if (input.pausePressed) this._worldPaused = !this._worldPaused;

			if (!this._worldPaused)
			{
				if (input.resetPressed) this.queueReset();
				this._registrar.getPool(POOL_TYPES.UPDATEABLE).foreach(item => item.update(this._worldTime.delta));
			}	
		}

		if (this._shouldReset) {
			this._registrar.getPool(POOL_TYPES.RESETTABLE).foreach(r => r.reset());
			this._shouldReset = false;
		}
	}

	queueReset() {
		this._shouldReset = true;
	}
}