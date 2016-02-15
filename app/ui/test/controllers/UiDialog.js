/**
 * @description 模块功能说明
 * @class ModuleName
 * @author yongjin<zjut_wyj@163.com> 2016/2/6
 */
define('UiDialog', ['template/ui_dialog'], function(require, exports, module) {
  var UiDialog, template;

  template = require('template/ui_dialog');

  UiDialog = BaseView.extend({
    events: {
      'click #ui-dialog-module': 'openDialogModule',
      'click #ui-dialog-modal': 'openDialogModal',
      'click #ui-dialog-tip': 'openDialogTip',
      'click #ui-dialog-confirm': 'openDialogConfirm',
      'click #ui-dialog-content': 'openDialogContent'
    },
    initialize: function() {
      this._initialize({
        template: template
      });
    },

    /**
     * 模块对话框
     * @method openDialogModule
     * @param  {object} e [description]
     * @return {*}   [description]
     */
    openDialogModule: function(e) {
      this._dialog(Est.extend(app.getOption('dialog_min'), {
        moduleId: 'HomeIntro', // 模块ID
        title: 'title', // 对话框标题
        id: 'dialogId', // 对话框ID
        width: 600, // 对话框宽度
        height: 250, // 对话框高度
        skin: 'form-horizontal' // className
      }));

    },
    /**
     * 普通对话框
     * @method openDialogContent
     * @return {*} [description]
     */
    openDialogContent: function() {
      Utils.dialog(Est.extend(app.getOption('dialog_min'), {
        content: 'test'
      }));
    },
    /**
     * 模态对话框
     * @method openDialogModal
     * @return {*} [description]
     */
    openDialogModal: function() {
      Utils.dialog(Est.extend(app.getOption('dialog_min'), {
        content: 'modal',
        title: '模态框',
        cover: true
      }));
    },
    /**
     * 提示对话框
     * @method openDialogTip
     * @return {*} [description]
     */
    openDialogTip: function() {
      Utils.tip('提示内容', {
        time: 1000
      });
    },
    /**
     * 确认对话框
     * @method openDialogConfirm
     * @return {*} [description]
     */
    openDialogConfirm: function() {
      Utils.confirm({
        title: '提示',
        content: '是否删除?',
        success: function() {
          alert('是');
        },
        cancel: function() {
          alert('否');
        }
      });
    }
  });

  module.exports = UiDialog;
});
