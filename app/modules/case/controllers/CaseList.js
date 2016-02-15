/**
 * @description 案例通用列表，如果最新案例，众包案例等
 * @class CaseList
 * @author yongjin<zjut_wyj@163.com> 2015/12/28
 */
define('CaseList', ['template/case_list', 'Tab'], function(require, exports, module) {
  var CaseList, template, Tab, model, collection, item, CollectModel;

  template = require('template/case_list');
  Tab = require('Tab');

  CollectModel = BaseModel.extend({
    defaults: Est.extend({}, BaseModel.prototype.defaults),
    baseId: 'collectId',
    baseUrl: CONST.API + '/wcd/collect/detail'
  });

  model = BaseModel.extend({
    defaults: Est.extend({

    }, BaseModel.prototype.defaults),
    baseId: 'wcdId',
    baseUrl: CONST.API + '/index/detail'
  });

  collection = BaseCollection.extend({
    url: function() {
      this.paginationModel.set('pageSize', 20);
      var end = '?page=' + this.paginationModel.get('page') + '&pageSize=' + this.paginationModel.get('pageSize') +
        '&sort=' + (this.paginationModel.get('sortType') || 'addTime');
      if (this.paginationModel.get('name')) {
        end += ('&name=' + this.paginationModel.get('name'));
      }
      if (this.paginationModel.get('categoryId')) {
        end += ('&categoryId=' + this.paginationModel.get('categoryId'));
      }
      if (this.paginationModel.get('enterpriseId')) {
        end += ('&enterpriseId=' + this.paginationModel.get('enterpriseId'));
      }
      return CONST.API + '/index/list' + end;
    },
    model: model
  });

  item = BaseItem.extend({
    tagName: 'div',
    className: 'wdm_item tab-box-shadow animation-zoom',
    events: {
      'click .wdm_item_mark a': 'collect',
      'click .preview': 'preview',
      'click .cloneAdd': 'cloneAdd',
      'mouseenter .icon-erweima': 'showQrCode',
      'mouseout .icon-erweima': 'hideQrCode'
    },
    initialize: function() {
      this._initialize({
        beforeRender: this.beforeRender,
        afterRender: this.afterRender
      });
    },
    beforeRender: function(model) {
      if (model.get('mviews') === undefined) model.set('mviews', '0');
      this.model.attributes.sharepic = this.model.attributes.sharepic === undefined ? 'http://wcd.jihui88.com/leaflet/images/nopic.png' : this.model.attributes.sharepic;
    },
    afterRender: function() {
      this.$(".icon-fenxiang,.icon-liuyan,.icon-xianshi").hover(function() {
        $(this).children(".wdm_item_txt").addClass("animate fadeIn").show();
      }, function() {
        $(this).children(".wdm_item_txt").removeClass("animate fadeIn").hide();
      });
      this.$(".wdm_item_img").hover(function() {
        $(this).children(".wdm_item_mask").addClass("animate");
        $(this).children("img").addClass("blur");
      }, function() {
        $(this).children(".wdm_item_mask").removeClass("animate");
        $(this).children("img").removeClass("blur");
      });
    },
    collect: function() {
      var model = new CollectModel({
        wcdId: this.model.get('wcdId') + ''
      });
      model.hideSaveBtn = true;
      model.hideAddBtn = true;
      model.save({
        success: function(response) {}
      });
    },
    preview: function() {
      window.open('http://www.jihui88.com/wcd/html/' + this.model.get('wcdId') + '.html');
    },
    cloneAdd: function(e) {
      this._navigate('#/design_clone/' + this.model.get('wcdId'), true);
    },
    showQrCode: function(e) {
      e.stopImmediatePropagation();
      this.showQr = true;
      if (!this.$qrCode) {
        this.img = 'http://wcd.jihui88.com/rest/comm/qrbar/create?w=210&text=http://www.jihui88.com/wcd/html/' + this.model.get('wcdId') + '.html?v=40';
        this.$qrCode = $('.qr-code', this.$el);
        this.$qrImg = $('<img style="width: 100%;" src="' + this.img + '"/>');
        this.$qrCode.append(this.$qrImg);
        var img = new Image();
        img.src = this.img;
        img.onload = Est.proxy(function() {
          if (this.showQr) this.tran1(this.$qrCode);
        }, this);
      } else {
        this.tran1(this.$qrCode);
      }
    },
    hideQrCode: function(e) {
      e.stopImmediatePropagation();
      this.showQr = false;
      if (this.$qrCode) this.tran0(this.$qrCode);
    },
    tran0: function(e) {
      e.css({
        '-webkit-transform': 'scale(0) rotateZ(180deg)',
        '-moz-transform': 'scale(0) rotateZ(180deg)',
        '-ms-transform': 'scale(0) rotateZ(180deg)',
        '-o-transform': 'scale(0) rotateZ(180deg)',
        'transform': 'scale(0) rotateZ(180deg)',
        'opacity': '0'
      });
    },
    tran1: function(e) {
      e.css({
        '-webkit-transform': 'scale(1) rotateZ(0deg)',
        '-moz-transform': 'scale(1) rotateZ(0deg)',
        '-ms-transform': 'scale(1) rotateZ(0deg)',
        '-o-transform': 'scale(1) rotateZ(0deg)',
        'transform': 'scale(1) rotateZ(0deg)',
        'opacity': '1'
      });
    }
  });

  CaseList = BaseList.extend({
    events: {
      'focus .wdm_input': 'searchFocus',
      'blur .wdm_input': 'searchBlur',
      'click .wrap-load-more': 'loadMore',
      'click .search-submit': 'search',
      'click .wdm_cat a': 'category',
      'click .wdm_tag a': 'subCategory',
      'click .wdm_serial a': 'sort'
    },
    initialize: function() {
      this._initialize({
        model: model,
        collection: collection,
        item: item,
        viewId: 'caseList',
        modelBind: true,
        toolTip: true,
        append: true,
        cache: true,
        render: '.wdm_list',
        template: template,
        pagination: true,
        enterRender: '.search-submit',
        afterRender: this.afterRender,
        beforeLoad: this.beforeLoad,
        afterLoad: this.afterLoad
      });
    },
    afterLoad: function() {
      this.$('.no-result').hide();
      if (this.collection.paginationModel.get('totalPage') === 0 ||
        this.collection.paginationModel.get('page') === this.collection.paginationModel.get('totalPage')) {
        this.$('.wrap-load-more').hide();
      } else {
        this.$('.wrap-load-more').show();
      }
    },
    beforeLoad: function() {
      if (this.isSearch) {
        return;
      }
      if (this.options.data.type === 'new') {
        this.collection.paginationModel.set('sortType', 'addTime');
        this.collection.paginationModel.set('enterpriseId', 'Enterp_0000000000000000000054323');
      }
      if (this.options.data.type === 'market') {
        this.collection.paginationModel.set('sortType', '(w.views+w.mviews*2)');
      }
    },
    afterRender: function() {
      var ctx = this;
      Service.getCategory().then(function(response) {
        response.splice(0, 1);
        var nodeCur;
        if (ctx.options.data.type === 'new') {
          response.unshift({
            name: '全部',
            categoryId: '',
            nodeId: '#config-none'
          });
        } else if (ctx.options.data.type === 'market') {
          response.unshift({
            name: '全部',
            categoryId: '',
            nodeId: '#config-none'
          });
        }
        //response.reverse();

        app.addRegion(Est.nextUid('CategoryRoot'), Tab, {
          el: ctx.$('.category-root'),
          tpl: '<a href="javascript:;">{{name}}</a>',
          toolTip: true,
          cur: nodeCur || '#config-none',
          require: false,
          theme: 'tab-ul-text',
          path: 'nodeId',
          items: response,
          change: Est.proxy(function(item, init) {
            if (init && item.categoryId === '') return;
            ctx.collection.paginationModel.set('categoryId', item.categoryId);
            ctx._reload();

            Service.getSubCategory({
              id: item.categoryId
            }).then(function(responseSub) {
              if (responseSub.length > 1) {
                ctx.$(".category-sub").show();
              } else {
                ctx.$(".category-sub").hide();
                return false;
              }
              responseSub.splice(0, 1);
              responseSub.push({
                name: '全部',
                categoryId: item.categoryId,
                className: 'category-sub-0',
                nodeId: '#config-nodeSub'
              });
              responseSub.reverse();
              app.addRegion('CategorySub', Tab, {
                el: ctx.$('.category-sub'),
                tpl: '<a href="javascript:;" class="{{className}}">{{name}}</a>',
                toolTip: true,
                cur: '#config-nodeSub',
                require: false,
                theme: 'tab-ul-text',
                path: 'nodeId',
                items: responseSub,
                change: Est.proxy(function(itemSub, initSub) {
                  if (initSub) return;
                  ctx.collection.paginationModel.set('categoryId', itemSub.categoryId);
                  ctx._reload();

                }, this)
              });
            });

          }, this)
        });
      });
      app.addRegion('caseListNav', Tab, {
        viewId: 'caseListNav',
        el: this.$('.wdm_serial'),
        tpl: '<a href="javascript:;">{{text}}</a>',
        toolTip: true,
        cur: '#config-' + this.options.data.type,
        require: false,
        theme: 'tab-ul-text',
        path: 'nodeId',
        items: [{
          text: '默认',
          nodeId: '#config-market',
          sortType: '(w.views+w.mviews*2)'
        }, {
          text: '最新',
          nodeId: '#config-new',
          sortType: 'addTime'
        }, {
          text: '浏览量',
          nodeId: '#config-views',
          sortType: 'views'
        }, {
          text: '转发量',
          nodeId: '#config-rviews',
          sortType: 'rviews'
        }, {
          text: '反馈量',
          nodeId: '#config-mviews',
          sortType: 'mviews'
        }],
        change: Est.proxy(function(item, init) {
          if (init) return;
          this.isSearch = true;
          this.collection.paginationModel.set('sortType', item.sortType);
          this.collection.paginationModel.set('page', 1);
          this._reload();
        }, this)
      });
    },
    searchFocus: function(e) {
      this.$('.wdm_search').animate({
        "width": '190'
      }, 300);
      this._getEventTarget(e).width(140);
    },
    searchBlur: function(e) {
      this.$('.wdm_search').animate({
        "width": '150'
      }, 300);
      this._getEventTarget(e).width(120);
    },
    loadMore: function() {
      this.collection.paginationModel.set('page', this.collection.paginationModel.get('page') + 1);
      this._load();
    },
    search: function() {
      this.collection.paginationModel.set('name', this.model.get('searchkey'));
      this.collection.paginationModel.set('page', 1);
      this._reload();
    }
  });

  module.exports = CaseList;
});
