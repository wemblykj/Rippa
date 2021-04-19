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
    
    this.BindSystemPalette = function(systemPalette) {
        _systemPalette = systemPalette;
    }

    this.BindLUT = function(lut) {
        _lut = lut;
    }

    this.ToRGB = function(index) {
        _systemPalette.ToRGB(this.ToIndex(index));
    }
    this.ToIndex = function(index) {
        var i = index & ((2**this.bitsPerPixel)-1);
        return _lut[i];
    };
}
IndexedPalette.prototype = new Palette();
IndexedPalette.construct = IndexedPalette;

export var SystemPalette = function(bitsPerPixel, rgbArray = null) {
    var _rgbArray = rgbArray;

    this.bitsPerPixel = bitsPerPixel;
    
    this.BindRGBArray = function(rgbArray) {
        _rgbArray = rgbArray;
    }

    this.ToRGB = function(index) {
      var i = index & ((2**this.bitsPerPixel)-1);
      return rgbArray[i];
    };
}
SystemPalette.prototype = new Palette();
SystemPalette.construct = SystemPalette;
