const Vector = ({x, y}) => ({
	x, y,
	incrPoint(p) {
		this.x += p.x;
		this.y += p.y;
	},
	add(x, y) {
		return Vector({x: this.x + x, y: this.y + y})
	},
	addPoint(p) {
		return Vector({x: this.x + p.x, y: this.y + p.y});
	},
	subtract(p) {
		return Vector({x: this.x - p.x, y: this.y - p.y});
	},
	scalarX(scalar) {
		return (Vector({x: this.x * scalar, y: this.y}));
	},
	// scalarY(scalar) {return(Vector({x: this.x, y:this.y*scalar}));},
	scalar(s) {
		return (Vector({x: this.x * s, y: this.y * s}));
	},
	magnitude() {
		return Math.sqrt(this.x ** 2 + this.y ** 2);
	},
	trunc() {
		return Vector({x: Math.trunc(this.x), y: Math.trunc(this.y)});
	},
	sign() {
		return Vector({x: Math.sign(this.x), y: Math.sign(this.y)});
	}
});

const VectorUp = Vector({x: 0, y: -1});
const VectorRight = Vector({x: 1, y: 0});
const VectorDown = Vector({x: 0, y: 1});
const VectorLeft = Vector({x: -1, y: 0});
const VectorZero = Vector({x: 0, y: 0});

function vToRad(v) {
	switch (v) {
		case VectorUp:
			return 0;
		case VectorDown:
			return Math.PI;
		case VectorLeft:
			return Math.PI * 1.5;
		case VectorRight:
			return Math.PI / 2;
		default:
			return null;
	}
}

function numToVec(num) {
	switch (num) {
		case 0:
			return VectorUp;
		case 1:
			return VectorRight;
		case 2:
			return VectorDown;
		case 3:
			return VectorLeft;
	}
	return null;
}

const Direction = Object.freeze({
    NORTH:   0,
    EAST:  1,
    SOUTH: 2,
    WEST: 3,
    NULL: -1
});

function framesToMs(f) {return f / 60 * 1000;}

function shuffle(array) {
	array = array.slice();
	let currentIndex = array.length;
	while (currentIndex != 0) {
		let randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;
		[array[currentIndex], array[randomIndex]] =
		[array[randomIndex], array[currentIndex]];
	}
	return array;
}

function getMethods(obj)
{
	var res = [];
    for(var m in obj) {
        if(typeof obj[m] == "function") {
            res.push(m)
        }
    }
    return res;
}

export {
    Vector, 
    vToRad,
    VectorUp,
    VectorRight,
    VectorDown,
    VectorLeft,
    VectorZero,
	numToVec,
	Direction,
	framesToMs,
	shuffle,
	getMethods
};