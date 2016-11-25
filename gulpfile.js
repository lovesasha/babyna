var gulp         = require('gulp');
var browserSync = require('browser-sync');

var minifyCss   = require('gulp-minify-css');  // css压缩
var sass        = require('gulp-sass');         // sass预编译
var uglify      = require('gulp-uglify');      //js压缩

var concat      = require('gulp-concat');      // 文件合并
var rename      = require('gulp-rename');      // 文件更名

var path = {
    all:  ['./app/**/*'],
    css:  ['./app/css/**/*.css'],
    scss: ['./app/scss/**/*.scss'],
    js:   ['./app/js/**/*.js'],
    html: ['./app/html/**/*.html'],
    watches: {
        html: './app/html/',
        build: './app/build/'
    }
};

var build = {
    dest:   './app/build/',
    css:    'app.css',
    minCss: 'app.min.css',
    js:     'app.js',
    minJs:  'app.min.js'
};

// 代码合并
gulp.task('concat', function() {
    // css文件合并
    gulp.src(path.css)
        .pipe(concat(build.css))
        .pipe(gulp.dest(build.dest));
    // js文件合并
    gulp.src(path.js)
        .pipe(concat(build.js))
        .pipe(gulp.dest(build.dest));
});

// css文件合并
gulp.task('concat-css', function() {
    gulp.src(path.css)
        .pipe(concat(build.css))
        .pipe(gulp.dest(build.dest));
});

// js文件合并
gulp.task('concat-js', function() {
    gulp.src(path.js)
        .pipe(concat(build.js))
        .pipe(gulp.dest(build.dest));
});

// 代码压缩
gulp.task('minify', function() {
    // css压缩
    gulp.src(path.css)
        .pipe(concat(build.css))
        .pipe(gulp.dest(build.dest))
        .pipe(rename(build.minCss))
        .pipe(minifyCss())
        .pipe(gulp.dest(build.dest));
    // js压缩
    gulp.src(path.js)
        .pipe(concat(build.js))
        .pipe(gulp.dest(build.dest))
        .pipe(rename(build.minJs))
        .pipe(uglify())
        .pipe(gulp.dest(build.dest));
});

// css压缩
gulp.task('minify-css', function() {
    gulp.src(path.css)
        .pipe(concat(build.css))
        .pipe(gulp.dest(build.dest))
        .pipe(rename(build.minCss))
        .pipe(minifyCss())
        .pipe(gulp.dest(build.dest));
});

// js压缩
gulp.task('uglify', function() {
    gulp.src(path.js)
        .pipe(concat(build.js))
        .pipe(gulp.dest(build.dest))
        .pipe(rename(build.minJs))
        .pipe(uglify())
        .pipe(gulp.dest(build.dest));
});

// sass编译
gulp.task('sass', function() {
    gulp.src(path.scss)
        .pipe(sass())
        .on('error', sass.logError)
        .pipe(gulp.dest('./app/css'));
});

// 启动服务并自动刷新
gulp.task('browser-sync', function() {
    var bs = browserSync.create();
    bs.init({
        server: './app/'
    });
    bs.watch(path.html).on('change', bs.reload);
    bs.watch(path.css).on('change', bs.reload);
    bs.watch(path.js).on('change', bs.reload);
});

// 监听文件，启动服务并自动刷新
gulp.task('watch', ['sass'], function() {
    gulp.watch(path.scss, ['sass']);
});

// 编译发布文件
// gulp.task('build', ['concat', 'minify']);

// 默认任务，监听文件
gulp.task('default', ['watch', 'browser-sync']);
