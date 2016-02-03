/**
 * @description status
 * @class status
 * @author yongjin<zjut_wyj@163.com> 2015/7/23
 */
// 音乐地址
app.addStatus('music', [
  {text: '无音乐', value: '-'},
  {text: '新年財神到 (30S).mp3', value: 'xncsd'},
  {text: '恭喜發財舞曲 (30S).mp3', value: 'gxfcwq'},
  {text: '舞龍鳳 (30S).mp3', value: 'wlf'},
  {text: '花與夢', value: 'hxm'},
  {text: '邂逅', value: 'xg'},
  {text: 'This Ring', value: 'This Ring'},
  {text: 'Canon in D Serenade', value: 'Canon in D Serenade'},
  {text: "She's A Rocket", value: "She's A Rocket"},
  {text: 'Russian Wedding', value: 'Russian Wedding'},
  {text: 'Spring Vivaldi', value: 'Spring Vivaldi'},
  {text: 'The Four Seasons(Winter)', value: 'The Four Seasons(Winter)'},
  {text: 'The Swan', value: 'The Swan'},
  {text: 'Wedding March', value: 'Wedding March'},
  {text: 'Marry_You', value: 'Marry_You'},
  {text: "50's stories", value: "50's stories"},
  {text: 'American Rodeo', value: 'American Rodeo'},
  {text: 'Canon in D major for Strings', value: 'Canon in D major for Strings'},
  {text: 'Dance with Me', value: 'Dance with Me'},
  {text: 'Fit To Be Tied-Band', value: 'Fit To Be Tied-Band'},
  {text: 'Jesu Joy', value: 'Jesu Joy'},
  {text: 'Marry_You', value: 'Marry_You'},
  {text: 'Make It Last', value: 'Make It Last'},
  {text: 'Ode To Joy', value: 'Ode To Joy'}
]);

// 音乐图标
app.addStatus('musicIcon', [
  { text: 'a', value: 'upload/j/j2/jihui88/picture/2015/04/02/d6b66a9f-6662-4670-9353-0a1075b16f6a.png' },
  { text: 'b', value: 'upload/j/j2/jihui88/picture/2015/04/07/985cff05-0f26-48d2-b146-4a12b3bf9e82.png' },
  { text: 'c', value: 'upload/j/j2/jihui88/picture/2015/04/09/e56b7fd6-7b1b-4e39-bb70-ad4b80be8208.png' }
]);


// 二维码
app.addStatus('qrCode', [
  { text: '5cm*5cm', value: '142' },
  { text: '10cm*10cm', value: '284' },
  { text: '20cm*20cm', value: '568' },
  { text: '30cm*30cm', value: '852' },
  { text: '50cm*50cm', value: '1420' },
  { text: '80cm*80cm', value: '2272' },
  { text: '100cm*100cm', value: '2840' }
]);

// 背景颜色
app.addStatus('backgroundColor', [
  { text: '透明', value: 'transparent' },
  { text: '白色', value: '#ffffff' ,rgb: 'rgb(255, 255, 255)'},
  { text: '米色', value: '#fedac2' ,rgb: 'rgb(254, 218, 194)'},
  { text: '天蓝', value: '#abedfa' ,rgb: 'rgb(171, 237, 250)'},
  { text: '楷体', value: '#eaeac6' ,rgb: 'rgb(234, 234, 198)'},
  { text: '黑体', value: '#bbe4e6' ,rgb: 'rgb(187, 228, 230)'},
  { text: '黑体', value: '#fac8f5' ,rgb: 'rgb(250, 200, 245)'},
  { text: '黑体', value: '#b7e775' ,rgb: 'rgb(183, 231, 117)'},
  { text: '黑体', value: '#e3f094' ,rgb: 'rgb(227, 240, 148)'},
  { text: '黑体', value: '#fdeb7a' ,rgb: 'rgb(253, 235, 122)'},
  { text: '黑体', value: '#cccccc' ,rgb: 'rgb(204, 204, 204)'},
  { text: '黑体', value: '#ccff33' ,rgb: 'rgb(204, 255, 51)'},
  { text: '黑体', value: '#ff6666' ,rgb: 'rgb(255, 102, 102)'},
  { text: '黑体', value: '#66ccff' ,rgb: 'rgb(102, 204, 255)'},
  { text: '黑体', value: '#ff0000' ,rgb: 'rgb(255, 0, 0)'},
  { text: '黑体', value: '#3399ff' ,rgb: 'rgb(51, 153, 255)'},
  { text: '黑体', value: '#ff9900' ,rgb: 'rgb(255, 153, 0)'},
  { text: '黑体', value: '#339966' ,rgb: 'rgb(51, 153, 102)'},
  { text: '黑体', value: '#ffff99' ,rgb: 'rgb(255, 255, 153)'},
  { text: '黑体', value: '#cc99ff' ,rgb: 'rgb(204, 153, 255)'},
  { text: '黑体', value: '#00ffff' ,rgb: 'rgb(0, 255, 255)'},
  { text: '黑体', value: '#66ffcc' ,rgb: 'rgb(102, 255, 204)'},
  { text: '黑体', value: '#999999' ,rgb: 'rgb(153, 153, 153)'},
  { text: '黑体', value: '#666666' ,rgb: 'rgb(102, 102, 102)'},
  { text: '黑体', value: '#21292b' ,rgb: 'rgb(33, 41, 43)'},
  { text: '黑体', value: '#cccc00' ,rgb: 'rgb(204, 204, 0)'},
  { text: '黑体', value: '#996633' ,rgb: 'rgb(153, 102, 51)'},
  { text: '黑体', value: '#66cccc' ,rgb: 'rgb(102, 204, 204)'},
  { text: '黑体', value: '#99cccc' ,rgb: 'rgb(153, 204, 204)'},
  { text: '黑体', value: '#ccffff' ,rgb: 'rgb(204, 255, 255)'},
  { text: '黑体', value: '#ccffcc' ,rgb: 'rgb(204, 255, 204)'},
  { text: '黑体', value: '#9999ff' ,rgb: 'rgb(153, 153, 255)'},
  { text: '黑体', value: '#66cc99' ,rgb: 'rgb(102, 204, 153)'},
  { text: '黑体', value: '#6666cc' ,rgb: 'rgb(102, 102, 204)'},
  { text: '黑体', value: 'rgba' ,rgb: 'rgba'}
]);

// 二维码背景颜色
app.addStatus('QrCodeBackgroundColor', [
  { text: '黑色', value: 'black', background: '#000000'},
  { text: '栗色', value: 'maroon', background: '#800000'},
  { text: '绿色', value: 'green', background: '#008000'},
  { text: '橄榄色', value: 'olive', background: '#808000'},
  { text: '藏青色', value: 'navy', background: '#000080'},
  { text: '紫色', value: 'purple', background: '#800080'},
  { text: '凫蓝', value: 'teal', background: '#008080'},
  { text: '灰色', value: 'gray', background: '#808080'},
  { text: '银色', value: 'silver', background: '#C0C0C0'},
  { text: '红色', value: 'red', background: '#FF0000'},
  { text: 'lime', value: 'lime', background: '#00FF00'},
  { text: '黄色', value: 'yellow', background: '#FFFF00'},
  { text: '蓝色', value: 'blue', background: '#0000FF'},
  { text: '紫红', value: 'fuchsia', background: '#FF00FF'},
  { text: '浅绿色', value: 'aqua', background: '#00FFFF'},
  { text: '白色', value: 'white', background: '#FFFFFF'},
  { text: 'aliceblue', value: 'aliceblue', background: '#F0F8FF'},
  { text: 'antiquewhite', value: 'antiquewhite', background: '#FAEBD7'},
  { text: 'aquamarine', value: 'aquamarine', background: '#7FFFD4'},
  { text: '', value: 'azure', background: '#F0FFFF'},
  { text: '', value: 'beige', background: '#F5F5DC'},
  { text: '', value: 'blueviolet', background: '#8A2BE2'},
  { text: '', value: 'brown', background: '#A52A2A'},
  { text: '', value: 'burlywood', background: '#DEB887'},
  { text: '', value: 'cadetblue', background: '#5F9EA0'},
  { text: '', value: 'chartreuse', background: '#7FFF00'},
  { text: '', value: 'chocolate', background: '#D2691E'},
  { text: '', value: 'coral', background: '#FF7F50'},
  { text: '', value: 'cornflowerblue', background: '#6495ED'},
  { text: '', value: 'cornsilk', background: '#FFF8DC'},
  { text: '', value: 'crimson', background: '#DC143C'},
  { text: '', value: 'darkblue', background: '#00008B'},
  { text: '', value: 'darkcyan', background: '#008B8B'},
  { text: '', value: 'darkgoldenrod', background: '#B8860B'},
  { text: '', value: 'darkgray', background: '#A9A9A9'},
  { text: '', value: 'darkgreen', background: '#006400'},
  { text: '', value: 'darkkhaki', background: '#BDB76B'},
  { text: '', value: 'darkmagenta', background: '#8B008B'},
  { text: '', value: 'darkolivegreen', background: '#556B2F'},
  { text: '', value: 'darkorange', background: '#FF8C00'},
  { text: '', value: 'darkorchid', background: '#9932CC'},
  { text: '', value: 'darkred', background: '#8B0000'},
  { text: '', value: 'darksalmon', background: '#E9967A'},
  { text: '', value: 'darkseagreen', background: '#8FBC8F'},
  { text: '', value: 'darkslateblue', background: '#483D8B'},
  { text: '', value: 'darkslategray', background: '#2F4F4F'},
  { text: '', value: 'darkturquoise', background: '#00CED1'},
  { text: '', value: 'darkviolet', background: '#9400D3'},
  { text: '', value: 'deeppink', background: '#FF1493'},
  { text: '', value: 'deepskyblue', background: '#00BFFF'},
  { text: '', value: 'dimgray', background: '#696969'},
  { text: '', value: 'dodgerblue', background: '#1E90FF'},
  { text: '', value: 'firebrick', background: '#B22222'},
  { text: '', value: 'floralwhite', background: '#FxFAF0'},
  { text: '', value: 'forestgreen', background: '#228B22'},
  { text: '', value: 'gainsboro', background: '#DCDCDC'},
  { text: '', value: 'ghostwhite', background: '#F8F8FF'},
  { text: '', value: 'gold', background: '#FFD700'},
  { text: '', value: 'goldenrod', background: '#DAA520'},
  { text: '', value: 'greenyellow', background: '#ADFF2F'},
  { text: '', value: 'honeydew', background: '#F0FFF0'},
  { text: '', value: 'hotpink', background: '#FF69B4'},
  { text: '', value: 'indianred', background: '#CD5C5C'},
  { text: '', value: 'indigo', background: '#4B0082'},
  { text: '', value: 'ivory', background: '#FFFFF0'},
  { text: '', value: 'khaki', background: '#F0E68C'},
  { text: '', value: 'lavender', background: '#E6E6FA'},
  { text: '', value: 'lavenderblush', background: '#FFF0F5'},
  { text: '', value: 'lawngreen', background: '#7CFC00'},
  { text: '', value: 'lemonchiffon', background: '#FFFACD'},
  { text: '', value: 'lightblue', background: '#ADD8E6'},
  { text: '', value: 'lightcoral', background: '#F08080'},
  { text: '', value: 'lightcyan', background: '#E0FFFF'},
  { text: '', value: 'lightgoldenrodyellow', background: '#FAFAD2'},
  { text: '', value: 'lightgreen', background: '#90EE90'},
  { text: '', value: 'lightgrey', background: '#D3D3D3'},
  { text: '', value: 'lightpink', background: '#FFB6C1'},
  { text: '', value: 'lightsalmon', background: '#FFA07A'},
  { text: '', value: 'lightseagreen', background: '#20B2AA'},
  { text: '', value: 'lightskyblue', background: '#87CEFA'},
  { text: '', value: 'lightslategray', background: '#778899'},
  { text: '', value: 'lightsteelblue', background: '#B0C4DE'},
  { text: '', value: 'lightyellow', background: '#FFFFE0'},
  { text: '', value: 'limegreen', background: '#32CD32'},
  { text: '', value: 'linen', background: '#FAF0E6'},
  { text: '', value: 'mediumaquamarine', background: '#66CDAA'},
  { text: '', value: 'mediumblue', background: '#0000CD'},
  { text: '', value: 'mediumorchid', background: '#BA55D3'},
  { text: '', value: 'mediumpurple', background: '#9370D0'},
  { text: '', value: 'mediumseagreen', background: '#3CB371'},
  { text: '', value: 'mediumslateblue', background: '#7B68EE'},
  { text: '', value: 'mediumspringgreen', background: '#00FA9A'},
  { text: '', value: 'mediumturquoise', background: '#48D1CC'},
  { text: '', value: 'mediumvioletred', background: '#C71585'},
  { text: '', value: 'midnightblue', background: '#191970'},
  { text: '', value: 'mintcream', background: '#F5FFFA'},
  { text: '', value: 'mistyrose', background: '#FFE4E1'},
  { text: '', value: 'moccasin', background: '#FFE4B5'},
  { text: '', value: 'navajowhite', background: '#FFDEAD'},
  { text: '', value: 'oldlace', background: '#FDF5E6'},
  { text: '', value: 'olivedrab', background: '#6B8E23'},
  { text: '', value: 'orange', background: '#FFA500'},
  { text: '', value: 'orangered', background: '#FF4500'},
  { text: '', value: 'orchid', background: '#DA70D6'},
  { text: '', value: 'palegoldenrod', background: '#EEE8AA'},
  { text: '', value: 'palegreen', background: '#98FB98'},
  { text: '', value: 'paleturquoise', background: '#AFEEEE'},
  { text: '', value: 'palevioletred', background: '#DB7093'},
  { text: '', value: 'papayawhip', background: '#FFEFD5'},
  { text: '', value: 'peachpuff', background: '#FFDAB9'},
  { text: '', value: 'peru', background: '#CD853F'},
  { text: '', value: 'pink', background: '#FFC0CB'},
  { text: '', value: 'plum', background: '#DDA0DD'},
  { text: '', value: 'powderblue', background: '#B0E0E6'},
  { text: '', value: 'rosybrown', background: '#BC8F8F'},
  { text: '', value: 'royalblue', background: '#4169E1'},
  { text: '', value: 'saddlebrown', background: '#8B4513'},
  { text: '', value: 'salmon', background: '#FA8072'},
  { text: '', value: 'sandybrown', background: '#F4A460'},
  { text: '', value: 'seagreen', background: '#2E8B57'},
  { text: '', value: 'seashell', background: '#FFF5EE'},
  { text: '', value: 'sienna', background: '#A0522D'},
  { text: '', value: 'skyblue', background: '#87CEEB'},
  { text: '', value: 'slateblue', background: '#6A5ACD'},
  { text: '', value: 'slategray', background: '#708090'},
  { text: '', value: 'snow', background: '#FFFAFA'},
  { text: '', value: 'springgreen', background: '#00Fx7F'},
  { text: '', value: 'steelblue', background: '#4682B4'},
  { text: '', value: 'tan', background: '#D2B48C'},
  { text: '', value: 'thistle', background: '#D8BFD8'},
  { text: '', value: 'tomato', background: '#FF6347'},
  { text: '', value: 'turquoise', background: '#40E0D0'},
  { text: '', value: 'violet', background: '#EE82EE'},
  { text: '', value: 'wheat', background: '#F5DEB3'},
  { text: '', value: 'whitesmoke', background: '#F5F5F5'},
  { text: '', value: 'yellowgreen', background: '#9ACD32'}
]);

// 背景图片
app.addStatus('backgroundImage', [
  { text: 'about:blank', value: '/leaflet/styles/default/img/bgimg/blank.png', custom: false},
  { text: '/leaflet/styles/default/img/bgimg/01_bg.png', value: '/leaflet/styles/default/img/bgimg/01.png', custom: false },
  { text: '/leaflet/styles/default/img/bgimg/02_bg.png', value: '/leaflet/styles/default/img/bgimg/02.png', custom: false },
  { text: '/leaflet/styles/default/img/bgimg/03_bg.png', value: '/leaflet/styles/default/img/bgimg/03.png', custom: false },
  { text: '/leaflet/styles/default/img/bgimg/04_bg.png', value: '/leaflet/styles/default/img/bgimg/04.png', custom: false },
  { text: '/leaflet/styles/default/img/bgimg/05_bg.png', value: '/leaflet/styles/default/img/bgimg/05.png', custom: false },
  { text: '/leaflet/styles/default/img/bgimg/06_bg.png', value: '/leaflet/styles/default/img/bgimg/06.png', custom: false },
  { text: '/leaflet/styles/default/img/bgimg/07_bg.png', value: '/leaflet/styles/default/img/bgimg/07.png', custom: false },
  { text: '/leaflet/styles/default/img/bgimg/11.jpg', value: '/leaflet/styles/default/img/bgimg/11.jpg', custom: false },
  { text: '/leaflet/styles/default/img/bgimg/12.jpg', value: '/leaflet/styles/default/img/bgimg/12.jpg', custom: false },
  { text: '/leaflet/styles/default/img/bgimg/13.jpg', value: '/leaflet/styles/default/img/bgimg/13.jpg', custom: false },
  { text: '/leaflet/styles/default/img/bgimg/14.jpg', value: '/leaflet/styles/default/img/bgimg/14.jpg', custom: false },
  { text: '/leaflet/styles/default/img/bgimg/15.jpg', value: '/leaflet/styles/default/img/bgimg/15.jpg', custom: false },
  { text: '/leaflet/styles/default/img/bgimg/16.jpg', value: '/leaflet/styles/default/img/bgimg/16.jpg', custom: false },
  { text: '/leaflet/styles/default/img/bgimg/17.jpg', value: '/leaflet/styles/default/img/bgimg/17.jpg', custom: false },
  { text: '/leaflet/styles/default/img/bgimg/18.jpg', value: '/leaflet/styles/default/img/bgimg/18.jpg', custom: false },
  { text: '/leaflet/styles/default/img/bgimg/19.jpg', value: '/leaflet/styles/default/img/bgimg/19.jpg', custom: false },
  { text: '/leaflet/styles/default/img/bgimg/21.jpg', value: '/leaflet/styles/default/img/bgimg/21.jpg', custom: false },
  { text: '/leaflet/styles/default/img/bgimg/22.jpg', value: '/leaflet/styles/default/img/bgimg/22.jpg', custom: false },
  { text: '/leaflet/styles/default/img/bgimg/23.jpg', value: '/leaflet/styles/default/img/bgimg/23.jpg', custom: false },
  { text: '/leaflet/styles/default/img/bgimg/25.jpg', value: '/leaflet/styles/default/img/bgimg/25.jpg', custom: false },
  { text: '/leaflet/styles/default/img/bgimg/26.jpg', value: '/leaflet/styles/default/img/bgimg/26.jpg', custom: false },
  { text: '/leaflet/styles/default/img/bgimg/28.jpg', value: '/leaflet/styles/default/img/bgimg/28.jpg', custom: false }
]);
// 载入动画
app.addStatus('loading', [
  { text: '/leaflet/styles/default/img/loading/loading.gif', value: '/leaflet/styles/default/img/loading/loading.gif' },
  { text: '/leaflet/styles/default/img/loading/loading_01.gif', value: '/leaflet/styles/default/img/loading/loading_01.gif' },
  { text: '/leaflet/styles/default/img/loading/loading_02.gif', value: '/leaflet/styles/default/img/loading/loading_02.gif' },
  { text: '/leaflet/styles/default/img/loading/puff.svg', value: '/leaflet/styles/default/img/loading/puff.svg' }
]);

// 字体
app.addStatus('fontFamily', [
  { text: '宋体', value: 'font-family:宋体,SimSun' },
  { text: '雅黑', value: 'Microsoft YaHei' },
  { text: '仿宋', value: '仿宋,仿宋_gb2312,fangsong_gb2312' },
  { text: '楷体', value: '楷体, 楷体_GB2312, SimKai' },
  { text: '黑体', value: '黑体, SimHei' }
]);

// 字体对齐对应选择符图标
app.addStatus('textAlign', [
  {text: 'sprite-design-text-align-left', value: 'left'},
  {text: 'sprite-design-text-align-center', value: 'center'},
  {text: 'sprite-design-text-align-right', value: 'right'}
]);

// 字体大小
app.addStatus('fontSize', [
  {text: 'sprite-design-font-size-h1', value: '2.4em'},
  {text: 'sprite-design-font-size-h2', value: '2em'},
  {text: 'sprite-design-font-size-h3', value: '1.8em'},
  {text: 'sprite-design-font-size-h4', value: '1.6em'},
  {text: 'sprite-design-font-size-h5', value: '1.4em'},
  {text: 'sprite-design-font-size-h6', value: '1.2em'},
  {text: 'sprite-design-font-size-h7', value: '1em'}
]);

app.addStatus('fontDisplay', [
  {text: 'sprite-design-font-show', value: 'display-show'},
  {text: 'sprite-design-font-hide', value: 'display-hide'}
]);

app.addStatus('organizePerson', [
  {text: 'sprite-design-opt-group', value: 'group'},
  {text: 'sprite-design-opt-person', value: 'person'}
]);
// 时间
app.addStatus('slideTime', [
  {text: 'sprite-design-opt-time1s', value: 1000},
  {text: 'sprite-design-opt-time3s', value: 3000},
  {text: 'sprite-design-opt-time5s', value: 5000},
  {text: 'sprite-design-opt-time8s', value: 8000}
]);
// 字体颜色
app.addStatus('fontColor', {
  '#ffffff': ['#000000', '#444444', '#888888', '#aaaaaa'],
  '#fedac2': ['#000000', '#ff7418', '#f14444', '#a25c18', '#b62450'],
  '#abedfa': ['#000000', '#0097b5', '#10945a', '#20897b', '#5f9600'],
  '#eaeac6': ['#000000', '#a2983f', '#a27241', '#88a241', '#a24941'],
  '#bbe4e6': ['#000000', '#3b8a8e', '#3b778f', '#5e8550', '#417d5b'],
  '#fac8f5': ['#000000', '#a13b97', '#a13b5d', '#bc5800', '#b72f2f'],
  '#b7e775': ['#000000', '#5f852a', '#85622a', '#bc5800', '#b72f2f'],
  '#e3f094': ['#000000', '#7f8c2f', '#85622a', '#b66c2a', '#a92e2e'],
  '#fdeb7a': ['#000000', '#ac9400', '#85622a', '#b66c2a', '#a92e2e'],
  '#000': ['#ffffff', '#000000', '#444444', '#888888', '#aaaaaa', '#ff7418', '#f14444', '#a25c18', '#b62450', '#a2983f', '#a27241', '#88a241', '#a24941', '#ac9400', '#85622a', '#b66c2a', '#a92e2e', '#3b8a8e', '#3b778f', '#5e8550', '#417d5b', '#a13b97', '#a13b5d', '#bc5800', '#b72f2f', '#5f852a', '#85622a', '#b66c2a', '#a92e2e', '#ac9400', '#85622a'],
  '#ccc': ['#000000', '#ac9400', '#85622a', '#b66c2a', '#a92e2e'],
  '#cf3': ['#000000', '#ac9400', '#85622a', '#b66c2a', '#a92e2e'],
  '#f66': ['#000000', '#ac9400', '#85622a', '#b66c2a', '#a92e2e'],
  '#6cf': ['#000000', '#ac9400', '#85622a', '#b66c2a', '#a92e2e'],
  '#f00': ['#000000', '#ac9400', '#85622a', '#b66c2a', '#a92e2e'],
  '#39f': ['#000000', '#ac9400', '#85622a', '#b66c2a', '#a92e2e'],
  '#f90': ['#000000', '#ac9400', '#85622a', '#b66c2a', '#a92e2e'],
  '#396': ['#000000', '#ac9400', '#85622a', '#b66c2a', '#a92e2e'],
  '#ff9': ['#000000', '#ac9400', '#85622a', '#b66c2a', '#a92e2e'],
  '#c9f': ['#000000', '#ac9400', '#85622a', '#b66c2a', '#a92e2e'],
  '#0ff': ['#000000', '#ac9400', '#85622a', '#b66c2a', '#a92e2e'],
  '#6fc': ['#000000', '#ac9400', '#85622a', '#b66c2a', '#a92e2e'],
  '#999': ['#000000', '#ac9400', '#85622a', '#b66c2a', '#a92e2e'],
  '#666': ['#000000', '#ac9400', '#85622a', '#b66c2a', '#a92e2e'],
  '#cc0': ['#000000', '#ac9400', '#85622a', '#b66c2a', '#a92e2e'],
  '#963': ['#000000', '#ac9400', '#85622a', '#b66c2a', '#a92e2e'],
  '#6cc': ['#000000', '#ac9400', '#85622a', '#b66c2a', '#a92e2e'],
  '#9cc': ['#000000', '#ac9400', '#85622a', '#b66c2a', '#a92e2e'],
  '#cff': ['#000000', '#ac9400', '#85622a', '#b66c2a', '#a92e2e'],
  '#cfc': ['#000000', '#ac9400', '#85622a', '#b66c2a', '#a92e2e'],
  '#99f': ['#000000', '#ac9400', '#85622a', '#b66c2a', '#a92e2e'],
  '#6c9': ['#000000', '#ac9400', '#85622a', '#b66c2a', '#a92e2e'],
  '#66c': ['#000000', '#ac9400', '#85622a', '#b66c2a', '#a92e2e']
});

// 留言表单字段
app.addStatus('fields', [
  {type: 'InputUnit', label: '姓&nbsp;名', name: 'name', value: '', required: '02', type: 'text', showLabel: '01', placeholder: '', inputBg: '/leaflet/styles/default/img/input-bg.jpg'},
  {type: 'InputUnit', label: '手&nbsp;机', name: 'mobile', value: '', required: '02', type: 'text', showLabel: '01', placeholder: '', inputBg: '/leaflet/styles/default/img/input-bg.jpg'},
  {type: 'InputUnit', label: '邮&nbsp;箱', name: 'email', value: '', required: '02', type: 'text', showLabel: '01', placeholder: '', inputBg: '/leaflet/styles/default/img/input-bg.jpg'},
  {type: 'InputUnit', label: 'Q&nbsp;Q', name: 'qq', value: '', required: '02', type: 'text', showLabel: '01', placeholder: '', inputBg: '/leaflet/styles/default/img/input-bg.jpg'},
  {type: 'InputUnit', label: '公&nbsp;司', name: 'company', value: '', required: '02', type: 'text', showLabel: '01', placeholder: '', inputBg: '/leaflet/styles/default/img/input-bg.jpg'},
  {type: 'InputUnit', label: '电&nbsp;话', name: 'phone', value: '', required: '02', type: 'text', showLabel: '01', placeholder: '', inputBg: '/leaflet/styles/default/img/input-bg.jpg'},
  {type: 'InputUnit', label: '微&nbsp;博', name: 'weibo', value: '', required: '02', type: 'text', showLabel: '01', placeholder: '', inputBg: '/leaflet/styles/default/img/input-bg.jpg'},
  {type: 'InputUnit', label: '称&nbsp;呼', name: 'appellation', value: '', required: '02', type: 'text', showLabel: '01', placeholder: '', inputBg: '/leaflet/styles/default/img/input-bg.jpg'},
  {type: 'InputUnit', label: '职&nbsp;位', name: 'position', value: '', required: '02', type: 'text', showLabel: '01', placeholder: '', inputBg: '/leaflet/styles/default/img/input-bg.jpg'},
  {type: 'InputUnit', label: '地&nbsp;址', name: 'address', value: '', required: '02', type: 'text', showLabel: '01', placeholder: '', inputBg: '/leaflet/styles/default/img/input-bg.jpg'},
  {type: 'InputUnit', label: '备&nbsp;注', name: 'note', value: '', required: '02', type: 'text', showLabel: '01', placeholder: '', inputBg: '/leaflet/styles/default/img/input-bg.jpg'}
]);

app.addStatus('videoDemo', [
  {
    className: 'sprite-design sprite-design-logo-youku',
    url: '<iframe height=498 width=510 src="http://player.youku.com/embed/XNzA0MDY1NTYw" frameborder=0 allowfullscreen></iframe>',
    demoUrl: 'http://www.youku.com',
    demoName: '优酷视频'
  },
  {
    className: 'sprite-design sprite-design-logo-tudou',
    url: '<iframe src="http://www.tudou.com/programs/view/html5embed.action?type=0&code=JoDVMiOv6l8&lcode=&resourceId=0_06_05_99" allowtransparency="true" allowfullscreen="true" allowfullscreenInteractive="true" scrolling="no" border="0" frameborder="0" style="width:480px;height:400px;"></iframe>',
    demoUrl: 'http://www.tudou.com/',
    demoName: '土豆视频'
  },
  {
    className: 'sprite-design sprite-design-logo-txsp',
    url: '<iframe frameborder="0" width="640" height="498" src="http://v.qq.com/iframe/player.html?vid=d0127i3250o&tiny=0&auto=0" allowfullscreen></iframe>',
    demoUrl: 'http://v.qq.com/',
    demoName: '腾讯视频'
  }
]);

app.addStatus('iframeDemo', [
  {
    className: 'sprite-design sprite-design-logo-jhw',
    url: 'http://www.jihui88.com',
    demoUrl: 'http://www.jihui88.com',
    demoName: '机汇网首页'
  }
]);

app.addStatus('publishTime', [
  { text: '一天', value: '1' },
  { text: '一周', value: '7' },
  { text: '一月', value: '30' },
  { text: '三月', value: '90' },
  { text: '半年', value: '180' },
  { text: '一年', value: '360' },
  { text: '永久', value: '0' }
]);

app.addStatus('dateYear', [
  { text: 'Jan', value: '1' },
  { text: 'Feb', value: '2' },
  { text: 'Mar', value: '3' },
  { text: 'Apr', value: '4' },
  { text: 'May', value: '5' },
  { text: 'Jun', value: '6' },
  { text: 'Jul', value: '7' },
  { text: 'Aug', value: '8' },
  { text: 'Sep', value: '9' },
  { text: 'Oct', value: '10' },
  { text: 'Nov', value: '11' },
  { text: 'Dec', value: '12' }
]);

app.addStatus('activeList', [
  {activeType: 'Rotary', name: '超级大转盘', src: 'images/design/active/zhuanpan.jpg'},
  {activeType: 'Share', name: '疯狂转发', src: 'images/design/active/zhuanfa.jpg'}
]);

app.addStatus('borderList', [
  { text: '直线', value: 'solid' },
  { text: '破折线', value: 'dashed' },
  { text: '点状线', value: 'dotted' },
  { text: '双划线', value: 'double' },
  { text: '3D凹槽', value: 'groove' },
  { text: '3D垄状', value: 'ridge' },
  { text: '3D内嵌', value: 'inset' },
  { text: '3D外嵌', value: 'outset' }
]);
app.addStatus('moduleType', [
  /*{text: '全部', value: 'zx', title: '查看全部案例'},*/
  {text: '封面', value: 'bg', title: '起始页面、过渡页面、结束页面等'},
  {text: '介绍', value: 'tc', title: '公司介绍、人物介绍等'},
  {text: '展示', value: 'tw', title: '产品展示、作品展示等'},
  {text: '表单', value: 'tj', title: '客户留言、互动等'},
  {text: '功能', value: 'gn', title: ''},
  {text: '其它', value: 'hd', title: '表格、统计、图表、宣传、促销、使用说明、售后服务等'}
]);


app.addStatus('moduleResizable', {
  'CanvasModule': true,
  'SlideModule': true,
  'ActiveModule': true,
  'MapModule': true,
  'IframeModule': true,
  'VideoModule': true
});
app.addStatus('unitList', {
  'PhotoUnit': ['createImageNode', 'createCropNode', 'createBeautifyNode'],
  'TextUnit': ['createTextEditNode'],
  'ShapeUnit': ['createSvgFillEditNode', 'createSvgFillNode'],
  'LineUnit': ['createBorderColorNode'],
  'OtherUnit': ['createBackgroundColorNode', 'createBackgroundImageNode'],
  'TipUnit': ['createBackgroundColorNode', 'createBackgroundImageNode'],
  'MobileUnit': ['createMobileEditNode', 'createImageNode'],
  'QrCodeUnit': ['createQrCodeNode'],
  'MusicUnit': ['createImageNode', 'createBackgroundColorNode'],
  'ShareUnit': [],
  'OrganizeUnit': ['createOrganizeEditNode'],
  'InputUnit': [],
  'ButtonUnit': [],
  'ButtonMessageUnit': [],
  'ShareRandUnit': ['createButtonEditNode', 'createImageNode'],
  'MessageListUnit': ['createImageNode'],
  'VideoUnit': ['createVideoEditNode'],
  'SlideUnit': ['createSlideEditNode'],
  'MapUnit': ['createMapEditNode'],
  'AwardUnit': ['createImageNode', 'createTextEditNode', 'createCropNode', 'createBeautifyNode'],
  'SelectUnit': ['createSelectEditNode'],
  'DateTimeUnit': ['createDateTimeEditNode'],
  'OneSelectUnit': ['createOneSelectEditNode'],
  'MultiSelectUnit': ['createMultiSelectEditNode'],
  'PayProductUnit': ['createButtonEditNode', 'createImageNode'],
  'PayProductOrderUnit': ['createButtonEditNode', 'createImageNode'],
  'LotteryUnit': ['createLotteryEditNode'],
  'VoteUnit': ['createVoteEditNode'],
  'TextScrollUnit': ['createTextScrollEditNode']
});
// design: true  是否在设计页面起作用
// wxScope: true 是否开启微信授权
// page: true    是否分屏起作用
app.addStatus('unitPlugin', {
  'MessageListUnit': {plugins: ['MessageListPlugin'], design: true, wxScope: true},
  'ButtonMessageUnit': {plugins: ['ButtonMessagePlugin'], design: false},
  'MapUnit': {plugins: ['MapPlugin'], design: true},
  'LotteryUnit': {plugins: ['LotteryPlugin'], design: true},
  'AwardUnit': {plugins: ['AwardPlugin']},
  'PayProductUnit': {plugins: ['PayProductPlugin'], wxScope: true},
  'SelectUnit': {plugins: ['SelectPlugin']},
  'OneSelectUnit': {plugins: ['OneSelectPlugin']},
  'MultiSelectUnit': {plugins: ['MultiSelectPlugin']},
  'DateTimeUnit': {plugins: ['DateTimePlugin']},
  'SlideUnit': {plugins: ['SlidePlugin'], design: true},
  'VoteUnit': {plugins: ['VotePlugin'], design: true},
  'TextScrollUnit': {plugins: ['TextScrollPlugin'], design: true}
});
app.addStatus('pluginRequire', {
  'DateTimePlugin': ['<link rel="stylesheet" href="styles/default/zepto.mdatetimer.css"/>']
});

app.addStatus('backgroundRepeat', [
  {repeat: 'no-repeat', size: 'auto', position: '0% 0%', name: '默认', title: '左上对齐，不平铺'},
  {repeat: 'repeat', size: 'auto', position: '0% 0%', name: '平铺', title: '左上对齐，平铺'},
  {repeat: 'repeat', size: 'cover', position: '50% 50%', name: '拉伸', title: '自适应'},
  {repeat: 'no-repeat', size: 'auto', position: '50% 50%', name: '居中', title: '上下左右，居中对齐'},
  {repeat: 'no-repeat', size: '100% 100%', position: '0% 0%', name: '铺满', title: '宽度高度100%'},
  {repeat: 'no-repeat', size: '100%', position: '0% 0%', name: '居上', title: '上对齐'},
  {repeat: 'no-repeat', size: '100%', position: '0% 100%', name: '居下', title: '下对齐'}
]);

//音乐 music
app.addStatus('musicCategory', [
  { text: '最新', value: '' },
  { text: '轻松', value: '8'},
  { text: '美好', value: '7' },
  { text: '励志', value: '6' },
  { text: '伤感', value: '5' },
  { text: '甜蜜', value: '4' },
  { text: '欢快', value: '3' },
  { text: '安静', value: '2' }
]);

app.addStatus('publishUrl', [
  {url: '#/home'},
  {url: '#/new'},
  {url: '#/market'},
  {url: '#/home_outsourcing'},
  {url: '#/buy'}
]);