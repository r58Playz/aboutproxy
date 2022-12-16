import { createServer, IncomingMessage, ServerResponse } from 'http';

createServer();

function routeRequest(data, sendHandle) {
  const req = new IncomingMessage(sendHandle);
  Object.assign(req, data.req);
  req.resume();
  const res = new ServerResponse(req);
  console.log(req.url);
  req.on('data', data => {
    console.log(data);
  });
  res.write('test');
  res.end();
}

const messageHandler = {
  routeRequest
};
process.on('message', (message, sendHandle) => {
  if (message.type in messageHandler) {
    messageHandler[message.type](message.data, sendHandle);
  } else {
    console.log('unknown', message.type);
  }
});
