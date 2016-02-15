/**
 * @description 模块功能说明
 * @class ModuleName
 * @author yongjin<zjut_wyj@163.com> 2016/2/6
 */
define('UiSelect', ['template/ui_select', 'UiData', 'Select'], function(require, exports, module) {
  var UiSelect, template, UiData, Select;

  template = require('template/ui_select');
  UiData = require('UiData');
  Select = require('Select');

  UiSelect = BaseView.extend({
    initialize: function() {
      this._initialize({
        template: template,
        afterRender: this.afterRender
      });
    },
    afterRender: function() {
      var list = Est.each(UiData.select, function(item) {
        item.text = item.name;
        item.value = item.categoryId;
      });
      app.addRegion('select1', Select, {
        el: this.$('#ui-select'),
        target: '#model-categoryId',
        text: 'name',
        value: 'categoryId',
        width: 300,
        items: list,
        change: Est.proxy(function(ev, init) {
          this.model.set('selectResult', ev.value);
        }, this)
      });
      app.addRegion('select2', Select, {
        el: this.$('#ui-select-tree'),
        target: '#model0-categoryId',
        text: 'text',
        value: 'categoryId',
        width: 300,
        items: Est.extendTree(Est.chain(Est.cloneDeep(UiData.tree)).bulidTreeNode('isroot', '01', {
          rootKey: 'isroot', // 构建树时的父级字段名称
          rootValue: '01', // 父级字段值
          categoryId: 'categoryId', //分类 Id
          belongId: 'belongId', // 父类ID
          childTag: 'cates', // 子集字段名称
          sortBy: 'sort', // 根据某个字段排序
          text: 'name', // 下拉框名称
          value: 'categoryId', // 下拉框值
          callback: function(item) {
            item.text = item.name;
            item.value = item.categoryId;
          }
        }).bulidSelectNode(1, {
          name: 'text'
        }).value()),
        change: Est.proxy(function(ev, init) {
          this.model.set('selectResult', ev.value);
        }, this)
      });

      this._watch(['selectResult'], '.ui-select-result');
    }
  });

  module.exports = UiSelect;
});
