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

export var Attributes = function(w, h, packing_bpp) {
	this.tile = new TileAttributes(w, h);
	this.packing = new PlaneAttributes(packing_bpp);
}
