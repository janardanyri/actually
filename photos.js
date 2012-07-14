
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
            duration: 150,
            easing: 'linear',
            queue: false
          },
         cornerStampSelector: '.corner-stamp'
        });

      });
    });
    // return nothing
  };

  Template.photo.events = {
    'click': function () {
      $('#dummy').removeClass('corner-stamp');

      photofeed = $('#photofeed');
      
       if(Session.get("highlighted")) { // We have an existing blown up image
          shrinkPhoto = $('#'+Session.get("highlighted"))
          //shrinkPhoto.css('margin','0 -300px 0 -300px');
          shrinkPhoto.removeClass('corner-stamp');
          shrinkPhoto.removeClass('highlighted');
          shrinkPhoto.animate({width:220, margin: 10}, 150, function() {
            photofeed.masonry('reload')
           });
       }
       if(Session.get("highlighted") != this._id) { // We're blowing up a new image
         bigPhoto = $('#'+this._id);
         //bigPhoto.css('margin','0 300px 0 300px');
         bigPhoto.addClass('corner-stamp')
         bigPhoto.addClass('highlighted')
         bigPhoto.animate({width:500, margin: 10}, 150, function() {
           photofeed.masonry('reload')
         });
         Session.set("highlighted", this._id)
      } else { // We're shrinking the highlighted image
        Session.set("highlighted", null);
       $('#dummy').addClass('corner-stamp');
      }
      photofeed.masonry('reload')
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


