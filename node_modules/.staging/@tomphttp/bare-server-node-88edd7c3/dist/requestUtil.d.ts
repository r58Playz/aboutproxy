/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import { Request } from './AbstractMessage';
import { ServerConfig } from './BareServer';
import http from 'node:http';
import { Duplex } from 'node:stream';
export interface BareRemote {
    host: string;
    port: number | string;
    path: string;
    protocol: string;
}
export declare type BareHeaders = {
    [key: string]: string[] | string;
};
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
export declare function fetch(config: ServerConfig, request: Request, requestHeaders: BareHeaders, url: BareRemote): Promise<http.IncomingMessage>;
export declare function upgradeFetch(serverConfig: ServerConfig, request: Request, requestHeaders: BareHeaders, remote: BareRemote): Promise<[http.IncomingMessage, Duplex, Buffer]>;
