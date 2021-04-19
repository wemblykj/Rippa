import * as Common from "../Rippa/Common.js"

export var TileAttributes = function(w, h) {
    this.size = new Common.Size(w, h);
    this.stride = w;
  }
  
export var PlaneAttributes = function(planeCount) {
    this.planeCount = planeCount;
    this.pixelsPerByte = 8/planeCount; 
    this.packing = 0;
    this.endian = 1;
    this.setPlaneCount = function(planeCount) {
      this.planeCount = planeCount
      this.pixelsPerByte = 8/planeCount; 
    };
}
  

export var Attributes = function(w, h, tile_bpp, system_bpp, tilePalette = null, systemPalette = null) {
	this.tile = new TileAttributes(w, h);
	this.packing = new PlaneAttributes(tile_bpp);
	
	// produce a default tile palette

	if (tilePalette === null) {
		var paletteIndex;
		var systemPaletteCount = (2**system_bpp);
		var tilePaletteCount = (2**tile_bpp);
		var step = (systemPaletteCount-1) / (tilePaletteCount-1);
		for (paletteIndex = 0; paletteIndex < tilePaletteCount; ++paletteIndex) {
			var systemIndex = Math.floor(paletteIndex * step);
			tilePalette[paletteIndex] = systemIndex;
		}
	}

	this.tilePalette = new IndexedPalette(tile_bpp, tilePalette);
	
	if (systemPalette === null) {
		// produce a default intensity/RGB based palette

		var step = (255 / (systemPaletteCount >> 3));
		var intensityBits = (8 - (system_bpp-3));
		var intensityStep = 2**intensityBits;
		for (paletteIndex = 0; paletteIndex < systemPaletteCount; ++paletteIndex) {
			var i = (paletteIndex >> 3) * intensityStep;

			if (paletteIndex & 7) {
				i = (i + intensityStep) - 1;
				var r = Math.floor(i * ((paletteIndex & 0x02) >> 1));
				var g = Math.floor(i * ((paletteIndex & 0x04) >> 2));
				var b = Math.floor(i * (paletteIndex & 0x01));

				var rgb = `rgb(${r}, ${g}, ${b})`;
			}
			else {
				// greyscale
				i = i
				var rgb = `rgb(${i}, ${i}, ${i})`;
			}
			
			systemPalette[paletteIndex] = rgb;
		}
	}

	this.systemPalette = new SystemPalette(system_bpp, systemPalette);
}
