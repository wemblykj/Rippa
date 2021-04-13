import {AsyncSemaphore} from './AsyncSemaphore.js';

var Context = function() {
	this.blob = null;
	
	this.navigation = new Navigation();
	
	this.tileAttr = new TileAttributes(8, 8);
	
	this.viewAttr = new ViewAttributes();
	
	this.planeAttr = new PlaneAttributes(8);
	
	var rgbArray = [];//['rgb(255, 255, 255)'];
	var paletteIndex;
	var bpp = 4;
	for (paletteIndex = 0; paletteIndex < (2**bpp); ++paletteIndex) {
		var intensity = (((paletteIndex >> 3)+1)<<(11-bpp))-1;
		var r = intensity * ((paletteIndex & 0x02) >> 1);
		var g = intensity * ((paletteIndex & 0x04) >> 2);
		var b = intensity * (paletteIndex & 0x01);
		
		var rgb = `rgb(${r}, ${g}, ${b})`;
		
		rgbArray[paletteIndex] = rgb;
	}
	
	this.palette = new Palette(bpp, rgbArray);
}

var Axis = function(h, v) {
  this.h = h;
  this.v = v;
}

var Size = function(w, h) {
  this.w = w;
  this.h = h;
}

var Rect = function(t, l, w, h) {
  this.t = t;
  this.l = l;
  this.w = w;
  this.h = h;
}

var Point = function(x, y) {
  this.x = x;
  this.y = y;
}

var Navigation = function(offset = 0) {
  this.offset = offset;
}

var TileAttributes = function(w, h) {
  this.size = new Size(w, h);
  this.stride = w;
}

var PlaneAttributes = function(planeCount) {
  this.planeCount = planeCount;
  this.pixelsPerByte = 8/planeCount; 
  this.packing = 0;
  this.endian = 1;
  this.setPlaneCount = function(planeCount) {
	this.planeCount = planeCount
	this.pixelsPerByte = 8/planeCount; 
  };
}

var ViewAttributes = function(planeMask = 0xff) {
  this.margin = new Axis(2, 2);
  this.spacing = new Axis(2, 2);
  this.planeMask = planeMask;
  this.zoom = new Axis(1, 1);
  this.clearReq = true;
  this.clear = false;
}

var Palette = function(bitsPerPixel, rgbArray) {
  this.bpp = bitsPerPixel;
  this.rgbArray = rgbArray;
  this.ToRGB = function(index) {
	var i = index & ((2**this.bpp)-1);
	return this.rgbArray[i];
  };
}

var ByteStream = function(stream, fifoSize) {
	this.stream = stream;
	this.reader = stream.getReader();
	this.fifoSize = fifoSize;
	this.threashold = fifoSize / 2;
	this.count = 0;
	this.buffer = new UInt8Buffer(fifoSize)
	this.head = 0;
	this.tail = 0;
	
	this.getByte = function() {
		if (this.count > 0) {
			var byte = buffer[this.tail];
			this.tail = (this.tail + 1) % this.fifoSize;
			--this.count;

			if (this.count < this.threashold)
			return byte;
		}
			
		

		if (this.fifoEmpty)
			throw new Error("End of stream");
		readBufferPromise = reader.read().then();

		this.getByte = function()
	};
	
}

export function Rippa() {
	this.renderSemaphore = new AsyncSemaphore(1);	///< ensure we are not rendering more than one screen at a time
	this.tileSemaphore = new AsyncSemaphore(8);		///< limit the number of tiles drawn concurrently
	this.terminateRendering = false;
	
	this.invalidate = function(context) {
		context.viewAttr.clearReq = true;
	}

    this.render = async function(context, canvas) {
		
        if (canvas) {
            if(context) {
                var ctx = canvas.getContext('2d');

				this.terminateRendering = true;
				await this.renderSemaphore.awaitTerminate();
				
				var offset = context.navigation.offset;
				return this.renderSemaphore.withLockRunAndForget(async() => {
					this.terminateRendering = false;

					context.viewAttr.clear = context.viewAttr.clearReq; 
					context.viewAttr.clearReq = false; 

					if (context.viewAttr.clear) {
						ctx.clearRect(0, 0, canvas.width, canvas.height);
					}

					await this.renderTileView(context, ctx, offset);
				});
            }
        }
    };
    
    this.createContext = function() {
        var context = new Context();
        
        return context;
    }
    
    this.renderTileView = async function(context, ctx, offset) {
        var tile = context.tileAttr;
        var plane = context.planeAttr;
        var view = context.viewAttr;
        
        var th = (tile.size.h * view.zoom.v) + view.spacing.v;
        var maxRows = Math.floor((canvas.height - (2 * view.margin.v)) / th);
        
        if (context.viewAttr.clear) {
			var tw = (tile.size.w * view.zoom.h) + view.spacing.h;
        	var maxColumns = Math.floor((canvas.width - (2 * view.margin.h)) / tw);

            var bw = 2 * view.margin.h + (maxColumns * tw);
            var bh = 2 * view.margin.v + (maxRows * th);
        
            ctx.fillStyle = 'rgb(80, 80, 80)';
            ctx.fillRect(0,0, bw, bh);
        }
        
        var cy = view.margin.v;
        
		let promises = [];
		
        var row;
		for (row = 0; row < maxRows; ++row) {
			if (this.terminateRendering)
				break;

            var cx = view.margin.h;
        
			let promise = this.renderRow(context, ctx, cx, cy, offset);
			promises.push(promise);
			
			offset += (tile.size.w * maxColumns * tile.size.h) / plane.pixelsPerByte;
			cy += th;
        }
		
		return Promise.allSettled(promises);
    }
    
	this.renderRow = async function(context, ctx, cx, cy, offset) {
        var blob = context.blob;
        var tile = context.tileAttr;
        var plane = context.planeAttr;
        var view = context.viewAttr;
        
        var tw = (tile.size.w * view.zoom.h) + view.spacing.h;
        //var th = (tile.size.h * view.zoom.v) + view.spacing.v;
        var maxColumns = Math.floor((canvas.width - (2 * view.margin.h)) / tw);
        //var maxRows = Math.floor((canvas.height - (2 * view.margin.v)) / th);
        //var bw = 2 * view.margin.h + (maxColumns * tw);
        //var bh = 2 * view.margin.v + (maxRows * th);
		
		let promises = [];
		
		var column;
		for (column = 0; column < maxColumns; ++column) {
			if (this.terminateRendering)
				break;

			if (offset < blob.size) {
				// draw a placeholder tile to show that this tile is being processed
				//ctx.fillStyle = 'rgb(120,120,120)';
				//ctx.fillRect(cx, cy, tile.size.w * view.zoom.h, tile.size.h * view.zoom.v);

				//promises += new Promise(async() => await (async(cx, cy, offset) => {
				let promise = (async(cx, cy, offset) => {
					await this.tileSemaphore.withLockRunAndForget(async() => {
						if (!this.terminateRendering)
							await this.drawTile(context, ctx, offset, cx, cy);
					});
				})(cx, cy, offset);
				//let promise = this.drawTile(context, ctx, offset, cx, cy);
				promises.push(promise);				

				offset += (tile.size.w * tile.size.h) / plane.pixelsPerByte;
				cx += tw;
			} else {
				break;
			}
		}
		
		return Promise.allSettled(promises);
	}
	
    this.drawTile = async function(context, ctx, offset, cx, cy) {
        var tile = context.tileAttr;
        var palette = context.palette;
        var view = context.viewAttr;
        var blob = context.blob;
        
        var plane = context.planeAttr;
        
		// draw a placeholder tile to show that this tile is being processed
		ctx.fillStyle = 'rgb(0,0,0)';
		ctx.fillRect(cx, cy, tile.size.w * view.zoom.h, tile.size.h * view.zoom.v);
	
		var start = offset;// + (tile.stride * rowIndex) / plane.pixelsPerByte;
		var end = start + (tile.size.w * tile.size.h) / plane.pixelsPerByte;
			
		var tileData = blob.slice(start, end);					
		return tileData.arrayBuffer().then(buffer => {
						
			var lineData = new Uint8Array(buffer)
								
			// now draw the tile		
			var rowIndex;
			for (rowIndex = 0; rowIndex < tile.size.h; ++rowIndex) {
				if (this.terminateRendering)
					break;

				var y = cy + (rowIndex * view.zoom.v);
			
				var rowOfs = (tile.size.w * rowIndex) / plane.pixelsPerByte;
				
				switch(plane.packing) {
					case 0: 
					case 1: 
						// interleaved
						
						// get single contiguous line buffer for all planes
						// ABCDABCD ABCDABCD ABCDABCD ABCDABCD or
						//start = offset + (tile.stride * rowIndex) / plane.pixelsPerByte;
						//end = start + tile.size.w;

						//tileData = blob.slice(start, end);					
						//tileData.arrayBuffer().then(buffer => {
						
							//lineData = new Uint8Array(buffer)
							
							// pre-calculate some constants
							var nsm = (2**plane.planeCount) - 1;    // non-shifted mask

							var columnIndex;
							for (columnIndex = 0; columnIndex < tile.size.w; ++columnIndex) {
								if (this.terminateRendering)
									break;

								// initalise our pixel [ABCD]
								var pixel = 0;
								
								if (plane.packing == 0) {
									// planes are packed in a single byte (assuming not supporting planes over 8-bits)
									// e.g. for eight packed pixels:
									// ABCDEFGH ABCDEFGH ABCDEFGH ABCDEFGH ABCDEFGH ABCDEFGH ABCDEFGH ABCDEFGH 8-bit
									// ABCDABCD ABCDABCD ABCDABCD ABCDABCD  4-bit
									// ABABABAB ABABABAB  2-bit
									var ofs = rowOfs + Math.floor(columnIndex / plane.pixelsPerByte);
									var tileByte = lineData[ofs];

									if (plane.pixelsPerByte > 1) {
										if (plane.endian == 0) {
										  var lsb = Math.floor(columnIndex % plane.pixelsPerByte) * plane.planeCount;		
										  //var mask = nsm << lsb;
										  pixel = (tileByte >> lsb) & nsm; 
										} else {
											var lsb = 8-plane.planeCount-(Math.floor(columnIndex % plane.pixelsPerByte) * plane.planeCount);		
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
									for (planeIndex = 0; planeIndex < plane.planeCount; ++planeIndex) {
										if (this.terminateRendering)
											break;

										var mask = 1 << planeIndex;
										
										if ((mask & view.planeMask) != 0) {
											var ofs = rowOfs + Math.floor(columnIndex / plane.planeCount);
										
											var tileByte = lineData[ofs];
											var planeData = (tileByte &  mask);
											pixel |= planeData;
										}
									}
								}

								// apply plane view mask
								pixel &= view.planeMask;
								
								// draw resultant pixel
								ctx.fillStyle = palette.ToRGB(pixel);
										  
								var x = cx + (columnIndex * view.zoom.h);
								ctx.fillRect(x, y, view.zoom.h, view.zoom.v);	
							} // for each column
						//});
					break; // case Interleaved
				} // switch packing
			} // for each row
		}); // array buffer
    }
};