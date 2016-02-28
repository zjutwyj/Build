var gulp = require('gulp');
var runSequence = require('run-sequence');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var minifyCSS = require('gulp-minify-css');
var usemin = require('gulp-usemin');
var htmlmin = require('gulp-htmlmin');
var imagemin = require('gulp-imagemin');
var rev = require('gulp-rev');
var yuidoc = require("gulp-yuidoc");
var cdn = require('gulp-cdn-replace');
var replace = require('gulp-replace');
var del = require('del');

var SRCDIR = './app',
  TMPDIR = './.tmp',
  DISTDIR = 'C:/software/build', // 发布目录
  src = {
    all: [SRCDIR + '/**', TMPDIR + '/**'],
    index: [SRCDIR + '/index.html', TMPDIR + '/index.html']
  },
  dist = {
    all: DISTDIR + '/**',
    index: DISTDIR + '/index.html',
    scripts: DISTDIR + '/**',
    styles: DISTDIR + '/**',
    images: DISTDIR + '/images',
    fonts: DISTDIR + '/fonts',
    swf: DISTDIR + '/swf',
    img: DISTDIR + '/styles/img',
    vendor: DISTDIR + '/vendor'
  };

/**
 * 处理脚本
 * @param  {object} options 配置
 * @param  {boolean} debug  是否调试
 * @return {[type]}         [description]
 */
function handleScripts(options, debug) {
  try {
    var config = options.scripts;
    var name = config.name;

    gulp.task(name, function() {
      if (debug) {
        return gulp.src(config.source)
          .pipe(concat(config.name))
          .pipe(gulp.dest(config.dist));
      }
      return gulp.src(config.source)
        .pipe(concat(config.name))
        .pipe(uglify())
        .pipe(gulp.dest(config.dist));
    });
    gulp.start(name);
  } catch (e) {
    console.error(e);
  }
}
/**
 * 处理样式
 * @param  {[type]} options [description]
 * @param  {[type]} debug   [description]
 * @return {[type]}         [description]
 */
function handleStyles(options, debug) {
  try {
    var config = options.styles;
    var name = config.name;
    gulp.task(name, function() {
      return gulp.src(config.source)
        .pipe(minifyCSS({
          keepBreaks: true
        }))
        .pipe(gulp.dest(config.dist));
    });
    gulp.start(name);
  } catch (e) {
    console.error(e);
  }
}
/**
 * 处理文档
 * @param  {[type]} options [description]
 * @param  {[type]} debug   [description]
 * @return {[type]}         [description]
 */
function handleDoc(options, debug) {
  try {
    var config = options.doc;
    var name = config.name;
    gulp.task(name, function() {
      return gulp.src(config.source)
        .pipe(yuidoc())
        .pipe(gulp.dest(config.dist));
    });
    gulp.start(name);
  } catch (e) {
    console.error(e);
  }
}
/**
 * 处理图片
 * @param  {[type]} options [description]
 * @param  {[type]} debug   [description]
 * @return {[type]}         [description]
 */
function handleImages(options, debug) {
  try {
    var config = options.images;
    var name = config.name;
    gulp.task(name, function() {
      return gulp.src(config.source)
        .pipe(imagemin({
          optimizationLevel: 5
        }))
        .pipe(gulp.dest(config.dist));
    });
    gulp.start(name);
  } catch (e) {
    console.error(e);
  }
}
/**
 * 基础任务
 * @param  {[type]} options  [description]
 * @param  {[type]} debug [description]
 * @return {[type]}       [description]
 */
function baseTask(options, debug) {
  for (var key in options) {
    switch (key) {
      case 'scripts':
        handleScripts(options, debug);
        break;
      case 'styles':
        handleStyles(options, debug);
        break;
      case 'doc':
        handleDoc(options, debug);
        break;
      case 'images':
        handleImages(options, debug);
        break;
      default:
    }
  }
}

/**
 * 合并html页面js与css
 * @param  {string} 文件路径
 * @param  {boolean} debug 是否调试模式
 * @return {*}
 */
function htmlMin(files, debug) {
  var jsList = [];
  if (!debug) jsList.push(uglify({
    preserveComments: 'some',
    mangle: false,
    compressor: {
      sequences: false,
      hoist_funs: false
    }
  }));
  jsList.push(rev());
  return gulp.src(files).pipe(usemin({
    js: jsList,
    css: [minifyCSS(), 'concat', rev()],
    html: [htmlmin({
      empty: false
    })]
  })).pipe(gulp.dest(DISTDIR));
}

// 代码瘦身 去除图片、flash、样式图片、第三方库
gulp.task('core', function(cb) {
  del(dist.images, {
    force: true
  });
  del(dist.swf, {
    force: true
  });
  del(dist.img, {
    force: true
  });
  del(dist.vendor, {
    force: true
  });
  console.dir('core');
  cb();
});

// 清空dist文件夹
gulp.task('clean', function() {
  return del(dist.all, {
    force: true
  });
});

// 替换
gulp.task('replace', function() {
  return gulp.src(['app/scripts/core/base.js'])
    .pipe(replace(/debug\((.|\n|\s)*?\);\/\/debug__/mg, '')).pipe(gulp.dest('app/scripts/core'));
});

// 移动文件
gulp.task('move', function() {
  return gulp.src(src.all).pipe(gulp.dest(DISTDIR));
});

// JS压缩
gulp.task('components.min', function() {
  return gulp.src(DISTDIR + '/components/**/controllers/*.js')
    .pipe(uglify()).pipe(gulp.dest(DISTDIR + '/components'));
});
gulp.task('modules.min', function() {
  return gulp.src(DISTDIR + '/modules/**/controllers/*.js')
    .pipe(uglify()).pipe(gulp.dest(DISTDIR + '/modules'));
});
gulp.task('scripts.min', function() {
  return gulp.src(DISTDIR + '/scripts/**/*.js')
    .pipe(uglify()).pipe(gulp.dest(DISTDIR + '/scripts'));
});
gulp.task('ui.min', function() {
  return gulp.src(DISTDIR + '/ui/**/controllers/*.js')
    .pipe(uglify()).pipe(gulp.dest(DISTDIR + '/ui'));
});

// 静态页面
gulp.task('index.merge', [], function() {
  htmlMin(dist.index, false);
});

// cdn替换
gulp.task('index.cdn', function() {
  return gulp.src(dist.index)
    .pipe(cdn({
      dir: DISTDIR,
      root: {
        js: 'http://img.jihui88.com/wcdn/leaflet',
        css: 'http://img.jihui88.com/wcdn/leaflet'
      }
    }))
    .pipe(gulp.dest(DISTDIR));
});

gulp.task('dist', function(callback) {
  runSequence('clean', 'move', ['components.min', 'modules.min', 'scripts.min', 'ui.min'], ['index.merge'],
    callback);
});

// clean        清空dist目录
// move         移动文件
// js.min       压缩脚本文件
// index.merge  压缩首页
// index.cdn    cdn

// core         删除一些图片，flash,第三方插件


//==================================================================================================
gulp.task('ueditor', [], function() {
  baseTask({
    scripts: {
      source: [
        'app/vendor/ueditor/src/pre.js',
        'app/vendor/ueditor/src/config.js',
        'app/vendor/ueditor/src/browser.js', // 浏览器判断模块
        'app/vendor/ueditor/src/utils.js', // 工具函数包
        'app/vendor/ueditor/src/events.js',
        'app/vendor/ueditor/src/range.js',
        'app/vendor/ueditor/src/selection.js',
        'app/vendor/ueditor/src/editor.js',
        'app/vendor/ueditor/src/loadconfig.js',
        'app/vendor/ueditor/src/ajax.js',
        'app/vendor/ueditor/src/filterword.js',
        'app/vendor/ueditor/src/node.js',
        'app/vendor/ueditor/src/htmlparser.js',
        'app/vendor/ueditor/src/filternode.js',
        'app/vendor/ueditor/src/plugin.js',
        'app/vendor/ueditor/src/keymap.js',
        'app/vendor/ueditor/src/plugins/defaultfilter.js',
        'app/vendor/ueditor/src/plugins/inserthtml.js',
        'app/vendor/ueditor/src/plugins/autotypeset.js',
        'app/vendor/ueditor/src/plugins/image.js',
        'app/vendor/ueditor/src/plugins/justify.js',
        'app/vendor/ueditor/src/plugins/font.js',
        'app/vendor/ueditor/src/plugins/link.js',
        'app/vendor/ueditor/src/plugins/iframe.js',
        'app/vendor/ueditor/src/plugins/removeformat.js',
        'app/vendor/ueditor/src/plugins/blockquote.js',
        'app/vendor/ueditor/src/plugins/indent.js',
        'app/vendor/ueditor/src/plugins/horizontal.js',
        'app/vendor/ueditor/src/plugins/selectall.js',
        'app/vendor/ueditor/src/plugins/paragraph.js',
        'app/vendor/ueditor/src/plugins/time.js',
        'app/vendor/ueditor/src/plugins/rowspacing.js',
        'app/vendor/ueditor/src/plugins/lineheight.js',
        'app/vendor/ueditor/src/plugins/insertcode.js',
        'app/vendor/ueditor/src/plugins/cleardoc.js',
        'app/vendor/ueditor/src/plugins/wordcount.js',
        'app/vendor/ueditor/src/plugins/pagebreak.js',
        'app/vendor/ueditor/src/plugins/dragdrop.js',
        'app/vendor/ueditor/src/plugins/undo.js',
        'app/vendor/ueditor/src/plugins/paste.js',
        'app/vendor/ueditor/src/plugins/puretxtpaste.js',
        'app/vendor/ueditor/src/plugins/list.js',
        'app/vendor/ueditor/src/plugins/source.js',
        'app/vendor/ueditor/src/plugins/enterkey.js',
        'app/vendor/ueditor/src/plugins/keystrokes.js',
        'app/vendor/ueditor/src/plugins/fiximgclick.js',
        'app/vendor/ueditor/src/plugins/autolink.js',
        'app/vendor/ueditor/src/plugins/autoheight.js',
        'app/vendor/ueditor/src/plugins/autofloat.js',
        'app/vendor/ueditor/src/plugins/table.js',
        'app/vendor/ueditor/src/plugins/contextmenu.js',
        'app/vendor/ueditor/src/plugins/shortcutmenu.js',
        'app/vendor/ueditor/src/plugins/basestyle.js',
        'app/vendor/ueditor/src/plugins/elementpath.js',
        'app/vendor/ueditor/src/plugins/formatmatch.js',
        'app/vendor/ueditor/src/plugins/insertparagraph.js',
        'app/vendor/ueditor/src/plugins/ui.js', // 工具栏 皮肤等
        'app/vendor/ueditor/src/end.js'
      ],
      name: 'ueditor.all.min.js',
      dist: './app/vendor/ueditor'
    }
  }, false);
});

gulp.task('dialog', [], function() {
  baseTask({
    scripts: {
      source: [
        'app/vendor/artDialog_v6/dialog-plus.js'
      ],
      name: 'dialog-plus.min.js',
      dist: './app/vendor/artDialog_v6'
    }
  }, false);
});

gulp.task('base', [], function() {
  baseTask({
    scripts: {
      source: [
        'app/vendor/seajs/sea-debug.js',
        'app/vendor/seajs/seajs-text-debug.js',
        'app/vendor/jquery/jquery-1.12.0.js',
        'app/Est/Est.source.js',
        'app/vendor/backbone/backbone-debug-est.js',
        'app/vendor/handlebars/handlebars-debug.js',

        'app/handlebars/HandlebarsHelper.js',
        'app/backbone/BaseApp.js',
        'app/backbone/BaseUtils.js',
        'app/backbone/BaseService.js',
        'app/backbone/SuperView.js',
        'app/backbone/BaseView.js',
        'app/backbone/BaseList.js',
        'app/backbone/BaseItem.js',
        'app/backbone/BaseCollection.js',
        'app/backbone/BaseModel.js',
        'app/backbone/BaseDetail.js'
      ],
      dist: 'C:/software/WorkProjects/Mobile/app/scripts/core',
      name: 'base.js'
    },
    doc: {
      source: [
        'app/backbone/*.js',
        'app/handlebars/HandlebarsHelper.js',
        'app/Est/Est.source.js'
      ],
      name: 'base_doc',
      dist: 'C:/software/WorkProjects/Mobile/doc'
    }
  }, true);
});

gulp.task('mobile', function() {
  baseTask({
    scripts: {
      source: [
        'app/vendor/seajs/sea-debug.js',
        'app/vendor/seajs/seajs-text-debug.js',
        'app/vendor/zepto/zepto.js',
        'app/Est/Est.mobile.js',
        'C:/software/WorkProjects/Mobile/app/scripts/const/const.js',
        'C:/software/WorkProjects/Mobile/app/scripts/config/config.local.js',
        'C:/software/WorkProjects/Mobile/app/modules/plugins/main.js',
        'C:/software/WorkProjects/Mobile/app/vendor/main.js',
        'C:/software/WorkProjects/Mobile/app/scripts/config/config.js'
      ],
      name: 'base.js',
      dist: 'C:/Users/yongjin/workspace/jhmobileWebsite/src/main/webapp/resources/scripts'
    }
  }, false);
});
gulp.task('mobile-util', function() {
  baseTask({
    scripts: {
      source: [
        'app/mobile/mobile-util.js'
      ],
      name: 'mobile-util.min.js',
      dist: 'app/mobile'
    }
  }, false);
});


gulp.task('jsmin', [], function() {
  baseTask({
    scripts: {
      source: [
        'app/backbone/BaseDetail.js'
      ],
      name: 'app.js',
      dist: './test/dist'
    }
  }, false);
});
