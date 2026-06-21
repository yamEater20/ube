import { timeIt } from "../engine/diagnostics.js";
import { ILevelBuilder } from "../levelEditor/levelBuilder.js";
import { getLevelData } from "../levelEditor/levelEditor.js";

export class LevelBuilderFromCache extends ILevelBuilder {
    constructor(cachedLevelData, entityConstructionPostProcessor) {
        super();
        this._cachedLevelData = cachedLevelData;
        this._entityConstructionPostProcessor = entityConstructionPostProcessor;
    }

    async buildLevels() {
        return this._entityConstructionPostProcessor.execute(this._cachedLevelData);
    }
}

export class LevelBuilderFromImage extends ILevelBuilder {
    constructor(fileName, postProcessors) {
        super();
        this._fileName = fileName;
        this._postProcessors = postProcessors;
    }

    async buildLevels() {
        let levelData = await timeIt("Read level data", () => getLevelData(this._fileName));
        levelData = this._postProcessors[0].execute(levelData);
        const json = JSON.stringify(levelData);
        console.log(json);
        
        for (let i = 1; i < this._postProcessors.length; ++i) {
            levelData = this._postProcessors[i].execute(levelData);
        }

        return levelData;
    }
}