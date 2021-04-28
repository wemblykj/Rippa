import * as Common from "../Rippa/Common.js"
import {RenderContext as BaseRenderContext} from "../Graphics/RenderContext.js"

var ViewAttributes = function() {
    this.margin = new Common.Axis(2, 2);
    this.spacing = new Common.Axis(1, 1);
    this.zoom = new Common.Axis(1, 1);
}

var RenderContext = function() {
	this.view = new ViewAttributes();
	this.onBeginRender = async function() {
	}
}
RenderContext.prototype = new BaseRenderContext();
RenderContext.construct = RenderContext;

export var PaletteView = function() {
	this.createContext = function() {
        return new RenderContext();
    }
	this.render = async function(context, canvas) {
		if (context && canvas) {
			await context.beginRender();
			
			if (context.invalidated) {
				var ctx = canvas.getContext('2d');
				ctx.clearRect(0, 0, canvas.width, canvas.height);
			}

			await this.renderTiles(context, canvas);
			
			context.endRender();
		}
	}
	this.renderTiles = async function(context, canvas) {
		var view = context.view;
		var palette = context.palette;

		var count = 2**palette.colourDepth;
		var best_size = 8;
		var temp_size = best_size;
		var tooBig = false;
		var tooSmall = false;
		
		while(true) {
			var hstride = temp_size + view.spacing.v;
			var vstride = temp_size + view.spacing.h;
			// for multiples of 4 tiles
			var maxColumns = Math.max(4, 8 * Math.floor((canvas.width - (2 * view.margin.h)) / (hstride*8)));	
			var maxRows = Math.max(1, Math.floor((canvas.height - (2 * view.margin.v)) / vstride));
			
			var maxTile = maxRows*maxColumns;
			if (count == maxTile) {
				break;
			} else if (count > maxTile) {
				/*if (tooSmall) {
					break;
				}*/
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

        /*if (context.invalidated) {
            var bw = 2 * view.margin.h + (maxColumns * hstride);
            var bh = 2 * view.margin.v + (maxRows * vstride);
        
            ctx.fillStyle = 'rgb(80, 80, 80)';
            ctx.fillRect(0,0, bw, bh);
        }*/
        
        var cy = view.margin.v;
        var cx = view.margin.h;

		var paletteIndex = 0;
		for (paletteIndex = 0; paletteIndex < count; ++paletteIndex) {
			var row = Math.floor(paletteIndex/maxColumns) % maxRows;
			var column = paletteIndex % maxColumns;
			var y = cy + (row * vstride);
			var x = cx + (column * hstride);

			// draw resultant tile
			ctx.fillStyle = palette.toRGB(paletteIndex).toHtml();
			ctx.fillRect(x, y, tw, th);
		}
    }
}
