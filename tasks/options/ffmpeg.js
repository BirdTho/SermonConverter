'use strict'

var grunt = require( 'grunt' );
var _ = grunt.util._;

module.exports = {
	options: {
		FFmpegOptions: {
			withVideoCodec: 'libx264',
			withAudioCodec: 'libfdk_aac'
		}
	}
};