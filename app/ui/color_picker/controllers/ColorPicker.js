/**
 * @description ColorPicker
 * @class UI - ui库
 * @author yongjin<zjut_wyj@163.com> 2015/8/15
 */
define('ColorPicker', ['template/color_picker', 'noUiSlider', 'ItemCheck'], function(require, exports, module) {
  var ColorPicker, Picker, template, noUiSlider, ItemCheck;

  template = require('template/color_picker');
  noUiSlider = require('noUiSlider');
  ItemCheck = require('ItemCheck');

  var rgbRegex = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/;


  function prependZeroIfNecessaryHelper(hex) {
    return hex.length == 1 ? '0' + hex : hex;
  }

  function rgbToHex(r, g, b) {
    r = Number(r);
    g = Number(g);
    b = Number(b);
    if (isNaN(r) || r < 0 || r > 255 || isNaN(g) || g < 0 || g > 255 || isNaN(b) || b < 0 || b > 255) {
      return '#ffffff';
      throw Error('"(' + r + ',' + g + ',' + b + '") is not a valid RGB color');
    }
    var hexR = prependZeroIfNecessaryHelper(r.toString(16));
    var hexG = prependZeroIfNecessaryHelper(g.toString(16));
    var hexB = prependZeroIfNecessaryHelper(b.toString(16));
    return '#' + hexR + hexG + hexB;
  };

  function changeToRGBA(r, g, b) {
    if ((g == void 0) && (typeof r == 'string')) {
      r = r.replace(/^\s*#|\s*$/g, '');
      if (r.length == 3) {
        r = r.replace(/(.)/g, '$1$1');
      }
      if (r.indexOf('rgb') > -1) {
        if (r === 'rgba(0, 0, 0, 0)') r = 'rgba(255, 255, 255, 0)';
        var partsRGBA = r.match(rgbRegex);
        if (!partsRGBA[4]) {
          partsRGBA[4] = 1;
        }
        return {
          rgba: 'rgba(' + partsRGBA[1] + ',' + partsRGBA[2] + ',' + partsRGBA[3] + ',' + partsRGBA[4] + ')',
          r: parseInt(partsRGBA[1], 10),
          g: parseInt(partsRGBA[2], 10),
          b: parseInt(partsRGBA[3], 10),
          a: parseFloat(partsRGBA[4])
        }
      } else {
        g = parseInt(r.substr(2, 2), 16);
        b = parseInt(r.substr(4, 2), 16);
        r = parseInt(r.substr(0, 2), 16);
      }
    }

    var min, a = (255 - (min = Math.min(r, g, b))) / 255;

    return {
      r: parseInt(r, 10),
      g: parseInt(g, 10),
      b: parseInt(b, 10),
      a: a = 1,
      rgba: 'rgba(' + r + ', ' + g + ', ' + b + ', ' + a + ')'
    };
  }

  jQuery.fn.farbtastic = function(callback) {
    $.farbtastic(this, callback);
    return this;
  };

  jQuery.farbtastic = function(container, callback) {
    var container = $(container).get(0);
    return container.farbtastic || (container.farbtastic = new jQuery._farbtastic(container, callback));
  }

  jQuery._farbtastic = function(container, callback) {
    // Store farbtastic object
    var fb = this;

    // Insert markup
    $(container).html('<div class="farbtastic"><div class="color"></div><div class="wheel"></div><div class="overlay"></div><div class="h-marker marker"></div><div class="sl-marker marker"></div></div>');
    var e = $('.farbtastic', container);
    fb.wheel = $('.wheel', container).get(0);
    // Dimensions
    fb.radius = 84;
    fb.square = 100;
    fb.width = 194;

    // Fix background PNGs in IE6
    if (navigator.appVersion.match(/MSIE [0-6]\./)) {
      $('*', e).each(function() {
        if (this.currentStyle.backgroundImage != 'none') {
          var image = this.currentStyle.backgroundImage;
          image = this.currentStyle.backgroundImage.substring(5, image.length - 2);
          $(this).css({
            'backgroundImage': 'none',
            'filter': "progid:DXImageTransform.Microsoft.AlphaImageLoader(enabled=true, sizingMethod=crop, src='" + image + "')"
          });
        }
      });
    }

    /**
     * Link to the given element(s) or callback.
     * @method linkTo
     * @private
     */
    fb.linkTo = function(callback) {
      // Unbind previous nodes
      if (typeof fb.callback == 'object') {
        $(fb.callback).unbind('keyup', fb.updateValue);
      }

      // Reset color
      fb.color = null;

      // Bind callback or elements
      if (typeof callback == 'function') {
        fb.callback = callback;
      } else if (typeof callback == 'object' || typeof callback == 'string') {
        fb.callback = $(callback);
        fb.callback.bind('keyup', fb.updateValue);
        if (fb.callback.get(0).value) {
          fb.setColor(fb.callback.get(0).value);
        }
      }
      return this;
    }
    fb.updateValue = function(event) {
      if (this.value && this.value != fb.color) {
        fb.setColor(this.value);
      }
    }

    /**
     * Change color with HTML syntax #123456
     * @method setColor
     * @private
     */
    fb.setColor = function(color) {
      var unpack = fb.unpack(color);
      if (fb.color != color && unpack) {
        fb.color = color;
        fb.rgb = unpack;
        fb.hsl = fb.RGBToHSL(fb.rgb);
        fb.updateDisplay();
      }
      return this;
    }

    /**
     * Change color with HSL triplet [0..1, 0..1, 0..1]
     * @method setHSl
     * @private
     */
    fb.setHSL = function(hsl) {
      fb.hsl = hsl;
      fb.rgb = fb.HSLToRGB(hsl);
      fb.color = fb.pack(fb.rgb);
      fb.updateDisplay();
      return this;
    }

    /////////////////////////////////////////////////////

    /**
     * Retrieve the coordinates of the given event relative to the center
     * of the widget.
     * @method widgetCoords
     * @private
     */
    fb.widgetCoords = function(event) {
      var x, y;
      var el = event.target || event.srcElement;
      var reference = fb.wheel;

      if (typeof event.offsetX != 'undefined') {
        // Use offset coordinates and find common offsetParent
        var pos = { x: event.offsetX, y: event.offsetY };

        // Send the coordinates upwards through the offsetParent chain.
        var e = el;
        while (e) {
          e.mouseX = pos.x;
          e.mouseY = pos.y;
          pos.x += e.offsetLeft;
          pos.y += e.offsetTop;
          e = e.offsetParent;
        }

        // Look for the coordinates starting from the wheel widget.
        var e = reference;
        var offset = { x: 0, y: 0 }
        while (e) {
          if (typeof e.mouseX != 'undefined') {
            x = e.mouseX - offset.x;
            y = e.mouseY - offset.y;
            break;
          }
          offset.x += e.offsetLeft;
          offset.y += e.offsetTop;
          e = e.offsetParent;
        }

        // Reset stored coordinates
        e = el;
        while (e) {
          e.mouseX = undefined;
          e.mouseY = undefined;
          e = e.offsetParent;
        }
      } else {
        // Use absolute coordinates
        var pos = fb.absolutePosition(reference);
        x = (event.pageX || 0 * (event.clientX + $('html').get(0).scrollLeft)) - pos.x;
        y = (event.pageY || 0 * (event.clientY + $('html').get(0).scrollTop)) - pos.y;
      }
      // Subtract distance to middle
      return { x: x - fb.width / 2, y: y - fb.width / 2 };
    }

    /**
     * Mousedown handler
     * @method mousedown
     * @private
     */
    fb.mousedown = function(event) {
      // Capture mouse
      if (!document.dragging) {
        $(document).bind('mousemove', fb.mousemove).bind('mouseup', fb.mouseup);
        document.dragging = true;
      }

      // Check which area is being dragged
      var pos = fb.widgetCoords(event);
      fb.circleDrag = Math.max(Math.abs(pos.x), Math.abs(pos.y)) * 2 > fb.square;

      // Process
      fb.mousemove(event);
      return false;
    }

    /**
     * Mousemove handler
     * @method mousemove
     * @private
     */
    fb.mousemove = function(event) {
      // Get coordinates relative to color picker center
      var pos = fb.widgetCoords(event);

      // Set new HSL parameters
      if (fb.circleDrag) {
        var hue = Math.atan2(pos.x, -pos.y) / 6.28;
        if (hue < 0) hue += 1;
        fb.setHSL([hue, fb.hsl[1], fb.hsl[2]]);
      } else {
        var sat = Math.max(0, Math.min(1, -(pos.x / fb.square) + .5));
        var lum = Math.max(0, Math.min(1, -(pos.y / fb.square) + .5));
        fb.setHSL([fb.hsl[0], sat, lum]);
      }
      return false;
    }

    /**
     * Mouseup handler
     * @method mouseup
     * @private
     */
    fb.mouseup = function() {
      // Uncapture mouse
      $(document).unbind('mousemove', fb.mousemove);
      $(document).unbind('mouseup', fb.mouseup);
      document.dragging = false;
    }

    /**
     * Update the markers and styles
     * @method updateDisplay
     * @private
     */
    fb.updateDisplay = function() {
      // Markers
      var angle = fb.hsl[0] * 6.28;
      $('.h-marker', e).css({
        left: Math.round(Math.sin(angle) * fb.radius + fb.width / 2) + 'px',
        top: Math.round(-Math.cos(angle) * fb.radius + fb.width / 2) + 'px'
      });

      $('.sl-marker', e).css({
        left: Math.round(fb.square * (.5 - fb.hsl[1]) + fb.width / 2) + 'px',
        top: Math.round(fb.square * (.5 - fb.hsl[2]) + fb.width / 2) + 'px'
      });

      // Saturation/Luminance gradient
      $('.color', e).css('backgroundColor', fb.pack(fb.HSLToRGB([fb.hsl[0], 1, 0.5])));

      // Linked elements or callback
      if (typeof fb.callback == 'object') {
        // Set background/foreground color
        $(fb.callback).css({
          backgroundColor: fb.color,
          color: fb.hsl[2] > 0.5 ? '#000' : '#fff'
        });

        // Change linked value
        $(fb.callback).each(function() {
          if (this.value && this.value != fb.color) {
            this.value = fb.color;
          }
        });
      } else if (typeof fb.callback == 'function') {
        fb.callback.call(fb, fb.color);
      }
    }

    /**
     * Get absolute position of element
     * @method absolutePosition
     * @private
     */
    fb.absolutePosition = function(el) {
      var r = { x: el.offsetLeft, y: el.offsetTop };
      // Resolve relative to offsetParent
      if (el.offsetParent) {
        var tmp = fb.absolutePosition(el.offsetParent);
        r.x += tmp.x;
        r.y += tmp.y;
      }
      return r;
    };

    /* Various color utility functions */
    fb.pack = function(rgb) {
      var r = Math.round(rgb[0] * 255);
      var g = Math.round(rgb[1] * 255);
      var b = Math.round(rgb[2] * 255);
      return '#' + (r < 16 ? '0' : '') + r.toString(16) +
        (g < 16 ? '0' : '') + g.toString(16) +
        (b < 16 ? '0' : '') + b.toString(16);
    }

    fb.unpack = function(color) {
      if (color.length == 7) {
        return [parseInt('0x' + color.substring(1, 3)) / 255,
          parseInt('0x' + color.substring(3, 5)) / 255,
          parseInt('0x' + color.substring(5, 7)) / 255
        ];
      } else if (color.length == 4) {
        return [parseInt('0x' + color.substring(1, 2)) / 15,
          parseInt('0x' + color.substring(2, 3)) / 15,
          parseInt('0x' + color.substring(3, 4)) / 15
        ];
      }
    }

    fb.HSLToRGB = function(hsl) {
      var m1, m2, r, g, b;
      var h = hsl[0],
        s = hsl[1],
        l = hsl[2];
      m2 = (l <= 0.5) ? l * (s + 1) : l + s - l * s;
      m1 = l * 2 - m2;
      return [this.hueToRGB(m1, m2, h + 0.33333),
        this.hueToRGB(m1, m2, h),
        this.hueToRGB(m1, m2, h - 0.33333)
      ];
    }

    fb.hueToRGB = function(m1, m2, h) {
      h = (h < 0) ? h + 1 : ((h > 1) ? h - 1 : h);
      if (h * 6 < 1) return m1 + (m2 - m1) * h * 6;
      if (h * 2 < 1) return m2;
      if (h * 3 < 2) return m1 + (m2 - m1) * (0.66666 - h) * 6;
      return m1;
    }

    fb.RGBToHSL = function(rgb) {
      var min, max, delta, h, s, l;
      var r = rgb[0],
        g = rgb[1],
        b = rgb[2];
      min = Math.min(r, Math.min(g, b));
      max = Math.max(r, Math.max(g, b));
      delta = max - min;
      l = (min + max) / 2;
      s = 0;
      if (l > 0 && l < 1) {
        s = delta / (l < 0.5 ? (2 * l) : (2 - 2 * l));
      }
      h = 0;
      if (delta > 0) {
        if (max == r && max != g) h += (g - b) / delta;
        if (max == g && max != b) h += (2 + (b - r) / delta);
        if (max == b && max != r) h += (4 + (r - g) / delta);
        h /= 6;
      }
      return [h, s, l];
    }

    // Install mousedown handler (the others are set on the document on-demand)
    $('*', e).mousedown(fb.mousedown);

    // Init color
    fb.setColor('#000000');

    // Set linked elements/callback
    if (callback) {
      fb.linkTo(callback);
    }
    return fb;
  }

  /**
   * 颜色选取
   * @method [颜色选取] - ColorPicker
   * @example
   *      this._dialog({
   *        moduleId: 'ColorPicker',
   *        title: null,
   *        quickClose: true,
   *        cover: false,
   *        hideCloseBtn: true,
   *        width: 400,
   *        color: $target.css('background-color'),
   *        hideSaveBtn: true,
   *        target: $node.get(0),
   *        change: Est.proxy(function (color) {
   *          $child.css('background-color', color);
   *          $target.css('background-color', color);
   *        }, this)
   *      });
   */
  Picker = BaseView.extend({
    events: {
      'keyup .ui-color-input': 'handleInput',
      'click .ui-color-ok': 'colorOk'
    },
    initialize: function() {
      this._initialize({
        template: template,
        beforeRender: function() {
          this.model.set('viewId', Est.nextUid('farbtatic'));
          this.init = true;
        },
        afterRender: this.afterRender
      });
    },
    initFarbtastic: function() {
      this.$show = this.$('.ui-bg-color-show');
      this.$input = this.$('.ui-color-input');
      this.$input.on('click', function(e) {
        e.preventDefault();
      });
      this.farbtastic = $.farbtastic('#' + this.model.get('viewId'), Est.throttle(function(color) {
        if (typeof this.isTransparent !== 'undefined' && this.isTransparent) {
          this.color.a = 0;
          this.updateSlider();
        } else if (this.color.a === 0) {
          this.color.a = 1;
          this.updateSlider();
        }
        this.isTransparent = false;
        this.parseRgb(color);
      }, 30, 100000000, this));
      this.updateFarbtasticColor();
    },
    /**
     * 设置颜色    格式为 255,255,255
     * @method updateFarbtasticColor
     * @param color
     * @private
     */
    updateFarbtasticColor: function() {
      debug('updateFarbtasticColor');
      this.farbtastic.setColor(rgbToHex(this.color.r, this.color.g, this.color.b));
    },
    /**
     * 初始化拖动
     * @method initSlider
     * @private
     */
    initSlider: function() {
      this.$slider = this.$('#' + this.model.get('viewId') + '-slider');
      noUiSlider.create(this.$slider.get(0), {
        start: parseInt(this.color.a * 100),
        range: { 'min': 0, 'max': 100 }
      });
      try {
        this.$slider.get(0).noUiSlider.on('update', Est.proxy(function(values, handle) {
          if (handle == 0) { // 第一个滑动按钮
            this.color.a = values[handle] / 100;
            this.handleChange();
          }
        }, this));
      } catch (e) {}
      this.setGradient(this.color.hex || '#ffffff');
    },
    /**
     * 初始化系统颜色
     * @method initSystemColor
     * @private
     */
    initSystemColor: function() {
      app.addRegion('initColorPickerSystemColor', ItemCheck, {
        el: this.$('#' + this.model.get('viewId') + '-system'),
        tpl: '<span class="cd-r-cur-in-cnt fl" style="width: 100%;height: 100%;display: inline-block;background-color:{{value}}">&nbsp;</span>',
        cur: this._options.color || '#ffffff',
        path: 'value',
        checkAppend: false,
        items: app.getStatus('backgroundColor'),
        change: Est.proxy(function(item) {
          this.isTransparent = item['value'] === 'transparent' ? true : false;
          var color = this.isTransparent ? '#ffffff' : item['value'];
          var opacity = this.isTransparent ? 0 : 1;
          this.parseRgb(color, opacity);
          this.updateFarbtasticColor();
          this.updateSlider();
        }, this),
        afterRender: Est.proxy(function() {

        }, this)
      });
    },
    /**
     * 解析历史记录
     * @method parseHistory
     * @private
     */
    parseHistory: function() {
      try {
        this.history = JSON.parse(app.getSession('ColorPickerHistory'));
      } catch (e) {
        this.history = [
          { text: '#ffffff', value: '#ffffff' }
        ];
      }
    },
    /**
     * 保存历史记录
     * @method saveHistory
     * @private
     */
    saveHistory: function() {
      if (this.history && this.history[0]['value'] !== this.color.rgba) {
        this.history.unshift({
          text: 'aaa',
          value: this.color.rgba || '#ffffff'
        });
        if (this.history.length > 16) {
          this.history.pop();
        }
      }
      app.addSession('ColorPickerHistory', JSON.stringify(this.history));
    },
    /**
     * 初始化历史记录
     * @method initHistoryColor
     * @private
     */
    initHistoryColor: function() {
      this.parseHistory();
      app.addRegion('initColorPickerHistoryColor', ItemCheck, {
        el: this.$('.color-picker-history'),
        viewId: 'initColorPickerHistoryColor',
        tpl: '<span class="cd-r-cur-in-cnt fl" style="width: 100%;height: 100%;display: inline-block;background-color:{{value}}">&nbsp;</span>',
        cur: this._options.color || '#ffffff',
        path: 'value',
        items: this.history,
        change: Est.proxy(function(item) {
          this.parseColor(item['value']);
          this.updateFarbtasticColor();
          this.updateSlider();
        }, this)
      });
    },
    /**
     * 设置浅变
     * @method setGradient
     * @param color
     * @private
     */
    setGradient: function(color) {
      debug('setGradient');
      if (this.$slider) {
        this.$noUiBase = this.$noUiBase || this.$slider.find('.noUi-base');
        this.$noUiBase.css('background', 'linear-gradient(to right, rgba(77, 118, 129, 0), ' + color + ')');
      }
    },
    updateSlider: function() {
      debug('updateSlider');
      this.$slider.get(0).noUiSlider.set(parseInt(this.color.a * 100, 10));
    },
    /**
     * 文本框绑定
     *
     * @method handleInput
     * @private
     * 1. 过滤颜色
     * 2. 更新颜色组件颜色
     * 3. 调用change函数
     */
    handleInput: function() {
      debug('handleInput');
      var val = this.$input.val();
      this.parseColor(val);
      this.updateFarbtasticColor();
      this.handleChange();
    },
    /**
     * 过滤颜色 分别生成r g b a rbg hex
     * @method parseColor
     * @param color
     * @private
     */
    parseColor: function(color) {
      debug('parseColor');
      this.color = changeToRGBA(color);
      this.color.hex = rgbToHex(this.color.r, this.color.g, this.color.b);
      if (this.color.a === 0) {
        this.isTransparent = true;
      }
    },
    /**
     * 解析rgb并调用handleChange函数
     * @method aprseRgb
     * @private
     * @param color
     */
    parseRgb: function(color, opacity) {
      debug('parseRgb' + opacity);
      var _color = changeToRGBA(color);
      this.color.r = _color.r;
      this.color.g = _color.g;
      this.color.b = _color.b;
      if (typeof opacity !== 'undefined') this.color.a = opacity;
      this.color.hex = color;
      this.color.rgba = 'rgba(' + this.color.r + ',' + this.color.g + ',' + this.color.b + ',' + this.color.a + ')';
      this.handleChange();
    },
    /**
     * 设置颜色
     *
     * @method handleChange
     * @private
     * 1.设置展示区颜色
     * 2.设置文本框值
     * 3.设置浅变
     * 4.执行回调函数
     * @param color
     */
    handleChange: function() {
      debug('handleChange');
      this.color.rgba = 'rgba(' + this.color.r + ',' + this.color.g + ',' + this.color.b + ',' + this.color.a + ')';
      this.$show.css('background-color', this.color.rgba);
      this.$input.val(this.color.hex);
      this.setGradient(this.color.hex);
      this._options.change && this._options.change.call(this, this.color.rgba, this.init);
    },
    /**
     * 确定按钮绑定
     * @method colorOk
     * @private
     * 1.保存历史记录
     */
    colorOk: function() {
      this.saveHistory();
      this._options.ok && this._options.ok.call(this, this.color.rgba);
      app.getCurrentDialog().close();
    },
    afterRender: function() {
      this.parseColor(this._options.color);
      this.initFarbtastic();
      this.initSlider();
      if (!this._options.min) {
        this.initSystemColor();
        this.initHistoryColor();
      } else {
        this.$el.addClass('color-picker-min');
      }
      this.init = false;
    }
  });


  ColorPicker = BaseView.extend({
    events: {
      'click .ui-color-picker-wrap': 'openColorDialog'
    },
    initialize: function() {
      this._initialize({
        template: '<div class="ui-color-picker-wrap">{{{tpl}}}</div>',
        afterRender: this.afterRender,
        beforeRender: this.beforeRender
      });
    },
    beforeRender: function() {
      this.model.set('color', this._options.target ? $(this._options.target).val() : this._options.cur);
      this.model.set('tpl', this._options.tpl || '<div class="ui-color-picker-inner" style="width: ' +
        (this._options.width || 25) + 'px;height: ' + (this._options.height || 25) + 'px;background-color: ' +
        (this.model.get('color')) + ';"></div>');
    },
    afterRender: function() {
      /*this.picker = new Picker({
        el: this.$('.ui-color-picker-wrap')
      });*/
    },
    openColorDialog: function() {
      this._dialog(Est.extend(app.getOption('dialog_min'), {
        id: Est.nextUid('colorpicker'),
        moduleId: Picker,
        width: 'auto',
        zIndex: 9999,
        color: this.model.get('color'),
        target: this.el,
        change: Est.proxy(function(color) {
          $(this._options.target).val(color);
          this.model.set('color', color);
          this.$('.ui-color-picker-inner').css('background-color', color);
          if (this._options.change) this._options.change.call(this, color);
        }, this),
        onClose: function() {
          app.getCurrentDialog().close().remove();
        }
      }));
    },
    destory: function() {}
  });

  module.exports = ColorPicker;
});
