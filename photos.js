// Constants
var animation_ms = 50;

// {url (string)}
Photos = new Meteor.Collection("photos");

// just used by the server to signal data update finished and masonry should reload (super hackish?)
Update = new Meteor.Collection("update");

// {url, date}
SidebarSelections = new Meteor.Collection("sidebar_selections");

if (Meteor.is_client) {

  Meteor.startup( function () {
    console.log("Client startup")
    Meteor.call("getInstagramData");
    //Meteor.setInterval(invokeServerImageFetch,20 * 1000);

    reloadMasonry = function () { $('#photofeed').masonry('reload') }

    Update.find().observe({
      added: function (user) {
        reloadMasonry();
      },
    });

  });

  function invokeServerImageFetch() {
    console.log("hello")
    Meteor.call("getFlickrData");
  }

  addSidebarSelection = function (url, comment) {
    if(SidebarSelections.findOne({url:url}) != null) {
      SidebarSelections.update({url:url}, { $set: {date:$.now()}})
    } else {

      SidebarSelections.insert({url:url, comment:comment, date:$.now()}) 
      while(SidebarSelections.find().count() > 20) {
        oldestSelection = SidebarSelections.findOne({}, {sort: {date:1}});
        console.log("Deleting oldest sidebar: "+oldestSelection.url)
        SidebarSelections.remove({url:oldestSelection.url,date:oldestSelection.date});
      }
    }
  }

  Template.photofeed.photos = function () {
    console.log("Fetching photofeed photos...")
    return Photos.find({}, {sort: {date:-1}});
  };

  Template.sidebar.photos = function () {
    console.log("Fetching sidebar photos...")
    return SidebarSelections.find({}, {sort: {date:-1}});
  };

  Template.chatsubmit.events = {
    'click': function (e) {
      console.log("Chat submitted")
      addSidebarSelection(null, $("#chatbox").val())
      $("#chatbox").val('');
    }
  }

  Template.sidephoto.events = {
    'keypress .photocomment': function (event) {
      if(event.which == 13) { // Enter
        var id = this._id
        var comment_text = $('#photocomment_'+id).val();
        var photo = SidebarSelections.findOne({_id:id});
        photo.comments = (photo.comments || []);
        photo.comments[photo.comments.length] = comment_text;
        SidebarSelections.update({_id:id}, { $set: {comments: photo.comments }}, true);
        $('#photocomment_'+id).val(''); // Blank text entry
      }
    }/*,
    'click .photosubmit': function (e) {
      var id = this._id
      var comment_text = $('#photocomment_'+id).val();
      var photo = SidebarSelections.findOne({_id:id});
      photo.comments = (photo.comments || []);
      photo.comments[photo.comments.length] = comment_text;
      SidebarSelections.update({_id:id}, { $set: {comments: photo.comments }}, true);
    }*/
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
       expand(this, $('#photofeed'));
    }
  }

  function expand(photo, container) {
    if(Session.get("highlighted")) { // We have an existing blown up image
      shrinkPhoto = $('#'+Session.get("highlighted"))
      shrinkPhoto.removeClass('highlighted');
      shrinkPhoto.animate({width:220}, animation_ms);
    }
    if(Session.get("highlighted") != photo._id) { // We're blowing up a new image
      addSidebarSelection(photo.url);
      bigPhotoSelector = '#'+photo._id;
      bigPhoto = $(bigPhotoSelector);
      bigPhoto.addClass('highlighted')

      var height = bigPhoto.outerHeight();
      var width = bigPhoto.outerWidth();

      var max_height = $(window).height() - 20;
      var width_for_max_height = width * max_height / height;
      //alert(width_for_max_height)
      width = Math.round(Math.min(container.innerWidth()-70, width_for_max_height));
      width = width+'px';
      bigPhoto.animate({width: width}, animation_ms, function() {
        container.masonry('reload')
        setTimeout('scroll_to("'+bigPhotoSelector+'");',animation_ms*10);
        setTimeout('scroll_to("'+bigPhotoSelector+'");',animation_ms*20);
     });
      Session.set("highlighted", photo._id)
   } else { // We're shrinking the highlighted image
     Session.set("highlighted", null);
     setTimeout('$("#'+container.attr('id')+'").masonry("reload");', 200);
   }
   container.masonry('reload')
  }

}



if (Meteor.is_server) {
  Meteor.startup(function () {
    console.log("Server startup")
    // code to run on server at startup
    if(Photos.find().count() == 0) {
      Meteor.call("getInstagramData");
    }
  });
}



Meteor.methods({getFlickrData: function () {
  this.unblock();
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
        photo.url = String(photo.media.m).replace('m.jpg', 'b.jpg');
        photo.source = "flickr";
        photo.date = Date.now();
        console.log("Inserting image: "+photo.media.m)
        console.log("Total images: " +Photos.find().count())
        while(Photos.find().count() > 20) {
          oldestPhoto = Photos.findOne({}, {sort: {date:1}});
          console.log("Deleting oldest image: "+oldestPhoto.url)
          Photos.remove({url:oldestPhoto.url});
        }
        Photos.insert(photo);
      }
     }
     // Signal masonry refresh
     Update.insert({go:1});
     Update.remove();
   }
  return false;
}});


Meteor.methods({getInstagramData: function () {
  this.unblock();
  console.log("Fetching data from Instagram...");

  var InstagramParams = {
    access_token : "25487003.f59def8.7e4762897bfc4ca19ae2dfeafb4b8702"
  };

  var url = ""
  if (typeof searchTerm == "string") {
    url = "https://api.instagram.com/v1/tags/" + searchTerm + "/media/recent";
  } else {
    url = "https://api.instagram.com/v1/media/popular";
  }
  var result = Meteor.http.call("GET", url, {params: InstagramParams});
  
  if (result.statusCode === 200) {
    console.log("Result.statusCode: " + result.statusCode);
    resultJSON = result.data.data;
     for (photoIndex in resultJSON) {
      photo = resultJSON[photoIndex];
      if (Photos.findOne({url:photo.images.standard_resolution.url}) == null) {
        photo.url = photo.images.standard_resolution.url;
        photo.source = "Instagram";
        photo.date = Date.now();
        console.log("Inserting image: "+photo.images.standard_resolution.url);
        console.log("Total images: " +Photos.find().count());
        while(Photos.find().count() > 20) {
          oldestPhoto = Photos.findOne({}, {sort: {date:1}});
          console.log("Deleting oldest image: "+oldestPhoto.url);
          Photos.remove({url:oldestPhoto.url});
        }
        Photos.insert(photo);
      }
     }
     // Signal masonry refresh
     Update.insert({go:1});
     Update.remove();
   }
  return false;
}});
