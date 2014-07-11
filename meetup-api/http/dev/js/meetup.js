/*jshint camelcase: false */

'use strict';

// files to be read (meetup apis & local events file)
var apiByVenue = 'http://api.meetup.com/2/events?venue_id=11046832&status=upcoming&order=time&limited_events=False&desc=false&offset=0&format=json&page=200&fields=&sig_id=148833612&sig=ec792d9f73eca7949295691a01a93c5fc21bf386';
var apiByGroup = 'https://api.meetup.com/2/groups?&sign=true&photo-host=public&key=30584191c19495b3b473b191d8544b&group_id='
var rogueFile = '/js/rogue-events.json';

// other globals
var maxFuture = 45;   // maximum days into the future for listings

// prunes dates too far into the future and utilizes moment.js to format dates & times for valid events.
var parseDate = function (arr) {
  var results = arr;
  var limitDate = new Date();
  limitDate.setDate(limitDate.getDate() + maxFuture);

  for(var i = (results.length - 1); i >= 0; i--) {
    // date
    var date = JSON.stringify(results[i].time);
    var dash = date.indexOf('-');
    var dateArr = [];
    var momentDate, momentTime;

    if(dash > 0) {
      dateArr[0] = new Date(date.substr(0, dash));
      dateArr[1] = new Date(date.substr(dash + 1));
      results[i].time = dateArr[0]; // ensures we sort in the correct order when we call dateSort() later
    }

    date = new Date(results[i].time);

    if(date > limitDate) {
      // splices event if too far into the future (set by maxFuture var at top).
      results.splice(i, 1);
    } else {

      if(dateArr.length > 0) {
        momentDate = moment(dateArr[0]).format('MMMM D') + ' - ' + moment(dateArr[1]).format('MMMM D, YYYY');
        momentTime = null;
      } else {
        momentDate = moment(date).format('ddd. MMMM D, YYYY');
        momentTime = moment(date).format('h:mm A');
      }

      if(momentTime === '12:00 AM') { momentTime = null; }

      // appends date & time to object as moment.date & moment.time
      results[i].moment = {'date': momentDate, 'time' : momentTime };
    }
  }
  return results;
};

var parseVenue = function(arr) {
  var temp, tempIndex;

  for(var i=0; i < arr.length; i++) {
    temp = arr[i].venue.address_1;
    tempIndex = temp.indexOf(',');

    arr[i].venue.street = temp.substr(0, tempIndex);
    arr[i].venue.region = temp.substr(tempIndex + 1);
  }

  return arr;
};

// indexes events for onclick reference
var indexResults = function(arr) {
  for(var i=0; i < arr.length; i++) {
    arr[i].key = i;
  }
  return arr;
};

// sorts array by date
var dateSort = function(arr) {
  var yest = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
  var eDate;

  for(var i = arr.length - 1; i >= 0; i--){
    eDate = new Date(arr[i].time);
    if(eDate < yest) {
      arr.splice(i, 1);
    }
  }

  arr.sort(function(a, b) {
    a = new Date(a.time);
    b = new Date(b.time);

    return a<b ? -1 : a>b ? 1 : 0;
  });

  return arr;
};

// JQUERY READY STATEMENT
$(function() {
  if($('#events-template').length > 0 ) {
    var events = []; // emptying array;
    var dUrl = apiByGroup;

    //prepping isotope
    $('.event-container').isotope({
      masonry: {
        columnWidth: '.event'
      },
      itemSelector: '.event'
    });

    // using promise to load api & local file into events array and processing when both are finished
    $.when(
      $.ajax({
        url: apiByVenue,
        dataType: 'jsonp',
        success: function(data){
          var results = data.results;
          var idlog = [];
          var newid = true;

          $(results).each(function(i){
            // building api url for photo query
            for(var x=0; x < idlog.length; x++) {
              if(idlog[x] === results[i].group.id) { newid = false; }
            }

            if(newid) {
              dUrl += results[i].group.id + ',';
              idlog.push(results[i].group.id);
            }

            // static variables for all meetup events
            results[i].event_type = 'community';
            results[i].event_button = 'rsvp on meetup.com';
            events.push(results[i]);
          });
        }
      }),
      $.ajax({
        url: rogueFile,
        dataType: 'json',
        success: function(data){
          var results = data.results;
          for(var i=0; i < results.length; i++) {
            // sets group id to null for filtering when we pull meetup photos
            results[i].group.id = null;
            events.push(results[i]);
          }
        }
      })
    ).then(function(){
      dUrl = dUrl.substr(0, dUrl.length - 1);  // removes the trailing comma
      console.log(dUrl);
      $.ajax({
        url: dUrl,
        dataType: 'jsonp',
        success: function(data){
          // adding meetup photos
          var results = data.results;

          for(var i=0; i < results.length; i++){
            for (var z=0; z < events.length; z++) {
              if(results[i].id === events[z].group.id){
                events[z].group.photo = results[i].group_photo.photo_link;
              }
            }
          }
        },
        complete: function() {
          var results = parseDate(events);
          results = dateSort(results);
          results = indexResults(results);
          results = parseVenue(results);


          var buildResults = { objects : results };

          var source = $('#events-template').html();
          var template = Handlebars.compile(source);
          var html = $(template(buildResults));

          // loading handlebars stuff in using isotope so we having masonry / sorting.
          $('.event-container').isotope('insert', html);

          var modalSource = $('#modal-template').html();
          var modalTemplate = Handlebars.compile(modalSource);

          // events onclick
          $('article.event').click(function() {
            var key = $(this).data('index');
            $('#modal').css('display', 'block');
            $('body').css('overflow', 'hidden');
            $('.modal-wrapper').html(modalTemplate(results[key]))
            var mwrapper = $('.modal-wrapper').get(0);

            if(mwrapper.scrollHeight > mwrapper.offsetHeight) { $('.fixed').addClass('true'); }
          });
        }
      });
    }); // closes promise

    // setting up isotope sorting
    $('#filters a').click(function() {
      $('#filters a').removeClass('active');
      $(this).addClass('active');
      var selector = $(this).attr('data-filter');
      $('.event-container').isotope({ filter: selector });
      event.preventDefault();
    });
  }

  // modal onclick
  $('#modal').click(function() {
    $(this).css('display', 'none');
    $('body').css('overflow', 'auto');
  });
});
