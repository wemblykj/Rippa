import * as Common from "../Rippa/Common.js"
import {RenderContext} from "../Canvas/RenderContext.js"

var ViewAttributes = function() {
    this.margin = new Common.Axis(2, 2);
    this.spacing = new Common.Axis(1, 1);
    this.zoom = new Common.Axis(1, 1);
}

var PaletteContext = function(attributes) {
	this.blob = null;
	this.attributes = attributes;
	this.view = new ViewAttributes();
	this.nav = new Common.Navigation();
	this.onBeginRender = async function() {
	}
}
PaletteContext.prototype = new RenderContext();
PaletteContext.construct = PaletteContext;

export var PaletteView = function() {
	this.createContext = function(attributes) {
        return new PaletteContext(attributes);
    }
	this.render = async function(context, canvas) {
		if (context && canvas) {
			await context.beginRender();
			
			if (context.invalidate) {
				var ctx = canvas.getContext('2d');
				ctx.clearRect(0, 0, canvas.width, canvas.height);
			}

			await this.renderTiles(context, canvas);
			
			context.endRender();
		}
	}
	this.renderTiles = async function(context, canvas, indexedPalette = null) {
		var view = context.view;
		var attr = context.attributes;
        var packing = attr.packing;
		var systemPalette = attr.systemPalette;

		var count = 2**(indexedPalette ? indexedPalette.bpp : systemPalette.bpp);
		var best_size = 8;
		var temp_size = best_size;
		var tooBig = false;
		var tooSmall = false;
		
		while(true) {
			var hstride = temp_size + view.spacing.v;
			var vstride = temp_size + view.spacing.h;
			// for multiples of 8 tiles
			var maxColumns = 8 * Math.max(1, Math.floor((canvas.width - (2 * view.margin.h)) / (hstride*8)));	
			var maxRows = Math.max(1, Math.floor((canvas.height - (2 * view.margin.v)) / vstride));
			
			if (count > (maxRows*maxColumns)) {
				if (tooSmall) {
					break;
				}
				tooBig = true;
				--temp_size;
			} else {
				best_size = temp_size;
				if (tooBig) {
					break;
				}
				
				tooSmall = true;
				++temp_size;
			}			
		};
		
		var tw = best_size;
		var th = best_size;

		var ctx = canvas.getContext('2d');

        if (context.invalidate) {
            var bw = 2 * view.margin.h + (maxColumns * hstride);
            var bh = 2 * view.margin.v + (maxRows * vstride);
        
            ctx.fillStyle = 'rgb(80, 80, 80)';
            ctx.fillRect(0,0, bw, bh);
        }
        
        var cy = view.margin.v;
        var cx = view.margin.h;

		var paletteIndex = 0;
		var row;
		for (row = 0; row < maxRows; ++row) {
			var y = cy + (row * vstride);

			var column;
			for (column = 0; column < maxColumns; ++column) {
				var x = cx + (column * hstride);
				// draw resultant pixel
				ctx.fillStyle = systemPalette.ToRGB(paletteIndex++);							
				ctx.fillRect(x, y, tw, th);
			}
			
		}
    }
}
