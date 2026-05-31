import { RoomCollider, TAG_IDS, TagOnly } from "../collisionHandlers.js";
import { VectorZero } from "../engine/math.js";
import { DummyCollidableProvider, DummyUpdateHandler, PhysObj, RectHitbox } from "../engine/physics.js";
import { POOL_TYPES } from "../pools.js";

export function makeRoomCollider(room, colliderSize) {
    const hitbox = new RectHitbox(room, VectorZero, colliderSize.x, colliderSize.x, "#558fc930")
    const physObj = new PhysObj(
        hitbox,
        new DummyUpdateHandler(),
        new TagOnly([new RoomCollider]),
        new DummyCollidableProvider()
    );

    const ret = {};
    ret[POOL_TYPES.DRAWABLE_DEBUG] = [hitbox];
    ret[POOL_TYPES.COLLIDABLE] = [physObj];

    return ret;
}