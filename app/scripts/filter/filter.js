/**
 * @description 过滤器
 * @class filter - 过滤器
 * @author yongjin<zjut_wyj@163.com> 2015/6/22
 */

app.addFilter('navigator', function (name) {
  //判断管理员
  if (window.location.hash.indexOf('admin_inner') > -1 || window.location.hash.indexOf('admin_outer') > -1
    || window.location.hash.indexOf('admin_data') > -1 || window.location.hash.indexOf('admin_pay') > -1
    || window.location.hash.indexOf('admin_music') > -1) {
    Service.isWcdAdmin().done(function () {
      if (CONST.USER_ADMIN) {
      } else {
        window.location.href = 'http://wcd.jihui88.com/leaflet/index.html#/home'
      }
    });
  } else {
    if(Est.isEmpty(Est.cookie('autosurfing'))){
      if (!CONST.USER || !CONST.USER.username) {
        if (Est.findIndex(app.getStatus('publishUrl'), {url: location.hash}) === -1) {
          setTimeout(function(){
            Est.trigger('login');
          }, 1000);
        }
        if (window.location.hash.indexOf('design_center') > -1 ||
          window.location.hash.indexOf('design_create') > -1 || window.location.hash.indexOf('design_clone') > -1) {
          return false;
        }
      }
    }
  }
  // 清空所有对话框
  app.emptyDialog();
  window.$leafletBody = window.$leafletBody || $('#leaflet-body');
  window.$leafletBody.off('mousedown');
  window.$leafletBody.off('mousemove');
  window.$leafletBody.off('mouseup');
  Utils.addLoading();
});
