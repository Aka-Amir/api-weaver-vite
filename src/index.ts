import { Plugin } from "vite";
import {
  ApiWeaver,
  ApiWeaverAsyncConfigType,
  ApiWeaverStaticConfigType,
} from "@api-weaver/core";

export default function apiWeaverPlugin(
  options: Omit<ApiWeaverAsyncConfigType, "logger">
): Plugin;
export default function apiWeaverPlugin(
  options: Omit<ApiWeaverStaticConfigType, "logger">
): Plugin;

export default function apiWeaverPlugin(
  options:
    | Omit<ApiWeaverAsyncConfigType, "logger">
    | Omit<ApiWeaverStaticConfigType, "logger">
): Plugin {
  if (!options.outDirectory) {
    throw new Error("outDirectory is required");
  }
  return {
    name: "api-weaver-plugin",
    enforce: "pre",
    configResolved: async (config): Promise<void> => {
      try {
        config.logger.info("Configuring API Weaver Plugin...", {
          timestamp: true,
        });
        let core: ApiWeaver;
        const logger = {
          error: (msg: string) => config.logger.error(msg, { timestamp: true }),
          log: (msg: string) => config.logger.info(msg, { timestamp: true }),
          warn: (msg: string) => config.logger.warn(msg, { timestamp: true }),
        };
        switch (options.apiSpec.type) {
          case "static":
            core = new ApiWeaver({
              ...options,
              logger,
            } as ApiWeaverStaticConfigType);
            break;
          default:
            core = await ApiWeaver.createAsync({
              ...options,
              logger: {
                error: (msg: string) =>
                  config.logger.error(msg, { timestamp: true }),
                log: (msg: string) =>
                  config.logger.info(msg, { timestamp: true }),
                warn: (msg: string) =>
                  config.logger.warn(msg, { timestamp: true }),
              },
            } as ApiWeaverAsyncConfigType);
            break;
        }
        config.logger.info("Weaving API definitions...", {
          timestamp: true,
        });
        await core.build();
        config.logger.info("We weaved API definitions successfully !", {
          timestamp: true,
        });
      } catch (e) {
        config.logger.error(
          `API Weaver Plugin initialization failed: ${(e as Error).message}`,
          {
            timestamp: true,
          }
        );
      }
    },
  };
}
