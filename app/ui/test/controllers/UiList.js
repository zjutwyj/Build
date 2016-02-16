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
      'click .checkAll': 'checkAll',
      'click .insertThree': 'insertThree',
      'click .insertOne': 'insertOne',
      'click .btn-batch-del': 'batchDel',
      'click .insertFive': 'insertFive'
    },
    initialize: function() {
      this._initialize({
        model: model,
        collection: collection,
        item: item,
        pagination: '#pagination-container1',
        pageSize: 5,
        checkAppend: true,
        checkToggle: true,
        template: template,
        render: '.list-render',
        items: Est.cloneDeep(UiData.list),
        afterRender: this.afterRender
      });
    },
    afterRender: function() {
      this.$result = this.$('#list-test-result');
      this._index = 0;
    },
    showResult: function() {
      var ctx = this;
      this.$result.empty();
      Est.each(Est.cloneDeep(this._getItems()), function(item) {
        delete item._options;
        ctx.$result.append('<div>' + JSON.stringify(item) + '</div>');
      });
    },
    checkAll: function(e) {
      this._checkAll(e);
      this.showResult();
    },
    addOne: function() {
      this._index++;
      this._push(new model({
        text: '插入到列表末尾' + this._index
      }));
      this.showResult();
    },
    insertOne: function() {
      this._index++;
      this._push(new model({
        text: '插入到第1个元素' + this._index
      }), 0);
      this.showResult();
    },
    insertThree: function() {
      this._index++;
      this._push(new model({
        text: '插入到第3个元素' + this._index
      }), 2);
      this.showResult();
    },
    insertFive: function() {
      this._index++;
      this._push(new model({
        text: '插入到第5个元素' + this._index
      }), 4);
      this.showResult();
    },
    batchDel: function(e) {
      this._batchDel(e, function() {
        this.showResult();
      });

    }
  });

  module.exports = UiList;
});
