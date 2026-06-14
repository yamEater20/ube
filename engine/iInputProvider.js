export class IInputProvider {
    update(timeDelta) {
        throw new Error("Must implement");
    }
    getInput() {
        throw new Error("Must implement");
    }
}