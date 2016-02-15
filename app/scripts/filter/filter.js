/**
 * @description 过滤器
 * @class filter - 过滤器
 * @author yongjin<zjut_wyj@163.com> 2015/6/22
 */

app.addFilter('navigator', function (name) {
  // 清空所有对话框
  app.emptyDialog();
  // 转场加载动画
  Utils.addLoading();
});
