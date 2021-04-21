export var Palette = function() {
    this.bitsPerPixel = undefined;
    this.ToRGB = function(index) {
        undefined;
    }
}

export var IndexedPalette = function(bitsPerPixel, systemPalette = null, lut = null) {
    var _systemPalette = systemPalette;
    var _lut = lut;

    this.bitsPerPixel = bitsPerPixel;
    
    this.setSystemPalette = function(systemPalette) {
        _systemPalette = systemPalette;
    }

    this.setLUT = function(lut) {
        _lut = lut;
    }

    this.ToRGB = function(index) {
        return _systemPalette.ToRGB(this.ToIndex(index));
    }
    this.ToIndex = function(index) {
        var i = index & ((2**this.bitsPerPixel)-1);
        return _lut[i];
    };
}
IndexedPalette.prototype = new Palette();
IndexedPalette.construct = IndexedPalette;

export var RGBPalette = function(bitsPerPixel, rgbArray = null) {
    var _rgbArray = rgbArray;

    this.bitsPerPixel = bitsPerPixel;
    
    this.setRGBArray = function(rgbArray) {
        _rgbArray = rgbArray;
    }

    this.ToRGB = function(index) {
      var i = index & ((2**this.bitsPerPixel)-1);
      return _rgbArray[i];
    };
}
RGBPalette.prototype = new Palette();
RGBPalette.construct = RGBPalette;
