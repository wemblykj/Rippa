import {RenderContext} from "../Canvas/RenderContext.js"

var PaletteContext = function(attributes) {
	this.blob = null;
	this.attributes = attributes;
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
			
			if (context.clear) {
				var ctx = canvas.getContext('2d');
				ctx.clearRect(0, 0, canvas.width, canvas.height);
			}

			await this.renderTiles(context, canvas, offset);
			
			context.endRender();
		}
	}
	this.renderTiles = async function(context, canvas, offset) {
		var attr = context.attributes;
        var packing = attr.packing;
        var view = attr.view;
        

        var th = (8 * view.zoom.v) + view.spacing.v;
        var maxRows = Math.max(1, Math.floor((canvas.height - (2 * view.margin.v)) / th));
        var tw = (8 * view.zoom.h) + view.spacing.h;
		var maxColumns = Math.max(1, Math.floor((canvas.width - (2 * view.margin.h)) / tw));	

        if (context.clear) {
			var ctx = canvas.getContext('2d');

            var bw = 2 * view.margin.h + (maxColumns * tw);
            var bh = 2 * view.margin.v + (maxRows * th);
        
            ctx.fillStyle = 'rgb(80, 80, 80)';
            ctx.fillRect(0,0, bw, bh);
        }
        
        var cy = view.margin.v;
        
		/*var row;
		for (row = 0; row < maxRows; ++row) {
			if (tileContext.terminateRendering)
				break;

            var cx = view.margin.h;
        
			await this.renderRow(tileContext, canvas, cx, cy, offset);
			
			offset += (tile.size.w * maxColumns * tile.size.h) / packing.pixelsPerByte;
			cy += th;
        }*/
    }
}
