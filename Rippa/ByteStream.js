export var ByteStream = function(stream) {
	var reader = stream.getReader();
	var bufferIndex = 0;
	var frontBuffer = null;
	var backBuffer = null;
 	
	var _eos = false;

	this.isEos = async function() {
		await frontBufferPromise;
		return _eos;
	}
	this.getByte = async function() {
		await frontBufferPromise.then(({eos, buffer}) => {
			if (eos || buffer == null) {
				throw new Error(new Error('end of stream'));
			}
		});

		var byte = frontBuffer[bufferIndex];

		if (++bufferIndex == frontBuffer.length) {
			frontBufferPromise = swapBuffers();
		}
        
		return byte;
	}
	var fillBuffer = async function(buffer) {
		return reader.read().then(({done, value}) => { 
			if (done) {
				return { eos: true, buffer: null };
			}
			
			return { eos: false, buffer: value };
		})
    }
    var swapBuffers = async function() {
		await backBufferPromise;
		frontBuffer = backBuffer;
		bufferIndex = 0;
		backBuffer = null;

		if (frontBuffer != null) {
			backBufferPromise = fillBuffer().then(({eos, buffer}) => { backBuffer = buffer });
			return { eos: false, buffer: frontBuffer };
		} else {
			_eos = true;
			return { eos: true, buffer: null };
		}
    }

	var backBufferPromise;
    var frontBufferPromise = fillBuffer().then(({eos, buffer}) => { 
		frontBuffer = buffer; 
		if (!eos) {
			backBufferPromise = fillBuffer().then(({eos, buffer}) => { backBuffer = buffer; });
		} else {
			_eos = true;
		} 	
		
		return {eos, buffer};
	});
}