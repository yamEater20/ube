// If you're looking at the code, that's awesome! Leave a comment on Itch if you need help!
// (You can also find the repo at https://github.com/alexander-i-yang/minigame)
// From Yam (the Dev)

import {
	Vector,
	VectorUp,
    VectorRight,
    VectorDown,
    VectorLeft,
    VectorZero,
	numToVec,
	framesToMs,
	shuffle
} from './math.js';
import * as Sprites from "./sprites.js";
import { Time, Timer } from './time.js';
import * as Graphics from './graphics.js';
import { Diagnostics, timeIt } from './diagnostics.js';
import { DrawablePool, PhysObjPool } from './pools.js';
import { Entity } from './entity.js';
import {camera} from './camera.js';
import {PhysObj, RectHitbox, DummyCollisionHandler, DummyCollidableProvider, DummyUpdateHandler, getDefaultFallV} from './physics.js';
import {InputProvider} from './input.js';

let root;

class DrawableEntity extends Entity {
	constructor(parent, drawable) {
		super(parent);
		this.drawable = drawable;
	}

	draw(camera) {
		const pos = this.globalPosition().trunc();
		this.drawable.draw(
			pos.x,
			pos.y,
			camera
		);
	}
}

class GroundedProvider {
	constructor(collidableProvider) {
		this._collidableProvider = collidableProvider;
	}

	onGround(p) {
		const onTopOf = this._collidableProvider.getAllCollidingExcept(p, VectorDown, []);
		return onTopOf.length > 0;
	}
}

class FallUpdateHandler {
	constructor(groundedProvider) {
		this._groundedProvider = groundedProvider;
	}

	update(physObj, time) {
		if (this._groundedProvider.onGround(physObj))
			physObj.setYVelocity(0); //will cause problems later
		else
			physObj.setYVelocity(getDefaultFallV(physObj.getYVelocity(), time.delta));
	}
}

class JumpUpdateHandler {
	constructor() {
		this._jumpJustPressed = new Timer();
		this._coyoteTime = new Timer();
		this._lastGrounded = false;
	}

	update(physObj, time, input) {
		if (input.jumpPressed) {
			this._jumpJustPressed.restart(framesToMs(8));
		}
		if (this._lastGrounded && !input.grounded) {
			this._coyoteTime.restart(framesToMs(8));
		}

		const shouldJumpFromBuffer = input.grounded && this._jumpJustPressed.running();
		const shouldJumpFromCoyote = input.jumpPressed && this._coyoteTime.running();
		if (shouldJumpFromBuffer || shouldJumpFromCoyote) {
			this.jump(physObj, -0.17);
		}

		this._jumpJustPressed.update(time.delta);
		this._coyoteTime.update(time.delta);
		this._lastGrounded = input.grounded;
	}

	jump(physObj, jumpV) {
		physObj.setYVelocity(jumpV);
	}
}

class HorizontalUpdateHandler {
	update(physObj, time, input) {
		const fric = input.grounded ? 0.001 : 0.0004;
		const xv = physObj.getXVelocity();
		if (Math.abs(xv) < 0.01) {
			physObj.setXVelocity(0);
		} else {
			physObj.setXVelocity(Math.min(0, xv - fric * time.delta * Math.sign(xv)));
		}

		if (input.moveLeft) physObj.setXVelocity(-0.1);
		else if (input.moveRight) physObj.setXVelocity(0.1);
	}
}

class PlayerUpdateHandler {
	constructor(inputProvider, groundedProvider, updateHandlers) {
		this._inputProvider = inputProvider;
		this._groundedProvider = groundedProvider;
		this._updateHandlers = updateHandlers;
	}

	update(physObj, time) {
		const input = this._inputProvider.getInput();
		input.grounded = this._groundedProvider.onGround(physObj);
		
		this._updateHandlers.forEach(u => u.update(physObj, time, input));
	}
}

function makeWall(parent, relativePosition, sprite) {
	const hitbox = new RectHitbox(parent, relativePosition, 8, 8);

	const physObj = new PhysObj(
		hitbox,
		new DummyUpdateHandler(),
		new DummyCollisionHandler(),
		new DummyCollidableProvider()
	);

	const drawableEntity = new DrawableEntity(hitbox, sprite);

	return {"physObj": physObj, "drawableEntity": drawableEntity};
}

function makePhysObj(hitbox, updateHandler, collidableProvider, sprite) {
	const physObj = new PhysObj(
		hitbox,
		updateHandler,
		new DummyCollisionHandler(),
		collidableProvider
	);

	const drawableEntity = new DrawableEntity(hitbox, sprite);
	return {"physObj": physObj, "drawableEntity": drawableEntity};
}

class Root {
	constructor() {
		this.drawablePool = new DrawablePool();
		this.physObjPool = new PhysObjPool();
		this.inputProvider = new InputProvider();
		const groundedProvider = new GroundedProvider(this.physObjPool);
		const fallUpdateHandler  = new FallUpdateHandler(groundedProvider);

		for (let i = 0; i < 10; ++i) {
			const wall = makeWall(
				this,
				Vector({x: i*8, y: 128}),
				new Sprites.TileSprite(Sprites.SPRITES.WALL_TILESHEET, i === 0 ? VectorZero : i === 9 ? VectorRight.scalar(2) : VectorRight)
			);
			this.registerAll(wall);
		}

		this.debugRegisterAll(
			makePhysObj(
				new RectHitbox(this, VectorZero, 8, 8),
				fallUpdateHandler,
				this.physObjPool,
				new Sprites.Sprite(Sprites.SPRITES.BUTTON)
			)
		);

		this.debugRegisterAll(
			makePhysObj(
				new RectHitbox(this, Vector({x: 12, y: 20}), 6, 6),
				new PlayerUpdateHandler(
					this.inputProvider,
					groundedProvider,
					[
						new FallUpdateHandler(groundedProvider),
						new JumpUpdateHandler(),
						new HorizontalUpdateHandler()
					]
				),
				this.physObjPool,
				new Sprites.Sprite(Sprites.SPRITES.BUTTON)
			)
		);

		this.children = [
			camera,
		];

		this.trueTime = new Time();
	}

	globalPosition() {
		return VectorZero;
	}

	draw() {
		this.drawablePool.drawAll(camera);
	}

	update() {
		this.trueTime.tick();
		this.inputProvider.update();
		this.children.forEach(c => c.update(this.trueTime));
		this.physObjPool.updateAll(this.trueTime);
	}

	registerAll(payload) {
		this.drawablePool.register(payload.drawableEntity);
		this.physObjPool.register(payload.physObj);
	}

	debugRegisterAll(payload) {
		this.drawablePool.register(payload.physObj);
		this.physObjPool.register(payload.physObj);
	}
}

let diagnostics;
function mainLoop() {
	Graphics.setMaxSize();
	Graphics.clearCanvas();
	root.update();
	root.draw();

	// TrueTime.tick();
	// camera.update();
	// if (!TrueTime.paused) game.update();
	// game.setKeys(keys);
	// game.drawAll();
}

;(function () {
	timeIt("Total setup", setup);
})();

async function setup() {
	Graphics.setupCanvas();
	// perlinTest();
	
	diagnostics = new Diagnostics();
	
	root = new Root();
	
	// let levelData = await timeIt("Read level data", getLevelData);
	
	// timeIt("Build levels", () => game.buildLevels(levelData));
	main();
}

function main() {
	var stopMain = window.requestAnimationFrame(main);
	diagnostics.diagnostics(mainLoop);
}

/*
# Enity
Entity has:
- position
- parent
- ~~components~~ Nah, we can do the Godot method. All components are children.
- children?
- ~~update function (pass input into update function)~~
- ~~draw function~~

IUpdateable
- Update() method

IDrawable
- Draw() method
- GetLayer() method/layer property

Only one parent (Game) can be root

# Game
Game has:
- position

Ex: PhysObj
- Is a component?
- Contains behaviors...
- Hm maybe this should be an entity.
- Can this extend Entity?

Ex: Wall
- Set components
	- Phys behavior - wall
	- Sprite
Physobj is an entity
- Everything extends entity

Sprite Component
- Sprite needs a camera + sprite
- Custom draw functions necessary

Drawing
- Priority queue
	- Every draw call, iterate through the entire object tree and insert each entity into the queue
- Array of arrays
	- Keep an array A of object arrays Bn
	- On object creation to layer i, add object to A[i] = Bi
	- Every draw call, iterate through A[0-a][0-b]
	- All Bn can be drawn in parallel? We'd have to sort by position
	- This means that object creation needs to ask the sprite what layer it's on.
	- We could try making the draw layer a property of the entity.
		- But that wouldn't make any sense. Only drawable things should have a draw layer.
	- You only make an array of sprites.
	- We could update the array every frame?
	- all new Sprites require the pool as a dependency
- Elements with the same

# Pooling
- What if pooling is handled on the parental level?
- Sprite pooling can be the exception. Sprite pooling can be static for now

# Example composition root
- Game
	- new SpritePooler
	- new ActorPooler
	- new Solid pooler
	- new ChildFactory(SpritePooler)
- Game set children
	- new "Wall" is just a physObj
		- new WallBehavior
		- Set wall children
			- ChildFactory.NewSprite(new Sprite)
		- Game adds Wall to solid pool
	- new "Player" extends PhysObj
		- new WallCollidableBehavior
		- new Sprite
			- SpritePool.addSprite
		- Game adds player to actor pool
- Update game
	- Game.UpdateablePool.UpdateAll(Ti)
		- Update Player
			- check collision - get position by calling parent.getPosition()
		- Update Wall
	- We should probably use some deterministic ordering for all these.
- Draw game
	- DrawablePool.Foreach.Draw();
- Collision checking
	- With two global objects: call globalPosition and globalPosition
		- Both go down their parents to the root
		- Both 
*/