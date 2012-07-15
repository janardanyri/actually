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

		flickrRequest.complete(function() { 
			//clone into returnobject on success
			//Check photos
			if(Photos.find().count() > 20) {
				Photos.remove({});
			}
			if(Photos.find().count() < 20) {
				$.each(myData.items, function(i,item) {
						if (Photos.findOne({url:item.media.m}) == null) {
							item.url = item.media.m;

							Photos.insert(item);
						};
					});
				}
		 	});
		
	}

	

	$(document).ready(getFlickrData())

	
}



