/**
 * @description main
 * @class main
 * @author yongjin<zjut_wyj@163.com> 2015/12/28
 */
app.addModule('ManageList', 'modules/manage/controllers/ManageList.js');
app.addTemplate('template/manage_list', function (require, exports, module) {
  module.exports = require('modules/manage/views/manage_list.html');
});
