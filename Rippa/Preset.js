export var Preset = function(name, attributes) {
	this.name = name;
	this.attributes = attributes;
    this.tileOffset = 0;
    this.paletteOffset = 0;
}

export var Presets = function() {
	this.presets = [];
	this.getPresetNames = function() {
		var presets = []
		this.presets.forEach(value => presets.push(value.name));
		return presets;
	}
}