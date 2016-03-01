/**
 * @description 所有BaseXxx模块的超类， 子类继承超类的一切方法
 * @class SuperView - 所有BaseXxx模块的超类
 * @author yongjin<zjut_wyj@163.com> 2015/1/24
 */

var SuperView = Backbone.View.extend({
  /**
   * 传递options进来
   *
   * @method [private] - constructor
   * @private
   * @param options
   * @author wyj 14.12.16
   */
  constructor: function(options) {
    this.options = options || {};
    this._modelBinder = Backbone.ModelBinder;
    if (this.init && Est.typeOf(this.init) !== 'function')
      this._initialize(this.init);
    Backbone.View.apply(this, arguments);
  },
  initialize: function() {
    this._initialize();
  },
  /**
   * 导航
   *
   * @method [导航] - _navigate ( 导航 )
   * @param name
   * @author wyj 15.1.13
   */
  _navigate: function(name, options) {
    options = options || true;
    Backbone.history.navigate(name, options);
  },
  /**
   * 静态对话框， 当你需要显示某个组件的视图但不是以iframe形式打开时
   * 对话框参数将作为模块里的options参数
   *
   * @method [对话框] - _dialog ( 静态对话框 )
   * @param options
   * @author wyj 15.1.22
   * @example
   *        // 获取对话框
   *          app.getDialog('moduleId || id');
   *          this._dialog({
   *                moduleId: 'SeoDetail', // 模块ID
   *                title: 'Seo修改', // 对话框标题
   *                id: this.model.get('id'), // 初始化模块时传入的ID， 如productId
   *                width: 600, // 对话框宽度
   *                height: 250, // 对话框高度
   *                skin: 'form-horizontal', // className
   *                hideSaveBtn: false, // 是否隐藏保存按钮， 默认为false
   *                autoClose: true, // 提交后按确定按钮  自动关闭对话框
   *                quickClose: true, // 点击空白处关闭对话框
   *                button: [ // 自定义按钮
   *                  {
   *                    value: '保存',
   *                    callback: function () {
   *                    this.title('正在提交..');
   *                    $("#SeoDetail" + " #submit").click(); // 弹出的对话ID选择符为id (注：当不存在id时，为moduleId值)
   *                    app.getView('SeoDetail'); // 视图为moduleId
   *                    return false; // 去掉此行将直接关闭对话框
   *                  }}
   *                ],
   *                onShow: function(){ // 对话框弹出后调用   [注意，当调用show方法时， 对话框会重新渲染模块视图，若想只渲染一次， 可以在这里返回false]
   *                    return true;
   *                },
   *                onClose: function(){
   *                    this._reload(); // 列表刷新
   *                    this.collection.push(Est.cloneDeep(app.getModels())); // 向列表末尾添加数据, 注意必须要深复制
   *                    this.model.set(app.getModels().pop()); // 修改模型类
   *                }
   *            }, this);
   */
  _dialog: function(options, context) {
    var ctx = context || this;
    var viewId = Est.typeOf(options.id) === 'string' ? options.id : options.moduleId;

    /*    options.width = options.width || 'auto';
        options.title = options.title || null;
        options.cover = Est.typeOf(options.cover) === 'boolean' ? options.cover : false;
        options.autofocus = Est.typeOf(options.autofocus) === 'boolean' ? options.autofocus : false;
        options.hideOkBtn = Est.typeOf(options.hideOkBtn) === 'boolean' ? options.hideOkBtn : true;
        options.hideCloseBtn = Est.typeOf(options.hideCloseBtn) === 'boolean' ? options.hideCloseBtn : true;
        options.button = options.button || [];
        options.quickClose = options.cover ? false : (Est.typeOf(options.autofocus) === 'boolean' ? options.quickClose : false);
        options.skin = options.skin || 'dialog_min';*/

    options = Est.extend({
      width: 'auto',
      title: null,
      cover: false,
      autofocus: false,
      hideOkBtn: true,
      hideCloseBtn: true,
      button: [],
      quickClose: options.cover ? false : (Est.typeOf(options.autofocus) === 'boolean' ? options.quickClose : false),
      skin: 'dialog_min'
    }, options);

    options = Est.extend(options, {
      el: '#base_item_dialog' + viewId,
      content: options.content || '<div id="' + viewId + '"></div>',
      viewId: viewId,
      onshow: function() {
        try {
          var result = options.onShow && options.onShow.call(this, options);
          if (typeof result !== 'undefined' && !result)
            return;
          if (Est.typeOf(options.moduleId) === 'function') {
            app.addPanel(options.id, {
              el: '#' + options.id,
              template: '<div id="base_item_dialog' + options.id + '"></div>'
            }).addView(options.id, new options.moduleId(options));
          } else if (Est.typeOf(options.moduleId) === 'string') {
            seajs.use([options.moduleId], function(instance) {
              try {
                if (!instance) {
                  console.error('module is not defined');
                }
                app.addPanel(options.viewId, {
                  el: '#' + options.viewId,
                  template: '<div id="base_item_dialog' + options.viewId + '"></div>'
                }).addView(options.viewId, new instance(options));
              } catch (e) {
                console.log(e);
              }
            });
          }
        } catch (e) {
          console.log(e);
        }
      },
      onclose: function() {
        if (options.onClose) options.onClose.call(ctx, options);
        app.getDialogs().pop();
      }
    });
    BaseUtils.dialog(options);
  },
  /**
   * 单个模型字段绑定
   * @method [绑定] - _singeBind
   * @param selector
   * @param model
   * @author wyj 15.7.20
   * @example
   * @private
   * @author wyj 15.7.20
   * @example
   *    this._singleBind('#model-name', this.model);
   */
  _singleBind: function(selector, model, changeFn) {
    var _self = this;
    $(selector).each(function() {
      var bindType = $(this).attr('data-bind-type');
      if (Est.isEmpty(bindType)) {
        bindType = 'change';
      }
      $(this).on(bindType, function(e) {
        var val, pass, modelId;

        if (e.keyCode === 37 || e.keyCode === 39 ||
          e.keyCode === 38 || e.keyCode === 40) {
          return false;
        }
        modelId = window._singleBindId = $(this).attr('id');
        if (modelId && modelId.indexOf('model') !== -1) {
          switch (this.type) {
            case 'radio':
              val = $(this).is(":checked") ? $(this).val() : pass = true;
              break;
            case 'checkbox':
              val = $(this).is(':checked') ? (Est.isEmpty($(this).attr('true-value')) ? true : $(this).attr('true-value')) :
                (Est.isEmpty($(this).attr('false-value')) ? false : $(this).attr('false-value'));
              break;
            default:
              val = $(this).val();
              break;
          }
          if (!pass) {
            _self._setValue(modelId.replace(/^model\d?-(.+)$/g, "$1"), val);
            if (changeFn) changeFn.call(this, model);
          }
        }
      });
    });
  },
  /**
   * 视图到模型类的绑定
   *
   * @method [绑定] - _modelBind
   * @private
   * @author wyj 14.12.25
   * @example
   *        this._modelBind();
   */
  _modelBind: function(selector, changeFn) {
    var _self = this;
    if (selector) this._singleBind(selector, this.model, changeFn);
    else this.$("input, textarea, select").each(function() {
      _self._singleBind($(this), _self.model);
    });
  },
  /**
   * 模型类到视图的绑定
   *
   * @method [绑定] - _viewBind
   * @param {string} name
   * @param {string} selector
   * @param {fn} callback
   * @author wyj 15.7.17
   * @example
   *      this._viewBind([
   *        {
   *          ''
   *        }
   *      ]);
   */
  _viewBind: function(name, selector, callback) {
    if (!this.modelBinder) this.modelBinder = new this._modelBinder();
    var obj = {};
    obj[name] = [
      { selector: selector, converter: callback }
    ];
    this.modelBinder.bind(this.model, this.el, obj);
  },
  /**
   * 视图重新渲染
   *
   * @method [渲染] - _viewReplace
   * @param selector
   * @param model
   * @author wyj 15.7.21
   * @example
   *      this._viewReplace('#model-name', this.model);
   */
  _viewReplace: function(selector, model, callback) {
    debug('_viewReplace selector: ' + selector); //debug__
    Est.each(selector.split(','), Est.proxy(function(item) {
      var list = [];
      if (!Est.isEmpty(item)) {
        list = item.split(':');
        if (list.length > 1) {
          this['h_temp_' + Est.hash(item)] = this['h_temp_' + Est.hash(item)] ||
            Handlebars.compile($(this.$template).find(list[0]).attr(list[1]));
          this.$(list[0]).attr(list[1], this['h_temp_' + Est.hash(item)](model.toJSON()));
        } else {
          this['h_temp_' + Est.hash(item)] = this['h_temp_' + Est.hash(item)] ||
            Handlebars.compile($(this.$template).find(selector).wrapAll('<div>').parent().html());
          this.$(item).replaceWith(this['h_temp_' + Est.hash(item)](model.toJSON()));
        }
      }
    }, this));
    if (callback) callback.call(this, model);
  },
  /**
   * 双向绑定
   * @method [绑定] - _watch
   * @param name
   * @param selector
   * @param callback
   * @author wyj 15.7.20
   * @example
   *      <input id="model-link" data-bind-type="keyup" type="text"  value="{{link}}"> // data-bind-type="keydown" 绑定方式，默认为change
   *      this._watch(['#model-name'], '#model-name,.model-name', function(){
   *
   *      });
   */
  _watch: function(name, selector, callback) {
    var _self = this,
      modelId,
      temp_obj = {},
      list = [];

    if (Est.typeOf(name) === 'array') list = name;
    else list.push(name);
    Est.each(list, function(item) {
      modelId = item.replace(/^#model\d?-(.+)$/g, "$1");
      if (!_self._options.modelBind) _self._modelBind(item);
      if (modelId in temp_obj) return;
      Est.off(temp_obj[modelId] = modelId).on(modelId, function() {
        _self._viewReplace(selector, _self.model, callback);
      });
      _self.model.on('change:' + (temp_obj[modelId] = modelId.split('.')[0]), function() {
        //if (Est.typeOf(window._singleBindId) === 'undefined' || item === '#' + window._singleBindId)
        _self._viewReplace(selector, _self.model, callback);
      });
    });
  },
  /**
   * 字段序列化成字符串
   *
   * @method [模型] - _stringifyJSON ( 字段序列化成字符串 )
   * @param array
   * @author wyj 15.1.29
   * @example
   *      this._stringify(['invite', 'message']);
   */
  _stringifyJSON: function(array) {
    var keys, result;
    if (!JSON.stringify) alert(CONST.LANG.JSON_TIP);
    Est.each(array, function(item) {
      keys = item.split('.');
      if (keys.length > 1) {
        result = Est.getValue(this.model.toJSON(), item);
        Est.setValue(this.model.attributes, item, JSON.stringify(result));
      } else {
        Est.setValue(this.model.attributes, item, JSON.stringify(this.model.get(item)));
      }
    }, this);
  },
  /**
   * 反序列化字符串
   *
   * @method [模型] - _parseJSON ( 反序列化字符串 )
   * @param array
   */
  _parseJSON: function(array) {
    var keys, result;
    var parse = JSON.parse || $.parseJSON;
    if (!parse) alert(CONST.LANG.JSON_TIP);
    Est.each(array, function(item) {
      keys = item.split('.');
      if (keys.length > 1) {
        result = Est.getValue(this.model.toJSON(), item);
        if (Est.typeOf(result) === 'string') {
          Est.setValue(this.model.toJSON(), item, parse(result));
        }
      } else {
        if (Est.typeOf(this.model.get(item)) === 'string') {
          this.model.set(item, parse(this.model.get(item)));
        }
      }
    }, this);
  },
  /**
   * 设置参数
   *
   * @method [参数] - _setOption ( 设置参数 )
   * @param obj
   * @return {BaseList}
   * @author wyj 14.12.12
   * @example
   *      app.getView('categoryList')._setOption({
   *          sortField: 'orderList'
   *      })._moveUp(this.model);
   */
  _setOption: function(obj) {
    Est.extend(this._options, obj);
    return this;
  },
  /**
   * 回车事件
   *
   * @method [private] - _initEnterEvent
   * @private
   * @author wyj 14.12.10
   */
  _initEnterEvent: function(options) {
    if (options.speed > 1 && options.enterRender) {
      this.$('input').keyup($.proxy(function(e) {
        if (e.keyCode === CONST.ENTER_KEY) {
          this.$(options.enterRender).click();
        }
      }, this));
    }
  },
  /**
   * 获取配置参数
   *
   * @method [参数] - _getOption ( 获取配置参数 )
   * @param name
   * @return {*}
   * @author wyj 15.1.29
   */
  _getOption: function(name) {
    return this._options[name];
  },
  /**
   * 获取model值
   *
   * @method [模型] - _getValue ( 获取model值 )
   * @param path
   * @author wyj 15.1.30
   * @example
   *      this._getValue('tip.name');
   */
  _getValue: function(path) {
    return Est.getValue(this.model.attributes, path);
  },
  /**
   * 设置model值
   *
   * @method [模型] - _setValue ( 设置model值 )
   * @param path
   * @param val
   * @author wyj 15.1.30
   * @example
   *      this._setValue('tip.name', 'aaa');
   */
  _setValue: function(path, val) {
    // just for trigger
    Est.setValue(this.model.attributes, path, val);
    Est.trigger(path);
    //this.model.trigger('change:' + path.split('.')[0]);
  },
  /**
   * 绑定单个字段进行重渲染
   *
   * @method [模型] - _bind ( 绑定单个字段进行重渲染 )
   * @param array
   * @author wyj 15.2.2
   * @example
   *      this._bind('name', []);
   */
  _bind: function(modelId, array) {
    this.model.on('change:' + modelId, function() {
      Est.each(array, function(item) {
        var $parent = this.$(item).parent();
        var compile = Handlebars.compile($parent.html());
        $parent.html(compile(this));
      }, this);
    });
  },
  /**
   * 获取点击事件源对象
   * @method [事件] - _getTarget
   * @param e
   * @return {*|jQuery|HTMLElement}
   *  @example
   *      this._getTarget(e);
   */
  _getTarget: function(e) {
    return e.target ? $(e.target) : $(e.currentTarget);
  },
  /**
   * 获取绑定事件源对象
   * @method [事件] - _getEventTarget
   * @param e
   * @return {*|jQuery|HTMLElement}
   *  @example
   *      this._getEventTarget(e);
   */
  _getEventTarget: function(e) {
    return e.currentTarget ? $(e.currentTarget) : $(e.target);
  },
  /**
   * 单次执行
   * @method [事件] - _one
   * @param callback
   * @author wyj 15.6.14
   * @example
   *      this._one(['AwardList'], function (AwardList) {
   *          app.addPanel('main', {
   *          el: '#Award',
   *          template: '<div class="leaflet-award"></div>'
   *      }).addView('awardList', new AwardList({
   *          el: '.leaflet-award',
   *          viewId: 'awardList'
   *      }));
   *  });
   */
  _one: function(name, callback) {
    try {
      var _name, isArray = Est.typeOf(name) === 'array';
      var _nameList = [];
      var _one = null;
      _name = isArray ? name.join('_') : name;
      _one = '_one_' + _name;
      this[_one] = Est.typeOf(this[_one]) === 'undefined' ? true : false;
      if (this[_one]) {
        if (isArray) {
          Est.each(name, function(item) {
            _nameList.push(item.replace(/^(.+)-(\d+)?$/g, "$1"));
          });
          this._require(_nameList, callback);
        } else if (callback) {
          callback.call(this);
        }
      }
    } catch (e) {
      debug('SuperView._one ' + JSON.stringify(name), { type: 'alert' }); //debug__
    }
  },
  /**
   * 异步加载
   * @method [加载] - _require
   * @param dependent
   * @param callback
   * @author wyj 15.6.14
   * @example
   *        this._require(['Module'], function(Module){
   *            new Module();
   *        });
   */
  _require: function(dependent, callback) {
    seajs.use(dependent, Est.proxy(callback, this));
  },
  /**
   * 延迟执行
   * @method [加载] - _delay
   *
   * @param time
   * @author wyj 15.12.3
   * @example
   *  this._delay(function(){}, 5000);
   */
  _delay: function(fn, time) {
    setTimeout(Est.proxy(function() {
      setTimeout(Est.proxy(function() {
        if (fn) fn.call(this);
      }, this), time);
    }, this), 0);
  },
  /**
   * title提示
   * @method [提示] - _initToolTip ( title提示 )
   * @author wyj 15.9.5
   * @example
   *      <div class="tool-tip" title="提示内容">content</div>
   *      this._initToolTip();
   */
  _initToolTip: function($parent, className) {
    var _className = className || '.tool-tip';
    var $tip = $parent ? $(_className, $parent) : this.$(_className);
    $tip.hover(function(e) {
      var title = $(this).attr('data-title') || $(this).attr('title');
      var offset = $(this).attr('data-offset') || 0;
      if (Est.isEmpty(title)) return;
      BaseUtils.dialog({
        id: Est.hash(title || 'error:446'),
        title: null,
        width: 'auto',
        offset: parseInt(offset, 10),
        skin: 'tool-tip-dialog',
        align: $(this).attr('data-align') || 'top',
        content: '<div style="padding: 5px 6px;;font-size: 12px;">' + title + '</div>',
        hideCloseBtn: true,
        autofocus: false,
        target: $(this).get(0)
      });
      if (!app.getData('toolTipList')) app.addData('toolTipList', []);
      app.getData('toolTipList').push(Est.hash(title));

      $(window).one('click', Est.proxy(function() {
        Est.each(app.getData('toolTipList'), function(item) {
          app.getDialog(item).close();
        });
        app.addData('toolTipList', []);
      }, this));
    }, function() {
      try {
        app.getDialog(Est.hash($(this).attr('data-title') || $(this).attr('title'))).close();
      } catch (e) {}
    });
  },
  render: function() {
    this._render();
  }
});
