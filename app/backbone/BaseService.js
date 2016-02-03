/**
 * @description BaseService - 单例模式， 只创建一个实例化对象
 * @class BaseService - 数据请求
 * @author yongjin<zjut_wyj@163.com> 2015/1/26
 */

var BaseService = function () {
  if (typeof BaseService.instance === 'object') {
    return BaseService.instance;
  }
  debug('build BaseService instance');
  BaseService.instance = this;
}

BaseService.prototype = {
  /**
   * 基础ajax
   *
   * @method ajax
   * @param options
   * @return {*}
   * @author wyj 15.1.26
   * @example
   *        new BaseService().ajax(options).done(function (result) {
                if (result.attributes) {
                  ...
                }
              });
   */
  ajax: function (options) {
    var data = Est.extend({ _method: 'GET' }, options);
    return $.ajax({
      type: 'post',
      url: options.url,
      async: false,
      cache: options.cache,
      data: data,
      success: function (result) {
      }
    });
  },
  /**
   * 初始化树
   *
   * @method initTree
   * @private
   * @param options
   * @param result
   * @author wyj 15.1.26
   */
  initTree: function (options, result) {
    if (options.tree) {
      result.attributes.data = Est.bulidTreeNode(result.attributes.data, options.rootKey, options.rootValue, {
        categoryId: options.categoryId,// 分类ＩＤ
        belongId: options.belongId,// 父类ＩＤ
        childTag: options.childTag, // 子分类集的字段名称
        sortBy: options.sortBy, // 按某个字段排序
        callback: function (item) {
          if (options.tree) {
            item.text = item[options.text];
            item.value = item[options.value];
          }
        }
      });
    }
  },
  /**
   * 初始化选择框
   *
   * @method initSelect
   * @private
   * @param options
   * @param result
   * @author wyj 15.1.26
   */
  initSelect: function (options, result) {
    if (options.select) {
      Est.each(result.attributes.data, function (item) {
        item.text = item[options.text];
        item.value = item[options.value];
      });
      if (options.tree) {
        result.attributes.data = Est.bulidSelectNode(result.attributes.data, 1, {
          name: 'text'
        });
      }
    }
  },
  /**
   * 初始化是否展开
   *
   * @method initExtend
   * @private
   * @param options
   * @param result
   * @author wyj 15.1.27
   */
  initExtend: function (options, result) {
    if (options.extend) {
      result.attributes.data = Est.extendTree(result.attributes.data);
    }
  },
  /**
   * 添加默认选项
   *
   * @method initDefault
   * @private
   * @param options
   * @param result
   * @author wyj 15.1.27
   */
  initDefault: function (options, result) {
    if (result.attributes && options.defaults && Est.typeOf(result.attributes.data) === 'array') {
      result.attributes.data.unshift({text: CONST.LANG.SELECT_DEFAULT, value: options.defaultValue});
    }
  },
  /**
   * 基础工厂类 - 工厂模式，通过不同的url请求不同的数据
   * 注意：这个方法获取的数据是list类型的， 适合列表或下拉框使用
   *
   * @method factory
   * @param options
   * @return {Est.promise}
   * @author wyj 15.1.26
   * @example
   *      new BaseService().factory({
              url: '', // 请求地址
              data: { // 表单参数
              },
              session: true, // 永久记录，除非软件版本号更新
              cache: true // 暂时缓存， 浏览器刷新后需重新请求

              select: true, // 是否构建下拉框
              tree: true, // 是否构建树
              extend: true, // 是否全部展开
              defaults： false, // 是否添加默认选项
              defaultValue: '/', // 默认为 /

              // 如果tree为true时， 表示需要构建树， 则需补充以下字段
              rootKey: 'isroot', // 构建树时的父级字段名称
              rootValue: '01', // 父级字段值
              categoryId: 'categoryId', //分类 Id
              belongId: 'belongId', // 父类ID
              childTag: 'cates', // 子集字段名称
              sortBy: 'sort', // 根据某个字段排序

              // 如果select为true时 ，表示需要构建下拉框， 则下面的text与value必填
              text: 'name', // 下拉框名称
              value: 'categoryId', // 下拉框值
            });

   */
  factory: function (options) {
    var ctx = this;
    var $q = Est.promise;
    var params = '';
    var cacheId = '';
    var result = null;
    options = Est.extend({ select: false, extend: false,
      defaults: true, tree: false, defaultValue: null, cache: false}, options);

    for (var key in options) {
      params += options[key];
    }
    cacheId = '_hash' + Est.hash(params);

    // localStorage缓存
    if (options.session && !app.getData('versionUpdated')) {
      result = app.getSession(cacheId);
      if (result) {
        return new $q(function (topResolve, topReject) {
          topResolve(JSON.parse(result));
        });
      }
    }
    return new $q(function (topResolve, topReject) {
      if (CONST.DEBUG_LOCALSERVICE) {
        topResolve([]);
      } else {
        ctx.ajax(options).done(function (result) {
          var list = null;
          if (result.attributes) {
            ctx.initTree(options, result);
            ctx.initSelect(options, result);
            ctx.initExtend(options, result);
          } else {
            result.attributes = result.attributes || {};
            result.attributes.data = [];
          }
          ctx.initDefault(options, result);
          list = result.attributes ? result.attributes.data : result;
          if (options.session && result.attributes) {
            app.addSession(cacheId, JSON.stringify(list));
          }
          topResolve(list);
        });
      }
    });
  },
  /**
   * 基础工厂类 - 工厂模式，通过不同的url请求不同的数据
   * 注意：这个方法获取的数据是从任何类型的
   *
   * @method query
   * @param options
   * @return {Est.promise}
   * @author wyj 15.1.26
   * @example
   *      new BaseService().query({
              url: '', // 请求地址
              data: { // 表单参数
              },
              session: true, // 永久记录，除非软件版本号更新
              cache: true // 暂时缓存， 浏览器刷新后需重新请求
            });
   */
  query: function (options) {
    var ctx = this;
    var $q = Est.promise;
    var params = '';
    var cacheId = '';
    var result = null;
    options = Est.extend({ cache: false}, options);

    for (var key in options) {
      params += options[key];
    }
    cacheId = '_hash' + Est.hash(params);

    // localStorage缓存
    if (options.session && !app.getData('versionUpdated')) {
      result = app.getSession(cacheId);
      if (result) {
        return new $q(function (topResolve, topReject) {
          topResolve(JSON.parse(result));
        });
      }
    }
    return new $q(function (topResolve, topReject) {
      if (CONST.DEBUG_LOCALSERVICE) {
        topResolve([]);
      } else {
        ctx.ajax(options).done(function (result) {
          if (result.msg === CONST.LANG.NOT_LOGIN) {
            Est.trigger('checkLogin');
          }
          if (options.session && result) {
            app.addSession(cacheId, JSON.stringify(result));
          }
          topResolve(result);
        });
      }
    });
  }
}
