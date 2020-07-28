'use strict'
var gulp = require('gulp');
var browserSync = require('browser-sync').create();
var sass = require('gulp-sass');
var gutil = require('gulp-util');
var plumber = require('gulp-plumber');
var notify = require('gulp-notify');
var sourcemaps = require('gulp-sourcemaps');
var autoprefixer = require('gulp-autoprefixer');
// const del = require('del');
var nodemon = require('gulp-nodemon');
var ejs = require('gulp-ejs')
var path = require('path');

gulp.task('sass', function () {
    return gulp.src('./assets/scss/**/*.scss')
        .pipe(sourcemaps.init())
        .pipe(plumber({
            errorHandler: function (err) {
                notify.onError({
                    title: "Gulp error in " + err.plugin,
                    message: err.toString()
                })(err);
                gutil.beep();
            }
        }))
        .pipe(sass())
        // .pipe(autoprefixer({
        //     overrideBrowserslist: ['last 2 versions'],
        //     cascade: false
        // }))
        .pipe(sourcemaps.write('./maps'))
        .pipe(gulp.dest('./assets/css'))
        .pipe(gulp.dest('../server/public/assets/css'))
        .pipe(browserSync.stream());
});

gulp.task('ejs', function(){
    return gulp.src('./views/*.ejs')
     .pipe(ejs({}))
     .pipe(gulp.dest('./*.html'))
  });

gulp.task('nodemon', function (cb) {
	
	var started = false;

	return nodemon({
        script: "C:/Users/DELL/Desktop/invide/gcs_admin"+"/server/app.js"
	}).on('start', function () {
		// to avoid nodemon being started multiple times
		// thanks @matthisk
		if (!started) {
			cb();
			started = true; 
		} 
	});
});
// Static Server + watching scss/html/ejs files
gulp.task('serve', gulp.series('sass','nodemon', function () {

    browserSync.init({
        port: 3000,
        server: "./",
        ghostMode: false,
        notify: false
    });
    gulp.watch('./assets/scss/**/*.scss', gulp.series('sass'));
    gulp.watch(['./assets/js/**/*.js', './**/*.html', './assets/css/**/*.css']).on('change', browserSync.reload);

}));




gulp.task('sass:watch', function () {
    gulp.watch('./assets/scss/**/*.scss');
});

gulp.task('ejs:watch', function () {
    gulp.watch('./views/*.ejs');
});



// Static Server without watching scss files
gulp.task('serve:lite', function () {

    browserSync.init({
        server: "./",
        ghostMode: false,
        notify: false
    });

    gulp.watch('**/*.css').on('change', browserSync.reload);
    gulp.watch('**/*.html').on('change', browserSync.reload);
    gulp.watch('**/*.js').on('change', browserSync.reload);

});

