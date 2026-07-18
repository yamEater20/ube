export class IPositionProvider {
    update(timeDelta) {throw new Error("Must implement");}
    getPosition() {throw new Error("Must implement");}
    getSubpixels() {throw new Error("Must implement");}
}

export class StaticPositionProvider extends IPositionProvider {
    constructor(position) {
        super();
        this._position = position;
    }

    update(timeDelta) {}

    getPosition() {return this._position;}
}