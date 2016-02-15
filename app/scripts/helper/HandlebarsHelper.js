/**
 * @description HandlebarsHelper模板引擎帮助类
 * @class HandlebarsHelper - 标签库
 * @author yongjin on 2014/11/11
 */
/**
 * 所有状态
 * @method [状态] - status
 * @author wyj 15.1.7
 */
Est.each(app.getAllStatus(), function (val, key) {
  Handlebars.registerHelper(key, function (str, options) {
    var result = '';
    if (Est.isEmpty(options)) {
      return this[key];
    }
    Est.each(val, function (item) {
      if (item.value === str) {
        result = Est.isEmpty(item.html) ? item.text : item.html;
        return false;
      }
    });
    return result;
  });
});
