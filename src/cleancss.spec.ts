import { join } from "path";
import * as cleanCss from "./cleancss";

import * as cleanCssFactory from "./util/clean-css-factory";
import * as config from "./util/config";
import * as helpers from "./util/helpers";
import * as workerClient from "./worker-client";

describe("clean css task", () => {
  describe("cleancss", () => {
    it("should return when the worker returns", () => {
      // arrange
      const context = {};
      const configFile: any = null;
      const spy = spyOn(workerClient, "runWorker").and.returnValue(
        Promise.resolve()
      );
      // act
      return cleanCss.cleancss(context, null).then(() => {
        // assert
        expect(spy).toHaveBeenCalledWith(
          "cleancss",
          "cleancssWorker",
          context,
          configFile
        );
      });
    });

    it("should throw when the worker throws", () => {
      // arrange
      const context = {};
      const errorMessage = "Simulating an error";
      spyOn(workerClient, "runWorker").and.returnValue(
        Promise.reject(new Error(errorMessage))
      );

      // act
      return cleanCss
        .cleancss(context, null)
        .then(() => {
          throw new Error("Should never get here");
        })
        .catch((err: Error) => {
          // assert
          expect(err.message).toEqual(errorMessage);
        });
    });
  });

  describe("cleancssworker", () => {
    it("should throw when reading the file throws", () => {
      const errorMessage = "simulating an error";
      // arrange
      const context = { buildDir: "www" };
      const cleanCssConfig = {
        sourceFileName: "sourceFileName",
        destFileName: "destFileName",
      };
      spyOn(config, "generateContext").and.returnValue(context);
      spyOn(config, "fillConfigDefaults").and.returnValue(cleanCssConfig);
      spyOn(helpers, "readFileAsync").and.returnValue(
        Promise.reject(new Error(errorMessage))
      );

      // act
      return cleanCss
        .cleancssWorker(context, null)
        .then(() => {
          throw new Error("Should never get here");
        })
        .catch((err: Error) => {
          expect(err.message).toEqual(errorMessage);
        });
    });

    it("should return what writeFileAsync returns", () => {
      // arrange
      const context = { buildDir: "www" };
      const cleanCssConfig = {
        sourceFileName: "sourceFileName",
        destFileName: "destFileName",
      };
      const fileContent = "content";
      const minifiedContent = "someContent";
      spyOn(config, "generateContext").and.returnValue(context);
      spyOn(config, "fillConfigDefaults").and.returnValue(cleanCssConfig);
      spyOn(helpers, "readFileAsync").and.returnValue(
        Promise.resolve(fileContent)
      );
      spyOn(helpers, "writeFileAsync").and.returnValue(Promise.resolve());
      spyOn(cleanCssFactory, "getCleanCssInstance").and.returnValue({
        minify: (content: string, cb: Function) => {
          cb(null, { styles: minifiedContent });
        },
      });

      // act
      return cleanCss.cleancssWorker(context, null).then(() => {
        // assert
        expect(config.generateContext).toHaveBeenCalledWith(context);
        expect(config.fillConfigDefaults).toHaveBeenCalledWith(
          null,
          cleanCss.taskInfo.defaultConfigFile
        );
        expect(helpers.readFileAsync).toHaveBeenCalledWith(
          join(context.buildDir, cleanCssConfig.sourceFileName)
        );
        expect(helpers.writeFileAsync).toHaveBeenCalledWith(
          join(context.buildDir, cleanCssConfig.destFileName),
          minifiedContent
        );
      });
    });
  });

  describe("runCleanCss", () => {
    it("should reject when minification errors out", () => {
      // arrange
      const errorMessage = "simulating an error";
      const configFile: cleanCssFactory.CleanCssConfig = {
        sourceFileName: "filePath",
        options: {},
        destFileName: "filePath",
      };
      const fileContent = "fileContent";
      const mockMinifier = {
        minify: () => {},
      };
      const minifySpy = spyOn(mockMinifier, "minify");
      spyOn(cleanCssFactory, "getCleanCssInstance").and.returnValue(
        mockMinifier
      );

      // act
      const promise = cleanCss.runCleanCss(configFile, fileContent);
      // call the callback from the spy's args
      const callback = minifySpy.calls.mostRecent().args[1];
      callback(new Error(errorMessage), null);

      return promise
        .then(() => {
          throw new Error("Should never get here");
        })
        .catch((err: Error) => {
          // assert
          expect(err.message).toEqual(errorMessage);
        });
    });

    it("should reject when minification has one or more errors", () => {
      // arrange
      const configFile: cleanCssFactory.CleanCssConfig = {
        sourceFileName: "filePath",
        options: {},
        destFileName: "filePath",
      };
      const fileContent = "fileContent";
      const minificationResponse = {
        errors: ["some error"],
      };
      const mockMinifier = {
        minify: () => {},
      };
      const minifySpy = spyOn(mockMinifier, "minify");
      spyOn(cleanCssFactory, "getCleanCssInstance").and.returnValue(
        mockMinifier
      );

      // act
      const promise = cleanCss.runCleanCss(configFile, fileContent);
      // call the callback from the spy's args
      const callback = minifySpy.calls.mostRecent().args[1];
      callback(null, minificationResponse);

      return promise
        .then(() => {
          throw new Error("Should never get here");
        })
        .catch((err: Error) => {
          // assert
          expect(err.message).toEqual(minificationResponse.errors[0]);
        });
    });

    it("should return minified content", () => {
      const configFile: cleanCssFactory.CleanCssConfig = {
        sourceFileName: "filePath",
        options: {},
        destFileName: "filePath",
      };
      const fileContent = "fileContent";
      let minifySpy: jasmine.Spy = null;
      const minificationResponse = {
        styles: "minifiedContent",
      };
      const mockMinifier = {
        minify: () => {},
      };
      minifySpy = spyOn(mockMinifier, "minify");
      spyOn(cleanCssFactory, "getCleanCssInstance").and.returnValue(
        mockMinifier
      );

      // act
      const promise = cleanCss.runCleanCss(configFile, fileContent);
      // call the callback from the spy's args
      const callback = minifySpy.calls.mostRecent().args[1];
      callback(null, minificationResponse);

      return promise.then((result: string) => {
        expect(result).toEqual(minificationResponse.styles);
        expect(cleanCssFactory.getCleanCssInstance).toHaveBeenCalledWith(
          configFile.options
        );
        expect(minifySpy.calls.mostRecent().args[0]).toEqual(fileContent);
      });
    });
  });
});
