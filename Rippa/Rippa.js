import * as Common from "./Common.js"
import * as TileView from "./TileView.js"
import * as PaletteView from "./PaletteView.js"

/*
 For reference, the MSX2 screen 5 (mode 4) layout

 SCREEN 5, 6 / GRAPHIC 4, 5
Address range	Usage
0000H - 5FFFH	Pattern name table (192 lines)
0000H - 69FFH	Pattern name table (212 lines)
7400H - 75FFH	Sprite colour table
7600H - 767FH	Sprite attribute table
7680H - 76AFH	Palette table
7A00H - 7FFFH	Sprite generator table
*/


var Navigation = function(offset = 0) {
  this.offset = offset;
}

var TileAttributes = function(w, h) {
  this.size = new Common.Size(w, h);
  this.stride = w;
}

var PlaneAttributes = function(planeCount) {
  this.planeCount = planeCount;
  this.pixelsPerByte = 8/planeCount; 
  this.packing = 0;
  this.endian = 1;
  this.setPlaneCount = function(planeCount) {
	this.planeCount = planeCount
	this.pixelsPerByte = 8/planeCount; 
  };
}

var ViewAttributes = function(planeMask = 0xff) {
  this.margin = new Common.Axis(2, 2);
  this.spacing = new Common.Axis(2, 2);
  this.planeMask = planeMask;
  this.zoom = new Common.Axis(1, 1);
  this.clearReq = true;
  this.clear = false;
}

var IndexedPalette = function(bitsPerPixel, lut) {
	this.bpp = bitsPerPixel;
	this.lut = lut;
	this.ToIndex = function(index) {
		var i = index & ((2**this.bpp)-1);
		return this.lut[i];
	  };
}

var SystemPalette = function(bitsPerPixel, rgbArray) {
  this.bpp = bitsPerPixel;
  this.rgbArray = rgbArray;
  this.ToRGB = function(index) {
	var i = index & ((2**this.bpp)-1);
	return this.rgbArray[i];
  };
}

/*var Queue = function(fifoSize) {
	this._head = 0;
	this._tail = 0;
	this.buffer = new UInt8Buffer(fifoSize);
	this.enqueue = function(data) {
		this.buffer[this._tail]
		while(this._tail)
	}
}

var ByteStream = function(stream, fifoSize) {
	this.stream = stream;
	this.reader = stream.getReader();
	this.fifoSize = fifoSize;
	this.threashold = fifoSize / 2;
	this.count = 0;
	this.buffer = new UInt8Buffer(fifoSize)
	
	this.eos = false;
	
	this.getByte = function() {
		if (this.count > 0) {
			var byte = buffer[this.tail];
			this.tail = (this.tail + 1) % this.fifoSize;
			--this.count;

			if (this.count < this.threashold)
				!(result = await reader.read())
			return byte;
		}
			
		if (this.fifoEmpty)
			throw new Error("End of stream");
		readBufferPromise = reader.read().then();

		this.getByte = function() {

		}
	};
	
}*/

var Attributes = function(w, h, tile_bpp, system_bpp, tilePalette = null, systemPalette = null) {
	this.tileNav = new Navigation();
	this.tilePaletteNav = new Navigation();
	
	this.tile = new TileAttributes(w, h);
	this.view = new ViewAttributes();
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

var Preset = function(name, attributes) {
	this.name = name;
	this.attributes = attributes;
}

var MSX2ScreenPreset = function(name) {
	this.name = name;

	// MSX2 palette at reset
	var tilePalette = [ 
		0x000, 
		0x000,
		0x189, 	// 110_001_001 => 1_1000_1001
		0x1db, 	// 111_011_011 => 1_1101_1011
		0x04f, 	// 001_001_111 => 0_0100_1111
		0x0d7, 	// 011_010_111 => 0_1101_0111
		0x069, 	// 001_101_001 => 0_0110_1001
		0x19f, 	// 110_011_111 => 1_1001_1111
		0x079, 	// 001_111_001 => 0_0111_1001
		0x0fb, 	// 011_111_011 => 0_1111_1011
		0x1b1, 	// 110_110_001 => 1_1011_0001
		0x1b4, 	// 110_110_100 => 1_1011_0100
		0x109, 	// 100_001_001 => 1_0000_1001
		0x0b5, 	// 010_110_101 => 0_1011_0101
		0x16d, 	// 101_101_101 => 1_0110_1101
		0x1ff 	// 111_111_111 => 1_1111_1111
	];
	
	var systemPalette = [];
	var step_n = 255.0;
	var step_d = 7.0;
	var paletteIndex;
	for (paletteIndex = 0; paletteIndex < 512; ++paletteIndex) {
		var b = Math.floor((step_n * (paletteIndex & 0x07)) / step_d);
		var r = Math.floor((step_n * ((paletteIndex >> 3) & 0x07)) / step_d);
		var g = Math.floor((step_n * ((paletteIndex >> 6) & 0x07)) / step_d);

		var rgb = `rgb(${r}, ${g}, ${b})`;

		systemPalette[paletteIndex] = rgb;
	}

	this.attributes = new Attributes(256, 212, 4, 9, tilePalette, systemPalette);
}

var Presets = function() {
	this.presets = [];
	this.getPresetNames = function() {
		var presets = []
		this.presets.forEach(value => presets.push(value.name));
		return presets;
	}
}


export function Rippa() {
	
	this.createAttributesFromPreset = function(presetName) {
		if(presetName == "MSX2Screen") {
			var preset = new MSX2ScreenPreset();
			return preset.attributes;
		}
	}
	this.createTileView = function(attributes) {
        return new TileView.TileView();
    }
	this.createPaletteView = function(attributes) {
        return new PaletteView.PaletteView();
    }	
};