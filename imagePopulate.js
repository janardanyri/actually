//imagePopulate.js
if (Meteor.is_client) {
	function getFlickrData(searchTerm) {
		var myData = {};
		var flickrParams = {
		tagmode: "any",
		format: "json"
			};

			if (typeof searchTerm == "string") {
				flickrParams.tags = searchTerm
			};

		var flickrRequest = $.getJSON(
			"http://api.flickr.com/services/feeds/photos_public.gne?&lang=en-us&format=json&jsoncallback=?",
			flickrParams,
			function(data){
				$.extend(true,myData,data);
			});

		flickrRequest.success(function() { 
			//clone into returnobject on success
			$.each(myData.items, function(i,item) {

					item.url = item.media.m;
					Photos.insert(item);
				});
		 	});
	}
	if(Photos.find().count() >= 5) {
	getFlickrData("something");
	photofeed.masonry('reload');
	};
}



