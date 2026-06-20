import { Vector, VectorZero } from "../engine/math.js";
import { DummyCollidableProvider, DummyCollisionHandler, DummyUpdateHandler, HitboxDrawableEntity, PhysObj, RectHitbox } from "../engine/physics.js";
import { DrawableEntity } from "../engine/drawableEntity.js";
import { RectDrawable } from "./customDrawableEntities.js";
import { POOL_TYPES } from "./poolTypes.js";
import { Composite, FallAirResistanceUpdateHandler, FallUpdateHandler } from "./customUpdateHandlers.js";
import * as CollisionHandlers from "../services/customCollisionHandlers.js";
import { GroundReaction, WallReaction } from "./entityCollisionHandlers.js";

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

    const drawableEntity = new DrawableEntity(p, new RectDrawable("#00ff00"));

    const ret = {};
    ret[POOL_TYPES.UPDATEABLE] = [p];
    ret[POOL_TYPES.DRAWABLE_DEBUG] = [new HitboxDrawableEntity(p, hitbox, "#00ff00")];
    ret[POOL_TYPES.DRAWABLE] = [drawableEntity];
    return {
        typedData: {
            physObj: p,
            drawable: drawableEntity,
            drawableDebug: new HitboxDrawableEntity(p, hitbox, "#00ff00")
        },
        registrationData: ret
    };
}