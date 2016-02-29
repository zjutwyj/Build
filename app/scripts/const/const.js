/**
 * @description 全局常量
 * @namespace const
 * @author yongjin<zjut_wyj@163.com> 2014/12/18
 */
/**
 * 全局常量
 * */
var CONST = {
  HOST: 'http://sj.jihui88.com/mobile',
  API: 'http://sj.jihui88.com/rest/api',
  PUBLIC_API: 'http://www.jihui88.com/rest',
  DOMAIN: 'http://sj.jihui88.com',
  STATIC_URL: 'http://www.jihui88.com',
  DOMAIN_TAIL: 'jihui88.com', // 去http://
  PIC_URL: 'http://img.jihui88.com/sj',
  PIC_URL_ADMIN: 'http://img.easthardware.com',
  CDN: 'http://img.jihui88.com/sj/cnd/mobile', // 修改后记得改gulpfile里的cdn_root
  MUSIC_URL: 'http://f.jihui88.com',
  SEP: '/',
  PIC_NONE: '/mobile/images/nopic.png?v=001',
  BG_NONE: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAIAAADZF8uwAAAAGUlEQVQYV2M4gwH+YwCGIasIUwhT25BVBADtzYNYrHvv4gAAAABJRU5ErkJggg==',
  PIC_LOADING: 'upload/j/j2/jihui88/picture/2015/04/01/b772bcb5-14ab-43a7-b22c-a3ba257d0936.gif',
  ENTER_KEY: 13,
  COLLAPSE_SPEED: 50,
  SUBMIT_TIP: '提交中...<span style="color:orange;font-size: 12px;">[提交无反馈?请检查提交的内容格式是否下正确]</span>',
  AJAX_TIMEOUT: 10000,
  EXPERIENCE: false,
  HEIGHT_WINDOW: typeof $ === 'undefined' ? 0 : $(window).height(),
  UEDITOR_MIN: ["fontfamily", "fontsize", "fontplus", "fontminus", "forecolor", "backcolor", "bold", "italic", "underline", "justifyleft", "justifycenter", "justifyright", "justifyjustify", "lineheightplus", "lineheightminus", "link", 'removeformat', "undo", "redo"],
  UEDITOR_COMM: ["pasteplain", "undo", "redo", 'removeformat', "imgupload", "link", "|"], // 通用
  UEDITOR_FONT: ["bold", "italic", "underline", "forecolor", "backcolor", "fontfamily", "fontsize", "paragraph", "|"], // 字体
  UEDITOR_TYPESET: ["justifyleft", "justifycenter", "justifyright", "justifyjustify", "|", "rowspacingtop", "rowspacingbottom", "rowspacingleft", "rowspacingright", "lineheight", "insertunorderedlist", "|"], // 排版
  UEDITOR_TABLE: ['inserttable', 'deletetable', 'insertparagraphbeforetable', 'insertrow', 'deleterow', 'insertcol',
    'deletecol', 'mergecells', 'mergeright', 'mergedown', 'splittocells', 'splittorows', 'splittocols', 'charts', '|'
  ], // 表格
  UEDITOR_OTHER: [], // 其它
  LANG: {
    NOT_LOGIN: '未登录', // 后台返回“未登录”
    SUBMIT: '提交中..',
    COMMIT: '提交',
    SAVE: '保存',
    EDIT: '修改',
    CONFIRM: '确定',
    CLOSE: '关闭',
    ADD: '添加',
    ADD_CONTINUE: '继续添加',
    TIP: '提示',
    SUCCESS: '操作成功',
    WARM_TIP: '温馨提示',
    DEL_TIP: '该分类下还有子分类， 请先删除子分类！',
    DEL_CONFIRM: '是否删除?',
    AUTH_FAILED: '权限验证失败', // 后台返回
    AUTH_LIMIT: '权限不够',
    LOAD_ALL: '已全部加载',
    NO_RESULT: '暂无数据',
    SELECT_ONE: '请至少选择一项',
    DEL_SUCCESS: '删除成功',
    REQUIRE_FAILED: '数据异常, 稍后请重试！',
    SELECT_DEFAULT: '请选择',
    UPLOAD_OPTION_REQUIRE: '图片上传配置不能为空',
    UPLOAD_IMG: '上传图片',
    INSERT_CONTACT: '插入联系方式',
    SELECT_MAP: '选择Google/Baidu地圖',
    SELECT_TPL: '选择模版',
    BUILD_QRCODE: '生成二维码',
    SELECT_IMG: '选择图片',
    SELECT_FLASH: '选择flash',
    SELECT_QQ: '选择QQ/MSN/Skype/阿里旺旺/淘宝旺旺',
    VIEW: '浏览',
    DIALOG_TIP: '对话框',
    WIN_TIP: '窗口',
    INFO_TIP: '提示信息：',
    CANCEL: '取消',
    JSON_TIP: '您的浏览器版本过低， 请升级到IE9及以上或下载谷歌浏览器(https://www.google.com/intl/zh-CN/chrome/browser/desktop/index.html)！'
  }
};
window.CONST = CONST;
