// Constants
var animation_ms = 0;

// {url (string)}
Photos = new Meteor.Collection("photos");

// just used by the server to signal data update finished and masonry should reload (super hackish?)
Update = new Meteor.Collection("update");

// {url, date}
SidebarSelections = new Meteor.Collection("sidebar_selections");

if (Meteor.is_client) {

  Meteor.startup( function () {
    console.log("Client startup")
    //Meteor.setInterval(invokeServerImageFetch,20 * 1000);

    reloadMasonry = function () { $('#photofeed').masonry('reload') }

    Update.find().observe({
      added: function (user) {
        reloadMasonry();
      },
    });

  });

  function getFlickrData() {
    console.log("getFlickrData");
    $('.selected').removeClass("selected");
    $('#Flickr').addClass("selected");
    Session.set("photoSet", "Flickr");
  }
  function getInstagramData() {
    console.log("getInstagramData");
    $('.selected').removeClass("selected");
    $('#Instagram').addClass("selected");
    Session.set("photoSet", "Instagram");
  }
  function get500pxData() {
    console.log("get500pxData");
    $('.selected').removeClass("selected");
    $('#500px').addClass("selected");
    Session.set("photoSet", "500px");
  }
  function getFoursquareData() {
    console.log("getFoursquareData");
    $('.selected').removeClass("selected");
    $('#Foursquare').addClass("selected");
    Session.set("photoSet", "Foursquare");
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
    return Photos.find({'source' : Session.get('photoSet')}, {sort: {date:-1}});
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
    },
    'click img': function (e) {
      if ($('#sidebar').css('width') != '72%') {
        $('#photofeed').css('width', '27%');
        $('#sidebar').css('width', '72%');
        setTimeout('expand("'+this._id+'","'+this.url+'",$("#sidebarphotos"), false);',200);
      } else {
        expand(this._id, this.url, $('#sidebarphotos'), false);
      }
    }
  }

  Template.photofeed.photofeed_callback = function () {
    Meteor.defer(function () {
      init_masonry_container($('#photofeed'));
    });
  }

  Template.sidebar.sidebar_callback = function () {
    Meteor.defer(function () {
      init_masonry_container($('#sidebarphotos'));
    });
  }

  function init_masonry_container(container) {
    container.imagesLoaded(function(){
      container.masonry({
          // options
        itemSelector: '.photo',
        columnWidth : 240,
        gutterWidth: 10,
        isAnimated: false,
/*        animationOptions: {
          duration: animation_ms,
          easing: 'swing',
          queue: false
        }*/
      });
    });
  }


  function scroll_to(selector) {
    var top = document.body.scrollTop;
    var photo = $(selector)
    var moveBy = photo.position().top - top + 30;
    $('html,body').animate({scrollTop: top+moveBy}, 150, 'swing');
  }


  Template.photo.events = {
    'keypress .photocomment': function (event) {
      if(event.which == 13) { // Enter
        var id = this._id
        var comment_text = $('#photocomment_'+id).val();
        var originalPhoto = Photos.findOne({_id:id});
        var photo = SidebarSelections.findOne({url:originalPhoto.url});
        photo.comments = (photo.comments || []);
        photo.comments[photo.comments.length] = comment_text;
        SidebarSelections.update({_id:photo._id}, { $set: {comments: photo.comments }}, true);
        $('#photocomment_'+id).val(''); // Blank text entry
        $('#sent-notice_'+id).addClass('sent-notice-sent');
     }
    },
    'click img': function (e) {
      if ($('#photofeed').css('width') != '72%') {
        $('#photofeed').css('width', '72%');
        $('#sidebar').css('width', '27%');
        setTimeout('expand("'+this._id+'","'+this.url+'",$("#photofeed"), true);',200);
      } else {
        expand(this._id, this.url, $("#photofeed"), true);
      }
    }
  }


  function expand(id, url, container, moveToTop) {
    if(Session.get("highlighted")) { // We have an existing blown up image
      shrinkPhoto = $('#'+Session.get("highlighted"))
      shrinkPhoto.removeClass('highlighted');
      shrinkPhoto.css({width:220});
      //shrinkPhoto.animate({width:220}, animation_ms);
    }
    if(Session.get("highlighted") != id) { // We're blowing up a new image
      if (moveToTop) { addSidebarSelection(url); }
      bigPhotoSelector = '#'+id;
      bigPhoto = $(bigPhotoSelector);
      bigPhoto.addClass('highlighted')

      var height = bigPhoto.outerHeight();
      var width = bigPhoto.outerWidth();

      var max_height = $(window).height() - 20;
      var width_for_max_height = width * max_height / height;
      //alert(width_for_max_height)
      width = Math.round(Math.min(container.innerWidth()-70, width_for_max_height));
      width = width+'px';
      bigPhoto.css({width: width});
      //    bigPhoto.animate({width: width}, animation_ms, function() {
      container.masonry('reload')
      setTimeout('scroll_to("'+bigPhotoSelector+'");',300);
      setTimeout('scroll_to("'+bigPhotoSelector+'");',700);
      //});
      Session.set("highlighted", id)
      $("#photocomment_"+id).focus()
   } else { // We're shrinking the highlighted image
     if (container.attr('id') == 'sidebarphotos') { // shink sidebar if closing last photo
       $('#photofeed').css('width', '72%');
       $('#sidebar').css('width', '27%');
       setTimeout('$("#photofeed").masonry("reload");', 500);
     }
     Session.set("highlighted", null);
     setTimeout('$("#'+container.attr('id')+'").masonry("reload");', 300);
   }
   setTimeout('$("#photofeed").masonry("reload");', 200);
   setTimeout('$("#sidebarphotos").masonry("reload");', 200);
   container.masonry('reload')
  }

  $(function() {
    $(window).scroll(function() {
      $('#sidebar').css('margin-top', document.body.scrollTop-70);
    });
  });

}



if (Meteor.is_server) {
  Meteor.startup(function () {
    console.log("Server startup")
    // code to run on server at startup
    if(Photos.find().count() == 0) {
      Meteor.call("callAPIs");
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
     for (photoIndex in resultJSON.items) {
      photo = resultJSON.items[photoIndex]
      if (Photos.findOne({url:photo.media.m}) == null) {
        photo.url = String(photo.media.m).replace('m.jpg', 'b.jpg');
        photo.source = "Flickr";
        photo.date = Date.now();
        console.log("Inserting image: "+photo.media.m)
        console.log("Total images: " +Photos.find().count())
        while(Photos.find({'source' : 'Flickr'}).count() > 20) {
          oldestPhoto = Photos.findOne({'source' : 'Flickr'}, {sort: {date:1}});
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

  var InstagramParams = {
    access_token : "25487003.f59def8.7e4762897bfc4ca19ae2dfeafb4b8702"
  };

  var url = "";
  if (typeof searchTerm == "string") {
    url = "https://api.instagram.com/v1/tags/" + searchTerm + "/media/recent";
  } else {
    url = "https://api.instagram.com/v1/media/popular";
  }
  
  //Pass in the API name, the URL and any required parameters and get a json object back.
  var getAPIData = Meteor.call("getAPIData","Instagram",InstagramParams,url); 

    resultJSON = getAPIData.data;
     for (photoIndex in resultJSON) {
      photo = resultJSON[photoIndex];
      if (Photos.findOne({url:photo.images.standard_resolution.url}) == null) {
        photo.url = photo.images.standard_resolution.url;
        photo.source = "Instagram";
        photo.date = Date.now();
        console.log("Inserting image: "+photo.url);
        console.log("Total images: " +Photos.find().count());
        while(Photos.find({'source' : 'Instagram'}).count() > 20) {
          oldestPhoto = Photos.findOne({'source' : 'Instagram'}, {sort: {date:1}});
          console.log("Deleting oldest image: "+oldestPhoto.url);
          Photos.remove({url:oldestPhoto.url});
        }
        Photos.insert(photo);
      }
     }
     // Signal masonry refresh
     Update.insert({go:1});
     Update.remove();
  return false;
}});

Meteor.methods({get500pxData: function () {
  this.unblock();

  var fivehundredpxParams = {
    consumer_key : "sDWHPHnEiDj20gDLVWPlu2jZtFbkO8DWu7ekFfvo",
    feature : "popular",
    image_size : "4"
  };

  var url = "https://api.500px.com/v1/photos";
  if (typeof searchTerm == "string") {
    fivehundredpxParams.only = searchTerm;
  } 
  
  //Pass in the API name, the URL and any required parameters and get a json object back.
  var getAPIData = Meteor.call("getAPIData","500PX",fivehundredpxParams,url); 

    resultJSON = getAPIData.photos;
     for (photoIndex in resultJSON) {
      photo = resultJSON[photoIndex];
      if (Photos.findOne({url:photo.image_url}) == null) {
        photo.url = photo.image_url;
        photo.source = "500px";
        photo.date = Date.now();
        console.log("Inserting image: "+photo.url);
        console.log("Total images: " +Photos.find().count());
        while(Photos.find({'source' : '500px'}).count() > 20) {
          oldestPhoto = Photos.findOne({'source' : '500px'}, {sort: {date:1}});
          console.log("Deleting oldest image: "+oldestPhoto.url);
          Photos.remove({url:oldestPhoto.url});
        }
        Photos.insert(photo);
      }
     }

     // Signal masonry refresh
     Update.insert({go:1});
     Update.remove();
   

  return false;
}});



Meteor.methods({callAPIs: function () {
  this.unblock();
  //Call all APIs
  console.log("Getting all API Data");
  Meteor.call("getFlickrData");
  Meteor.call("getInstagramData");
  Meteor.call("get500pxData");
  Meteor.call("getFoursquareData");
  return false;
}});



Meteor.methods({getAPIData: function (whatAPI,params,url) {
  this.unblock();
  console.log("Fetching data from "+whatAPI+" using the general API caller...");

  var result = Meteor.http.call("GET", url, {params: params});
  
  if (result.statusCode === 200) {
    console.log("Result.statusCode: " + result.statusCode);
    if (typeof result.data != undefined) {
      resultJSON = result.data;
    }
    else if (typeof result.content != undefined) {
      resultJSON = result.content;
    } else {
      //something is probably broken.
      console.log("Something is broken because neither result.data or result.content was populated.");
      resultJSON = "";
    }

   }
  return resultJSON;
}});
