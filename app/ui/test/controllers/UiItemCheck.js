/**
 * @description 模块功能说明
 * @class ModuleName
 * @author yongjin<zjut_wyj@163.com> 2016/2/6
 */
define('UiItemCheck', ['template/ui_item_check', 'ItemCheck', 'UiData'], function(require, exports, module) {
  var UiItemCheck, template, ItemCheck, UiData;

  template = require('template/ui_item_check');
  ItemCheck = require('ItemCheck');
  UiData = require('UiData');

  UiItemCheck = BaseView.extend({
    initialize: function() {
      this._initialize({
        template: template,
        afterRender: this.afterRender
      });
    },
    afterRender: function() {
      app.addRegion('itemCheckNormal', ItemCheck, {
        el: this.$('#ui-item_check'),
        tpl: '<em>{{text}}</em>',
        cur: 'value_b',
        target: '#model-item_check',
        path: 'value',
        items: UiData.item_check,
        change: Est.proxy(function(item) {
          if (app.getView('itemCheckNormal')) {
            this.updateResult(app.getView('itemCheckNormal')._getCheckedItems());
          }
        }, this),
        compare: function(item) { // 自定义比较器
          if (item.value === 'value_b') {
            return true;
          } else {
            return false;
          }
        },
        mouseEnter: function(model) {

        }
      });
      app.addRegion('itemCheckAppend', ItemCheck, {
        el: this.$('#ui-item_check'),
        tpl: '<em>{{text}}</em>',
        cur: 'value_b',
        target: '#model-item_check',
        path: 'value',
        checkAppend: true,
        checkToggle: true,
        items: UiData.item_check,
        change: Est.proxy(function(item) {
          if (app.getView('itemCheckAppend')) {
            this.updateResult(app.getView('itemCheckAppend')._getCheckedItems());
          }
        }, this),
        compare: function(item) { // 自定义比较器
          if (item.value === 'value_b') {
            return true;
          } else {
            return false;
          }
        },
        mouseEnter: function(model) {

        }
      });
      this._watch(['itemCheckResult'], '.ui-item-check-result');
    },
    updateResult: function(list) {
      var result = '';
      Est.each(Est.cloneDeep(list), function(item) {
        delete item.attributes._options;
        result += ('<div>' + JSON.stringify(item.attributes) + '</div>');
      });
      this.model.set('itemCheckResult', result);
    }
  });

  module.exports = UiItemCheck;
});
