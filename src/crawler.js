const express = require('express');

const fetcher = require('./fetcher.js');

const TRY_COUNT_LIMIT = 2;
const HTTP_OK = 200;
const HTTP_ERROR = 500;
const SERVICE_TEMPORARILY_UNAVAILABLE = 503;
const BAD_REQUEST = 400;
const NOT_FOUND = 404;
const PORT = 3001;

const app = express();

app.use(express.json());

app.post('/parse', async (req, res, next) => {	

	try {
		const domainName = req.body.domainName;
		//console.log(domainName);
		if (!domainName) {
			res.statusCode = BAD_REQUEST;
			res.send({ message: 'Empty request' });
			res.end();
			return;
		}
		const visited = await process(domainName);		
		res.json(getGoodLinks(visited));
	} catch (e) {
		console.log(e);
		next(e.message);
	}
});

app.use((err, req, res, next) => {
	if (res.headersSent) {
		return next(err);
	}
	res.status(500);
	res.send({ error: err });
});

app.listen(PORT, 'localhost', () => {
	console.log(`Server running on ${PORT}`);
})

async function process(domainName) {
	const visited = {};
	const queue = [];

	queue.push(domainName);

	while (queue.length > 0) {
		const url = queue.shift();

		console.log(url);

		const getLinksResult = await getLinks(url, domainName);		

		if (!visited[url]) {
			visited[url] = {
				tryCount: 0
			};
			visited[url].status = getLinksResult.status;
			visited[url].tryCount++;

			if (getLinksResult.status == HTTP_ERROR || getLinksResult.status == SERVICE_TEMPORARILY_UNAVAILABLE) {
				if (visited[url].tryCount < TRY_COUNT_LIMIT) {
					queue.push(url);
				}
			} else if (getLinksResult.status == HTTP_OK) {
				getLinksResult.links.map(link => {
					if (!(link in visited) && !(queue.includes(link)) && new URL(link).origin === domainName) {
						queue.push(link);
					}
				})
			} // else if (getLinksResult.status == NOT_FOUND) {}
		}
	}
	return visited;
};

async function getLinks(url, domainName) {
	const result = await fetcher(url);
	
	let links = [];
	if (result.status === HTTP_OK) {
		
		const pageContent = await result.data//text();		
		links = parseLinksFromPage(pageContent).map(link => new URL(link, domainName).href);
	}
	return { links, status: result.status }
}

function parseLinksFromPage(pageContent) {
	const linkRex = /(<a href="[^"]*">)|(<a [\w\s="-0]* href="[^"]*">)|(<a [\w\s="-]* href="[^"]*" [\w\s="-]*>)/g;
	const aTags = pageContent.match(linkRex);
	let links = [];
	if (Array.isArray(aTags)) {
		links = aTags.map(parseLink);
	}	
	return links;
}

function parseLink(link) {
	const hrefRex = /href=(["'])(.*?)\1/;
	const result = link.match(hrefRex);
	return result ? result[2] : '';
}

function getGoodLinks(visited) {	
	return Object.keys(visited).filter(key => visited[key].status === 200);
}