"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiWeaverPlugin = apiWeaverPlugin;
const core_1 = require("@api-weaver/core");
const https_1 = require("https");
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const os_1 = require("os");
async function readFromFile(path) {
    if (!(0, fs_1.existsSync)(path))
        throw new Error(`File not found: ${path}`);
    const fileContent = await (0, promises_1.readFile)(path, "utf-8");
    return JSON.parse(fileContent);
}
async function downloadFromUrl(url) {
    const tempDir = await (0, promises_1.mkdtemp)((0, path_1.join)((0, os_1.tmpdir)(), "apiva-"));
    const outputPath = (0, path_1.join)(tempDir, "api-spec.json");
    return new Promise((resolve, reject) => {
        const file = (0, fs_1.createWriteStream)(outputPath);
        (0, https_1.get)(url, (response) => {
            response.pipe(file);
            file.on("finish", async () => {
                file.close();
                const fileContent = await readFromFile(outputPath);
                await (0, promises_1.unlink)(outputPath).catch(() => {
                    /* ignore */
                });
                resolve(fileContent);
            });
        }).on("error", async (err) => {
            try {
                await (0, promises_1.unlink)(outputPath);
            }
            finally {
                reject(err);
            }
        });
    });
}
function apiWeaverPlugin(options) {
    if (!options.outputDir) {
        throw new Error("outputDir is required");
    }
    if (!("url" in options) && !("path" in options)) {
        throw new Error("Either url or path must be provided");
    }
    return {
        name: "api-weaver-plugin",
        enforce: "pre",
        async configResolved(config) {
            config.logger.info("Configuring API Weaver Plugin...");
            try {
                let apiSpec = undefined;
                if ("url" in options) {
                    config.logger.info(`[${options.url}] Downloading API spec from URL...`);
                    apiSpec = await downloadFromUrl(options.url);
                }
                else if ("path" in options) {
                    config.logger.info(`[${options.path}] Reading API spec from disk...`);
                    apiSpec = await readFromFile(options.path);
                }
                if (!apiSpec) {
                    throw new Error("No API spec provided");
                }
                config.logger.info("Weaving API definitions...");
                new core_1.ApiWeaver(options.outputDir, apiSpec).build();
                config.logger.info("We weaved API definitions successfully !");
            }
            catch (e) {
                config.logger.error(`API Weaver Plugin initialization failed: ${e.message}`);
            }
        },
    };
}
