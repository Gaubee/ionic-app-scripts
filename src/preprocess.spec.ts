import { join } from 'path';
import * as preprocess from './preprocess';
import * as deeplink from './deep-linking';
import * as helpers from './util/helpers';
import * as globUtil from './util/glob-util';

describe('Preprocess Task', () => {
  describe('preprocess', () => {
    it('should call deepLink but not write files to disk', () => {
      // arrange
      const context = {
        optimizeJs: false
      };

      const mockDirName = join('some', 'fake', 'dir');
      const mockGlobResults = [];
      mockGlobResults.push({ absolutePath: mockDirName});
      mockGlobResults.push({ absolutePath: mockDirName + '2'});
      spyOn(deeplink, 'deepLinking').and.returnValue(Promise.resolve());
      spyOn(helpers, 'getBooleanPropertyValue').and.returnValue(false);
      spyOn(helpers, 'getStringPropertyValue').and.returnValue(mockDirName);
      spyOn(globUtil, 'globAll').and.returnValue(Promise.resolve(mockGlobResults));

      // act
      return preprocess.preprocess(context);
    });
  });
});
