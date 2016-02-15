/**
 * @description Utils
 * @class Utils - 工具类
 * @author yongjin<zjut_wyj@163.com> 2014/12/2
 */
Utils = Est.extend(BaseUtils, {
  select: function(options) {
    var tagId = options.viewId || Est.nextUid('select');
    options = Est.extend({
      el: '.' + tagId,
      viewId: tagId,
      data: {
        width: options.width || 150
      }
    }, options);
    seajs.use(['Select'], function(Select) {
      options.el = '.' + tagId;
      app.addPanel(tagId, {
        el: options.render,
        template: '<div class="select-inner ' + tagId + '"></div>'
      }).addView(tagId, new Select(options));
    });
  }
});
