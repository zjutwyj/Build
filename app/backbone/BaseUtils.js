/**
 * @description BaseUtils
 * @class BaseUtils - 底层工具类
 * @author yongjin<zjut_wyj@163.com> 2015/1/27
 */
var BaseUtils = {
  /**
   * 对话框
   *
   * @method [对话框] - dialog
   * @param options [title: ][width: ][height: ][target: ][success: 确定按钮回调]
   * @author wyj 14.12.18
   * @example
   *      BaseUtils.dialog({
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
  dialog: function(options) {
    var button = options.button || [];
    seajs.use(['dialog-plus'], function(dialog) {
      if (options.success) {
        button.push({
          value: CONST.LANG.CONFIRM,
          autofocus: true,
          callback: function() {
            options.success.apply(this, arguments);
          }
        });
      }
      if (!options.hideCloseBtn) {
        button.push({
          value: CONST.LANG.CLOSE,
          callback: function() {
            this.close().remove();
          }
        });
      }
      options = Est.extend({
        id: options.id || options.moduleId || Est.nextUid('dialog'),
        title: CONST.LANG.DIALOG_TIP,
        width: 150,
        content: '',
        button: button
      }, options);
      if (options.target) {
        options.target = $(options.target).get(0);
      }
      options.oniframeload = function() {
        try {
          this.iframeNode.contentWindow.topDialog = thisDialog;
          this.iframeNode.contentWindow.app = app;
          delete app.getRoutes().index;
        } catch (e) {}
        if (typeof options.load === 'function') {
          options.load.call(this, arguments);
        }
      };
      if (options.cover) {
        //options.quickClose = false;
        app.addDialog(dialog(options), options.id).showModal(options.target);
      } else {
        app.addDialog(dialog(options), options.id).show(options.target);
      }
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
   *      BaseUtils.tip('提示内容', {
   *        time: 1000,
   *        title: '温馨提示'
   *      });
   */
  tip: function(msg, options) {
    options = Est.extend({
      id: 'tip-dialog' + Est.nextUid(),
      time: 3000,
      content: '<div style="padding: 10px;">' + msg + '</div>',
      title: null
    }, options);
    seajs.use(['dialog-plus'], function(dialog) {
      window.tipsDialog && window.tipsDialog.close().remove();
      window.tipsDialog = app.addDialog(dialog(options)).show(options.target);
      setTimeout(function() {
        window.tipsDialog.close().remove();
      }, options.time);
    });
  },
  /**
   * 确认框， 比如删除操作
   *
   * @method [对话框] - confirm
   * @param opts [title: 标题][content: 内容][success: 成功回调]
   * @author wyj 14.12.8
   * @example
   *      BaseUtils.confirm({
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
  confirm: function(opts) {
    var options = {
      title: CONST.LANG.WARM_TIP,
      content: CONST.LANG.DEL_CONFIRM,
      success: function() {},
      target: null
    };
    Est.extend(options, opts);
    seajs.use(['dialog-plus'], function(dialog) {
      window.comfirmDialog = app.addDialog(dialog({
        id: 'dialog' + Est.nextUid(),
        title: options.title,
        content: '<div style="padding: 20px;">' + options.content + '</div>',
        width: options.width || 200,
        button: [{
          value: CONST.LANG.CONFIRM,
          autofocus: true,
          callback: function() {
            options.success && options.success.call(this);
          }
        }, {
          value: CONST.LANG.CANCEL,
          callback: function() {
            window.comfirmDialog.close().remove();
            options.cancel && options.cancel.call(this);
          }
        }],
        onClose: function() {
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
  addLoading: function(options) {
    try {
      if (window.$loading) window.$loading.remove();
      window.$loading = $('<div class="loading"></div>');
      $('body').append(window.$loading);
    } catch (e) {
      debug('Error28' + e); //debug__
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
  removeLoading: function(options) {
    if (window.$loading) window.$loading.remove();
    else $('.loading').remove();
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
  execute: function(name) {
    debug('- BaseUtils.execute ' + name); //debug__
    return BaseUtils[name] && BaseUtils[name].apply(BaseUtils, [].slice.call(arguments, 1));
  }
};
