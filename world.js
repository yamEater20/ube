import {
	Vector,
    VectorRight,
    VectorZero
} from './engine/math.js';
import * as Sprites from "./engine/sprites.js";
import { PoolTypesFactory, POOL_TYPES, Registrar, CollidableProvider } from './pools.js';
import * as UpdateHandlers from './physUpdateHandlers.js';
import { makeWall } from './entities/wall.js';
import {Entity} from "./engine/entity.js";
import { makePushableBox } from './entities/pushableBox.js';
import { RectHitbox } from './engine/physics.js';
import { debugOptions } from './engine/debug.js';
import {ENTITY_NAMES} from "./entities/entityCodes.js";
import { TILE_SIZE } from './engine/graphics.js';

export const ROOM_SIZE_TILES = [16, 16];

export class Room extends Entity {
	constructor(parent, relativePosition, levelData, globalCollidableProvider) {
		super(parent, relativePosition);

		//Control freak anti-pattern? Maybe, but very close to composition root.
		this._registrar = new Registrar(PoolTypesFactory());

		this.processLevelData(this._registrar, levelData);

		this._collidableProvider = new CollidableProvider(this.getPool(POOL_TYPES.COLLIDABLE));
	}

	processLevelData(registrar, levelData) {
		levelData = levelData.data;
		for (let y = 0; y < levelData.length; ++y) {
			for (let x = 0; x < levelData[y].length; ++x) {
				const entityData = levelData[y][x];
				const entityType = entityData.entityType;
				const relativeX = entityData.relativeX;
				const relativeY = entityData.relativeY;

				if (entityType === ENTITY_NAMES.EMPTY) {

				} else if(entityType === ENTITY_NAMES.WALL) {
					let spriteSheet = entityData.outer ? Sprites.SPRITES.WALL_TILESHEET_OUTER : Sprites.SPRITES.WALL_TILESHEET;
					spriteSheet = entityData.isCorner ? Sprites.SPRITES.WALL_TILESHEET_CORNER : spriteSheet;
					registrar.registerEntity(
						makeWall(
							this,
							Vector({x: relativeX, y: relativeY}),
							new Sprites.TileSprite(spriteSheet, entityData.tileVec)
						)
					);
				}
			}
		}
	}

	getPool(poolType) {return this._registrar.getPool(poolType);}

	draw(camera) {
		this.getPool(POOL_TYPES.DRAWABLE).foreach(item => item.draw(camera));
		if (debugOptions.showHitboxes) this.getPool(POOL_TYPES.DRAWABLE_DEBUG).foreach(item => item.draw(camera));
	}

	update(time) {
		if (!time.getPaused())
			this.getPool(POOL_TYPES.UPDATEABLE).foreach(item => item.update(time));
	}

	getLocalCollidableProvider() {
		return this._collidableProvider;
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