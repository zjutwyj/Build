/**
 * @description 单视图
 *
 *  - el: 目标元素Id 如 "#jhw-main"
 *  - tagName: 'tr',
 *  - className: 'bui-grid-row',
 *  - events: {
 *     'click .btn-del': '_del', // 删除
       'click .btn-move-up': '_moveUp', // 上移
       'click .btn-move-down': '_moveDown', // 下移
       'click .btn-toggle': '_toggleChecked',// 全选按钮
       'change .input-sort': '_saveSort', // 保存sort字段
       'click .btn-more': '_more', // 更多
 *  }，
 *  - initialize: function(){this._render()}
 *  - render: function(){this._render()}
 *
 * @class BaseItem - 单视图
 * @author yongjin<zjut_wyj@163.com> 2014/12/8
 */

var BaseItem = SuperView.extend({
  /**
   * 初始化, 若该视图的子元素有hover选择符， 则自动为其添加鼠标经过显示隐藏事件
   *
   * @method [初始化] - _initialize ( 初始化 )
   * @param {Object} options [template: 模板字符串]
   * @author wyj 14.11.16
   * @example
   *        this._initialize({
       *            template: itemTemp, // 模板字符串
       *            // 可选
       *            modelBind: false, // 绑定模型类， 比如文本框内容改变， 模型类相应改变; 当元素为checkbox是， 需设置true-value="01" false-value="00",
       *            若不设置默认为true/false
       *            detail: '#/product', // 详细页面路由  如果不是以dialog形式弹出时 ， 此项不能少 , 且开头为“#/”  需配置路由如： app.addRoute('product/:id', function (id) {
                            productDetail(Est.decodeId(id, 'Product_', 32));
                            }); 如果需要弹出对话框， 则route为具体的详细页模块 如：ProductDetail
                    encodeUrl: false, // 是否缩减url    如： #/product/Product_000000000000000000099 =>> #/product/99  路由中需解码：Est.decodeId(id, 'Product_', 32)
       *            filter: function(model){ // 过滤模型类
       *            },
       *            beforeRender: function(model){},
       *            afterRender: function(model){},
       *            enterRender: '#submit' // 执行回车后的按钮点击的元素选择符
       *        });
   */
  _initialize: function(options) {
    this._initOptions(options);
    this._initCollapse(this.model.get('_options'));
    this._initTemplate(this._options);
    this._initBind(this._options);
    this._initView(this._options);
    this._initStyle(this._options);
    this._initEnterEvent(this._options);
  },
  /**
   * 初始化参数
   *
   * @method [private] - _initOptions
   * @private
   * @author wyj 15.1.12
   */
  _initOptions: function(options) {
    this._options = Est.extend(this.options, options || {});
    this._options.speed = this._options.speed || 9;
  },
  /**
   * 初始化展开收缩
   *
   * @method [private] - _initCollapse
   * @param options
   * @private
   * @author wyj 15.2.14
   */
  _initCollapse: function(options) {
    if (options._speed > 1) {
      this.model.stopCollapse = false;
      this.collapsed = options ? options._extend : false;
    }
  },
  /**
   * 初始化模板， 若传递一个Template模板字符中进来， 则渲染页面
   *
   * @method [private] - _initTemplate
   * @private
   * @author wyj 15.1.12
   */
  _initTemplate: function(options) {
    options.template = options.template || options.itemTemp;
    if (options.template) {
      this.$template = '<div>' + options.template + '</div>';
      if (options.viewId) {
        if (!app.getCompileTemp(options.viewId))
          app.addCompileTemp(options.viewId, Handlebars.compile(options.template));
      } else {
        this.template = Handlebars.compile(options.template);
      }
    }
  },
  /**
   * 绑定事件， 如添加事件， 重置事件
   *
   * @method [private] - _initBind
   * @private
   * @author wyj 14.11.16
   */
  _initBind: function(options) {
    if (options.speed > 1) {
      this.model.bind('reset', this.render, this);
      this.model.bind('change', this.render, this);
      this.model.bind('destroy', this.remove, this);
    }
  },
  /**
   * 初始化视图
   *
   * @method [private] - _initView
   * @param options
   * @private
   * @author wyj 15.2.14
   */
  _initView: function(options) {
    if (options.speed > 1) {
      if (this.model.view) this.model.view.remove();
      this.model.view = this;
    }
  },
  /**
   * 初始化样式
   *
   * @method [private] - _initStyle
   * @private
   * @author wyj 15.2.14
   */
  _initStyle: function(options) {
    if (options.speed > 1) {
      var item_id = this.model.get('id') ? (this.model.get('id') + '') : (this.model.get('dx') + 1 + '');
      if (this.model.get('dx') % 2 === 0) this.$el.addClass('bui-grid-row-even');
      this.$el.addClass('_item_el_' + (this._options.viewId || '') + '_' + item_id.replace(/^[^1-9]+/, ""));
      this.$el.hover(function() {
        $(this).addClass('hover');
      }, function() {
        $(this).removeClass('hover');
      });
    }
  },
  /**
   * 渲染
   *
   * @method [渲染] - _render ( 渲染 )
   * @return {BaseCollection}
   * @author wyj 14.11.18
   */
  _render: function() {
    debug('10.BaseItem._render'); //debug__
    this._onBeforeRender();
    if (this._options && this._options.filter)
      this._options.filter.call(this, this.model);
    //TODO 添加判断是否存在this.$el debug
    //debug('BaseItem里的this.$el为空， 检查document中是否存在， 或设置传入的options.el为jquery对象(有时是DOM片段)', {type: 'error'});
    this.$el.html(this.template ? this.template(this.model.attributes) :
      this._options.viewId && app.getCompileTemp(this._options.viewId) && app.getCompileTemp(this._options.viewId)(this.model.attributes));
    if (this._options.modelBind) this._modelBind();
    //TODO 判断是否存在子元素
    var modelOptions = this.model.get('_options');
    if (modelOptions && modelOptions._subRender && this.model.get('children') &&

      this.model.get('children').length > 0) {
      // Build child views, insert and render each
      var ctx = this;
      var childView = null;
      var level = this.model.get('level') || 1;

      var tree = this.$(modelOptions._subRender + ':first');
      this._setupEvents(modelOptions);

      Est.each(this.model._getChildren(modelOptions._collection), function(newmodel) {
        var childView = null;

        /*if (modelOptions._items) {
          newmodel = new modelOptions._model(newmodel);
        }*/
        debug(function() {
          if (Est.isEmpty(newmodel)) {
            return 'Error20';
          }
        }, {
          type: 'error'
        }); //debug__
        newmodel.set('_options', modelOptions);
        newmodel.set('level', level + 1);

        childView = new modelOptions._item({
          model: newmodel,
          data: ctx._options._data
        });
        childView._setInitModel(ctx.initModel);
        childView._setViewId(ctx._options.viewId);
        //TODO 解决子类下的移序问题
        newmodel.view = childView;

        tree.append(childView.$el);
        if (ctx._options.views) {
          ctx._options.views.push(childView);
        }
        childView._render();
      });
      /* Apply some extra styling to views with children */
      if (childView) {
        // Add bootstrap plus/minus icon
        //this.$('> .node-collapse').prepend($('<i class="icon-plus"/>'));
        // Fixup css on last item to improve look of tree
        //childView.$el.addClass('last-item').before($('<li/>').addClass('dummy-item'));
      }
    }
    this._onAfterRender();
    return this;
  },
  /**
   * 设置viewId
   *
   * @method [参数] - _setViewId ( 设置viewId )
   * @param name
   * @private
   * @author wyj 14.12.20
   */
  _setViewId: function(name) {
    if (this._options) this._options.viewId = name;
  },
  /**
   * 设置模型类
   *
   * @method [private] - _setInitModel
   * @private
   * @param model
   * @author wyj 14.11.20
   */
  _setInitModel: function(model) {
    this.initModel = model;
  },
  /**
   * 绑定展开收缩事件
   *
   * @method [private] - _setupEvents
   * @private
   * @author wyj 14.12.9
   */
  _setupEvents: function(opts) {
    // Hack to get around event delegation not supporting ">" selector
    var that = this;
    that._toggleCollapse.call(this, opts);
    this.$(opts._collapse + ':first').click(function() {
      that._toggleCollapse.call(that, opts);
    });
  },
  /**
   * 展开收缩
   *
   * @method [private] - _toggleCollapse
   * @private
   * @author wyj 14.12.9
   */
  _toggleCollapse: function(opts) {
    var ctx = this;
    if (this.model.stopCollapse) {
      this.$(opts._subRender + ':first').addClass('hide');
      return;
    }
    ctx.collapsed = !ctx.collapsed;

    if (ctx.collapsed) {
      this.$(opts._collapse + ':first').removeClass('x-caret-down');
      this.$(opts._subRender + ':first').slideUp(CONST.COLLAPSE_SPEED).addClass('hide');
    } else {
      this.$(opts._collapse + ':first').addClass('x-caret-down');
      this.$(opts._subRender + ':first').slideDown(CONST.COLLAPSE_SPEED).removeClass('hide');
    }
  },
  /**
   * 渲染前事件
   *
   * @method [private] - _onBeforeRender
   * @private
   * @author wyj 14.12.3
   */
  _onBeforeRender: function() {
    if (this.init && Est.typeOf(this.init) === 'function') this.init.call(this);
    if (this.beforeRender) this.beforeRender.call(this, this.model);
  },
  /**
   * 渲染后事件
   *
   * @method [private] - _onAfterRender
   * @private
   * @author wyj 14.12.3
   */
  _onAfterRender: function() {
    if (this._options.toolTip) this._initToolTip();
    if (this.afterRender) this.afterRender.call(this, this.model);
    if (this.watch) this.watch.call(this);
  },
  /**
   * 移除监听
   *
   * @method [private] - _close
   * @private
   * @author wyj 14.11.16
   */
  _close: function() {
    debug('BaseItem._close'); //debug__
    this.stopListening();
  },
  /**
   * 移除此模型
   *
   * @method [private] - _clear
   * @private
   * @author wyj 14.11.16
   */
  _clear: function() {
    debug('ProductItem._clear'); //debug__
    this.model.destroy();
  },
  /**
   * checkbox选择框转换
   *
   * @method [选取] - _toggleChecked ( checkbox选择框转换 )
   * @author wyj 14.11.16
   * @example
   *      itemClick: function(e){
   *        e.stopImmediatePropagation();
   *        this.loadPhoto();
   *        this._toggleChecked(e);
   *      }
   */
  _toggleChecked: function(e) {
    var checked = this.model.get('checked');
    var beginDx = null;
    var endDx = null;
    var dx = null;

    this._checkAppend = typeof this.model.get('_options')._checkAppend === 'undefined' ? false :
      this.model.get('_options')._checkAppend;
    this._checkToggle = typeof this.model.get('_options')._checkToggle === 'undefined' ? false :
      this.model.get('_options')._checkToggle;

    // 单选， 清除选中项
    if (!this._checkAppend) {
      if (this._options.viewId) {
        if (app.getView(this._options.viewId))
          app.getView(this._options.viewId)._clearChecked();
      } else {
        debug('Error21', {
          type: 'error'
        }); //debug__
      }
    }

    if (this._checkToggle) {
      this.model.attributes.checked = Est.typeOf(e) === 'boolean' ? e : !checked;
    } else {
      this.model.attributes.checked = Est.typeOf(e) === 'boolean' ? e : true;
      this._itemActive({
        add: this._checkAppend
      });
    }
    if (this.model.get('checked') && this._checkToggle) {
      this._itemActive({
        add: this._checkAppend
      });
    } else if (this._checkToggle) {
      this.$el.removeClass('item-active');
      this.model.set('checked', false);
    }
    //TODO shift + 多选
    if (e && e.shiftKey && this._checkAppend) {
      beginDx = app.getData('curChecked');
      endDx = this.model.get('dx');
      Est.each(this.model.collection.models, function(model) {
        dx = model.get('dx');
        if (beginDx < dx && dx < endDx) {
          model.attributes.checked = true;
          model.view.$el.addClass('item-active');
        }
      });
    } else {
      app.addData('curChecked', this.model.get('dx'));
    }
    if (Est.typeOf(e) !== 'boolean' && e)
      e.stopImmediatePropagation();
  },
  /**
   * 添加当前ITEM的CLASS为item-active
   *
   * @method [选取] - _itemActive ( 设置为选中状态 )
   * @param options [add: true 是否为添加模式]
   * @author wyj 14.12.13
   * @example
   *        this._itemActive({
   *          add: true         //是否为添加模式
   *        });
   */
  _itemActive: function(options) {
    options = options || {};
    if (!app.getData('itemActiveList' + this._options.viewId))
      app.addData('itemActiveList' + this._options.viewId, []);
    var list = app.getData('itemActiveList' + this._options.viewId);
    if (!options.add) {
      debug('BaseItem._itemActive'); //debug__
      Est.each(list, Est.proxy(function(selecter) {
        var node = $('.' + selecter, app.getView(this._options.viewId) ?
          app.getView(this._options.viewId).$el : $("body"));
        //TODO 当为单选时
        //node.find('.toggle:first').click();
        node.removeClass('item-active');
        //node.find('.toggle').click();
      }, this));
      list.length = 0;
    }
    this.$el.addClass('item-active');

    list.push(this.$el.attr('class').replace(/^.*(_item_el_.+?)\s+.*$/g, "$1"));
  },
  /**
   * 上移
   *
   * @method [移动] - _moveUp ( 上移 )
   * @param e
   * @author wyj 14.12.14
   */
  _moveUp: function(e) {
    e.stopImmediatePropagation();
    this.collapsed = true;
    if (!this._options.viewId) {
      debug('Error22', {
        type: 'error'
      }); //debug__
      return false;
    }
    app.getView(this._options.viewId)._moveUp(this.model);
  },
  /**
   * 下移
   *
   * @method [移动] - _moveDown ( 下移 )
   * @param e
   * @author wyj 14.12.14
   */
  _moveDown: function(e) {
    e.stopImmediatePropagation();
    this.collapsed = true;
    if (!this._options.viewId) {
      debug('Error23', {
        type: 'error'
      }); //debug__
      return false;
    }
    app.getView(this._options.viewId)._moveDown(this.model);
  },
  /**
   * 保存sort排序
   *
   * @method [保存] - _saveSort ( 保存sort排序 )
   * @author wyj 14.12.14
   */
  _saveSort: function() {
    var ctx = this;
    var sort = this.$('.input-sort').val();
    this.model._saveField({
      id: this.model.get('id'),
      sort: sort
    }, ctx, {
      success: function() {
        ctx.model.set('sort', sort);
      },
      hideTip: true
    });
  },
  /**
   * 获取当前列表第几页
   *
   * @method [分页] - _getPage ( 获取当前列表第几页 )
   * @return {*}
   * @author wyj 14.12.31
   *
   */
  _getPage: function() {
    var paginationModel = this.model.collection.paginationModel;
    if (!paginationModel) return 1;
    return paginationModel.get('page');
  },
  /**
   * 单个字段保存
   *
   * @method [修改] - _editField ( 单个字段保存 )
   * @param options [title: 标题][field: 字段名][target: 选择符(对话框指向于哪个元素)]
   * @return {ln.promise}
   * @author wyj 14.11.16
   * @example
   *        this._editField({
   *          title: '修改相册名称',
   *          field: 'name',
   *          target: '.album-name'
   *        });
   */
  _editField: function(options) {
    var ctx = this;
    var $q = Est.promise;
    if (app.getData('editFieldDialog'))
      app.getData('editFieldDialog').close();
    return new $q(function(resolve, reject) {
      //context.model.fetch();
      seajs.use(['dialog-plus'], function(dialog) {
        var oldName = ctx.model.attributes[options.field];
        var d = dialog({
          title: options.title || CONST.LANG.EDIT,
          content: '<div style="padding: 20px;"><input id="property-returnValue-demo" type="text" class="text" value="' + (oldName || '') + '" /></div>',
          button: [{
            value: CONST.LANG.CONFIRM,
            autofocus: true,
            callback: function() {
              var value = $('#property-returnValue-demo').val();
              this.close(value);
              this.remove();
            }
          }]
        });
        d.addEventListener('close', function() {
          var obj = {};
          var val = ctx.model.previous(options.field);
          if (this.returnValue.length >= 1 && this.returnValue !== val) {
            obj.id = ctx.model.get('id');
            obj[options.field] = this.returnValue;
            ctx.model._saveField(obj, ctx, {
              success: function(keyValue, result) {
                ctx.model.set(keyValue);
              }
            });
            resolve(ctx, this.returnValue);
          }
        });
        d.show(ctx.$(options.target || 'div').get(0));
        app.addData('editFieldDialog', d);
      });
    });
  },
  /**
   *  删除模型类
   *
   *  @method [删除] - _del ( 删除模型类 )
   *  @author wyj 14.11.16
   */
  _del: function(e, callback) {
    if (e)
      e.stopImmediatePropagation();
    debug('1.BaseItem._del'); //debug__
    var context = this;
    if (app.getData('delItemDialog')) app.getData('delItemDialog').close();
    if (context.model.get('children').length > 0) {
      BaseUtils.confirm({
        title: CONST.LANG.TIP,
        width: 300,
        content: CONST.LANG.DEL_TIP
      });
      return;
    }
    app.addData('delItemDialog', BaseUtils.confirm({
      title: CONST.LANG.WARM_TIP,
      content: '<div class="item-delete-confirm">' + CONST.LANG.DEL_CONFIRM + '</div>',
      target: e && this._getTarget(e).get(0),
      success: function(resp) {
        if (Est.isEmpty(context.model.url())) {
          context.model.attributes.id = null;
        }
        context.model.destroy({
          wait: true,
          error: function(model, resp) {
            var buttons = [];
            buttons.push({
              value: CONST.LANG.CONFIRM,
              callback: function() {
                this.close();
              },
              autofocus: true
            });
            BaseUtils.dialog({
              title: CONST.LANG.TIP + '：',
              content: resp.msg,
              width: 250,
              button: buttons
            });
          },
          success: function() {
            context._removeFromItems(context.model.get('dx'));
            if (callback) callback.call(context);
          }
        });
      }
    }));
  },
  /**
   * 从this._options.items中通过dx移除元素
   * @method [集合] - _removeFromItems
   * @param dx
   * @private
   * @author wyj 15.6.10
   * @example
   *      this._removeFromItems(context.model.get('dx'));
   */
  _removeFromItems: function(dx) {
    if (Est.typeOf(dx) === 'undefined') return;
    if (app.getView(this._options.viewId)) {
      if (app.getView(this._options.viewId)._options.items)
        app.getView(this._options.viewId)._options.items.splice(dx, 1);
      app.getView(this._options.viewId)._resetDx();
    }
  }
});
