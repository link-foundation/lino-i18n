import type { NextResponse } from 'next/server.js';
import type { RequestTranslatorOptions } from '../server.js';
export interface NextLocaleProxyOptions extends RequestTranslatorOptions {
  persistLocale?: boolean;
  cookieOptions?: {
    path?: string;
    domain?: string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: 'lax' | 'strict' | 'none';
    maxAge?: number;
    expires?: Date;
  };
}
export declare function createNextLocaleProxy(
  options: NextLocaleProxyOptions
): (request: Request) => NextResponse;
