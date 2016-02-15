/**
 * @description HomeIntro
 * @class HomeIntro
 * @author yongjin<zjut_wyj@163.com> 2015/12/28
 */
define('HomeIntro', ['template/home_intro'], function(require, exports, module) {
  var HomeIntro, template;

  template = require('template/home_intro');

  HomeIntro = BaseView.extend({
    initialize: function() {
      this._initialize({
        template: template,
        afterRender: this.afterRender
      });
    },
    afterRender: function() {
    }
  });

  module.exports = HomeIntro;
});
