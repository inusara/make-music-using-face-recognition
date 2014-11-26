window.onload = function() {
	var video = document.getElementById('video'); 
	var canvas = document.getElementById('canvas');
	var context = canvas.getContext('2d');
	var guiInterface = {
		isTracking: false
	};

	var faceTracker = new tracking.ObjectTracker('face');
	faceTracker.setInitialScale(4);
	faceTracker.setStepSize(2);
	faceTracker.setEdgesDensity(0.1);

	tracking.track('#video', faceTracker, { camera: true });

	function process(event) {
		clearCanvas();
		if(event.data.length > 0) {
			event.data.forEach(function(rect) {
				context.strokeStyle = "#a64ceb";
				context.strokeRect(rect.x, rect.y, rect.width, rect.height);
			});
		}
	}

	function clearCanvas() {
		context.clearRect(0, 0, canvas.width, canvas.height);
	}

	var gui = new dat.GUI();
	gui.add(guiInterface, 'isTracking').onChange(function(value) {
		if(value) {
			faceTracker.addListener('track', process);
		} else {
			faceTracker.removeListener('track', process);
			clearCanvas();
		}
	});
}
