import { Vector, VectorOne, VectorZero } from "../engine/math.js";
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

        this.createParticle = this.createParticle.bind(this);
        this.createParticles = this.createParticles.bind(this);

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

	createParticles(parent, position, options) {
        for (let i = 0; i < options.numParticlesFunction(); ++i) {
            this.createParticle(parent, position, options);
        }
	}

    createParticle(parent, position, options) {
        let particleData = this._notActiveParticles.pop();
        if (particleData == undefined) {
            particleData = makeParticle(parent, VectorZero, this._collidableProvider, this._groundedProvider);
        }

        let spawnOffset = VectorZero;
        let normalizedSpawnOffset = VectorZero;
        
        let initialVelocity = Vector({x: 0, y: 0});

        const size = options.size ?? VectorOne;

        if (options.spawnArea) {
            normalizedSpawnOffset = Vector({x: Math.random(), y: Math.random()}).add(-0.5, -0.5);
            spawnOffset = normalizedSpawnOffset.multElementWise(options.spawnArea);
        }

        if (options.initialVelocityFunction) {
            initialVelocity = options.initialVelocityFunction(normalizedSpawnOffset);
        }

        const physObj = particleData.typedData.physObj;
        physObj.parent = parent;
        physObj.relativePosition = position.addPoint(spawnOffset);
        physObj.velocity = initialVelocity;

        const fadeTime = options.fadeTimeFunction();

        particleData.typedData.opacityDrawable.reset(1, 0, fadeTime, options.color);
        particleData.typedData.disableTimer.restart(fadeTime);
        particleData.typedData.rectDrawable.size = size;
        particleData.typedData.physObj.hitbox.width = size.x;
        particleData.typedData.physObj.hitbox.height = size.y;
        
        this._activeParticles.push(particleData);
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