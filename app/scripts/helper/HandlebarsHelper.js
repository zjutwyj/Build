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

/**
 * 去时间
 * @method [标签] - stripScripts
 * @author
 * @example
 *
 */
Handlebars.registerHelper('timeFormat', function (str) {
  return  str.split(' ')[0]
});

/**
 * 去最后一个+132
 * @method [标签] - stripScripts
 * @author
 * @example
 *
 */
Handlebars.registerHelper('strEnd', function (str) {
  return  str.substring(0, str.length - 1) + 132
});
/**
 * 格式化手机号码
 * @method [标签] - stripScripts
 * @author
 * @example
 */
Handlebars.registerHelper('mobileFormat', function (str) {
  return  str.replace(/(.{1,3})(.{1,4})(.*)/, '$1****$3');
});
Handlebars.registerHelper('welcome', function (welcome, options) {
  var style = '';
  if (welcome) {
    if (welcome.action === '01') {
      style = 'background-image:url("' + Handlebars.helpers['PIC'].apply(this, [welcome.pic]) + '");' +
        'background-size: cover; background-position: center center;background-color: ' + welcome.bgColor + '}}';
    }
  } else {
    return '';
  }

  return style;
});
/**
 * checkbox标签
 *
 * @method [表单] - checkbox
 * @author wyj 15.6.19
 * @example
 *      {{{{checkbox label='默认' name='isChecked' value=isChecked trueVal='01' falseVal='00' }}}
 */
Handlebars.registerHelper('checkbox', function (options) {
  var id = options.hash.id ? options.hash.id : (Est.nextUid('model- ')+ options.hash.name);
  var random = Est.nextUid('checkbox'); // 随机数
  var icon_style = "font-size: 32px;"; // 图标大小
  var value = Est.isEmpty(options.hash.value) ? options.hash.falseVal : options.hash.value; // 取值
  var isChecked = value === options.hash.trueVal ? true : false; // 是否选中状态
  var defaultClass = isChecked ? 'icon-checkbox' : 'icon-checkboxno';
  var args = ("'" + random + "'"); // 参数

  var result = '<label for="' + id + '"> ' +
    '<input type="checkbox" name="' + options.hash.name + '" id="' + id + '" value="' + value + '" ' + (isChecked ? 'checked' : '') + ' true-value="' + options.hash.trueVal + '" false-value="' + options.hash.falseVal + '"  class="rc-hidden">' +
    options.hash.label +
    '</label>';
  return result;
});