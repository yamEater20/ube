export class InputProvider {
    constructor() {
        this._keyCodes = {
            "ArrowRight": false,
            "ArrowLeft": false,
            "ArrowDown": false,
            "ArrowUp": false,
            "KeyZ": false,
            "KeyX": false,
        
            // //Debug keys
            "KeyO": false, //fly
            "KeyH": false, //jump
            "KeyJ": false,
            "KeyK": false,
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

        this._input = {
            "jump": false,
        }

        this._prevInput = structuredClone(this._input);

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

    update() {
        this._prevInput = this._input;

        this._input = {
            "moveRight": this._keyCodes.ArrowRight || this._keyCodes.KeyD,
            "moveLeft": this._keyCodes.ArrowLeft || this._keyCodes.KeyA,

            "jump": this._keyCodes.KeyZ || this._keyCodes.KeyW || this._keyCodes.Space
        };

        this._input.jumpPressed = this._input.jump && !this._prevInput.jump;
    }
    
    getInput() {
        return this._input;
    }
}

export class TASInputProvider {
    constructor() {this.frame = 0;}
    update() {
        this.frame = (this.frame+1) % 30;
        console.log(this.frame);
    }
    keyDownHandler(event) {}
    keyUpHandler(event) {}

    getInput() {
        return {
            "moveRight": this.frame < 15,
            "moveLeft": this.frame >= 15,
            "jump": false,
            "jumpPressed": false
        };;
    }
}