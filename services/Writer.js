var fs = require('fs');
var CONFIG = require('../config/config');
var nodePath = require('path');

var Writer = function (fileName) {

    /**
     * Initial config
     */
    var _fileName = fileName;
    var _location = CONFIG.sitemapLocation;
    var _indexSitemap = CONFIG.indexSitemap;
    var _sitemapName = _fileName + '.xml';
    var _sitemapPath = _location + _sitemapName;
    var _defaultPriority = CONFIG.crawler.defaultPriority;
    var _defaultFreq = CONFIG.crawler.defaultFreq;
    var _currentBuffer = '';
    _prepareTargetFolder (_location);
    _prepareTargetFolder (nodePath.parse(_indexSitemap).dir);
    var _head = _getHead(_sitemapPath);

    /**
     * Should have at lease url present
     * @param data
     * @param data.url - url
     * @param data.freq - change frequency [always, hourly, daily, weekly, monthly, yearly, never]
     * @param data.priority - url priority
     */
    this.addEntry = function (data) {
        var url = data.url;
        var freq = data.freq || _defaultFreq;
        var priority = data.priority || _defaultPriority;
        var template = fs.readFileSync('./templates/sitemapEntry', 'utf8');
        var entry = template
            .replace(':location', url)
            .replace(':freq', freq)
            .replace(':priority', priority);
        _currentBuffer += entry + '\n';
    };

    /**
     * Write currently scanned urls to sitemap
     */
    this.writeBuffer = function () {
        console.log('Saving sitemaps....');
        var currentContent = fs.readFileSync(_sitemapPath, 'utf8');
        var file_content = currentContent.substring(_head);
        var file = fs.openSync(_sitemapPath, 'r+');
        var bufferedText = new Buffer(_currentBuffer + file_content);
        fs.writeSync(file, bufferedText, 0, bufferedText.length, _head);
        fs.close(file);
        _head += _currentBuffer.length;
        _currentBuffer = '';
        console.log('Sitemaps saved. Head updated.');
    };

    /**
     * Get the position where we have to continue to write in sitemap
     * @param path
     * @returns {number}
     * @private
     */
    function _getHead(path) {
        console.log('Getting head... ' + path);
        var content = fs.readFileSync('./templates/sitemapSkeleton', 'utf8');
        try {
            content = fs.readFileSync(path, 'utf8');
        } catch (e) {
            console.log(path + ' - did not exist. File created!');
            fs.writeFileSync(path, content, 'utf8');
            _refreshIndex();
        }
        return content.indexOf('</urlset>') - 1;
    }

    /**
     * Refresh main sitemap (one connecting all the sub-sitemaps)
     * @private
     */
    function _refreshIndex() {
        var location = _indexSitemap;
        var domain = CONFIG.crawler.entryProtocol + '://' + CONFIG.crawler.entryDomain;
        var sitemaps = fs.readdirSync(_location);
        //we add root domain in main sitemap file
        sitemaps.push ('');
        var maps = '';
        for (var i = 0; i < sitemaps.length; i++) {
            if (sitemaps[i] !== _indexSitemap) {
                var url = domain + '/' + sitemaps[i];
                var template = fs.readFileSync('./templates/sitemapEntry', 'utf8');
                var entry = template
                    .replace(':location', url)
                    .replace(':freq', _defaultFreq)
                    .replace(':priority', _defaultPriority);
                maps += entry + '\n';
            }
        }
        var content = fs.readFileSync('./templates/sitemapSkeleton', 'utf8');
        maps += '</urlset>';
        content = content.replace('</urlset>', maps);
        fs.writeFileSync(location, content, 'utf8');
        console.log("Main sitemap updated!");
    }


    /**
     * Make sure folders we write to exist
     * @param path
     */
    function _prepareTargetFolder (path) {
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
};

module.exports = Writer;