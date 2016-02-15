/**
 * @description 样式选择
 * @class UI - ui库
 * @author yongjin<zjut_wyj@163.com> 2015/4/8
 */
define('ItemCheck', [], function(require, exports, module) {
  var ItemCheck, model, collection, item;

  model = BaseModel.extend({
    baseId: 'id',
    defaults: Est.extend({}, BaseModel.prototype.defaults)
  });

  collection = BaseCollection.extend({
    model: model
  });

  item = BaseItem.extend({
    tagName: 'div',
    className: 'item-check',
    events: {
      'click .toggle': 'toggleChecked',
      'mouseenter .toggle': 'mouseEnter'
    },
    initialize: function() {
      this._initialize({
        template: '<div class="toggle clearfix">' + this.options.data.template +
          '<span class="check-icon x-icon x-icon-small x-icon-info"><i class="icon iconfont icon-right icon-white" style="font-size: 12px; line-height: 12px; display: block;"></i></span></div>',
        afterRender:this.afterRender
      });
    },
    afterRender: function  () {
      if ((this.options.data.compare && this.options.data.compare.call(this, this.model.toJSON())) ||
            (this.options.data.cur !== '-' && this.options.data.cur === this._getValue(this.options.data.path))) {
            if (Est.typeOf(this.options.data.init) === 'boolean' && this.options.data.init) {
              this._toggleChecked();
            } else {
              this.toggleChecked();
            }
          }
    },
    mouseEnter: function(e) {
      if (this._options.data.mouseEnter) this._options.data.mouseEnter.call(this, this.model.toJSON());
    },
    toggleChecked: function(e) {
      this._toggleChecked(e);
      $(this._options.data.target).val(this.model.get('value'));
      this.result = this.options.data.change.call(this, this.model.attributes, true);
      if (Est.typeOf(this.result) === 'boolean' && !this.result) return false;
    }
  });
  /**
   * 单选
   * @method [单选] - ItemCheck
   * @example
   *      app.addView('itemCheck', new ItemCheck({
   *        el: '#itemCheck',
   *        viewId: 'itemCheck',
   *        tpl: '<em>{{text}}</em>',
   *        cur: 'value_b',
   *        target: '#model-src',
   *        init: true, // 只初始化， 不执行change回调
   *        path: 'value',
   *        items: [
   *          { text: 'a', value: 'value_a' },
   *          { text: 'b', value: 'value_b' },
   *          { text: 'c', value: 'value_c' },
   *          { text: 'd', value: 'value_d' },
   *          { text: 'e', value: 'value_e' }
   *        ],
   *        change: function (item) {
   *          console.dir(app.getView('itemCheck')._getCheckboxIds('value'));
   *        },
   *        compare: function(item) {   // 自定义比较器
   *          if (item.value === cur || item.rgb === cur){
   *            return true;
   *          } else{
   *            return false;
   *          }
   *        },
   *        mouseEnter: function (model) {
   *
   *        }
   *      }));
   */
  ItemCheck = BaseList.extend({
    initialize: function() {
      this.targetVal = $(this.options.target).val();
      this.options.data = Est.extend(this.options.data || {}, {
        template: this.options.tpl || '<span>{{text}}</span>',
        change: this.options.change || function() {},
        cur: this.options.cur || (Est.isEmpty(this.targetVal) ? '-' : this.targetVal),
        compare: this.options.compare,
        path: this.options.path || 'value',
        target: this.options.target,
        init: this.options.init,
        mouseEnter: this.options.mouseEnter,
        afterRender: this.options.afterRender
      });
      this._initialize({
        model: model,
        collection: collection,
        item: item,
        checkAppend: Est.typeOf(this.options.checkAppend) === 'boolean' ? this.options.checkAppend:false
      });
    }
  });

  module.exports = ItemCheck;
});
