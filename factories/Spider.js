var Crawler = require("simplecrawler");
var Writer = require('./Writer');
var CustomQueue = require('./CustomQueue');
var CONFIG = require('../config/config');
var spiderConfig = CONFIG.crawler;
var fs = require('fs');
var events = require('events');

var Spider = function () {

    /**
     * Initial settings
     * @type {Spider}
     * @private
     */
    var _self = this;
    //save counter
    var _counter = 0;
    //object to keep track of all writers
    var _writers = {};
    var _prefixFolder = spiderConfig.prefixFolder;

    //inherit from
    events.EventEmitter.call(_self);
    /**
     * Full config: https://github.com/cgiffard/node-simplecrawler
     * Initial crawler configuration
    */
    var _crawler = new Crawler(spiderConfig.entryDomain);
    _crawler.initialPath = spiderConfig.entryPath;
    _crawler.initialProtocol = spiderConfig.entryProtocol;
    _crawler.interval = spiderConfig.fetchInterval;
    _crawler.maxConcurrency = spiderConfig.concurrentConnections;
    _crawler.downloadUnsupported = false;
    _crawler.stripQuerystring = spiderConfig.stripUrlParams;
    _crawler.parseScriptTags = false;
    _crawler.parseHTMLComments = false;
    _crawler.queue = new CustomQueue();

    /**
     * Fetch conditions
    */
    //skip resources (everything with . in url) or strangely parsed urls
    _crawler.addFetchCondition(function (parsedURL) {
        return !parsedURL.path.match(/.*\..*/i);
    });

    //ignore encoded urls
    if (spiderConfig.ignoreEncodedUrls) {
        _crawler.addFetchCondition(function (parsedURL) {
            return parsedURL.path.indexOf('%') === -1;
        });
    }
    //ignore specific folders
    _crawler.addFetchCondition(function (parsedURL, queueItem) {
        for (var i = 0; i < spiderConfig.allowedFolders.length; i++) {
            var allowedFolder = spiderConfig.allowedFolders [i];
            if (parsedURL.path.indexOf(allowedFolder + '/') === 0 || (parsedURL.path === allowedFolder)) {
                return true;
            }
        }
        return spiderConfig.allowedFolders.length === 0;
    });

    /**
     * Start
     */
    _crawler.on("crawlstart", function () {
        console.log('Crawling started....');
    });

    /**
     * Fetch completed, handle url
     */
    _crawler.on("fetchcomplete", function (queueItem) {
        console.log('Processing url ... ' + queueItem.url);
        var id = _self._getFileName(queueItem.path);
        if (!id) {
            return;
        }
        if (!_writers[id]) {
            _writers[id] = new Writer(id);
        }
        var data = {
            url: queueItem.url
        };
        _writers[id].addEntry(data);
        _counter++;
        if (_counter > spiderConfig.saveFrequency) {
            _counter = 0;
            _self._saveProgress();
        }
    });

    /**
     * Error logging - we could do something smarter here
     */
    _crawler.on("queueerror", function (errorData) {
        console.log(errorData);
    });

    _crawler.on("fetcherror", function (queueItem) {
        console.log(queueItem);
    });

    /**
     * When done, make it wait for specific amount of time
     */
    _crawler.on("complete", function (queueItem) {
        _self._saveProgress();
        _crawler.stop();
        _self.emit('CrawlerDone');
    });

    /**
     * Public methods
     */
    _self.run = function () {
        _crawler.queue.defrost(spiderConfig.queue);
        _crawler.start();
    };


    /**
     * Helpers
     */

    /**
     * Convert url path to file name
     * @param path
     * @returns {*}
     * @private
     */
    _self._getFileName = function (path) {
        var realPath = path;
        realPath = realPath.substring(1);
        if (_prefixFolder) {
            realPath = realPath.replace(_prefixFolder + '/', '');
        }
        if (realPath.length === 0) {
            return;
        }
        var pathLength;
        try {
            pathLength = realPath.match(/\//g).length;
        } catch (e) {
            pathLength = 0;
        }
        if (pathLength === 0) {
            return realPath;
        } else {
            var pathSplit = realPath.split('/');
            if (spiderConfig.folderDepth === 1) {
                return pathSplit[0];
            }
            return pathSplit[0] + '.' + pathSplit [1];
        }
    };

    /**
     * Save progress
     * @private
     */
    _self._saveProgress = function () {
        console.log('Saving data....');
        _crawler.queue.freeze(spiderConfig.queue, function () {
            console.log('Queue saved');
            for (var key in _writers) {
                if (_writers.hasOwnProperty(key)) {
                    _writers[key].writeBuffer();
                }
            }
            console.log("Total fetched urls %d", _crawler.queue.complete());
            console.log("Total errored urls %d", _crawler.queue.errors());
            console.log("Average request time is %dms.", _crawler.queue.avg("requestTime"));
            console.log("Average request latency is %dms.", _crawler.queue.avg("requestLatency"));
            console.log("Average download time is %dms.", _crawler.queue.avg("downloadTime"));
            console.log("The average resource size received is %d bytes.", _crawler.queue.avg("actualDataSize"));
            _self.emit('ProgressSaved');
        });
    };
};

Spider.prototype.__proto__ = events.EventEmitter.prototype;

module.exports = Spider;