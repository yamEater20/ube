import {
	CTX,
	TILE_SIZE,
} from "./graphics.js";

import {
	Vector,
	vectorToRadians,
	VectorUp,
    VectorRight,
    VectorDown,
    VectorLeft,
    VectorZero,
} from "./math.js";

class Sprite {
	constructor(img, direction) {
		this.img = img;
		this.direction = direction;
		this.flip = false;
	}

	drawSelf(x, y) {
		const d = () => {
			CTX.drawImage(this.img, x, y);
		};
		if (this.flip) {
			CTX.save();
			CTX.translate(x + TILE_SIZE, 0);
			CTX.scale(-1, 1);
			CTX.translate(-x, 0);
			d();
			CTX.restore();
		} else {
			d();
		}
	}

	getImage() {
		return this.img;
	}

	draw(x, y, camera) {
		const cameraPos = camera.getPosition();
		if (this.direction) {
			const rad = vectorToRadians(this.direction);
			CTX.save();
			CTX.translate(x + cameraPos.x, y + cameraPos.y);
			CTX.rotate(rad);
			let uberOffset = Vector({x: 0, y: 0});
			switch (this.direction) {
				case VectorUp:
					break;
				case VectorLeft:
					uberOffset.x = -TILE_SIZE;
					break;
				case VectorRight:
					uberOffset.y = -TILE_SIZE;
					break;
				case VectorDown:
					uberOffset.x = -TILE_SIZE;
					uberOffset.y = -TILE_SIZE;
				default:
					break;
			}

			CTX.translate(-x + uberOffset.x, -y + uberOffset.y);
			this.drawSelf(x, y);
			CTX.restore();
		} else {
			this.drawSelf(x + cameraPos.x, y + cameraPos.y);
		}
	}

	update() {}
}

class AnimatedSprite extends Sprite {
	constructor(spritesheet, animationData, direction, w, h) {
		super(spritesheet, direction);
		this.curCol = 0;
		this.row = 0;
		this.animationData = animationData;
		this.w = w ? w : TILE_SIZE;
		this.h = h ? h : TILE_SIZE;
		this.playing = false;
		this.startTime = 0;

		for (let i = 0; i < animationData.length; ++i) {
			if (i === 0) animationData[i].cumulativeFrames = 0;
			else animationData[i].cumulativeFrames = animationData[i - 1].cumulativeFrames + animationData[i - 1].frames;
		}
	}

	draw(x, y, camera) {
		const realColumn = this.curCol + this.getCumulativeFrames();
		const cameraPos = camera.getPosition();
		const xOffset = realColumn * this.w;
		const d = () => {
			CTX.drawImage(super.getImage(), xOffset, 0, this.w, this.h, x + cameraPos.x, y + cameraPos.y, this.w, this.h);
		};
		if (this.flip) {
			CTX.save();
			CTX.translate(x + TILE_SIZE, 0);
			CTX.scale(-1, 1);
			CTX.translate(-x, 0);
			d();
			CTX.restore();
		} else {
			d();
		}
	}

	setRow(r, time) {
		if (r === 0) {
			this.playing = false;
		} else {
			if (!this.playing) this.startTime = time.time;
			this.playing = true;
		}

		this.curCol = 0;
		this.row = r;
	}

	update(time) {
		if (this.playing) {
			const data = this.animationData[this.row];
			const maxFrames = data.frames;

			let framesSinceStart = time.framesSinceTime(this.startTime);
			framesSinceStart = Math.floor(framesSinceStart / data.nth);
			const onComplete = data.onComplete;
			const lastFrame = framesSinceStart >= maxFrames;

			if (lastFrame) {
				if (onComplete === "stop") {
					this.setRow(0);
				} else if (onComplete === "stay") {
					this.playing = false;
				} else if (onComplete === "loop") {
					this.curCol = framesSinceStart % maxFrames;
				} else {
					console.error("unrecognized onComplete " + onComplete);
				}
			} else {
				this.curCol = framesSinceStart % maxFrames;
			}
		}
	}

	getCumulativeFrames() {
		return this.animationData[this.row].cumulativeFrames;
	}

	getRow() {
		return this.row;
	}
}

class TileSprite extends Sprite {
	constructor(tiles, v, replaceColor, fillColor) {
		super(tiles, null);
		this.v = v;
		this.replaceColor = replaceColor;
		this.fillColor = fillColor;
	}

	drawSelf(x, y) {
		/** TODO: change this to not replace pixels every frame; just have two spritesheets (1 red+1 blue)
		 *  see https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
		 *  Try putting the image back and then referencing it
		 */
		CTX.save();
		CTX.drawImage(this.img, this.v.x * TILE_SIZE, this.v.y * TILE_SIZE, TILE_SIZE, TILE_SIZE, x, y, TILE_SIZE, TILE_SIZE);
		if (this.replaceColor) {
			recolorImage(x, y, this.replaceColor, this.fillColor);
		}
		CTX.restore();
	}
}

/*
TODO: refactor.
1. pass this data into sprites as a map between [enumName : filepath], or maybe [enumName : elementId]
2. sprites will populate this data and store it in itself.
3. Sprites exports this data and provides it elsewhere.

This will probably cause temporal coupling but maybe that's ok.
The "correct" way to do it is to make a SpriteService class that's initialized using the sprite mapping.
But that's not very ergonomic. I don't want to call SpriteService.GetSprite(enumName) every time I want an image.
*/
const SPRITES = {
	SPIKES_IMG: document.getElementById("spikes-img"),
	WALL_TILESHEET: document.getElementById("wall-tilesheet"),
	WALL_TILESHEET_OUTER: document.getElementById("wall-tilesheet-2"),
	WALL_TILESHEET_CORNER: document.getElementById("wall-tilesheet-corner"),
	SEMISOLID_TILESHEET: document.getElementById("semisolid-tilesheet"),
	BUTTON: document.getElementById("button"),
	BIG_BUTTON: document.getElementById("big-button"),
	BLOCK: document.getElementById("block-sprite"),
	ICE_TILESHEET: document.getElementById("ice-tilesheet"),
	ICE_TILESHEET_OUTER: document.getElementById("ice-tilesheet-2"),
	MAIN_CHARA_SPRITESHEET: document.getElementById("main-chara-spritesheet"),
	SPRING_SPRITESHEET: document.getElementById("spring-spritesheet"),
	SPAWN_SPRITESHEET: document.getElementById("spawn-spritesheet"),
	SKULL_IMG: document.getElementById("skull-img"),
	DIAMOND_IMGS: [
		document.getElementById("diamond-img"),
		document.getElementById("diamond-special-img"),
		document.getElementById("diamond-fast-img")
	],
	THROWABLE_SPRITESHEET: document.getElementById("throwable-spritesheet"),
	FLAME_SPRITESHEET: document.getElementById("flame-spritesheet"),
	GOD_RAY_IMG: document.getElementById("god-ray-img"),
	VINE_IMGS: [
		document.getElementById("vines1-img"),
		document.getElementById("vines2-img"),
		document.getElementById("vines3-img"),
		document.getElementById("vines4-img")
	],
	PLANT_IMGS: [
		document.getElementById("plants1-img"),
		document.getElementById("plants2-img"),
		document.getElementById("plants3-img"),
		document.getElementById("plants4-img")
	],
	PEDESTAL_IMG: document.getElementById("pedestal-img"),
	TORCH_IMG: document.getElementById("torch-img"),
	BROWN_DUST_SPRITESHEET: document.getElementById("brown-dust-spritesheet"),
	GROUND_DUST_SPRITESHEET: document.getElementById("ground-dust-spritesheet"),
	BAT_SPRITESHEET: document.getElementById("bat-spritesheet"),
	DEATH_SPRITESHEET: document.getElementById("death-spritesheet"),
	TITLE_IMG: document.getElementById("title-img"),
	ARROW_IMG: document.getElementById("arrow-img"),
	DJBLOCKER_SPRITE: document.getElementById("djblocker-img"),
	POWERUP_JUMP_SPRITE: document.getElementById("powerup-jump"),
	POWERUP_SLIDE_SPRITE: document.getElementById("powerup-slide"),
	POWERUP_DJ_SPRITE: document.getElementById("powerup-dj"),
	SPECIAL_MAP: document.getElementById("special-map"),
}

export {
	Sprite,
	AnimatedSprite,
	TileSprite,
	SPRITES
}