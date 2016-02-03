/**
 * @description Service
 * @class Service
 * @author yongjin<zjut_wyj@163.com> 2014/12/17
 */
var Service = {
  logout: function (options) {
    debug('Service logout');
    new BaseService().factory({
      url: CONST.API + '/user/logout'
    }).then(function (result) {
      app.addData('user', {});
      Est.cookie('username', null);
      Est.cookie('enterpriseId', null);
      CONST.USER = {};
      Est.trigger('accountRender', result);
    });
  },
  initUser: function (model) {
    debug('Service.initUser', {type: 'service'});
    var userModel = new model();
    userModel.hideTip = true;
    return userModel.fetch({
      wait: true,
      timeout: 5000,
      success: function (data) {
        if (data.attributes && data.attributes._response) {
          app.addData('user', {});
          Est.cookie('username', null);
          Est.cookie('enterpriseId', null);
          CONST.USER = {};
        } else {
          app.addData('user', data.attributes);
          Est.cookie('username', data.attributes.username);
          Est.cookie('enterpriseId', data.attributes.enterpriseId);
          CONST.USER = data.attributes;
        }
      },
      error: function () {
      }
    });
  },
  initIndex: function (model) {
    debug('- 首页信息', {type: 'service'});
    return new model().fetch({
      wait: false,
      success: function (data) {
        app.addData('index', data.attributes);
      }
    });
  },
  //批量转移
  batch: function (options) {
    return new BaseService().factory(Est.extend({
      url: CONST.API + '/product/batch/transfer'
    }, options));
  },
  //获取产品分类列表
  getProductCategory: function (options) {
    return new BaseService().factory(Est.extend({
      url: CONST.API + '/category/product?pageSize=1000',
      rootKey: 'isroot', // 构建树时的父级字段名称
      rootValue: '01', // 父级字段值
      categoryId: 'categoryId', //分类 Id
      belongId: 'belongId', // 父类ID
      childTag: 'cates', // 子集字段名称
      sortBy: 'sort',// 根据某个字段排序
      text: 'name', // 下拉框名称
      value: 'categoryId' // 下拉框值
    }, options));
  },
  //获取相册列表
  getAlbumList: function (options) {
    return new BaseService().factory(Est.extend({
      url: CONST.API + '/album/list?pageSize=1000',
      rootKey: 'parentId', // 构建树时的父级字段名称
      rootValue: null, // 父级字段值
      categoryId: 'albumId', //分类 Id
      belongId: 'parentId', // 父类ID
      childTag: 'cates', // 子集字段名称
      text: 'name', // 下拉框名称
      value: 'albumId' // 下拉框值
    }, options));
  },
  //获取新闻分类列表
  getNewsCategory: function (options) {
    return new BaseService().factory(Est.extend({
      url: CONST.API + '/category/news?pageSize=1000',
      rootKey: 'isroot', // 构建树时的父级字段名称
      rootValue: '01', // 父级字段值
      categoryId: 'categoryId', //分类 Id
      belongId: 'belongId', // 父类ID
      childTag: 'cates', // 子集字段名称
      text: 'name', // 下拉框名称
      value: 'categoryId' // 下拉框值
    }, options));
  },
  //获取会员等级列表
  getMemberRankCategory: function (options) {
    return new BaseService().factory(Est.extend({
      url: CONST.API + '/member/rank/list',
      select: true, // 是否构建下拉框
      tree: true, // 是否构建树
      extend: true, // 是否全部展开
      categoryId: 'rankId', //分类 Id
      text: 'name', // 下拉框名称
      value: 'rankId' // 下拉框值
    }, options));
  },
  //获取导航分类列表
  getNavigateCategory: function (options) {
    return new BaseService().factory(Est.extend({
      url: CONST.API + '/navigator/list?pageSize=1000',
      select: options.select || false,
      tree: options.tree || false,
      extend: options.extend || false,
      rootKey: 'grade', // 构建树时的父级字段名称
      defaultValue: '',
      rootValue: 1, // 父级字段值
      categoryId: 'navigatorId', //分类 Id
      belongId: 'parentId', // 父类ID
      childTag: 'cates', // 子集字段名称
      text: 'name', // 下拉框名称
      value: 'navigatorId' // 下拉框值
    }, options));
  },
  //获取手机导航分类列表
  getMobileNavCategory: function (options) {
    return new BaseService().factory(Est.extend({
      url: CONST.API + '/mobile/navigator/list?pageSize=1000',
      rootKey: 'grade', // 构建树时的父级字段名称
      rootValue: 1, // 父级字段值
      categoryId: 'navigatorId', //分类 Id
      belongId: 'parentId', // 父类ID
      childTag: 'cates', // 子集字段名称
      defaultValue: '',
      text: 'name', // 下拉框名称
      value: 'navigatorId' // 下拉框值
    }, options));
  },
  //获取所有静态页面
  getStaticPage: function (options) {
    var url = CONST.API + '/static/list';
    return new BaseService().factory(Est.extend({
      url: url
    }, options));
  },
  //获取物流公司列表
  getDeliveryCorpList: function (options) {
    return new BaseService().factory(Est.extend({
      url: CONST.API + '/deliverycorp/list?pageSize=500',
      text: 'name',
      value: 'corpId'
    }, options));
  },
  //获取所有物流方式列表
  getDeliverTypeList: function (options) {
    return new BaseService().factory(Est.extend({
      url: CONST.API + '/deliverytype/list',
      text: 'name',
      value: 'typeId'
    }, options));
  },
  //获取所有支付方式列表
  getPaymentTypeList: function (options) {
    return new BaseService().factory(Est.extend({
      url: CONST.API + '/paymentconfig/list',
      text: 'name',
      value: 'paymentId'
    }, options));
  },
  //获取地区列表
  getAreaList: function (url) {
    return new BaseService().factory({
      url: url || CONST.API + '/area/list'
    });
  },
  //获取主营行业
  getIndustry: function (options) {
    return new BaseService().factory(Est.extend({
      url: CONST.API + '/wcd/industry',
      cache: true,
      session: true,
      select: true,
      text: 'name',
      value: 'syscodeId'
    }, options));
  },
  //获取场景
  getScene: function (options) {
    return new BaseService().factory(Est.extend({
      url: CONST.API + '/wcd/scene',
      cache: true,
      select: true,
      session: true,
      text: 'name',
      value: 'sceneId'
    }, options));
  },
  //获取请帖主题
  getWqtTheme: function (options) {
    return new BaseService().factory(Est.extend({
      url: CONST.API + '/wqt/list/template'
    }, options));
  },

  /*获取数据 传单要的*/
  //获取行业
  initIndustry: function (options) {
    return new BaseService().factory(Est.extend({
      session: true,
      url: CONST.API + '/index/industry'
    }, options));
  },
  //获取场景
  initScene: function (options) {
    return new BaseService().factory(Est.extend({
      session: true,
      url: CONST.API + '/index/scene'
    }, options));
  },
  //获取微传单分类列表
  getWcdCategory: function (options) {
    return new BaseService().factory(Est.extend({
      session: true,
      cache: true,
      defaults: true,
      select: true,
      text: 'name', // 下拉框名称
      value: 'categoryId', // 下拉框值
      url: CONST.API + '/wcdCategory/list?type=wcd'
    }, options));
  },
  //获取微传单分类列表
  getSubWcdCategory: function (options) {
    if (Est.isEmpty(options.id)) options.id = 99999;
    return new BaseService().factory(Est.extend({
      session: true,
      cache: true,
      select: true,
      defaults: true,
      text: 'name', // 下拉框名称
      value: 'categoryId', // 下拉框值
      url: CONST.API + '/wcdCategory/list?pageSize=1000&type=wcd&parentId=' + options.id
    }, options));
  },
  getWcdCategoryDetail: function (id) {
    return new BaseService().factory({
      session: true,
      cache: true,
      url: CONST.API + '/wcdCategory/detail/' + id
    });
  },
  //获取会员分类列表
  getCategory: function (options) {
    return new BaseService().factory(Est.extend({
      url: CONST.API + '/category/list?pageSize=1000',
      categoryId: 'categoryId', //分类 Id
      text: 'name', // 下拉框名称
      value: 'categoryId' // 下拉框值
    }, options));
  },
  //是否微传单会员
  isWcdMember: function () {
    $.ajax({
      async: false,
      url: CONST.API + '/user/isWcdMember',
      success: function (result) {
        if (result.attributes == null) {
          CONST.isWcdMember = false
        } else {
          CONST.isWcdMember = result.attributes.data;
        }
      }
    })
  },
  //是否微传单管理员
  isWcdAdmin: function () {
    return $.ajax({
      async: false,
      url: CONST.API + '/user/isAdminLogin',
      success: function (result) {
        if (result.attributes == null) {
          CONST.USER_ADMIN = false
        } else {
          CONST.USER_ADMIN = result.attributes.data;
        }
      }
    })
  },
  //查询图库分类
  initPhotoCategory: function (options) {
    return new BaseService().factory({
      cache: true,
      session: true,
      url: CONST.API + '/wcdCategory/list'
        + (Est.isEmpty(options) ? '' : ('?parentId=' + options))
    });
  },
  //查询背景分类
  initBackgroundCategory: function (options) {
    return new BaseService().factory({
      cache: true,
      session: true,
      url: CONST.API + '/wcdCategory/list?type=bg&'
        + (Est.isEmpty(options) ? '' : ('parentId=' + options))
    });
  },
  //查询传单分类
  initWcdCategory: function (options) {
    return new BaseService().factory(Est.extend({
      url: CONST.API + '/wcdCategory/list?type=wcd',
      rootKey: 'parentId', // 构建树时的父级字段名称
      rootValue: 0, // 父级字段值
      categoryId: 'categoryId', //分类 Id
      belongId: 'parentId', // 父类ID
      childTag: 'cates', // 子集字段名称
      text: 'name', // 下拉框名称
      value: 'categoryId' // 下拉框值
    }, options));
  },
  //获取传单短地址
  getShortUrl: function (options) {
    return new BaseService().factory({
      url:CONST.API+'/comm/util/getShortUrl?url=http://www.jihui88.com/wcd/html/'+options.id+'.html?debug=01'
    });
  }
};
