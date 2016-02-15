/**
 * @description config
 * @namespace config
 * @author yongjin<zjut_wyj@163.com> 2014/12/11
 */
app.addTemplate('template/pagination', function (require, exports, module) {
  module.exports = require('ui/pagination/views/pagination.html');
});
app.addModule('Pagination', 'ui/pagination/controllers/Pagination.js');

