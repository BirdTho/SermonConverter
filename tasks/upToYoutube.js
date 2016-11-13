var ResumableUpload = require('node-youtube-resumable-upload');
var resumableUpload = new ResumableUpload();

var defaultTags = [
	'shoreline',
	'full',
	'gospel',
	'fellowship',
	'sfgf',
	
];

resumableUpload.tokens = null;
resumableUpload.filepath = './video.mp4';
resumableUpload.metadata = {
    snippet: {
      title: $('#title').val(),
      description: $('#description').text(),
      tags: this.tags,
      categoryId: 27 // education. See ./categoryIDs.json
    },
    status: {
      privacyStatus: $('#privacy-status option:selected').text()
    }
  };
resumableUpload.retry = 3; // Maximum retries when upload failed.
resumableUpload.upload();
resumeableUpload.on('progress', function(progress) {
    console.log(progress);
});
resumableUpload.on('success', function(success) {
    console.log(success);
});
resumableUpload.on('error', function(error) {
    console.log(error);
});