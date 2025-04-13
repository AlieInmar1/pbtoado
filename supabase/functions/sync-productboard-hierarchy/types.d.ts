// types.d.ts - Type definitions for Deno in the VSCode environment

declare namespace Deno {
  export const env: {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    delete(key: string): void;
    toObject(): { [key: string]: string };
  };

  export interface ServeOptions {
    port?: number;
    hostname?: string;
    signal?: AbortSignal;
    onListen?: (params: { hostname: string; port: number }) => void;
    onError?: (error: unknown) => Response | Promise<Response>;
  }

  export type ServeHandler = (request: Request) => Response | Promise<Response>;

  export function serve(
    handler: ServeHandler,
    options?: ServeOptions
  ): Promise<void>;
}
