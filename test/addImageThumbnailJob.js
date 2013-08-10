var serverCommon = process.env.SERVER_COMMON;

var winston = require(serverCommon + '/lib/winstonWrapper').winston
	, serverCommonConf = require(serverCommon + '/conf')
	, cloudStorageUtils = require(serverCommon + '/lib/cloudStorageUtils')
	, appInitUtils = require(serverCommon + '/lib/appInitUtils')
	, sqsConnect = require(serverCommon + '/lib/sqsConnect')
	, mongoose = require(serverCommon + '/lib/mongooseConnect').mongoose
	, AttachmentInfoModel = require(serverCommon + '/schema/attachmentInfo').AttachmentInfoModel


var initActions = [
    appInitUtils.CONNECT_MONGO
];

appInitUtils.initApp( 'addImageThumbnailJob', initActions, serverCommonConf, function() {

	var run = function(callback) {

		var attachmentInfoId = '5203ece9c21027e9f6ea543b';

		winston.doInfo('running');
		AttachmentInfoModel.findById( attachmentInfoId, function(mongoErr, attachmentInfo) {
			if ( mongoErr ) {
				callback( winston.makeMongoError( mongoErr ) );

			} else if ( ! attachmentInfo ) {
				callback( winston.makeError('no attachmentInfo', {attachmentInfoId: attachmentInfoId}) );

			} else {
				attachmentInfo.attachmentThumbExists = false;
				attachmentInfo.attachmentThumbSkip = false;
				attachmentInfo.attachmentThumbErr = null;

				var updateData = {
					$set: {
							attachmentThumbExists: attachmentInfo.attachmentThumbExists
						, attachmentThumbSkip: attachmentInfo.attachmentThumbSkip
					}, $unset: {
						attachmentThumbErr: true
					}
				};
				
				AttachmentInfoModel.findByIdAndUpdate( attachmentInfoId, updateData, function(mongoErro) {
					if ( mongoErr ) {
						callback( winston.makeMongoError( mongoErr ) );

					} else {
						var thumbnailJob = {
						    cloudPath : cloudStorageUtils.getAttachmentPath( attachmentInfo )
						  , isRollover : false
						  , resourceId : attachmentInfo._id
						  , hash : attachmentInfo.hash
						  , fileSize : attachmentInfo.fileSize
						  , jobType : 'thumbnail'
						  , modelName : 'AttachmentInfo'
						}

						winston.doInfo('adding job to queue');
						sqsConnect.addMessageToWorkerQueue( thumbnailJob, callback );
					}
				});
			}
		});
	}

	winston.doInfo('here');

	run( function(err) {
		if ( err ) {
			winston.handleError( err );
		}
		mongoose.disconnect();
		winston.doInfo('All done.');
	});
});