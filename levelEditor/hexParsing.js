export class HexToEntityData {
    constructor(entityMap) {
        this._entityMap = entityMap;
    }
    
    hexToEntityData(hex) {
        const mappedData = this._entityMap[hex];
        if (typeof mappedData === "object") return structuredClone(mappedData);
        else if (typeof mappedData === "number") return {entityType: mappedData};
        else return {message: "Unknown hex code: " + hex};
    }
}