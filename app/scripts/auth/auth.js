/**
 * @description 用户登录
 * @class auth
 * @author yongjin<zjut_wyj@163.com> 2015/7/9
 */

var LoginModel = BaseModel.extend({
  defaults: Est.extend({}, BaseModel.prototype.defaults),
  baseId: 'loginId',
  baseUrl: CONST.API + '/user/login'
});

var NavigateLogin = BaseDetail.extend({
  events: {
    'click .form_close': 'close',
    'click .register': 'register'
  },
  initialize: function() {
    this._initialize({
      template: $('#template-login').html(),
      model: LoginModel,
      enterRender: '#submit',
      afterRender: this.afterRender
    });
  },
  register: function() {
    app.emptyDialog();
    this._dialog({
      moduleId: 'Register', // 模块ID
      title: '用户注册', // 对话框标题
      width: 375, // 对话框宽度
      skin: 'form-register', // className
      type: 'admin',
      hideSaveBtn: true,
      button: [{
        value: '注册',
        callback: function() {
          this.title('注册中..');
          $("#Register" + " #submit").click(); // 弹出的对话ID选择符为moduleId值
          return false; // 去掉此行将直接关闭对话框
        },
        autofocus: true
      }]
    }, this);
  },
  close: function() {
    this.$mask = $('.mask');
    this.$mask.hide();
    this.$formLogin.addClass("fadeOutUpBig").removeClass("fadeInDownBig");
    if (this.$formLogin.css('opacity') == '1') {
      this.$formLogin.css('opacity', '0');
      this.$formLogin.hide();
    }
  },
  afterRender: function() {
    this.model.hideTip = true;
    this.$formLogin = this.$formLogin || $('.form_login');
    this._form('#J_Form_Login')._init({
      onBeforeSave: function() {
        this.model.set('data', null);
        this.model.set('password2', this.model.get('password'));
      },
      onAfterSave: function(response) {
        //error
        if (response.attributes && response.attributes._response && response.attributes._response.success === false) {
          $('.error-txt').html('用户名密码错误');
          return;
        }
        //不成功
        if (response.attributes && response.attributes.attributes && !response.attributes.attributes.success) {
          app.addData('user', {});
          Est.cookie('username', null);
          Est.cookie('enterpriseId', null);
          CONST.USER = {};
        } else { //成功
          $('.error-txt').html('');
          this.close();
          response.attributes.data = response.attributes;
          app.addData('user', response.attributes.data);

          CONST.USER = response.attributes.data;
          Est.trigger('accountRender', response);

          //7天cookie
          if ($('#expire', this.$el).attr('checked') == 'checked') {
            Est.cookie('autosurfing', JSON.stringify({
              surfing: $('#model-username', this.$el).val(),
              suresurfing: $('#model-password', this.$el).val()
            }), {
              expires: 7
            });
          }
          Est.cookie('username', response.attributes.data.username);
          Est.cookie('password', response.attributes.data.password);
          Est.cookie('enterpriseId', response.attributes.data.enterpriseId);

          if (window.location.hash.indexOf('design_center') > -1 ||
            window.location.hash.indexOf('design_create') > -1 ||
            window.location.hash.indexOf('design_clone') > -1) {} else {
            this._navigate(window.location.hash, true);
          }
        }
      }
    });
  }
});

var NavigateAccount = BaseView.extend({
  events: {
    'click .login': 'login',
    'click .login-out': 'logout'
  },
  initialize: function() {
    this._initialize({
      template: $('#template-account').html(),
      beforeRender: this.beforeRender,
      afterRender: this.afterRender
    });
  },
  beforeRender: function() {
    if (Est.isEmpty(Est.getValue(CONST, 'USER.enterprise.logo'))) {
      this.model.set('entLogo', CONST.DOMAIN + CONST.PIC_NONE);
    } else {
      this.model.set('entLogo', CONST.PIC_URL_ADMIN + '/' + Est.getValue(CONST, 'USER.enterprise.logo'));
    }
    if (!CONST.USER.username) {
      this.model.set('state', '01');
    }
  },
  afterRender: function  () {
      this.$formLogin = this.$formLogin || $('.form_login');
  },
  login: function() {
    this.$mask = $('.mask');
    this.$mask.show();
    this.$formLogin.removeClass("fadeOutUpBig").addClass("animate fadeInDownBig");
    if (this.$formLogin.css('opacity') == '0') {
      this.$formLogin.css('opacity', '1');
      this.$formLogin.show();
    }
    if (!app.getView('NavigateLogin')) {
      app.addView('NavigateLogin', new NavigateLogin({
        viewId: 'NavigateLogin',
        el: this.$formLogin
      }));
    }
  },
  logout: function() {
    Est.cookie('autosurfing', '', {
      expires: -1
    });
    Service.logout();
  }
});


Service.initUser().done(function(result) {
  var Home;
  var router = Backbone.Router.extend(b_routes);
  new router();
  Backbone.history.start();

  seajs.use(['Tab'], function(Tab) {
    app.addRegion('headNav', Tab, {
      el: '.nav-list',
      require: false,
      tpl: '<a href="javascript:;">{{text}}</a>',
      cur: Est.isEmpty(location.hash) ? '#/home' : location.hash,
      path: 'hashName',
      theme: 'tab-ul-text',
      items: [{
        text: '首页',
        hashName: '#/home'
      }, {
        text: '最新模版',
        hashName: '#/new'
      }, {
        text: '众包案例库',
        hashName: '#/market'
      }, {
        text: '设计外包商',
        hashName: '#/home_outsourcing'
      }, {
        text: '服务',
        hashName: '#/buy'
      }, {
        text: '我的手机网站',
        hashName: '#/home_my'
      }],
      change: function(item, init) {
        if (init) return;
        Backbone.history.navigate(item.hashName);
      }
    });
  });

  Est.off('accountRender').on('accountRender', function() {
    app.addRegion('navigateAccount', NavigateAccount, {
      el: '#nav-account'
    });
  });

  Est.off('login').on('login', function(flag, response) {
    Est.trigger('accountRender', response);
    setTimeout(function() {
      app.getView('accountRender').login();
    }, 500);
  });

  Est.off('checkLogin').on('checkLogin', function() {
    Service.initUser(UserModel).done(function(response) {
      if (!CONST.USER.username) {
        Est.trigger('accountRender', response);
        Est.trigger('login', response);
      }
    });
  });
  Est.trigger('accountRender', result);

});
