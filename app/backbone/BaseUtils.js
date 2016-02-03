/**
 * @description BaseUtils
 * @class BaseUtils - 底层工具类
 * @author yongjin<zjut_wyj@163.com> 2015/1/27
 */
var BaseUtils = {
  /**
   * 初始化选择框
   *
   * @method [表单] - initSelect ( 初始化选择框 )
   * @param options
   * @author wyj 15.1.27
   * @example
   *      Utils.initSelect({
            render: '#select',  // 渲染区域
            target: '#model-categoryId', // 目标input元素
            text: 'name', // 名称字段
            value: 'categoryId', // 值字段
            items: app.getData('product_category_list'), // 列表
            search: true, // 是否显示搜索框
            change: function (ev) { // select事件
                console.log(ev);
            }
        });
   */
  initSelect: function (options) {
    var tagId = options.viewId || Est.nextUid('select');
    options = Est.extend({
      el: '.' + tagId,
      viewId: tagId,
      data: {
        width: options.width || 150
      } }, options);
    seajs.use(['Select'], function (Select) {
      options.el = '.' + tagId;
      app.addPanel(tagId, {
        el: options.render,
        template: '<div class="select-inner ' + tagId + '"></div>'
      }).addView(tagId, new Select(options));
    });

    // bui select
    /*var $q = Est.promise;
     return new $q(function (resove, reject) {
     var container = {};
     var target = options.target || '#category';
     var render = options.render || '#s1';
     var itemId = options.itemId || 'value';
     var width = options.width || '150';
     var items = options.items || [];
     BUI.use('bui/select', function (Select) {
     container[render] = new Select.Select({
     render: render,
     valueField: target,
     width: width,
     items: items
     });
     container[render].render();
     container[render].on('change', function (ev) {
     $(target).val(Est.trim(ev.item[itemId]));
     if (typeof options.change !== 'undefined')
     options.change.call(this, ev.item[itemId], ev);
     resove(ev.item[itemId]);
     });
     });
     });*/
  },
  /**
   * 初始化下拉框
   *
   * @method [表单] - initDropDown ( 初始化下拉框 )
   * @param options
   * @author wyj 15.2.17
   * @example
   *      Utils.initDropDown({
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
    seajs.use(['DropDown'], function (DropDown) {
      var viewId = Est.nextUid('dropDown');
      var isDropDown = false;
      $(options.target).click(function (e) {
        if (!isDropDown) {
          app.addPanel(viewId, { el: 'body',
            template: '<div class="drop-down-container-' + viewId + '"></div>'
          }).addView(viewId, new DropDown(Est.extend(options, {
            el: '.drop-down-container-' + viewId,
            viewId: viewId,
            data: {
              width: options.width || 'auto',
              height: options.height || 'auto',
              overflowX: options.overflowX || 'hidden'
            }
          })));
          app.getView(viewId).show(e);
          isDropDown = true;
        } else {
          app.getView(viewId).show(e);
        }
        app.addDialog(app.getView(viewId));
        return false;
      });
    });
  },
  /**
   * 初始化tab选项卡
   *
   * @method [选项卡] - initTab ( 初始化tab选项卡 )
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
    BUI.use(['bui/tab', 'bui/mask'], function (Tab) {
      var tab = new Tab.TabPanel(options);
      tab.on('selectedchange', function (ev) {
        options.change && options.change.call(this, ev);
      });
      tab.render();
      /*Est.on(options.viewId || 'tab', function(){

       });*/
      app.addView(options.viewId || 'tab', tab);
      if (options.afterRender) {
        options.afterRender.call(this, tab);
      }
    });
  },
  /**
   * 初始化button tab选项卡
   *
   * @method [选项卡] - initButtonTab ( 初始化按钮形式的tab选项卡 )
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
    options = Est.extend({
      elCls: 'button-tabs',
      autoRender: true
    }, options);
    BUI.use(['bui/tab'], function (Tab) {
      var tab = new Tab.Tab(options);
      tab.on('selectedchange', function (ev) {
        options.change && options.change.call(this, ev);
      });
      tab.setSelected(tab.getItemAt(0));
      app.addView(options.viewId || 'buttontab', tab);
      if (options.afterRender) {
        options.afterRender.call(this, tab);
      }
    });
  },
  /**
   * 初始化日期选择器
   *
   * @method [表单] - initDate ( 初始化时间组件 )
   * @param options [render: 选择符][showTime: true/false 是否显示时间]
   * @author wyj 14.12.17
   * @example
   *      Utils.initDate({
       *         render: '.calendar',
       *         showTime: false,
       *         target: '#model-addTime', // 绑定隐藏域model
       *         change: function(ev){
       *          ...
       *         }
       *       });
   */
  initDate: function (options) {
    BUI.use('bui/calendar', function (Calendar) {
      var calendar = new Calendar.DatePicker({
        trigger: options.render || '.calendar',
        showTime: options.showTime || false,
        autoRender: true
      });
      calendar.on('selectedchange', function (ev) {
        options.change && options.change.call(this, ev);
        if (options.target) {
          var $target = $(options.target);
          $target.val(ev.value.getTime()).trigger('change');
          $target.css('border', '3px solid blue');
        }
      });
    });
  },
  /**
   * 初始化多标签
   *
   * @method [表单] - initCombox ( 初始化多标签组件 )
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
    var $q = Est.promise;
    return new $q(function (resolve, reject) {
      var container = {};
      var target = options.target || '#category';
      var render = options.render || '#s1';
      var itemId = options.itemId || 'categoryId';
      var width = options.width || '500';
      var items = options.items || [];
      BUI.use('bui/select', function (Select) {
        container[render] = new Select.Combox({
          render: render,
          showTag: true,
          valueField: target,
          elCls: 'bui-tag-follow',
          width: width,
          items: items
        });
        container[render].render();
        /*container[render].on('change', function (ev) {
         //$(target).val($(target)Est.trim(ev.item[itemId]));
         if (typeof options.change !== 'undefined')
         options.change.call(this, ev.item[itemId]);
         });*/
      });
    });
  },
  /**
   * 初始化动画
   * @method [动画] - initAnimate ( 初始化动画 )
   * @param target
   * @author wyj 15.3.30
   * @example
   *
   *    Utils.initAnimate(this);
   */
  initAnimate: function (target) {
    $('.animated', $(target)).each(function () {
      setTimeout(Est.proxy(function () {
        var animationEnd = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';
        var animate = 'animated ' + $(this).attr('data-animate');
        var duration = $(this).attr('data-duration');
        var delay = $(this).attr('data-delay');
        var count = $(this).attr('data-count');
        $(this).css({
          '-webkit-animation-duration': (duration || 1) + 's',
          '-webkit-animation-delay': (delay || 0) + 's'
        });
        $(this).removeClass(animate);
        $(this).addClass(animate).one(animationEnd, function () {
          //$(this).removeClass(animate);
        });
      }, this), 0);
    });
  },
  /**
   * 添加加载动画
   * @method [加载] - addLoading ( 添加加载动画 )
   * @author wyj 15.04.08
   * @example
   *      Utils.addLoading();
   */
  addLoading: function (options) {
    debug('【Utils】Utils.addLoading');
    try {
      if (window.$loading) window.$loading.remove();
      window.$loading = $('<div class="loading"></div>');
      $('body').append(window.$loading);
    } catch (e) {
      debug('【Error】' + e);
    }
    return window.$loading;
  },
  /**
   * 移除加载动画
   * @method [加载] - removeLoading ( 移除加载动画 )
   * @author wyj 15.04.08
   * @example
   *      Utils.removeLoading();
   */
  removeLoading: function () {
    debug('【Utils】Utils.removeLoading');
    if (window.$loading) window.$loading.remove();
    //else $('.loading').remove();
  },
  /**
   * 初始化级联地区
   *
   * @method [地区] - initDistrict ( 初始化级联地区 )
   * @author wyj 15.1.6
   * @example
   *        Utils.initDistrict({
                 id: 'district1' ,// 必填
                 render: '#district-container', // 目标选择符
                 target: '#model-dist',
                 path: '...',
                 url: CONST.API + '/shop/receiver/list' // 自定义请求地址
               });
   */
  initDistrict: function (options) {
    seajs.use(['District'], function (District) {
      app.addPanel(options.id, {
        el: options.render,
        template: '<div class="district-inner ' + options.id + '"></div>'
      });
      app.addView(options.id, new District({
        el: '.' + options.id,
        viewId: options.id,
        target: options.render, // target为需要渲染到的目标元素中
        input: options.target, // input 为绑定的input元素
        path: options.path,
        width: 100,
        addressUrl: options.url
      }));
    });
  },
  /**
   * 图片上传
   *
   * @method [上传] - initUpload ( 图片上传 )
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
   *      // 图片替换 主要用于图片空间里的图片替换操作
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
                type: type, // [local / source]打开的窗口类型， 如上传、资源库
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
    if (typeof options === 'undefined') console.error(CONST.LANG.UPLOAD_OPTION_REQUIRE);

    options = Est.extend({ title: CONST.LANG.UPLOAD_IMG, width: 650, height: 350, albumId: '', padding: 5, username: '', attId: '', auto: false, replace: false, type: 'local' }, options);
    options.url = CONST.HOST + '/upload.html?albumId=' + options.albumId + '&username=' + options.username + '&replace=' + (options.replace ? '01' : '00') + '&attId=' + options.attId + '&auto=' + options.auto + '&uploadType=' + options.type + '&max=';

    return options;
  },
  /**
   * 初始化编辑器
   *
   * @method [表单] - initEditor ( 初始化编辑器 )
   * @param options
   * @author wyj 14.12.18
   * @example
   *      Utils.initEditor({
       *        render: '.ckeditor'
       *      });
   */
  initEditor: function (options) {
    var allPlugin = {
      contact: {
        c: 'xheContact',
        t: CONST.LANG.INSERT_CONTACT,
        e: function () {
          var _this = this;
          _this.showIframeModal(CONST.LANG.INSERT_CONTACT,
              CONST.DOMAIN + '/user_v2/enterprise/updateuser/getUserBySession',
            function (v) {
              _this.loadBookmark();
              _this.pasteHTML(v);
            }, 700, 510);
        }
      },
      abbccMap: {
        c: 'xheBtnMap',
        t:CONST.LANG.SELECT_MAP,
        e: function () {
          var _this = this;
          _this.showIframeModal(CONST.LANG.SELECT_MAP,
              CONST.HOST + '/vendor/xheditor/xheditor-tools/abbcc-map/index.html',
            function (v) {
              _this.loadBookmark();
              _this.pasteHTML(v);
            }, 700, 510);
        }
      },
      abbccLayout: {
        c: 'xheBtnLayout',
        t: CONST.LANG.SEELCT_TPL,
        e: function () {
          var _this = this;
          _this.showIframeModal(CONST.LANG.SELECT_TPL,
              CONST.HOST + '/vendor/xheditor/xheditor-tools/abbcc-layout/index.html',
            function (v) {
              _this.loadBookmark();
              _this.pasteHTML(v);
            }, 660, 500);
        }
      },
      abbccQrcode: {
        c: 'xheBtnQrcode',
        t: CONST.LANG.BUILD_QRCODE,
        e: function () {
          var _this = this;
          _this.showIframeModal(CONST.LANG.BUILD_QRCODE,
              CONST.HOST + '/vendor/xheditor/xheditor-tools/abbcc-qrcode/index.html',
            function (v) {
              _this.loadBookmark();
              _this.pasteHTML(v);
            }, 800, 300);
        }
      },
      abbccImages: {
        c: 'xheIcon xheBtnImg',
        t: CONST.LANG.SELECT_IMG,
        s: 'ctrl+8',
        e: function () {
          var _this = this;
          BaseUtils.initIframeDialog(BaseUtils.openUpload({
            id: 'uploadDialog',
            type: '',
            albumId: app.getData('curAlbumId'),
            username: app.getData('user') && app.getData('user').username,
            auto: true,
            oniframeload: function () {
              this.iframeNode.contentWindow.uploadCallback = function (result) {
                _this.loadBookmark();
                _this.pasteHTML("<img src='" + CONST.PIC_URL + '/' + result[0]['serverPath'] + "'/>");
              };
            },
            success: function () {
              var result = this.iframeNode.contentWindow.app.getView('picSource').getItems();
              _this.loadBookmark();
              _this.pasteHTML("<img src='" + CONST.PIC_URL + '/' + result[0]['serverPath'] + "'/>");
            }
          }));

          /*seajs.use(['Utils'], function (Utils) {
           Utils.openUpload();
           });*/
          /*  _this.showIframeModal('选择图片',
           CONST.DOMAIN + '/common/picUpload/upload.jsp?pageType=xheditor',
           function (v) {
           _this.loadBookmark();
           _this.pasteHTML(v);
           }, 800, 550);*/
        }
      },
      abbccFlash: {
        c: 'xheIcon xheBtnFlash',
        t: '选择flash',
        s: 'ctrl+7',
        e: function () {
          var _this = this;
          _this.showIframeModal(CONST.LANG.SELECT_FLASH,
            '/user/album/albumshowFlashPage?pageType=xheditor',
            function (v) {
              _this.loadBookmark();
              _this.pasteHTML(v);
            }, 600, 300);
        }
      },
      abbccQQ: {
        c: 'xheBtnQQ',
        t: CONST.LANG.SELECT_QQ,
        s: 'ctrl+9',
        e: function () {
          var _this = this;
          _this.showIframeModal(CONST.LANG.SELECT_QQ,
              CONST.DOMAIN + '/user_v2/qq/index.jsp',
            function (v) {
              _this.loadBookmark();
              _this.pasteHTML(v);
            }, 600, 300);
        }
      }

    };
    seajs.use(['xheditor'], function (xheditor) {
      function startEditor(obj) {
        try {
          if (!$(obj).xheditor) window.location.reload();
          var editor = $(obj).xheditor(
            {
              plugins: allPlugin,
              tools: 'Preview,Fullscreen,Source,|,contact,abbccQQ,abbccMap,abbccLayout,abbccQrcode,|,Table,abbccImages,abbccFlash,Media,|,FontColor,BackColor,|,Align,Underline,Italic,Bold,|,FontSize,Fontface,|,Link,Unlink',
              skin: 'vista',
              layerShadow: 2,
              html5Upload: false,
              upBtnText: CONST.LANG.VIEW,
              upLinkExt: 'jpg,png,bmp',
              upImgUrl: '/fileUpload/uploadByJson',
              upFlashUrl: '/fileUpload/uploadByJson',
              upMediaUrl: '/fileUpload/uploadByJson',
              upFlashExt: "swf",
              upMediaExt: 'wmv,avi,wma,mp3,mid',
              linkTag: true,
              height: 400,
              internalScript: true,
              inlineScript: true
            });
        } catch (e) {
          debug(e);
        }
        if (options.viewId) {
          app.addView(options.viewId, editor);
        }
      }

      $(function () {
        $(options.render || '.ckeditor').each(function () {
          startEditor($(this));
        });
      });
    });
  },
  /**
   * 初始化内联编辑器
   * @method [编辑器] - initInlineEditor
   * @author wyj 15.6.11
   * @example
   *      Utils.initInlineEditor(target, callback);
   */
  initInlineEditor: function (target, callback) {
    seajs.use(['ckeditor'], function (ckeditor) {
      try {
        window.inline_ckeditor = CKEDITOR.inline(target.get(0));
        window.inline_ckeditor.on('blur', function (e) {
          var okToDestroy = false;
          if (e.editor.checkDirty()) {
            okToDestroy = true;
          } else {
            okToDestroy = true;
          }
          if (okToDestroy)
            e.editor.destroy();
          callback && callback.call(this);
        });
      } catch (e) {
      }
    });
  },
  /**
   * 初始化复制按钮
   *
   * @method [复制] - initCopy ( 初始化复制按钮 )
   * @param selecter
   * @param options
   * @author wyj 14.12.18
   * @example
   *        html: <span id="" class="design-leaflet-url-copy" clipboard="" data-clipboard-text="{{staticUrl}}">复制</span>
   *        javascript:
   *            Utils.initCopy('#photo-copy-dialog', {
       *           success: function(){
       *             // 成功复制后回调
       *           }
       *         });
   *
   */
  initCopy: function (selecter, options, callback) {
    seajs.use(['ZeroClipboard'], function (ZeroClipboard) {
      var client = new ZeroClipboard($(selecter).get(0), {
        moviePath: CONST.HOST + "/swf/ZeroClipboard.swf"
      });
      client.on('ready', function (event) {
        // console.log( 'movie is loaded' );
        client.on('copy', function (event) {
          event.clipboardData.setData('text/plain', options.callback ||
            $(event.target).attr('data-clipboard-text'));
        });
        client.on('aftercopy', function (event) {
          callback.call(this, event.data['text/plain']);
          console.log('Copied text to clipboard: ' + event.data['text/plain']);
          options.success && options.success.call(this, event.data['text/plain']);
        });
      });
      client.on('error', function (event) {
        // console.log( 'ZeroClipboard error of type "' + event.name + '": ' + event.message );
        ZeroClipboard.destroy();
        options.failed && options.failed.call(this, event.message);
      });
    });
  },
  /**
   * 初始化拖动
   *
   * @method [拖放] - initDrag ( 初始化拖动 )
   * @param options
   * @author wyj 15.03.24
   * @example
   *     Utils.initDrag({
        render: '.drag',
        resize: true, // 是否启用缩放
        dragend: function (ev, dd) { // 拖放结束后执行
          $(this).css({
            left: ((dd.offsetX * 100) / 320) + '%',
            top: ((dd.offsetY * 100) / 480) + '%',
            width: ($(this).width() * 100) / 320 + '%',
            height: ($(this).height() * 100) / 480 + '%'
          });
        },
        resizeend: function(ev, dd){ // 缩放结束后执行
          $(this).css({
            width: ($(this).width() * 100) / 320 + '%',
            height: ($(this).height() * 100) / 480 + '%'
          });
        },
        callback: function (ev, dd) {
        }
      });
   */
  initDrag: function (options) {
    this.doDrag = function (options) {
      var _resize = false;
      $(options.render).click(function () {
        var $dragSelected = $(options.render + '.drag-selected');
        $dragSelected.removeClass('drag-selected');
        $('.drag-handle', $dragSelected).off().remove();
        $(this).addClass("drag-selected");
        options.click && options.click.call(this);
      })
        .drag("init", function () {
          if (!$(this).hasClass('lock')) {
            try {
              for (var name in CKEDITOR.instances) {
                CKEDITOR.instances[name].destroy()
              }
            } catch (e) {
            }
          }
          if ($(this).hasClass('lock')) return false;
          if ($(this).is('.drag-selected'))
            return $('.drag-selected');
        }).drag('start', function (ev, dd) {
          if (!$(this).hasClass('drag-selected')) {
            $(this).append('<div class="drag-handle NE"></div> <div class="drag-handle NN"></div> <div class="drag-handle NW"></div> <div class="drag-handle WW">' +
              '</div> <div class="drag-handle EE"></div> <div class="drag-handle SW"></div> <div class="drag-handle SS"></div> <div class="drag-handle SE"></div>');
            $(this).addClass("drag-selected");
          }
          dd.attr = $(ev.target).prop("className");
          dd.width = $(this).width();
          dd.height = $(this).height();
          options.dragstart && options.dragstart.apply(this, [ev, dd]);
        }).drag(function (ev, dd) {
          var props = {};
          _resize = false;
          if ($(this).hasClass('lock')) return false;
          if (options.resize) {
            debug('resize');
            if (dd.attr.indexOf("E") > -1) {
              _resize = true;
              props.width = Math.max(1, dd.width + dd.deltaX);
            }
            if (dd.attr.indexOf("S") > -1) {
              _resize = true;
              props.height = Math.max(1, dd.height + dd.deltaY);
            }
            if (dd.attr.indexOf("W") > -1) {
              _resize = true;
              props.width = Math.max(1, dd.width - dd.deltaX);
              props.left = dd.originalX + dd.width - props.width;
            }
            if (dd.attr.indexOf("N") > -1) {
              _resize = true;
              props.height = Math.max(1, dd.height - dd.deltaY);
              props.top = dd.originalY + dd.height - props.height;
            }
          }
          if (!_resize) {
            props.top = dd.offsetY;
            props.left = dd.offsetX;
          }
          $(this).css(props);
          if (!_resize) {
            options.callback && options.callback.apply(this, [ev, dd]);
          }
        }, { relative: true}).drag('dragend', function (ev, dd) {
          if ($(this).hasClass('lock')) return false;
          if (!_resize) {
            debug('resize end');
            options.dragend && options.dragend.apply(this, [ev, dd]);
          } else {
            options.resizeend && options.resizeend.apply(this, [ev, dd]);
          }
        });
    }
    if (!$.fn.drag) {
      seajs.use(['drag'], Est.proxy(function (drag) {
        this.doDrag(options);
      }, this));
    } else {
      this.doDrag(options);
    }
  },
  /**
   * 初始化缩放
   *
   * @method [缩放] - initResize ( 初始化缩放 )
   * @param options
   * @author wyj 15.03.24
   * @example
   *      Utils.initResize({
     *        render: 'img',
     *        callback: function(ev, dd){}
     *      });
   */
  initResize: function (options) {
    seajs.use(['drag'], function (drag) {
      $(options.render).drag("start", function (ev, dd) {
        dd.width = $(this).width();
        dd.height = $(this).height();
        options.dragstart && options.dragstart.apply(this, [ev, dd]);
      }).drag(function (ev, dd) {
        $(this).css({
          width: Math.max(20, dd.width + dd.deltaX),
          height: Math.max(20, dd.height + dd.deltaY)
        });
        options.callback && options.callback.apply(this, [ev, dd]);
      }, { relative: true, handle: '.drag-handle'}).drag('dragend', function (ev, dd) {
        options.dragend && options.dragend.apply(this, [ev, dd]);
      });
    });
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
       *         quickClose: true, // 点击空白处关闭对话框
       *         hideCloseBtn: false, // 是否隐藏关闭按钮
       *         content: this.copyDetail({
       *           filename: this.model.get('filename'),
       *           serverPath: this.model.get('serverPath')
       *         }),
       *         cover: true, // 是否显示遮罩
       *         onshow: function(){// 对话框显示时回调
       *         },
       *         load: function(){ // iframe载入完成后回调
       *           ...base.js
       *         },
       *         success: function(){// 按确定按钮时回调
       *           this.close();
       *         }
       *       });
   */
  initDialog: function (options) {
    var button = options.button || [];
    seajs.use(['dialog-plus'], function (dialog) {
      if (options.success) {
        button.push({ value: CONST.LANG.CONFIRM, autofocus: true,
          callback: function () {
            options.success.apply(this, arguments);
          }
        });
      }
      if (!options.hideCloseBtn) {
        button.push({
          value:CONST.LANG.CLOSE,
          callback: function () {
            this.close().remove();
          } });
      }
      options = Est.extend({
        id: options.id || options.moduleId || Est.nextUid('dialog'),
        title: CONST.LANG.DIALOG_TIP,
        width: 150, content: '',
        button: button
      }, options);
      if (options.target) {
        options.target = $(options.target).get(0);
      }
      options.oniframeload = function () {
        try {
          this.iframeNode.contentWindow.topDialog = thisDialog;
          this.iframeNode.contentWindow.app = app;
          delete app.getRoutes()['index'];
        } catch (e) {
        }
        if (typeof options.load === 'function') {
          options.load.call(this, arguments);
        }
      }
      if (options.cover) {
        app.addDialog(dialog(options), options.id).showModal(options.target);
      } else {
        app.addDialog(dialog(options), options.id).show(options.target);
      }
    });
  },
  /**
   * 打开iframe对话框
   *
   * @method [对话框] - iframeDialog
   * @param options [url: ''] [title: 标题][width: ][height: ][success: 确定按钮成功回调方法][target:　绑定到对象]
   * @author wyj 14.12.15
   * @example
   *      Utils.initIframeDialog({
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
  initIframeDialog: function (options) {
    var button = [];
    if (options.success) {
      button.push({
        value: CONST.LANG.CONFIRM,
        autofocus: true,
        callback: function () {
          options.success.call(this);
        }});
    }
    button.push({
      value: CONST.LANG.CLOSE,
      callback: function () {
        this.close().remove();
      }
    });
    options = Est.extend({
      id: 'dialog',
      title: CONST.LANG.WIN_TIP,
      url: '',
      width: 150,
      height: 'auto',
      target: null,
      button: button
    }, options);
    seajs.use(['dialog-plus'], function (dialog) {
      window[options.id ||
        'iframeDialog'] = dialog(options).show(options.target);
    });
  },
  /**
   * 提示信息
   *
   * @method [对话框] - initTip
   * @param msg
   * @param options
   * @author wyj 14.12.18
   * @example
   *      Utils.initTip('提示内容', {
       *        time: 1000,
       *        title: '温馨提示'
       *      });
   */
  initTip: function (msg, options) {
    options = options || {time: 3000, title: CONST.LANG.INFO_TIP};
    seajs.use(['dialog-plus'], function (dialog) {
      window.tipsDialog && window.tipsDialog.close().remove();
      window.tipsDialog = app.addDialog(dialog({
        id: 'tip-dialog' + Est.nextUid(),
        title: options.title,
        width: 200,
        content: '<div style="padding: 10px;">' + msg + '</div>'
      })).show();
      setTimeout(function () {
        window.tipsDialog.close().remove();
      }, options.time);
    });
  },
  /**
   * 确认框， 比如删除操作
   *
   * @method [对话框] - initConfirm
   * @param opts [title: 标题][content: 内容][success: 成功回调]
   * @author wyj 14.12.8
   * @example
   *      Utils.initConfirm({
       *        title: '提示',
       *        target: this.$('.name').get(0),
       *        content: '是否删除?',
       *        success: function(){
       *          ...
       *        },
       *        cancel: function(){
       *          ...
       *        }
       *      });
   */
  initConfirm: function (opts) {
    var options = {
      title: CONST.LANG.WARM_TIP,
      content: CONST.LANG.DEL_CONFIRM,
      success: function () {
      },
      target: null
    };
    Est.extend(options, opts);
    seajs.use(['dialog-plus'], function (dialog) {
      window.comfirmDialog = app.addDialog(dialog({
        id: 'dialog' + Est.nextUid(),
        title: options.title,
        content: '<div style="padding: 20px;">' + options.content + '</div>',
        width: options.width || 200,
        button: [
          {
            value: CONST.LANG.CONFIRM,
            autofocus: true,
            callback: function () {
              options.success && options.success.call(this);
            }},
          {
            value: CONST.LANG.CANCEL,
            callback: function () {
              window.comfirmDialog.close().remove();
              options.cancel && options.cancel.call(this);
            }
          }
        ],
        onClose: function () {
          options.cancel && options.cancel.call(this);
        }
      })).show(options.target);
    });
  },
  /**
   * 添加加载动画
   * @method [加载] - addLoading
   * @param optoins
   * @author wyj 15.04.08
   * @example
   *      Utils.addLoading();
   */
  addLoading: function (options) {
    try {
      if (window.$loading) window.$loading.remove();
      window.$loading = $('<div class="loading"></div>');
      $('body').append(window.$loading);
    } catch (e) {
      debug('Error28' + e);
    }
    return window.$loading;
  },
  /**
   * 移除加载动画
   * @method [加载] - removeLoading
   * @author wyj 15.04.08
   * @example
   *      Utils.removeLoading();
   */
  removeLoading: function (options) {
    if (window.$loading) window.$loading.remove();
    else $('.loading').remove();
  },
  /**
   * input鼠标点击提示
   *
   * @method [提示] - initTooltip
   * @param msg
   * @param options
   * @author wyj 14.12.24
   * @example
   *        this.$('input, textarea').each(function(){
       *          var title = $(this).attr('title');
       *          if (title){
       *            $(this).click(function(){
       *            Utils.initTooltip(title, {
       *              align: 'right',
       *              target: $(this).get(0)
       *            });
       *          });
       *          }
       *        });
   */
  initTooltip: function (msg, options) {
    options = Est.extend({
      id: Est.nextUid('dialog'),
      content: msg,
      time: 4000,
      align: 'right',
      padding: 5
    }, options);
    seajs.use(['dialog-plus'], function (dialog) {
      window.tooltipDialog && window.tooltipDialog.close();
      window.tooltipDialog = app.addDialog(dialog(options)).show(options.target);
      setTimeout(function () {
        window.tooltipDialog.close().remove();
      }, options.time);
    });
  },
  /**
   * 调用方法 - 命令模式[说明， 只有在需要记录日志，撤销、恢复操作等功能时调用该方法]
   *
   * @method [调用] - execute ( 调用方法 )
   * @param name
   * @return {*}
   * @author wyj 15.2.15
   * @example
   *      Utils.execute( "initSelect", {
     *        ...
     *      }, this);
   */
  execute: function (name) {
    debug('- BaseUtils.execute ' + name);
    return BaseUtils[name] && BaseUtils[name].apply(BaseUtils, [].slice.call(arguments, 1));
  }
}
