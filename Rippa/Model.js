import * as Common from "./Common.js"

export var Navigation = function(offset = 0, size=-1) {
  this.offset = offset;
  this.size = size;
}

export var Tile = function(w, h) {
    this.width = w;
    this.height = h;
    this.size = w * h;
  }
  
export var Packing = function(planeCount) {
    this.planeCount = planeCount;
    this.planesPerByte = 8/planeCount; 
    this.packing = 0;
    this.littleEndian = false;
    this.setPlaneCount = function(planeCount) {
      this.planeCount = planeCount
      this.planesPerByte = 8/planeCount; 
    };
}

export var PaletteSearchAttributes = function(planeCount) {
	this.navigation = new Navigation();
	this.packing = new Packing(planeCount);
}

export var TileSearchAttributes = function(w, h, planeCount) {
	this.tile = new Tile(w, h);
	this.packing = new Packing(planeCount);
}
