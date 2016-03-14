var fs = require('fs');
var CONFIG = require('../config/config');

var Writer = function (fileName) {

    /**
     * Initial config
     */
    var _fileName = fileName;
    var _location = CONFIG.partialSitemapsPath;
    var _indexSitemap = CONFIG.indexSitemapPath + CONFIG.indexSitemapName;
    var _page = 0;
    var _sitemapName = selectRecentFile();
    var _sitemapPath = _location + _sitemapName;
    var _defaultPriority = CONFIG.crawler.defaultPriority;
    var _defaultFreq = CONFIG.crawler.defaultFreq;
    var _maxFileSize = CONFIG.crawler.maxFileSize;
    var _currentBuffer = '';

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
        var entry = getSitemapEntry (url, data.freq, data.priority);
        _currentBuffer += entry + '\n';
    };

    /**
     * Write currently scanned urls to sitemap
     */
    this.writeBuffer = function () {
        console.log('Saving sitemaps....');
        _updateFileName();
        var currentContent = fs.readFileSync(_sitemapPath, 'utf8');
        var file_content = currentContent.substring(_head);
        var file = fs.openSync(_sitemapPath, 'r+');
        var bufferedText = new Buffer(_currentBuffer + file_content);
        fs.writeSync(file, bufferedText, 0, bufferedText.length, _head);
        fs.close(file);
        _currentBuffer = '';
        _head += _currentBuffer.length;
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
        var partialPath = CONFIG.s3.use ? CONFIG.s3.partialSitemapsPath : _location;
        var maps = '';
        for (var i = 0; i < sitemaps.length; i++) {
            if (sitemaps[i] !== _indexSitemap) {
                var url = domain + '/' +  partialPath + sitemaps[i];
                var entry = getSitemapEntry(url);
                maps += entry + '\n';
            }
        }
        //enter route domain
        var root = domain + '/';
        if (CONFIG.crawler.prefixFolder) {
            root += CONFIG.crawler.prefixFolder + '/';
        }
        var rootEntry = getSitemapEntry(root);
        maps += rootEntry + '\n';
        var content = fs.readFileSync('./templates/sitemapSkeleton', 'utf8');
        maps += '</urlset>';
        content = content.replace('</urlset>', maps);
        fs.writeFileSync(location, content, 'utf8');
        console.log("Main sitemap updated!");
    }

    /**
     * Get sitemap entry
     */
    function getSitemapEntry(url, freq, priority) {
        var template = fs.readFileSync('./templates/sitemapEntry', 'utf8');
        return  template
            .replace(':location', url)
            .replace(':freq', freq || _defaultFreq)
            .replace(':priority', priority || _defaultPriority);
    }

    /**
     * Select write file to start with
     */
    function selectRecentFile () {
        var sitemaps = fs.readdirSync(_location);
        for (var i = 0; i < sitemaps.length; i++) {
            var str = sitemaps[i];
            var fileNumber = parseInt(str.substring(str.lastIndexOf(_fileName + '.') + _fileName.length + 1, str.lastIndexOf('.')), 10);
            if (!isNaN(fileNumber) && fileNumber > _page) {
                _page = fileNumber;
            }
        }
        return _fileName + '.' + _page +'.xml'
    }

    /**
     * Validate file size
     */
    function _updateFileName() {
        if (!_isFileSizeOK(_sitemapPath)) {
            console.log('File too big. Creating new file...');
            _page++;
            _sitemapName = _fileName + '.' + _page +'.xml';
            _sitemapPath = _location + _sitemapName;
            _head = _getHead(_sitemapPath);
        }
    }

    /***
     * Check file size
     */
    function _isFileSizeOK (path) {
        var stats = fs.statSync(path);
        var fileSizeInMb = stats["size"] / 1000000.0;
        console.log(path + ' file size is ' + fileSizeInMb + ' MB');
        return fileSizeInMb < _maxFileSize;
    }
};

module.exports = Writer;