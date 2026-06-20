import { Vector, VectorZero } from "../engine/math.js";
import { makeParticle } from "../entities/particle.js";

export class ParticlePool {
    constructor(collidableProvider, groundedProvider) {
        // this._globalRegistrar = globalRegistrar;
        this._collidableProvider = collidableProvider;
        this._groundedProvider = groundedProvider;

        this.createSpringParticles = this.createSpringParticles.bind(this);
    }

	createSpringParticles(registrar, parent, position, spawnAreaWidth) {
		for (let i = 0; i < Math.random() * 3 + 5; ++i) {
            const particleData = this._createSpringParticle(parent, position, spawnAreaWidth);
            registrar.registerEntity(particleData.registrationData);
        }
	}

    _createSpringParticle(parent, position, spawnAreaWidth) {
        const normalizedXOffset = Math.random() - 0.5;
        const xOffset = (normalizedXOffset + 0.5) * spawnAreaWidth;

        var particleData = makeParticle(parent, position.add(xOffset, 0), this._collidableProvider, this._groundedProvider);
        console.log(xOffset, normalizedXOffset);
        particleData.typedData.physObj.velocity = Vector({
            x: normalizedXOffset * 0.1,
            y: -(Math.random() * 0.05 + 0.05)
        })

        return particleData;
    }
}

class IParticle {
    create() {}
    reset() {}
    update() {}
}