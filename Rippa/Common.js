import {RenderContext as BaseRenderContext} from "../Graphics/RenderContext.js"

export var Axis = function(h, v) {
    this.h = h;
    this.v = v;
}
  
export var Size = function(w, h) {
    this.w = w;
    this.h = h;
}

export var Rect = function(t, l, w, h) {
    this.t = t;
    this.l = l;
    this.w = w;
    this.h = h;
}

export var Point = function(x, y) {
    this.x = x;
    this.y = y;
}
