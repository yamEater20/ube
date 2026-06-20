export class ICollisionHandler {
    onCollide(physObj, others, direction) {
        throw new Error("Must implement");
    }
}