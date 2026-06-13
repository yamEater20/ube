import { Entity } from "./entity.js";

class DrawableEntity extends Entity {
	constructor(parent, drawable, relativePositon) {
		super(parent, relativePositon);
		this.drawable = drawable;
	}

	draw(camera) {
		const pos = this.globalPosition().trunc();
		this.drawable.draw(
			pos.x,
			pos.y,
			camera
		);
	}
}

class UpdatableDrawableEntity extends DrawableEntity {
	constructor(parent, drawable, relativePosition) {
		super(parent, drawable, relativePosition);
	}

	update(timeDelta) {
		this.drawable.update(timeDelta);
	}
}

export {
    DrawableEntity,
    UpdatableDrawableEntity
}