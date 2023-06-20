// const https = require('https');
// const http = require('http');
const axios = require('axios');

module.exports = async function fetcher(url) {
	return await axios.get(url)
		.then(res => res)
		.catch(err => {			
			return err.response;
		})
}

// const protocolClient = {
// 	'http:': http,
// 	'https:': https
// }

// module.exports = function fetcher(url) {

// 	return new Promise((resolve, reject) => {
// 		const dstURL = new URL(url);
// 		const hostname = dstURL.hostname;
// 		const client = protocolClient[dstURL.protocol];
// 		client.get(dstURL.href, res => {
// 			res.on('error', err => reject(err));
// 			let body = [];
// 			res.on('data', chunk => {
// 				body.push(chunk);
// 			});
// 			res.on('end', () => {
// 				resolve(
// 					{
// 						body: {
// 							hostname: body.join('')
// 						}
// 					}
// 				);
// 			});
// 		});
// 	})
// };

