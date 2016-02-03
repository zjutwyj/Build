/**
 * @description 基础集合类
 *
 * - url: CONST.API + '/product/list', // 如果是function形式构建的时候，记得带上page 与pageSize; // 可选
 * - batchDel: CONST.API + '/product/batch/del', // 可选
 * - model: ProductModel,
 * - initialize: function(){this._initialize();} // 可选
 *
 * @class BaseCollection 集合类
 * @author yongjin<zjut_wyj@163.com> 2014/11/6
 */

var PaginationModel = Backbone.Model.extend({
  defaults: { page: 1, pageSize: 16, count: 0 },
  initialize: function () {
    debug('3.PaginationModel.initialize');
  }
});

var BaseCollection = Backbone.Collection.extend({
  //localStorage: new Backbone.LocalStorage('base-collection'),
  /**
   * 传递options进来
   *
   * @method [private] - constructor
   * @private
   * @param options
   * @author wyj 14.12.16
   */
  constructor: function (options) {
    this.options = options || {};
    Backbone.Collection.apply(this, [null, arguments]);
  },
  /**
   * 初始化
   *
   * @method [初始化] - _initialize ( 初始化 )
   * @author wyj 14.11.16
   * @example
   initialize: function () {
                this._initialize();
              }
   */
  _initialize: function () {
    debug('2.BaseCollection._initialize');
    this._baseUrl = this.url;
    if (!this.paginationModel) {
      this.paginationModel = new PaginationModel({
        page: this.options.page,
        pageSize: this.options.pageSize
      });
    }
  },
  initialize: function () {
    this._initialize();
  },
  /**
   * 处理url 与 分页
   *
   * @method [private] - _parse (  )
   * @private
   * @param resp
   * @param xhr
   * @return {attributes.data|*}
   * @author wyj 14.11.16
   */
  parse: function (resp, xhr) {
    var ctx = this;
    if (Est.isEmpty(resp)) {
      debug(function () {
        var url = Est.typeOf(ctx.url) === 'function' ? ctx.url() : ctx.url;
        return 'Error:14 ' + url;
      }, {type: 'error'});
      return [];
    }
    this._parsePagination(resp);
    this._parseUrl(this.paginationModel);
    //TODO this.options.pagination 防止被其它无分页的列表覆盖
    if (this.options.pagination && this.paginationModel) {
      this._paginationRender();
    }
    return resp.attributes.data;
  },
  /**
   * 处理url地址， 加上分页参数
   *
   * @method [private] - _parseUrl (  )
   * @private
   * @param model
   * @author wyj 14.11.16
   */
  _parseUrl: function (model) {
    debug('- BaseCollection._parseUrl');
    var page = 1, pageSize = 16;
    if (model && model.get('pageSize')) {
      pageSize = model.get('pageSize');
      page = model.get('page');
    }
    if (this.options.subRender) {
      page = 1;
      pageSize = 9000;
    }
    if (typeof this.url !== 'function') {
      var end = '';
      if (!Est.isEmpty(this._itemId)) end = '/' + this._itemId;
      this.url = this._baseUrl + end + '?page=' + page + '&pageSize=' + pageSize;
    }
  },
  /**
   * 设置分页模型类
   *
   * @method [private] - _parsePagination
   * @private
   * @param resp
   * @author wyj 14.11.16
   */
  _parsePagination: function (resp) {
    debug('6.BaseCollection._parsePagination');
    resp.attributes = resp.attributes ||
    { page: 1, per_page: 10, count: 10 };
    if (this.paginationModel) {
      this.paginationModel.set('page', resp.attributes.page);
      this.paginationModel.set('pageSize', resp.attributes.per_page);
      this.paginationModel.set('count', resp.attributes.count);
    }
  },
  /**
   * 渲染分页
   *
   * @method [private] - _paginationRender
   * @private
   * @author wyj 14.11.16
   */
  _paginationRender: function () {
    seajs.use(['Pagination'], Est.proxy(function (Pagination) {
      if (!this.pagination) {
        var $el = $(this.options.el);
        this.pagination = new Pagination({
          el: $("#pagination-container", $el.size() > 0 ? $el : $('body')),
          model: this.paginationModel
        });
      } else {
        this.pagination.render();
      }
    }, this));
  },
  /**
   * 加载列表
   *
   * @method [集合] - _load ( 加载列表 )
   * @param instance 实例对象
   * @param context 上下文
   * @param model 模型类
   * @return {ln.promise} 返回promise
   * @author wyj 14.11.15
   * @example
   *      if (this.collection.url){
       *             this.collection._load(this.collection, this, model)
       *                 .then(function(result){
       *                     resolve(result);
       *                 });
       *         }
   */
  _load: function (instance, context, model) {
    debug('4.BaseCollection._load');
    //if (!Est.isEmpty(this.itemId)) this.url = this.url + '/' + this.itemId;
    this._parseUrl(model);
    return instance.fetch({success: function () {
      //resolve(instance);
      debug('5.collection reset');
      context._empty();
    }, cacheData: this.options.cache, session: this.options.session});
    /* var $q = Est.promise;
     return new $q(function (resolve) {

     });*/
  },
  /**
   * 设置itemId
   *
   * @method [分类] - _setItemId ( 设置itemId )
   * @param itemId
   * @author wyj 14.12.16
   * @example
   *        this._setItemId('Category00000000000000000032');
   */
  _setItemId: function (itemId) {
    this._itemId = itemId;
    debug('- get list by itemId ' + this._itemId);
  },
  /**
   * 清空列表
   *
   * @method [集合] - _empty ( 清空列表 )
   * @author wyj 14.11.15
   */
  _empty: function () {
    debug('BaseCollection._empty');
    if (this.collection) {
      var len = this.collection.length;
      while (len > -1) {
        this.collection.remove(this.collection[len]);
        len--;
      }
    }
  }
});
