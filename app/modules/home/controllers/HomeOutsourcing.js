/**
 * @description HomeOutsourcing
 * @class HomeOutsourcing
 * @author yongjin<zjut_wyj@163.com> 2015/7/24
 */
define('HomeOutsourcing', ['template/home_outsourcing'], function (require, exports, module) {
  var HomeOutsourcing, template;
  template = require('template/home_outsourcing');

  HomeOutsourcing = BaseView.extend({
    events: {
      'click .home-add': 'leafletAdd'
    },
    initialize: function () {
      this._initialize({
        template: template
      });
      this.render();
    },
    leafletAdd: function () {
        this._dialog({
          width: 400,
          height: 150,
          title: '新建空白微传单',
          id: 'wcd_new',
          viewId: 'wcd_new',
          moduleId: 'WcdNew',
          hideSaveBtn: true,
          button: [
            {
              value: '创建',
              autofocus: true,
              callback: Est.proxy(function (a, b, c, d) {
                var result = app.getView('wcd_new').getModel();
                this._navigate('#/design_create/' + result.type + '/' + result.categoryId, true);
                return false;
              }, this)
            }
          ]
        });
    },
    initTemp: function(){
      $('.home-item .section-a-hover').removeClass('active');
      $('.section-a-outsourcing').addClass('active');
      $('.inp-a,.home-area-box').hover(function(){
          $('.home-area-box').show()
      });
      $('.home-area-box').hover(function(){
        $('.home-area-box').show()
      },function(){
        setTimeout(function(){
          $('.home-area-box').hide()
        },100);
      });
      $('.area-province-div').hover(function(){
        $(this).find('.sm-filter-area-citys').show()
      },function(){
        $('.sm-filter-area-citys').hide()
      })
    },
    render: function () {
      this._render();
      this.initTemp();
    }
  });

  module.exports = HomeOutsourcing;
});