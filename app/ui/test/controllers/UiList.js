/**
 * @description 模块功能说明
 * @class ModuleName
 * @author yongjin<zjut_wyj@163.com> 2016/2/6
 */
define('UiList', ['template/ui_list', 'UiData'], function(require, exports, module) {
  var UiList, template, model, collection, item, UiData;

  template = require('template/ui_list');
  UiData = require('UiData');

  model = BaseModel.extend({

  });

  collection = BaseCollection.extend({
    model: model
  });

  item = BaseItem.extend({
    tagName: 'li',
    className: 'test-item clearfix',
    events: {
      'click .toggle': 'toggleChecked',
      'click .btn-move-up': 'moveUp',
      'click .btn-move-down': 'moveDown',
      'click .btn-display': 'setDisplay',
      'click .btn-edit': 'edit',
      'click .btn-delete': 'del'
    },
    setDisplay: function() {
      this.model.set('isdisplay', this.model.get('isdisplay') === '1' ? '0' : '1');
      app.getView(this._options.viewId).showResult();
    },
    toggleChecked: function(e) {
      this._toggleChecked(e);
      app.getView(this._options.viewId).showResult();
    },
    moveUp: function(e) {
      this._moveUp(e);
      app.getView(this._options.viewId).showResult();
    },
    moveDown: function(e) {
      this._moveDown(e);
      app.getView(this._options.viewId).showResult();
    },
    edit: function() {
      var ctx = this;
      this._editField({
        title: '修改名称',
        field: 'text'
      }).then(function() {
        app.getView(ctx._options.viewId).showResult();
      });
    },
    del: function(e) {
      this._del(e, function() {
        app.getView(this._options.viewId).showResult();
      });
    }
  });

  UiList = BaseList.extend({
    events: {
      'click .addOne': 'addOne',
      'click .insertOne': 'insertOne'
    },
    initialize: function() {
      this._initialize({
        model: model,
        collection: collection,
        item: item,
        pagination: '#pagination-container1',
        pageSize: 5,
        checkAppend: false,
        template: template,
        render: '.list-render',
        items: Est.cloneDeep(UiData.list),
        afterRender: this.afterRender
      });
    },
    afterRender: function() {
      this.$result = this.$('#list-test-result');
    },
    showResult: function() {
      var ctx = this;
      this.$result.empty();
      Est.each(Est.cloneDeep(this._getItems()), function(item) {
        delete item._options;
        ctx.$result.append('<div>' + JSON.stringify(item) + '</div>');
      });
    },
    addOne: function() {
      this._push(new model({
        text: '我是插入进来的'
      }));
    },
    insertOne: function() {
      this._push(new model({
        text: '我是插入进来的'
      }), 0);
    }
  });

  module.exports = UiList;
});
