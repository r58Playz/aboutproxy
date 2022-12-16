interface TCP {}
declare module 'net' {
	function _createServerHandle(
		address: string,
		pot: number,
		addressType: string,
		fd: number,
		flags: number
	): TCP;
}
declare module 'dgram' {
	function _createSocketHandle(
		address: string,
		pot: number,
		addressType: string,
		fd: number,
		flags: number
	): TCP;
}
interface SharedHandleInit {
	port: number;
	addressType: string;
	fd: number;
	flags: number;
}
export default class SharedHandle {
	handle: TCP | null;
	errno: number;
	constructor(key: any, address: string, init: SharedHandleInit);
}
export {};
