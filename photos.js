
Photos = new Meteor.Collection("photos");

if (Meteor.is_client) {
  Template.photofeed.photos = function () {
    return Photos.find({}); //, {sort: {score: -1, name: 1}});
  };

  Template.photofeed.photofeed_callback = function () {
    Meteor.defer(function () {
      $('#photofeed').imagesLoaded(function(){
        $('#photofeed').masonry({
          // options
          itemSelector : '.photo',
          columnWidth : 0,
          isAnimated: true,
          animationOptions: {
            duration: 50,
            easing: 'linear',
            queue: false
          }
        });
      });
    });
    // return nothing
  };

  Template.photo.events = {
    'click': function () {
      
       if(Session.get("highlighted")) {
          $('#'+Session.get("highlighted")).animate({width:220}, 50);
        }
       if(Session.get("highlighted") != this._id) {
         $('#'+this._id).animate({width:500}, 50);
         Session.set("highlighted", this._id)
      }
      $('#photofeed').masonry('reload')
    }
  }
}

if (Meteor.is_server) {
  Meteor.startup(function () {
    // code to run on server at startup
    if(Photos.find().count() == 0) {
      urls = ["https://www.google.com/logos/2012/klimt12-hp.jpg",
              "http://www.google.com/logos/2012/Frantisek_Krizik-2012-hp.jpg"];
      for (var i = 0; i < urls.length; i++) {
        Photos.insert({url: urls[i]});
      }
    }
  });
}


