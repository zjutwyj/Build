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
        modelBind: true,
        afterRender: this.afterRender
      });
    },
    afterRender: function() {
      app.addRegion('itemCheckNormal', ItemCheck, {
        el: this.$('#ui-item-check-normal'),
        tpl: '<span>{{text}}</span>',
        cur: 'value_2',
        target: '#model-item_check_normal',
        path: 'value',
        items: UiData.item_check,
        change: Est.proxy(function(item) {
          if (app.getView('itemCheckNormal')) {
            this.handleResult(app.getView('itemCheckNormal')._getCheckedItems());
          }
        }, this),
        compare: function(item) { // 自定义比较器
          if (item.value === 'value_b') {
            return true;
          } else {
            return false;
          }
        },
        mouseEnter: function(model) {}
      });

      app.addRegion('itemCheckBtn', ItemCheck, {
        el: this.$('#ui-item-check-btn'),
        tpl: '<span>{{text}}</span>',
        cur: 'value_2',
        target: '#model-item_check_btn',
        path: 'value',
        theme: 'ui-item-check-btn',
        items: UiData.item_check,
        change: Est.proxy(function(item) {
          if (app.getView('itemCheckBtn')) {
            this.handleResult(app.getView('itemCheckBtn')._getCheckedItems());
          }
        }, this)
      });
      app.addRegion('itemCheckRadio', ItemCheck, {
        el: this.$('#ui-item-check-radio'),
        tpl: '<span>{{text}}</span>',
        cur: 'value_2',
        target: '#model-item_check_radio',
        path: 'value',
        theme: 'ui-item-check-radio',
        items: UiData.item_check,
        change: Est.proxy(function(item) {
          if (app.getView('itemCheckRadio')) {
            this.handleResult(app.getView('itemCheckRadio')._getCheckedItems());
          }
        }, this)
      });
      app.addRegion('itemCheckAppend', ItemCheck, {
        el: this.$('#ui-item-check-append'),
        tpl: '<span>{{text}}</span>',
        cur: 'value_2',
        target: '#model-item_check_append',
        path: 'value',
        checkAppend: true,
        checkToggle: true,
        items: UiData.item_check,
        change: Est.proxy(function(item) {
          if (app.getView('itemCheckAppend')) {
            this.handleResult(app.getView('itemCheckAppend')._getCheckedItems());
          }
        }, this)
      });
      app.addRegion('itemCheckCheckbox', ItemCheck, {
        el: this.$('#ui-item-check-checkbox'),
        target: '#model-item_check_checkbox',
        path: 'value',
        theme: 'ui-item-check-checkbox',
        checkAppend: true,
        checkToggle: true,
        items: UiData.item_check,
        change: Est.proxy(function(item) {
          if (app.getView('itemCheckCheckbox')) {
            this.handleResult(app.getView('itemCheckCheckbox')._getCheckedItems());
          }
        }, this)
      });
      this.handleWatch();
    },
    handleWatch: function() {
      this._watch(['#model-item_check_normal', '#model-item_check_btn', '#model-item_check_radio',
        '#model-item_check_append', '#model-item_check_checkbox'
      ], '', function(model) {
        if (model.get('item_check_normal')) {
          app.getView('itemCheckNormal').setValue(model.get('item_check_normal'));
        } else if (model.get('item_check_btn')) {
          app.getView('itemCheckBtn').setValue(model.get('item_check_btn'));
        } else if (model.get('item_check_radio')) {
          app.getView('itemCheckRadio').setValue(model.get('item_check_radio'));
        } else if (model.get('item_check_append')) {
          app.getView('itemCheckAppend').setValue(model.get('item_check_append'));
        } else if (model.get('item_check_checkbox')) {
          app.getView('itemCheckCheckbox').setValue(model.get('item_check_checkbox'));
        }
      });
      this._watch(['itemCheckResult'], '.ui-item-check-result');
    },
    handleResult: function(list) {
      var result = '';
      Est.each(list, function(item) {
        var _item = Est.cloneDeep(item.attributes);
        delete _item._options;
        result += ('<div>' + JSON.stringify(_item) + '</div>');
      });
      this.model.set('itemCheckResult', result);
    }
  });

  module.exports = UiItemCheck;
});
