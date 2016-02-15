/**
 * @description 模块功能说明
 * @class ModuleName
 * @author yongjin<zjut_wyj@163.com> 2016/2/6
 */
define('UiData', [], function(require, exports, module) {
  var UiData;


  var tree = [
    { sort: 1, isroot: "01", categoryId: "Category_00000000000000000258116", belongId: null, name: "默认分类" },
    { sort: 2, isroot: "01", categoryId: "Category_00000000000000000294928", belongId: null, name: "数码产品" },
    { sort: 3, isroot: "00", categoryId: "Category_00000000000000000294929", belongId: "Category_00000000000000000294928", name: "手机" },
    { sort: 4, isroot: "00", categoryId: "Category_00000000000000000294930", belongId: "Category_00000000000000000294928", name: "电脑" },
    { sort: 5, isroot: "00", categoryId: "Category_00000000000000000294931", belongId: "Category_00000000000000000294928", name: "相机" },
    { sort: 6, isroot: "00", categoryId: "Category_00000000000000000294934", belongId: "Category_00000000000000000294929", name: "华为" },
    { sort: 7, isroot: "00", categoryId: "Category_00000000000000000294935", belongId: "Category_00000000000000000294929", name: "魅族" },
    { sort: 8, isroot: "00", categoryId: "Category_00000000000000000294936", belongId: "Category_00000000000000000294929", name: "VIVO" },
    { sort: 9, isroot: "00", categoryId: "Category_00000000000000000294932", belongId: "Category_00000000000000000294929", name: "小米" },
    { sort: 10, isroot: "00", categoryId: "Category_00000000000000000294933", belongId: "Category_00000000000000000294929", name: "苹果" },
    { sort: 11, isroot: "00", categoryId: "Category_00000000000000000294938", belongId: "Category_00000000000000000294930", name: "索尼" },
    { sort: 12, isroot: "00", categoryId: "Category_00000000000000000294937", belongId: "Category_00000000000000000294930", name: "苹果" },
    { sort: 13, isroot: "00", categoryId: "Category_00000000000000000300846", belongId: "Category_00000000000000000294929", name: "中兴" }
  ];

  var select = [
    { belongId: "Syscode_000000000000000000000560", categoryId: "Category_00000000000000000087665", sonCate: null, sort: 12, isroot: "01", isdisplay: "1", name: "短包" },
    { belongId: "Syscode_000000000000000000000560", categoryId: "Category_00000000000000000087666", sonCate: null, sort: 13, isroot: "01", isdisplay: "1", name: "中包" },
    { belongId: "Syscode_000000000000000000000560", categoryId: "Category_00000000000000000087661", sonCate: null, sort: 14, isroot: "01", isdisplay: "1", name: "手提包" },
    { belongId: "Syscode_000000000000000000000560", categoryId: "Category_00000000000000000087667", sonCate: null, sort: 15, isroot: "01", isdisplay: "1", name: "休闲包" },
    { belongId: "Category_00000000000000000087661", categoryId: "Category_00000000000000000087662", sonCate: null, sort: 16, isroot: "00", isdisplay: "1", name: "男式" },
    { belongId: "Category_00000000000000000087661", categoryId: "Category_00000000000000000087663", sonCate: null, sort: 17, isroot: "00", isdisplay: "1", name: "女式" },
    { belongId: "Category_00000000000000000087661", categoryId: "Category_00000000000000000087664", sonCate: null, sort: 18, isroot: "00", isdisplay: "1", name: "儿童" },
    { belongId: "Category_00000000000000000087663", categoryId: "Category_00000000000000000087671", sonCate: null, sort: 19, isroot: "00", isdisplay: "1", name: "蓝色" },
    { belongId: "Category_00000000000000000087663", categoryId: "Category_00000000000000000087672", sonCate: null, sort: 20, isroot: "00", isdisplay: "1", name: "红色" },
    { belongId: "/", categoryId: "Category_00000000000000000276671", sonCate: null, sort: 20, isroot: "01", name: "本色一类-八类花" }
  ];

  var tab = [
    { text: '最新', moduleId: 'HomeIntro', sortType: 'addTime' }, // 若存在moduleId,则配置项里require是否为false,都会根据模块类型渲染，el默认为nodeId
    { text: '浏览量', moduleId: 'HomeOutsourcing', sortType: 'views' }, // 若存在oneRender: true,则只渲染一次， 否则实时
    { text: '转发量', moduleId: 'Buy', sortType: 'mviews' },
    { text: '反馈量', moduleId: 'CaseList', sortType: 'rviews' }
  ];
  var item_check = [
    { text: 'a', value: 'value_a' },
    { text: 'b', value: 'value_b' },
    { text: 'c', value: 'value_c' },
    { text: 'd', value: 'value_d' },
    { text: 'e', value: 'value_e' }
  ];

  var list = [
    { text: '[1]点击选中我' },
    { text: '[2]点击选中我' },
    { text: '[3]点击选中我' },
    { text: '[4]点击选中我' },
    { text: '[5]点击选中我' },
    { text: '[6]点击选中我' },
    { text: '[7]点击选中我' },
    { text: '[8]点击选中我' },
    { text: '[9]点击选中我' },
    { text: '[10]点击选中我' },
    { text: '[11]点击选中我' },
    { text: '[12]点击选中我' },
    { text: '[13]点击选中我' },
    { text: '[14]点击选中我' },
    { text: '[15]点击选中我' },
    { text: '[16]点击选中我' },
    { text: '[17]点击选中我' },
    { text: '[18]点击选中我' },
    { text: '[19]点击选中我' },
    { text: '[20]点击选中我' },
    { text: '[21]点击选中我' },
    { text: '[22]点击选中我' },
    { text: '[23]点击选中我' },
    { text: '[24]点击选中我' },
    { text: '[25]点击选中我' },
    { text: '[26]点击选中我' },
    { text: '[27]点击选中我' },
    { text: '[28]点击选中我' },
    { text: '[29]点击选中我' },
    { text: '[30]点击选中我' },
    { text: '[31]点击选中我' },
    { text: '[32]点击选中我' },
    { text: '[33]点击选中我' },
    { text: '[34]点击选中我' },
    { text: '[35]点击选中我' },
    { text: '[36]点击选中我' }
  ];

  UiData = {
    tab: tab,
    item_check: item_check,
    list: list,
    select: select,
    tree: tree
  };

  module.exports = UiData;
});
