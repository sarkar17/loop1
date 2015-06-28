var express = require('express');
var app = express();
var http = require('http');
var enums = require('enum');
var sorted = require('sort');

var feedElements = {VERGE: [], MEDIUM: [], NYT: []};
var feedSources = {VERGE: 'VERGE', MEDIUM: 'MEDIUM', NYT: 'NYT'};

var shareSource = {TWITTER: 'TWITTER', FACEBOOK: 'FACEBOOK', LINKEDIN: 'LINKEDIN'};
var shareUrl = {TWITTER: "http://cdn.api.twitter.com/1/urls/count.json?url="};

var parser = require('parse-rss');

var feedURL = {
	VERGE: "http://www.theverge.com/tech/rss/index.xml",
	MEDIUM: "https://medium.com/feed/tech-talk",
	NYT: "http://rss.nytimes.com/services/xml/rss/nyt/Technology.xml"
}

function getSocialNetworkScore(element, source) {
	var reqUrl = shareUrl[source] + element.url;
	var twitterResponse = '';
	http.get(reqUrl, function(res){
		var body = '';

		res.on('data', function(chunk) {
    		body += chunk;
		});

		res.on('end', function() {
        	jsonResponse = JSON.parse(body);
        	element.shareScore += jsonResponse.count;
        	// console.log("Got response: ", jsonResponse);
    	});
	})
}

function findShareScore(element) {
	getSocialNetworkScore(element, shareSource.TWITTER);
}

function updateShareScore(source) {
	feedElements[source].forEach(function(element) {
		findShareScore(element)
	});
	

}

function editUrl(url, source, guid) {
	switch(source) {
		case feedSources.MEDIUM:
			var sourceIndex = url.indexOf("?source=rss");
			return url.slice(0,sourceIndex);
		case feedSources.NYT:
			return guid;
		default:
			return url;
	}
}

function updateDataBase(key) {
	var source = feedSources[key];
	parser(feedURL[source], function(err, rss){
		console.log(rss);
		feedElements[source] = rss.map(function(atom) {
			editedUrl = editUrl(atom.link, source, atom.guid);
			return {
				'title' : atom.title,
				'date' : atom.pubdate,
				'url' : editedUrl,
				'shareScore' : 0
			}
		});
		updateShareScore(source);
		// console.log(feedElements);
	});
}

function compare(a,b) {
  if (a.shareScore < b.shareScore)
    return 1;
  if (a.shareScore > b.shareScore)
    return -1;
  return 0;
}

updateDataBase(feedSources.VERGE);
updateDataBase(feedSources.MEDIUM);
updateDataBase(feedSources.NYT);

function sortDataBases() {
	for (var source in feedSources) {
		feedElements[source].sort(compare);
	}
}


app.get('/', function (req, res) {
	sortDataBases();
  	// res.send('Hello World!');
  	res.setHeader('Content-Type', 'application/json');
  	res.send(feedElements);
});

var server = app.listen(3000, function () {

  var host = server.address().address;
  var port = server.address().port;

  // console.log(host+' : '+port);

});