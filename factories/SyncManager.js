var CONFIG = require('../config/config');
var S3 = require('./S3');
var fs = require ('fs');
var Promise = require ('bluebird');

function SyncManager() {

    var _s3config = CONFIG.s3;
    var _sitemapName = CONFIG.indexSitemapName;
    var _s3SitemapPath = _s3config.indexSitemapPath;
    var _s3PartialsSitemapsPath = _s3config.partialSitemapsPath;
    var _localSitemapPath = CONFIG.indexSitemapPath;
    var _localPartialsSitemapsPath = CONFIG.partialSitemapsPath;
    var _s3Queue = _s3config.queue;
    var _localeQueue= CONFIG.crawler.queue;
    var _s3Sitemap = _s3SitemapPath + _sitemapName;
    var _sitemap = _localSitemapPath + _sitemapName;
    var _s3 = new S3 (_s3config.bucket);
    var _self = this;

    this.syncLocal = function () {

        return new Promise (function (resolveSync, rejectSync) {
            Promise.all([
                _self.checkIfFileExistsInS3 (_s3Sitemap),
                _self.checkIfFileExistsInS3(_s3Queue),
                _self.fecthS3FileList(_s3PartialsSitemapsPath)
            ]).then(function (result) {
                var hasSitemap = result[0];
                var hasProgress = result [1];
                var files = result [2];
                if (hasSitemap) {
                    files.push (_s3Sitemap);
                }
                if (hasProgress) {
                    files.push (_s3Queue);
                }
                var filesToFetch = [];
                files.forEach(function (key) {
                    filesToFetch.push(_self.downloadFileFromS3(key));
                });
                Promise.all(filesToFetch).then (function (result){
                    var index = 0;
                    result.forEach (function (file) {
                        var fileS3Key = files[index];
                        var fileLocalPath;
                        if (fileS3Key  === _s3Sitemap) {
                            fileLocalPath = _sitemap;
                        } else if (fileS3Key === _s3Queue){
                            fileLocalPath = _localeQueue;
                        }
                        else {
                            fileLocalPath = _localPartialsSitemapsPath + fileS3Key.replace(_s3PartialsSitemapsPath, '');
                        }
                        _self.saveFile(fileLocalPath, file.Body);
                        index++;
                    });
                    resolveSync(true);
                }).catch (function (){
                    rejectSync (false);
                });
            }).catch (function (error) {
                console.log('Something went wrong with amazon sync. Continuing anyway...');
                console.log(error);
            })
        });
    };

    this.syncCloud = function () {
        var sitemaps = _self.readDir(_localPartialsSitemapsPath);
        sitemaps.forEach (function (sitemap){
            var partialSitemap = _localPartialsSitemapsPath + sitemap;
            var content = _self.readFile(partialSitemap);
            _self.uploadFile(_s3PartialsSitemapsPath + sitemap, content);
        });
        var content = _self.readFile(_sitemap);
        _self.uploadFile(_s3Sitemap, content);
        content = _self.readFile(_localeQueue);
        _self.uploadFile(_s3Queue, content);
    };

    this.uploadFile = function (key, content) {
        _s3.upload({
            key: key,
            body: content
        })
    };

    this.readDir = function (path) {
        return fs.readdirSync(path);
    };

    this.readFile = function (path) {
        return fs.readFileSync(path, 'utf8');
    };

    this.downloadFileFromS3 = function (key) {
        return _s3.download(key)
    };

    this.checkIfFileExistsInS3 = function (filePath) {
        return _s3.checkIfFileExists(filePath).then (function (metadata) {
            return true;
        }).catch (function () {
            return false;
        })
    };

    this.fecthS3FileList = function (path) {
        return _s3.getFileList(path).then (function (fileList) {
            return fileList;
        })
    };

    this.saveFile = function (path, content) {
        fs.writeFileSync(path, content);
    };
}

module.exports = SyncManager;