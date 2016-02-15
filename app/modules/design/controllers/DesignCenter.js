/**
 * @description NavigateHead
 * @class NavigateHead
 * @author yongjin<zjut_wyj@163.com> 2015/12/28
 */
define('DesignCenter', ['template/temp_name'], function(require, exports, module){
  var module_name, template;

  template = require('template/temp_name');

  module_name = BaseView.extend({
    initialize: function(){
      this._initialize({
        template: template
      });
      this.render();
    }
  });

  module.exports = module_name;
});