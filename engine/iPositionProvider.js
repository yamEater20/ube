export class IPositionProvider {
    update(timeDelta) {throw new Error("Must implement");}
    getPosition() {throw new Error("Must implement");}
    getSubpixels() {throw new Error("Must implement");}
}