import { VectorZero } from "../engine/math.js";
import { Entity } from "../engine/entity.js";
import { POOL_TYPES } from "./poolTypes.js";
import { toggleDebugAll, debugOptions } from "../engine/debug.js";

export class Root extends Entity {
	constructor(trueTime, worldTime, camera, inputProvider, registrar) {
		super();
        this._trueTime = trueTime;
		this._worldTime = worldTime;
		this._camera = camera;
		this._inputProvider = inputProvider;
		this._registrar = registrar;

		this._worldPaused = false;

		this._shouldReset = false;
	}

	globalPosition() {
		return VectorZero;
	}

	draw() {
		this._registrar.getPool(POOL_TYPES.DRAWABLE).foreach(item => item.draw(this._camera));
		if (debugOptions.showHitboxes) this._registrar.getPool(POOL_TYPES.DRAWABLE_DEBUG).foreach(item => item.draw(this._camera));
	}

	update() {
		this._trueTime.tick();
		this._worldTime.tick();

		this._inputProvider.update();

		const input = this._inputProvider.getInput();

		//Debug only
		if (input.debugPressed) toggleDebugAll();
		if (input.noClipPressed) debugOptions.noClip = !debugOptions.noClip;
		if (input.debugHitboxesPressed) debugOptions.showHitboxes = !debugOptions.showHitboxes;
		// if (input.nextRoomPressed) this._registrar.getRoomsPool().nextRoom();
		if (input.showAllPressed) debugOptions.showAll = !debugOptions.showAll;
		
		this._camera.update(this._trueTime.delta);

		if (this._camera.isMoving) {
			//Do not update world time on room Transition
			this.onCameraMove(this._camera);
		} else {
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