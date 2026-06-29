export class ICollisionHandler {
    onCollide(physObj, others, direction) {
        throw new Error("Must implement");
    }
}

export class ICollidable {
    //What should go in here? Nothing?
}