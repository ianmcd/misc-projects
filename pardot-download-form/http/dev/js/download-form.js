'use strict';

//  pardot form handler url
var pardot = 'http://go.tellmedetails.com/l/33342/2014-08-13/26hd3';

$(function() {

  //  deletes cookie if/when delete cookie button is pushed
  $('#delete-cookie').click(function() {
    $.removeCookie('cc-download', { path: '/' });
  });

  //  opens form window & sets 'download' data
  $('.file-controller').on('click', 'button', function(){
    var file = 'http://localhost:4444/assets/' + $(this).data('asset');
    var cookie = $.cookie('cc-download');

    if(cookie === undefined || cookie === false) {
      $('.modal-win').css('display', 'block');
      $('.modal-win').data('download', file);

      //  sets form action to submit & redirect to success.html
      $('#download-form').attr('action', pardot + '?success_location=http://localhost:4444/success.html#' + encodeURIComponent(file));
    } else {
      window.location.href = file;
    }
  });

  //  closes form window & resets 'download' data
  $('span.close').click(function(){
    $('.modal-win').css('display', 'none');
    $('.modal-win').data('download', null);
  });

  //  upon loading success.html -- find file location, set cookie & redirect to file location
  if($('body#success').length > 0) {
    var location = document.location.href;
    var url = location.indexOf('#');
    location = location.slice(url + 1);
    $.cookie('cc-download', 'true', {expires: 7, path: '/'});
    window.location.href = decodeURIComponent(location);
  }
});
