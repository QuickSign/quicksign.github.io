'use strict';
/************************************
 * Configure directory structure
 ************************************/

var buildDir = './dist';
var staticAssetsDir = buildDir+'/static';
var cssDir = staticAssetsDir+'/css';
var jsDir = staticAssetsDir+'/js';
var imgDir = staticAssetsDir+'/img';
var fontsDir = staticAssetsDir+'/fonts';

var appServerPort = 8080;

/************************************
 * Require Libs
 ************************************/

var exec = require('child_process').execSync;
var argv = require('yargs').argv;
var requireModules = require('gulp-require-modules');
var rename = require('gulp-rename');
var browserify = require('gulp-browserify');
var gulp = require('gulp');
var sass = require('gulp-sass');
var connect = require('gulp-connect');

/************************************
 * Build Tasks
 ************************************/

var isProdBuild = false;
var disableLiveReload = false;

gulp.task('default', ['logTasks']);
gulp.task('logTasks', () => {
  process.nextTick(() => {
    console.log();
    console.log('gulp serve           serves your app locally with a watch');
    console.log('gulp serve --prod    serves the production build of your app locally');
    console.log('gulp build           bundles your app for production');
    console.log();
  });
});

gulp.task('serve', () => {

  isProdBuild = argv.prod;

  if (isProdBuild || argv.disableLiveReload == 'true') {
    disableLiveReload = true;
  }

  var flow = buildApp(isProdBuild)
    .then(render)
    .then(startServer);

    var flowBeforeWatch = flow;

    if (!disableLiveReload) {
      flow = flow.then(watch);
    }
    return flowBeforeWatch;
});

gulp.task('build', () => {

  return clean()
    .then(prepareAppBuildPromise());
});

/************************************
 * Build Functions
 ************************************/

function clean() {
  return new Promise(resolve => {
    exec('rm -rf '+buildDir);
    resolve();
  });
}

function buildApp( isProd ) {
  return prepareAppBuildPromise(isProd)();
}

function prepareAppBuildPromise( isProd ) {
  return function() {

    var promises = [];

    promises.push(compileAssets());
    promises.push(buildJsAppBundle(isProd));

    return Promise.all(promises);
  }
}

function compileAssets() {
  return prepareAssetsCompilePromise()();
}

function prepareAssetsCompilePromise() {
  return function() {

    var promises = [];

    promises.push(compileSass());
    promises.push(copyImages());
    promises.push(copyFonts());
    promises.push(render());

    return Promise.all(promises);
  }
}

function compileSass() {
  return new Promise(resolve => {
    var stream = gulp.src('assets/scss/index.scss')
      .pipe(sass({
        errLogToConsole: true,
        outputStyle: 'compressed',
        includePaths: ['node_modules'],
      }));

    stream.pipe(gulp.dest(cssDir))
      .on('end', resolve);
  });
}

function copyImages() {
  return new Promise(resolve => {
    gulp.src('assets/img/**/*')
      .pipe(gulp.dest(imgDir))
      .on('end', resolve);
  });
}

function copyFonts() {
  return new Promise(resolve => {
    gulp.src('assets/fonts/**/*')
      .pipe(gulp.dest(fontsDir))
      .on('end', resolve);
  });
}

function render() {
  return new Promise(resolve => {
    gulp.src('index.html')
      .pipe(rename('index.html'))
      .pipe(gulp.dest(buildDir))
      .on('end', resolve);
  });
}

function buildJsAppBundle( isProd ) {
  return new Promise(resolve => {
    gulp.src('assets/js/index.js')
      .pipe(requireModules({dist: false}))
      // .pipe(browserify({
      //   insertGlobals : true,
      //   debug : !isProd,
      // }))
      .pipe(rename('app.js'))
      .pipe(gulp.dest(jsDir))
      .on('end', resolve);
  });
}

function startServer() {
  var livereload = false;
  if (!isProdBuild && !disableLiveReload) {
    livereload = true
  }

  connect.server({
    name: 'Application server',
    root: './'+buildDir,
    host: '0.0.0.0',
    port: appServerPort,
    livereload: livereload,
  });
}

function watch() {
  var cssBuildPath = cssDir+'/**/*.css';
  gulp.watch('assets/scss/index.scss', compileSass);
  gulp.watch(cssBuildPath, () => {
    gulp.src(cssBuildPath).pipe(connect.reload());
  });

  gulp.watch('assets/js/index.js',
    () => {
      buildApp(false).then(() => {
        gulp
          .src('assets/js/index.js')
          .pipe(connect.reload());
      });
  });

  gulp.watch(
    [
      'index.html',
      'assets/img/**/*',
      'assets/fonts/**/*'
    ],
    () => {
      compileAssets().then(() => {
        gulp
          .src('assets/js/index.js')
          .pipe(connect.reload());
      });
  });
}

