import {Preset} from "../Rippa/Preset.js"
import {Attributes} from "../Rippa/Attributes.js"
import * as Graphics from "../Graphics/Palette.js"

export var MSX2Screen = function(name) {
	this.name = name;

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

	this.systemPalette = new Graphics.RGBPalette(9, systemPalette);

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
	
	this.tilePalette = new Graphics.IndexedPalette(4, this.systemPalette, tilePalette);

	this.attributes = new Attributes(256, 212, 4);
}

MSX2Screen.prototype = new Preset();
MSX2Screen.prototype.construct = MSX2Screen;
