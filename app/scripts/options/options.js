/**
 * @description options
 * @class options
 * @author yongjin<zjut_wyj@163.com> 2015/9/19
 */
app.addOption('dialog_min', {
  title: null,
  cover: false,
  autofocus: false,
  width: 340,
  align: 'right top',
  skin: 'dialog_min',
  quickClose: true,
  hideOkBtn: true,
  hideSaveBtn: true,
  hideCloseBtn: true
});
app.addOption('baseLayout', {
  style: 'background-color: #ffffff;',
  backgroundColor: { backgroundColor: '#ffffff' },
  fontFamily: {fontFamily: 'font-family:宋体,SimSun'},
  backgroundImage: {backgroundImage: 'about:blank', backgroundRepeat: 'repeat'},
  loading: {src: '/leaflet/styles/default/img/loading/puff.svg'},
  music: '',
  plugins: []
});
