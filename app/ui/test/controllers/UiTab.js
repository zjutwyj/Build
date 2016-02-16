/**
 * @description 模块功能说明
 * @class ModuleName
 * @author yongjin<zjut_wyj@163.com> 2016/2/6
 */
define('UiTab', ['template/ui_tab', 'Tab', 'UiData'], function(require, exports, module) {
  var UiTab, template, UiTab, UiData;

  template = require('template/ui_tab');
  Tab = require('Tab');
  UiData = require('UiData');

  UiTab = BaseView.extend({
    initialize: function() {
      this._initialize({
        template: template,
        afterRender: this.afterRender
      });
    },
    afterRender: function() {
      app.addRegion(Est.nextUid('manageListNav'), Tab, {
        el: this.$('#ui-tab-normal'), // 插入点
        tpl: '<a href="javascript:;">{{text}}</a>', // 模版
        cur: 'HomeIntro', // 显示当前项内容
        theme: 'tab-ul-normal', // 样式：目前有tab-ul-normal,tab-ul-text,tab-ul-btn,tab-ul-line
        path: 'moduleId', // 作用域字段
        items: UiData.tab,
        change: Est.proxy(function(item, init) { // 点击事件回调
          if (init) return; // 是否是初始化
          this.model.set('tabResult', item.sortType);
        }, this)
      });
      app.addRegion(Est.nextUid('manageListNav'), Tab, {
        el: this.$('#ui-tab-text'), // 插入点
        tpl: '<a href="javascript:;">{{text}}</a>', // 模版
        cur: 'HomeIntro', // 显示当前项内容
        theme: 'tab-ul-text', // 样式：目前有tab-ul-normal,tab-ul-text,tab-ul-btn,tab-ul-line
        path: 'moduleId', // 作用域字段
        items: UiData.tab,
        change: Est.proxy(function(item, init) { // 点击事件回调
          if (init) return; // 是否是初始化
          this.model.set('tabResult', item.sortType);
        }, this)
      });
      app.addRegion(Est.nextUid('manageListNav'), Tab, {
        el: this.$('#ui-tab-line'), // 插入点
        tpl: '<a href="javascript:;">{{text}}</a>', // 模版
        cur: 'HomeIntro', // 显示当前项内容
        theme: 'tab-ul-line', // 样式：目前有tab-ul-normal,tab-ul-text,tab-ul-btn,tab-ul-line
        path: 'moduleId', // 作用域字段
        items: UiData.tab,
        change: Est.proxy(function(item, init) { // 点击事件回调
          if (init) return; // 是否是初始化
          this.model.set('tabResult', item.sortType);
        }, this)
      });
      app.addRegion(Est.nextUid('manageListNav'), Tab, {
        el: this.$('#ui-tab-btn'), // 插入点
        tpl: '<a href="javascript:;">{{text}}</a>', // 模版
        cur: 'HomeIntro', // 显示当前项内容
        theme: 'tab-ul-btn', // 样式：目前有tab-ul-normal,tab-ul-text,tab-ul-btn,tab-ul-line
        path: 'moduleId', // 作用域字段
        items: UiData.tab,
        change: Est.proxy(function(item, init) { // 点击事件回调
          if (init) return; // 是否是初始化
          this.model.set('tabResult', item.sortType);
        }, this)
      });
    }
  });

  module.exports = UiTab;
});
