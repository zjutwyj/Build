/**
 * @description Buy
 * @class Buy
 * @author 2015/9/23.
 */
define('Buy', ['template/buy'], function (require, exports, module) {
  var Buy, template;

  template = require('template/buy');

  Buy = BaseView.extend({
    events: {
      'click .username-buy': 'buy'
    },
    initialize: function () {
      this._initialize({
        template: template
      });
      this.render();
    },
    buy: function(){
      this._dialog({
        title: '服务开通',
        width: 490,
        moduleId: 'PayDetail',
        hideSaveBtn: true
      });
    },
    render: function () {
      this._render();
    }
  });

  module.exports = Buy;
});