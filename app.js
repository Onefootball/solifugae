var Spider = require('./factories/Spider');
var CONFIG = require('./config/config');
var fs = require('fs');
var nodePath = require ('path');
var SyncManager = require ('./factories/SyncManager');
var Solifuage = new Spider();
var useCloud = CONFIG.s3.use;


prepareTargetFolder (CONFIG.partialSitemapsPath);
prepareTargetFolder (CONFIG.indexSitemapPath);

if (useCloud) {
    var syncManager = new SyncManager();
    console.log("starting....");
    syncManager.syncLocal().then (function (success) {
        if (success) {
            startCawler();
            Solifuage.on ("ProgressSaved", function () {
                syncManager.syncCloud();
            });
        } else {
            console.log("Something went wrong with writing files from amazon. Program will finish to prevent progress overwrite");
            console.log(error);
            process.exit(1);
        }

    });
} else {
    startCawler();
}

function startCawler() {
    Solifuage.on ("CrawlerDone", function () {
        setTimeout(function () {
            console.log("Restarting...");
            Solifuage.run();
        }, CONFIG.crawler.timeToWait)
    });
    Solifuage.run();
}


/**
 * Make sure folders we write to exist
 * @param path
 */
function prepareTargetFolder (path) {
    var exists = true;
    try {
        fs.accessSync(path, fs.F_OK);
    } catch (e) {
        exists = false;
        console.log(path + " does not exist. Creating...");
    }
    if (!exists) {
        var l = path.split('/');
        var p = '';
        if (nodePath.isAbsolute(path)) {
            p = '/';
        }
        for (var i = 0; i < l.length; i++) {
            if (l [i] !== '') {
                p += l [i];
                try {
                    fs.mkdirSync(p);
                } catch (e) {
                    if (e.code === 'EACCES') {
                        console.log("ERROR: Check output path permissions!");
                        process.exit(1);
                    }
                }
                p += '/';
            }
        }
        console.log(path + " successfully created");
    }
}