import { Vector, VectorOne, VectorZero } from "../engine/math.js";

export class PlayerVFXManager {
    constructor(particlePool, particleParent, screenShakeOffsetProvider) {
        this._particlePool = particlePool;
        this._particleParent = particleParent;
        this._screenShakeOffsetProvider = screenShakeOffsetProvider;
        
        this._slideParticleIntervalMs = 25;
        this._slideParticleTime = 0;
        this._slideParticleOptions = {
            fadeTimeFunction: () => Math.random() * 500 + 3000,
            spawnArea: Vector({x: 8, y: 0}),
            color: "#ffa100"
        };

        this.onSlide = this.onSlide.bind(this);
        this.startSlide = this.startSlide.bind(this);
        this.stopSlide = this.stopSlide.bind(this);
        this.onDeath = this.onDeath.bind(this);

    }

    onSlide(physObj, timeDelta, slideDirection) {
        this._slideParticleTime += timeDelta;
        const slideParticlePosition = physObj
            .globalPosition()
            .add(slideDirection < 0 ? 0 : -6, 6);

        while (this._slideParticleTime >= this._slideParticleIntervalMs) {
            const newOptions = Object.assign({}, this._slideParticleOptions); //Shallow copy
            newOptions.initialVelocityFunction = (s) => Vector({
                x: slideDirection * -0.1,
                y: -(Math.random() * 0.1 + 0.05)
            });

            newOptions.size = Math.random() > 0.5 ?
                VectorOne :
                VectorOne.scalar(2);

            this._particlePool.createParticle(this._particleParent, slideParticlePosition, newOptions);
            this._slideParticleTime -= this._slideParticleIntervalMs;
        }
        
        this._slideParticleTime = this._slideParticleTime % this._slideParticleIntervalMs;

    }

    startSlide() {
        this._screenShakeOffsetProvider.shakeScreen(2, 125);
    }

    stopSlide() {
        this._screenShakeOffsetProvider.shakeScreen(1, 125);
    }

    onDeath() {
        this._screenShakeOffsetProvider.shakeScreen();
    }
}