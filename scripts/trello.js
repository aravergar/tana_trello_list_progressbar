(function() {
var months = { 
	'JAN' : { pos : 1 , days : 31 },
	'FEB' : { pos : 2 , days : 28 }, 
	'MAR' : { pos : 3 , days : 31 },
	'APR' : { pos : 4,  days : 30 },
	'MAY' : { pos : 5,  days : 31 },
	'JUN' : { pos : 6,  days : 30 },
	'JUL' : { pos : 7,  days : 31 },
	'AUG' : { pos : 8,  days : 31 }, 
	'SEP' : { pos : 9,  days : 30 },
	'OCT' : { pos : 10, days : 31 },
	'NOV' : { pos : 11, days : 30 },
	'DEC':  { pos : 12, days : 31 },
	'JAN2': { pos : 13, days : 31 },
}

function dateDifference(monBig,dayBig,monSmall,daySmall) {
	if (monBig == monSmall) {
		return dayBig - daySmall;
	}
	if (monBig == 'JAN') {
		monBig = 'JAN2';
	}
	return 10;

	var diff = 0;
	for(key in months) {
		if (key == monSmall) {
			diff = months[monSmall].days - daySmall;
		} else if (key == monBig) {
			diff += dayBig;
			break;
		} else {
			diff += months[key].days;
		}
	}
	return diff;
}

function isFirstAfterSecond(monFirst,dayFirst, monSecond,daySecond) {
	if (months[monFirst].pos == months[monSecond].pos) {
		return dayFirst > daySecond;
	} else if (monFirst == 'DEC' && monSecond == 'JAN') {
		return false;
	}
	return months[monFirst].pos > months[monSecond].pos;
}

function trelloPluginUpdateProgress() {


	var clsTrelloListProgress = '.trello-plugin-container';
	var clsTrelloCard = 'li[data-testid="list-card"]';
	var clsTrelloList = 'div[data-testid="list"]';
	var clsTrelloIconCheckList = 'span[data-testid="checklist-badge"]';
	//var clsTrelloIconCheckList = 'span[data-testid="ChecklistIcon"]';
	//var clsTrelloIconCheckList = '.nch-icon';
	// var clsTrelloBadgeText = '#badge-text';
	//var clsTrelloBadgeText = 'span[data-testid="checklist-badge"] > span[data-testid!="nch-icon"]';
	var clsTrelloBadgeText = 'span[data-testid!="ChecklistIcon"]:not(.nch-icon)';
	var clsTrelloListHeader = 'div[data-testid="list-header"]';
	var clsTrelloIconClock = '#icon-clock';
	var dt = new Date();

	var todayMonth =  'JAN';

	for(var key in months) {
		if ((dt.getMonth() + 1) == months[key].pos) {
			todayMonth = key;
			break;
		}
	}
	var checked = true;
	if (!$("#count_todos").is(':checked')) {
		checked = false;
	}

	var todayDate = dt.getDate();
	$(clsTrelloListProgress).remove(); //remove previous progressbars , calculate add again
	$("")
	var cumulativeTotal = 0;

	var names = [];
	var counts = [];
	
	$(clsTrelloList).each(function() {
		var progress = 0;
		var total = 0;
		var maxMon  = null;
		var maxDay = null;
		var minMon = null;
		var minDay = null;
		var leftMargin = 70; 

		var cardCount = 0;

		/* We dont want to query trello API as the information 
		is already present on the cards parse it and use it.
		*/
		$(this).find(clsTrelloCard).each(function() {

			if (!$(this).is(":visible") ) {
				return;
			}
			var checkList = $(this).find(clsTrelloIconCheckList);
			if (checkList.length > 0) {
				var countByTotal = checkList.find(clsTrelloBadgeText).html()
				var counts = countByTotal.split("/");
				progress += parseInt(counts[0]);
				total  += parseInt(counts[1]);
			} else {
				total++;
			}
			cardCount++;

			var dueDate = $(this).find(clsTrelloIconClock);
			if (dueDate.length > 0) { // A due date is set
				var monthDay = dueDate.parent().find(clsTrelloBadgeText).html()
				var monthNDay = monthDay.split(" ");
				var mon = monthNDay[0].toUpperCase();
				var day = parseInt(monthNDay[1]);

				if (maxMon == null ) {
					maxMon = mon;
					maxDay = day;
				} else {
					if (!isFirstAfterSecond(maxMon,maxDay,mon,day)) {
						maxMon = mon;
						maxDay = day;
					}
				}

				if (minMon == null) {
					minMon = mon;
					minDay = day;
				} else {
					if (isFirstAfterSecond(minMon,minDay,mon,day)) {
						minMon = mon;
						minDay = day;
					}
				}
			}
		});
	
		
		if (checked) {
			cardCount = total;
		}
		if (cardCount > 0) {
			names.push($(this).find('h2[data-testid="list-name"]').text());
			counts.push(cardCount);
			//cardCount;
		}
		
		if (total == 0) {
			total = 1; //handle NaN
		}

		progress = Math.ceil(progress * 100 / total);
		cumulativeTotal += total;

		if ($(this).width() < 250) {
			leftMargin = 60;
		}
		/*
		<span class="progress-percentage" style="width:75px;left:-70px	"> Task '+ progress +'%</span>
		*/
		/**
		Class changes for handling new trello version update
		*/
		$(this).find(clsTrelloListHeader).append(

			'<div class="checklist-progress" style="position:relative"><span  style="width:75px;top:2px" class="trello-plugin-container checklist-progress-percentage js-checklist-progress-percent">Task '+progress+'%</span>'
			+'<div class=" checklist-progress-bar trello-plugin-container" style="margin-left:'+leftMargin+'px;width:70%;margin-top:10px"> '
			+' <div class="progress-current  checklist-progress-bar-current' + (progress == 100 ? ' checklist-progress-bar-current-complete' : '') + ' js-checklist-progress-bar" style="width: '+ progress +'%;"> '
			+'</div></div></div>');


		if (maxMon != null ){

			var dateRange = dateDifference(maxMon,maxDay,minMon,minDay);
			
			var daysPast = dateDifference(todayMonth ,todayDate,  minMon,minDay);
			if (dateRange == 0) {
				dateRange = 1;
			}
			if(!isFirstAfterSecond(todayMonth,todayDate,minMon,minDay) ) {
				daysPast = 0;
			}

			if(daysPast > dateRange) {
				daysPast = dateRange;
			}

			var timeProgress = Math.floor(daysPast *100/ dateRange);


			$(this).find(clsTrelloListHeader).append(
			' <div class="checklist-progress"> <span  style="width:75px;top:bottom:0px" class="trello-plugin-container checklist-progress-percentage js-checklist-progress-percent">Time '+timeProgress+'%</span>'
			+'<div class="checklist-progress-bar trello-plugin-container" style="margin-left:'+leftMargin+'px;width:70%;margin-top:10px"> '
			+' <div class="progress-current checklist-progress-bar-current js-checklist-progress-bar" style="width: '+ timeProgress +'%;"> '
			+'</div></div> </div>');

		}


	});

/*
	$("#card_status_img").attr("src",
	"https://chart.googleapis.com/chart?cht=p3&chd=t:"+counts.join(",")+"&chs=200x100&chl="+names.join("|"));
*/
	
	
		
}

var gTrelloPluginLoadAttemptCount = 0;

function trelloPluginDoFirstLoad() {

	if (typeof gTrelloPluginType == 'undefined') {
		gTrelloPluginType = 'bookmarklet';
	}

	if ($("#button-reload-progress").length != 0) {
		return;
	}
	
	try {

		$(document).delegate("ul.js-fill-boards li a",'click',function() {
			setTimeout(trelloPluginDoFirstLoad,4000);
		});

		$(document).delegate("ul.sidebar-boards-list li a",'click',function() {
			setTimeout(trelloPluginDoFirstLoad,4000);
		});


		

		$(document).delegate("a.js-toggle-label-filter",'mouseup',function(){
			setTimeout(trelloPluginUpdateProgress,200);
			if (gTrelloPluginTracker && gTrelloPluginTracker._trackEvent) {
				gTrelloPluginTracker._trackEvent('Filter_Change_Label','Progress_Update',gTrelloPluginType);		
			}
		});


		$(document).delegate("a.js-select-member",'mouseup',function(){
			setTimeout(trelloPluginUpdateProgress,200);
			if (gTrelloPluginTracker && gTrelloPluginTracker._trackEvent) {
				gTrelloPluginTracker._trackEvent('Filter_Change_Member','Progress_Update',gTrelloPluginType);		
			}
		});

		$(document).delegate("a.js-open-board",'mouseup',function(){
			setTimeout(trelloPluginUpdateProgress,500);
			if (gTrelloPluginTracker && gTrelloPluginTracker._trackEvent) {
				gTrelloPluginTracker._trackEvent('Board_Open_Home','Progress_Update',gTrelloPluginType);	
			}
		});

		$(document).delegate("a.js-clear-all ",'mouseup',function(){
			setTimeout(trelloPluginUpdateProgress,200);
			if (gTrelloPluginTracker && gTrelloPluginTracker._trackEvent) {	
				gTrelloPluginTracker._trackEvent('Filter_Clear_All','Progress_Update',gTrelloPluginType);
			}
		});

		
		$(".header-user").prepend('<a id="button-reload-progress" class="header-btn header-notifications" '
		+'title="Update Progress" href="#" >'
		+'  <span class="header-btn-text">Update List Progress</span> </a>');
		
		$("#button-reload-progress").click(trelloPluginUpdateProgress);
 
 		/* if (gShowPieChart) {
			$(".board-widgets-content-wrapper").prepend('<div id="card_distribution" class="board-widget board-widget-card-distribution clearfix">'
			+ '<div class="board-widget-title" name="showSidebarMembers" title="Show or hide card distribution section.">'
			+ '<h3>Card Distribution</h3>'
			+ '<span class="showhide-indicator">Hide</span>'
			+ '</div>' 
			+ '<input type="checkbox" checked="true" id="count_todos" /> Count Todos'
			+ '<div id="card_list_status" class="board-widget-content" >'
			+ '</div> '
			+ '</div>');
 		} */

		$("#count_todos").click(function(){
			trelloPluginUpdateProgress();
		})
  		$("#card_distribution .board-widget-title").click(function(){
  			$(this).parent().find(".board-widget-content-wrapper").toggle();
  		}) ;

		trelloPluginUpdateProgress();
		if ($(".trello-plugin-container").length == 0) {
			setTimeout(trelloPluginDoFirstLoad,3000)
		}

	} catch(e) {
		if (gTrelloPluginLoadAttemptCount > 3 ) {
			return;
		}
		gTrelloPluginLoadAttemptCount++;
		setTimeout(trelloPluginDoFirstLoad,3000)
	}
}
setTimeout(trelloPluginDoFirstLoad,1000);




})()
