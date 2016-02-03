/**
 * @description HandlebarsHelper模板引擎帮助类
 * @class HandlebarsHelper - 标签库
 * @author yongjin on 2014/11/11
 */
window.ckToggleClass = function (selecter) {
  var $target = $("#" + selecter);
  if ($target.hasClass('icon-checkbox')) $target.removeClass('icon-checkbox').addClass('icon-checkboxno');
  else $target.removeClass('icon-checkboxno').addClass('icon-checkbox');
}
/**
 * 分页
 * @method [分页] - pagination
 * @author wyj 2014-03-27
 * @example
 *        {{#pagination page totalPage}}
 <li class="bui-bar-item bui-button-number bui-inline-block {{#compare ../page this operator='!=='}}danaiPageNum
 {{else}}active{{/compare}}" data-page="{{this}}" aria-disabled="false" id="{{this}}" aria-pressed="false">
 <a href="javascript:;">{{this}}</a></li>
 {{/pagination}}
 */
Handlebars.registerHelper('pagination', function (page, totalPage, sum, block) {
  var accum = '', block = block, sum = sum;
  if (arguments.length === 3) {
    block = sum;
    sum = 9;
  }
  var pages = Est.getPaginationNumber(page, totalPage, sum);
  for (var i = 0, len = pages.length; i < len; i++) {
    accum += block.fn(pages[i]);
  }
  return accum;
});

/**
 * 根据path获取值
 * @method getValue
 * @author wyj 15.2.1
 * @example
 *      Handlebars.helpers["getValue"].apply(this, date)
 */
Handlebars.registerHelper('getValue', function (path, options) {
  if (typeof path !== 'undefined' && Est.typeOf(path) === 'string') {
    var list = path.split('.');
    if (list[0] in this) {
      if (list.length > 1) {
        if (Est.typeOf(this[list[0]]) !== 'object') {
          this[list[0]] = JSON.parse(this[list[0]]);
        }
        return Est.getValue(this, path);
      } else {
        return this[list[0]];
      }
    }
  } else {
    return path;
  }
});

/**
 * 比较
 * @method [判断] - compare
 * @author wyj 2014-03-27
 * @example
 *      {{#compare ../page '!==' this}}danaiPageNum{{else}}active{{/compare}}
 */
Handlebars.registerHelper('compare', function (v1, operator, v2, options) {
  if (arguments.length < 3)
    throw new Error("Handlerbars Helper 'compare' needs 2 parameters");
  try {
    switch (operator.toString()) {
      case '==':
        return (v1 == v2) ? options.fn(this) :
          options.inverse(this);
      case '!=':
        return (v1 != v2) ? options.fn(this) :
          options.inverse(this);
      case '===':
        return (v1 === v2) ? options.fn(this) :
          options.inverse(this);
      case '!==':
        return (v1 !== v2) ? options.fn(this) :
          options.inverse(this);
      case '<':
        return (v1 < v2) ? options.fn(this) :
          options.inverse(this);
      case '<=':
        return (v1 <= v2) ? options.fn(this) :
          options.inverse(this);
      case '>':
        return (v1 > v2) ? options.fn(this) :
          options.inverse(this);
      case '>=':
        return (v1 >= v2) ? options.fn(this) :
          options.inverse(this);
      case '&&':
        return (v1 && v2) ? options.fn(this) :
          options.inverse(this);
      case '||':
        return (v1 || v2) ? options.fn(this) :
          options.inverse(this);
      case 'indexOf':
        return (v1.indexOf(v2) > -1) ? options.fn(this) :
          options.inverse(this);
      default:
        return options.inverse(this);
    }
  } catch (e) {
    console.log('Errow: hbs.compare v1=' + v1 + ';v2=' + v2 + e);
  }
});

/**
 * 时间格式化
 * @method [时间] - dateFormat
 * @author wyj 2014-03-27
 * @example
 *      {{dateFormat $.detail_news.add_time $.lan.news.format}}
 */
Handlebars.registerHelper('dateFormat', function (date, fmt, options) {
  return Est.dateFormat(date, fmt);
});

/**
 * 判断字符串是否包含
 * @method [判断] - contains
 * @author wyj 14.11.17
 * @example
 *      {{#contains ../element this}}checked="checked"{{/contains}}
 */
Handlebars.registerHelper('contains', function (target, thisVal, options) {
  if (Est.isEmpty(target)) return;
  return Est.contains(target, thisVal) ? options.fn(this) : options.inverse(this);
});

/**
 * 两数相加
 * @method [运算] - plus
 * @author wyj 2014-03-27
 * @example
 *      {{plus 1 2}} => 3
 */
Handlebars.registerHelper('plus', function (num1, num2, opts) {
  return parseInt(num1, 10) + parseInt(num2, 10);
});
/**
 * 两数相减
 * @method [运算] - minus
 * @author wyj 2014-03-27
 * @example
 *        {{minus 10 5}} => 5
 */
Handlebars.registerHelper('minus', function (num1, num2, opts) {
  return parseInt(num1, 10) - parseInt(num2, 10);
});

/**
 * 字符串截取
 * @method [字符串] - cutByte
 * @author wyj 2014-03-27
 * @example
 *      {{cutByte name 5 end='...'}}
 */
Handlebars.registerHelper('cutByte', function (str, len, options) {
  return Est.cutByte(str, len, options.hash.end || '...');
});

/**
 * 复杂条件
 * @method [判断] - xif
 * @author wyj 14.12.31
 * @example
 *       return Handlebars.helpers["x"].apply(this, [expression, options]) ? options.fn(this) : options.inverse(this);
 *
 */
Handlebars.registerHelper("x", function (expression, options) {
  var fn = function () {
  }, result;
  try {
    fn = Function.apply(this,
      [ 'window', 'return ' + expression + ';' ]);
  } catch (e) {
    console.warn('[warning] {{x ' + expression + '}} is invalid javascript', e);
  }
  try {
    result = fn.bind(this)(window);
  } catch (e) {
    console.warn('[warning] {{x ' + expression + '}} runtime error', e);
  }
  return result;
});

/**
 * xif条件表达式
 * @method [判断] - xif
 * @author wyj 15.2.2
 * @example
 *    {{#xif "this.orderStatus != 'completed' && this.orderStatus != 'invalid' && this.paymentStatus == 'unpaid' &&
              this.shippingStatus == 'unshipped'"}}disabled{{/xif}}
 */
Handlebars.registerHelper("xif", function (expression, options) {
  return Handlebars.helpers["x"].apply(this, [expression, options]) ? options.fn(this) : options.inverse(this);
});

/**
 * 返回整数
 * @method [数字] - parseInt
 * @author wxw 2014-12-16
 * @example
 *      {{parseInt 01}}
 */
Handlebars.registerHelper('parseInt', function (result, options) {
  return parseInt(result, 10);
});

/**
 * 缩略ID值
 * @method id2
 * @author wyj
 */
Handlebars.registerHelper('id2', function (id) {
  return id == null ? "" : id.replace(/^[^1-9]+/, "")
});

/**
 * 返回全局常量
 * @method [常量] - CONST
 * @author wyj 14.12.17
 * @example
 *        {{CONST 'HOST'}}
 */
Handlebars.registerHelper('CONST', function (name, options) {
  return Est.getValue(CONST, name);
});

/**
 * 返回图片地址常量（返回添加图片域名的图片地址, 推荐使用）
 * @method [常量] - PIC
 * @author wyj 14.12.17
 * @example
 *        {{PIC pic}}   ==> http://img.jihui88.com/upload/a/a1/picture/2015/12/20/pic.jpg?v=2015-12-20_12:30
 *        {{PIC pic 5}} ==> http://img.jihui88.com/upload/a/a1/picture/2015/12/20/pic_5.jpg?v=2015-12-20_12:30
 */
Handlebars.registerHelper('PIC', function (name, number, options) {
  var version = '';
  if (name) {
    version += (name.indexOf('?') > -1 ? ('&v=' + CONST.APP_VERSION) : '?v=' + CONST.APP_VERSION);
    if (Est.startsWidth(name, 'CONST')) {
      name = Handlebars.helpers['CONST'].apply(this, [name.replace('CONST.', ''), options]);
    }
  }
  if (!name) return CONST.DOMAIN + CONST.PIC_NONE + version;
  if (Est.startsWidth(name, 'http') && name.indexOf('upload') > -1){
        name = name.substring(name.indexOf('upload'), name.length);
  }
  if (Est.startsWidth(name, 'upload')){
     return arguments.length < 3 ? CONST.PIC_URL + '/' + name + version:
      Handlebars.helpers['_picUrl'].apply(this, [name, number, options]) + version;
  }

  return Est.startsWidth(name, 'http') ? name + version : CONST.DOMAIN + name + version;
});

/**
 * 返回background-image: url();
 *
 * @method [样式] - BackgroundImage
 * @param  {string} name       图片地址
 * @param  {int} number     压缩尺寸
 * @param  {object} options
 * @return {string}     => background-image: url(http://img.jihui88.com/upload/u/u2/.......png);
 */
Handlebars.registerHelper('BackgroundImage', function (name, number, options) {
  return ('background-image: url(' + Handlebars.helpers['PIC'].apply(this, Array.prototype.slice.call(arguments)) + ');');
});

/*Handlebars.registerHelper('PIC', function (name, options) {
 if (!name) return CONST.PIC_URL + '/' + CONST.PIC_NONE;
 if (Est.startsWidth(name, 'upload')) return CONST.PIC_URL + '/' + name;
 return CONST.DOMAIN + name;
 });*/

/**
 * 判断是否为空
 * @method [判断] - isEmpty
 * @author wyj 14.12.27
 * @example
 *      {{#isEmpty image}}<img src='...'></img>{{/isEmpty}}
 */
Handlebars.registerHelper('isEmpty', function (value, options) {
  return Est.isEmpty(value) ? options.fn(this) :
    options.inverse(this);
});

/**
 * 图片尺寸 （返回不带图片域名的地址）
 * @method [图片] - picUrl
 * @author wyj 2014-03-31
 * @example
 *      <img src="{{CONST 'PIC_URL'}}/{{picUrl picPath 6}}" width="52" height="52">
 */
Handlebars.registerHelper('picUrl', function (src, number, opts) {
  var url = src;
  if (arguments.length < 3) return src || CONST.PIC_NONE;
  if (src == null || src.length == 0) return CONST.PIC_NONE;
  var url2 = url.substring(url.lastIndexOf(".") + 1, url.length);
  url = url.substring(0, url.lastIndexOf(".")) + "_" + number + "." + url2;
  return url ? url : '';
});
Handlebars.registerHelper('_picUrl', function (src, number, opts) {
  return CONST.PIC_URL + '/' + Handlebars.helpers['picUrl'].apply(this, [src, number, opts]);
});
/**
 * radio标签
 *
 * @method [表单] - radio
 * @author wyj 15.1.7
 * @example
 *        {{{radio name='isBest' value=isBest option='{"是": "01", "否": "00"}' }}}
 */
Handlebars.registerHelper('radio', function (options) {
  var result = [], list = $.parseJSON ? $.parseJSON(options.hash.option) : JSON.parse(options.hash.options);
  Est.each(list, function (val, key, list, index) {
    var checked = options.hash.value === val ? 'checked' : '';
    result.push('<label><input id="model' + index + '-' + options.hash.name + '" type="radio" name="' + options.hash.name +
      '" value="' + val + '" ' + checked + '>&nbsp;' + key + '</label>&nbsp;&nbsp;');
  });
  return result.join('');
});

/**
 * checkbox标签
 *
 * @method [表单] - checkbox
 * @author wyj 15.6.19
 * @example
 *      {{{checkbox label='' name='isDefault' value=isDefault trueVal='1' falseVal='0' }}}
 */
Handlebars.registerHelper('checkbox', function (options) {
  var id = options.hash.id ? options.hash.id : ('model-' + options.hash.name);
  var random = Est.nextUid('checkbox'); // 随机数
  var icon_style = "font-size: 32px;"; // 图标大小
  var value = Est.isEmpty(options.hash.value) ? options.hash.falseVal : options.hash.value; // 取值
  var isChecked = value === options.hash.trueVal ? true : false; // 是否选中状态
  var defaultClass = isChecked ? 'icon-checkbox' : 'icon-checkboxno';
  var args = ("'" + random + "'"); // 参数

  var result = '<div> <label for="' + id + '" style="overflow:hidden;display:inline-block;"> ' +
    '<input onclick="window.ckToggleClass(' + args + ');" type="checkbox" name="' + options.hash.name + '" id="' + id + '" value="' + value + '" ' + (isChecked ? 'checked' : '') + ' true-value="' + options.hash.trueVal + '" false-value="' + options.hash.falseVal + '"  class="rc-hidden" style="display: none;">' +
    '<i id="' + random + '" class="iconfont ' + defaultClass + '" style="' + icon_style + '"></i>' + options.hash.label +
    '</label></div>';
  return result;
});

/**
 * select标签
 *
 * @method [表单] - select
 * @author wyj 15.6.22
 * @example
 *      {{{select name='paymentConfit' value=curConfitPanment key='paymentId' text='name' list=paymentConfigList  style="height: 40px;"}}}
 *
 */
Handlebars.registerHelper('select', function (options) {
  var id = options.hash.id ? options.hash.id : ('model-' + options.hash.name);
  var str = '<select name="' + options.hash.name + '" id="' + id + '"  class="' + (options.hash.className || '') + '" style="' + (options.hash.style || '') + '"> ';
  Est.each(options.hash.list, function (item) {
    var selected = options.hash.value === item[options.hash.key] ? 'selected' : '';
    str += '<option value="' + item[options.hash.key] + '" ' + selected + '>' + item[options.hash.text] + '</option>';
  });
  return str + '</select>';
});

/**
 * 显示隐藏
 * @method show
 * @author wyj 15.2.1
 * @example
 *      <h3 {{{show "this.photos.display==='01'"}}}></h3>
 */
Handlebars.registerHelper('show', function (expression, options) {
  return Handlebars.helpers["x"].apply(this, [expression, options]) ? " style='display:block;' " : " style='display:none;' ";
});

/**
 * 表单元素不可编辑
 * @method [表单] - disabled
 * @author wyj 15.2.1
 * @example
 *      <input type="text" {{disabled 'this.isDisabled'}} />
 */
Handlebars.registerHelper('disabled', function (expression, options) {
  return Handlebars.helpers['x'].apply(this, [expression, options]) ? ' disabled=disabled ' : '';
});


/**
 * 判断checkbox是否选中
 * @method [表单] - checked
 * @author wyj 15.2.1
 * @example
 *        <input type="checked"  {{checked 'this.isChecked'}} />
 */
Handlebars.registerHelper('checked', function (expression, options) {
  return Handlebars.helpers['x'].apply(this, [expression, options]) ? 'checked' : '';
});

/**
 * 编译url
 * @method [url] - encodeURLComponent
 * @author wyj 15.2.1
 * @example
 *      {{encodeURIComponent url}}
 */
Handlebars.registerHelper('encodeURIComponent', function (val, options) {
  return encodeURIComponent(val);
});

/**
 * 请求模板
 * @method [模板] - template
 * @author wyj 15.2.1
 * @example
 *      {{template redding}}
 */
Handlebars.registerHelper('template', function (name, options) {
  return (function (name, options, ctx) {
    new Est.promise(function (resolve, reject) {
      seajs.use([name], function (template) {
        var tpl = Handlebars.compile(template);
        resolve(tpl(this));
      });
    }).then(function (result) {
        options.fn(ctx);
      })
  })(name, options, this);
});

/**
 * 解析JSON字符串
 * @method [JSON] - json
 * @example
 *      {{json 'invite.title'}}
 */
Handlebars.registerHelper('json', function (path, options) {
  return Handlebars.helpers["getValue"].call(this, path);
});
/**
 * 打版本号
 * @method [版本] - version
 * @example
 *      http://www.jihui88.com?v={{version}}
 */
Handlebars.registerHelper('version', function (options) {
  return new Date().getTime();
});

/**
 * 移除script标签
 * @method [标签] - stripScripts
 * @author wyj 15.5.12
 * @example
 *    {{stripScripts '<scripts></scripts>'}}
 */
Handlebars.registerHelper('stripScripts', function (str, options) {
  return Est.stripScripts(str);
});
