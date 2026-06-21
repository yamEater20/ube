import { Vector, VectorZero } from "../engine/math.js";
import { HitboxDrawableEntity, PhysObj, RectHitbox } from "../engine/physics.js";
import { DrawableEntity } from "../engine/drawableEntity.js";
import { POOL_TYPES } from "./poolTypes.js";
import { Composite, FallAirResistanceUpdateHandler, FallUpdateHandler } from "../services/customUpdateHandlers.js";
import * as CollisionHandlers from "../services/customCollisionHandlers.js";
import { GroundReaction, WallReaction } from "../services/entityCollisionHandlers.js";
import { Timer } from "../engine/time.js";
import { OpacityDrawableDecorator, RectDrawable } from "../services/customDrawables.js";

class ResetParticle {
    constructor(onFinished) {
        this._onFinished = onFinished;
    }

    reset() {
        this._onFinished();
    }
}

export function makeParticle(parent, relativePosition, collidableProvider, groundedProvider) {
    const hitbox = new RectHitbox(VectorZero, 1, 1);
    
    const p = new PhysObj(
        parent,
        relativePosition,
        hitbox,
        new Composite([
            new FallAirResistanceUpdateHandler(
                new FallUpdateHandler(groundedProvider),
                0.0001,
                0.9
            )
        ]),
        new CollisionHandlers.Composite(
            [],
            [
                new GroundReaction(groundedProvider),
                new WallReaction()
            ]
        ),
        collidableProvider
    );

    const rectDrawable = new RectDrawable();
    const opacityDrawable = new OpacityDrawableDecorator(rectDrawable);
    const drawableEntity = new DrawableEntity(p, opacityDrawable);

    const disableTimer = new Timer();

    const debugDrawable = new HitboxDrawableEntity(p, hitbox, "#00ff00");

    const ret = {};
    ret[POOL_TYPES.UPDATEABLE] = [p, opacityDrawable, disableTimer];
    ret[POOL_TYPES.DRAWABLE_DEBUG] = [debugDrawable];
    ret[POOL_TYPES.DRAWABLE] = [drawableEntity];
    return {
        typedData: {
            physObj: p,
            rectDrawable: rectDrawable,
            opacityDrawable: opacityDrawable,
            disableTimer: disableTimer
        },
        registrationData: ret
    };
}