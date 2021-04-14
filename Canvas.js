var Context = function(htmlContext) {
    this.htmlContext = htmlContext;
}
export function Canvas(htmlCanvas) {
    this.htmlCanvas = htmlCanvas;

    var htmlContext = this.htmlCanvas.getContext();
    if (htmlContext) {
        this.getContext = function() {

            var context = new Context(htmlContext)
        }
    }
}