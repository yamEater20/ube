import {
	Vector,
    VectorRight,
    VectorZero
} from './engine/math.js';
import * as Sprites from "./engine/sprites.js";
import { Pool, CollidableProvider, Registrar } from './pools.js';
import {camera} from './camera.js';
import * as UpdateHandlers from './physUpdateHandlers.js';
import { makeWall } from './entities/wall.js';
import {Entity} from "./engine/entity.js";
import { makePushableBox } from './entities/pushableBox.js';
import { RectHitbox } from './engine/physics.js';
import { debugOptions } from './engine/debug.js';

const ROOM_SIZE_PIXELS = [
	128, 128
];

export class Room extends Entity {
	constructor(parent, relativePosition, globalCollidablePool) {
		super(parent, relativePosition);

		//Control freak anti-pattern? Maybe, but very close to composition root.
		this._drawablePool = new Pool();
		this._debugDrawablePool = new Pool();
		this._collidablePool = new CollidableProvider();
		this._updateablePool = new Pool();
		this._resettablePool = new Pool();

		const groundedProvider = new UpdateHandlers.GroundedProvider(globalCollidablePool);
		const fallUpdateHandler = new UpdateHandlers.FallUpdateHandler(groundedProvider);

		this._updateablePool.register(camera);

		// TODO: I think you're thinking about Registrars wrong.
		// Right now, everybody has to make a registrar, because everyone has their own pools.
		// But really, you want the registrar to be shared behavior among all sources.
		// You could try giving everyone a registrar factory, but I don't think that's a good idea.
		const registrar = new Registrar(
			this._collidablePool,
			this._drawablePool,
			this._updateablePool,
			this._resettablePool,
			this._debugDrawablePool
		);

		for (let i = 0; i < 16; ++i) {
			makeWall(
				this,
				Vector({x: i*8, y: 100}),
				new Sprites.TileSprite(Sprites.SPRITES.WALL_TILESHEET, i === 0 ? VectorZero : i === 19 ? VectorRight.scalar(2) : VectorRight),
				registrar
			);
		}

		for (let i = 5; i < 16; ++i) {
			makeWall(
				this,
				Vector({x: i*8, y: 80}),
				new Sprites.TileSprite(Sprites.SPRITES.WALL_TILESHEET, i === 0 ? VectorZero : i === 19 ? VectorRight.scalar(2) : VectorRight),
				registrar
			);
		}

		makePushableBox(
			new RectHitbox(this, VectorRight.scalar(12), 8, 8),
			new UpdateHandlers.Composite([fallUpdateHandler, new UpdateHandlers.MovingGuy()]),
			// fallUpdateHandler,
			globalCollidablePool,
			groundedProvider,
			registrar
		);
	}

	draw(camera) {
		this._drawablePool.foreach(item => item.draw(camera));
		if (debugOptions.showHitboxes) this._debugDrawablePool.foreach(item => item.draw(camera));
	}

	update(time) {
		if (!time.getPaused())
			this._updateablePool.foreach(item => item.update(time));
	}

	getAllRiding(physObj) {
		return this._collidablePool.getAllRiding(physObj);
	}

	getAllCollidingExcept(physObj, offset, except) {
        return this._collidablePool.getAllCollidingExcept(physObj, offset, except);
	}
}

// class Level {
// 	constructor(tileArr, game, levelInd, location, tilecodeToObj, createPlayer) {
// 		this.solids = [];
// 		this.actors = [];
// 		this.components = [];
// 		this.decorations = [];
// 		this.coinSpawners = [];
// 		this.frontDecorations = [];
// 		this.dustSprites = [];
// 		this.myLevelInd = levelInd;
// 		let curTileMapInd = 0;
// 		this.game = game;
// 		this.nextDirection = Direction.NULL;
// 		this.curSpawn;
// 		this.spawn;
// 		this.switchBlocks = [];
// 		this.buttons = [];
// 		this.djBlockFrames = 0;
// 		this.createPlayer = createPlayer;
// 		this.realXCam = 0;
// 		this.location = location;

// 		for (let t = 0; t < tileArr.length; t++) {
// 			const x = t % TILE_MAP_SIZE[0];
// 			const y = Math.floor(t / TILE_MAP_SIZE[0]);
// 			const gameSpaceX = x * Graphics.TILE_SIZE + location.x;
// 			const gameSpaceY = y * Graphics.TILE_SIZE + location.y;
// 			const tileCode = parseInt(tileArr[curTileMapInd]);
// 			if (tileCode === 0) {

// 			} else {
// 				const obj = tilecodeToObj(tileCode, gameSpaceX, gameSpaceY, this, tileArr, curTileMapInd);
// 				obj.addToLevel(this);
// 			}
// 			curTileMapInd += 1;
// 		}

// 		this.player = createPlayer(0, 0, this);
// 		this.actors.push(this.player);

// 		this.opacity = 0;
// 	}

// 	pushSolid(s) {this.solids.push(s);}
// 	pushActor(a) {this.actors.push(a);}
// 	pushComponent(c) {this.components.push(c);}

// 	setSpawn(s) {this.spawn = s;}

// 	setCurrentSpawn(direction, playerPos) {
// 		let x = playerPos.x, y = playerPos.y;
// 		let playerWidth = this.player.getWidth(), playerHeight = this.player.getHeight();
// 		switch (direction) {
// 			case Direction.NORTH:
// 				y = Graphics.PIXEL_GAME_SIZE[1] - playerHeight - 3;
// 				break;
// 			case Direction.SOUTH:
// 				y = 1;
// 				break;
// 			case Direction.WEST:
// 				x = Graphics.PIXEL_GAME_SIZE[0] - playerWidth - 1;
// 				break;
// 			case Direction.EAST:
// 				x = 1;
// 				break;
// 			default:
// 				console.log("Error: bad direction");
// 				break;
// 		}

// 		y = y - y % Graphics.TILE_SIZE + 2;

// 		this.currentSpawn = Vector({x: x, y: y});
// 	}

// 	drawAll() {
// 		this.decorations.forEach(curItem => {
// 			curItem.draw();
// 		});
// 		this.getSolids().forEach(curItem => {
// 			curItem.draw();
// 		});
// 		this.actors.forEach(item => {
// 			item.draw();
// 		});
// 		if (this.throwable) this.throwable.draw();
// 		this.player.draw();
// 		this.frontDecorations.forEach(curItem => {
// 			curItem.draw();
// 		});
// 		this.dustSprites.forEach(i => i.draw());
// 	}

// 	endGame() {
// 	}

// 	checkCollide(physObj, offset) {
// 		/*TODO: make a faster collision checking algorithm by:
//         *  1) Sorting all solids by their x positions before moving any actors
//         *  2) Assuming all solids are sorted, get a slice of the solids array that could possibly intersect with
//         *     the actor's hitbox in the x direction
//         *  3) Only check collisions with that slice */

// 		const ret = [];
// 		this.getAllGeometry().some(checkObj => {
// 			if (physObj.isOverlap(checkObj, offset)) {
// 				if (!checkObj.collidable) {
// 					physObj.onCollide(checkObj);
// 				} else {
// 					ret.push(checkObj);
// 				}
// 			}
// 		});
// 		return ret;
// 	}
// 	//One room for a speedrun
// 	//Tiers of rewards based on how fast you go. ==O===O==|
// 	//Choose your weapon - dive from Dive, ascend slide, ???
// 	//Small blind big, big blind, boss. Blinds are just practice for the boss.
// 	onButtonPush() {
// 		this.switchBlocks.forEach(s => s.deactivate());
// 		this.buttons.forEach(b => b.deactivate());

// 		if (this.getGame().levelInd === 1) {
// 			this.getGame().bigUnlocked = true;
// 		}
// 		audioCon.playSoundEffect(SOUNDS.BUTTON_SFX);
// 	}

// 	pushDecoration(d) {
// 		this.decorations.push(d);
// 	}

// 	pushDustSprite(g) {
// 		this.dustSprites.push(g);
// 	}

// 	removeDecoration(d) {
// 		const index = this.decorations.findIndex(de => de.id === d.id);
// 		if (index > -1) {
// 			this.decorations.splice(index, 1);
// 		}
// 	}
	
// 	removeActor(a) {
// 		const index = this.actors.indexOf(a);
// 		if (index > -1) {
// 			this.actors.splice(index, 1);
// 		}
// 	}

// 	removeDustSprite(d) {
// 		const index = this.dustSprites.indexOf(d);
// 		if (index > -1) {
// 			this.dustSprites.splice(index, 1);
// 		}
// 	}

// 	updateAll() {
// 		this.solids.forEach(s => s.updatePhysicsPos());
// 		this.actors.forEach(a => a.updatePhysicsPos());
		
// 		// const targetPos = -this.player.getPos().x + Graphics.PIXEL_GAME_SIZE[0] / 2;
// 		// const to = targetPos - camera._position.x;
// 		// const nextPos = this.realXCam + to * 0.05;

// 		// if (Math.abs(nextPos - this.realXCam) > 0.5) {
// 		// 	this.realXCam = this.realXCam + to * 0.05;
// 		// 	camera._position.x = Math.round(this.realXCam);
// 		// } else {
// 		// 	this.realXCam = this.realXCam + Math.sign(to) * 0.3;
// 		// 	camera._position.x = Math.round(this.realXCam);
// 		// }
		
// 		this.decorations.forEach(d => d.update());
// 		this.dustSprites.forEach(g => g.update());

// 		const nextLevelDir = this.checkNextLevel();

// 		if (nextLevelDir) {
// 			this.nextDirection = this.nextLevelDir();
// 			this.nextLevelPlayerPos = this.getPlayer().getPos();
// 			this.game.nextLevel(this.nextDirection, this.nextLevelPlayerPos);
// 		}

// 		this.components.forEach(c => c.update());

// 		if (this.checkPlayerFallDeath() && this.player.deathFrames <= 0 && !this.checkNextLevel()) {
// 			this.killPlayer();
// 		}
// 	}

// 	getAllGeometry() {
// 		return this.solids.concat(this.actors);
// 	}

// 	isOnGround(actor) {
// 		let ret = null;
// 		this.getAllGeometry().some(solid => {
// 			if (solid.collidable && solid.checkBehavior("isWall", actor) && actor.isOnTopOf(solid)) {
// 				ret = solid;
// 				return true;
// 			}
// 		});
// 		return ret;
// 	}

// 	isBonkHead(actor) {
// 		let ret = null;
// 		this.solids.some(solid => {
// 			if ((solid.onPlayerCollide().includes("wall")) && actor.isUnder(solid)) {
// 				ret = solid;
// 				return true;
// 			}
// 		});
// 		return ret;
// 	}

// 	isLeftOfWall(actor) {
// 		let ret = null;
// 		this.solids.some(solid => {
// 			if ((solid.onPlayerCollide().includes("wall")) && actor.isLeftOf(solid)) {
// 				ret = solid;
// 				return true;
// 			}
// 		});
// 		return ret;
// 	}

// 	isRightOfWall(actor) {
// 		let ret = null;
// 		this.solids.some(solid => {
// 			if ((solid.onPlayerCollide().includes("wall")) && actor.isRightOf(solid)) {
// 				ret = solid;
// 				return true;
// 			}
// 		});
// 		return ret;
// 	}

// 	isOnIce(actor) {
// 		let ret = null;
// 		(this.solids.concat(this.actors)).some(solid => {
// 				if ((solid.onPlayerCollide().includes("ice")) && solid.collidable && actor.isOnTopOf(solid)) {
// 					ret = solid;
// 					return true;
// 				}
// 			}
// 		);
// 		return ret;
// 	}

// 	isPushUp(actor) {
// 		let ret = false;
// 		this.actors.some(curActor => {
// 			if (actor !== curActor && (curActor.onPlayerCollide().includes("throwable") || curActor.onPlayerCollide() === "") && actor.isUnder(curActor)) {
// 				ret = curActor;
// 				return true;
// 			}
// 		});
// 		return ret;
// 	}

// 	getAllRidingActors(solid) {
// 		let ret = [];
// 		this.actors.forEach(actor => {
// 			if (actor.isRiding(solid)) {
// 				ret.push(actor);
// 			}
// 		});
// 		return ret;
// 	}

// 	resetStage(transitioning) {
// 		this.game.respawn();
// 		if (!transitioning) {
// 			this.currentSpawn = Vector({x: this.spawn.x + this.location.x, y: this.spawn.y + this.location.y});
// 		}
		

// 		if (this.currentSpawn == null) {
// 			this.currentSpawn = Vector({x: 9, y: 104});
// 		}

// 		this.actors.forEach(actor => actor.reset(transitioning));
// 	}

// 	killPlayer(x, y) {
// 		this.player.kill(x, y);
// 		this.game.death();

// 		audioCon.playSoundEffect(SOUNDS.DEATH_SFX);
// 	}

// 	setKeys(keys) {
// 		this.player.setKeys(keys);
// 	}

// 	isTouchingThrowable(physObj) {
// 		return this.throwable && (physObj.isTouching(this.throwable.getHitbox()));
// 	}

// 	getSolids() {
// 		return this.solids;
// 	}

// 	getActors() {
// 		return this.actors;
// 	}

// 	getDecorations() {
// 		return this.decorations;
// 	}

// 	getPlayer() {
// 		return this.player;
// 	}

// 	getThrowable() {
// 		return this.throwable;
// 	}

// 	getGame() {
// 		return this.game;
// 	}

// 	checkNextLevel() {
// 		return this.nextLevelDir() !== Direction.NULL;
// 	}

// 	nextLevelDir() {
// 		if (this.player.getX() <= 0) return Direction.WEST;
// 		if (this.player.getY() <= -3) return Direction.NORTH;
// 		if (this.player.getX() + this.player.getWidth() >= Graphics.PIXEL_GAME_SIZE[0]) return Direction.EAST;
// 		if (this.player.getY() > Graphics.PIXEL_GAME_SIZE[1]) return Direction.SOUTH;
// 		return Direction.NULL;
// 	}

// 	checkPlayerFallDeath() {
// 		return false;
// 		//return this.player.getY() > Graphics.PIXEL_GAME_SIZE[1];
// 	}
// }

// export {
// 	TILE_MAP_SIZE,
// 	Level
// }