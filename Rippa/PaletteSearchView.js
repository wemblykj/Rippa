import * as Common from "../Rippa/Common.js"
import {RenderContext as BaseRenderContext} from "../Graphics/RenderContext.js"
import * as Model from "../Rippa/Model.js"
import { ByteStream } from "./ByteStream.js";

var ViewAttributes = function() {
    this.margin = new Common.Axis(2, 2);
    this.spacing = new Common.Axis(1, 1);
    this.zoom = new Common.Axis(1, 1);
	this.backgroundColour = new Common.RGB(80, 80, 80);
}

var RenderContext = function(model = undefined) {
	this.model = model;
	this.view = new ViewAttributes();
	this.nav = new Model.Navigation();
	this.blob = null;
	this.bindBinary = function(blob) {
		if (blob != this.blob) {
			this.blob = blob;
			this.invalidate();
		}
	}
	this.onBeginRender = async function() {
	}
}
RenderContext.prototype = new BaseRenderContext();
RenderContext.construct = RenderContext;

export var PaletteSearchView = function() {
	this.createContext = function(model = undefined) {
        return new RenderContext(model);
    }
	this.createModel = function() {
        return new Model.PaletteSearchAttributes();
    }
	this.createViewAttributes = function() {
        return new ViewAttributes();
    }
	this.render = async function(context, canvas) {
		if (context && canvas) {
			await context.beginRender();
			
			//if (context.invalidated) {
				var ctx = canvas.getContext('2d');
				ctx.clearRect(0, 0, canvas.width, canvas.height);
			//}

			await this.renderTiles(context, canvas);
			
			context.endRender();
		}
	}
	this.renderTiles = async function(context, canvas) {
		var view = context.view;
		var nav = context.nav;
		var blob = context.blob;
		var packing = context.model.packing;
		var palette = context.palette;

		var best_size = 8;
		var temp_size = best_size;
		var tooBig = false;
		var tooSmall = false;
		
		var start = nav.offset;
		var size = blob.size - start;
		if (nav.size > 0) {
			size = Math.min(size, nav.size);
		}
		
		var count = Math.floor(size / packing.span);
		count = Math.min(count, 4096);

		var maxTile = 0;

		while(true) {
			var hstride = temp_size + view.spacing.v;
			var vstride = temp_size + view.spacing.h;
			// for multiples of 4 tiles
			var maxColumns = Math.max(4, 8 * Math.floor((canvas.width - (2 * view.margin.h)) / (hstride*8)));	
			var maxRows = Math.max(1, Math.floor((canvas.height - (2 * view.margin.v)) / vstride));
			
			maxTile = maxRows*maxColumns;
			if (count == maxTile) {
				break;
			} else if (count > maxTile) {
				/*if (tooSmall) {
					break;
				}*/
				tooBig = true;
				if (temp_size > 4) {
					--temp_size;
				} else {
					count = maxTile;
					best_size = temp_size;
					break;
				}
			} else {
				best_size = temp_size;
				if (tooBig) {
					break;
				}
				
				tooSmall = true;
				++temp_size;
			}			
		};
		
		var end = start + (count * packing.span);

		var tw = best_size;
		var th = best_size;

		var ctx = canvas.getContext('2d');

		/*
        //if (context.invalidated) {
            var bw = 2 * view.margin.h + (maxColumns * hstride);
            var bh = 2 * view.margin.v + (maxRows * vstride);
        
            ctx.fillStyle = view.backgroundColour.toHtml();
            ctx.fillRect(0,0, bw, bh);
        //}
		*/
        
        var cy = view.margin.v;
        var cx = view.margin.h;

		var stream = blob.slice(start, end).stream();
		var byteStream = new ByteStream(stream);					

		var index = 0;
		for (index = 0; index < count; ++index) {
			if (await byteStream.isEos()) {
				break;
			}
			
			var colour = await packing.decode(byteStream);
			var rgb = packing.toRGB(colour)
			
			var row = Math.floor(index / maxColumns) % maxRows;
			var column = index % maxColumns;
			var y = cy + (row * vstride);
			var x = cx + (column * hstride);

			// draw resultant tile
			ctx.fillStyle = rgb.toHtml();
			ctx.fillRect(x, y, tw, th);
		}
    }
}
