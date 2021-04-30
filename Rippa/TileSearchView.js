import * as Common from "../Rippa/Common.js"
import * as Model from "../Rippa/Model.js"
import {RenderContext as BaseRenderContext} from "../Graphics/RenderContext.js"

var ViewAttributes = function(planeMask = 0xff) {
    this.margin = new Common.Axis(2, 2);
    this.spacing = new Common.Axis(2, 2);
    this.planeMask = planeMask;
    this.zoom = new Common.Axis(1, 1);
}
    
var RenderContext = function(model) {
	this.model = model;
    this.view = new ViewAttributes();
	this.blob = null;
    this.slice = new Model.Slice();
	this.maxConcurrentTiles = 4;
	this.bindBinary = function(blob) {
		if (blob != this.blob) {
			this.blob = blob;
			this.invalidate();
		}
	}
	this.bindModel = async function(model) {
		this.model = model;
	}
	this.bindViewAttributes = async function(attributes) {
		this.view = attributes;
	}
 	this.onBeginRender = async function() {
		// just ensure tile semephore is reset
		this.tilePromise = null;
		this.tileCount = 0;
	}
	this.beginTile = async function() {
		if (this.tileCount > this.maxConcurrentTiles) {
			if (this.tilePromise !== null)
				await this.tilePromise;
		}
		
		if (++this.tileCount > this.maxConcurrentTiles) {
			this.tilePromise = new Promise(resolve => { this.tileResolveFn = resolve });
		}
	}
	this.endTile = async function() {
		if (--this.tileCount == this.maxConcurrentTiles) {
			this.tileResolveFn();
		}
	}
}
RenderContext.prototype = new BaseRenderContext();
RenderContext.construct = RenderContext;

export var TileSearchView = function() {
	this.createContext = function(model = undefined) {
        return new RenderContext(model);
    }
	this.createModel = function() {
        return new Model.TileSearchAttributes();
    }
	this.createViewAttributes = function() {
        return new ViewAttributes();
    }
    this.render = async function(context, canvas) {	
		if (context && canvas) {
			await context.beginRender();
			
			var offset = context.slice.offset;
			
			if (context.invalidated) {
				var ctx = canvas.getContext('2d');
				ctx.clearRect(0, 0, canvas.width, canvas.height);
			}

			await this.renderTiles(context, canvas, offset);
			
			context.endRender();
		}
    }
    
    this.renderTiles = async function(context, canvas, offset) {
        var view = context.view;
		var model = context.model;
        var tile = model.tile;
        var packing = model.packing;
        
        var th = (tile.height * view.zoom.v) + view.spacing.v;
        var maxRows = Math.max(1, Math.floor((canvas.height - (2 * view.margin.v)) / th));
        var tw = (tile.width * view.zoom.h) + view.spacing.h;
		var maxColumns = Math.max(1, Math.floor((canvas.width - (2 * view.margin.h)) / tw));	

        /*if (context.invalidated) {
			var ctx = canvas.getContext('2d');

            var bw = 2 * view.margin.h + (maxColumns * tw);
            var bh = 2 * view.margin.v + (maxRows * th);
        
            ctx.fillStyle = 'rgb(80, 80, 80)';
            ctx.fillRect(0,0, bw, bh);
        }*/
        
        var cy = view.margin.v;
        
		var row;
		for (row = 0; row < maxRows; ++row) {
			if (context.terminateRendering)
				break;

            var cx = view.margin.h;
        
			await this.renderRow(context, canvas, cx, cy, offset);
			
			offset += (tile.width * maxColumns * tile.height) / packing.planesPerByte;
			cy += th;
        }
    }
    
	this.renderRow = async function(context, canvas, cx, cy, offset) {
        var blob = context.blob;
		var view = context.view;
		var model = context.model;
        var tile = model.tile;
        var packing = model.packing;
        
        var tw = (tile.width * view.zoom.h) + view.spacing.h;
        //var th = (tile.size.h * view.zoom.v) + view.spacing.v;
        var maxColumns = Math.max(1, Math.floor((canvas.width - (2 * view.margin.h)) / tw));
        //var maxRows = Math.floor((canvas.height - (2 * view.margin.v)) / th);
        //var bw = 2 * view.margin.h + (maxColumns * tw);
        //var bh = 2 * view.margin.v + (maxRows * th);
		
		let promises = [];
		
		var column;
		for (column = 0; column < maxColumns; ++column) {
			if (context.terminateRendering)
				break;

			if (offset < blob.size) {
				await context.beginTile();
				this.drawTile(context, canvas, offset, cx, cy).then(() => context.endTile() );
				
				offset += (tile.size) / packing.planesPerByte;
				cx += tw;
			} else {
				break;
			}
		}
	}
	
    this.drawTile = async function(context, canvas, offset, cx, cy) {
		var blob = context.blob;
		var palette = context.palette;
		var view = context.view;
		var model = context.model;
        var tile = model.tile;
        var packing = model.packing;
        
		var start = offset;// + (tile.stride * rowIndex) / packing.planesPerByte;
		var end = start + (tile.size) / packing.planesPerByte;
			
		var tileData = blob.slice(start, end);					
		return tileData.arrayBuffer().then(buffer => {
						
			var lineData = new Uint8Array(buffer)
								
			// now draw the tile		
			var rowIndex;
			for (rowIndex = 0; rowIndex < tile.height; ++rowIndex) {
				if (context.terminateRendering)
					break;

				var y = cy + (rowIndex * view.zoom.v);
			
				var rowOfs = (tile.width * rowIndex) / packing.planesPerByte;
				
				switch(packing.packing) {
					case 0: 
					case 1: 
						// interleaved
						
						// get single contiguous line buffer for all planes
						// ABCDABCD ABCDABCD ABCDABCD ABCDABCD or
						//start = offset + (tile.stride * rowIndex) / packing.planesPerByte;
						//end = start + tile.size.w;

						//tileData = blob.slice(start, end);					
						//tileData.arrayBuffer().then(buffer => {
						
							//lineData = new Uint8Array(buffer)
							
							// pre-calculate some constants
							var nsm = (2**packing.planeCount) - 1;    // non-shifted mask

							var columnIndex;
							for (columnIndex = 0; columnIndex < tile.width; ++columnIndex) {
								if (context.terminateRendering)
									break;

								// initalise our pixel [ABCD]
								var pixel = 0;
								
								if (packing.packing == 0) {
									// planes are packed in a single byte (assuming not supporting planes over 8-bits)
									// e.g. for eight packed pixels:
									// ABCDEFGH ABCDEFGH ABCDEFGH ABCDEFGH ABCDEFGH ABCDEFGH ABCDEFGH ABCDEFGH 8-bit
									// ABCDABCD ABCDABCD ABCDABCD ABCDABCD  4-bit
									// ABABABAB ABABABAB  2-bit
									var ofs = rowOfs + Math.floor(columnIndex / packing.planesPerByte);
									var tileByte = lineData[ofs];

									if (packing.planesPerByte > 1) {
										if (packing.endian == 0) {
										  var lsb = Math.floor(columnIndex % packing.planesPerByte) * packing.planeCount;		
										  //var mask = nsm << lsb;
										  pixel = (tileByte >> lsb) & nsm; 
										} else {
											var lsb = 8-packing.planeCount-(Math.floor(columnIndex % packing.planesPerByte) * packing.planeCount);		
											//var mask = nsm << lsb;
											pixel = (tileByte >> lsb) & nsm; 
										}
									} else {
									  pixel = tileByte; 
									}

								} else {
									// planes [A,B,C and D] are spread across interleaved bytes
									// AAAAAAAA BBBBBBBB CCCCCCCC DDDDDDDD
									var planeIndex;
									for (planeIndex = 0; planeIndex < packing.planeCount; ++planeIndex) {
										if (this.terminateRendering)
											break;

										var mask = 1 << planeIndex;
										
										if ((mask & view.planeMask) != 0) {
											var ofs = rowOfs + Math.floor(columnIndex / packing.planeCount);
										
											var tileByte = lineData[ofs];
											var planeData = (tileByte &  mask);
											pixel |= planeData;
										}
									}
								}

								// apply plane view mask
								pixel &= view.planeMask;
								
								var ctx = canvas.getContext('2d');
								
								// draw resultant pixel
								ctx.fillStyle = palette.toRGB(pixel).toHtml();
										  
								var x = cx + (columnIndex * view.zoom.h);
								ctx.fillRect(x, y, view.zoom.h, view.zoom.v);	
							} // for each column
						//});
					break; // case Interleaved
				} // switch packing
			} // for each row
		}); // array buffer
    }
}
