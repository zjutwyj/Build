/**
 * @description 模块功能说明
 * @class ModuleName
 * @author yongjin<zjut_wyj@163.com> 2016/2/6
 */
define('UiDropDown', ['template/ui_drop_down', 'DropDown'], function(require, exports, module) {
  var UiDropDown, template, DropDown;

  template = require('template/ui_drop_down');
  DropDown = require('DropDown');

  UiDropDown = BaseView.extend({
    initialize: function() {
      this._initialize({
        template: template,
        afterRender: this.afterRender
      });
    },
    afterRender: function() {
      app.addRegion('dropDown', DropDown, {
        el: 'body',
        target: this.$('#ui-drop_down_normal'),
        content: 'aaaa',
        callback: function(options) {
          setTimeout(function() {
            console.dir(options);
          }, 2000);
        }
      });
      app.addRegion('dropDownModule', DropDown, {
        el: 'body',
        target: this.$('#ui-drop_down_module'),
        moduleId: 'UiTab'
      });
      app.addRegion('dropDownMouse', DropDown, {
        el: 'body',
        target: this.$('#ui-drop_down_mouse'),
        moduleId: 'UiTab',
        mouseFollow: true
      });
      app.addRegion('dropDownHover', DropDown, {
        el: 'body',
        target: this.$('#ui-drop_down_hover'),
        moduleId: 'UiTab',
        mouseHover: true,
        mouseFollow: true
      });
    }
  });

  module.exports = UiDropDown;
});
