export class IPositionProvider {
    getPosition() {throw new Error("Must implement");}
    getSubpixels() {throw new Error("Must implement");}
}

export class StaticPositionProvider extends IPositionProvider {
    constructor(position) {
        super();
        this._position = position;
    }

    getPosition() {return this._position;}
}