app.addModule('HomeIntro', 'modules/home/controllers/HomeIntro.js');
app.addTemplate('template/home_intro', function(require, exports, module) {
  module.exports = require('modules/home/views/home_intro.html');
});
//app.addTpl('template/home_intro', 'modules/home/views/home_intro.html');
app.addRoute('home', function() {
  var module = 'HomeIntro';
  var pageSize = 20;
  seajs.use([module], function(Home) {
    app.addRegion('main', Home, {
      el: '#mobile-main',
      pageSize: pageSize
    });
  });
});
/**首页 - 找人外包*/
app.addModule('HomeOutsourcing', 'modules/home/controllers/HomeOutsourcing.js');
app.addTemplate('template/home_outsourcing', function(require, exports, module) {
  module.exports = require('modules/home/views/home_outsourcing.html');
});
app.addRoute('home_outsourcing', function() {
  seajs.use(['HomeOutsourcing'], function(HomeOutsourcing) {
    app.addRegion('main', HomeOutsourcing, {
      el: '#mobile-main'
    });
  });
});
/**首页 - 找人外包*/
app.addModule('HomeOutsourcingDetail', 'modules/home/controllers/HomeOutsourcingDetail.js');
app.addTemplate('template/home_outsourcing_detail', function(require, exports, module) {
  module.exports = require('modules/home/views/home_outsourcing_detail.html');
});
app.addRoute('home_outsourcing_detail', function() {
  seajs.use(['HomeOutsourcingDetail'], function(HomeOutsourcingDetail) {
    app.addRegion('main', HomeOutsourcingDetail, {
      el: '#mobile-main'
    });
  });
});
/*购买页面*/
app.addModule('Buy', 'modules/home/controllers/Buy.js');
app.addTemplate('template/buy', function(require, exports, module) {
  module.exports = require('modules/home/views/buy.html');
});
app.addRoute('buy', function() {
  seajs.use(['Buy'], function(Buy) {
    app.addRegion('main', Buy, {
      el: '#mobile-main'
    });
  });
});
