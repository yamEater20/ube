import {
	TILE_SIZE,
} from "./graphics.js";

import { msToFrames } from "./time.js";

class Sprite {
	constructor(img) {
		this.img = img;
	}

	getImage() {
		return this.img;
	}

	draw(x, y, camera) {
		camera.drawImage(this.img, x, y);
	}

	update() {}
}

class RotatedSprite extends Sprite {
	constructor(img, rotationRadians) {
		super(img);
		this._options = {rotation: rotationRadians};
	}

	draw(x, y, camera) {
		camera.drawImage(this.img, x, y, this._options);
	}
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
		this.duration = 0;

		for (let i = 0; i < animationData.length; ++i) {
			if (i === 0) animationData[i].cumulativeFrames = 0;
			else animationData[i].cumulativeFrames = animationData[i - 1].cumulativeFrames + animationData[i - 1].frames;
		}

		this.options = {
			// sx: xOffset,
			sy: 0,
			sWidth: this.w,
			sHeight: this.h,
		}
	}

	draw(x, y, camera) {
		const realColumn = this.curCol + this.getCumulativeFrames();
		const xOffset = realColumn * this.w;
		this.options.sx = xOffset;

		camera.drawImage(
			super.getImage(),
			x, y,
			this.options
		);
	}

	setRow(r) {
		if (r === 0) {
			this.playing = false;
		} else {
			this.playing = true;
			this.duration = 0;
		}

		this.curCol = 0;
		this.row = r;
	}

	update(timeDelta) {
		if (this.playing) {
			const data = this.animationData[this.row];
			const maxFrames = data.frames;

			this.duration += timeDelta;

			const framesSinceStart = msToFrames(this.duration);
			const animationFramesSinceStart = Math.floor(framesSinceStart / data.nth);
			const onComplete = data.onComplete;
			const isLastFrame = animationFramesSinceStart >= maxFrames;

			if (isLastFrame) {
				if (onComplete === "stop") {
					this.setRow(0);
				} else if (onComplete === "stay") {
					this.playing = false;
				} else if (onComplete === "loop") {
					this.curCol = animationFramesSinceStart % maxFrames;
				} else {
					console.error("unrecognized onComplete " + onComplete);
				}
			} else {
				this.curCol = animationFramesSinceStart % maxFrames;
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
	constructor(tiles, v) {
		super(tiles, null);
		this.v = v;
		this._options = {
			sx: this.v.x * TILE_SIZE,
			sy: this.v.y * TILE_SIZE,
			sWidth: TILE_SIZE,
			sHeight: TILE_SIZE,
			flip: this.flip,
		}
	}

	draw(x, y, camera) {
		camera.drawImage(
			super.getImage(),
			x, y,
			this._options
		);
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
	RotatedSprite,
	SPRITES
}