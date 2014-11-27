window.onload = function() {
	'use strict';
	var canvas = document.getElementById('canvas');
	var context = canvas.getContext('2d');
	var guiInterface = {
		isTracking: false
	};

	var FastTracker = function() {
		FastTracker.base(this, 'constructor');
	};
	tracking.inherits(FastTracker, tracking.Tracker);

	tracking.Fast.THRESHOLD = 1;
	FastTracker.prototype.threshold = tracking.Fast.THRESHOLD;

	var face = new tracking.ObjectTracker('face');
		face.setInitialScale(4);
		face.setStepSize(2);
		face.setEdgesDensity(0.1);

	FastTracker.prototype.track = function(pixels, width, height) {
		var classifiers = face.getClassifiers();

	    if (!classifiers) {
	      throw new Error('Object classifier not specified, try `new tracking.ObjectTracker("face")`.');
	    }

	    var results = [];

	    classifiers.forEach(function(classifier) {
	      results = results.concat(tracking.ViolaJones.detect(pixels, width, height, face.getInitialScale(), face.getScaleFactor(), face.getStepSize(), face.getEdgesDensity(), classifier));
	    });

		this.emit('track', {
			data: results
		});
	};

	var tracker = new FastTracker();
	var trackerTask = tracking.track('#video', tracker, { camera: true }).stop();

	tracker.on('track', function(event) {
		clearCanvas();		
		if(event.data.length > 0) {
			event.data.forEach(function(rect) {
				context.strokeStyle = '#a64ceb';
				context.strokeRect(rect.x, rect.y, rect.width, rect.height);
				context.font = '11px Helvetica';
				context.fillStyle = '#fff';
				context.fillText('x: ' + rect.x + 'px', rect.x + rect.width + 5, rect.y + 11);
				context.fillText('y: ' + rect.y + 'px', rect.x + rect.width + 5, rect.y + 22);
			});
		}
	});

	function clearCanvas() {
		context.clearRect(0, 0, canvas.width, canvas.height);
	}

	var gui = new dat.GUI();
	gui.add(guiInterface, 'isTracking').onChange(function(value) {
		if(value) {
			trackerTask.run();
		} else {
			trackerTask.stop();
			clearCanvas();
		}
	});
};
