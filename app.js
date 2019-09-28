var express = require('express');
const axios = require('axios');
const cron = require('node-cron');

var port = process.env.PORT || 3000;
var app = express();

let data = {
	stories: '',
	events: '',
	conversations: 'test'
};

cron.schedule('*/1 * * * *', () => {
  console.log('fetching festival content ✧*｡٩(ˊᗜˋ*)و✧*｡');
  

axios.get('https://edgeryders.eu/tags/webcontent-festival-event.json')
  .then(function (response) {

    var eventsArray = response.data.topic_list.topics.map(function(event){

    	var eventLocation = event.tags.filter(item => item.includes('event-location-')).toString().substring(15)
    	
    	var eventDateArray = event.tags.filter(item => item.includes('event-date-')).toString().substring(11).split("_")
    	var eventYear = '20' + eventDateArray[2];
    	var eventMonth = parseInt(eventDateArray[1], 10)-1;
    	var eventDay = parseInt(eventDateArray[0], 10);
		var eventDate = new Date(eventYear, eventMonth, eventDay, 0, 0, 0, 0);

    	var eventConfirmed = false;

    	var eventTags = event.tags.filter(item => item.indexOf('event-location-'))

		if (event.tags.some(item => item.includes('event-confirmed')) ) {
		  eventConfirmed = true
		} 

		var eventLink = 'https://edgeryders.eu/t/' + event.slug;

		var eventExcerpt = event.excerpt.replace(/(<([^>]+)>)/gi, "").replace(/\s*\[.*?\]\s*/g, "").replace(/(\r\n|\n|\r|\\n)/gm, '').replace('&hellip;','...').replace('&amp', '&');

		var eventType = event.tags.filter(item => item.includes('event-type-')).toString().substring(11)

    	var eventObject = {
    		'title': event.title,
    		'location': eventLocation,
    		'date': eventDate,
    		'tags': eventTags,
    		'excerpt': eventExcerpt,
    		'link': eventLink,
    		'image': event.image_url,
    		'type': eventType,
    		'confirmed': eventConfirmed,
    		'views': event.views,
    		'likes': event.like_count,
    		'created': event.created_at,
    		'updated': event.bumped_at,
    	};
      return eventObject;
});

    data.events = eventsArray;
  })
  .catch(function (error) {
    console.log(error);
  })

axios.get('https://edgeryders.eu/tags/webcontent-festival-featured.json')
  .then(function (response) {

  	var usersArray = response.data.users;

    var storiesArray = response.data.topic_list.topics.map(function(story){

    	var storyExcerpt = story.excerpt.replace(/(<([^>]+)>)/gi, "").replace(/\s*\[.*?\]\s*/g, "").replace(/(\r\n|\n|\r|\\n)/gm, '').replace(/(\r\n|\n|\r|\\n)/gm, '').replace('&hellip;','...').replace('&amp', '&');

    	var storyLink = 'https://edgeryders.eu/t/' + story.slug;

    	var storyAuthor = usersArray.find(item => {
   return item.id == story.posters[0].user_id
})

    	var authorAvatar = 'https://edgeryders.eu' + storyAuthor.avatar_template.replace('{size}','200');

    	var storyObject = {
    		'title': story.title,
    		'excerpt': storyExcerpt,
    		'link': storyLink,
    		'image': story.image_url,
    		'views': story.views,
    		'author': {
    			'name': storyAuthor.name,
    			'username': storyAuthor.username,
    			'avatar': authorAvatar
    		},
    		'likes': story.like_count,
    		'created': story.created_at,
    		'updated': story.bumped_at,
    	};
      return storyObject;
});

    data.stories = storiesArray;
  })
  .catch(function (error) {
    console.log(error);
  })

axios.get('https://edgeryders.eu/tags/webcontent-festival-conversations.json')
  .then(function (response) {

  	var usersArray = response.data.users;

    var conversationsArray = response.data.topic_list.topics.map(function(conversation){

    	var conversationExcerpt = conversation.excerpt.replace(/(<([^>]+)>)/gi, "").replace(/\s*\[.*?\]\s*/g, "").replace(/(\r\n|\n|\r|\\n)/gm, '').replace('&hellip;','...').replace('&amp', '&');

    	var conversationLink = 'https://edgeryders.eu/t/' + conversation.slug;

    	var conversationAuthor = usersArray.find(item => {
   return item.id == conversation.posters[0].user_id
})

    	var authorAvatar = 'https://edgeryders.eu' + conversationAuthor.avatar_template.replace('{size}','200');

    	var conversationObject = {
    		'title': conversation.title,
    		'excerpt': conversationExcerpt,
    		'link': conversationLink,
    		'image': conversation.image_url,
    		'views': conversation.views,
    		'author': {
    			'name': conversationAuthor.name,
    			'username': conversationAuthor.username,
    			'avatar': authorAvatar
    		},
    		'likes': conversation.like_count,
    		'comments': conversation.posts_count - 1,
    		'created': conversation.created_at,
    		'updated': conversation.bumped_at,
    	};
      return conversationObject;
});

    data.conversations = conversationsArray;
  })
  .catch(function (error) {
    console.log(error);
  })

  app.get("/festival", (req, res) => {
  res.json(data);
});

});


  app.get("/festival", (req, res) => {
  res.json(data);
});
  
app.get('/', function (req, res) {
 res.send(JSON.stringify({ Hello: 'World'}));
});


app.listen(port, function () {
 console.log('Example app listening on port !');
});
