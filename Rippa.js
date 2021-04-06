Rippa = function() {
    this.render = function(canvas) {
        if (canvas) {
            if(context) {
                var ctx = canvas.getContext('2d');

                ctx.clearRect(0, 0, canvas.width, canvas.height);

                this.renderTileView(ctx);    
            }
        }
    };
    
    this.setContext = function(context) {
        this.context = context;
    }
    
    this.createContext = function() {
        context = new Context();
        
        return context;
    }
    
    this.renderTileView = function(ctx) {
        var context = this.context;
        var blob = context.blob;
        var nav = context.navigation;
        var tile = context.tileAttr;
        var plane = context.planeAttr;
        var view = context.viewAttr;
        
        var offset = nav.offset;
        
        ctx.fillStyle = 'rgb(200, 0, 0)';
        
        var cy = view.margin.h;
        var eos = false;
        
        while (!eos && (cy + tile.size.h) < canvas.height) {
            var cx = view.margin.w;
            while (!eos && (cx + tile.size.w) < canvas.width) {
                if (offset < blob.size) {
                    this.drawTile(ctx, cx, cy, offset);
                
                    cx += tile.size.w + view.spacing.h;
                    offset += (tile.size.w * tile.size.h) / plane.pixelsPerByte;
                } else {
                    eos = true;
                }
            }
            
            cy += tile.size.h + view.spacing.h;
        }
    }
    
    this.drawTile = function(ctx, cx, cy, offset) {
        var context = this.context;
        var tile = context.tileAttr;
        var palette = context.palette;
        var view = context.viewAttr;
        var blob = context.blob;
        
        var plane = context.planeAttr;
        
        var rowIndex;
        for (rowIndex = 0; rowIndex < tile.size.h; ++rowIndex) {
            var y = cy + rowIndex;
        
            ((y) => {    // capture y value
                switch(plane.packing) {
                    case 0: 
                    case 1: 
                        // interleaved
                        
                        // get single contiguous line buffer for all planes
                        // ABCDABCD ABCDABCD ABCDABCD ABCDABCD or
                        start = offset + tile.stride * rowIndex;
                        end = start + tile.size.w;

                        tileData = blob.slice(start, end);					
                        tileData.arrayBuffer().then(buffer => {
                        
                            lineData = new Uint8Array(buffer)
                            
                            // pre-calculate some constants
                            var nsm = (2**plane.planeCount) - 1;    // non-shifted mask

                            var columnIndex;
                            for (columnIndex = 0; columnIndex < tile.size.w; ++columnIndex) {
                                // initalise our pixel [ABCD]
                                var pixel = 0;
                                
                                if (plane.packing == 0) {
                                    // planes are packed in a single byte (assuming not supporting planes over 8-bits)
                                    // e.g. for eight packed pixels:
                                    // ABCDEFGH ABCDEFGH ABCDEFGH ABCDEFGH ABCDEFGH ABCDEFGH ABCDEFGH ABCDEFGH 8-bit
                                    // ABCDABCD ABCDABCD ABCDABCD ABCDABCD  4-bit
                                    // ABABABAB ABABABAB  2-bit
                                    var ofs = Math.floor(columnIndex / plane.pixelsPerByte);
                                    var tileByte = lineData[ofs];

                                    if (plane.pixelsPerByte > 1) {
                                      var lsb = Math.floor(columnIndex / plane.planeCount);		
                                      var mask = nsm << lsb;
                                      pixel = (tileByte & mask) >> lsb; 
                                    } else {
                                      pixel = tileByte; 
                                    }

                                } else {
                                    // planes [A,B,C and D] are spread across interleaved bytes
                                    // AAAAAAAA BBBBBBBB CCCCCCCC DDDDDDDD
                                    var planeIndex;
                                    for (planeIndex = 0; planeIndex < plane.planeCount; ++planeIndex) {
                                      var mask = 1 << planeIndex;
                                      
                                      if ((mask & view.planeMask) != 0) {
                                        var ofs = Math.floor(columnIndex / plane.planeCount);
                                      
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
                                          
                                var x = cx + columnIndex;
                                ctx.fillRect(x, y, 1, 1);	
                            } // for each column
                        });
                    break; // case Interleaved
                } // switch packing
            })(y);
        } // for each row
    }
    
    var Context = function() {
        this.blob = null;
        
        this.navigation = new Navigation();
        
        this.tileAttr = new TileAttributes(8, 8);
        
        this.viewAttr = new ViewAttributes();
        
        this.planeAttr = new PlaneAttributes(8);
    }

    Size = function(w, h) {
      this.w = w;
      this.h = h;
    }

    Rect = function(t, l, w, h) {
      this.t = t;
      this.l = l;
      this.w = w;
      this.h = h;
    }

    Point = function(x, y) {
      this.x = x;
      this.y = y;
    }

    Navigation = function(offset = 0) {
      this.offset = offset;
    }

    TileAttributes = function(w, h) {
      this.size = new Size(w, h);
      this.stride = w;
    }

    PlaneAttributes = function(planeCount) {
      this.planeCount = planeCount;
      this.pixelsPerByte = 8/planeCount; 
      this.packing = 0;
      this.setPlaneCount = function(planeCount) {
        this.planeCount = planeCount
        this.pixelsPerByte = 8/planeCount; 
      };
    }

    ViewAttributes = function(planeMask = 0xff) {
      this.margin = new Size(2, 2);
      this.spacing = new Size(2, 2);
      this.planeMask = planeMask;
    }

    Palette = function(bitsPerPixel, rgbArray) {
      this.bpp = bitsPerPixel;
      this.rgbArray = rgbArray;
      this.ToRGB = function(index) {
        var i = index & ((2**this.bpp)-1);
        return this.rgbArray[i];
      };
    }
}    
