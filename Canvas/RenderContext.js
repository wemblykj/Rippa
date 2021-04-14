export var RenderContext = function(attributes) {
	this.terminateRendering = false;
	this._invalidateReq = true;
	this.invalidate = async function() {
		this._invalidateReq = true;
	}
	this.beginRender = async function() {
		if (this.isRendering) {
			this.terminateRendering = true;
			await this.renderingPromise;
			this.renderingPromise = new Promise(resolve => { this.resolveRenderFn = resolve });
		}
		
		this.terminateRendering = false;
		this.isRendering = true;

		// cache the invalidate status
		this.clear = this._invalidateReq = true;
		this._invalidateReq = false;

		await this.onBeginRender();
	}
	this.endRender = async function() {
		this.isRendering = false;
		await this.onEndRender();
		this.resolveRenderFn();
	}
	this.cancelRender = async function() {
		this.terminateRendering = true;
	}
	this.onBeginRender = async function() {}
	this.onEndRender = async function() {}
}