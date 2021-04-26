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
  
export var PixelPacking = function(planeCount) {
    //this.planeCount = planeCount;
    //this.planesPerByte = 8/planeCount; 
    this.packing = 0;
    this.littleEndian = false;
    this.decode = async function(stream) {
      undefined;
    }
    this.setPlaneCount = function(planeCount) {
      this.planeCount = planeCount
      this.planesPerByte = 8/planeCount; 
    };

    this.setPlaneCount(planeCount);
}

export var PalettePacking = function() {
  this.colourDepth = undefined;
  this.decode = function(stream) {
    undefined;
  }
}

export var PalettePackingIndex = function(span, systemPalette) {
  this.span = span;
  var systemPalette = systemPalette;

  this.decode = async function(byteStream) {
    var colourIndex = 0;
    var byteCount = this.span;
    var index = 0;
    while (byteCount-- > 0) {
      await byteStream.getByte().then(byte => { colourIndex |= (byte << (8 * index)); });
      ++index;   
    }

    return colourIndex & ((2**systemPalette.colourDepth)-1);
  }
  this.toRGB = function(colour) {
    return systemPalette.toRGB(colour);
  }
}
PalettePackingIndex.prototype = new PalettePacking();
PalettePackingIndex.construct = PalettePackingIndex;

export var PalettePackingRGBA = function(packing = "rrrrrrrrggggggggbbbbbbbbaaaaaaaa") {
  this.colourDepth = undefined;
  this.packing = packing;
  this.span = packing.length / 8;

  this.decode = async function(byteStream) {
    var r = 0;
    var g = 0;
    var b = 0;
    var a = 0;
    
    var byteCount = this.span;
    var index = 0;
    while (byteCount-- > 0) {
      var bitCount = 8;
      await byteStream.getByte().then(btye => {
        while (bitCount-- > 0) {
          var mask = 1 << bitCount;
          var bit = (byte & mask) ? 1 : 0
          //--bitCount;
          switch(packing[index]) {
            case 'x':
              break;
            case 'r':
              r <<= 1;
              r |= bit;
              break;
            case 'g':
              g <<= 1;
              g |= bit;
              break;
            case 'b':
              b <<= 1;
              b |= bit;
              break;
            case 'a':
              a <<= 1;
              a |= bit;
              break;
            default:
              undefined;   
          }
        }
      });
    }

    return (this.alphaDepth > 0) ? new Common.RGBA(r, g, b, a) : new Common.RGB(r, g, b); 
  }
  this.toRGB = function(colour) {
    return colour.toRGB();
  }
  this.setPacking = function(packing) {
    var index;
    this.colourDepth = 0;
    this.alphaDepth = 0;
    for (index = 0; index < packing.length; ++index) {
      switch(packing[index]) {
        case 'x':
          break;
        case 'r':
        case 'g':
        case 'b':
          ++this.colourDepth;
          break;
        case 'a':
          ++this.alphaDepth;
          break;
        default:
          undefined;
      }
    }
  }

  this.setPacking(packing);
}
PalettePackingRGBA.prototype = new PalettePacking();
PalettePackingRGBA.construct = PalettePackingRGBA;

export var PaletteSearchAttributes = function(packing) {
	this.packing = packing;
}

export var TileSearchAttributes = function(w, h, planeCount) {
	this.tile = new Tile(w, h);
	this.packing = new PixelPacking(planeCount);
}
