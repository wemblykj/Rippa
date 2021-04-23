export var Palette = function() {
    this.colourDepth = undefined;
    this.toRGB = function(index) {
        undefined;
    }
}

export var IndexedPalette = function(colourDepth, systemPalette = null, lut = null) {
    var _systemPalette = systemPalette;
    var _lut = lut;

    this.colourDepth = colourDepth;
    var mask = ((2**this.colourDepth)-1);
    
    this.setSystemPalette = function(systemPalette) {
        _systemPalette = systemPalette;
    }

    this.setLUT = function(lut) {
        _lut = lut;
    }

    this.toRGB = function(index) {
        return _systemPalette.toRGB(this.ToIndex(index));
    }
    this.ToIndex = function(index) {
        var i = index & mask;
        return _lut[i];
    };
}
IndexedPalette.prototype = new Palette();
IndexedPalette.construct = IndexedPalette;

export var RGBPalette = function(colourDepth, rgbArray = null) {
    var _rgbArray = rgbArray;

    this.colourDepth = colourDepth;
    var mask = ((2**this.colourDepth)-1);

    this.setRGBArray = function(rgbArray) {
        _rgbArray = rgbArray;
    }

    this.toRGB = function(colourIndex) {
      var colourIndex = colourIndex & mask;
      return _rgbArray[colourIndex];
    };
}
RGBPalette.prototype = new Palette();
RGBPalette.construct = RGBPalette;
