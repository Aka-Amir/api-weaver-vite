import type { Plugin } from "vite";
export type ApiWeaverPluginOptions = {
    outputDir: string;
} & ({
    url: string;
} | {
    path: string;
});
export declare function apiWeaverPlugin(options: ApiWeaverPluginOptions): Plugin;
//# sourceMappingURL=index.d.ts.map