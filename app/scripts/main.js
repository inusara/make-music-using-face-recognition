(function(window, tracking, dat, flock) {
	'use strict';
	window.onload = function() {
	    var loopSynth, faceTrackSynth, eyesTrackSynth;
		var canvas = document.getElementById('canvas');
		var context = canvas.getContext('2d');
		var guiInterface = {
			isTracking: false,
			loopTrackColor: '#FE0002',
			faceTrackColor: '#00FF00',
			eyeTrackColor: '#1D87CB',
			eyeTrackerBeat: ''
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
			faceTrackSynth.set('faceBeats.mul', 0);

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
			var style = [guiInterface.faceTrackColor, guiInterface.eyeTrackColor];
			
			if(event.data.length > 0) {
				event.data.forEach(function(rect, index) {
        			if(index === 0) {
        			    faceTrackSynth.set('faceBeats.mul', 0.5);
        			} 
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
		//music visualization
		loopSynth = flock.synth({
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
		            canvas: '#loop-visualizer',
		            styles: {
		                strokeColor: guiInterface.loopTrackColor,
		                strokeWidth: 2
		            }
		        }
		    }
		});
		
	    faceTrackSynth = flock.synth({
            synthDef: {
                ugen: 'flock.ugen.scope',
                source: {
                    id: 'faceBeats',
                    ugen: 'flock.ugen.playBuffer',
                    buffer: {
                        url: 'audio/pejmaz-drum-and-hard-kick.wav'
                    },
                    loop: 1,
                    mul: 0
                },
		        options: {
		            canvas: '#tracking-visualizer',
		            styles: {
		                strokeColor: guiInterface.faceTrackColor,
		                strokeWidth: 2
		            }
		        }
            }
		});

	    eyesTrackSynth = flock.synth({
            synthDef: {
                ugen: 'flock.ugen.triggerCallback',
                trigger: {
                    ugen: 'flock.ugen.playBuffer',
                    buffer: {
                        url: 'audio/mhyst-cymbal-fill.wav'
                    },
                    loop: 1
                },
                options: {
                    callback: {
                        func: function () {
                            $('#loop-visualizer').toggleClass('pulse');
                        }
                    }
                }
            },
            addToEnvironment: false
		});
		
		var gui = new dat.GUI();
		var visualizer = document.getElementById('tracking-visualizer');
		var visualContext = visualizer.getContext('2d');

		gui.add(guiInterface, 'isTracking').onChange(function(value) {
			if(value) {
                flock.enviro.shared.play();
				trackerTask.run();
			} else {
                flock.enviro.shared.stop();
				trackerTask.stop();
				clearCanvas();
			}
		});

		gui.addColor(guiInterface, 'faceTrackColor').onChange(function(value) {
			guiInterface.faceTrackColor = value;
			visualContext.strokeStyle = value;
			visualContext.stroke();
		});
		
		gui.addColor(guiInterface, 'eyeTrackColor').onChange(function(value) {
			guiInterface.eyeTrackColor = value;
		});
		
		gui.add(guiInterface, 'eyeTrackerBeat', { ride: 'audio/MRIsyn_Ride_ST_4.mp3', rim: 'audio/MRIsyn_Rim_ST_2.mp3' }).onChange(function(value) {
		    eyesTrackSynth.set("url", value);
		});
	};
})(window, window.tracking, window.dat, window.flock);
