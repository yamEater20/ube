import { Vector, VectorOne, VectorZero } from "../engine/math.js";

export class PlayerVFXManager {
    constructor(particlePool, particleParent, screenShakeOffsetProvider) {
        this._particlePool = particlePool;
        this._particleParent = particleParent;
        this._screenShakeOffsetProvider = screenShakeOffsetProvider;
        
        this._slideParticleIntervalMs = 40;
        this._slideParticleTime = 0;
        this._slideParticleOptions = {
            fadeTimeFunction: () => Math.random() * 500 + 3000,
            spawnArea: Vector({x: 8, y: 0}),
            color: "#ffa100"
        };

        this._slideStartParticleOptions = {
            color: "#ffa100",
            fadeTimeFunction: () => Math.random() * 500 + 3000,
            spawnArea: Vector({x: 4, y: 12}),
            numParticlesFunction: () => Math.random() * 2 + 6,
            airResitanceFunction: () => 0.004 + Math.random() * 0.002
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
            .add(slideDirection < 0 ? 0 : -6, 5);

        while (this._slideParticleTime >= this._slideParticleIntervalMs) {
            const newOptions = Object.assign({}, this._slideParticleOptions); //Shallow copy
            newOptions.initialVelocityFunction = s => Vector({
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

    startSlide(slideStartInformation) {
        this._screenShakeOffsetProvider.shakeScreen(2, 125);
        
        const slideDirection = slideStartInformation.direction;
        const slidePosition = slideStartInformation.position
            .add(slideDirection < 0 ? 1 : 4, 0);
        
        
        const newOptions = Object.assign({}, this._slideStartParticleOptions); //Shallow copy
        newOptions.initialVelocityFunction = () => Vector({
            x: -slideDirection * (Math.random() * 0.03 + 0.05),
            y: -(Math.random() * 0.01)
        });

        this._particlePool.createParticles(
            this._particleParent,
            slidePosition,
            newOptions
        );
    }

    stopSlide() {
        this._screenShakeOffsetProvider.shakeScreen(1, 125);
    }

    onDeath() {
        this._screenShakeOffsetProvider.shakeScreen();
    }
}