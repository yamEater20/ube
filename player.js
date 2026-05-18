class Player {
	constructor(physObj) {
		this.
	}
}

// import {Actor, GRAVITY_COMING_DOWN, GRAVITY_GOING_UP } from "./physics.js";
// import {
// 	Vector,
// 	VectorUp,
//     VectorRight,
//     VectorDown,
//     VectorLeft,
// 	framesToMs,
// } from './math.js';
// import * as Sprites from "./sprites.js";
// import { TrueTime } from './time.js';
// import { audioCon, SOUNDS } from './audio.js';
// import * as Graphics from './graphics.js';
// import {camera} from './camera.js';

// const DEBUG_FLY_SPEED = 0.24;

// const PLAYER_JUMP_V = -0.17;
// const PLAYER_WALK_SPEED = 0.06 * 1.25;

// const JUMP_JUST_PRESSED_TIMER = framesToMs(8);
// const PLAYER_DJ_V = 0.145;

// const X_JUST_PRESSED_TIMER = framesToMs(10);
// const PLAYER_SLIDE_SPEED = 0.06 * 2;
// const PLAYER_SLIDE_GRACE = framesToMs(6);
// const PLAYER_SLIDE_CORNER_DISTANCE = 1;

// const SLIDEBUMP_SPEED = 0.06;
// const SLIDEBUMP_YV = 0.18;
// const SLIDEBUMP_TIMER = framesToMs(8);

// const PLAYER_SLAM_GRACE = framesToMs(10);
// const PLAYER_SLAM_SPEED = 0.6;
// const PLAYER_SLAM_CORNER_DISTANCE = 2;

// const DEFAULT_SPRING_V = PLAYER_JUMP_V * 1.7;
// const SLAM_SPRING_V = PLAYER_JUMP_V * 1.9;

// const PLAYER_HITBOX_PIXEL_SIZE = [6, 6];

// class Player extends Actor {
// 	constructor(x, y, level) {
// 		super(x, y, PLAYER_HITBOX_PIXEL_SIZE[0], PLAYER_HITBOX_PIXEL_SIZE[1], true, level);
// 		this.onCollide = this.onCollide.bind(this);
// 		this.squish = this.squish.bind(this);
// 		this.facing = 1;

// 		this.resetPhysics();
		
// 		this.sprite = new Sprites.AnimatedSprite(
// 			Sprites.SPRITES.MAIN_CHARA_SPRITESHEET,
// 			null,
// 			// [{frames: 1}, {frames: 4, onComplete: "loop", nth: 6}, {
// 			// 	frames: 1,
// 			// 	onComplete: "stay",
// 			// 	nth: 1
// 			// }, {frames: 1, onComplete: "stop"}]
// 			[{frames: 1}, {frames: 1, onComplete: "stay", nth: 1}]
// 		);
// 		this.sprite.flip = true;

// 		this.spawnSprite = new Sprites.AnimatedSprite(Sprites.SPRITES.SPAWN_SPRITESHEET, null, [{frames: 0}, {
// 			frames: 24,
// 			onComplete: "stop",
// 			nth: 2
// 		}], 15, 15);

// 		this.deathSprites = [];
// 		for (let i = 0; i < 8; ++i) {
// 			this.deathSprites.push(new Sprites.Sprite(Sprites.SPRITES.DEATH_SPRITESHEET));
// 		}
// 		this.deathPos = Vector({x: 0, y: 0});
// 	}

// 	resetPhysics() {
// 		this.carrying = null;
// 		this.jumpJustPressed = 0;
// 		this.xJustPressed = 0;
// 		this.coyoteTime = 0;
// 		this.xoyoteTime = 0;

// 		this.playerDied = true;
// 		this.deathFrames = 0;
// 		this.spawned = false;
// 		this.wasOnGround = null;

// 		this.sliding = false;
// 		this.slideTimer = -1;
// 		this.slideBumpTimer = 0;
// 		this.slamming = false;
// 		this.slideDustTime = 0;
// 	}

// 	kill(x, y) {
// 		if (x != null && y != null) {
// 			this.deathPos = Vector({x: x, y: y});
// 			this.playerDied = false;
// 		} else {
// 			this.deathPos = Vector({x: this.getX(), y: Math.min(this.getY(), Graphics.PIXEL_GAME_SIZE[1])});
// 			this.playerDied = true;
// 		}

// 		this.deathFrames = 64;
// 	}

// 	onCollide(physObj) {
// 		if (this.getGame().debugFlying) return false;

// 		const collidable = physObj.collidable;
// 		if (!collidable) return false;
		
// 		if (physObj.checkBehavior("isWall", this)) {
// 			if (physObj.isOnTopOf(this)) {
// 				this.setYVelocity(0);
// 				this.jumpJustPressed = 0;
// 			} else if (this.isOnTopOf(physObj)) {
// 				if (this.slamming) {
// 					const xDiff = Math.min(
// 						Math.abs(physObj.getX() + physObj.getWidth() - this.getX()),
// 						Math.abs(this.getX() + this.getWidth() - physObj.getX())
// 					);
// 					if (xDiff <= PLAYER_SLAM_CORNER_DISTANCE) {
// 						const moveAmount = (xDiff+1) * Math.sign(this.getX() - physObj.getX());
// 						this.moveX(moveAmount, this.onCollide);

// 						if (this.isOnTopOf(physObj)) {
// 							this.stopSlam();
// 						} else {
// 							return false;
// 						}
// 					} else {
// 						this.stopSlam();
// 					}
// 				}

// 				this.setYVelocity(0);
//                 this.getGame().pushDustSprite(this.getX(), this.getY() - 2, -this.facing);
// 			} else if (this.isLeftOf(physObj) || this.isRightOf(physObj)) {
// 				if (this.sliding || this.slideTimer > -125) {
// 					const yDiff = this.getY() + this.getHeight() - physObj.getY();
// 					if (yDiff <= PLAYER_SLIDE_CORNER_DISTANCE && yDiff >= 0) {
// 						const moveAmount = PLAYER_SLIDE_CORNER_DISTANCE + 1;

// 						this.moveY(-moveAmount, this.onCollide);
// 						if (this.isLeftOf(physObj) || this.isRightOf(physObj)) {
// 							this.moveY(moveAmount, this.onCollide);
// 						} else {
// 							return false;
// 						}
// 					}
// 					// this.slideTimer = SLIDE_TIMER;
// 					this.slideBump(this.facing);
// 				}
// 			}
// 			return true;
// 		}

// 		const movingInto = physObj.checkBehavior("movingInto", this);

// 		if (movingInto && physObj.checkBehavior("isSpike") && this.deathFrames === 0) {
// 			this.getLevel().killPlayer();
// 			return false;
// 		}

// 		if (movingInto && physObj.checkBehavior("isSpring")) {
// 			if (this.slamming) {
// 				physObj.checkBehavior("bounceObj", this, SLAM_SPRING_V);
// 				this.slamming = false;
// 			} else {
// 				physObj.checkBehavior("bounceObj", this, DEFAULT_SPRING_V);
// 			}

// 			this.canDoubleJump = true;
// 			this.canSlide = true;
// 			return true;
// 		}

// 		if (physObj.checkBehavior("collect")) {
// 			// this.sliding = false;
// 		}

// 		return false;
// 	}

// 	draw() {
// 		if (this.deathFrames > 0 && this.playerDied) {

// 		} else {
// 			this.camera.drawSprite(this.sprite, this.getX() - 1, this.getY() - 2);
// 		}
// 		if (this.respawnFrames !== 0 && this.spawnSprite.getRow() !== 1 && !this.spawned) {
// 			this.spawnSprite.setRow(1);
// 		}
// 		this.camera.drawSprite(this.spawnSprite, this.spawn.x - 5, this.spawn.y - 5);
// 		if (this.respawnFrames > 0) {
// 			this.getGame().setDrawEmptySquareData(this.spawn.x, this.spawn.y, (32 - this.respawnFrames) * 8, null);
// 			this.spawned = true;
// 		} else {
// 			this.getGame().stopDrawEmptySquare();
// 		}

// 		const vecs = [
// 			VectorLeft,
// 			VectorRight,
// 			VectorUp,
// 			VectorDown,
// 			Vector({x: 0.72, y: 0.72}),
// 			Vector({x: -0.72, y: 0.72}),
// 			Vector({x: 0.72, y: -0.72}),
// 			Vector({x: -0.72, y: -0.72})
// 		];
// 		if (this.deathFrames > 0) {
// 			let i = 0;
// 			const cam = this.camera;
// 			this.deathSprites.map(spr => {
// 				const v = vecs[i];
// 				cam.drawSprite(
// 					spr,
// 					Math.round(this.deathPos.x + Math.sqrt(64 - this.deathFrames) * 7 * v.x - 3),
// 					Math.round(this.deathPos.y + Math.sqrt(64 - this.deathFrames) * 7 * v.y - 3),
// 				);
// 				spr.update();
// 				i += 1;
// 			});
// 			// if(this.deathFrames < 24) game.setDrawEmptySquareData(this.deathPos.x, this.deathPos.y, this.deathFrames*2, null);
// 			this.getGame().setDrawEmptySquareData(this.deathPos.x + 6, this.deathPos.y + 6, this.deathFrames * 4 + 32, null);
// 		}
// 	}

// 	squish(physObj) {
// 		this.getLevel().killPlayer();
// 	}

// 	reset(transitioning) {
// 		super.reset();
// 		this.resetPhysics();

// 		const game = this.getGame();
// 		if (transitioning) {
// 			this.respawnFrames = 0;
// 			this.sliding = game.lastSliding;
// 			this.canDoubleJump = game.lastCanDoubleJump;
// 			this.coyoteTime = game.lastCoyoteTime;
// 		} else {
// 			this.respawnFrames = 48;
// 		}
// 		this.spawn = this.level.currentSpawn;
// 		this.setX(this.spawn.x);
// 		this.setY(this.spawn.y);
// 		this.facing = game.lastFacing;
// 		this.getSprite().flip = this.facing.x > 0;
// 	}

// 	isBonkHead() {
// 		const normBonk = super.isBonkHead();
// 		if (this.carrying) {
// 			if (normBonk === this.carrying) {
// 				return false;
// 			}
// 			return normBonk || this.carrying.isBonkHead();
// 		} else {
// 			return normBonk;
// 		}
// 	}

// 	jump() {
// 		this.setYVelocity(PLAYER_JUMP_V);
// 		this.coyoteTime = 0;
// 		audioCon.playSoundEffect(SOUNDS.JUMP_SFX);
// 		this.jumpJustPressed = 0;
// 	}

// 	doubleJump() {
// 		this.setYVelocity(-PLAYER_DJ_V);
// 		this.canDoubleJump = false;
// 		audioCon.playSoundEffect(SOUNDS.DJUMP_SFX);
// 		this.getGame().spawnDoubleJumpParticles(this.getX(), this.getY());

// 		this.slamming = false;
// 		this.jumpJustPressed = 0;
// 	}

// 	isOverlap(physObj, offset) {
// 		const norm = super.isOverlap(physObj, offset);
// 		if (this.carrying) {
// 			return this.carrying !== physObj && (norm || this.carrying.isOverlap(physObj, offset));
// 		} else {
// 			return norm;
// 		}
// 	}

// 	setKeys(keys) {
// 		if (this.getGame().debugFlying) {
// 			if (keys["moveRight"]) {
// 				this.setXVelocity(DEBUG_FLY_SPEED);
// 			} else if (keys["moveLeft"]) {
// 				this.setXVelocity(-DEBUG_FLY_SPEED);
// 			} else {
// 				this.setXVelocity(0);
// 			}

// 			if (keys["ArrowUp"]) {
// 				this.setYVelocity(-DEBUG_FLY_SPEED);
// 			} else if (keys["ArrowDown"]) {
// 				this.setYVelocity(DEBUG_FLY_SPEED);
// 			} else {
// 				this.setYVelocity(0);
// 			}
// 			return;
// 		}

// 		const onGround = this.isOnGround();
// 		const slidePressed = keys["slide"] && !keys["PrevSlide"] && this.getGame().unlocks.SLIDE;
// 		if (slidePressed) {
// 			this.xJustPressed = X_JUST_PRESSED_TIMER;
// 		}

// 		if (this.respawnFrames === 0 && this.deathFrames === 0) {
// 			if (this.xJustPressed > 0) {
// 			// if (keys["slide"]) {
// 				this.xJustPressed -= TrueTime.delta;
// 				if (keys["ArrowDown"] || keys["KeyS"]) {
// 					this.setXVelocity(0);
// 					this.sliding = false;
// 					this.slideTimer = 0;
// 					this.xJustPressed = 0;

// 					this.startSlam();
// 				} else if (this.canSlide && this.slideTimer <= 0) {
// 					const oldFacing = this.facing;
// 					if (keys["moveRight"]) this.facing = 1;
// 					if (keys["moveLeft"]) this.facing = -1;
					
// 					this.startSlide(true);
// 					if (oldFacing != this.facing) this.sliding = false;
// 					this.slideGraceTimer = PLAYER_SLIDE_GRACE;
// 					this.xJustPressed = 0;
// 				} 
// 			}

// 			// if (this.sliding && !keys["slide"]) this.sliding = false;

// 			if (keys["KeyR"]) {
// 				this.getLevel().killPlayer();
// 			}

// 			if (this.slideTimer > -125) {
// 				this.slideTimer -= TrueTime.delta;
// 			}

// 			if (this.slideGraceTimer > 0) {
// 				this.slideGraceTimer -= TrueTime.delta;
// 				if (keys["moveRight"]) this.facing = 1;
// 				if (keys["moveLeft"]) this.facing = -1;
// 			}

// 			if (this.sliding || this.slideTimer > 0) {
// 				this.setXVelocity(this.getSlideSpeed(this.facing));
// 				// if (onGround && this.sprite.getRow() !== 1) this.sprite.setRow(1);
// 			} else if (this.slideBumpTimer > 0) {
// 				this.setXVelocity(this.slideBumpFacing.x * -SLIDEBUMP_SPEED);
// 			} else {
// 				const xv = this.getXVelocity();
// 				if (keys["moveRight"]) {
// 					// if (this.sprite.getRow() !== 1 && onGround) this.sprite.setRow(1);
// 					this.setXVelocity(Math.max(PLAYER_WALK_SPEED, xv));
// 				} else if (keys["moveLeft"]) {
// 					// if (this.sprite.getRow() !== 1 && onGround) this.sprite.setRow(1);
// 					this.setXVelocity(Math.min(-PLAYER_WALK_SPEED, xv));
// 				} else {
// 					// this.setXVelocity(0);
// 					// if (onGround) this.sprite.setRow(0);
// 				}
// 			}
			
// 			// if (!onGround && this.sprite.getRow() !== 2) {
// 			// 	this.sprite.setRow(2);
// 			// }

// 			const zPressed = keys["jump"] && !keys["PrevJump"];
// 			//If z is pressed, jjp = 8, otherwise decr jjp if jjp > 0
// 			if (zPressed) {
// 				this.jumpJustPressed = JUMP_JUST_PRESSED_TIMER;
// 			} else if (this.jumpJustPressed > 0) {
// 				this.jumpJustPressed -= TrueTime.delta;
// 			}

// 			if (!onGround) {
// 				if (this.coyoteTime > 0 && zPressed) {
// 					this.jump();
// 				} else if (zPressed && this.canDoubleJump && this.getGame().unlocks.DJ) {
// 					this.doubleJump();
// 				} else {
// 					const yv = this.getYVelocity();

// 					let gravity = GRAVITY_COMING_DOWN;
// 					if (keys["jump"] && yv <= 0) gravity = GRAVITY_GOING_UP;
					
// 					this.setYVelocity(this.getFallV(gravity));

// 					const t = this.getLevel().getThrowable();
// 					if (t == null) {

// 					} else if (t !== this.carrying && t.getYVelocity() > 0 && t.getYVelocity() > 0 && this.getHitbox().cloneOffset(Vector({
// 						x: 0,
// 						y: 3
// 					})).isOverlap(t.getHitbox())) {
// 						// this.moveY(3, this.onCollide);
// 						t.getCarrying = () => {
// 							return this
// 						};
// 					} else {
// 						t.getCarrying = () => {
// 							return null;
// 						}
// 					}
// 				}
// 			} else {
// 				this.coyoteTime = 133.3;
// 				this.canDoubleJump = true;
// 				this.canSlide = true;
// 				if (this.jumpJustPressed > 0) {
// 					//Jump if jjp and on ground now
// 					this.jump();
// 				} else {
// 					//Set yv to 0 if on ground and not jumping
// 					// this.setYVelocity(onGround.getYVelocity()*0*0.9);
// 					const gyv = onGround.getYVelocity();
// 					if (gyv < 0) {
// 						this.moveY(Math.min(gyv, this.getYVelocity()), this.onCollide);
// 						this.setYVelocity(0);
// 					}
// 				}
// 			}

// 			if (this.slamTimer > 0) {
// 				this.slamTimer -= TrueTime.delta;
// 				if (keys["moveRight"]) this.setXVelocity(this.getSlideSpeed(1));
// 				if (keys["moveLeft"]) this.setXVelocity(this.getSlideSpeed(-1));
// 			}

// 			if (this.coyoteTime > 0) {
// 				this.coyoteTime -= TrueTime.delta;
// 			}

// 			if (this.slideBumpTimer > 0) {
// 				this.slideBumpTimer -= TrueTime.delta;
// 				// this.setXVelocity(this.slideBumpFacing * -1 - this.slideBumpFrames/8);
// 			}
// 		}
// 		this.wasOnGround = onGround;
// 		if ((this.sliding || this.slamming || this.slideTimer > 0) && TrueTime.framesSinceTime(this.slideDustTime) > 2 && this.deathFrames <= 0) {
// 			this.getGame().spawnSlideDust(this.getX(), this.getY()+6, this.facing);
// 			this.slideDustTime = TrueTime.time;
// 		}

// 		this.getGame().lastCoyoteTime = this.coyoteTime;
// 	}

// 	getSlideSpeed(facing) {
// 		let ret = facing * PLAYER_SLIDE_SPEED;
// 		if (this.slideTimer > 0) ret *= 1.5;
// 		return ret;
// 	}

// 	startSlide(withPolish) {
// 		this.canSlide = false;
// 		this.slideTimer = 125;
		
// 		if (withPolish) {
// 			camera.shakeScreen(0.5, 150);
// 			audioCon.playSoundEffect(SOUNDS.THROW_SFX);
// 			this.getGame().spawnSlideParticles(this.getX(), this.getY(), this.facing);
// 		}
// 	}

// 	startSlam() {
// 		this.slamming = true;
// 		camera.shakeScreen(0.5, 150);
// 		audioCon.playSoundEffect(SOUNDS.THROW_SFX);
// 	}

// 	stopSlam() {
// 		this.slamming = false;
// 		// this.startSlide(false);
// 		this.sliding = true;
// 		this.slamTimer = PLAYER_SLAM_GRACE;
// 	}

// 	updatePhysicsPos() {
// 		this.spawnSprite.update();
// 		if (this.respawnFrames > 0) {
// 			this.respawnFrames -= 1;
// 		} else if (this.deathFrames > 0) {
// 			this.deathFrames -= 1;
// 			if (this.deathFrames === 0) {
// 				this.getLevel().resetStage();
// 			}
// 		} else {
// 			if (this.slideTimer > 0) this.setYVelocity(Math.min(this.getYVelocity(), 0));

// 			super.updatePhysicsPos();

// 			if (this.slamming) this.setYVelocity(PLAYER_SLAM_SPEED);

// 			if (this.slideBumpTimer <= 0) {
// 				const fric = this.isOnGround() ? 0.001 : 0.0004;
// 				const xv = this.getXVelocity();
// 				if (Math.abs(xv) < 0.01) {
// 					this.setXVelocity(0);
// 				} else if (xv > 0) {
// 					this.setXVelocity(Math.max(0, xv - fric * TrueTime.delta));
// 				} else if (xv < 0) {
// 					this.setXVelocity(Math.min(0, xv + fric * TrueTime.delta));
// 				}
// 			}

// 			if (this.velocity.x > 0) {
// 				this.facing = 1;
// 			}
// 			if (this.velocity.x < 0) {
// 				this.facing = -1;
// 			}
// 			this.getSprite().flip = this.facing > 0;
			
// 			this.getGame().lastFacing = this.facing;

// 			this.getGame().lastSliding = this.sliding;
// 			this.getGame().lastCanDoubleJump = this.canDoubleJump;
// 			this.getGame().lastYVelocity = this.getYVelocity();

// 			this.setSpriteRow();
// 		}
// 	}

// 	setSpriteRow() {
// 		if (this.canSlide) this.sprite.setRow(1);
// 		else this.sprite.setRow(0);
// 	}

// 	getCarrying() {
// 		return this.carrying;
// 	}

// 	slideBump(facing) {
// 		this.slideBumpFacing = Vector({x: facing, y: 0});
// 		this.slideBumpTimer = SLIDEBUMP_TIMER;
// 		this.setYVelocity(-SLIDEBUMP_YV);
// 		this.sliding = false;
// 		this.canSlide = true;
// 		this.canDoubleJump = true;
// 		// this.facing = facing.scalar(-1);
// 		// this.getSprite().flip = facing.x < 0;

// 		this.slideTimer = -125;
		
//         this.getGame().pushDustSprite(this.getX(), this.getY() - 3, this.facing * -1);
// 	}
// }

// export {
//     Player
// };