
// {url (string)}
Photos = new Meteor.Collection("photos");

// {url, date}
SidebarSelections = new Meteor.Collection("sidebar_selections");

if (Meteor.is_client) {

  addSidebarSelection = function (url, comment) {
    //SidebarSelections.update({url:url}, { $set: {date:$.now()}}, true ) // <- true means upsert
    // Upsert not working for some reason (maybe it's changed)
    //SidebarSelections.remove({url:url})
    SidebarSelections.insert({url:url, comment:comment, date:$.now()}) 
  }

  Template.photofeed.photos = function () {
    return Photos.find({}); //, {sort: {score: -1, name: 1}});
  };

  Template.sidebar.photos = function () {
    return SidebarSelections.find({}, {sort: {date:-1}}); //, {sort: {score: -1, name: 1}});
  };

  Template.chatsubmit.events = {
    'click': function (e) {
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
          columnWidth : 220,
          gutterWidth: 10,
          isAnimated: true,
          cornerStampSelector: '.corner-stamp',
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
    'click': function (e) {
      photofeed = $('#photofeed');
      addSidebarSelection(this.url);
       if(Session.get("highlighted")) { // We have an existing blown up image
          shrinkPhoto = $('#'+Session.get("highlighted"))
          //shrinkPhoto.css('margin','0 -300px 0 -300px');
          shrinkPhoto.removeClass('highlighted');
          shrinkPhoto.animate({width:220}, 50, function() {
            photofeed.masonry('reload')
           });
       }
       if(Session.get("highlighted") != this._id) { // We're blowing up a new image
         bigPhoto = $('#'+this._id);
         //bigPhoto.css('margin','0 300px 0 300px');
         bigPhoto.addClass('highlighted')
         bigPhoto.animate({width:680}, 50, function() {
           photofeed.masonry('reload')
         });
         Session.set("highlighted", this._id)
      } else { // We're shrinking the highlighted image
        Session.set("highlighted", null);
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


