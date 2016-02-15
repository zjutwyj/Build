/**
 * @description 模块功能说明
 * @class ModuleName
 * @author yongjin<zjut_wyj@163.com> 2016/2/6
 */
define('Tree', [], function(require, exports, module) {
  var Tree, template, model, collection, item;

  Handlebars.registerHelper('uiTreeCompare', function(list, options) {
    try {
      return list.length === 0 ? options.fn(this) :
        options.inverse(this);
    } catch (e) {
      console.log(e);
    }
  });

  template = '<div class="tree-wrap">' +
    '<ul class="tree-cate-ul">' +
    '<span class="x-grid-caret">' +
    '<span class="x-caret x-caret-middle x-caret-left x-caret-left-middle pointer node-collapse {{#uiTreeCompare children}}x-caret-left-gray{{/uiTreeCompare}}">' +
    '</span> ' +
    '</span>&nbsp;&nbsp; ' +
    '<span class="tree-name pointer toggle">{{name}}</span>' +
    '<ul class="tree-sub">' +
    '</ul> ' +
    '</ul> ' +
    '</div>';

  model = BaseModel.extend({

  });

  collection = BaseCollection.extend({
    model: model
  });

  item = BaseItem.extend({
    tagName: 'li',
    className: 'cate-grid-row',
    events: {
      'click .toggle': 'itemClick'
    },
    itemClick: function(e) {
      e.stopImmediatePropagation();
      app.getView(this._options.viewId).change(this.model.toJSON());
      this._toggleChecked(e);
    }
  });

  Tree = BaseList.extend({
    initialize: function() {
      this._initialize({
        template: template,
        model: model,
        collection: collection,
        item: item,
        render: '.tree-cate-ul',
        checkAppend: false,

        subRender: '.tree-sub',
        collapse: '.node-collapse',
        parentId: 'belongId',
        categoryId: 'categoryId',
        rootId: 'isroot', // 一级分类字段名称
        rootValue: '01', // 一级分类字段值
        extend: false
      });
    },
    change: function(model) {
      if (this._options.change)
        this._options.change.call(this, model);
    }
  });

  module.exports = Tree;
});
