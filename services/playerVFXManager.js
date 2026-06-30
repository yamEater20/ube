import { VectorZero } from "../engine/math.js";

export class PlayerVFXManager {
    constructor(particlePool, particleParent, screenShakeOffsetProvider) {
        this._particlePool = particlePool;
        this._particleParent = particleParent;
        this._screenShakeOffsetProvider = screenShakeOffsetProvider;
        this._slideParticleIntervalMs = 100;

        this._slideParticleTime = 0;

        this.onSlide = this.onSlide.bind(this);
        this.startSlide = this.startSlide.bind(this);
        this.stopSlide = this.stopSlide.bind(this);
        this.onDeath = this.onDeath.bind(this);
    }

    onSlide(physObj, timeDelta) {
        this._slideParticleTime += timeDelta;
        if (this._slideParticleTime >= this._slideParticleIntervalMs) {
            this._particlePool.createPlayerSlideParticle(this._particleParent, physObj.globalPosition());
            this._slideParticleTime = Math.random() * 100 + 25;
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