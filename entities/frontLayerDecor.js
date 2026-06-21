import { DrawableEntity } from "../engine/drawableEntity.js";
import { POOL_TYPES } from "./poolTypes.js";
import * as Sprites from "../engine/sprites.js";

export function makeFrontLayerDecor(parent, relativePosition, entityData) {
	const spriteArrayName = entityData.spriteArrayName;
	const spriteArray = Sprites.SPRITE_LK[spriteArrayName];
    const ind = Math.floor(Math.random()*spriteArray.length);
    const drawableEntity = new DrawableEntity(
		parent,
		new Sprites.Sprite(spriteArray[ind]),
        relativePosition
	);
	const ret = {};
	ret[POOL_TYPES.DRAWABLE] = [drawableEntity];

	return ret;
}