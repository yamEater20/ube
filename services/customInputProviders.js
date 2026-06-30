import { IInputProvider } from "../engine/iInputProvider.js";
import { framesToMs } from "../engine/math.js";
import { Timer } from "../engine/time.js";

class InputBuffer {
    constructor(durationMs) {
        this._timer = new Timer(durationMs);
    }

    update(timeDelta, mePressed) {
        this._timer.update(timeDelta);
        if (mePressed) this._timer.restart();
    }

    stop() {this._timer.stop();}

    inBuffer() {return this._timer.running();}
}

export class InputProvider extends IInputProvider {
    constructor() {
        super();
        this._keyCodes = {
            "ArrowRight": false,
            "ArrowLeft": false,
            "ArrowDown": false,
            "ArrowUp": false,
            "KeyZ": false,
            "KeyX": false,
            "KeyV": false,
        
            // //Debug keys
            "KeyO": false, //all debug
            "KeyH": false, //show hitboxes
            "KeyJ": false, //fly
            "KeyK": false, //show all
            "KeyL": false,
            "KeyI": false,
        
        
            // "KeyP" : false,
            "KeyC": false,
            "KeyR": false,
            "Enter": false,
        
            "KeyW": false,
            "KeyA": false,
            "KeyS": false,
            "KeyD": false,
            "KeyN": false,
            "KeyM": false,

            "Space": false,
        };

        this._input = {};

        this._prevInput = structuredClone(this._input);

        this._pressCodes = [
            "jump",
            "slide",
            "pause",
            "reset",
            
            "debug",
            "debugHitboxes",
            "noClip",
            "showAll",
            "nextRoom"
        ];

        this._pressBuffers = Object.fromEntries(
            this._pressCodes.map(
                actionName => [actionName, new InputBuffer(framesToMs(8))]
            )
        );

        document.addEventListener('keydown', this.keyDownHandler.bind(this), false);
        document.addEventListener('keyup', this.keyUpHandler.bind(this), false);
    }

    keyDownHandler(event) {
        if (event.code in this._keyCodes) {
            this._keyCodes[event.code] = true;
        }
    }
    
    keyUpHandler(event) {
        if (event.code in this._keyCodes) {
            this._keyCodes[event.code] = false;
        }
    }

    update(timeDelta) {
        this._prevInput = this._input;

        this._input = {
            "moveRight": this._keyCodes.ArrowRight || this._keyCodes.KeyD,
            "moveLeft": this._keyCodes.ArrowLeft || this._keyCodes.KeyA,

            "moveUp": this._keyCodes.ArrowUp || this._keyCodes.KeyW,
            "moveDown": this._keyCodes.ArrowDown || this._keyCodes.KeyS,

            "jump": this._keyCodes.KeyZ || this._keyCodes.KeyW || this._keyCodes.Space,
            "slide": this._keyCodes.KeyX || this._keyCodes.KeyS,

            "pause": this._keyCodes.KeyV,
            "reset": this._keyCodes.KeyR,

            "debug": this._keyCodes.KeyO,
            "noClip": this._keyCodes.KeyJ,
            "showAll": this._keyCodes.KeyK,
            "nextRoom": this._keyCodes.KeyI,
            "debugHitboxes": this._keyCodes.KeyH
        };

        this._pressCodes.forEach(
            k => setPressed(this._input, this._prevInput, k)
        );

        Object.keys(this._pressBuffers)
            .forEach(
                actionName => {
                    const curBuffer = this._pressBuffers[actionName];
                    curBuffer.update(timeDelta, this._input[actionName + "Pressed"]);
                    this._input[actionName+"Buffer"] = curBuffer;
                }
            );
    }
    
    getInput() {
        return this._input;
    }
}

function setPressed(input, prevInput, name) {
    input[name + "Pressed"] = input[name] && !prevInput[name];
}

export class TASInputProvider extends IInputProvider {
    constructor() {
        super();
        this.time = 0;
        this.movingLeft = true;
    }

    update(timeDelta) {
        this.time += timeDelta;
        
        if (Math.random() > 0.999) {
            this.movingLeft = !this.movingLeft;
        }
    }
    keyDownHandler(event) {}
    keyUpHandler(event) {}

    getInput() {
        return {
            "moveRight": !this.movingLeft,
            "moveLeft": this.movingLeft,
            "jump": false,
            "jumpPressed": Math.random() > 0.95,
        };;
    }
}