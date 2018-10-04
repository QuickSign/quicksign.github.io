'use strict';
/************************************
 * Configure directory structure
 ************************************/

var rootDir = './';
var cssDir = rootDir+'assets/css/';
var scssDir = rootDir+'assets/scss/index.scss';

/************************************
 * Require Libs
 ************************************/

var gulp = require('gulp');
var path = require('path');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var sourcemaps = require('gulp-sourcemaps');
var watch = require('gulp-watch');
var connect = require('gulp-connect');

/************************************
 * Build Tasks
 ************************************/

gulp.task('compile-scss', function() {
  return gulp.src(scssDir)
    .pipe(sourcemaps.init())
    .pipe(sass({
      includePaths: ['./node_modules'],
    }).on('error', sass.logError))
    .pipe(autoprefixer())
    .pipe(sourcemaps.write(rootDir))
    .pipe(gulp.dest(cssDir));
});

gulp.task('watch', function() {
  watch(['!'+cssDir+'**/**', './assets/**/**', 'index.html'], function() {
    gulp.start('compile-scss');
  }).pipe(connect.reload());
});

gulp.task('connect', function(event) {
    connect.server({
        root: rootDir,
        port: 8080,
        livereload: true
    });
});

gulp.task('serve', ['connect', 'watch']);