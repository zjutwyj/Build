/**
 * @description 模块功能说明
 * @class ModuleName
 * @author yongjin<zjut_wyj@163.com> 2016/2/6
 */
define('UiColorPicker', ['template/ui_color_picker', 'ColorPicker'], function(require, exports, module) {
  var ModuleName, template, ColorPicker;

  template = require('template/ui_color_picker');
  ColorPicker = require('ColorPicker');

  UiColorPicker = BaseView.extend({
    initialize: function() {
      this._initialize({
        template: template,
        afterRender: this.afterRender
      });
    },
    afterRender: function() {
      app.addRegion('colorPickerNormal', ColorPicker, {
        el: this.$('.ui-color-picker-normal'),
        target: this.$('#model-normal')
      });
    }
  });

  module.exports = UiColorPicker;
});
