app.addModule('UiTest', 'ui/test/controllers/UiTest.js');
app.addTemplate('template/ui_test', function(require, exports, module) {
  module.exports = require('ui/test/views/ui_test.html');
});
app.addModule('UiData', 'ui/test/controllers/UiData.js');
app.addRoute('test', function() {
  seajs.use(['UiTest'], function(UiTest) {
    app.addRegion('main', UiTest, {
      el: '#mobile-main'
    });
  });
});

app.addModule('UiList', 'ui/test/controllers/UiList.js');
//app.addTemplate('template/ui_list', 'ui/test/views/ui_list.html');
app.addTemplate('template/ui_list', function(require, exports, module) {
  module.exports = require('ui/test/views/ui_list.html');
});
app.addModule('UiDialog', 'ui/test/controllers/UiDialog.js');
app.addTemplate('template/ui_dialog', function(require, exports, module) {
  module.exports = require('ui/test/views/ui_dialog.html');
});
app.addModule('UiSelect', 'ui/test/controllers/UiSelect.js');
app.addTemplate('template/ui_select', function(require, exports, module) {
  module.exports = require('ui/test/views/ui_select.html');
});
app.addModule('UiDropDown', 'ui/test/controllers/UiDropDown.js');
app.addTemplate('template/ui_drop_down', function(require, exports, module) {
  module.exports = require('ui/test/views/ui_drop_down.html');
});
app.addModule('UiItemCheck', 'ui/test/controllers/UiItemCheck.js');
app.addTemplate('template/ui_item_check', function(require, exports, module) {
  module.exports = require('ui/test/views/ui_item_check.html');
});
app.addModule('UiTab', 'ui/test/controllers/UiTab.js');
app.addTemplate('template/ui_tab', function(require, exports, module) {
  module.exports = require('ui/test/views/ui_tab.html');
});
app.addModule('UiListTree', 'ui/test/controllers/UiListTree.js');
app.addTemplate('template/ui_list_tree', function(require, exports, module) {
  module.exports = require('ui/test/views/ui_list_tree.html');
});
app.addModule('UiTree', 'ui/test/controllers/UiTree.js');
app.addTemplate('template/ui_tree', function(require, exports, module) {
  module.exports = require('ui/test/views/ui_tree.html');
});
app.addModule('UiDatePicker', 'ui/test/controllers/UiDatePicker.js');
app.addTemplate('template/ui_date_picker', function(require, exports, module) {
  module.exports = require('ui/test/views/ui_date_picker.html');
});
app.addModule('UiColorPicker', 'ui/test/controllers/UiColorPicker.js');
app.addTemplate('template/ui_color_picker', function(require, exports, module) {
  module.exports = require('ui/test/views/ui_color_picker.html');
});
