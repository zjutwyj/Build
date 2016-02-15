/**
 * @description DropDown
 * @class UI - ui库
 * @author yongjin<zjut_wyj@163.com> 2015/1/27
 */
define('DropDown', [], function(require, exports, module) {
  var DropDown, template;

  template = '<div class="bui-list-picker bui-picker bui-overlay bui-ext-position x-align-bl-tl bui-select-custom" aria-disabled="false" aria-pressed="false"style="visibility: visible;width:{{width}}; display: none;"> <div class="bui-simple-list bui-select-list" aria-disabled="false" aria-pressed="false" style="height: {{height}};overflow-x: {{overflowX}};width: {{width}};max-height: none;"> 正在加载... </div> </div>';

  /**
   * 下拉框
   * @method [下拉框] - DropDown
   * @author wyj 15.8.20
   * @example
   *        BaseUtils.initDropDown({
   *          target: '#drop-down-content',
   *          height: 250,
   *          width: 150,
   *          //overflowX: 'auto', // 默认为hidden
   *          content: $('#template-drop-down').html(),
   *          callback: function (options) {
   *              setTimeout(function () {
   *                app.getView(options.dropDownId).hide();
   *              }, 1000);
   *          }
   *      });
   *      BaseUtils.initDropDown({
   *        target: '#drop-down-module-id',
   *        moduleId: 'AttributesAdd',
   *        items: ['111', '222', '333'],
   *        callback: function (options) {
   *            setTimeout(function () {
   *          }, 5000);
   *        }
   *      });
   */
  DropDown = BaseView.extend({
    events: {
      'click .bui-list-picker': 'preventDefault'
    },
    initialize: function() {
      this._initialize({
        el: 'body',
        template: template,
        beforeRender: this.beforeRender,
        afterRender: this.afterRender
      });
    },
    beforeRender: function() {
      this.hasContent = false;

      this.model.set('width', this._options.data.width ?
        (Est.typeOf(this._options.data.width) === 'string' ?
          this._options.data.width : (this._options.data.width + 'px')) : 'auto');

      this.model.set('height', this._options.data.height ?
        (Est.typeOf(this._options.data.height) === 'string' ?
          this._options.data.height : (this._options.data.height + 'px')) : 'auto');

      this.model.set('overflowX', this._options.data.overflowX ?
        this._options.data.overflowX : 'hidden');

      this.model.set('overflowY', this._options.data.overflowY ?
        this._options.data.overflowY : 'hidden');

    },
    afterRender: function() {
      this.init();
    },
    init: function() {
      this.$picker = this.$('.bui-list-picker');
      this.$target = $(this._options.target);
      this.$content = this.$('.bui-select-list');
      if (this._options.mouseHover) {
        this.$target.hover(Est.proxy(this.show, this), Est.proxy(this.hide, this));
        if (this._options.mouseFollow) {
          this.$target.mousemove(Est.proxy(this.show, this));
        }
      } else {
        this.$target.click(Est.proxy(this.show, this));
      }

    },
    preventDefault: function(e) {
      e.stopImmediatePropagation();
      this.bindCloseEvent();
    },
    bindCloseEvent: function() {
      $(document).one('click', Est.proxy(this.hide, this));
    },
    show: function(event) {
      if (event) event.stopImmediatePropagation();
      $(document).click();
      this.$picker.css({
        left: this._options.mouseFollow ? event.pageX + 1 : this.$target.offset().left,
        top: this._options.mouseFollow ? event.pageY + 1 : this.$target.offset().top + this.$target.height()
      }).show();
      if (!this.hasContent) this.initContent();
      this.bindCloseEvent();
      return this;
    },
    close: function() {
      this.hide();
      return this;
    },
    remove: function() {
      this.$picker.off().remove();
    },
    reflesh: function(callback) {
      this.hasContent = false;
      if (callback) callback.call(this, this._options);
      this.show();
    },
    initContent: function() {
      this.hasContent = true;
      if (this._options.content) {
        this.$content.html(this._options.content);
        this._options.dropDownId = this._options.viewId;
        if (this._options.callback)
          this._options.callback.call(this, this._options);
      } else if (this._options.moduleId) {
        //TODO moduleId
        if (Est.typeOf(this._options.moduleId) === 'string') {
          seajs.use([this._options.moduleId], Est.proxy(function(instance) {
            this.doRender(instance);
          }, this));
        } else {
          this.doRender(this._options.moduleId);
        }
      }
    },
    doRender: function(instance) {
      this.viewId = Est.typeOf(this._options.moduleId) === 'string' ? (this._options.viewId + 'drop_down') : Est.nextUid('DropDown');
      delete this._options.template;
      this.$content.html('');
      // jquery对象无法通过Est.each遍历， 需备份到this._target,
      // 再移除target, 待克隆完成后把target添加到参数中
      if (this._options.target && Est.typeOf(this._options.target) !== 'String') {
        this._target = this._options.target;
        delete this._options.target;
      }
      app.addView(this.viewId, new instance(Est.extend(Est.cloneDeep(this._options), {
        el: this.$content,
        dropDownId: this._options.viewId,
        viewId: this.viewId,
        afterRender: this._options.callback,
        target: this._target
      })));
    },
    hide: function() {
      this.$picker.hide();
    },
    empty: function() {
      this.$el.off().remove();
    }
  });

  module.exports = DropDown;
});
