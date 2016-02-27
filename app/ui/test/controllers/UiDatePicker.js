/**
 * @description 模块功能说明
 * @class ModuleName
 * @author yongjin<zjut_wyj@163.com> 2016/2/6
 */
define('UiDatePicker', ['template/ui_date_picker', 'DatePicker'], function(require, exports, module) {
  var UiDatePicker, template, DatePicker;

  template = require('template/ui_date_picker');
  DatePicker = require('DatePicker');

  UiDatePicker = BaseView.extend({
    events: {
      'click #setDate': 'setDate'
    },
    initialize: function() {
      this._initialize({
        template: template,
        afterRender: this.afterRender
      });
    },
    afterRender: function() {
      app.addRegion('start', DatePicker, {
        el: this.$('.date-picker-normal'),
        target: this.$('#model-normal'),
        label: '起始时间'
      });
      app.addRegion('end', DatePicker, {
        el: this.$('.date-picker-end'),
        target: this.$('#model-normal'),
        label: '结束时间'
      });
      app.addRegion('custom', DatePicker, {
        el: this.$('.date-picker-custom'),
        tpl: '<span style="cursor: pointer;">点我选取日期</span>',
        target: this.$('#model-custom')
      });
    },
    setDate: function(){
      app.getView('start').setValue('2016-05-09');
      app.getView('end').setValue('2016-05-09');
      app.getView('custom').setValue('2016-05-09');
    }
  });

  module.exports = UiDatePicker;
});
