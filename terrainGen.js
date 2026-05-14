const PERLIN_PATH = "perlin.png";

async function getImageData(path) {
	const img = await jimp.read(path);
    img.scale(0.1)
    return img.bitmap;
}

async function getPerlinData() {
    let data = await getImageData(PERLIN_PATH);
    data = toValues(data);
    
    return data;
}



function toValues(imageData) {
    const w = imageData.width;
    const h = imageData.height;
    const data = imageData.data;
    
    const ret = [];
    
    for (let y = 0; y < h; ++y) {
        const r = [];
        for (let x = 0; x < w; ++x) {
            const twoDInd = y * h + x;
            r.push(data[twoDInd * 4]);
        }
        ret.push(r);
    }
    return ret;
}

export {
    getPerlinData
}