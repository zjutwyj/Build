app.addModule('CaseList', 'modules/case/controllers/CaseList.js');
app.addTemplate('template/case_list', function(require, exports, module) {
  module.exports = require('modules/case/views/case_list.html');
});

app.addModule('CaseMarket', 'modules/case/controllers/CaseMarket.js');
app.addTemplate('template/case_market', function(require, exports, module) {
  module.exports = require('modules/case/views/case_market.html');
});
app.addModule('CaseNew', 'modules/case/controllers/CaseNew.js');
app.addTemplate('template/case_new', function(require, exports, module) {
  module.exports = require('modules/case/views/case_new.html');
});
app.addRoute('new', function() {
  seajs.use(['CaseNew'], function(CaseNew) {
    app.addRegion('main', CaseNew, {
      viewId: 'caseNew',
      el: '#mobile-main'
    });
  });
});
app.addRoute('market', function() {
  seajs.use(['CaseMarket'], function(CaseMarket) {
    app.addRegion('main', CaseMarket, {
      viewId: 'caseMarket',
      el: '#mobile-main'
    });
  });
});
