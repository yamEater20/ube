import { DrawableEntity, UpdatableDrawableEntity } from "../engine/drawableEntity.js";
import { POOL_TYPES } from "./poolTypes.js";
import * as Sprites from "../engine/sprites.js";
import { Entity } from "../engine/entity.js";
import { Vector, VectorRight, VectorZero } from "../engine/math.js";

const FLOAT_SPEED = 0.002;
const FLOAT_AMPLITUDE = 4;

const LIGHT_FLICKER_SPEED = 0.001;
const LIGHT_FLICKER_AMPLITUDE = 2;

class Torch extends Entity {
    constructor(parent, relativePosition) {
        super(parent, relativePosition);
        this._originalRelativePosition = relativePosition;
        this._time = 0;

        this.offset = this._originalRelativePosition.x * 3;
    }
    
    update(timeDelta) {
        // this._time += timeDelta;
        // const x = this._originalRelativePosition.x;
        // const y = Math.sin(this.offset + this._time * FLOAT_SPEED) * FLOAT_AMPLITUDE + this._originalRelativePosition.y;
        // this.relativePosition = Vector({x: x, y: y});
    }

    getRadius() {
        return 8 + Math.sin(this.offset*1.5 + this._time * LIGHT_FLICKER_SPEED) * LIGHT_FLICKER_AMPLITUDE;
    }

    reset() {}
}

class TorchLightDrawable {
    constructor(radiusProvider) {
        this._radiusProvider = radiusProvider;
    }

	draw(x, y, camera) {
        const radius = this._radiusProvider.getRadius();
        camera.getRenderTarget().drawEllipse(x, y, radius, "#29adff40", "#29adff00");
        camera.getRenderTarget().drawEllipse(x, y, radius + 4, "#29adff30", "#29adff00");
    }
}

export function makeTorch(parent, relativePosition, entityData) {
    const torch = new Torch(parent, relativePosition.addPoint(entityData.offset));

    const flameSprite = new Sprites.AnimatedSprite(
        Sprites.SPRITE_LK.FLAME_SPRITESHEET,
        [
            {frames: 4, onComplete: "loop", nth: 8},
        ],
        null,
        8, 8
    );

    const handleEntity = new DrawableEntity(
        torch,
        new Sprites.Sprite(
            Sprites.SPRITE_LK.TORCH_IMG,
        ),
        Vector({x: 0, y: 6})
    );

    const lightEntity = new DrawableEntity(
        torch,
        new TorchLightDrawable(torch),
        Vector({x: 4, y: 4})
    )

    flameSprite.playing = true; //start playing automatically
    
    const flameEntity = new UpdatableDrawableEntity(torch, flameSprite, VectorZero);
	const ret = {};
	ret[POOL_TYPES.DRAWABLE] = [
        {item: handleEntity, layer: 1},
        {item: flameEntity, layer: 1},
        {item: lightEntity, layer: 1},
    ];
    ret[POOL_TYPES.UPDATEABLE] = [torch, flameEntity];
    ret[POOL_TYPES.RESETTABLE] = [torch];

	return ret;
}