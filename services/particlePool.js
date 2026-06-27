import { Vector, VectorZero } from "../engine/math.js";
import { makeParticle } from "../entities/particle.js";
import { POOL_TYPES } from "../entities/poolTypes.js";

export class ParticlePoolDebugDrawer {
    constructor(particlePool) {
        this._particlePool = particlePool;
    }

    draw(camera) {
        this._particlePool.debugDraw(camera);
    }
}

export class ParticlePool {
    constructor(collidableProvider, groundedProvider) {
        // this._globalRegistrar = globalRegistrar;
        this._collidableProvider = collidableProvider;
        this._groundedProvider = groundedProvider;

        this.createSpringParticles = this.createSpringParticles.bind(this);

        this._activeParticles = [];
        this._notActiveParticles = [];

        //Control freak?
        this._debugDrawer = new ParticlePoolDebugDrawer(this);
    }

    getDataToRegister() {
        const ret = {};
        ret[POOL_TYPES.UPDATEABLE] = [this];
        ret[POOL_TYPES.DRAWABLE_DEBUG] = [this._debugDrawer];
        ret[POOL_TYPES.DRAWABLE] = [{item: this, layer: 4},];
        ret[POOL_TYPES.RESETTABLE] = [this];
        return ret;
    }

	createSpringParticles(parent, position, spawnAreaWidth) {
		// for (let i = 0; i < Math.random() * 3 + 5; ++i) {
        //     const particleData = this._createSpringParticle(parent, position, spawnAreaWidth);
        //     this._activeParticles.push(particleData);
        // }
	}

    _createSpringParticle(parent, position, spawnAreaWidth) {
        const normalizedXOffset = Math.random() - 0.5;
        const xOffset = (normalizedXOffset + 0.5) * spawnAreaWidth;

        let particleData = this._notActiveParticles.pop();
        if (particleData == undefined) {
            particleData = makeParticle(parent, VectorZero, this._collidableProvider, this._groundedProvider);
        }

        const physObj = particleData.typedData.physObj;
        physObj.parent = parent;
        physObj.relativePosition = position.add(xOffset, 0);
        physObj.velocity = Vector({
            x: normalizedXOffset * 0.1,
            y: -(Math.random() * 0.05 + 0.05)
        });

        const fadeTime = Math.random() * 500 + 3000;

        particleData.typedData.opacityDrawable.reset(1, 0, fadeTime, "#ff004d");

        particleData.typedData.disableTimer.restart(fadeTime);
        return particleData;
    }

    update(timeDelta) {
        this._forEachActiveParticle(POOL_TYPES.UPDATEABLE, u => u.update(timeDelta));
        for (let i = this._activeParticles.length - 1; i >= 0; --i) {
            const curTimer = this._activeParticles[i].typedData.disableTimer;
            if (curTimer.finished()) {
                this._notActiveParticles.push(this._activeParticles[i]);
                this._activeParticles.splice(i, 1);
            }
        }
    }

    draw(camera) {
        this._forEachActiveParticle(POOL_TYPES.DRAWABLE, d => d.draw(camera));
    }

    debugDraw(camera) {
        this._forEachActiveParticle(POOL_TYPES.DRAWABLE_DEBUG, d => d.draw(camera));
    }

    _forEachActiveParticle(poolType, func) {
        this._activeParticles.forEach(particleData => 
            particleData.registrationData[poolType].forEach(func) 
        );
    }

    reset() {
        this._notActiveParticles = this._notActiveParticles.concat(this._activeParticles);
        this._activeParticles = [];
    }
}