/**
 * @description leave
 * @class leave
 * @author yongjin<zjut_wyj@163.com> 2015/8/19
 */
// 配置退出浏览器执行的方法
if (CONST.ON_BEFORE_UNLOAD) {
  window.onbeforeunload = function () {
    if (!Est.msie() && window.location.hash.indexOf('#/design_center') > -1 && !app.getData('wcdPreView')) {
      return '您将要离开传单编辑页面，如果您的传单尚未保存，请不要离开！';
    }
    app.addData('wcdPreView', false);
  };
}