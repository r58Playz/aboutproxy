import { BareHeaders } from './requestUtil';
export declare function objectFromRawHeaders(raw: string[]): BareHeaders;
export declare function rawHeaderNames(raw: string[]): string[];
export declare function mapHeadersFromArray(from: string[], to: BareHeaders): BareHeaders;
