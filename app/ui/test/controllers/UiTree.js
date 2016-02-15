/**
 * @description 模块功能说明
 * @class ModuleName
 * @author yongjin<zjut_wyj@163.com> 2016/2/6
 */
define('UiTree', ['template/ui_tree', 'Tree', 'UiData'], function(require, exports, module) {
  var UiTree, template, Tree, UiData;

  template = require('template/ui_tree');
  Tree = require('Tree');
  UiData = require('UiData');

  UiTree = BaseView.extend({
    initialize: function() {
      this._initialize({
        template: template,
        afterRender: this.afterRender
      });
    },
    afterRender: function() {
      app.addRegion('uiTree', Tree, {
        el: this.$('#ui-tree'),
        items: UiData.tree,
        change: Est.proxy(function(model) {
          delete model._options;
          delete model.children;
          this.model.set('uiTreeResult', JSON.stringify(model));
        }, this)
      });
      this._watch(['uiTreeResult'], '#ui-tree-result');
    }
  });

  module.exports = UiTree;
});
