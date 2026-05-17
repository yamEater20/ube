export class InputProvider {
    constructor() {
        this.keyCodes = {
            "ArrowRight": false,
            "ArrowLeft": false,
            "ArrowDown": false,
            "ArrowUp": false,
            "KeyZ": false,
            "KeyX": false,
            "PrevJump": false,
            "PrevSlide": false,
        
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
        };

        document.addEventListener('keydown', this.keyDownHandler, false);
        document.addEventListener('keyup', this.keyUpHandler, false);
    }

    keyDownHandler(event) {
        if (event.code in this.keyCodes) {
            this.keyCodes[event.code] = true;
        }
    }
    
    keyUpHandler(event) {
        if (event.code in this.keyCodes) {
            this.keyCodes[event.code] = false;
        }
    }
    
    getInput() {
        return {
            "moveRight": this.keys.ArrowRight || this.keys.KeyD,
            "moveLeft": this.keys.ArrowLeft || this.keys.KeyA,
        }
    }
}