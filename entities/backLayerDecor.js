import { DrawableEntity } from "../engine/drawableEntity.js";
import { POOL_TYPES } from "../pools.js";
import * as Sprites from "../engine/sprites.js";

export function makeBackLayerDecor(parent, relativePosition, entityData) {
	const spriteArray = entityData.spriteArray;
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