var FfmpegCommand = require('fluent-ffmpeg');
var glob = require('glob');
var _ = require('lodash');
var path = require('path');
var fs = require('fs');

var IMAGE_URLS = {
	TOMLOUD: {
		url: global.config.image + '/TomLoud.png',
		exists: null
	},
	PAULALOUD: {
		url: global.config.image + '/PaulaLoud.png',
		exists: null
	},
	PATRICKANDANNAWAHLMEIER: {
		url: global.config.image + '/PatrickAndAnnaWahlmeier.png',
		exists: null
	},
	PATRICKWAHLMEIER: {
		url: global.config.image + '/PatrickWahlmeier.png',
		exists: null
	},
	ANNAWAHLMEIER: {
		url: global.config.image + '/AnnaWahlmeier.png',
		exists: null
	},
	TREVORHARRIS: {
		url: global.config.image + '/TrevorHarris.png',
		exists: null
	},
	GALEKNOLL: {
		url: global.config.image + '/GaleKnoll.png',
		exists: null
	},
	JRKNOLL: {
		url: global.config.image + '/JRKnoll.png',
		exists: null
	},
	BURTSHARPE: {
		url: global.config.image + '/BurtSharpe.png',
		exists: null
	},
	LYNNSHARPE: {
		url: global.config.image + '/LynnSharpe.png',
		exists: null
	},
	ELSIEWELCH: {
		url: global.config.image + '/ElsieWelch.png',
		exists: null
	},
	AARONBAKER: {
		url: global.config.image + '/AaronBaker.png',
		exists: null
	}
};

_.each(IMAGE_URLS, function (obj) {
	obj.exists = fs.existsSync(obj.url);
});

//console.info(IMAGE_URLS);

var getImage = function (filename) {
	switch (true) {
		case /Tom Loud/i.test(filename):
			return IMAGE_URLS.TOMLOUD;
		case /Paula Loud/i.test(filename):
			return IMAGE_URLS.PAULALOUD;
		case /J[\.]?[ ]?R[\.]? [kg]?noll/i.test(filename):
			return IMAGE_URLS.JRKNOLL;
		case /Patrick and Anna Wahlmeier/i.test(filename):
			return IMAGE_URLS.PATRICKANDANNAWAHLMEIER;
		case /Patrick Wahlmeier/i.test(filename):
			return IMAGE_URLS.PATRICKWAHLMEIER;
		case /Anna Wahlmeier/i.test(filename):
			return IMAGE_URLS.ANNAWAHLMEIER;
		case /Trevor Harris/i.test(filename):
			return IMAGE_URLS.TREVORHARRIS;
		case /Ga[y]?le [kg]?noll/i.test(filename):
			return IMAGE_URLS.GALEKNOLL;
		case /Burt Sharpe/i.test(filename):
			return IMAGE_URLS.BURTSHARPE;
		case /Lynn Sharpe/i.test(filename):
			return IMAGE_URLS.LYNNSHARPE;
		case /Elsie Welch/i.test(filename):
			return IMAGE_URLS.ELSIEWELCH;
		case /Aaron Baker/i.test(filename):
			return IMAGE_URLS.AARONBAKER;
		default:
		return {exists: false};
	}
}

module.exports = function (grunt, options) {
	grunt.registerTask('audToVid', 'Convert video to audio file by name', function () {
		var done = this.async();
		var audFiles = glob.sync(global.config.audio + '/*.*');
		var vidFiles = glob.sync(global.config.video + '/*.*');

		var audFiles = _.filter(audFiles, function (file) {
			return /\.(mp3|m4a)$/i.test(path.basename(file));
		});

		var audNames = _.map(audFiles, function (val){
			return path.basename(val).replace(/(\.mp3|\.m4a)$/, '');
		});

		var vidNames = _.map(vidFiles, function (val){
			return path.basename(val, '.mp4');
		});

		console.log('Audio Files: ', audNames);
		console.log('Video Files: ', vidNames);

		var diffNames = _.difference(audNames, vidNames);

		console.log('Different Names: ', diffNames);

		var diffIndexes = [];
		_.each(diffNames, function (val) {
			var idx = audNames.indexOf(val);
			if (idx >= 0) {
				diffIndexes.push(idx);
			}
		});

		console.log('Different Indexes: ', diffIndexes);

		var queue = [];
		var dequeue = function () {
			var next = queue.shift();
			if (next) {
				next();
			} else {
				done();
			}
		}

		var escapeChar = process.platform.match(/^win/) ? '^' : '\\';
		var index;
		var audPath;
		var fileName;
		var vidPath;
		var imageFile;
		var framecount = 0;
		var frameregexp = /frame=/;
		for (var i = 0; i < diffIndexes.length; ++i) {
			index = diffIndexes[i];
			audPath = audFiles[index];
			fileName = audNames[index];
			vidPath = global.config.video + '/' + fileName + '.mp4';
			imageFile = getImage(fileName);
			console.info(imageFile);
			if (!imageFile.exists) {
				continue;
			}
			
			queue.push((function () {
				
				var imgPath = imageFile.url;
				var audioP = audPath;
				var videoP = vidPath;
				
				return function () {
				var command = FfmpegCommand();
				command
				.input(imgPath)
				.inputOptions('-loop', '1')
				//.loop(1)
				.input(audioP)
				.size('640x480')
				.videoCodec('libx264')
				.audioCodec('libfdk_aac')
				.audioBitrate('192k')
				.output(videoP)
				.outputOptions('-shortest', '-tune', 'stillimage','-pix_fmt', 'yuv420p','-r', '24')
				.on('start', function (cmd) {
					console.info('began with ' + cmd);
				})
				.on('stderr', function (err) {
					// /error/i.test(err) &&
					if (frameregexp.test(err)) {
						if (!framecount) {
							console.log('Encoding ' + err);
						}
						framecount = (framecount + 1) % 20;
					} else if (err.indexOf('overread') !== -1) {
						return; // Don't print overread errors.
					} else {
						console.error('stderr: ' + err);
					}
				})
				.on('error', function (err, stdout, stderr) {
					console.error('Cannot process video: ' + err.message);done();
				})
				.on('end', function(stdout, stderr) {console.log('Transcoding succeeded !');dequeue();})
				.run();
			}})());
		}
		dequeue();
	});
};
