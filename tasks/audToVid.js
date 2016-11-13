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
	BURTSHARPE: {
		url: global.config.image + '/BurtSharpe.png',
		exists: null
	},
	LYNNSHARPE: {
		url: global.config.image + '/LynnSharpe.png',
		exists: null
	}
};

_.each(IMAGE_URLS, function (obj) {
	obj.exists = fs.existsSync(obj.url);
});

//console.info(IMAGE_URLS);

var getImage = function (filename) {
	var matches = filename.match(/(\d{4}-\d{2}-\d{2} )([\w ]+)(?= - )/);
	//console.info(matches);
	if (matches.length >= 3) {
		var match = matches[2];
		// console.log(match);
		switch (true) {
			case /Tom Loud/i.test(match):
				return IMAGE_URLS.TOMLOUD;
			case /Paula Loud/i.test(match):
				return IMAGE_URLS.PAULALOUD;
			case /Patrick Wahlmeier/i.test(match):
				return IMAGE_URLS.PATRICKWAHLMEIER;
			case /Anna Wahlmeier/i.test(match):
				return IMAGE_URLS.ANNAWAHLMEIER;
			case /Trevor Harris/i.test(match):
				return IMAGE_URLS.TREVORHARRIS;
			case /Gale Knoll/i.test(match):
				return IMAGE_URLS.GALEKNOLL;
			case /Burt Sharpe/i.test(match):
				return IMAGE_URLS.BURTSHARPE;
			case /Lynn Sharpe/i.test(match):
				return IMAGE_URLS.LYNNSHARPE;
			default:
			return {exists: false};
		}
	}
}

module.exports = function (grunt, options) {
	grunt.registerTask('audToVid', 'Convert video to audio file by name', function () {
		var done = this.async();
		var audFiles = glob.sync(global.config.audio + '/*.*');
		var vidFiles = glob.sync(global.config.video + '/*.*');

		var audFiles = _.filter(audFiles, function (file) {
			return /^[\w ]+\d{4}-\d{2}-\d{2}[\w ]+- /.test(path.basename(file));
		});

		var audNames = _.map(audFiles, function (val){
			return path.basename(val).replace(/(\.mp3|\.m4a)$/, '');
		});

		var vidNames = _.map(vidFiles, function (val){
			return path.basename(val, '.mp4');
		});

		var diffNames = _.difference(audNames, vidNames);
		var diffIndexes = [];
		_.each(diffNames, function (val) {
			var idx = audNames.indexOf(val);
			if (idx >= 0) {
				diffIndexes.push(idx);
			}
		});

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
		for (var i = 0; i < diffIndexes.length; ++i) {
			index = diffIndexes[i];
			audPath = audFiles[index];
			fileName = audNames[index];
			vidPath = global.config.video + '/' + fileName + '.mp4';
			imageFile = getImage(fileName);
			//console.info(imageFile);
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
				.outputOptions('-shortest', '-tune', 'stillimage','-pix_fmt', 'yuv420p')
				.on('start', function (cmd) {console.info('began with ' + cmd);})
				.on('stderr', function (err) {
					/error/i.test(err) && console.error('stderr: ' + err);
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

