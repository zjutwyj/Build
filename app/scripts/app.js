/**
 * @description 应用程序创建
 * @class app
 * @author yongjin<zjut_wyj@163.com> 2015/2/5
 */

/**
 * 应用程序创建
 * */
if (typeof app === 'undefined') {
  window.app_version = CONST.APP_VERSION.replace(/_.*$/g, '');
  App = app = new BaseApp(CONST);
  if (app.getSession('_APP_UPDATE_') !== window.app_version) {
    app.addSession('_APP_UPDATE_', window.app_version);
    app.addData('versionUpdated', true);
  }
}
window.app = window.App = app;
window.UEDITOR_HOME_URL = CONST.HOST + '/vendor/ueditor/';
/*BaseApp.prototype.addTemplate = function(name, path) {
  if (name in this.templates) {
    debug('Error11 template name:' + name); //debug__
  }
  this.templates[name] = function(require, exports, module) {
    module.exports = require(path);
  };
};*/

if (Est.msie() && Est.msie() < 9) {
  var $msieTip = $('<div style="width: 500px;height: 400px;position: absolute;left: 50%;top: 50%;margin-left: -250px;margin-top: -200px;z-index: 999999;background: #fff;border-radius: 5px;font-size: 20px;line-height: 2em;padding: 20px;">' +
    '当出现这个对话框时，表明您的浏览器版本过低，使用中会出现一些问题，建议使用最新版的' +
    '<a href="http://www.google.cn/intl/zh-CN/chrome/browser/desktop/index.html" target="_blank" >谷歌浏览器</a>、' +
    '<a href="http://se.360.cn/" target="_blank" >360浏览器</a>、' +
    '<a href="http://windows.microsoft.com/zh-cn/internet-explorer/ie-11-worldwide-languages" target="_blank">IE9及以上浏览器</a>' +
    '这些浏览器更好用，更强大。' +
    '<br><br><a href="javascript:;" class="continue">继续使用</a>' +
    '</div>');
  $msieTip.find('.continue').click(function() {
    $msieTip.remove();
  });
  $('body').append($msieTip);
}
