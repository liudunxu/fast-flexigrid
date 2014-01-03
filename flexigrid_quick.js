/*
* Flexigrid for jQuery - New Wave Grid
*
* Copyright (c) 2008 Paulo P. Marinas (webplicity.net/flexigrid)
* Dual licensed under the MIT (MIT-LICENSE.txt)
* and GPL (GPL-LICENSE.txt) licenses.
*
* $Date: 2011/07/14 07:39:35 $
*/
/**
 * changes:
 * 1.change tip $Date 2012/07/01 11:21:31 $
 * 2.remove the functions of dragging and sorting to make faster $Date 2012/07/01 11:21:31 $
 */
(function ($) {

    $.addFlex = function (t, p) {
        if (t.grid) return false; //return if already exist	
        // apply default properties
        p = $.extend({
            height: '350', //default height
            width: 'auto', //auto width
            striped: true, //apply odd even stripes
            novstripe: false,
            minwidth: 30, //min width of columns
            minheight: 80, //min height of columns
            resizable: false, //resizable table
            url: false, //ajax url
            method: 'POST', // data sending method
            dataType: 'json', // type of data loaded
            errormsg: '连接错误，请重试....',
            usepager: false, //
            nowrap: true, //
            page: 1, //current page
            total: 1, //total pages
            useRp: false, //use the results per page select box
            rp: 15, // results per page
            rpOptions: [3, 10, 15, 20, 25, 40],
            title: false,
            pagestat: '共有{total}条记录,当前：{from} - {to}条',
            procmsg: '正在加载数据请等待 ....',
            query: '',
            qtype: '',
            nomsg: '没有任何记录....',
            minColToggle: 1, //minimum allowed column to be hidden
            showToggleBtn: true, //show or hide column toggle popup
            hideOnSubmit: true,
            autoload: true,
            blockOpacity: 0.5,
            onToggleCol: false,
            onChangeSort: false,
            onSuccess: false,
            onSubmit: false // using a custom populate function
        }, p);

        $(t).show().attr({ cellPadding: 0, cellSpacing: 0, border: 0 }).removeAttr('width');
        //create grid class
        var g = {
            hset: {},
            fixHeight: function (newH) {
                newH = false;
                if (!newH) newH = $(g.bDiv).height();
                $(g.block).css({ height: newH, marginBottom: (newH * -1) });
            },
            scroll: function () {
                this.hDiv.scrollLeft = this.bDiv.scrollLeft;
            },
            addData: function (data) { //parse data
                if (p.preProcess) data = p.preProcess(data);
                $('.pReload', this.pDiv).removeClass('loading');
                this.loading = false;
                if (!data) {
                    $('.pPageStat', this.pDiv).html(p.errormsg);
                    return false;
                }
                p.total = data.total;
                for (var i = 0; i < p.colModel.length; i++) {
                    if (p.colModel[i].width) {
                        $('div', $('.hDivBox th:eq(' + i + ')')).css('width', p.colModel[i].width + 'px');
                    }
                }
                if (p.total == 0) {
                    $(t).empty();
                    p.pages = 1;
                    p.page = 1;
                    this.buildpager();
                    $('.pPageStat', this.pDiv).html(p.nomsg);
                    return false;
                }
                p.pages = Math.ceil(p.total / p.rp);
                p.page = data.page;
                this.buildpager();
                var thLength = p.colModel.length;
                var a = new Array();
                var b = new Array();
                var trRows = new Array();
                $.each(data.rows, function (i, row) {
                    b[0] = "<tr";
                    if ((i & 1) && p.striped) {
                        b[1] = " class='erow'>";
                    } else {
                        b[1] = ">";
                    }
                    for (var idx = 0; idx < thLength; idx++) {
                        a[0] = '<td><div>', a[1] = row.cell[idx], a[2] = '</div></td>';
                        b[2 + idx] = (a.join(""));
                    }

                    b[2 + idx] = "</tr>";
                    trRows.push(b.join(""));
                }
					);
                $(t).html(trRows.join(""));
                a = null;
                b = null;
                trRows = null;
                this.addCellProp();
                data = null; i = null;
                if (p.onSuccess) p.onSuccess();
                if (p.hideOnSubmit) $(g.block).remove();
                this.hDiv.scrollLeft = this.bDiv.scrollLeft;
                if ($.browser.opera) $(t).css('visibility', 'visible');
            },
            buildpager: function () { //rebuild pager based on new properties

                $('.pcontrol input', this.pDiv).val(p.page);
                $('.pcontrol span', this.pDiv).html(p.pages);

                var r1 = (p.page - 1) * p.rp + 1;
                var r2 = r1 + p.rp - 1;

                if (p.total < r2) r2 = p.total;

                var stat = p.pagestat;

                stat = stat.replace(/{from}/, r1);
                stat = stat.replace(/{to}/, r2);
                stat = stat.replace(/{total}/, p.total);

                $('.pPageStat', this.pDiv).html(stat);

            },
            populate: function () { //get latest data

                if (this.loading) return true;

                if (p.onSubmit) {
                    var gh = p.onSubmit();
                    if (!gh) return false;
                }

                this.loading = true;
                if (!p.url) return false;

                $('.pPageStat', this.pDiv).html(p.procmsg);

                $('.pReload', this.pDiv).addClass('loading');

                $(g.block).css({ top: g.bDiv.offsetTop });

                if (p.hideOnSubmit) $(this.gDiv).prepend(g.block); //$(t).hide();

                if ($.browser.opera) $(t).css('visibility', 'hidden');

                if (!p.newp) p.newp = 1;

                if (p.page > p.pages) p.page = p.pages;
                var param = [
					 { name: 'page', value: p.newp }
					, { name: 'rp', value: p.rp }
					, { name: 'sortname', value: p.sortname }
					, { name: 'sortorder', value: p.sortorder }
					, { name: 'query', value: p.query }
					, { name: 'qtype', value: p.qtype }
				];

                if (p.params) {
                    for (var pi = 0; pi < p.params.length; pi++) param[param.length] = p.params[pi];
                }

                $.ajax({
                    type: p.method,
                    url: p.url,
                    data: param,
                    dataType: p.dataType,
                    success: function (data) { g.addData(data); },
                    error: function (data) { try { if (p.onError) p.onError(data); } catch (e) { } }
                });
            },
            doSearch: function () {
                p.query = $('input[name=q]', g.sDiv).val();
                p.qtype = $('select[name=qtype]', g.sDiv).val();
                p.newp = 1;

                this.populate();
            },
            changePage: function (ctype) { //change page

                if (this.loading) return true;

                switch (ctype) {
                    case 'first': p.newp = 1; break;
                    case 'prev': if (p.page > 1) p.newp = parseInt(p.page) - 1; break;
                    case 'next': if (p.page < p.pages) p.newp = parseInt(p.page) + 1; break;
                    case 'last': p.newp = p.pages; break;
                    case 'input':
                        var nv = parseInt($('.pcontrol input', this.pDiv).val());
                        if (isNaN(nv)) nv = 1;
                        if (nv < 1) nv = 1;
                        else if (nv > p.pages) nv = p.pages;
                        $('.pcontrol input', this.pDiv).val(nv);
                        p.newp = nv;
                        break;
                }

                if (p.newp == p.page) return false;

                if (p.onChangePage)
                    p.onChangePage(p.newp);
                else
                    this.populate();

            },

            addCellProp: function () {
                $('th div', g.hDiv).each(function (idx, item) {
                    var thDiv = $('tbody tr:first td:eq(' + idx + ') div', g.bDiv);
                    var divWidth = $(thDiv).width();
                    var preWidth = $(this).width();
                    if (divWidth > preWidth) {
                        $(this).css("width", divWidth);
                    } else {
                        $(thDiv).css("width", preWidth);
                    }
                });
            },
            getCellDim: function (obj) // get cell prop for editable event
            {
                var ht = parseInt($(obj).height());
                var pht = parseInt($(obj).parent().height());
                var wt = parseInt(obj.style.width);
                var pwt = parseInt($(obj).parent().width());
                var top = obj.offsetParent.offsetTop;
                var left = obj.offsetParent.offsetLeft;
                var pdl = parseInt($(obj).css('paddingLeft'));
                var pdt = parseInt($(obj).css('paddingTop'));
                return { ht: ht, wt: wt, top: top, left: left, pdl: pdl, pdt: pdt, pht: pht, pwt: pwt };
            },
            addRowProp: function () {
            },
            pager: 0
        };

        //create model if any
        if (p.colModel) {
            thead = document.createElement('thead');
            tr = document.createElement('tr');

            for (i = 0; i < p.colModel.length; i++) {
                var cm = p.colModel[i];
                var th = document.createElement('th');
                th.innerHTML = cm.display;
                if (cm.name && cm.sortable) {
                    $(th).attr('abbr', cm.name);
                }
                $(th).attr('axis', 'col' + i);

                if (cm.align)
                    th.align = cm.align;

                if (cm.width)
                    $(th).attr('width', cm.width);

                if (cm.hide) {
                    th.hide = true;
                }

                if (cm.process) {
                    th.process = cm.process;
                }

                $(tr).append(th);

            }
            $(thead).append(tr);
            $(t).prepend(thead);



        } // end if p.colmodel	

        //init divs
        g.gDiv = document.createElement('div'); //create global container
        g.mDiv = document.createElement('div'); //create title container
        g.hDiv = document.createElement('div'); //create header container
        g.bDiv = document.createElement('div'); //create body container
        g.block = document.createElement('div'); //creat blocker
        g.sDiv = document.createElement('div');

        if (p.usepager) g.pDiv = document.createElement('div'); //create pager container
        g.hTable = document.createElement('table');

        //set gDiv
        g.gDiv.className = 'flexigrid';

        //添加ie的宽度比例支持，add by ldx
        if (/\%$/.test(p.width)) {
            g.gDiv.style.width = p.width;
        } else {
            if (p.width != 'auto') g.gDiv.style.width = p.width + 'px';
        }

        //add conditional classes
        if ($.browser.msie)
            $(g.gDiv).addClass('ie');

        if (p.novstripe)
            $(g.gDiv).addClass('novstripe');

        $(t).before(g.gDiv);
        $(g.gDiv)
		.append(t)
		;
        //set hDiv
        g.hDiv.className = 'hDiv';

        $(t).before(g.hDiv);

        //set hTable
        g.hTable.cellPadding = 0;
        g.hTable.cellSpacing = 0;
        $(g.hDiv).append('<div class="hDivBox"></div>');
        $('div', g.hDiv).append(g.hTable);
        var thead = $("thead:first", t).get(0);
        if (thead) $(g.hTable).append(thead);
        thead = null;

        if (!p.colmodel) var ci = 0;

        //setup thead			
        $('thead tr:first th', g.hDiv).each
			(
			 	function () {
			 	    var thdiv = document.createElement('div');
			 	    if (this.hide) $(this).hide();
			 	    if (!p.colmodel) {
			 	        $(this).attr('axis', 'col' + ci++);
			 	    }
			 	    $(thdiv).css({ textAlign: this.align, width: this.width + 'px' });
			 	    thdiv.innerHTML = this.innerHTML;
			 	    $(this).empty().append(thdiv).removeAttr('width');
			 	}
			);

        //set bDiv
        g.bDiv.className = 'bDiv';
        $(t).before(g.bDiv);
        $(g.bDiv)
		.css({ height: (p.height == 'auto') ? 'auto' : p.height + "px" })
		.scroll(function (e) { g.scroll() })
		.append(t)
		;
        if (p.height == 'auto') {
            $('table', g.bDiv).addClass('autoht');
        }

        //add td properties
        g.addCellProp();
        var cdcol = $('thead tr:first th:first', g.hDiv).get(0);
        if (cdcol != null) {
            g.cdpad = 0;
            g.cdpad += (isNaN(parseInt($('div', cdcol).css('borderLeftWidth'))) ? 0 : parseInt($('div', cdcol).css('borderLeftWidth')));
            g.cdpad += (isNaN(parseInt($('div', cdcol).css('borderRightWidth'))) ? 0 : parseInt($('div', cdcol).css('borderRightWidth')));
            g.cdpad += (isNaN(parseInt($('div', cdcol).css('paddingLeft'))) ? 0 : parseInt($('div', cdcol).css('paddingLeft')));
            g.cdpad += (isNaN(parseInt($('div', cdcol).css('paddingRight'))) ? 0 : parseInt($('div', cdcol).css('paddingRight')));
            g.cdpad += (isNaN(parseInt($(cdcol).css('borderLeftWidth'))) ? 0 : parseInt($(cdcol).css('borderLeftWidth')));
            g.cdpad += (isNaN(parseInt($(cdcol).css('borderRightWidth'))) ? 0 : parseInt($(cdcol).css('borderRightWidth')));
            g.cdpad += (isNaN(parseInt($(cdcol).css('paddingLeft'))) ? 0 : parseInt($(cdcol).css('paddingLeft')));
            g.cdpad += (isNaN(parseInt($(cdcol).css('paddingRight'))) ? 0 : parseInt($(cdcol).css('paddingRight')));
            $('thead tr:first th', g.hDiv).each
			(
			 	function () {
			 	    var cgDiv = document.createElement('div');
			 	    if (!p.cgwidth) p.cgwidth = $(cgDiv).width();

			 	    if ($.browser.msie && $.browser.version < 7.0) {
			 	        g.fixHeight($(g.gDiv).height());
			 	    }
			 	}
			);

        }


        //add strip		
        if (p.striped)
            $('tbody tr:odd', g.bDiv).addClass('erow');

        // add pager
        if (p.usepager) {
            g.pDiv.className = 'pDiv';
            g.pDiv.innerHTML = '<div class="pDiv2"></div>';
            $(g.bDiv).after(g.pDiv);
            var html = ' <div class="pGroup"> <div class="pFirst pButton"><span></span></div><div class="pPrev pButton"><span></span></div> </div> <div class="btnseparator"></div> <div class="pGroup"><span class="pcontrol">Page <input type="text" size="4" value="1" /> of <span> 1 </span></span></div> <div class="btnseparator"></div> <div class="pGroup"> <div class="pNext pButton"><span></span></div><div class="pLast pButton"><span></span></div> </div> <div class="btnseparator"></div> <div class="pGroup"> <div class="pReload pButton"><span></span></div> </div> <div class="btnseparator"></div> <div class="pGroup"><span class="pPageStat"></span></div>';
            $('div', g.pDiv).html(html);

            $('.pReload', g.pDiv).click(function () { g.populate() });
            $('.pFirst', g.pDiv).click(function () { g.changePage('first') });
            $('.pPrev', g.pDiv).click(function () { g.changePage('prev') });
            $('.pNext', g.pDiv).click(function () { g.changePage('next') });
            $('.pLast', g.pDiv).click(function () { g.changePage('last') });
            $('.pcontrol input', g.pDiv).keydown(function (e) { if (e.keyCode == 13) g.changePage('input') });


            if (p.useRp) {
                var opt = "";
                for (var nx = 0; nx < p.rpOptions.length; nx++) {
                    if (p.rp == p.rpOptions[nx]) sel = 'selected="selected"'; else sel = '';
                    opt += "<option value='" + p.rpOptions[nx] + "' " + sel + " >" + p.rpOptions[nx] + "&nbsp;&nbsp;</option>";
                };
                $('.pDiv2', g.pDiv).prepend("<div class='pGroup'><select name='rp'>" + opt + "</select></div> <div class='btnseparator'></div>");
                $('select', g.pDiv).change(
					function () {
					    if (p.onRpChange)
					        p.onRpChange(+this.value);
					    else {
					        p.newp = 1;
					        p.rp = +this.value;
					        g.populate();
					    }
					}
				);
            }

            //add search button
            if (p.searchitems) {
                $('.pDiv2', g.pDiv).prepend("<div class='pGroup'> <div class='pSearch pButton'><span></span></div> </div>  <div class='btnseparator'></div>");
                $('.pSearch', g.pDiv).click(function () { $(g.sDiv).slideToggle('fast', function () { $('.sDiv:visible input:first', g.gDiv).trigger('focus'); }); });
                //add search box
                g.sDiv.className = 'sDiv';

                sitems = p.searchitems;

                var sopt = "";
                for (var s = 0; s < sitems.length; s++) {
                    if (p.qtype == '' && sitems[s].isdefault == true) {
                        p.qtype = sitems[s].name;
                        sel = 'selected="selected"';
                    } else sel = '';
                    sopt += "<option value='" + sitems[s].name + "' " + sel + " >" + sitems[s].display + "&nbsp;&nbsp;</option>";
                }

                if (p.qtype == '') p.qtype = sitems[0].name;

                $(g.sDiv).append("<div class='sDiv2'>Quick Search <input type='text' size='30' name='q' class='qsbox' /> <select name='qtype'>" + sopt + "</select> <input type='button' value='Clear' /></div>");

                $('input[name=q],select[name=qtype]', g.sDiv).keydown(function (e) { if (e.keyCode == 13) g.doSearch() });
                $('input[value=Clear]', g.sDiv).click(function () { $('input[name=q]', g.sDiv).val(''); p.query = ''; g.doSearch(); });
                $(g.bDiv).after(g.sDiv);

            }

        }
        $(g.pDiv, g.sDiv).append("<div style='clear:both'></div>");

        // add title
        if (p.title) {
            g.mDiv.className = 'mDiv';
            g.mDiv.innerHTML = '<div class="ftitle">' + p.title + '</div>';
            $(g.gDiv).prepend(g.mDiv);
        }

        //setup cdrops
        g.cdropleft = document.createElement('span');
        g.cdropleft.className = 'cdropleft';
        g.cdropright = document.createElement('span');
        g.cdropright.className = 'cdropright';

        //add block
        g.block.className = 'gBlock';
        var gh = $(g.bDiv).height();
        var gtop = g.bDiv.offsetTop;
        $(g.block).css(
		{
		    width: g.bDiv.style.width,
		    height: gh,
		    background: 'white',
		    position: 'relative',
		    marginBottom: (gh * -1),
		    zIndex: 1,
		    top: gtop,
		    left: '0px'
		}
		);
        $(g.block).fadeTo(0, p.blockOpacity);
        //browser adjustments
        if ($.browser.msie && $.browser.version < 7.0) {
            $('.hDiv,.bDiv,.mDiv,.pDiv,.vGrip, .sDiv', g.gDiv)
			.css({ width: '100%' });
            $(g.gDiv).addClass('ie6');
            if (p.width != 'auto') $(g.gDiv).addClass('ie6fullwidthbug');
        }
        g.fixHeight();

        //make grid functions accessible
        t.p = p;
        t.grid = g;

        // load data
        if (p.url && p.autoload) {
            g.populate();
        }

        return t;

    };

    var docloaded = false;

    $(document).ready(function () { docloaded = true });

    $.fn.flexigrid = function (p) {

        return this.each(function () {
            if (!docloaded) {
                $(this).hide();
                var t = this;
                $(document).ready
					(
						function () {
						    $.addFlex(t, p);
						}
					);
            } else {
                $.addFlex(this, p);
            }
        });

    }; //end flexigrid

    $.fn.flexReload = function (p) { // function to reload grid

        return this.each(function () {
            if (this.grid && this.p.url) this.grid.populate();
        });

    }; //end flexReload

    $.fn.flexOptions = function (p) { //function to update general options

        return this.each(function () {
            if (this.grid) $.extend(this.p, p);
        });

    }; //end flexOptions

    $.fn.flexAddData = function (data) { // function to add data to grid

        return this.each(function () {
            if (this.grid) this.grid.addData(data);
        });

    };
})(jQuery);
