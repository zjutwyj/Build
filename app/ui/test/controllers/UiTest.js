/**
 * @description 模块功能说明
 * @class ModuleName
 * @author yongjin<zjut_wyj@163.com> 2016/2/6
 */
define('UiTest', ['template/ui_test', 'Tab'], function(require, exports, module) {
  var UiTest, template, Tab;

  template = require('template/ui_test');
  Tab = require('Tab');

  UiTest = BaseView.extend({
    initialize: function() {
      this._initialize({
        template: template,
        afterRender: this.afterRender
      });
    },
    afterRender: function() {
      var items = [
        { text: '普通列表', moduleId: 'UiList', oneRender: false },
        { text: '树型列表', moduleId: 'UiListTree', oneRender: false },
        { text: '树型组件', moduleId: 'UiTree', oneRender: false },
        { text: '对话框组件', moduleId: 'UiDialog', oneRender: false },
        { text: '下拉菜单', moduleId: 'UiSelect', oneRender: false },
        { text: '下拉框', moduleId: 'UiDropDown', oneRender: false },
        { text: '单选多选', moduleId: 'UiItemCheck', oneRender: false },
        { text: '选项切换', moduleId: 'UiTab', oneRender: false }
      ];
      app.addRegion('testNav', Tab, {
        tpl: '<a href="javascript:;" class="tool-tip" data-title="{{text}}">{{text}}</a>', // 模版
        el: this.$('#test-nav'), // 插入点
        cur: 'UiList', // 显示当前项内容
        theme: 'tab-ul-line', // 样式：目前有tab-ul-normal,tab-ul-text,tab-ul-btn,tab-ul-line
        path: 'moduleId', // 作用域字段
        toolTip: true,
        items: items
      });
    }
  });



  module.exports = UiTest;
});
