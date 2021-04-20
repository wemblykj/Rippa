import * as Common from "./Common.js"
import * as TileView from "./TileView.js"
import * as PaletteView from "./PaletteView.js"
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

export function Rippa() {
	
	this.getPresetByName = function(presetName) {
		if(presetName == "MSX2Screen") {
			var preset = new MSX2Screen();
			return preset;
		}
	}
	this.createTileView = function(attributes) {
        return new TileView.TileView();
    }
	this.createPaletteView = function(attributes) {
        return new PaletteView.PaletteView();
    }	
};