"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = apiWeaverPlugin;
const core_1 = require("@api-weaver/core");
function apiWeaverPlugin(options) {
    if (!options.outDirectory) {
        throw new Error("outDirectory is required");
    }
    return {
        name: "api-weaver-plugin",
        enforce: "pre",
        configResolved: async (config) => {
            try {
                config.logger.info("Configuring API Weaver Plugin...", {
                    timestamp: true,
                });
                let core;
                const logger = {
                    error: (msg) => config.logger.error(msg, { timestamp: true }),
                    log: (msg) => config.logger.info(msg, { timestamp: true }),
                    warn: (msg) => config.logger.warn(msg, { timestamp: true }),
                };
                switch (options.apiSpec.type) {
                    case "static":
                        core = new core_1.ApiWeaver({
                            ...options,
                            logger,
                        });
                        break;
                    default:
                        core = await core_1.ApiWeaver.createAsync({
                            ...options,
                            logger: {
                                error: (msg) => config.logger.error(msg, { timestamp: true }),
                                log: (msg) => config.logger.info(msg, { timestamp: true }),
                                warn: (msg) => config.logger.warn(msg, { timestamp: true }),
                            },
                        });
                        break;
                }
                config.logger.info("Weaving API definitions...", {
                    timestamp: true,
                });
                await core.build();
                config.logger.info("We weaved API definitions successfully !", {
                    timestamp: true,
                });
            }
            catch (e) {
                config.logger.error(`API Weaver Plugin initialization failed: ${e.message}`, {
                    timestamp: true,
                });
            }
        },
    };
}
