import { defineConfig, Plugin, PluginOption } from "vite";

import { ApiWeaver } from "@api-weaver/core";
import { get } from "https";
import { createWriteStream, existsSync } from "fs";
import { mkdtemp, readFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

export type ApiWeaverPluginOptions = {
  outputDir: string;
} & ({ url: string } | { path: string });

async function readFromFile(path: string): Promise<Record<string, unknown>> {
  if (!existsSync(path)) throw new Error(`File not found: ${path}`);
  const fileContent = await readFile(path, "utf-8");
  return JSON.parse(fileContent);
}

async function downloadFromUrl(url: string): Promise<Record<string, unknown>> {
  const tempDir = await mkdtemp(join(tmpdir(), "apiva-"));

  const outputPath = join(tempDir, "api-spec.json");
  return new Promise((resolve, reject) => {
    const file = createWriteStream(outputPath);
    get(
      {
        path: url,
        headers: {
          "User-Agent": "api-weaver/vite-plugin",
          Accept: "application/json",
        },
      },
      (response) => {
        response.pipe(file);
        file.on("finish", async () => {
          file.close();
          const fileContent = await readFromFile(outputPath);
          await unlink(outputPath).catch(() => {
            /* ignore */
          });
          resolve(fileContent);
        });
      }
    ).on("error", async (err: any) => {
      try {
        await unlink(outputPath);
      } finally {
        reject(err);
      }
    });
  });
}

export function apiWeaverPlugin(options: ApiWeaverPluginOptions): Plugin {
  if (!options.outputDir) {
    throw new Error("outputDir is required");
  }
  if (!("url" in options) && !("path" in options)) {
    throw new Error("Either url or path must be provided");
  }
  return {
    name: "api-weaver-plugin",
    enforce: "pre",
    configResolved: async (config): Promise<void> => {
      config.logger.info("Configuring API Weaver Plugin...");
      try {
        let apiSpec: Record<string, unknown> | undefined = undefined;

        if ("url" in options) {
          config.logger.info(
            `[${options.url}] Downloading API spec from URL...`
          );
          apiSpec = await downloadFromUrl(options.url);
        } else if ("path" in options) {
          config.logger.info(`[${options.path}] Reading API spec from disk...`);
          apiSpec = await readFromFile(options.path);
        }

        if (!apiSpec) {
          throw new Error("No API spec provided");
        }

        config.logger.info("Weaving API definitions...");
        new ApiWeaver(options.outputDir, apiSpec).build();
        config.logger.info("We weaved API definitions successfully !");
      } catch (e) {
        config.logger.error(
          `API Weaver Plugin initialization failed: ${(e as Error).message}`
        );
      }
    },
  };
}

defineConfig({
  plugins: [apiWeaverPlugin({ outputDir: "", path: "" })],
});
