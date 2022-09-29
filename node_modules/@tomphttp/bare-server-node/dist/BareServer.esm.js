import Stream from 'node:stream';
import createHttpError from 'http-errors';
import http from 'node:http';
import https from 'node:https';
import { randomBytes } from 'node:crypto';
import { promisify } from 'node:util';

/*! fetch-headers. MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> */

/** @param {Headers} instance */
function assert (instance, argsCount = 0, requiredArgs = 0, method = '') {
  if (!(instance instanceof Headers)) {
    throw new TypeError('Illegal invocation')
  }
  if (argsCount < requiredArgs) {
    throw new TypeError(`"Failed to execute '${method}' on 'Headers'" requires at least ${requiredArgs} argument, but only ${argsCount} were provided.`)
  }
  return /** @type {Bag} */ (wm.get(instance))
}

/**
 * @typedef Bag
 * @property {Object<string, string>} items
 * @property {Array<string>} cookies
 * @property {string} guard
 */

/**
 * @param {Bag} bag
 * @param {HeadersInit} object
 */
function fillHeaders (bag, object) {
  if (object === null) throw new TypeError("HeadersInit can't be null.")

  const iterable = object[Symbol.iterator];

  if (iterable) {
    // @ts-ignore
    for (let header of object) {
      if (typeof header === 'string') {
        throw new TypeError('The provided value cannot be converted to a sequence.')
      }

      if (header[Symbol.iterator] && !Array.isArray(header)) {
        header = [...header];
      }

      if (header.length !== 2) {
        throw new TypeError(`Invalid header. Length must be 2, but is ${header.length}`)
      }

      appendHeader(bag, header[0], header[1]);
    }
  } else {
    for (const key of Reflect.ownKeys(object)) {
      const x = Reflect.getOwnPropertyDescriptor(object, key);
      if (x === undefined || !x.enumerable) continue

      if (typeof key === 'symbol') {
        throw new TypeError('Invalid header. Symbol key is not supported.')
      }

      if (!HTTP_TOKEN_CODE_POINT_RE.test(key)) {
        throw new TypeError('Header name is not valid.')
      }

      appendHeader(bag, key, Reflect.get(object, key));
    }
  }
}

const ILLEGAL_VALUE_CHARS = /[\x00\x0A\x0D]/g;
const IS_BYTE_STRING = /^[\x00-\xFF]*$/;
const HTTP_TOKEN_CODE_POINT_RE = /^[\u0021\u0023\u0024\u0025\u0026\u0027\u002a\u002b\u002d\u002e\u005e\u005f\u0060\u007c\u007e\u0030-\u0039\u0041-\u005a\u0061-\u007a]+$/;
const HTTP_BETWEEN_WHITESPACE = /^[\u000a\u000d\u0009\u0020]*(.*?)[\u000a\u000d\u0009\u0020]*$/;

/** @param {string} char */
function isHttpWhitespace (char) {
  switch (char) {
    case '\u0009':
    case '\u000A':
    case '\u000D':
    case '\u0020':
      return true
  }

  return false
}

/** @param {string} s */
function httpTrim (s) {
  if (!isHttpWhitespace(s[0]) && !isHttpWhitespace(s[s.length - 1])) {
    return s
  }

  const match = HTTP_BETWEEN_WHITESPACE.exec(s);
  return match && match[1]
}

/**
 * https://fetch.spec.whatwg.org/#concept-headers-append
 * @param {Bag} bag
 * @param {string} name
 * @param {string} value
 */
function appendHeader (bag, name, value) {
  value = httpTrim(`${value}`) || '';

  if (!HTTP_TOKEN_CODE_POINT_RE.test(name)) {
    throw new TypeError('Header name is not valid.')
  }

  if (ILLEGAL_VALUE_CHARS.test(value) || !IS_BYTE_STRING.test(value)) {
    throw new TypeError(`Header value ${JSON.stringify(value)} is not valid.`)
  }

  if (bag.guard === 'immutable') {
    throw new TypeError('Headers are immutable.')
  }

  name = String(name).toLocaleLowerCase();

  bag.items[name] = name in bag.items ? `${bag.items[name]}, ${value}` : value;

  if (name === 'set-cookie') {
    bag.cookies.push(value);
  }
}

/** @param {string} name */
function normalizeName (name) {
  name = `${name}`.toLowerCase();
  if (!HTTP_TOKEN_CODE_POINT_RE.test(name)) throw new TypeError('Header name is not valid.')
  return name
}

/** @type {WeakMap<Headers, Bag>} */
const wm = new WeakMap();

class Headers {
  /** @param {HeadersInit} [init] */
  constructor (init = undefined) {
    const bag = {
      items: Object.create(null),
      cookies: [],
      guard: 'mutable'
    };

    wm.set(this, bag);

    if (init !== undefined) {
      fillHeaders(bag, init);
    }
  }

  append (name, value) {
    const bag = assert(this, arguments.length, 2, 'append');
    appendHeader(bag, name, value);
  }

  delete (name) {
    const bag = assert(this, arguments.length, 1, 'delete');
    name = normalizeName(name);
    delete bag.items[name];
    if (name === 'set-cookie') bag.cookies.length = 0;
  }

  get (name) {
    const bag = assert(this, arguments.length, 1, 'get');
    name = normalizeName(name);
    return name in bag.items ? bag.items[name] : null
  }

  has (name) {
    const bag = assert(this, arguments.length, 1, 'has');
    return normalizeName(name) in bag.items
  }

  set (name, value) {
    const bag = assert(this, arguments.length, 2, 'set');
    this.delete(name);
    appendHeader(bag, name, value);
  }

  forEach (callback, thisArg = globalThis) {
    assert(this, arguments.length, 1, 'forEach');
    if (typeof callback !== 'function') {
      throw new TypeError(
        "Failed to execute 'forEach' on 'Headers': parameter 1 is not of type 'Function'."
      )
    }

    for (const x of this) {
      callback.call(thisArg, x[1], x[0], this);
    }
  }

  toString () {
    return '[object Headers]'
  }

  getSetCookie () {
    const bag = assert(this, 0, 0, '');
    return bag.cookies.slice(0)
  }

  keys () {
    assert(this, 0, 0, '');
    return [...this].map(x => x[0]).values()
  }

  values () {
    assert(this, 0, 0, '');
    return [...this].map(x => x[1]).values()
  }

  entries () {
    const bag = assert(this, 0, 0, '');
    /** @type {Array<[string, string]>} */
    const result = [];

    const entries = [
      ...Object.entries(bag.items).sort((a, b) => a[0] > b[0] ? 1 : -1)
    ];

    for (const [name, value] of entries) {
      if (name === 'set-cookie') {
        for (const cookie of bag.cookies) {
          result.push([name, cookie]);
        }
      } else result.push([name, value]);
    }

    return result.values()
  }

  [Symbol.iterator] () {
    return this.entries()
  }

  [Symbol.for('nodejs.util.inspect.custom')] () {
    const bag = assert(this, 0, 0, '');
    class Headers extends URLSearchParams { }
    return new Headers(bag.items)
  }
}

const enumerable = { enumerable: true };

Object.defineProperties(Headers.prototype, {
  append: enumerable,
  delete: enumerable,
  entries: enumerable,
  forEach: enumerable,
  get: enumerable,
  getSetCookie: enumerable,
  has: enumerable,
  keys: enumerable,
  set: enumerable,
  values: enumerable
});

/**
 * Abstraction for the data read from IncomingMessage
 */

class Request {
  body;
  method;
  headers;
  url;

  constructor(body, init) {
    this.body = body;
    this.method = init.method;
    this.headers = new Headers(init.headers);
    this.url = new URL(`http:${this.headers.get('host')}${init.path}`);
  }

  get query() {
    return this.url.searchParams;
  }

}
class Response {
  body;
  status;
  statusText;
  headers;

  constructor(body, init = {}) {
    if (body) {
      this.body = body instanceof Stream ? body : Buffer.from(body);
    }

    if (typeof init.status === 'number') {
      /**
       * @type {number}
       */
      this.status = init.status;
    } else {
      this.status = 200;
    }

    if (typeof init.statusText === 'string') {
      this.statusText = init.statusText;
    }

    this.headers = new Headers(init.headers);
  }

}
function writeResponse(response, res) {
  for (const [header, value] of response.headers) {
    res.setHeader(header, value);
  }

  res.writeHead(response.status, response.statusText);

  if (response.body instanceof Stream) {
    response.body.pipe(res);
  } else if (response.body instanceof Buffer) {
    res.write(response.body);
    res.end();
  } else {
    res.end();
  }

  return true;
}

class BareError extends Error {
  status;
  body;

  constructor(status, body) {
    super(body.message || body.code);
    this.status = status;
    this.body = body;
  }

}
const project = {
  name: 'TOMPHTTP NodeJS Bare Server',
  repository: 'https://github.com/tomphttp/bare-server-node'
};
function json(status, json) {
  const send = Buffer.from(JSON.stringify(json, null, '\t'));
  return new Response(send, {
    status,
    headers: {
      'content-type': 'application/json',
      'content-length': send.byteLength.toString()
    }
  });
}
class BareServer {
  directory;
  routes;
  socketRoutes;
  onClose;
  config;

  constructor(directory, init = {}) {
    init.logErrors ??= false;
    this.config = init;
    this.routes = new Map();
    this.socketRoutes = new Map();
    this.onClose = new Set();

    if (typeof directory !== 'string') {
      throw new Error('Directory must be specified.');
    }

    if (!directory.startsWith('/') || !directory.endsWith('/')) {
      throw new RangeError('Directory must start and end with /');
    }

    this.directory = directory;
  }
  /**
   * Remove all timers and listeners
   */


  close() {
    for (const callback of this.onClose) {
      callback();
    }
  }

  shouldRoute(request) {
    return request.url?.startsWith(this.directory) || false;
  }

  get instanceInfo() {
    return {
      versions: ['v1', 'v2'],
      language: 'NodeJS',
      memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
      maintainer: this.config.maintainer,
      project
    };
  }

  async routeUpgrade(req, socket, head) {
    const request = new Request(req, {
      method: req.method,
      path: req.url,
      headers: req.headers
    });
    const service = request.url.pathname.slice(this.directory.length - 1);

    if (this.socketRoutes.has(service)) {
      const call = this.socketRoutes.get(service);

      try {
        await call(this.config, request, socket, head);
      } catch (error) {
        if (this.config.logErrors) {
          console.error(error);
        }

        socket.end();
      }
    } else {
      socket.end();
    }
  }

  async routeRequest(req, res) {
    const request = new Request(req, {
      method: req.method,
      path: req.url,
      headers: req.headers
    });
    const service = request.url.pathname.slice(this.directory.length - 1);
    let response;

    try {
      if (request.method === 'OPTIONS') {
        response = new Response(undefined, {
          status: 200
        });
      } else if (service === '/') {
        response = json(200, this.instanceInfo);
      } else if (this.routes.has(service)) {
        const call = this.routes.get(service);
        response = await call(this.config, request);
      } else {
        throw new createHttpError.NotFound();
      }
    } catch (error) {
      if (this.config.logErrors) {
        console.error(error);
      }

      if (error instanceof Error) {
        response = json(500, {
          code: 'UNKNOWN',
          id: `error.${error.name}`,
          message: error.message,
          stack: error.stack
        });
      } else {
        response = json(500, {
          code: 'UNKNOWN',
          id: 'error.Exception',
          message: error,
          stack: new Error(error).stack
        });
      }

      if (!(response instanceof Response)) {
        if (this.config.logErrors) {
          console.error('Cannot', req.method, req.url, ': Route did not return a response.');
        }

        throw new createHttpError.InternalServerError();
      }
    }

    response.headers.set('x-robots-tag', 'noindex');
    response.headers.set('access-control-allow-headers', '*');
    response.headers.set('access-control-allow-origin', '*');
    response.headers.set('access-control-allow-methods', '*');
    response.headers.set('access-control-expose-headers', '*'); // don't fetch preflight on every request...
    // instead, fetch preflight every 10 minutes

    response.headers.set('access-control-max-age', '7200');
    writeResponse(response, res);
  }

}

const reserveChar = '%';
function decodeProtocol(protocol) {
  let result = '';

  for (let i = 0; i < protocol.length; i++) {
    const char = protocol[i];

    if (char === reserveChar) {
      const code = parseInt(protocol.slice(i + 1, i + 3), 16);
      const decoded = String.fromCharCode(code);
      result += decoded;
      i += 2;
    } else {
      result += char;
    }
  }

  return result;
}

function rawHeaderNames(raw) {
  const result = [];

  for (let i = 0; i < raw.length; i += 2) {
    if (!result.includes(raw[i])) result.push(raw[i]);
  }

  return result;
}
function mapHeadersFromArray(from, to) {
  for (const header of from) {
    if (header.toLowerCase() in to) {
      const value = to[header.toLowerCase()];
      delete to[header.toLowerCase()];
      to[header] = value;
    }
  }

  return to;
}

const httpAgent = new http.Agent();
const httpsAgent = new https.Agent();

function outgoingError(error) {
  if (error instanceof Error) {
    switch (error.code) {
      case 'ENOTFOUND':
        return new BareError(500, {
          code: 'HOST_NOT_FOUND',
          id: 'request',
          message: 'The specified host could not be resolved.'
        });

      case 'ECONNREFUSED':
        return new BareError(500, {
          code: 'CONNECTION_REFUSED',
          id: 'response',
          message: 'The remote rejected the request.'
        });

      case 'ECONNRESET':
        return new BareError(500, {
          code: 'CONNECTION_RESET',
          id: 'response',
          message: 'The request was forcibly closed.'
        });

      case 'ETIMEOUT':
        return new BareError(500, {
          code: 'CONNECTION_TIMEOUT',
          id: 'response',
          message: 'The response timed out.'
        });
    }
  }

  return error;
}
/**
 * @typedef {object} BareRemote
 * @property {string} host
 * @property {number|string} port
 * @property {string} path
 * @property {string} protocol
 */

/**
 * @typedef {object} BareErrorBody
 * @property {string} code
 * @property {string} id
 * @property {string} [message]
 * @property {string} [stack]
 *
 */


async function fetch(config, request, requestHeaders, url) {
  const options = {
    host: url.host,
    port: url.port,
    path: url.path,
    method: request.method,
    headers: requestHeaders,
    setHost: false,
    localAddress: config.localAddress
  };
  let outgoing;

  if (url.protocol === 'https:') {
    outgoing = https.request({ ...options,
      agent: httpsAgent
    });
  } else if (url.protocol === 'http:') {
    outgoing = http.request({ ...options,
      agent: httpAgent
    });
  } else {
    throw new RangeError(`Unsupported protocol: '${url.protocol}'`);
  }

  request.body.pipe(outgoing);
  return await new Promise((resolve, reject) => {
    outgoing.on('response', response => {
      resolve(response);
    });
    outgoing.on('error', error => {
      reject(outgoingError(error));
    });
  });
}
async function upgradeFetch(serverConfig, request, requestHeaders, remote) {
  const options = {
    host: remote.host,
    port: remote.port,
    path: remote.path,
    headers: requestHeaders,
    method: request.method,
    setHost: false,
    localAddress: serverConfig.localAddress
  };
  let outgoing;

  if (remote.protocol === 'wss:') {
    outgoing = https.request({ ...options,
      agent: httpsAgent
    });
  } else if (remote.protocol === 'ws:') {
    outgoing = http.request({ ...options,
      agent: httpAgent
    });
  } else {
    throw new RangeError(`Unsupported protocol: '${remote.protocol}'`);
  }

  outgoing.end();
  return await new Promise((resolve, reject) => {
    outgoing.on('response', () => {
      reject('Remote did not upgrade the WebSocket');
    });
    outgoing.on('upgrade', (request, socket, head) => {
      resolve([request, socket, head]);
    });
    outgoing.on('error', error => {
      reject(outgoingError(error));
    });
  });
}

const validProtocols$1 = ['http:', 'https:', 'ws:', 'wss:'];
const randomBytesAsync$1 = promisify(randomBytes);

function loadForwardedHeaders$1(forward, target, request) {
  for (const header of forward) {
    if (request.headers.has(header)) {
      target[header] = request.headers.get(header);
    }
  }
}

function readHeaders$1(request) {
  const remote = {};
  const headers = {};
  Reflect.setPrototypeOf(headers, null);

  for (const remoteProp of ['host', 'port', 'protocol', 'path']) {
    const header = `x-bare-${remoteProp}`;

    if (request.headers.has(header)) {
      const value = request.headers.get(header);

      switch (remoteProp) {
        case 'port':
          if (isNaN(parseInt(value))) {
            throw new BareError(400, {
              code: 'INVALID_BARE_HEADER',
              id: `request.headers.${header}`,
              message: `Header was not a valid integer.`
            });
          }

          break;

        case 'protocol':
          if (!validProtocols$1.includes(value)) {
            throw new BareError(400, {
              code: 'INVALID_BARE_HEADER',
              id: `request.headers.${header}`,
              message: `Header was invalid`
            });
          }

          break;
      }

      remote[remoteProp] = value;
    } else {
      throw new BareError(400, {
        code: 'MISSING_BARE_HEADER',
        id: `request.headers.${header}`,
        message: `Header was not specified.`
      });
    }
  }

  if (request.headers.has('x-bare-headers')) {
    try {
      const json = JSON.parse(request.headers.get('x-bare-headers'));

      for (const header in json) {
        if (typeof json[header] !== 'string' && !Array.isArray(json[header])) {
          throw new BareError(400, {
            code: 'INVALID_BARE_HEADER',
            id: `bare.headers.${header}`,
            message: `Header was not a String or Array.`
          });
        }
      }

      Object.assign(headers, json);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new BareError(400, {
          code: 'INVALID_BARE_HEADER',
          id: `request.headers.x-bare-headers`,
          message: `Header contained invalid JSON. (${error.message})`
        });
      } else {
        throw error;
      }
    }
  } else {
    throw new BareError(400, {
      code: 'MISSING_BARE_HEADER',
      id: `request.headers.x-bare-headers`,
      message: `Header was not specified.`
    });
  }

  if (request.headers.has('x-bare-forward-headers')) {
    let json;

    try {
      json = JSON.parse(request.headers.get('x-bare-forward-headers'));
    } catch (error) {
      throw new BareError(400, {
        code: 'INVALID_BARE_HEADER',
        id: `request.headers.x-bare-forward-headers`,
        message: `Header contained invalid JSON. (${error instanceof Error ? error.message : error})`
      });
    }

    loadForwardedHeaders$1(json, headers, request);
  } else {
    throw new BareError(400, {
      code: 'MISSING_BARE_HEADER',
      id: `request.headers.x-bare-forward-headers`,
      message: `Header was not specified.`
    });
  }

  return {
    remote: remote,
    headers
  };
}

async function tunnelRequest$1(serverConfig, request) {
  const {
    remote,
    headers
  } = readHeaders$1(request);
  const response = await fetch(serverConfig, request, headers, remote);
  const responseHeaders = new Headers();

  for (const header in response.headers) {
    if (header === 'content-encoding' || header === 'x-content-encoding') {
      responseHeaders.set('content-encoding', response.headers[header]);
    } else if (header === 'content-length') {
      responseHeaders.set('content-length', response.headers[header]);
    }
  }

  responseHeaders.set('x-bare-headers', JSON.stringify(mapHeadersFromArray(rawHeaderNames(response.rawHeaders), { ...response.headers
  })));
  responseHeaders.set('x-bare-status', response.statusCode);
  responseHeaders.set('x-bare-status-text', response.statusMessage);
  return new Response(response, {
    status: 200,
    headers: responseHeaders
  });
}

const tempMeta$1 = new Map();
const metaExpiration$1 = 30e3;

async function wsMeta(serverConfig, request) {
  if (request.method === 'OPTIONS') {
    return new Response(undefined, {
      status: 200
    });
  }

  if (!request.headers.has('x-bare-id')) {
    throw new BareError(400, {
      code: 'MISSING_BARE_HEADER',
      id: 'request.headers.x-bare-id',
      message: 'Header was not specified'
    });
  }

  const id = request.headers.get('x-bare-id');

  if (!tempMeta$1.has(id)) {
    throw new BareError(400, {
      code: 'INVALID_BARE_HEADER',
      id: 'request.headers.x-bare-id',
      message: 'Unregistered ID'
    });
  }

  const meta = tempMeta$1.get(id);
  tempMeta$1.delete(id);
  return json(200, {
    headers: meta.response?.headers
  });
}
/**
 *
 * @returns {Promise<Response>}
 */


async function wsNewMeta() {
  const id = (await randomBytesAsync$1(32)).toString('hex');
  tempMeta$1.set(id, {
    set: Date.now()
  });
  return new Response(Buffer.from(id));
}

async function tunnelSocket$1(serverConfig, request, socket) {
  if (!request.headers.has('sec-websocket-protocol')) {
    socket.end();
    return;
  }

  const [firstProtocol, data] = request.headers.get('sec-websocket-protocol').split(/,\s*/g);

  if (firstProtocol !== 'bare') {
    socket.end();
    return;
  }

  const {
    remote,
    headers,
    forward_headers: forwardHeaders,
    id
  } = JSON.parse(decodeProtocol(data));
  loadForwardedHeaders$1(forwardHeaders, headers, request);
  const [remoteResponse, remoteSocket] = await upgradeFetch(serverConfig, request, headers, remote);

  if (tempMeta$1.has(id)) {
    tempMeta$1.get(id).response = {
      headers: mapHeadersFromArray(rawHeaderNames(remoteResponse.rawHeaders), { ...remoteResponse.headers
      })
    };
  }

  const responseHeaders = [`HTTP/1.1 101 Switching Protocols`, `Upgrade: websocket`, `Connection: Upgrade`, `Sec-WebSocket-Protocol: bare`, `Sec-WebSocket-Accept: ${remoteResponse.headers['sec-websocket-accept']}`];

  if ('sec-websocket-extensions' in remoteResponse.headers) {
    responseHeaders.push(`Sec-WebSocket-Extensions: ${remoteResponse.headers['sec-websocket-extensions']}`);
  }

  socket.write(responseHeaders.concat('', '').join('\r\n'));
  remoteSocket.on('close', () => {
    // console.log('Remote closed');
    socket.end();
  });
  socket.on('close', () => {
    // console.log('Serving closed');
    remoteSocket.end();
  });
  remoteSocket.on('error', error => {
    if (serverConfig.logErrors) {
      console.error('Remote socket error:', error);
    }

    socket.end();
  });
  socket.on('error', error => {
    if (serverConfig.logErrors) {
      console.error('Serving socket error:', error);
    }

    remoteSocket.end();
  });
  remoteSocket.pipe(socket);
  socket.pipe(remoteSocket);
}

function registerV1(server) {
  server.routes.set('/v1/', tunnelRequest$1);
  server.routes.set('/v1/ws-new-meta', wsNewMeta);
  server.routes.set('/v1/ws-meta', wsMeta);
  server.socketRoutes.set('/v1/', tunnelSocket$1);
  const interval = setInterval(() => {
    for (const [id, meta] of tempMeta$1) {
      const expires = meta.set + metaExpiration$1;

      if (expires < Date.now()) {
        tempMeta$1.delete(id);
      }
    }
  }, 1e3);
  server.onClose.add(() => {
    clearInterval(interval);
  });
}

const MAX_HEADER_VALUE = 3072;
/**
 *
 * Splits headers according to spec
 * @param headers
 * @returns Split headers
 */

function splitHeaders(headers) {
  const output = new Headers(headers);

  if (headers.has('x-bare-headers')) {
    const value = headers.get('x-bare-headers');

    if (value.length > MAX_HEADER_VALUE) {
      output.delete('x-bare-headers');
      let split = 0;

      for (let i = 0; i < value.length; i += MAX_HEADER_VALUE) {
        const part = value.slice(i, i + MAX_HEADER_VALUE);
        const id = split++;
        output.set(`x-bare-headers-${id}`, `;${part}`);
      }
    }
  }

  return output;
}
/**
 * Joins headers according to spec
 * @param headers
 * @returns Joined headers
 */

function joinHeaders(headers) {
  const output = new Headers(headers);
  const prefix = 'x-bare-headers';

  if (headers.has(`${prefix}-0`)) {
    const join = [];

    for (const [header, value] of headers) {
      if (!header.startsWith(prefix)) {
        continue;
      }

      if (!value.startsWith(';')) {
        throw new BareError(400, {
          code: 'INVALID_BARE_HEADER',
          id: `request.headers.${header}`,
          message: `Value didn't begin with semi-colon.`
        });
      }

      const id = parseInt(header.slice(prefix.length + 1));
      join[id] = value.slice(1);
      output.delete(header);
    }

    output.set(prefix, join.join(''));
  }

  return output;
}

const validProtocols = ['http:', 'https:', 'ws:', 'wss:'];
const forbiddenForwardHeaders = ['connection', 'transfer-encoding', 'host', 'connection', 'origin', 'referer'];
const forbiddenPassHeaders = ['vary', 'connection', 'transfer-encoding', 'access-control-allow-headers', 'access-control-allow-methods', 'access-control-expose-headers', 'access-control-max-age', 'access-cntrol-request-headers', 'access-control-request-method']; // common defaults

const defaultForwardHeaders = ['accept-encoding', 'accept-language', 'sec-websocket-extensions', 'sec-websocket-key', 'sec-websocket-version'];
const defaultPassHeaders = ['content-encoding', 'content-length', 'last-modified']; // defaults if the client provides a cache key

const defaultCacheForwardHeaders = ['if-modified-since', 'if-none-match', 'cache-control'];
const defaultCachePassHeaders = ['cache-control', 'etag'];
const defaultCachePassStatus = [304];
const randomBytesAsync = promisify(randomBytes);

function loadForwardedHeaders(forward, target, request) {
  for (const header of forward) {
    if (request.headers.has(header)) {
      target[header] = request.headers.get(header);
    }
  }
}

const splitHeaderValue = /,\s*/g;

function readHeaders(request) {
  const remote = Object.setPrototypeOf({}, null);
  const sendHeaders = Object.setPrototypeOf({}, null);
  const passHeaders = [...defaultPassHeaders];
  const passStatus = [];
  const forwardHeaders = [...defaultForwardHeaders]; // should be unique

  const cache = request.url.searchParams.has('cache');

  if (cache) {
    passHeaders.push(...defaultCachePassHeaders);
    passStatus.push(...defaultCachePassStatus);
    forwardHeaders.push(...defaultCacheForwardHeaders);
  }

  const headers = joinHeaders(request.headers);

  for (const remoteProp of ['host', 'port', 'protocol', 'path']) {
    const header = `x-bare-${remoteProp}`;

    if (headers.has(header)) {
      const value = headers.get(header);

      switch (remoteProp) {
        case 'port':
          if (isNaN(parseInt(value))) {
            throw new BareError(400, {
              code: 'INVALID_BARE_HEADER',
              id: `request.headers.${header}`,
              message: `Header was not a valid integer.`
            });
          }

          break;

        case 'protocol':
          if (!validProtocols.includes(value)) {
            throw new BareError(400, {
              code: 'INVALID_BARE_HEADER',
              id: `request.headers.${header}`,
              message: `Header was invalid`
            });
          }

          break;
      }

      remote[remoteProp] = value;
    } else {
      throw new BareError(400, {
        code: 'MISSING_BARE_HEADER',
        id: `request.headers.${header}`,
        message: `Header was not specified.`
      });
    }
  }

  if (headers.has('x-bare-headers')) {
    try {
      const json = JSON.parse(headers.get('x-bare-headers'));

      for (const header in json) {
        const value = json[header];

        if (typeof value === 'string') {
          sendHeaders[header] = value;
        } else if (Array.isArray(value)) {
          const array = [];

          for (const val in value) {
            if (typeof val !== 'string') {
              throw new BareError(400, {
                code: 'INVALID_BARE_HEADER',
                id: `bare.headers.${header}`,
                message: `Header was not a String.`
              });
            }

            array.push(val);
          }

          sendHeaders[header] = array;
        } else {
          throw new BareError(400, {
            code: 'INVALID_BARE_HEADER',
            id: `bare.headers.${header}`,
            message: `Header was not a String.`
          });
        }
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new BareError(400, {
          code: 'INVALID_BARE_HEADER',
          id: `request.headers.x-bare-headers`,
          message: `Header contained invalid JSON. (${error.message})`
        });
      } else {
        throw error;
      }
    }
  } else {
    throw new BareError(400, {
      code: 'MISSING_BARE_HEADER',
      id: `request.headers.x-bare-headers`,
      message: `Header was not specified.`
    });
  }

  if (headers.has('x-bare-pass-status')) {
    const parsed = headers.get('x-bare-pass-status').split(splitHeaderValue);

    for (const value of parsed) {
      const number = parseInt(value);

      if (isNaN(number)) {
        throw new BareError(400, {
          code: 'INVALID_BARE_HEADER',
          id: `request.headers.x-bare-pass-status`,
          message: `Array contained non-number value.`
        });
      } else {
        passStatus.push(number);
      }
    }
  }

  if (headers.has('x-bare-pass-headers')) {
    const parsed = headers.get('x-bare-pass-headers').split(splitHeaderValue);

    for (let header of parsed) {
      header = header.toLowerCase();

      if (forbiddenPassHeaders.includes(header)) {
        throw new BareError(400, {
          code: 'FORBIDDEN_BARE_HEADER',
          id: `request.headers.x-bare-forward-headers`,
          message: `A forbidden header was passed.`
        });
      } else {
        passHeaders.push(header);
      }
    }
  }

  if (headers.has('x-bare-forward-headers')) {
    const parsed = headers.get('x-bare-forward-headers').split(splitHeaderValue);

    for (let header of parsed) {
      header = header.toLowerCase();

      if (forbiddenForwardHeaders.includes(header)) {
        throw new BareError(400, {
          code: 'FORBIDDEN_BARE_HEADER',
          id: `request.headers.x-bare-forward-headers`,
          message: `A forbidden header was forwarded.`
        });
      } else {
        forwardHeaders.push(header);
      }
    }
  }

  return {
    remote,
    sendHeaders,
    passHeaders,
    passStatus,
    forwardHeaders
  };
}

async function tunnelRequest(serverConfig, request) {
  const {
    remote,
    sendHeaders,
    passHeaders,
    passStatus,
    forwardHeaders
  } = readHeaders(request);
  loadForwardedHeaders(forwardHeaders, sendHeaders, request);
  const response = await fetch(serverConfig, request, sendHeaders, remote);
  const responseHeaders = new Headers();

  for (const header of passHeaders) {
    if (header in response.headers) {
      responseHeaders.set(header, response.headers[header]);
    }
  }

  let status;

  if (passStatus.includes(response.statusCode)) {
    status = response.statusCode;
  } else {
    status = 200;
  }

  if (!defaultCachePassStatus.includes(status)) {
    responseHeaders.set('x-bare-status', response.statusCode);
    responseHeaders.set('x-bare-status-text', response.statusMessage);
    responseHeaders.set('x-bare-headers', JSON.stringify(mapHeadersFromArray(rawHeaderNames(response.rawHeaders), { ...response.headers
    })));
  }

  return new Response(response, {
    status,
    headers: splitHeaders(responseHeaders)
  });
}

const tempMeta = new Map();
const metaExpiration = 30e3;

async function getMeta(serverConfig, request) {
  if (request.method === 'OPTIONS') {
    return new Response(undefined, {
      status: 200
    });
  }

  if (!request.headers.has('x-bare-id')) {
    throw new BareError(400, {
      code: 'MISSING_BARE_HEADER',
      id: 'request.headers.x-bare-id',
      message: 'Header was not specified'
    });
  }

  const id = request.headers.get('x-bare-id');

  if (!tempMeta.has(id)) {
    throw new BareError(400, {
      code: 'INVALID_BARE_HEADER',
      id: 'request.headers.x-bare-id',
      message: 'Unregistered ID'
    });
  }

  const meta = tempMeta.get(id);

  if (!meta.response) {
    throw new BareError(400, {
      code: 'INVALID_BARE_HEADER',
      id: 'request.headers.x-bare-id',
      message: 'Meta not ready'
    });
  }

  tempMeta.delete(id);
  const responseHeaders = new Headers();
  responseHeaders.set('x-bare-status', meta.response.status);
  responseHeaders.set('x-bare-status-text', meta.response.statusText);
  responseHeaders.set('x-bare-headers', JSON.stringify(meta.response.headers));
  return new Response(undefined, {
    status: 200,
    headers: splitHeaders(responseHeaders)
  });
}

async function newMeta(serverConfig, request) {
  const {
    remote,
    sendHeaders,
    forwardHeaders
  } = readHeaders(request);
  const id = (await randomBytesAsync(32)).toString('hex');
  tempMeta.set(id, {
    set: Date.now(),
    remote,
    sendHeaders,
    forwardHeaders
  });
  return new Response(Buffer.from(id));
}

async function tunnelSocket(serverConfig, request, socket) {
  if (!request.headers.has('sec-websocket-protocol')) {
    socket.end();
    return;
  }

  const id = request.headers.get('sec-websocket-protocol');

  if (!tempMeta.has(id)) {
    socket.end();
    return;
  }

  const meta = tempMeta.get(id);
  loadForwardedHeaders(meta.forwardHeaders, meta.sendHeaders, request);
  const [remoteResponse, remoteSocket] = await upgradeFetch(serverConfig, request, meta.sendHeaders, meta.remote);
  const remoteHeaders = new Headers(remoteResponse.headers);
  meta.response = {
    headers: mapHeadersFromArray(rawHeaderNames(remoteResponse.rawHeaders), { ...remoteResponse.headers
    }),
    status: remoteResponse.statusCode,
    statusText: remoteResponse.statusMessage
  };
  const responseHeaders = [`HTTP/1.1 101 Switching Protocols`, `Upgrade: websocket`, `Connection: Upgrade`, `Sec-WebSocket-Protocol: ${id}`];

  if (remoteHeaders.has('sec-websocket-extensions')) {
    responseHeaders.push(`Sec-WebSocket-Extensions: ${remoteHeaders.get('sec-websocket-extensions')}`);
  }

  if (remoteHeaders.has('sec-websocket-accept')) {
    responseHeaders.push(`Sec-WebSocket-Accept: ${remoteHeaders.get('sec-websocket-accept')}`);
  }

  socket.write(responseHeaders.concat('', '').join('\r\n'));
  remoteSocket.on('close', () => {
    socket.end();
  });
  socket.on('close', () => {
    remoteSocket.end();
  });
  remoteSocket.on('error', error => {
    if (serverConfig.logErrors) {
      console.error('Remote socket error:', error);
    }

    socket.end();
  });
  socket.on('error', error => {
    if (serverConfig.logErrors) {
      console.error('Serving socket error:', error);
    }

    remoteSocket.end();
  });
  remoteSocket.pipe(socket);
  socket.pipe(remoteSocket);
}

function registerV2(server) {
  server.routes.set('/v2/', tunnelRequest);
  server.routes.set('/v2/ws-new-meta', newMeta);
  server.routes.set('/v2/ws-meta', getMeta);
  server.socketRoutes.set('/v2/', tunnelSocket);
  const interval = setInterval(() => {
    for (const [id, meta] of tempMeta) {
      const expires = meta.set + metaExpiration;

      if (expires < Date.now()) {
        tempMeta.delete(id);
      }
    }
  }, 1e3);
  server.onClose.add(() => {
    clearInterval(interval);
  });
}

function createServer(directory, init = {}) {
  const server = new BareServer(directory, init);
  registerV1(server);
  registerV2(server);
  return server;
}

export { BareError, createServer as default, json };
