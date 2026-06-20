const Vector = ({ x, y }) => ({
	x, y,
	incrPoint(p) {
		this.x += p.x;
		this.y += p.y;
	},
	add(x, y) {
		return Vector({ x: this.x + x, y: this.y + y })
	},
	addPoint(p) {
		return Vector({ x: this.x + p.x, y: this.y + p.y });
	},
	subtract(p) {
		return Vector({ x: this.x - p.x, y: this.y - p.y });
	},
	scalarX(scalar) {
		return Vector({ x: this.x * scalar, y: this.y });
	},
	// scalarY(scalar) {return(Vector({x: this.x, y:this.y*scalar}));},
	scalar(s) {
		return Vector({ x: this.x * s, y: this.y * s });
	},
	magnitude() {
		return Math.sqrt(this.x ** 2 + this.y ** 2);
	},
	trunc() {
		return Vector({ x: Math.trunc(this.x), y: Math.trunc(this.y) });
	},
	sign() {
		return Vector({ x: Math.sign(this.x), y: Math.sign(this.y) });
	},
	multElementWise(v) {
		return Vector({ x: this.x * v.x, y: this.y * v.y });
	}
});

const VectorUp = Vector({ x: 0, y: -1 });
const VectorRight = Vector({ x: 1, y: 0 });
const VectorDown = Vector({ x: 0, y: 1 });
const VectorLeft = Vector({ x: -1, y: 0 });
const VectorZero = Vector({ x: 0, y: 0 });

function vectorToRadians(v) {
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

function directionToVector(num) {
	switch (num) {
		case Direction.NORTH: return VectorUp;
		case Direction.EAST: return VectorLeft;
		case Direction.SOUTH: return VectorDown;
		case Direction.WEST: return VectorRight;
	}
	return null;
}

function directionToRad(num) {
	switch (num) {
		case Direction.NORTH: return 0;
		case Direction.EAST: return Math.PI * 1.5;
		case Direction.SOUTH: return Math.PI;
		case Direction.WEST: return Math.PI / 2;
	}
	return null;
}

const Direction = Object.freeze({
	NORTH: 0,
	EAST: 1,
	SOUTH: 2,
	WEST: 3,
	NULL: -1
});

function framesToMs(f) { return f / 60 * 1000; }

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

function getMethods(obj) {
	var res = [];
	for (var m in obj) {
		if (typeof obj[m] == "function") {
			res.push(m)
		}
	}
	return res;
}

function lerp(a, b, t) {
	return a * (1 - t) + b * t;
}

export {
	Vector,
	vectorToRadians,
	VectorUp,
	VectorRight,
	VectorDown,
	VectorLeft,
	VectorZero,
	directionToVector,
	directionToRad,
	Direction,
	framesToMs,
	shuffle,
	getMethods,
	lerp
};