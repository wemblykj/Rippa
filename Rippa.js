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
        eos = false;
        while (!eos && (cy + tile.size.h) < canvas.height) {
            var cx = view.margin.w;
            while (!eos && (cx + tile.size.w) < canvas.width) {
                if (offset < blob.size) {
                    this.drawTile(ctx, cx, cy, offset);
                
                    cx += tile.size.w + view.spacing.h;
                    offset += tile.stride * tile.size.h;
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
        
            // interleaved
            start = offset + tile.stride * rowIndex;
            end = start + tile.size.w;
            
            tileData = blob.slice(start, end);
            
            ((y) => {    // capture y value
                tileData.arrayBuffer().then(buffer => {
                lineData = new Uint8Array(buffer)
                
                var buffer = new ArrayBuffer(tile.size.w);
                var pixelData = new Uint8Array(buffer);
            
                var columnIndex;
                for (columnIndex = 0; columnIndex < tile.size.w; ++columnIndex) {
                    var planeIndex;
                    for (planeIndex = 0; planeIndex < plane.planeCount; ++planeIndex) {
                        var mask = 1 << planeIndex;
                        
                        if ((mask & view.planeMask) != 0) {
                            var ofs = Math.floor(columnIndex / plane.planeCount);
                        
                            var tileByte = lineData[ofs];
                            var planeData = (tileByte &  mask);
                            pixelData[columnIndex] |= planeData;
                        }
                    }
                }
                
                for (columnIndex = 0; columnIndex < tile.size.w; ++columnIndex) {
                    ctx.fillStyle = palette.ToRGB(pixelData[columnIndex]);
                                        
                    var x = cx + columnIndex;
                    ctx.fillRect(x, y, 1, 1);
                }
              });
            })(y);
        }
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
      this.interleaved = true;
      //this.planeAttr.stride = 0;
    }

    ViewAttributes = function(planeMask = 0xff) {
      this.margin = new Size(2, 2);
      this.spacing = new Size(2, 2);
      this.planeMask = planeMask;
    }

    Palette = function(bpp, rgbArray) {
      this.bitsPerPixel = bpp;
      this.rgbArray = rgbArray;
      this.ToRGB = function(index) {
        var i = (index % this.bpp) << (8-this.bpp);
        return this.rgbArray[i];
      };
    }
}    
