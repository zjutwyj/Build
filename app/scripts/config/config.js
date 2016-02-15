/**
 * @description config
 * @namespace config
 * @author yongjin on 2014/7/18
 */

/**
 * seajs 配置
 * */
seajs.config({

  // Sea.js 的基础路径
  base: CONST.HOST,

  // 别名配置
  alias: Est.extend({
    'dialog-plus': 'vendor/artDialog_v6/dialog-plus.min.js'
  }, app.getModules()),

  // 路径配置
  paths: {
    bui: CONST.HOST + '/vendor/bui'
  },

  // 变量配置
  vars: {
    'locale': 'zh-cn'
  },

  // 映射配置
  map: [
    [/^(.*\.(?:css|js|html))(.*)$/i, '$1?' + CONST.APP_VERSION]
  ],

  // 调试模式
  debug: Est.typeOf(CONST.DEBUG_SEAJS) === 'undefined' ? false : CONST.DEBUG_SEAJS,

  // 文件编码
  charset: 'utf-8'
});
/**
 * 注册模板
 * */
Est.each(app.getTemplates(), function(value, key) {
  define(key, value);
});
