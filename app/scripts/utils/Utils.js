/**
 * @description Utils
 * @class Utils - 工具类
 * @author yongjin<zjut_wyj@163.com> 2014/12/2
 */
var Utils = {
  /**
   * 初始化选择框
   *
   * @method [表单] - initSelect
   * @param options [target: '#category'  input元素选择符][render: '#s1' 渲染到哪个DIV下]
   * [itemId: 'value' 相应ID][width: 宽度][items: [] 列表][change: 选项改变回调方法]
   * @return {Est.promise}
   * @author wyj 14.12.18
   * @example
   *      Utils.initSelect({
       *         render: '#s1',
       *         target: '#model-parentId',
       *         items: [],
       *         itemId: 'value', // 默认为value
       *         change: function(item){
       *           console.log(item.changeId);
       *         }
       *       });
   */
  initSelect: function (options) {
    BaseUtils.execute('initSelect', options);
  },
  /**
   * 初始化级联地区
   *
   * @method [地区] - initDistrict
   * @author wyj 15.1.6
   * @example
   Utils.initDistrict({
                 id: 'district1' ,// 必填
                 render: '#district-container', // 目标选择符
                 target: '#model-dist',
                 path: '...',
                 url: CONST.API + '/shop/receiver/list' // 自定义请求地址
               });
   */
  initDistrict: function (options) {
    BaseUtils.execute('initDistrict', options);
  },
  /**
   * 初始化tab选项卡
   *
   * @method [选项卡] - initTab
   * @param options
   * @author wyj 14.12.24
   * @example
   *        Utils.initTab({
       *          render: '#tab',
       *          elCls: 'nav-tabs',
       *          panelContainer: '#panel',
       *          autoRender: true,
       *          children: [
       *            {title: '常规', value: '1', selected: true},
       *            {title: '产品描述', value: '2'},
       *            {title: '产品属性', value: '3'},
       *            {title: '商城属性', value: '4'},
       *            {title: '产品标签', value: '5'},
       *            {title: '搜索引擎优化', value: '6'}
       *          ],
       *          change: function(ev){ // 点击标签页面回调事件
       *              console.log(ev);
       *          }
       *        });
   */
  initTab: function (options) {
    BaseUtils.execute('initTab', options);
  },
  /**
   * 初始化button tab选项卡
   *
   * @method [选项卡] - initButtonTab
   * @param options
   * @author wyj 14.12.24
   * @example
   *        Utils.initButtonTab({
       *          render: '#tab',
       *          elCls: 'button-tabs',
       *          autoRender: true,
       *          children: [
       *            {title: '常规', value: '1', selected: true},
       *            {title: '产品描述', value: '2'},
       *            {title: '产品属性', value: '3'},
       *            {title: '商城属性', value: '4'},
       *            {title: '产品标签', value: '5'},
       *            {title: '搜索引擎优化', value: '6'}
       *          ],
       *          change: function(ev){ // 点击标签页面回调事件
       *              console.log(ev);
       *          }
       *        });
   */
  initButtonTab: function (options) {
    BaseUtils.execute('initButtonTab', options);
  },
  /**
   * 初始化下拉框
   * @method initDropDown
   * @param options
   * @author wyj 15.2.17
   * @example
   *      BaseUtils.initDropDown({
            target: '#drop-down-content', // 显示下拉框的触发按钮
            height: 250, // 默认为auto
            width: 150, // 默认为auto
            //overflowX: 'auto', // 默认为hidden
            content: $('#template-drop-down').html(), // 显示内容
            callback: function (options) { // 下拉框渲染完成后的回调函数
                setTimeout(function(){
                    app.getView(options.dropDownId).reflesh(function () { // 刷新
                        this._options.items = ['111']; // 重新设置options参数里的items
                    });
                    app.getView(options.dropDownId).hide(); // dropDownId 为当前下拉框的viewId
                }, 1000);
            }
        });
   Utils.initDropDown({
            target: '#drop-down-module-id',
            moduleId: 'AttributesAdd',
            items: ['111', '222', '333'],
            callback: function(options){
                setTimeout(function(){
                    app.getView(options.dropDownId).hide();
                }, 1000);
            }
        });
   */
  initDropDown: function (options) {
    BaseUtils.execute('initDropDown', options);
  },
  /**
   * 初始化日期选择器
   *
   * @method [表单] - initDate
   * @param options [render: 选择符][showTime: true/false 是否显示时间]
   * @author wyj 14.12.17
   * @example
   *      Utils.initDate({
       *         render: '.calendar',
       *         showTime: false
       *       });
   */
  initDate: function (options) {
    BaseUtils.execute('initDate', options);
  },
  /**
   * 初始化多标签
   *
   * @method [表单] - initCombox
   * @param options
   * @return {Est.promise}
   * @author wyj 14.12.17
   * @example
   *      Utils.initCombox({
       *         render: '#tag',
       *         target: '#model-tag',
       *         itemId: 'categoryId'
       *           items: [ '选项一', '选项二', '选项三', '选项四' ]
       *       });
   */
  initCombox: function (options) {
    return BaseUtils.execute('initCombox', options);
  },
  /**
   * 初始化编辑器
   *
   * @method [表单] - initEditor
   * @param options
   * @author wyj 14.12.18
   * @example
   *      Utils.initEditor({
       *        render: '.ckeditor'
       *      });
   */
  initEditor: function (options) {
    BaseUtils.execute('initEditor', options);
  },
  /**
   * 初始化内联编辑器
   * @method [编辑器] - initInlineEditor
   * @author wyj 15.6.11
   * @example
   *      Utils.initInlineEditor($('#text-node'), function(){
   *        ...
   *      });
   */
  initInlineEditor: function (target, callback) {
    BaseUtils.execute('initInlineEditor', target, callback);
  },
  /**
   * 初始化拖动
   * @method [拖放] - initDrag
   * @param optoins
   * @author wyj 15.03.24
   * @example
   *      Utils.initDrag({
     *        render: '.dragAble',
     *        callback: function(ev, dd){}
     *      });
   */
  initDrag: function (options) {
    BaseUtils.execute('initDrag', options);
  },
  /**
   * 初始化拖动 left top width 百分比
   * @method [拖放] - initDragP
   * @param optoins
   * @author wyj 15.03.24
   * @example
   *      Utils.initDragP({
     *        render: '.dragAble',
     *        callback: function(ev, dd){}
     *      });
   */
  initDragP: function (options) {
    BaseUtils.execute('initDragP', options);
  },
  /**
   * 初始化缩放
   * @method [缩放] - initResize
   * @param optoins
   * @author wyj 15.03.24
   * @example
   *      Utils.initResize({
     *        render: 'img',
     *        callback: function(ev, dd){}
     *      });
   */
  initResize: function (options) {
    BaseUtils.execute('initResize', options);
  },
  /**
   * 初始化复制按钮
   *
   * @method [复制] - initCopy
   * @param selecter
   * @param options
   * @author wyj 14.12.18
   * @example
   *        Utils.initCopy('#photo-copy-dialog', {
       *           success: function(){
       *             window.copyDialog.close();
       *           }
       *         });
   *
   */
  initCopy: function (selecter, options) {
    BaseUtils.execute('initCopy', selecter, options, Est.proxy(function () {
      this.tip('<div style="padding: 20px;">复制成功</div>', {
        time: 1000
      });
    }, this));
  },
  /**
   * 初始化动画
   * @method [动画] - initAnimate
   * @param target
   * @author wyj 15.3.30
   * @example
   *
   *    Utils.initAnimate(this);
   */
  initAnimate: function (target) {
    BaseUtils.execute('initAnimate', target);
  },
  /**
   * 初始化图片选取组件
   * @method [图片] - initPicturePick
   * @param options
   * @author wyj 15.4.2
   * @example
   *      Utils.initPicturePick({
       *        viewId: 'wwyMusicPick',
       *        el: '#music_pic',
       *        target: '.music_pic', // 绑定的input表单 ， 适用于单个图片上传
       *        _isAdd: this._isAdd, // 是否为添加模式
                max: 1, // 限制最大上传个数， 默认为无限
                items: this._isAdd ? [] : [{
                  attId: this.model.get('wyId'),
                  serverPath: this._getValue('music.pic'),
                  title: '重新上传',
                  hasPic: true,
                  isAddBtn: false
                }]
       *      });
   */
  initPicturePick: function (options) {
    var el = options.el;
    var viewId = options.viewId || options.id || (Est.nextUid('initPicturePick'));
    seajs.use(['PicturePick'], function (PicturePick) {
      options.el = ('.' + viewId + '-inner');
      app.addPanel(viewId, {
        el: el,
        template: '<div class="' + viewId + '-inner"></div>'
      }).addView(viewId, new PicturePick(options));
    });
  },
  /**
   * 初始化数字组件
   * @method [数字] - initNumberRange
   * @param options
   * @author wyj 15.4.10
   * @example
   *
   *   Utils.initNumberRange({
       *      render: '#number',
       *      viewId: 'NumberRange',
              target: '#model-number', // 如果有隐藏域， 则取隐藏域的值
              //number: 2, // 初始化默认值
              change: function(number){
                console.dir(number);
              }
       *   });
   */
  initNumberRange: function (options) {
    var render = options.render;
    var viewId = options.viewId || options.id || (Est.nextUid('initNumberRange'));
    seajs.use(['NumberRange'], function (NumberRange) {
      options.el = ('.' + viewId + '-inner');
      app.addPanel(viewId, {
        el: render,
        template: '<div class="' + viewId + '-inner"></div>'
      }).addView(viewId, new NumberRange(options));
    });
  },
  /**
   * 图片上传
   *
   * @method [上传] - initUpload
   * @param options [render:　选择符][context: 上下文]
   * @author wyj 14.12.17
   * @example
   *      // 图片添加
   *      Utils.openUpload({
       *       albumId: app.getData('curAlbumId'),
       *       username: app.getData('user').username, // 必填
       *       auto: true,
       *       oniframeload: function(){
       *         this.iframeNode.contentWindow.uploadCallback = doResult;
       *       }
       *      });
   *      // 图片替换 // 主要用于相册管理中
   *      Utils.openUpload({
       *        id: 'replaceDialog' + id,
       *        title: '图片替换',
       *        albumId: app.getData('curAlbumId'), // 必填
       *        username: app.getData('user').username, // 必填
       *        replace: true, // 必填
       *        attId: this.model.get('attId'), // 必填
       *        oniframeload: function () {
       *          this.iframeNode.contentWindow.uploadCallback = function (results) { // results返回结果
       *          ctx.model.set('uploadTime', new Date().getTime());
       *          window['replaceDialog' + id].close().remove();
       *          };
       *        }
       *      });
   *      // 选取图片
   *      Utils.openUpload({
                id: 'uploadDialog',
                type: type, // localUpload: 本地上传(默认)   sourceUpload: 资源库选择
                albumId: app.getData('curAlbumId'),
                username: app.getData('user') && app.getData('user').username,
                auto: true,
                oniframeload: function(){
                  this.iframeNode.contentWindow.uploadCallback = function(result){
                    ctx.addItems(result);
                  };
                },
                success: function(){
                  var result = this.iframeNode.contentWindow.app.getView('picSource').getItems();
                  ctx.addItems(result);
                }
              });
   */
  openUpload: function (options) {
    this.iframeDialog(BaseUtils.execute('openUpload', options));
  },
  /**
   * 提示信息
   *
   * @method [对话框] - tip
   * @param msg
   * @param options
   * @author wyj 14.12.18
   * @example
   *      Utils.tip('提示内容', {
       *        time: 1000,
       *        title: '温馨提示'
       *      });
   */
  tip: function (msg, options) {
    BaseUtils.execute('initTip', msg, options);
  },
  /**
   * input鼠标点击提示
   *
   * @method [提示] - tooltip
   * @param msg
   * @param options
   * @author wyj 14.12.24
   * @example
   *        this.$('input, textarea').each(function(){
       *          var title = $(this).attr('title');
       *          if (title){
       *            $(this).click(function(){
       *            Utils.tooltip(title, {
       *              align: 'right',
       *              target: $(this).get(0)
       *            });
       *          });
       *          }
       *        });
   */
  tooltip: function (msg, options) {
    BaseUtils.execute('initTooltip', msg, options);
  },
  /**
   * 确认框， 比如删除操作
   *
   * @method [对话框] - confirm
   * @param opts [title: 标题][content: 内容][success: 成功回调]
   * @author wyj 14.12.8
   * @example
   *      Utils.confirm({
       *        title: '提示',
       *        target: this.$('.name').get(0),
       *        content: '是否删除?',
       *        success: function(){
       *          ...
       *        }
       *      });
   */
  confirm: function (opts) {
    BaseUtils.execute('initConfirm', opts);
  },
  /**
   * 对话框
   *
   * @method [对话框] - dialog
   * @param options [title: ][width: ][height: ][target: ][success: 确定按钮回调]
   * @author wyj 14.12.18
   * @example
   *      Utils.dialog({
       *         id: 'copyDialog',
       *         title: '复制图片',
       *         target: '.btn-email-bind',
       *         width: 800,
       *         hideCloseBtn: false, // 是否隐藏关闭按钮
       *         content: this.copyDetail({
       *           filename: this.model.get('filename'),
       *           serverPath: this.model.get('serverPath')
       *         }),
       *         cover: true, // 是否显示遮罩
       *         load: function(){
       *           ...base.js
       *         },
       *         success: function(){
       *           this.close();
       *         }
       *       });
   */
  dialog: function (options) {
    BaseUtils.execute('initDialog', options);
  },
  /**
   * 打开iframe对话框
   *
   * @method [对话框] - iframeDialog
   * @param options [url: ''] [title: 标题][width: ][height: ][success: 确定按钮成功回调方法][target:　绑定到对象]
   * @author wyj 14.12.15
   * @example
   *      Utils.iframeDialog({
       *         title: '黑名单',
       *         url: CONST.DOMAIN + '/user/blacklist/view',
       *         width: 500,
       *         target: '.name',
       *         success: function(){
       *             this.title(CONST.SUBMIT_TIP);
       *             this.iframeNode.contentWindow.$("#submit").click();
       *             return false;
       *         }
       *       });
   */
  iframeDialog: function (options) {
    BaseUtils.execute('initIframeDialog', options);
  },
  /**
   * 添加加载动画
   * @method [加载] - addLoading
   * @author wyj 15.04.08
   * @example
   *      Utils.addLoading();
   */
  addLoading: function (options) {
    return BaseUtils.execute('addLoading', options);
  },
  /**
   * 移除加载动画
   * @method [加载] - removeLoading
   * @author wyj 15.04.08
   * @example
   *      Utils.removeLoading();
   */
  removeLoading: function (options) {
    BaseUtils.execute('removeLoading', options);
  },
  /**
   * 重置对话框高度
   * @method [对话框] - resetIframe
   * @author wyj 14.11.16
   * @example
   *      Utils.resetIframe(dialog);
   */
  resetIframe: function (dialog) {
    var height = $(document).height();
    var dialog = dialog || window.topDialog || window.detailDialog;
    try {
      if (!dialog) {
        setTimeout(function () {
          var i = app.getDialogs().length;
          while (i > 0) {
            if (Est.isEmpty(app.getDialogs()[i - 1])) {
              app.getDialogs().splice(i - 1, 1);
            } else {
              app.getDialogs()[i - 1].reset();
            }
            i--;
          }
        }, 100);
      }
      if (dialog && dialog.height) {
        dialog.height(height);
        dialog.reset();
      }
    } catch (e) {
      console.error('【error】: BaseDetail.resetIframe' + e);
    }
  },
  /**
   * 查看物流
   * @method delivery
   * @param options
   * @author wyj 15.1.23
   * @example
   *        Utils.delivery({
                  com: this.model.get('deliveryType')['defaultDeliveryCorp']['com'], // 物流公司
                  nu: this.model.get('shippingSet')[0]['deliverySn'], // 物流编号
                  target: this.$('.delivery-view').get(0)
                });
   */
  delivery: function (options) {
    seajs.use(['template/delivery_ickd'], function (ickdTemp) {
      var ickd = Handlebars.compile(ickdTemp);
      $.ajax({
        type: 'get',
        url: CONST.DELIVERY_URL + "&com=" + options.com + "&nu=" + options.nu,
        async: false,
        dataType: 'jsonp',
        success: function (result) {
          Utils.dialog({
            title: '物流信息',
            content: ickd(result),
            width: 400,
            target: options.target
          });
        }
      });
    });
  },
  getDesignUrl: function () {
    var user = app.getData('user');
    if (!user) return '';
    var grade = user['grade'];
    var url = CONST.DOMAIN;
    switch (grade) {
      case '07':
        url += ('/rest/maintain/' + app.getData('user')['username']);
        break;
      case '01':
        url += ('/maintain/' + app.getData('user')['username']);
        break;
      case '02':
        url += ('/rest/maintain/' + app.getData('user')['username']);
        break;
      case '03':
        url += '/rest/industry/maintain/' + app.getData('user')['username'];
        break;
      case '05':
        url += '/rest/groupsMaintain/' + app.getData('user')['username'];
      default:
        url += ('/rest/maintain/' + app.getData('user')['username']);
        break;
    }
    return url + '/index';
  },
  getMobileDesignUrl: function () {
    return ('/rest/mobileMaintain/' + app.getData('user')['username'] + '/index');
  },
  getPicUrl: function (url) {
    if (!url) return CONST.PIC_URL + '/' + CONST.PIC_NONE;
    if (Est.startsWidth(url, 'upload')) {
      return CONST.PIC_URL + '/' + url;
    } else {
      return CONST.DOMAIN + url;
    }
  },
  openFileUploadDialog: function(options){
    options = options || {};

    var viewId = Est.nextUid('fileupload');
    options.target = $('#design-static');
    $(options.target).each(function () {
      $(this).empty().append('<input id="' + viewId + '" style="width: ' + ($(this).width() + parseFloat($(this).css('padding-left')) + parseFloat($(this).css('padding-right'))) +
        'px;height:' + ($(this).height() + parseFloat($(this).css('padding-top')) + parseFloat($(this).css('padding-bottom'))) +
        'px;" class="file-upload" type="file" name="Filedata" value="从我的电脑里选择上传" multiple>');
    });

    $('#' + viewId, options.target).fileupload({
      url: CONST.API + '/upload/todo',
      dataType: 'json',
      formData: {
        "username": CONST.USER.username, // 用户名
        "id": 'all', // 相册ID
        "replace": false, // 是否替换操作
        "attId": '', // 图片ID
        "width": options.width || 640
      },
      start: function (e) {
        if (!window.$uploading) {
          window.$uploading = $('<div class="uploading"></div>');
          $('body').append(window.$uploading);
        }
        window.$uploading.html('0%');
        window.$uploading.show();
      },
      progressall: function (e, data) {
        var per = parseInt(data.loaded / data.total * 100, 10) + '%';
        if (per === '100%') {
          per = per + ',请耐心等待一会，正在加载图片'
        }
        window.$uploading.html(per);
      },
      done: function (e, data) {
        var response = data.result;
        window.$uploading.hide();
        if (!response.success && response.msg === '请先登陆') {
          $('.leaflet-login').click();
          return false;
        }
        if (response.success) {
          options.success && options.success.call(this, {
            serverPath: response.attributes.data,
            width: response.attributes.width,
            height: response.attributes.height
          });
        }
      }
    });
    $('#' + viewId, options.target).click();
  },
  initFileUpload: function (options) {
    options = options || {};

    var viewId = Est.nextUid('fileupload');
    $(options.target).css({'position': 'relative', 'overflow': 'hidden'});
    $(options.target).each(function () {
      $(this).append('<input id="' + viewId + '" style="width: ' + ($(this).width() + parseFloat($(this).css('padding-left')) + parseFloat($(this).css('padding-right'))) +
        'px;height:' + ($(this).height() + parseFloat($(this).css('padding-top')) + parseFloat($(this).css('padding-bottom'))) +
        'px;" class="file-upload" type="file" name="Filedata" value="从我的电脑里选择上传" multiple>');
    });

    $('#' + viewId, options.target).fileupload({
      url: CONST.API + '/upload/todo',
      dataType: 'json',
      formData: Est.extend(options.data || {},{
        "username": CONST.USER.username, // 用户名
        "id": 'all', // 相册ID
        "replace": false, // 是否替换操作
        "attId": '', // 图片ID
        "width": options.width || 640
      }),
      submit: function(e, data){
        options.submit && options.submit.call(this, data);
      },
      start: function (e) {
        if (!window.$uploading) {
          window.$uploading = $('<div class="uploading"></div>');
          $('body').append(window.$uploading);
        }
        window.$uploading.html('0%');
        window.$uploading.show();
      },
      progressall: function (e, data) {
        var per = parseInt(data.loaded / data.total * 100, 10) + '%';
        if (per === '100%') {
          per = per + ',请耐心等待一会，正在加载图片'
        }
        window.$uploading.html(per);
      },
      done: function (e, data) {
        var response = data.result;
        window.$uploading.hide();
        if (!response.success && response.msg === '请先登陆') {
          $('.leaflet-login').click();
          return false;
        }
        if (!response.success){
          alert(response.msg);
          return false;
        }
        if (response.success) {
          options.success && options.success.call(this, {
            serverPath: response.attributes.data,
            width: response.attributes.width,
            height: response.attributes.height,
            msg: response.msg
          });
        }
      },
      error: function(e){
        Utils.tip('上传失败');
        window.$uploading.hide();
      }
    });
  },
  openBeautifyDialog: function(options){
    var h = $('#design-center').height();
    var xiuxiuId = Est.nextUid('xiuxiu');
    $("body").append('<div class="xiuxiu-wrap" ' +
      'style="position: absolute; z-index: 2499; left: 0; width: 100%; top: 0; height: ' + (h + 500) + 'px; background-color: #000;opacity: 0.5;"><div class="close-xiuxiu-dialog" style="  position: fixed; right: 8px; top: 8px; font-size: 30px; color: #fff; cursor: pointer; z-index: 99999999; font-weight: bold;">关闭</div></div>' +
      '<div id="' + xiuxiuId + '" style="position: absolute;left: 50%;top: 50%;margin-left: -250px;margin-top: -175px;"></div>');
    var upload_options = {
      upload_url: CONST.API + '/upload/todo',
      post_params: {
        "username": CONST.USER.username, // 用户名
        "id": 'all', // 相册ID
        "replace": false, // 是否替换操作
        "attId": '', // 图片ID
        "width": options.width || 640
      }
    };
    xiuxiu.setLaunchVars('nav', 'edit');
    //xiuxiu.setLaunchVars("file_type", "auto");//file_type的值为jpg \ png \ auto(根据打开图片格式判断)

    xiuxiu.embedSWF(xiuxiuId,3, "1000px", "600px", 'xiuxiuEditor');


    $('#xiuxiuEditor').css({
      'z-index': '2500',
      'position': 'fixed',
      'visibility': 'visible',
      'top': ($(window).height() - ($('#xiuxiuEditor').height() || 350)) / 2,
      'left': ($(window).width() - ($('#xiuxiuEditor').width() || 500)) / 2
    });
    xiuxiu.setUploadType(2);

    xiuxiu.setUploadURL(upload_options.upload_url);//修改为您自己的上传接收图片程序

    xiuxiu.onBeforeUpload = function (data, id) {
      if (data.size > 1024 * 1024 * 3) {
        alert("上传图片不能超过3M");
        return false;
      }
      options.onBeforeUpload && options.onBeforeUpload.call(this, upload_options.post_params, id);
      xiuxiu.setUploadArgs(Est.extend({
        filetype: data.type, type: "image", filename: data.name, fileSize: data.size
      }, upload_options.post_params));
    }
    xiuxiu.onInit = function () {
        xiuxiu.loadPhoto(options.src || '');//修改为要处理的图片url
    }
    xiuxiu.onUploadResponse = function (data) {
      var result = $.parseJSON(data.replace(/\/\//g, '/'));
      if (!result.success && result.msg === '请先登陆') {
        $('.leaflet-login').click();
        return false;
      }
      if (!result.success){
        alert(result.msg);
        return false;
      }
      options.onUploadResponse && options.onUploadResponse.call(this, result);
      $('.xiuxiu-wrap').remove();
      $("#xiuxiuEditor").remove();
    }
    xiuxiu.onClose = function () {
      $('.xiuxiu-wrap').remove();
      $("#xiuxiuEditor").remove();
    }
    $('.xiuxiu-wrap, .close-xiuxiu-dialog').on('click', function(){
      $('.xiuxiu-wrap').remove();
      $("#xiuxiuEditor").remove();
      return false;
    });
  },
  openXiuxiuDialog: function (options) {
    var h = $('#design-center').height();
    var xiuxiuId = Est.nextUid('xiuxiu');
    $("body").append('<div class="xiuxiu-wrap" ' +
      'style="position: absolute; z-index: 2499; left: 0; width: 100%; top: 0; height: ' + (h + 500) + 'px; background-color: #000;opacity: 0.5;"><div class="close-xiuxiu-dialog" style="  position: fixed; right: 8px; top: 8px; font-size: 30px; color: #fff; cursor: pointer; z-index: 99999999; font-weight: bold;">关闭</div></div>' +
      '<div id="' + xiuxiuId + '" style="position: absolute;left: 50%;top: 50%;margin-left: -250px;margin-top: -175px;"></div>');

    var upload_options = {
      upload_url: CONST.API + '/upload/todo',
      post_params: {
        "username": CONST.USER.username, // 用户名
        "id": 'all', // 相册ID
        "replace": false, // 是否替换操作
        "attId": '', // 图片ID
        "width": options.width || 640
      }
    };
    xiuxiu.setLaunchVars('nav', 'edit');
    //xiuxiu.setLaunchVars("file_type", "auto");//file_type的值为jpg \ png \ auto(根据打开图片格式判断)

    xiuxiu.embedSWF(xiuxiuId, 1, "500px", "350px", 'xiuxiuEditor');


    $('#xiuxiuEditor').css({
      'z-index': '2500',
      'position': 'fixed',
      'visibility': 'visible',
      'top': ($(window).height() - ($('#xiuxiuEditor').height() || 350)) / 2,
      'left': ($(window).width() - ($('#xiuxiuEditor').width() || 500)) / 2
    });
    xiuxiu.setUploadType(2);

    xiuxiu.setUploadURL(upload_options.upload_url);//修改为您自己的上传接收图片程序

    xiuxiu.onBeforeUpload = function (data, id) {
      if (data.size > 1024 * 1024 * 3) {
        alert("上传图片不能超过3M");
        return false;
      }
      options.onBeforeUpload && options.onBeforeUpload.call(this, upload_options.post_params, id);
      xiuxiu.setUploadArgs(Est.extend({
        filetype: data.type, type: "image", filename: data.name, fileSize: data.size
      }, upload_options.post_params));
    }
    xiuxiu.onInit = function () {
      //xiuxiu.loadPhoto(pic || '');
    }
    xiuxiu.onUploadResponse = function (data) {
      var result = $.parseJSON(data.replace(/\/\//g, '/'));
      if (!result.success && result.msg === '请先登陆') {
        $('.leaflet-login').click();
        return false;
      }
      if (!result.success){
        alert(data.msg);
        return false;
      }
      options.onUploadResponse && options.onUploadResponse.call(this, result);
      $('.xiuxiu-wrap').remove();
      $("#xiuxiuEditor").remove();
    }
    xiuxiu.onClose = function () {
      $('.xiuxiu-wrap').remove();
      $("#xiuxiuEditor").remove();
    }
    $('.xiuxiu-wrap, .close-xiuxiu-dialog').on('click', function(){
      $('.xiuxiu-wrap').remove();
      $("#xiuxiuEditor").remove();
      return false;
    });
  },


  /**
   * 查看CHARTS
   * @method highcharts
   * @param highcharts
   * @example
   */
  highcharts: function (options) {
    seajs.use(['highCharts'], function (module) {
      $(options.target).highcharts({
        chart: {
          type: options.type || 'line'
        },
        title: {
          text: options.title || ''
        },
        xAxis: {
          categories: options.xAxis.categories || null,
          type: options.xAxis.type || 'linear',
          labels: {
            rotation: options.xAxis.labels == undefined ? '0' : options.xAxis.labels.rotation || '0',
            style: {
              fontSize: '13px',
              fontFamily: 'Verdana, sans-serif'
            }
          }
        },
        yAxis: {
          min: options.yAxis == undefined ? null : options.yAxis.min || null,
          title: {
            text: options.yAxis == undefined ? null : options.yAxis.text || null
          }
        },
        legend: {
          enabled: options.legend == undefined ? true : options.legend.enabled || true
        },
        tooltip: {
          enabled: options.tooltip.enabled || true,
          formatter: options.tooltip.formatter || false,
          pointFormat: options.tooltip.pointFormat || ''
        },
        plotOptions: {
          line: {
            dataLabels: {
              enabled: options.plotOptionsEnabled == undefined ? false : options.plotOptionsEnabled || false
            },
            enableMouseTracking: options.plotOptionsEnableMouseTracking == undefined ? true : options.plotOptionsEnableMouseTracking || true
          }
        },
        series: options.series,
        credits: {
          enabled: options.credits || false
        }
      });

    });
  }





};
