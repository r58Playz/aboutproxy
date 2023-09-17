import { createBareServer } from '@tomphttp/bare-server-node';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import serveStatic from 'serve-static';

const bare = createBareServer('/bare/');
const serve = serveStatic(
	fileURLToPath(new URL('static/', import.meta.url)),
	{
		fallthrough: false,
	}
);
const server = createServer();

server.on('request', (req, res) => {
	if (bare.shouldRoute(req)) {
		bare.routeRequest(req, res);
		return;
	}
	serve(req, res, (err) => {
		res.writeHead(err?.statusCode || 500, {
			'Content-Type': 'text/plain',
		});
		res.end("Error.");
	});
});

server.on('upgrade', (req, socket, head) => {
	if (bare.shouldRoute(req, socket, head)) {
		bare.routeUpgrade(req, socket, head);
	} else {
		socket.end();
	}
});

server.listen({
	port: process.env.PORT || 8080,
});
