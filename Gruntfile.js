var _ = require('lodash');
var path = require('path');

module.exports = function (grunt) {
	global.config = {
		image: path.join(__dirname, '../Image'),
		audio: path.join(__dirname, '../Audio'),
		video: path.join(__dirname, '../Video')
	};

	var config = _.extend({},
		require('load-grunt-config')(grunt, {
			configPath: path.join(__dirname, 'tasks/options'),
			loadGruntTasks: false,
			init: false
		}),
		require('load-grunt-config')(grunt, { // Custom options have precedence
			configPath: path.join(__dirname, 'tasks/custom-options'),
			init: false
		})
	);

	grunt.loadTasks('tasks');


	grunt.initConfig(config);
};