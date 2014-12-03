(function(window, tracking, dat, flock) {
	'use strict';
	window.onload = function() {
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

		var face = new tracking.ObjectTracker(['face', 'eye']);

		FastTracker.prototype.track = function(pixels, width, height) {
			var classifiers = face.getClassifiers();

		    if (!classifiers) {
		      throw new Error('Object classifier not specified, try `new tracking.ObjectTracker("face")`.');
		    }

		    var results = [];
		    var opt = { 'initialScale': 4, 'stepSize': 2, 'edgesDensity': 0.1 };

		    classifiers.forEach(function(classifier, index) {
		      if(index === 1) {
		      	opt.initialScale = face.getInitialScale();
		      	opt.stepSize = face.getStepSize();
		      	opt.edgesDensity = face.getEdgesDensity();
		      }
		      results = results.concat(tracking.ViolaJones.detect(pixels, width, height, opt.initialScale, face.getScaleFactor(), opt.stepSize, opt.edgesDensity, classifier));
		    });

			this.emit('track', {
				data: results
			});
		};

		var tracker = new FastTracker();
		var trackerTask = tracking.track('#video', tracker, { camera: true }).stop();

		tracker.on('track', function(event) {
			clearCanvas();		
			var style = ['#FE0002', '#1D87CB'];
			if(event.data.length > 0) {
				event.data.forEach(function(rect, index) {
					context.strokeStyle = style[index];
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

		var synth = flock.synth({
		    synthDef: {
		        ugen: 'flock.ugen.scope',
		        source: {
			        ugen: 'flock.ugen.filter.moog',
			        cutoff: {
			            ugen: 'flock.ugen.sinOsc',
			            freq: 1/4,
			            mul: 5000,
			            add: 7000
			        },
			        resonance: {
			            ugen: 'flock.ugen.sinOsc',
			            freq: 1/2,
			            mul: 1.5,
			            add: 1.5
			        },
			        source: {
			            ugen: 'flock.ugen.lfSaw',
			            freq: {
			                ugen: 'flock.ugen.sequence',
			                freq: 1/2,
			                loop: 1,
			                list: [220, 220 * 5/4, 220, 220 * 3/2, 220 * 4/3, 220],
			                options: {
			                    interpolation: 'linear'
			                }
			            }
			        },
			        mul: 0.5
		        },
		        options: {
		            canvas: '#gfx',
		            styles: {
		                strokeColor: '#FE0002',
		                strokeWidth: 2
		            }
		        }
		    }
		});

		var gui = new dat.GUI();
		gui.add(guiInterface, 'isTracking').onChange(function(value) {
			if(value) {
				synth.play();
				trackerTask.run();
			} else {
				synth.pause();
				trackerTask.stop();
				clearCanvas();
			}
		});
	};
})(window, window.tracking, window.dat, window.flock);
