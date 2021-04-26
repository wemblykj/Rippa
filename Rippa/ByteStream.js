export var ByteStream = function(blob) {
	this.blob = blob;
	this.reader = stream.getReader();
	this.fifoSize = fifoSize;
	this.threashold = fifoSize / 2;
    var buffer = [ null, null ];
	var bufferIndex = 0;
    var bufferSelect = 0;
    var activeBuffer = buffer[bufferSelect];
	
	this.eos = false;
	
	this.getByte = function() {
        if (bufferIndex > activeBuffer.size()) {
            swapBuffers();
        }
		if (this.count > 0) {
			var byte = buffer[this.tail];
			this.tail = (this.tail + 1) % this.fifoSize;
			--this.count;

			if (this.count < this.threashold)
				!(result = await reader.read())
			return byte;
		}
			
		if (this.fifoEmpty)
			throw new Error("End of stream");
		readBufferPromise = reader.read().then();

		this.getByte = function() {

		}
	};
    var swapBuffers = function() {
        buffer[bufferSelect] = null;
        bufferSelect = !bufferSelect;
        activeBuffer = buffer[bufferSelect];
        fillBuffers();
    }
	var fillBuffers = async function() {
        if (buffer[bufferSelect] == null) {
            readBufferPromise = reader.read().then();
        }
    }

    this.fillBuffers();
}