app.addModule('ColorPicker', 'ui/color_picker/controllers/ColorPicker.js');
app.addTemplate('template/color_picker', function (require, exports, module) {
  module.exports = require('ui/color_picker/views/color_picker.html');
});

