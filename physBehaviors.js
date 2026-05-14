class PhysBehavior {
    constructor(physObj) {
        this.physObj = physObj;
    }
}

class MovingIntoBehavior extends PhysBehavior {
    movingInto(p) {
        if (p.getXVelocity() * this.physObj.direction.x + p.getYVelocity() * this.physObj.direction.y > 0) {
			return false;
		}
		return true;
    }
}

export class WallBehavior extends PhysBehavior {
    isWall(otherPhysObj) {return true;}
}

export class SemisolidBehavior extends WallBehavior {
    isWall(otherPhysObj) {
        const b = otherPhysObj.getY() + otherPhysObj.getHeight() <= this.physObj.getY();
        return b;
    }
}

export class SpikeBehavior extends MovingIntoBehavior {
    isSpike() {return true;}
}

export class SpringBehavior extends MovingIntoBehavior {
    isSpring() {return true;}
    
    bounceObj(p, springScalar) {
        const newV = this.physObj.direction.scalar(-springScalar);
		if (newV.x) {
			p.setXVelocity(newV.x);
		} else {
			p.setYVelocity(newV.y);
		}
        this.physObj.onBounce();
    }
}

export class CollectibleBehavior extends PhysBehavior {
    collect() {
        this.physObj.collect();
        return true;
    }
}