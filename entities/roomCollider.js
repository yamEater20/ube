import { RoomCollider } from "../customCollisionHandlers.js";
import {TagOnly} from "../engine/collisionHandlers.js";
import { VectorZero } from "../engine/math.js";
import { DummyCollidableProvider, DummyUpdateHandler, HitboxDrawableEntity, PhysObj, RectHitbox } from "../engine/physics.js";
import { POOL_TYPES } from "../pools.js";

export function makeRoomCollider(room, roomIndex, colliderSize) {
    const hitbox = new RectHitbox(VectorZero, colliderSize.x, colliderSize.x)
    const physObj = new PhysObj(
        room,
        VectorZero,
        hitbox,
        new DummyUpdateHandler(),
        new TagOnly([new RoomCollider(roomIndex)]),
        new DummyCollidableProvider()
    );

    const ret = {};
    ret[POOL_TYPES.DRAWABLE_DEBUG] = [new HitboxDrawableEntity(room, hitbox, "#558fc930")];
    ret[POOL_TYPES.COLLIDABLE] = [physObj];

    return ret;
}