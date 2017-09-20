'use strict';

module.exports = function(grunt) {

  grunt.initConfig({
    ts: {
      all: { tsconfig: true }
    }
  });

  grunt.loadNpmTasks("grunt-ts");
  grunt.registerTask("default","ts")
}
