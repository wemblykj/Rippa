import {AsyncSemaphore} from './AsyncSemaphore.js';

/*
 For reference, the MSX2 screen 5 (mode 4) layout

 SCREEN 5, 6 / GRAPHIC 4, 5
Address range	Usage
0000H - 5FFFH	Pattern name table (192 lines)
0000H - 69FFH	Pattern name table (212 lines)
7400H - 75FFH	Sprite colour table
7600H - 767FH	Sprite attribute table
7680H - 76AFH	Palette table
7A00H - 7FFFH	Sprite generator table
*/

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

var IndexedPalette = function(bitsPerPixel, lut) {
	this.bpp = bitsPerPixel;
	this.lut = lut;
	this.ToIndex = function(index) {
		var i = index & ((2**this.bpp)-1);
		return this.lut[i];
	  };
}

var SystemPalette = function(bitsPerPixel, rgbArray) {
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

		this.getByte = function() {

		}
	};
	
}

var Attributes = function(w, h, tile_bpp, system_bpp, tilePalette = null, systemPalette = null) {
	this.tileNav = new Navigation();
	this.tilePaletteNav = new Navigation();
	
	this.tile = new TileAttributes(w, h);
	this.view = new ViewAttributes();
	this.packing = new PlaneAttributes(tile_bpp);
	
	// produce a default tile palette

	if (tilePalette === null) {
		var paletteIndex;
		var systemPaletteCount = (2**system_bpp);
		var tilePaletteCount = (2**tile_bpp);
		var step = (systemPaletteCount-1) / (tilePaletteCount-1);
		for (paletteIndex = 0; paletteIndex < tilePaletteCount; ++paletteIndex) {
			var systemIndex = Math.floor(paletteIndex * step);
			tilePalette[paletteIndex] = systemIndex;
		}
	}

	this.tilePalette = new IndexedPalette(tile_bpp, tilePalette);
	
	if (systemPalette === null) {
		// produce a default intensity/RGB based palette

		var step = (255 / (systemPaletteCount >> 3));
		var intensityBits = (8 - (system_bpp-3));
		var intensityStep = 2**intensityBits;
		for (paletteIndex = 0; paletteIndex < systemPaletteCount; ++paletteIndex) {
			var i = (paletteIndex >> 3) * intensityStep;

			if (paletteIndex & 7) {
				i = (i + intensityStep) - 1;
				var r = Math.floor(i * ((paletteIndex & 0x02) >> 1));
				var g = Math.floor(i * ((paletteIndex & 0x04) >> 2));
				var b = Math.floor(i * (paletteIndex & 0x01));

				var rgb = `rgb(${r}, ${g}, ${b})`;
			}
			else {
				// greyscale
				i = i
				var rgb = `rgb(${i}, ${i}, ${i})`;
			}
			
			systemPalette[paletteIndex] = rgb;
		}
	}

	this.systemPalette = new SystemPalette(system_bpp, systemPalette);
}

var Preset = function(name, attributes) {
	this.name = name;
	this.attributes = attributes;
}

var MSX2ScreenPreset = function(name) {
	this.name = name;

	// MSX2 palette at reset
	var tilePalette = [ 
		0x000, 
		0x000,
		0x189, 	// 110_001_001 => 1_1000_1001
		0x1db, 	// 111_011_011 => 1_1101_1011
		0x04f, 	// 001_001_111 => 0_0100_1111
		0x0d7, 	// 011_010_111 => 0_1101_0111
		0x069, 	// 001_101_001 => 0_0110_1001
		0x19f, 	// 110_011_111 => 1_1001_1111
		0x079, 	// 001_111_001 => 0_0111_1001
		0x0fb, 	// 011_111_011 => 0_1111_1011
		0x1b1, 	// 110_110_001 => 1_1011_0001
		0x1b4, 	// 110_110_100 => 1_1011_0100
		0x109, 	// 100_001_001 => 1_0000_1001
		0x0b5, 	// 010_110_101 => 0_1011_0101
		0x16d, 	// 101_101_101 => 1_0110_1101
		0x1ff 	// 111_111_111 => 1_1111_1111
	];
	
	var systemPalette = [];
	var step_n = 255.0;
	var step_d = 7.0;
	var paletteIndex;
	for (paletteIndex = 0; paletteIndex < 512; ++paletteIndex) {
		var b = Math.floor((step_n * (paletteIndex & 0x07)) / step_d);
		var r = Math.floor((step_n * ((paletteIndex >> 3) & 0x07)) / step_d);
		var g = Math.floor((step_n * ((paletteIndex >> 6) & 0x07)) / step_d);

		var rgb = `rgb(${r}, ${g}, ${b})`;

		systemPalette[paletteIndex] = rgb;
	}

	this.attributes = new Attributes(256, 212, 4, 9, tilePalette, systemPalette);
}

var Presets = function() {
	this.presets = [];
	this.getPresetNames = function() {
		var presets = []
		this.presets.forEach(value => presets.push(value.name));
		return presets;
	}
}

var RenderContext = function(attributes) {
	this.blob = null;
	this.attributes = attributes;
	this.terminateRendering = false;
	this.maxConcurrentTiles = 4;
	this.invalidate = async function() {
		this.clearReq = true;
	}
	this.beginRender = async function() {
		this.terminateRendering = true;
		await this.renderingPromise;
		this.renderingPromise = new Promise(resolve => { this.resolveRenderFn = resolve });
		this.terminateRendering = false;

		// just ensure tile semephore is reset
		this.tilePromise = null;
		this.tileCount = 0;

		// cache the clear status from the request
		this.clear = this.clearReq;
		this.clearReq = false;
	}
	this.endRender = async function() {
		this.resolveRenderFn();
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

	//this._renderPromise;
	//this._renderSemaphore = new AsyncSemaphore(1);	///< ensure we are not rendering more than one screen at a time
	//this._tileSemaphore = new AsyncSemaphore(8);		///< limit the number of tiles drawn concurrently
	
}

export function Rippa() {
	
	this.createAttributesFromPreset = function(presetName) {
		if(presetName == "MSX2Screen") {
			var preset = new MSX2ScreenPreset();
			return preset.attributes;
		}
	}

    this.createRenderContext = function(attributes) {
        var renderContext = new RenderContext(attributes);
        
        return renderContext;
    }
    
	this.render = async function(renderContext, canvas) {
		
        if (canvas) {
            if(renderContext) {
                var ctx = canvas.getContext('2d');
				
				await renderContext.beginRender();
				
				var offset = renderContext.attributes.tileNav.offset;
				
				if (renderContext.clear) {
					ctx.clearRect(0, 0, canvas.width, canvas.height);
				}

				await this.renderTileView(renderContext, ctx, offset);
				
				renderContext.endRender();
            }
        }
    };
    
    this.renderTileView = async function(renderContext, ctx, offset) {
		var attr = renderContext.attributes;
        var tile = attr.tile;
        var packing = attr.packing;
        var view = attr.view;
        
        var th = (tile.size.h * view.zoom.v) + view.spacing.v;
        var maxRows = Math.floor((canvas.height - (2 * view.margin.v)) / th);
        var tw = (tile.size.w * view.zoom.h) + view.spacing.h;
			var maxColumns = Math.floor((canvas.width - (2 * view.margin.h)) / tw);	

        if (renderContext.clear) {
            var bw = 2 * view.margin.h + (maxColumns * tw);
            var bh = 2 * view.margin.v + (maxRows * th);
        
            ctx.fillStyle = 'rgb(80, 80, 80)';
            ctx.fillRect(0,0, bw, bh);
        }
        
        var cy = view.margin.v;
        
		var row;
		for (row = 0; row < maxRows; ++row) {
			if (renderContext.terminateRendering)
				break;

            var cx = view.margin.h;
        
			await this.renderRow(renderContext, ctx, cx, cy, offset);
			
			offset += (tile.size.w * maxColumns * tile.size.h) / packing.pixelsPerByte;
			cy += th;
        }
    }
    
	this.renderRow = async function(renderContext, ctx, cx, cy, offset) {
        var blob = renderContext.blob;
		var attr = renderContext.attributes;
        var tile = attr.tile;
        var packing = attr.packing;
        var view = attr.view;
        
        var tw = (tile.size.w * view.zoom.h) + view.spacing.h;
        //var th = (tile.size.h * view.zoom.v) + view.spacing.v;
        var maxColumns = Math.floor((canvas.width - (2 * view.margin.h)) / tw);
        //var maxRows = Math.floor((canvas.height - (2 * view.margin.v)) / th);
        //var bw = 2 * view.margin.h + (maxColumns * tw);
        //var bh = 2 * view.margin.v + (maxRows * th);
		
		let promises = [];
		
		var column;
		for (column = 0; column < maxColumns; ++column) {
			if (renderContext.terminateRendering)
				break;

			if (offset < blob.size) {
				await renderContext.beginTile();
				this.drawTile(renderContext, ctx, offset, cx, cy).then(() => renderContext.endTile() );
				
				offset += (tile.size.w * tile.size.h) / packing.pixelsPerByte;
				cx += tw;
			} else {
				break;
			}
		}
	}
	
    this.drawTile = async function(context, ctx, offset, cx, cy) {
		var blob = context.blob;
		var attr = context.attributes;
        var tile = attr.tile;
		var tilePalette = attr.tilePalette;
        var systemPalette = attr.systemPalette;
        var view = attr.view;
        var packing = attr.packing;
        
		var start = offset;// + (tile.stride * rowIndex) / packing.pixelsPerByte;
		var end = start + (tile.size.w * tile.size.h) / packing.pixelsPerByte;
			
		var tileData = blob.slice(start, end);					
		return tileData.arrayBuffer().then(buffer => {
						
			var lineData = new Uint8Array(buffer)
								
			// now draw the tile		
			var rowIndex;
			for (rowIndex = 0; rowIndex < tile.size.h; ++rowIndex) {
				if (renderContext.terminateRendering)
					break;

				var y = cy + (rowIndex * view.zoom.v);
			
				var rowOfs = (tile.size.w * rowIndex) / packing.pixelsPerByte;
				
				switch(packing.packing) {
					case 0: 
					case 1: 
						// interleaved
						
						// get single contiguous line buffer for all planes
						// ABCDABCD ABCDABCD ABCDABCD ABCDABCD or
						//start = offset + (tile.stride * rowIndex) / packing.pixelsPerByte;
						//end = start + tile.size.w;

						//tileData = blob.slice(start, end);					
						//tileData.arrayBuffer().then(buffer => {
						
							//lineData = new Uint8Array(buffer)
							
							// pre-calculate some constants
							var nsm = (2**packing.planeCount) - 1;    // non-shifted mask

							var columnIndex;
							for (columnIndex = 0; columnIndex < tile.size.w; ++columnIndex) {
								if (renderContext.terminateRendering)
									break;

								// initalise our pixel [ABCD]
								var pixel = 0;
								
								if (packing.packing == 0) {
									// planes are packed in a single byte (assuming not supporting planes over 8-bits)
									// e.g. for eight packed pixels:
									// ABCDEFGH ABCDEFGH ABCDEFGH ABCDEFGH ABCDEFGH ABCDEFGH ABCDEFGH ABCDEFGH 8-bit
									// ABCDABCD ABCDABCD ABCDABCD ABCDABCD  4-bit
									// ABABABAB ABABABAB  2-bit
									var ofs = rowOfs + Math.floor(columnIndex / packing.pixelsPerByte);
									var tileByte = lineData[ofs];

									if (packing.pixelsPerByte > 1) {
										if (packing.endian == 0) {
										  var lsb = Math.floor(columnIndex % packing.pixelsPerByte) * packing.planeCount;		
										  //var mask = nsm << lsb;
										  pixel = (tileByte >> lsb) & nsm; 
										} else {
											var lsb = 8-packing.planeCount-(Math.floor(columnIndex % packing.pixelsPerByte) * packing.planeCount);		
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
								
								var systemIndex = tilePalette.ToIndex(pixel);

								// draw resultant pixel
								ctx.fillStyle = systemPalette.ToRGB(systemIndex);
										  
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