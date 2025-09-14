import { Plugin } from "vite";
import { ApiWeaverAsyncConfigType, ApiWeaverStaticConfigType } from "@api-weaver/core";
export default function apiWeaverPlugin(options: Omit<ApiWeaverAsyncConfigType, "logger">): Plugin;
export default function apiWeaverPlugin(options: Omit<ApiWeaverStaticConfigType, "logger">): Plugin;
//# sourceMappingURL=index.d.ts.map