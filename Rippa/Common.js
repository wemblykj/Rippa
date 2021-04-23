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

export var RGB = function(r, g, b) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.toHtml = function(colour) {
    return `rgb(${this.r}, ${this.g}, ${this.b})`;
    }
}

export var RGBA = function(r, g, b, a) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
    this.toHtml = function() {
        return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
}