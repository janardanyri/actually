
Photos = new Meteor.Collection("photos");

if (Meteor.is_client) {
  Template.hello.greeting = function () {
    return "Welcome to photos.";
  };

  Template.photofeed.photos = function () {
    return Photos.find({}); //, {sort: {score: -1, name: 1}});
  };

  Template.hello.events = {
    'click input' : function () {
      // template data, if any, is available in 'this'
      if (typeof console !== 'undefined')
        console.log("You pressed the button");
      Session.set("buttonpress","beep")

    }
  };
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