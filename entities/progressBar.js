import { DrawableEntity } from "../engine/drawableEntity.js";
import { Vector, VectorZero } from "../engine/math.js";
import { RectDrawable } from "../services/customDrawables.js";
import { POOL_TYPES } from "./poolTypes.js";

export function createProgressBar(parent, relativePosition, percentCallbackFunction, mainCam) {
    const maxSize = Vector({x: 128-6, y: 6});
    const drawable = new RectDrawable(maxSize);

    const drawableEntity = new DrawableEntity(
        parent,
        drawable,
        relativePosition
    );

    const updater = new ProgressBarUpdater(drawable, maxSize.x, percentCallbackFunction, mainCam, drawableEntity);
    
    const ret = {};
    ret[POOL_TYPES.UPDATEABLE] = [updater];
    ret[POOL_TYPES.DRAWABLE] = [{item: drawableEntity, layer: 10}];
    return ret;
}

class ProgressBarUpdater {
    constructor(rectDrawable, maxSize, percentCallbackFunction, cam, de) {
        this._rectDrawable = rectDrawable;
        this._maxSize = maxSize;
        this._percentCallbackFunction = percentCallbackFunction;
        
        this._cam = cam;
        this._de = de;
    }

    update(timeDelta) {
        const percent = this._percentCallbackFunction();
        this.setPercent(percent);
        this._de.relativePosition = this._cam.getPosition().scalar(-1).add(3, 3);
    }

    setPercent(percent) {
        const currentWidth = this._maxSize * percent;
        this._rectDrawable.size.x = Math.floor(currentWidth);
    }
}