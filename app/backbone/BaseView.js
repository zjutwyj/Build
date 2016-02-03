/**
 * @description 普通视图
 *
 *  - el: 目标元素Id 如 "#jhw-main"
 *  - initialize 实现父类_initialize
 *  - render 实现父类_render
 *  - 事件
 *      var panel = new Panel();
 *      panel.on('after', function(){
 *        this.albumList = app.addView('albumList', new AlbumList());
 *        this.photoList = app.addView('photoList', new PhotoList());
 *      });
 *      panel.render(); // 渲染
 *
 * @class BaseView - 普通视图
 * @author yongjin<zjut_wyj@163.com> 2014/12/8
 */


var BaseView = SuperView.extend({
  /**
   * 初始化
   *
   * @method [初始化] - _initialize ( 初始化 )
   * @param options [template: 字符串模板][model: 实例模型]
   * @author wyj 14.11.20
   * @example
   *      this._initialize({
       *         viewId: 'productList'，
       *         template: 字符串模板，
       *         data: 对象数据
       *         // 可选
       *         enterRender: 执行回车后的按钮点击的元素选择符 如 #submit .btn-search
       *         append: false // 视图是否是追加,
       *         toolTip: true, // 是否显示title提示框   html代码： <div class="tool-tip" title="提示内容">内容</div>
       *         beforeRender: function(){},
       *         afterRender: function(){}
       *      });
   */
  _initialize: function (options) {
    this._initOptions(options);
    this._initTemplate(this._options);
    this._initModel(Backbone.Model.extend({}));
    this._initBind(this._options);
    return this;
  },
  /**
   * 初始化参数
   *
   * @method [private] - _initOptions
   * @private
   * @author wyj 15.1.12
   */
  _initOptions: function (options) {
    this._options = Est.extend(this.options, options || {});
    this._options.data = this._options.data || {};
  },
  /**
   * 初始化模板， 若传递一个Template模板字符中进来， 则渲染页面
   *
   * @method [private] - _initTemplate
   * @private
   * @author wyj 15.1.12
   */
  _initTemplate: function (options) {
    if (options.template) {
      this.template = Handlebars.compile(options.template);
      this.$template = '<div>'+ options.template + '</div>';
    }
  },
  /**
   * 初始化模型类, 设置index索引
   *
   * @method [private] - _initModel
   * @private
   * @param model
   * @author wyj 14.11.20
   */
  _initModel: function (model) {
    this.model = new model(this._options.data);
  },
  /**
   * 绑定事件， 如添加事件， 重置事件
   *
   * @method [private] - _initBind
   * @private
   * @author wyj 14.11.16
   */
  _initBind: function (options) {
    this.model.bind('reset', this.render, this);
  },
  /**
   * 渲染
   *
   * @method [渲染] - _render ( 渲染 )
   * @author wyj 14.11.20
   * @example
   *        this._render();
   */
  _render: function () {
    this.trigger('before', this);
    if (this._options.beforeRender){
      this._options.beforeRender.call(this, this._options);
    }
    if (this._options.append)
      this.$el.append(this.template(this.model.toJSON()));
    else
      this.$el.html(this.template(this.model.toJSON()));
    this._initEnterEvent(this._options);
    if (this._options.modelBind) this._modelBind();
    this.trigger('after', this);
    if (this._options.afterRender) {
      this._options.afterRender.call(this, this._options);
    }
    if (this._options.toolTip) {
      this._initToolTip();
    }
    BaseUtils.removeLoading();
  },
  render: function(){
    this._render();
  },
  /**
   * 移除事件
   *
   * @method [private] - _empty
   * @private
   * @return {BaseView}
   * @author wyj 14.11.16
   */
  _empty: function () {
    debug('BaseView._empty');
  }
});
