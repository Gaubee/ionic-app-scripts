import * as Uglify from "uglify-js";
import type { MinifyOptions } from "uglify-js";

import { Logger } from "./logger/logger";
import {
  fillConfigDefaults,
  generateContext,
  getUserConfigFile,
} from "./util/config";
import { BuildError } from "./util/errors";
import { readFileAsync, writeFileAsync } from "./util/helpers";
import { BuildContext, TaskInfo } from "./util/interfaces";
import { runWorker } from "./worker-client";

export function uglifyjs(context: BuildContext, configFile?: string) {
  configFile = getUserConfigFile(context, taskInfo, configFile);

  const logger = new Logger("uglify");

  return runWorker("uglifyjs", "uglifyjsWorker", context, configFile)
    .then(() => {
      logger.finish();
    })
    .catch((err: BuildError) => {
      throw logger.fail(new BuildError(err));
    });
}

export function uglifyjsWorker(context: BuildContext, configFile: string) {
  const uglifyJsConfig: UglifyJsConfig = fillConfigDefaults(
    configFile,
    taskInfo.defaultConfigFile
  ) as typeof import("./config/uglifyjs.config");
  if (!context) {
    context = generateContext(context);
  }
  return uglifyjsWorkerImpl(context, uglifyJsConfig);
}

export async function uglifyjsWorkerImpl(
  context: BuildContext,
  uglifyJsConfig: UglifyJsConfig
) {
  try {
    const jsFilePaths = context.bundledFilePaths.filter((bundledFilePath) =>
      bundledFilePath.endsWith(".js")
    );
    const promises = jsFilePaths.map((filePath) => {
      const sourceMapPath = filePath + ".map";
      return runUglifyInternal(
        filePath,
        filePath,
        sourceMapPath,
        sourceMapPath,
        uglifyJsConfig
      );
    });
    return await Promise.all(promises);
  } catch (ex) {
    // uglify has it's own strange error format
    const errorString = `${ex.message} in ${ex.filename} at line ${ex.line}, col ${ex.col}, pos ${ex.pos}`;
    throw new BuildError(new Error(errorString));
  }
}

async function runUglifyInternal(
  sourceFilePath: string,
  destFilePath: string,
  sourceMapPath: string,
  destMapPath: string,
  configObject: UglifyJsConfig
): Promise<any> {
  const sourceFileContent = await readFileAsync(sourceFilePath);
  const uglifyConfig = {
    ...configObject,
    sourceMap: {
      filename: sourceMapPath,
    },
  };
  const result = Uglify.minify(sourceFileContent, uglifyConfig);
  if (result.error) {
    throw new BuildError(`Uglify failed: ${result.error.message}`);
  }
  return Promise.all([
    writeFileAsync(destFilePath, result.code),
    writeFileAsync(destMapPath, result.map),
  ]);
}

export const taskInfo: TaskInfo = {
  fullArg: "--uglifyjs",
  shortArg: "-u",
  envVar: "IONIC_UGLIFYJS",
  packageConfig: "ionic_uglifyjs",
  defaultConfigFile: "uglifyjs.config",
};

export interface UglifyJsConfig extends MinifyOptions {}

export interface UglifyResponse {
  code?: string;
  map?: any;
}
