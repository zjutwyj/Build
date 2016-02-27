/**
 * @description Service
 * @class Service
 * @author yongjin<zjut_wyj@163.com> 2014/12/17
 */
var Service = {
  logout: function(options) {
    new BaseService().factory({
      url: CONST.API + '/user/logout'
    }).then(function(result) {
      app.addData('user', {});
      CONST.USER = {};
      Est.trigger('accountRender', result);
    });
  },
  initUser: function() {
    /*var UserModel = BaseModel.extend({
      defaults: Est.extend({
        name: '未登录',
        sex: '00'
      }, BaseModel.prototype.defaults),
      baseId: 'userId',
      baseUrl: CONST.API + '/user/isLogin'
    });
    var userModel = new UserModel();
    userModel.hideTip = true;*/
    // local
    return {
      done: function(fn) {
        fn && fn.call(null, {username: 'user'});
      }
    };
    // remote
    return userModel.fetch({
      wait: true,
      timeout: 10000,
      success: function(data) {
        if (data.attributes && data.attributes._response) {
          app.addData('user', {});
          CONST.USER = {};
        } else {
          app.addData('user', data.attributes);
          CONST.USER = data.attributes;
        }
      }
    });
  },
  //获取分类列表
  getCategory: function (options) {
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
  //获取子分类列表
  getSubCategory: function (options) {
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
  }
};
