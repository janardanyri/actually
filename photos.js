// Constants
var animation_ms = 50;

// {url (string)}
Photos = new Meteor.Collection("photos");

// {url, date}
SidebarSelections = new Meteor.Collection("sidebar_selections");

if (Meteor.is_client) {

  Meteor.startup( function () {
    console.log("Client startup")
    //Meteor.call("getFlickrData");
    //Meteor.setInterval(invokeServerImageFetch,20 * 1000);
  });

  function invokeServerImageFetch() {
    console.log("hello")
    //Meteor.call("getFlickrData");
  }

  addSidebarSelection = function (url, comment) {
    //SidebarSelections.update({url:url}, { $set: {date:$.now()}}, true ) // <- true means upsert
    // Upsert not working for some reason (maybe it's changed)
    //SidebarSelections.remove({url:url})
    SidebarSelections.insert({url:url, comment:comment, date:$.now()}) 
  }

  Template.photofeed.photos = function () {
    console.log("Fetching photofeed photos...")
    return Photos.find({}, {sort: {date:-1}}, 30); //, {sort: {score: -1, name: 1}});
  };

  Template.sidebar.photos = function () {
    console.log("Fetching sidebar photos...")
    return SidebarSelections.find({}, {sort: {date:-1}}, 20); //, {sort: {score: -1, name: 1}});
  };

  Template.chatsubmit.events = {
    'click': function (e) {
      console.log("Chat submitted")
      addSidebarSelection(null, $("#chatbox").val())
      $("#chatbox").val('');
    }
  }

  Template.photofeed.photofeed_callback = function () {
    Meteor.defer(function () {
      $('#photofeed').imagesLoaded(function(){
        $('#photofeed').masonry({
          // options
          itemSelector : '.photo',
          columnWidth : 240,
          gutterWidth: 10,
          isAnimated: true,
          animationOptions: {
            duration: animation_ms,
            easing: 'swing',
            queue: false
          }
        });
      });
    });
    // return nothing
  };


  function scroll_to(selector) {
    var top = document.body.scrollTop;
    var photo = $(selector)
    var moveBy = photo.position().top - top + 30;
    $('html,body').animate({scrollTop: top+moveBy}, 150, 'swing');
  }


  Template.photo.events = {
    'click': function (e) {
      photofeed = $('#photofeed');
      addSidebarSelection(this.url);
       if(Session.get("highlighted")) { // We have an existing blown up image
          shrinkPhoto = $('#'+Session.get("highlighted"))
          shrinkPhoto.removeClass('highlighted');
          shrinkPhoto.animate({width:220}, animation_ms);
       }
       if(Session.get("highlighted") != this._id) { // We're blowing up a new image
         bigPhotoSelector = '#'+this._id;
         bigPhoto = $(bigPhotoSelector);
         bigPhoto.addClass('highlighted')

         var height = bigPhoto.outerHeight();
         var width = bigPhoto.outerWidth();

         var max_height = $(window).height() - 20;
         var width_for_max_height = width * max_height / height;
         //alert(width_for_max_height)
         width = Math.round(Math.min(photofeed.innerWidth()-70, width_for_max_height));
         width = width+'px';
         bigPhoto.animate({width: width}, animation_ms, function() {
           photofeed.masonry('reload')
           setTimeout('scroll_to("'+bigPhotoSelector+'");',animation_ms*10);
           setTimeout('scroll_to("'+bigPhotoSelector+'");',animation_ms*20);
        });
         Session.set("highlighted", this._id)
      } else { // We're shrinking the highlighted image
        Session.set("highlighted", null);
        setTimeout('photofeed.masonry("reload");', 200);
      }
      photofeed.masonry('reload')
    }
  }
}

if (Meteor.is_server) {
  Meteor.startup(function () {
    console.log("Server startup")
    // code to run on server at startup
    if(Photos.find().count() == 0) {
      Meteor.call("getFlickrData");
    }
  });
}

Meteor.methods({getFlickrData: function () {
  this.unblock();
  Photos.remove({}); 
  console.log("wipe'd data");
  console.log("Fetching data from Flickr...");

  var flickrParams = {
    tagmode: "any",
    format: "json"
  };

  if (typeof searchTerm == "string") {
    flickrParams.tags = searchTerm
  };
  var result = Meteor.http.call("GET", "http://api.flickr.com/services/feeds/photos_public.gne?&lang=en-us&format=json&jsoncallback=?",
                                {params: flickrParams});
  if (result.statusCode === 200) {
    console.log("Result.statusCode: " + result.statusCode)
    resultJSON = eval(result.content);
    //console.log(resultJSON.items)
     for (photoIndex in resultJSON.items) {
      photo = resultJSON.items[photoIndex]
      if (Photos.findOne({url:photo.media.m}) == null) {
        photo.url = photo.media.m;
        photo.date = Date.now();
        Photos.insert(photo);
      }
     }
   }
  return false;
}});


