/**
 * @description 模块功能说明
 * @class ModuleName
 * @author yongjin<zjut_wyj@163.com> 2016/2/6
 */
define('UiListTree', ['template/ui_list_tree', 'UiData'], function(require, exports, module) {
  var UiListTree, template, model, collection, item, UiData;

  template = require('template/ui_list_tree');
  UiData = require('UiData');

  model = BaseModel.extend({

  });

  collection = BaseCollection.extend({
    model: model
  });

  item = BaseItem.extend({
    tagName: 'li',
    className: 'cate-grid-row clearfix',
    events: {
      'click .toggle': '_toggleChecked',
      'click .move-up': 'moveUp',
      'click .btn-del': 'del',
      'click .move-down': 'moveDown'
    },
    moveUp: function(e) {
      this._moveUp(e);
      app.getView(this._options.viewId).updateResult();
    },
    moveDown: function(e){
      this._moveDown(e);
      app.getView(this._options.viewId).updateResult();
    },
    del: function(e){
      this._del(e);
      app.getView(this._options.viewId).updateResult();
    }
  });


  UiListTree = BaseList.extend({
    initialize: function() {
      this._initialize({
        template: template,
        model: model,
        collection: collection,
        item: item,
        render: '.tree-list-ul',
        checkAppend: false,
        items: UiData.tree,
        afterRender: this.afterRender,

        subRender: '.node-tree',
        collapse: '.node-collapse',
        parentId: 'belongId',
        categoryId: 'categoryId',
        rootId: 'isroot', // 一级分类字段名称
        rootValue: '01', // 一级分类字段值
        extend: false
      });
    },
    afterRender: function() {
      this._watch(['uiListTreeResult'], '.ui-list-tree-result');
      this.$result = this.$('.ui-list-tree-result');
    },
    updateResult: function() {
      var ctx = this;
      this.$result.empty();
      Est.each(Est.cloneDeep(this._getItems()), function(item) {
        delete item._options;
        delete item.children;
        delete item.id;
        delete item.level;
        delete item.belongId;
        delete item.categoryId;
        delete item.isroot;
        delete item.checked;
        ctx.$result.append('<div>' + JSON.stringify(item) + '</div>');
      });
    }
  });

  module.exports = UiListTree;
});
