/**
 * @description Tab
 * @class UI - ui库
 * @author yongjin<zjut_wyj@163.com> 2015/9/6
 */
define('Tab', [], function (require, exports, module) {
  var Tab, model, collection, item;

  model = BaseModel.extend({
    baseId: 'id',
    defaults: Est.extend({
    }, BaseModel.prototype.defaults)
  });

  collection = BaseCollection.extend({
    model: model
  });

  item = BaseItem.extend({
    tagName: function () {
      return this.options.data.tagName || 'li';
    },
    className: 'tab-li',
    events: {
      'click .toggle': 'toggleChecked'
    },
    initialize: function () {
      this.tabName = this.options.data.tagName || 'li';
      this._initialize({
        template: '<div class="toggle">' + this.options.data.template + '</div>',
        toolTip: this.options.data.toolTip,
        afterRender: function () {
          if (this.options.data.cur !== '-' && (this.options.data.cur === this._getValue(this.options.data.path))) {
            this._toggleChecked();
            this.options.data.change.call(this, this.model.attributes, true);
            setTimeout(Est.proxy(function () {
              this.showCurModule(this.options.data.cur, true);
            }, this), 0);
          }
          this.$('.toggle:first').addClass('tab-' + this._getValue(this.options.data.path));
        }
      });
    },
    showCurModule: function (modId, lazy) {
      if (app.getView(this._options.viewId)) {
        app.getView(this._options.viewId).showModule(modId, this.model.get('dx'), this.model.get('moduleId'));
        if (app.getView(this._options.viewId).getType() === 'tab-ul-line') this.setSliderBar(lazy);
      }
    },
    setSliderBar: function (lazy) {
      setTimeout(Est.proxy(function () {
        app.getView(this._options.viewId).setSliderBar(this.$el.outerWidth(), this.$el.position().left);
      }, this), lazy ? 200 : 0);
    },
    toggleChecked: function (e) {
      this._toggleChecked(e);
      this.showCurModule(this._getValue(this.options.data.path));
      $(this._options.data.target).val(this._getValue(this.options.data.path));
      this.options.data.change.call(this, this.model.attributes);
    }
  });

  /**
   * tab选项卡
   * @method [选项卡] - Tab
   * @author wyj 15.8.20
   * @example
   *        app.addView('manageListNav', new Tab({
   *          el: this.$('.wdm_cat'),                                                 // 插入点
   *          viewId: 'manageListNav',                                                // 视图ID
   *          tpl: '<a href="javascript:;">{{text}}</a>',                             // 模版
   *          toolTip: true,                                                          // 是否初始化提示，详见SuperView的_initilize参数说明
   *          cur: '#config-prop',                                                    // 显示当前项内容
   *          require: false,                                                         // 是否模块化请求， 默认为true（若去除此配置，items里的nodeId都得改成moduleId）
   *          theme: 'tab-ul-text',                                                   // 样式：目前有tab-ul-normal,tab-ul-text,tab-ul-btn,tab-ul-line
   *          path: 'nodeId',                                                         // 作用域字段
   *          contSelector: '#tab-cont',                                                       // 【可选】容器选择符
   *          args: {},                                                               // 传递给视图的参数
   *          items: [
   *            { text: '最新', nodeId: '#config-prop', sortType: 'addTime'},         // 若存在moduleId,则配置项里require是否为false,都会根据模块类型渲染，el默认为nodeId
   *            { text: '浏览量', nodeId: '#config-global', sortType: 'views', oneRender: false},  // 若存在oneRender: true,则只渲染一次， 否则实时
   *            { text: '转发量', nodeId: '#config-global', sortType: 'mviews'},
   *            { text: '反馈量', nodeId: '#config-global', sortType: 'rviews'}
   *          ],
   *          change: Est.proxy(function (item, init) {                               // 点击事件回调
   *            if (init) return;                                                     // 是否是初始化
   *            this.collection.paginationModel.set('sortType', item.sortType);
   *            this._reload();                                                       // 重新加载列表   _load()表示可追加列表
   *          }, this)
   *        }));
   */
  Tab = BaseList.extend({
    initialize: function () {
      this.targetVal = $(this.options.target).val();
      this.$tabCont = $('<div class="tab-cont"></div>');                                          // 导航容器
      this.$tabList = null;                                                                       // 导航列表
      this.$selectorList = [];                                                                    // 目标元素选择符列表
      this.$listCont = this.options.contSelector ? $(this.options.contSelector) : this.$tabCont; // 目标元素的容器

      this.options.data = Est.extend(this.options.data || {}, {
        template: this.options.tpl || '<span>{{text}}</span>',
        cur: this.options.cur || (Est.isEmpty(this.targetVal) ? '-' : this.targetVal),
        path: this.options.path || 'value',
        tagName: this.options.tagName || 'li',
        target: this.options.target,
        change: this.options.change || function () {
        }
      });
      if (typeof this.options.require === 'undefined' ||
        (typeof this.options.require !== 'undefined' && this.options.require)) {
        this.require = true;
        Est.each(this.options.items, Est.proxy(function (item, index) {
          this.$listCont.append($('<div class="tab-cont-div tab-cont-' + this.options.viewId + index + '" style="display: none;"></div>'));
        }, this));
        this.$tabList = this.$listCont.find('.tab-cont-div');
      } else if ('nodeId' in this.options.items[this.options.items.length - 1]) {
        Est.each(this.options.items, function (item) {
          this.$selectorList.push(item[this.options.path]);
        }, this);
        setTimeout(Est.proxy(function () {
          this.$tabList = $(this.$selectorList.join(', '));
        }, this), 0);
      }
      this._initialize({
        template: '<ul class="tab-ul tab-ul' + this.options.viewId + ' ' + (this.options.theme || 'tab-ul-normal') + ' nav-justified clearfix"></ul>' + (this.options.theme === 'tab-ul-line' ? '<div class="slideBar"><div class="slideBarTip transitionPanel" style="left: 3.5px; width: 50px;"></div></div>' : ''),
        model: model,
        render: '.tab-ul' + this.options.viewId,
        collection: collection,
        item: item,
        checkAppend: false,
        afterRender: this.afterRender
      });
    },
    showModule: function (modId, index, moduleId) {
      try {
        var moduleName = modId;
        if (!this.$tabList) return;
        this.$tabList.hide();
        this.$tabList.size() > 0 && this.$tabList.eq(index).show();
        if (!this.require && !moduleId) {
          return;
        } else if (moduleId) {
          moduleName = moduleId;
        }
        this.renderType = Est.typeOf(this.options.items[index]['oneRender']) === 'undefined' ? '_one' :
          this.options.items[index]['oneRender'] ? '_one' : '_require';
        this[this.renderType]([moduleName + (this.renderType === '_one' ? '-' + index : '')], function (instance) {
          app.addPanel(moduleName + '-' + index, {
            el: this.$tabList.eq(index),
            template: '<div class="tab-cont-inner' + moduleName + index + '">正在加载中...</div>'
          }).addView(moduleName + '-' + index, new instance(Est.extend(this.options.items[index].args || {}, {
            el: this.require ? $('.tab-cont-inner' + moduleName + index, this.$tabList.eq(index)) : this.$tabList.eq(index),
            append: false,
            viewId: moduleName + '-' + index,
            data: this.options.items[index]['data'] || {}
          })));
        });
      } catch (e) {
        console.log(e);
      }
    },
    setSliderBar: function (width, left) {
      this.$('.slideBarTip:first').css({
        left: left,
        width: width
      });
    },
    getType: function () {
      return this._options.theme;
    },
    afterRender: function () {
      this.$el.append(this.$tabCont);
    }
  });

  module.exports = Tab;
});