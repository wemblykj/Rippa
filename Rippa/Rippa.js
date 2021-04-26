import * as PaletteView from "./PaletteView.js"
import * as PaletteSearchView from "./PaletteSearchView.js"
import * as TileSearchView from "./TileSearchView.js"
import {MSX2Screen} from "../Preset/Msx2.js"

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

export function Rippa() {
	
	this.getPresetByName = function(presetName) {
		if(presetName == "MSX2Screen") {
			var preset = new MSX2Screen();
			return preset;
		}
	}
	this.createPaletteView = function(attributes) {
        return new PaletteView.PaletteView();
    }	
	this.createPaletteSearchView = function(attributes) {
        return new PaletteSearchView.PaletteSearchView();
    }	
	this.createTileSearchView = function(attributes) {
        return new TileSearchView.TileSearchView();
    }
};