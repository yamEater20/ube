import { Vector, VectorZero } from "../engine/math.js";
import { makeParticle } from "../entities/particle.js";

export class ParticlePool {
    constructor(globalRegistrar, collidableProvider, groundedProvider) {
        this._globalRegistrar = globalRegistrar;
        this._collidableProvider = collidableProvider;
        this._groundedProvider = groundedProvider;

        this.createSpringParticles = this.createSpringParticles.bind(this);
    }

	createSpringParticles(parent, position) {
		for (let i = 0; i < Math.random() * 3 + 5; ++i) {
            this._createSpringParticle(parent, position);
        }
	}

    _createSpringParticle(parent, position) {
        var particleData = makeParticle(parent, position, this._collidableProvider, this._groundedProvider);

        particleData.typedData.physObj.velocity = Vector({
            x: Math.random() * 0.02 + 0.02,
            y: -(Math.random() * 0.05 + 0.05)
        })

        this._globalRegistrar.registerEntity(particleData.registrationData);
    }
}

class IParticle {
    create() {}
    reset() {}
    update() {}
}