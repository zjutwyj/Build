/**
 * @description 列表视图
 * @class BaseList - 列表视图
 * @author yongjin<zjut_wyj@163.com> 2014/12/8
 */


var BaseList = SuperView.extend({
  /**
   * 传递options进来
   *
   * @method [private] - constructor
   * @private
   * @param options
   * @author wyj 14.12.16
   */
  /*constructor: function (options) {
   Est.interface.implements(this, new Est.interface('BaseList', ['initialize', 'render']));
   this.constructor.__super__.constructor.apply(this, arguments);
   },*/
  /**
   * 初始化
   *
   * @method [初始化] - _initialize ( 初始化 )
   * @param options
   * @author wyj 14.11.20
   * @example
   *      this._initialize({
       *        model: ProductModel, // 模型类,
       *        collection:  ProductCollection,// 集合,
       *        item: ProductItem, // 单视图
       *        // 以下为可选
       *        template: listTemp, 字符串模板,
       *        render: '.product-list', 插入列表的容器选择符, 若为空则默认插入到$el中
       *        items: [], // 数据不是以url的形式获取时 (可选), items可为function形式传递;
       *        data: {}, // 附加的数据 BaseList、BaseView[js: this._options.data & template: {{name}}] ;
       *                     BaseItem中为[this._options.data &{{_options._data.name}}] BaseCollecton为this._options.data BaseModel为this.get('_data')
       *        append: false, // 是否是追加内容， 默认为替换
       *        checkAppend: false, // 鼠标点击checkbox， checkbox是否追加  需在BaseItem事件中添加 'click .toggle': '_toggleChecked',
       *        checkToggle: true,// 是否选中切换
       *        enterRender: (可选) 执行回车后的按钮点击的元素选择符 如 #submit .btn-search
       *        pagination: true/selector, // 是否显示分页 view视图中相应加入<div id="pagination-container"></div>; pagination可为元素选择符
       *        page: parseInt(Est.cookie('orderList_page')) || 1, //设置起始页 所有的分页数据都会保存到cookie中， 以viewId + '_page'格式存储， 注意cookie取的是字符串， 要转化成int
       *        pageSize: parseInt(Est.cookie('orderList_pageSize')) || 16, // 设置每页显示个数
       *        max: 5, // 限制显示个数
       *        sortField: 'sort', // 上移下移字段名称， 默认为sort
       *        itemId: 'Category_00000000000123', // 当需要根据某个ID查找列表时， 启用此参数， 方便
       *        filter: [ {key: 'name', value: this.searchKey }] // 过滤结果
       *        toolTip: true, // 是否显示title提示框   html代码： <div class="tool-tip" title="提示内容">内容</div>
       *        clearDialog: true, // 清除所有的对话框， 默认为true
       *        beforeLoad: function(collection){ // collection载入列表前执行
       *            this.setCategoryId(options.categoryId); // collection载入后执行
       *          },
       *        afterLoad: function(){ // collection载入之后
       *            if (this.collection.models.length === 0 ||
                      !this.options._isAdd){
                      this.addOne();
                    }
       *        },
       *        beforeRender: function(thisOpts){}, // 渲染前回调
       *        afterRender: function(thisOpts){ // 渲染后回调， 包括items渲染完成
       *          if (this.collection.models.length === 0 ||
                      !this.options._isAdd){
                      this.addOne();
                    }
       *        },
       *        cache: true, // 数据缓存到内存中
       *        session: true, // 数据缓存到浏览器中，下次打开浏览器，请求的数据直接从浏览器缓存中读取
       *        // 以下为树型列表时 需要的参数
       *        subRender: '.node-tree', // 下级分类的容器选择符
       *        collapse: '.node-collapse' 展开/收缩元素选择符
       *        parentId: 'belongId', // 分类 的父类ID
       *        categoryId: 'categoryId', // 分类 的当前ID
       *        rootId: 'isroot', // 一级分类字段名称
       *        rootValue: '00' // 一级分类字段值  可为数组[null, 'Syscode_']   数组里的选项可为方法， 返回true与false
       *        extend: true // false收缩 true为展开
       *       });
   */
  _initialize: function(options) {
    debug('1.BaseList._initialize'); //debug__
    this.dx = 0;
    this.views = [];
    return this._init(options.collection, options);
  },
  /**
   * 初始化集合类
   *
   * @method [private] - _init
   * @private
   * @param collection 对应的collection集合类， 如ProductCollection
   * @param options [beforeLoad: 加载数据前执行] [item: 集合单个视图] [model: 模型类]
   * @author wyj 14.11.16
   */
  _init: function(collection, options) {

    this._initOptions(options);
    this._initDataModel(Backbone.Model.extend({}));
    this._initTemplate(this._options);
    this._initEnterEvent(this._options, this);
    this._initList(this._options);
    this._initCollection(this._options, collection);
    this._initItemView(this._options.item, this);
    this._initModel(this._options.model);
    this._initBind(this.collection);
    this._initPagination(this._options);
    this._load(this._options);
    this._finally();

    return this;
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
    this._options.sortField = 'sort';
    this._options.max = this._options.max || 99999;
    this._options.speed = this._options.speed || 9;
  },
  /**
   * 初始化模型类, 设置index索引
   *
   * @method [private] - _initDataModel
   * @private
   * @param model
   * @author wyj 14.11.20
   */
  _initDataModel: function(model) {
    if (this._options.data)
      this._options.data.CONST = CONST;
    this.model = new model(this._options.data);
  },
  /**
   * 初始化模板， 若传递一个Template模板字符中进来， 则渲染页面
   *
   * @method [private] - _initTemplate ( 待优化， 模板缓存 )
   * @private
   * @author wyj 15.1.12
   */
  _initTemplate: function(options) {
    this._data = options.data = options.data || {};
    if (options.template) {
      if (this.beforeRender) this.beforeRender.call(this);
      this.$template = $('<div>' + options.template + '</div>');
      if (this._options.render) {
        this._options.itemTemp = this.$template.find(this._options.render).html();
        this.$template.find(this._options.render).empty();
      } else {
        this._options.itemTemp = this.$template.html();
        this.$template.empty();
      }
      this.template = Handlebars.compile(Est.isEmpty(this._options.itemTemp) ? options.template :
        this.$template.html());
      if (this._options.append) {
        this.$el.empty();
        this.$el.append(this.template(this.model.attributes));
      } else {
        this.$el.html(this.template(this.model.attributes));
      }
    }
    if (this._options.modelBind) this._modelBind();
    return this._data;
  },
  /**
   * 回车事件
   *
   * @method [private] - _initEnterEvent
   * @private
   * @author wyj 14.12.10
   */
  _initEnterEvent: function(options, ctx) {
    if (options.enterRender) {
      ctx.$('input').keyup(function(e) {
        if (e.keyCode === CONST.ENTER_KEY) {
          ctx.$(options.enterRender).click();
        }
      });
    }
  },
  /**
   * 初始化列表视图容器
   *
   * @method [private] - _initList
   * @private
   * @author wyj 15.1.12
   */
  _initList: function(options) {
    var ctx = this;
    this.list = options.render ? this.$(options.render) : this.$el;
    if (this.list.size() === 0)
      this.list = $(options.render);

    debug(function() {
      if (!ctx.list || ctx.list.size() === 0) {
        return 'Error1';
      }
    }, {
      type: 'error'
    }); //debug__
    return this.list;
  },
  /**
   * 初始化collection集合
   *
   * @method [private] - _initCollection
   * @param collection
   * @private
   */
  _initCollection: function(options, collection) {
    debug(function() {
      if (!options.model) {
        return 'Error2';
      }
    }, {
      type: 'error'
    }); //debug__
    if (!this.collection || (this.collection && !this.collection.remove)) this.collection = new collection(options);
    if (options.itemId) this.collection._setItemId(options.itemId);
    //TODO 分类过滤
    if (options.subRender) this.composite = true;

    return this.collection;
  },
  /**
   * 初始化单个枚举视图
   *
   * @method [private] - _initItemView
   * @private
   * @param itemView
   * @author wyj 14.11.16
   */
  _initItemView: function(itemView) {
    this.item = itemView;
  },
  /**
   * 初始化模型类, 设置index索引
   *
   * @method [private] - _initModel
   * @private
   * @param model
   * @author wyj 14.11.20
   */
  _initModel: function(model) {
    this.initModel = model;
  },
  /**
   * 绑定事件， 如添加事件， 重置事件
   * @method [private] - _initBind
   * @private
   * @author wyj 14.11.16
   */
  _initBind: function(collection) {
    if (collection) {
      collection.bind('add', this._addOne, this);
      collection.bind('reset', this._render, this);
    }
  },
  /**
   * 初始化分页
   *
   * @method [private] - _initPagination
   * @param options
   * @private
   * @author wyj 14.11.17
   */
  _initPagination: function(options) {
    var ctx = this;
    if (ctx.collection && ctx.collection.paginationModel) {
      // 单一观察者模式， 监听reloadList事件
      ctx.collection.paginationModel.on('reloadList',
        function(model) {
          ctx._clear.call(ctx);
          ctx._load.call(ctx, options, model);
        });
    }
  },
  /**
   * 获取集合数据 当append为true时，只追加数据。
   * 类似有个_reload  这个方法无论append是否为true， 都会清空列表重新加载
   *
   * @method [渲染] - _load ( 获取集合数据 )
   * @param options [beforeLoad: 载入前方法][page: 当前页][pageSize: 每页显示条数]
   * @param model 分页模型类 或为全查必填
   * @author wyj 14.11.16
   * @example
   *        baseListCtx._load({
   *          page: 1,
   *          pageSize: 16,
   *          beforeLoad: function () {
   *            this.collection.setCategoryId(options.categoryId);
   *          },
   *          afterLoad: function(){
   *
   *          }
   *        }).then(function () {
   *          ctx.after();
   *        });
   */
  _load: function(options, model) {
    var ctx = this;
    options = options || this._options || {};
    this._beforeLoad(options);
    if (options.page || options.pageSize) {
      if (options.page)
        ctx.collection.paginationModel.set('page', options.page || 1);
      // 备份page
      options._page = options.page;
      if (options.pageSize)
        ctx.collection.paginationModel.set('pageSize', options.pageSize || 16);
      // 备份pageSize
      options._pageSize = options.pageSize;
      model = ctx.collection.paginationModel;
      //TODO 移除BaseList默认的page 与pageSize使每页显示条数生效
      options.page = options.pageSize = null;
    }
    //TODO 若存在items且有page与pageSize  处理静态分页
    if (this._options.items) {
      this._empty();
      this._initItems();
    }
    // page pageSize保存到cookie中
    if (this._options.viewId && ctx.collection.paginationModel &&
      ctx.collection.paginationModel.get('pageSize') < 999) {
      app.addCookie(this._options.viewId + '_page');
      Est.cookie(this._options.viewId + '_page', ctx.collection.paginationModel.get('page'));
      app.addCookie(this._options.viewId + '_pageSize');
      Est.cookie(this._options.viewId + '_pageSize', ctx.collection.paginationModel.get('pageSize'));
    }
    // 判断是否存在url
    if (ctx.collection.url && !this._options.items) {

      if (ctx._options.filter) ctx.filter = true;
      // 处理树结构
      if (ctx._options.subRender) {
        ctx.composite = true;
        ctx.collection.paginationModel.set('page', 1);
        ctx.collection.paginationModel.set('pageSize', 9000);
      }
      debug(function() {
        return ('[Query]' + (Est.typeOf(ctx.collection.url) === 'function' ? ctx.collection.url() :
          ctx.collection.url));
      }); //debug__
      // 数据载入
      ctx.collection._load(ctx.collection, ctx, model).
      done(function(result) {
        if (result && result.msg && result.msg === CONST.LANG.AUTH_FAILED) {
          Utils.tip(CONST.LANG.AUTH_LIMIT + '！', {
            time: 2000
          });
        }
        /*if (ctx.options.instance)
         app.addData(ctx.options.instance, result.models);*/
        ctx.list.find('.no-result').remove();
        try {
          if (Est.isEmpty(result) || Est.isEmpty(result.attributes) || result.attributes.data.length === 0) {
            ctx._options.append ? ctx.list.append('<div class="no-result">' + CONST.LANG.LOAD_ALL + '</div>') :
              ctx.list.append('<div class="no-result">' + CONST.LANG.NO_RESULT + '</div>');

            if (ctx.collection.paginationModel.get('page') === 1) Est.trigger('resultListNone' + ctx._options.viewId, {});
            if (result.msg === CONST.LANG.NOT_LOGIN) {
              Est.trigger('checkLogin');
            }
            debug(function() {
              return 'Warm3 list.length=0' + (Est.typeOf(ctx.collection.url) === 'function' ? ctx.collection.url() :
                ctx.collection.url);
            }); //debug__
          }
        } catch (e) {
          Est.trigger('checkLogin');
          debug('Error4 ' + result.msg); //debug__
        }
        if (ctx._options.subRender) ctx._filterRoot();
        if (ctx._options.filter) ctx._filterCollection();
        if (result.attributes && result.attributes.model) {
          ctx._options.data = Est.extend(ctx._options.data, result.attributes.model);
        }
        ctx._afterLoad(options);
      });
    } else {
      ctx._afterLoad(options);
    }
  },
  /**
   * 刷新列表 会清空已存在的数据
   *
   * @method [渲染] - _reload ( 刷新列表 )
   * @author wyj 15.1.24
   * @example
   *        this._reload();
   */
  _reload: function(options) {
    debug('BaseList_reload'); //debug__
    this._empty.call(this); // 清空视图
    this.collection.reset(); // 清空collection
    this.list.empty(); // 清空DOM
    this._load(options); // 重新加载数据
  },
  /**
   * 初始化完成后执行
   *
   * @method [private] - _finally
   * @private
   */
  _finally: function() {
    if (this.init && Est.typeOf(this.init) === 'function') this.init.call(this);
    if (this.afterRender) this.afterRender.call(this, this._options);
    if (this.watch) this.watch.call(this);
    if (this._options.toolTip) this._initToolTip();
    BaseUtils.removeLoading();
  },
  /**
   * 列表载入前执行
   *
   * @method [private] - _beforeLoad
   * @param options
   * @private
   */
  _beforeLoad: function(options) {
    if (this.beforeLoad)
      this.beforeLoad.call(this, this.collection);
  },
  /**
   * 列表载入后执行
   *
   * @method [private] - _afterLoad
   * @private
   */
  _afterLoad: function(options) {
    if (this.afterLoad)
      this.afterLoad.call(this, this.collection);
  },
  /**
   * 初始化items
   *
   * @method [private] - _initItems
   * @private
   * @author wyj 15.1.8
   */
  _initItems: function() {
    if (Est.typeOf(this._options.items) === 'function')
      this._options.items = this._options.items.apply(this, arguments);

    if (this._options.filter) {
      this.collection.push(this._options.items);
      this._filterCollection();
      this._options.items = Est.pluck(Est.cloneDeep(this.collection.models, function() {}, this), 'attributes');
    }
    if (this._options._page || this._options._pageSize) {
      this._renderListByPagination();
    } else if (!this.filter) {
      Est.each(this._options.items, function(item) {
        if (this._check()) return false;
        this.collection.push(new this.initModel(item));
        //this.collection._byId[item]
      }, this);
      if (this._options.subRender) this._filterRoot();
    }
  },
  /**
   * 缓存编译模板
   *
   * @method [private] - _setTemplate
   * @private
   * @author wyj 15.2.14
   */
  _setTemplate: function(compile) {
    this.compileTemp = compile;
  },
  /**
   * 获取编译模板
   *
   * @method [private] - _getTemplate
   * @private
   * @author wyj 15.2.14
   */
  _getTemplate: function() {
    return this.compileTemp;
  },
  /**
   * 停止遍历
   *
   * @method [渲染] - _stop ( 停止遍历 )
   * @author wyj 15.1.27
   * @example
   *        this._stop();
   */
  _stop: function() {
    this.stopIterator = true;
  },
  /**
   * 检查是否停止遍历
   *
   * @method [private] - _check
   * @private
   * @return {boolean}
   * @author wyj 15.1.27
   */
  _check: function() {
    if (this.stopIterator) {
      this.stopIterator = false;
      return true;
    }
    return false;
  },
  /**
   * 渲染视图
   *
   * @method [渲染] - _render ( 渲染视图 )
   * @author wyj 14.11.16
   * @example
   *
   */
  _render: function() {
    debug('BaseList._render'); //debug__
    this._addAll();
    this.trigger('after', this);
  },
  /**
   * 过滤父级元素
   *
   * @method [private] - _filterRoot
   * @private
   * @author wyj 14.12.9
   */
  _filterRoot: function() {
    var ctx = this;
    var temp = [];
    var roots = [];
    ctx.composite = false;
    /* ctx.collection.comparator = function (model) {
     return model.get('sort');
     }
     ctx.collection.sort();*/
    Est.each(ctx.collection.models, function(item) {
      debug(function() {
        if (Est.typeOf(item.attributes[ctx._options.categoryId]) === 'undefined') {
          return 'Error5 currentId = ' + ctx._options.categoryId + ';url=' + ctx.collection.url;
        }
        if (Est.typeOf(item.attributes[ctx._options.parentId]) === 'undefined') {
          return 'Error6 currentId=' + ctx._options.parentId + ';url=' + ctx.collection.url;
        }
      }, {
        type: 'error'
      }); //debug__
      temp.push({
        categoryId: item.attributes[ctx._options.categoryId],
        belongId: item.attributes[ctx._options.parentId]
      });
    });
    this.collection.each(function(thisModel) {
      var i = temp.length,
        _children = [];
      while (i > 0) {
        var item = temp[i - 1];
        if (item.belongId === thisModel.get(ctx._options.categoryId)) {
          _children.unshift(item.categoryId);
          temp.splice(i - 1, 1);
        }
        i--;
      }
      thisModel.set('children', _children);
      thisModel.set('id', thisModel.get(ctx._options.categoryId));
      // 添加父级元素

      if (Est.typeOf(ctx._options.rootValue) === 'array') {
        //TODO 如果存入的rootValue为数组
        Est.each(ctx._options.rootValue, Est.proxy(function(item) {
          if (Est.typeOf(item) === 'function') {
            // 判断是否是方法， 如果返回true则添加到roots中
            if (item.call(this, item)) {
              thisModel.set('level', 1);
              roots.push(thisModel);
            }
          } else {
            if (!Est.isEmpty(item) && thisModel.get(ctx._options.rootId) && thisModel.get(ctx._options.rootId).indexOf(item) > -1) {
              // 判断不为null 且索引是否大于-1
              thisModel.set('level', 1);
              roots.push(thisModel);
            } else if (thisModel.get(ctx._options.rootId) === item) {
              // 如果为null值， 则直接===比较， true则添加到roots中
              thisModel.set('level', 1);
              roots.push(thisModel);
            }
          }
        }, this));
      } else if (thisModel.get(ctx._options.rootId) === ctx._options.rootValue) {
        thisModel.set('level', 1);
        roots.push(thisModel);
      }
    });
    Est.each(roots, function(model) {
      ctx._addOne(model);
    });
  },
  /**
   * 向视图添加元素
   *
   * @method [private] - _addOne
   * @private
   * @param model
   * @author wyj 14.11.16
   */
  _addOne: function(model, arg1, arg2) {
    var ctx = this;
    if (!this.filter && !this.composite && this.dx < this._options.max) {
      model.set({
        'dx': this.dx++
      });
      switch (this._options.speed) {
        case 1:
          model.set('_options', {});
          break;
        case 9:
          model.set('_options', {
            _speed: this._options.speed,
            _item: ctx._options.item,
            _items: ctx._options.items ? true : false,
            _model: ctx._options.model,
            _collection: Est.isEmpty(ctx._options.subRender) ? null : ctx.collection,
            _subRender: ctx._options.subRender,
            _collapse: ctx._options.collapse,
            _extend: ctx._options.extend,
            _checkAppend: ctx._options.checkAppend,
            _checkToggle: ctx._options.checkToggle,
            _data: ctx.options.data || ctx._options.data
          });
      }
      //app.addData('maxSort', model.get('dx') + 1);
      var itemView = new this.item({
        model: model,
        viewId: this._options.viewId,
        speed: this._options.speed,
        data: this._data,
        views: this.views,
        itemTemp: this._options.itemTemp
      });
      itemView._setInitModel(this.initModel);
      //TODO 优先级 new对象里的viewId > _options > getCurrentView()
      itemView._setViewId(this._options.viewId || app.getCurrentView());

      if (arg2 && arg2.at < this.collection.models.length - 1 &&
        this.collection.models.length > 1) {
        this.collection.models[arg2.at === 0 ? 0 :
          arg2.at - 1].view.$el.after(itemView._render().el);
      } else {
        this.list.append(itemView._render().el);
      }
      this.views.push(itemView);
    }
  },
  /**
   * 向列表中添加数据
   * @method [集合] - _push ( 向列表中添加数据 )
   * @param model
   * @param opts
   * @author wyj 15.6.10
   * @example
   *        this._push(new model());
   *        this._push(new model(), 0); // 表示在第一个元素后面添加新元素
   *        this._push(new pictureModel(model), this._findIndex(curModel) + 1);
   */
  _push: function(model, index) {
    debug('BaseList._push'); //debug__
    // 判断第二个参数是否是数字， 否-> 取当前列表的最后一个元素的索引值
    // 判断index是否大于列表长度
    // 若存在items， 则相应插入元素
    var obj, _index = Est.typeOf(index) === 'number' ? index + 1 : this.collection.models.length === 0 ? 0 : this.collection.models.length + 1;
    var opts = {
      at: _index > this.collection.models.length ?
        this.collection.models.length + 2 : _index
    };
    if (this._options.items) {
      obj = Est.typeOf(model) === 'array' ? Est.pluck(model, function(item) {
        return item.attributes;
      }) : model.attributes;
      this._options.items.splice(opts.at - 1, 0, obj);
    }
    this.collection.push(model, opts);
    if (!Est.isEmpty(index)) {
      this._exchangeOrder(_index - 1, _index, {});
    }
    this._resetDx();
  },
  /**
   * 通过索引值获取当前视图的jquery对象
   * @method [集合] - _eq
   * @param  {number} index 索引值
   * @return {array}       [description]
   */
  _eq: function(index) {
    return this.collection.models[index].view.$el;
  },
  /**
   * 重新排序dx列表
   * @method [private] - _resetDx
   * @private
   * @author wyj 15.9.3
   */
  _resetDx: function() {
    debug('BaseList._resetDx'); //debug__
    var _dx = 0;
    Est.each(this.collection.models, function(item) {
      item.set('dx', _dx);
      _dx++;
    });
  },
  /**
   * 获取当前模型类在集合类中的索引值
   * @method [集合] - _findIndex ( 索引值 )
   * @param model
   * @return {number}
   * @author wyj 15.6.10
   * @example
   *      this._findIndex(this.curModel); ==> 1
   */
  _findIndex: function(model) {
    return Est.findIndex(this.collection.models, {
      cid: model.cid
    });
  },
  /**
   * 过滤集合
   *
   * @method [private] - _filterCollection
   * @private
   * @author wyj 15.1.10
   */
  _filterCollection: function() {
    debug('BaseList._filterCollection'); //debug__
    this._filter(this._options.filter, this._options);
  },
  /**
   * 静态分页
   *
   * @method [private] - _renderListByPagination
   * @private
   * @author wyj 15.1.8
   */
  _renderListByPagination: function() {
    debug('BaseList._renderListByPagination'); //debug__
    this.page = this.collection.paginationModel.get('page');
    this.pageSize = this.collection.paginationModel.get('pageSize');
    this.startIndex = (this.page - 1) * parseInt(this.pageSize, 10);
    this.endIndex = this.startIndex + parseInt(this.pageSize, 10);

    for (var i = this.startIndex; i < this.endIndex; i++) {
      this.collection.push(this._options.items[i]);
    }
    // 渲染分页
    this.collection.paginationModel.set('count', this._options.items.length);
    this.collection._paginationRender();
    return this.collection;
  },

  /**
   * 清空列表， 并移除所有绑定的事件
   *
   * @method [集合] - _empty ( 清空列表 )
   * @author wyj 14.11.16
   * @private
   * @example
   *      this._empty();
   */
  _empty: function() {
    this.dx = 0;
    debug('BaseList._empty'); //debug__
    if (this._options.append) {
      return this.collection;
    }
    if (this.collection && !this.collection.remove) {}
    if (this.collection._reset) this.collection._reset();
    if (this.collection) {
      var len = this.collection.length;
      while (len > -1) {
        this.collection.remove(this.collection[len]);
        len--;
      }
    }
    // 设置当前页的起始索引， 如每页显示20条，第2页为20
    if (this.collection.paginationModel) {
      this.dx = (this.collection.paginationModel.get('pageSize') || 16) *
        ((this.collection.paginationModel.get('page') - 1) || 0);
    }
    //遍历views数组，并对每个view调用Backbone的remove
    Est.each(this.views, function(view) {
      view.remove().off();
    });
    //清空views数组，此时旧的view就变成没有任何被引用的不可达对象了
    //垃圾回收器会回收它们
    this.views = [];
    //this.list.empty();
    return this.collection;
  },
  /**
   * 清空DOM列表
   *
   * @method [集合] - _clear ( 清空DOM列表 )
   * @author wyj 15.1.24
   * @private
   * @example
   *        this._clear();
   */
  _clear: function() {
    debug('BaseList._clear'); //debug__
    this._empty.call(this);
    this.list.empty();
    this.collection.models.length = 0;
  },
  /**
   * 添加所有元素， 相当于刷新视图
   *
   * @method [private] - _addAll
   * @private
   * @author wyj 14.11.16
   */
  _addAll: function() {
    debug('BaseList._addAll and call this._empty'); //debug__
    this._empty();
    this.collection.each(this._addOne, this);
  },
  /**
   * 搜索
   *
   * @method [搜索] - _search ( 搜索 )
   * @param options [onBeforeAdd: 自定义过滤]
   * @author wyj 14.12.8
   * @example
   *      this._search({
   *        filter: [
   *         {key: 'name', value: this.searchKey },
   *         {key: 'prodtype', value: this.searchProdtype} ,
   *         {key: 'category', value: this.searchCategory},
   *         {key: 'loginView', value: this.searchLoginView},
   *         {key: 'ads', value: this.searchAds}
   *         ],
   *        onBeforeAdd: function(item){
   *          // 自定义过滤， 即通过上面的filter后还需要经过这一层过滤
   *          // 若通过返回true
   *          return item.attributes[obj.key].indexOf(obj.value) !== -1;
   *       }});
   */
  _search: function(options) {
    debug('BaseList._search'); //debug__
    var ctx = this;
    this._clear();
    this.filter = true;
    options = Est.extend({
      onBeforeAdd: function() {}
    }, options);
    this._load({
      page: 1,
      pageSize: 5000,
      afterLoad: function() {
        ctx.filter = false;
        if (!ctx._options.items) {
          ctx._filter(options.filter || ctx._options.filter, options);
        } else {
          ctx._filterItems(options.filter || ctx._options.filter, options);
        }
      }
    });
  },
  /**
   * 过滤collection
   *
   * @method [private] - _filter
   * @param array
   * @param options
   * @private
   * @author wyj 14.12.8
   */
  _filter: function(array, options) {
    debug('BaseList._filter'); //debug__
    var ctx = this;
    var result = [];
    var len = ctx.collection.models.length;
    ctx.filter = false;
    while (len > 0) {
      if (this._check()) len = -1;

      var item = ctx.collection.models[len - 1];
      var pass = true;

      Est.each(array, function(obj) {
        var match = false;
        var keyval = Est.getValue(item.attributes, obj.key);

        if (Est.typeOf(obj.match) === 'regexp') {
          match = !obj.match.test(keyval);
        } else {
          match = Est.isEmpty(keyval) || (keyval.indexOf(obj.value) === -1);
        }
        if (pass && !Est.isEmpty(obj.value) && match) {
          ctx.collection.remove(item);
          pass = false;
          return false;
        }
      });
      if (pass && options.onBeforeAdd) {
        var _before_add_result = options.onBeforeAdd.call(this, item);
        if (Est.typeOf(_before_add_result) === 'boolean' && !_before_add_result) {
          pass = false;
        }
      }
      if (pass) {
        result.unshift(item);
      }
      len--;
    }
    Est.each(result, function(item) {
      item.set('_isSearch', true);
      ctx._addOne(item);
    });
  },
  /**
   * 过滤items
   *
   * @method [private] - _filterItems
   * @param array
   * @param options
   * @private
   * @author wyj 14.12.8
   */
  _filterItems: function(array, options) {
    debug('BaseList._filterItems'); //debug__
    var ctx = this;
    var result = [];
    var items = Est.cloneDeep(ctx._options.items);
    var len = items.length;
    ctx.filter = false;
    while (len > 0) {
      if (this._check()) break;
      var item = items[len - 1];
      var pass = true;
      Est.each(array, function(obj) {
        var match = false;
        var keyval = Est.getValue(item, obj.key);
        if (Est.typeOf(obj.match) === 'regexp') {
          match = !obj.match.test(keyval);
        } else {
          match = Est.isEmpty(keyval) || (keyval.indexOf(obj.value) === -1);
        }
        if (pass && !Est.isEmpty(obj.value) && match) {
          items.splice(len, 1);
          pass = false;
          return false;
        }
      });
      if (pass && options.onBeforeAdd) {
        var _before_add_result = options.onBeforeAdd.call(this, item);
        if (Est.typeOf(_before_add_result) === 'boolean' && !_before_add_result) {
          pass = false;
        }
      }
      if (pass) {
        result.unshift(item);
      }
      len--;
    }
    Est.each(result, function(item) {
      item = new ctx.initModel(item);
      item.set('_isSearch', true);
      ctx.collection.push(item);
      //ctx._addOne(item);
    });
  },
  /**
   * 弹出查看详细信息对话框
   *
   * @method [详细] - _detail ( 查看详细 )
   * @param options [title: 标题][width: 宽度][height: 高度][padding: 内补丁]
   *                [url: 地址][hideSaveBtn: 隐藏保存按钮][hideResetBtn: 隐藏重置按钮]
   *                [oniframeload: 页面载入后回调， 参数为window对象]
   * @author wyj 14.11.16
   * @example
   *      this._detail({
   *        title: '产品添加',
   *        url: CONST.HOST + '/modules/product/product_detail.html?time=' + new Date().getTime(),
   *        hideSaveBtn: true,
   *        hideResetBtn: true,
   *        end: '', // url 后附加内容 如： '$attId=' + attId
   *        load: function(win){
   *        }
   *      });
   */
  _detail: function(options) {
    debug('BaseList._detail'); //debug__
    options = options || {};
    if (options.end) {
      options.end = '?' + options.end + '&';
    } else {
      options.end = '';
    }
    var ctx = this;
    seajs.use(['dialog-plus'], function(dialog) {
      window.dialog = dialog;
      var buttons = [];
      if (!options.hideSaveBtn) {
        buttons.push({
          value: CONST.LANG.SAVE,
          callback: function() {
            this.title(CONST.SUBMIT_TIP);
            this.iframeNode.contentWindow.$("#submit").click();
            return false;
          },
          autofocus: true
        });
      }
      buttons.push({
        value: CONST.LANG.CLOSE
      });
      debug(function() {
        if (Est.isEmpty(ctx._options.detail) && Est.isEmpty(options.url)) {
          return 'Error7  url=' + (options.url || ctx._options.detail + options.end);
        }
      }, {
        type: 'error'
      }); //debug__
      window.detailDialog = dialog({
        id: 'detail-dialog',
        title: options.title || CONST.LANG.ADD,
        height: options.height || 'auto',
        width: options.width || 850,
        padding: options.padding || 0,
        url: options.url || ctx._options.detail + options.end,
        button: buttons,
        oniframeload: function() {
          this.iframeNode.contentWindow.topDialog = window.detailDialog;
          this.iframeNode.contentWindow.app = app;
          delete app.getRoutes().index;
          if (options.load) options.load.call(this, this.iframeNode.contentWindow);
          //this.iframeNode.contentWindow.maxSort = app.getData('maxSort');
        },
        onclose: function() {
          if (ctx._options.subRender) {
            ctx.composite = true;
          }
          ctx.collection._load(ctx.collection, ctx).
          then(function() {
            if (ctx._options.subRender) {
              ctx.composite = true;
              ctx._filterRoot();
            }
          });
          this.remove();
          window.detailDialog = null;
          if (this.returnValue) {
            $('#value').html(this.returnValue);
          }
        }
      });
      window.detailDialog.showModal();
    });
    return false;
  },
  /**
   * 全选checkbox选择框, 只能全选中， 不能全不选中
   *
   * @method [选取] - _checkAll ( 全选checkbox选择框 )
   * @author wyj 14.11.16
   */
  _checkAll: function(e) {
    debug('BaseList._toggleAllChecked'); //debug__
    var checked = this.___checkAll;
    if (Est.typeOf(e) === 'boolean') {
      checked = this.___checkAll = e;
    } else {
      var $check = this._getEventTarget(e);
      if ($check.is('checkbox')) {
        checked = $check.get(0).checked;
      } else {
        checked = this.___checkAll = !checked;
      }
    }
    this.collection.each(function(model) {
     model.view._toggleChecked(checked);
     model.view.render();
    });
  },
  /**
   * 保存sort值
   *
   * @method [保存] - _saveSort ( 保存sort值 )
   * @param model
   * @author wyj 14.12.4
   */
  _saveSort: function(model) {
    var sortOpt = {
      id: model.get('id')
    };
    sortOpt[this._options.sortField || 'sort'] = model.get(this._options.sortField);
    model._saveField(sortOpt, this, {
      async: false,
      hideTip: true
    });
  },
  /**
   * 插序 常用于sortable
   *
   * @method [移动] - _insertOrder
   * @param begin
   * @param end
   * @author wyj 15.9.26
   * @example
   *    this._insertOrder(1, 6);
   */
  _insertOrder: function(begin, end, callback) {
    if (begin < end) {
      end++;
    }
    Est.arrayInsert(this.collection.models, begin, end, {
      arrayExchange: Est.proxy(function(list, begin, end, opts) {
        this._exchangeOrder(begin, end, {
          path: this._options.sortField || 'sort',
          success: function(thisNode, nextNode) {
            if (thisNode.get('id') && nextNode.get('id')) {
              //this._saveSort(thisNode);
              //this._saveSort(nextNode);
              thisNode.stopCollapse = false;
              nextNode.stopCollapse = false;
            } else {
              debug('Error8'); //debug__
            }
          }
        });
      }, this),
      callback: function(list) {
        if (callback) callback.call(this, list);
      }
    });
    this._resetDx();
  },
  /**
   * 交换位置
   *
   * @method [private] - _exchangeOrder
   * @param original_index
   * @param new_index
   * @param options
   * @return {BaseList}
   * @private
   * @author wyj 14.12.5
   */
  _exchangeOrder: function(original_index, new_index, options) {
    var tempObj = {},
      nextObj = {};
    var temp = this.collection.at(original_index);
    var next = this.collection.at(new_index);

    // 互换dx
    if (temp.view && next.view) {
      var thisDx = temp.view.model.get('dx');
      var nextDx = next.view.model.get('dx');
      tempObj.dx = nextDx;
      nextObj.dx = thisDx;
    }
    // 互换sort值
    if (options.path) {
      var thisValue = temp.view.model.get(options.path);
      var nextValue = next.view.model.get(options.path);
      tempObj[options.path] = nextValue;
      nextObj[options.path] = thisValue;
    }
    temp.view.model.stopCollapse = true;
    next.view.model.stopCollapse = true;
    temp.view.model.set(tempObj);
    next.view.model.set(nextObj);

    // 交换model
    this.collection.models[new_index] = this.collection.models.splice(original_index, 1, this.collection.models[new_index])[0];
    // 交换位置
    if (original_index < new_index) {
      temp.view.$el.before(next.view.$el).removeClass('hover');
    } else {
      temp.view.$el.after(next.view.$el).removeClass('hover');
    }
    if (temp.view.$el.hasClass('bui-grid-row-even')) {
      temp.view.$el.removeClass('bui-grid-row-even');
      next.view.$el.addClass('bui-grid-row-even');
    } else {
      temp.view.$el.addClass('bui-grid-row-even');
      next.view.$el.removeClass('bui-grid-row-even');
    }
    if (options.success) {
      options.success.call(this, temp, next);
    }
    return this;
  },
  /**
   * 上移, 默认以sort为字段进行上移操作， 如果字段不为sort， 则需重载并设置options
   *
   * @method [移动] - _moveUp ( 上移 )
   * @param model
   * @author wyj 14.12.4
   * @example
   *      app.getView('attributesList')._setOption({
   *        sortField: 'orderList'
   *      })._moveUp(this.model);
   */
  _moveUp: function(model) {
    debug('BaseList._moveUp'); //debug__
    var ctx = this;
    var first = this.collection.indexOf(model);
    var last, parentId;
    var result = [];
    if (this._options.subRender) {
      parentId = model.get(this._options.parentId);
      this.collection.each(function(thisModel) {
        if (parentId === thisModel.get(ctx._options.parentId)) {
          result.push(thisModel);
        }
      });
      //TODO 找出下一个元素的索引值
      var thisDx = Est.findIndex(result, function(item) {
        return item.get('id') === model.get('id');
      });
      if (thisDx === 0) return;
      last = this.collection.indexOf(result[thisDx - 1]);
    } else {
      if (first === 0) return;
      last = first - 1;
    }
    //model.stopCollapse = true;
    this._exchangeOrder(first, last, {
      path: this._options.sortField || 'sort',
      success: function(thisNode, nextNode) {
        if (thisNode.get('id') && nextNode.get('id')) {
          this._saveSort(thisNode);
          this._saveSort(nextNode);
          thisNode.stopCollapse = false;
          nextNode.stopCollapse = false;
        } else {
          debug('Error8'); //debug__
        }
      }
    });
  },
  /**
   * 下移
   *
   * @method [移动] - _moveDown ( 下移 )
   * @param model
   * @author wyj 14.12.4
   */
  _moveDown: function(model) {
    debug('BaseList._moveDown'); //debug__
    var ctx = this;
    var first = this.collection.indexOf(model);
    var last, parentId;
    var result = [];
    if (this._options.subRender) {
      parentId = model.get(ctx._options.parentId);
      this.collection.each(function(thisModel) {
        if (parentId === thisModel.get(ctx._options.parentId)) {
          result.push(thisModel);
        }
      });
      //TODO 找出上一个元素的索引值
      var thisDx = Est.findIndex(result, function(item) {
        return item.get('id') === model.get('id');
      });
      if (thisDx === result.length - 1) return;
      last = this.collection.indexOf(result[thisDx + 1]);
    } else {
      if (first === this.collection.models.length - 1) return;
      last = first + 1;
    }
    //model.stopCollapse = true;
    this._exchangeOrder(first, last, {
      path: this._options.sortField,
      success: function(thisNode, nextNode) {
        if (thisNode.get('id') && nextNode.get('id')) {
          this._saveSort(thisNode);
          this._saveSort(nextNode);
          thisNode.stopCollapse = false;
          nextNode.stopCollapse = false;
        } else {
          debug('Error8'); //debug__
        }
      }
    });
  },
  /**
   *  获取checkbox选中项所有ID值列表
   *
   * @method [选取] - _getCheckboxIds ( 获取checkbox选中项所有ID值列表 )
   * @return {*}
   * @author wyj 14.12.8
   * @example
   *      this._getCheckboxIds(); => ['id1', 'id2', 'id3', ...]
   */
  _getCheckboxIds: function(field) {
    return Est.pluck(this._getCheckedItems(), Est.isEmpty(field) ? 'id' : ('attributes.' + field));
  },
  __filter: function(item) {
    return item.attributes.checked;
  },
  /**
   *  获取checkbox选中项
   *
   * @method [选取] - _getCheckedItems ( 获取checkbox选中项 )
   * @return {*}
   * @author wyj 14.12.8
   * @example
   *      this._getCheckedItems(); => [{model}, {model}, {model}, ...]
   *      this._getCheckedItems(true); => [{item}, {item}, {item}, ...]
   */
  _getCheckedItems: function(pluck) {
    return pluck ? Est.chain(this.collection.models).filter(this.__filter).pluck('attributes').value() :
      Est.chain(this.collection.models).filter(this.__filter).value();
  },
  /**
   * 转换成[{key: '', value: ''}, ... ] 数组格式 并返回
   *
   * @method [集合] - _getItems ( 获取所有列表项 )
   * @author wyj 15.1.15
   * @example
   *      app.getView('productList').getItems();
   */
  _getItems: function() {
    return Est.pluck(this.collection.models, 'attributes');
  },
  /**
   * 获取集合中某个元素
   *
   * @method [集合] - getItem ( 获取集合中某个元素 )
   * @param index
   * @return {*}
   * @author wyj 15.5.22
   */
  _getItem: function(index) {
    var list = this._getItems();
    index = index || 0;
    if (list.length > index) return list[index];
    return null;
  },
  /**
   * 向集合末尾添加元素
   *
   * @method [集合] - _add ( 向集合末尾添加元素 )
   * @author wyj 15.1.15
   * @example
   *      app.getView('productList')._add(new model());
   */
  _add: function(model) {
    this.collection.push(model);
  },
  /**
   * 批量删除， 隐藏等基础接口
   *
   * @method [批量] - _batch ( 批量删除 )
   * @param options [url: 批量请求地址] [tip: 操作成功后的消息提示]
   * @author wyj 14.12.14
   * @example
   *        this._batch({
                url: ctx.collection.batchDel,
                tip: '删除成功'
              });
   *
   */
  _batch: function(options) {
    var ctx = this;
    options = Est.extend({
      tip: CONST.LANG.SUCCESS + '！'
    }, options);
    this.checkboxIds = this._getCheckboxIds(options.field || 'id');
    if (this.checkboxIds.length === 0) {
      BaseUtils.tip(CONST.LANG.SELECT_ONE + '！');
      return;
    }
    if (options.url) {
      $.ajax({
        type: 'POST',
        async: false,
        url: options.url,
        data: {
          ids: ctx.checkboxIds.join(',')
        },
        success: function(result) {
          if (!result.success) {
            BaseUtils.tip(result.msg);
          } else
            BaseUtils.tip(options.tip);
          ctx._load();
          if (options.callback)
            options.callback.call(ctx, result);
        }
      });
    } else {
      Est.each(this._getCheckedItems(), function(item) {
        item.destroy();
      });
      if (options.callback)
        options.callback.call(ctx);
    }

  },
  /**
   * 批量删除
   *
   * @method [批量] - _batchDel ( 批量删除 )
   * @param options
   * @author wyj 14.12.14
   * @example
   *      this._batchDel({
   *        url: CONST.API + '/message/batch/del',
   *        field: 'id',
   *      });
   */
  _batchDel: function(options, callback) {
    var ctx = this;
    var url = null;
    var field = 'id';
    var $target = this._getEventTarget(options);
    // options 为 event
    if ($target.size() > 0) {
      url = $target.attr('data-url');
      field = $target.attr('data-field') || 'id';
    } else {
      url = options.url;
      id = options.id || 'id';
    }

    this.checkboxIds = this._getCheckboxIds(field);
    if (this.checkboxIds && this.checkboxIds.length === 0) {
      BaseUtils.tip(CONST.LANG.SELECT_ONE);
      return;
    }
    BaseUtils.confirm({
      success: function() {
        ctx._batch({
          url: url,
          field: field,
          tip: CONST.LANG.DEL_SUCCESS,
          callback: callback
        });
      }
    });
  },
  /**
   * 使所有的checkbox初始化为未选择状态
   *
   * @method [选取] - _clearChecked ( 所有选取设置为未选择状态 )
   * @author wyj 14.12.14
   * @example
   *      this._clearChecked();
   */
  _clearChecked: function() {
    Est.each(this.collection.models, function(model) {
      model.attributes.checked = false;
    });
  }
});
