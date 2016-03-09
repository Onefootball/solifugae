var Spider = require('./services/Spider');
var CONFIG = require('./config/config');


var Solifuage = new Spider();

Solifuage.on ("CrawlerDone", function () {
    setTimeout(function () {
        console.log("Restarting...");
        Solifuage.run();
    }, CONFIG.crawler.timeToWait)
});

Solifuage.run();
