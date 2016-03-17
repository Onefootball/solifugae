var AWS = require('aws-sdk');
var Promise = require('bluebird');

var S3 = function (bucket) {

    var _s3bucket = new AWS.S3({params: {Bucket: bucket}});


    this.checkIfFileExists = function (key) {
        var params = {
            Key: key
        };
        return new Promise(function (resolveFileExists, rejectFileExists) {
            _s3bucket.headObject(params, function (err, metadata) {
                if (err) {
                    console.log("s3:", key, err.code);
                    rejectFileExists(err);
                } else {
                    console.log(params.Key + " found in bucket");
                    resolveFileExists(metadata);
                }
            });
        });
    };


    this.getFileList = function (key) {
        var params = {
            Marker: key
        };
        return new Promise(function (resolveFileExists, rejectFileExists) {
            _s3bucket.listObjects(params, function (err, data) {
                if (err) {
                    console.log("s3:", key, err.code);
                    rejectFileExists(err);
                } else {
                    var fileList = [];
                    data.Contents.forEach (function (file) {
                        fileList.push (file.Key);
                    });
                    resolveFileExists(fileList);
                }
            });
        });
    };

    this.upload = function (params) {
        var uploadParams = {
            Key: params.key,
            Body: params.body,
            ACL: 'public-read',
            ContentType: 'application/xml'
        };
        _s3bucket.putObject(uploadParams, function (err, data) {
            if (err) {
                console.log("Error uploading data: ", err);
            } else {
                console.log("Successfully uploaded data to s3 - " + uploadParams.Key);
            }
        });

    };

    this.download = function (key) {
        var params = {
            Key: key
        };

        return new Promise(function (resolveDownload, rejectDownload) {
            _s3bucket.getObject(params, function (err, data) {
                if (err) {
                    console.log("Error getting data: ", err);
                    rejectDownload(err);
                } else {
                    resolveDownload(data);
                }
            });
        });
    };
};

module.exports = S3;
