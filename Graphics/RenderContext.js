export var RenderContext = function(attributes) {
	var _invalidateReq = true;
	var _resolveRenderFn = null;
	var _renderingPromise = undefined;

	this.invalidated = false;
	this.terminateRendering = false;
	this.palette = undefined;

	this.invalidate = async function() {
		_invalidateReq = true;
	}
	
    this.bindPalette = function(palette) {
        this.palette = palette;
    }
	this.beginRender = async function() {
		if (this.isRendering) {
			this.terminateRendering = true;
			await _renderingPromise;
			_renderingPromise = new Promise(resolve => { _resolveRenderFn = resolve });
		}
		
		this.terminateRendering = false;
		this.isRendering = true;

		// cache the invalidate status
		this.invalidated = _invalidateReq;
		_invalidateReq = false;

		await this.onBeginRender();
	}
	this.endRender = async function() {
		this.isRendering = false;
		await this.onEndRender();
		if (_resolveRenderFn) {
			_resolveRenderFn();
			_resolveRenderFn = null;
		}
	}
	this.cancelRender = async function() {
		this.terminateRendering = true;
	}
	this.onBeginRender = async function() {}
	this.onEndRender = async function() {}
}
