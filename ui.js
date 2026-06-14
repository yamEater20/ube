import {staticCamera} from './camera.js';

import { TILES_IN_LEVEL, TILE_MAP_SIZE } from './levelEditor.js';
import { Vector, Rectangle } from './math.js';
import { audioCon, SOUNDS } from './audio.js';
import * as Sprites from './sprites.js';
import * as Graphics from './graphics.js';

class UI {
    constructor() {
        this.camera = staticCamera;
    }
}

class Scoreboard extends UI {
    constructor(game, diagnostics) {
        super();
        this.game = game;
        this.diagnostics = diagnostics;
        this.rect = new Rectangle(4, 4, 44, 28);
        this.debugMode = false;
    }

    startDebugMode() {
        this.debugMode = true;
        this.rect = new Rectangle(4, 4, 44, 37);
    }
    
    draw() {
		const rectPos = Vector({
			x: this.rect.getX() + 2,
			y: this.rect.getY() + 2
		});

		this.camera.drawRect(this.rect, "#000000d0");
		this.camera.writeText(this.game.formatTimeSinceStart(), 1, rectPos.addPoint({x: 2, y: 2}), this.cheated ? "#FF004D" : "#FFF1E8");
		this.camera.drawImage(Sprites.SPRITE_LK.SKULL_IMG, this.rect.getX() + 1, this.rect.getY() + 10);
		this.camera.writeText(this.game.deaths.toString(), 1, rectPos.addPoint({x: 10, y: 11}), "#FFF1E8");

		this.camera.writeText(this.game.money.toString(), 1, rectPos.addPoint({x: 2, y: 19}), "#FFF1E8");

		if (this.debugMode) {
			this.camera.writeText("fps " + this.diagnostics.fps.toString(), 1, rectPos.addPoint({x: 2, y: 27}), "#FFF1E8");
		}
	}
}

class WorldMap extends UI {
	constructor(game) {
		super();
        this.mapSections = [];
		this.game = game;
		this.camera = staticCamera;
	}

	pushMapSec(tileArr, location, level) {
		this.mapSections.push(new MapSec(tileArr, this.game, level));
	}

	draw() {
		const margin = 1;

		const offset = Vector({x: 5, y: 14});
		const roomsW = 5;
		const roomsH = 4;

		this.camera.drawRect(new Rectangle(16 + offset.x - 1, offset.y + 15, ((16 + margin) * roomsW) + 3, (16 + margin) * roomsH + 3), "#FFCCAA");
		this.camera.drawRect(new Rectangle(16 + offset.x, offset.y + 16, ((16 + margin) * roomsW) + 1, (16 + margin) * roomsH + 1), "#1E2B53");
		this.mapSections.forEach((m, i) => {
			const x = (m.level.location.x + 1) * (TILE_MAP_SIZE[0] + margin) + offset.x;
			const y = (m.level.location.y + 1) * (TILE_MAP_SIZE[1] + margin) + offset.y;
			m.draw(x, y);
		})
	}
}

class MapSec extends UI {
	constructor(tileArr, game, level) {
		super();
        this.game = game;
		this.pixels = [];
		this.level = level;

		this.convertToPixels(tileArr);
	}

	hasVisited() {
		return this.game.visitedLevels[this.level.myLevelInd];
	}

	convertToPixels(tileArr) {
		for (let t = 0; t < TILES_IN_LEVEL; t++) {
			const tileCode = parseInt(tileArr[t]);
			if (tileCode === 1) this.pixels.push("#5F574F");
			// else if (52 <= tileCode && 55 >= tileCode) this.pixels.push("#FF004D");
			else if (tileCode === 73) this.pixels.push("#AB5236");
			else this.pixels.push("#000000");
		}
	}

	draw(offsetX, offsetY) {
		if (this.level.myLevelInd === undefined) return;
		if (this.level.myLevelInd === 2) {
			if (!this.hasVisited()) {
				this.camera.drawImage(Sprites.SPRITE_LK.SPECIAL_MAP, offsetX, offsetY)
				return;
			}
		}
		
		if (!this.hasVisited()) {
			let i = 0;
			for (let y = 0; y < TILE_MAP_SIZE[1]; y++) {
				for (let x = 0; x < TILE_MAP_SIZE[0]; x++) {
					this.camera.drawPixel(offsetX + x, offsetY + y, (i+y) % 2 == 0 ? "#000000" : "#1d2b53");
					i++;
				}
			}
			return;
		}

		let i = 0;
		for (let y = 0; y < TILE_MAP_SIZE[1]; y++) {
			for (let x = 0; x < TILE_MAP_SIZE[0]; x++) {
				this.camera.drawPixel(offsetX + x, offsetY + y, this.pixels[i]);
				i++;
			}
		}

		if (this.level.myLevelInd === this.game.levelInd) {
			const p = this.level.getPlayer();
			this.camera.drawPixel(offsetX + Math.floor(p.getX() / Graphics.TILE_SIZE), offsetY + Math.floor(p.getY() /Graphics.TILE_SIZE), "#ff0000")
		}
	}
}

class Option {
	constructor(parent, txt, pos, zPressed) {
		this.txt = txt;
		this.pos = pos;
		this.color = "#C2C3C7";
		this.zPressed = zPressed;
		this.parent = parent;
	}

	draw(selected) {
		this.parent.camera.writeText(
			this.getFormattedTxt(selected),
			1,
			this.pos,
			selected ? this.color : "#5F574F",
		)
	}

	setKeys(k) {
		const kZ = k["jump"];
		if (!this.prevZ && kZ) this.zPressed();
		this.prevZ = kZ;
	}

	getFormattedTxt() {
		return this.txt
	}
}

class SliderOption extends Option {
	constructor(parent, txt, pos, valChange) {
		super(parent, txt, pos, null);
		this.valChange = valChange;
		this.val = 10;
	}

	getFormattedTxt(selected) {
		return this.txt.replace(" {{val}} ", selected ? `\<${this.val}\>` : this.val);
	}

	setKeys(k) {
		const kLeft = k["moveLeft"];
		const kRight = k["moveRight"];
		let valChange = false;
		if (!this.prevLeft && kLeft) {
			this.val = Math.max(this.val - 1, 0);
			valChange = true;
		} else if (!this.prevRight && kRight) {
			this.val = Math.min(this.val + 1, 10);
			valChange = true;
		}
		if (valChange) {
			this.valChange(this.val);
			audioCon.playSoundEffect(SOUNDS.PING_SFX);
		}
		this.prevLeft = kLeft;
		this.prevRight = kRight;
	}
}

class PauseMenu {
	constructor() {
		this.bgRect = new Rectangle(0, 0, Graphics.PIXEL_GAME_SIZE[0], Graphics.PIXEL_GAME_SIZE[1]);
		this.optionsPos = Vector({x: 30, y: 30});
		this.optionsRect = new Rectangle(this.optionsPos.x, this.optionsPos.y, Graphics.PIXEL_GAME_SIZE[0] - this.optionsPos.x * 2, Graphics.PIXEL_GAME_SIZE[1] - this.optionsPos.y * 2);
		this.otherRect = new Rectangle(this.optionsPos.x - 2, this.optionsPos.y - 2, Graphics.PIXEL_GAME_SIZE[0] - this.optionsPos.x * 2 + 4, Graphics.PIXEL_GAME_SIZE[1] - this.optionsPos.y * 2 + 4);
		this.showing = false;
		this.optionInd = 0;
		this.camera = staticCamera;

		this.options = [
			new Option(this, "Resume", this.optionsPos.addPoint({x: 4, y: 14}), () => {
				this.showing = false;
			}),
			new SliderOption(this, "Music vol: {{val}} ", this.optionsPos.addPoint({x: 4, y: 20}), (val) => {
				audioCon.setMusicVolume(val * 0.1);
			}),
			new SliderOption(this, "SFX vol: {{val}} ", this.optionsPos.addPoint({x: 4, y: 26}), (val) => {
				audioCon.setSFXVolume(val * 0.1);
			}),
		];

	}

	draw() {
		this.camera.drawRect(this.bgRect, "#00000080");
		this.camera.drawRect(this.otherRect, "#1D2B53");
		this.camera.drawRect(this.optionsRect, "#000000");
		this.camera.writeText("Options", 1, this.optionsPos.addPoint(Vector({x: 4, y: 4})), "#FFF1E8");

		this.options.forEach((option, i) => {
			option.draw(i === this.optionInd);
		});
	}

	setKeys(k) {
		const len = this.options.length;
		let incrBy = 0;
		const kDown = k["ArrowDown"];
		const kUp = k["ArrowUp"];
		if (!this.prevDown && kDown) incrBy = 1;
		else if (!this.prevUp && kUp) incrBy = -1;
		if (incrBy !== 0) audioCon.playSoundEffect(SOUNDS.PONG_SFX);

		this.optionInd = (this.optionInd + (incrBy) + len) % len;
		this.options[this.optionInd].setKeys(k);
		this.prevUp = kUp;
		this.prevDown = kDown;
	}
}

export {
    Scoreboard,
    WorldMap,
	PauseMenu
}