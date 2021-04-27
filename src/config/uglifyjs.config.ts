
// https://www.npmjs.com/package/uglify-es

export = {

  /**
   * mangle: uglify 2's mangle option
   */
  mangle: true,

  /**
   * compress: uglify 2's compress option
   */
  compress: {
    toplevel: true,
    pure_getters: true
  }
};