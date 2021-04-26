export var ByteStream = function(stream) {
	var reader = stream.getReader();
	var bufferIndex = 0;
	var frontBuffer = null;
	var backBuffer = null;
 	
	this.isEos = function() {
		return frontBuffer == null || (bufferIndex == frontBuffer.length && backBuffer == null);
	}
	this.getByte = async function() {
		return new Promise(async(resolve, reject) => { 
			await frontBufferPromise;
			if (frontBuffer == null) {
				reject(new Error('end of stream'));
				return;
			}

			if (bufferIndex == frontBuffer.length) {
				await swapBuffers();
			}
	
			var byte = frontBuffer[bufferIndex++];

			resolve(byte);
		});
        
	}
	var fillBuffer = async function(buffer) {
		return new Promise(async(resolve, reject) => { 
			await reader.read().then(({done, value}) => { 
				if (done) {
					resolve(null);
				} else {
					resolve(value);
				}
			})
		})
        
    }
    var swapBuffers = async function() {
		await backBufferPromise;
		frontBuffer = backBuffer;
		bufferIndex = 0;
		backBuffer = null;
        backBufferPromise = fillBuffer().then(buffer => { backBuffer = buffer });
    }

    var frontBufferPromise = fillBuffer().then(buffer => { frontBuffer = buffer });
	var backBufferPromise = fillBuffer().then(buffer => { backBuffer = buffer });
}