# solifugae

The purpose of this project is to generate a sitemap by crawling webpages.

Solifudges, builds multiple sitemaps and gathers them all in one index sitemap. The separation is done by your url structure. 

### Running locally

To run project locally you need to have installed

```
1) Node
```

Clone the repo then install dependecies: 

```
npm install
```

Then you can run the project: 

```
node app.js

```


### Config

To adjust project to your needs, modify the config values in config/config.json.

Example: 

```
{
  "partialSitemapsPath" : "/arena/solifugae_data/sitemaps/",
  "indexSitemapPath": "/arena/solifugae_data/",
  "indexSitemapName": "sitemap.xml",
  "s3": {
    "use": true,
    "bucket": "onefootball-solifugae",
    "partialSitemapsPath": "sitemaps/",
    "indexSitemapPath": "",
    "queue": "data/queue.json"
  },
  "crawler": {
    "entryDomain": "www.onefootball.com",
    "entryPath": "/en",
    "queue": "/arena/solifugae_data/queue.json",
    "entryProtocol": "https",
    "prefixFolder": "pub",
    "fetchInterval": 1000,
    "concurrentConnections": 3,
    "defaultPriority": 0.5,
    "defaultFreq": "daily",
    "saveFrequency": 1000,
    "allowedFolders": ["/de", "/fr",  "/en", "/es"],
    "stripUrlParams": true,
    "folderDepth": 2,
    "timeToWait": 3600000,
    "maxFileSize": 5
  }
}
```

#### partialSitemapsPath

Local path to partials sitemaps. That is sitemaps that belongs to specific url folder.

#### indexSitemapPath

Local path to of index sitemap. Sitemap that contains other sitemaps.

#### indexSitemapName

Index sitemap name

#### s3 

Sometimes, we run our website on multiple servers. To enable sitemaps to be in sync, we can give them common storage in s3.

##### s3.use

Boolean value for s3 usage

##### s3.bucket [optional]

Name of s3 bucket where to store sitemaps

##### s3.partialSitemapsPath [optional]

Path in s3 bucket (key) where to store partials sitemaps

##### s3.indexSitemapPath [optional]

Path in s3 bucket (key) to index sitemap.

##### s3.queue [optional]

Location in s3 where to save spider progress.

#### crawler

Crawler specific options

##### crawler.entryDomain

Domain to crawl

##### crawler.entryPath

Path to start with. If you want to start with root domain, just add '/'.

##### crawler.queue

Location of spider progress on disk (local sotrage)

##### crawler.entryProtocol

Protocol on which site runs

##### crawler.prefixFolder [optional]

You can specify a folder that will be prefixed with to all your urls. E.g.: You crawl https://www.onefootball.com/en and use pub prefix folder, actual url crawled and used will be https://www.onefootball.com/pub/en

##### crawler.fetchInterval [ms]

How often pages are fetched

##### crawler.concurrentConnections

Number of concurent connections used for crawling

##### crawler.defaultPriority

Sitemap priority value

##### crawler.defaultFreq

Default frequency used in sitemaps

##### crawler.saveFrequency

After how many urls changes are saved permanently (to local storage and s3)

##### crawler.allowedFolders

Subfolders that should be crawled

##### crawler.stripUrlParams

Set to true to strip query string

##### crawler.folderDepth

We use fodler structure to name sub-sitemaps. You can define the 'depth' of naming. E.g.: if set to 2, result of https://www.onefootball.com/en/match/some-match will be saved to en.match.0.xml

##### crawler.timeToWait [ms]
 
When all urls are crawled, spider will wait for time specified here, before checking pages again.

##### crawler.maxFileSize

Sitemap can have 10k urls or 10MB. You can set maximum file size here, to break sitemas in smaller files.