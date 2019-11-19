var express = require("express");
const axios = require("axios");
const cron = require("node-cron");

var http = require("http");
var cors = require("cors");

var port = process.env.PORT || 3000;
var app = express();

app.use(cors());

setInterval(function() {
  http.get("http://edgeryders.herokuapp.com");
  console.log("ping");
}, 300000);

let data = {
  stories: "",
  events: "",
  conversations: "test",
  participants: "",
  categories: "",
  calls: "",
  latest_topics: [],
  latest_users: []
};

cron.schedule("*/1 * * * *", () => {
  console.log("fetching festival content ✧*｡٩(ˊᗜˋ*)و✧*｡");

  axios
    .get("https://edgeryders.eu/tags/webcontent-festival-event.json")
    .then(function(response) {
      var eventsArray = response.data.topic_list.topics.map(function(event) {
        var eventLocation = event.tags
          .filter(item => item.includes("event-location-"))
          .toString()
          .substring(15);

        var eventDateArray = event.tags
          .filter(item => item.includes("event-date-"))
          .toString()
          .substring(11)
          .split("_");
        var eventYear = "20" + eventDateArray[2];
        var eventMonth = parseInt(eventDateArray[1], 10) - 1;
        var eventDay = parseInt(eventDateArray[0], 10);
        var eventDate = new Date(eventYear, eventMonth, eventDay, 0, 0, 0, 0);

        var eventConfirmed = false;

        var eventTags = event.tags.filter(item =>
          item.indexOf("event-location-")
        );

        if (event.tags.some(item => item.includes("event-confirmed"))) {
          eventConfirmed = true;
        }

        var eventLink = "https://edgeryders.eu/t/" + event.slug;

        var eventExcerpt = event.excerpt
          .replace(/(<([^>]+)>)/gi, "")
          .replace(/\s*\[.*?\]\s*/g, "")
          .replace(/(\r\n|\n|\r|\\n)/gm, "")
          .replace("&hellip;", "...")
          .replace("&amp", "&");

        var eventType = event.tags
          .filter(item => item.includes("event-type-"))
          .toString()
          .substring(11);

        var eventObject = {
          title: event.title,
          location: eventLocation,
          date: eventDate,
          tags: eventTags,
          excerpt: eventExcerpt,
          link: eventLink,
          image: event.image_url,
          type: eventType,
          confirmed: eventConfirmed,
          views: event.views,
          likes: event.like_count,
          created: event.created_at,
          updated: event.bumped_at
        };
        return eventObject;
      });

      data.events = eventsArray;
    })
    .catch(function(error) {
      console.log(error);
    });

  var self = data;

   axios.get("https://edgeryders.eu/tags/community-call.json").then(function(response) {

      self.calls = response.data;

    }).catch()

  for (i = 0; i < 10; i++) {
    axios
      .get("https://edgeryders.eu/latest.json?page=" + i)
      .then(function(response) {
        var latest = response.data.topic_list.topics;
        var users = response.data.users;

        var i;

        for (i = 0; i < latest.length; i++) {
          var username = latest[i].last_poster_username;

          if (username !== undefined) {
            var thisUser = users.filter(function(e) {
              return e.username == username;
            });

            axios
              .get("https://edgeryders.eu/u/" + username + ".json")
              .then(function(resp) {
                var obj = {
                  name: resp.data.user.name,
                  username: resp.data.user.username,
                  id: resp.data.user.id,
                  last_active: resp.data.user.last_seen_at,
                  last_posted: resp.data.user.last_posted_at,
                  since: resp.data.user.created_at,
                  bio: resp.data.user.bio_raw,
                  website: resp.data.user.website,
                  location: resp.data.user.location,
                  topics: resp.data.topics,
                  avatar:
                    "https://edgeryders.eu" +
                    resp.data.user.avatar_template.replace("{size}", "200"),
                  link: "https://edgeryders.eu/u/" + resp.data.user.username
                };

                function exists(object, array) {
                  return array.some(function(elem) {
                    return elem.username === object.username;
                  });
                }

                function notUpdated(object, array) {
                  return array.some(function(elem) {
                    return elem.last_posted === object.last_posted;
                  });
                }

                if (exists(obj, self.latest_users)) {
                  console.log("already exists");
                  if (!notUpdated(obj, self.latest_users)) {
                    self.latest_users.push(obj);
                  }
                }

                if (!exists(obj, self.latest_users)) {
                  self.latest_users.push(obj);
                }
              })
              .catch(function(error) {});

            self.latest_topics.push(latest[i]);
          }
        }
        function sortByKey(array, key) {
          return array.sort(function(a, b) {
            var x = a[key];
            var y = b[key];
            return x < y ? 1 : x > y ? -1 : 0;
          });
        }
        sortByKey(self.latest_users, "last_posted");
      })
      .catch(function(error) {
        console.log(error);
      });
  }

  axios
    .get("https://edgeryders.eu/tags/webcontent-festival-featured.json")
    .then(function(response) {
      var usersArray = response.data.users;

      var storiesArray = response.data.topic_list.topics.map(function(story) {
        var storyExcerpt = story.excerpt
          .replace(/(<([^>]+)>)/gi, "")
          .replace(/\s*\[.*?\]\s*/g, "")
          .replace(/(\r\n|\n|\r|\\n)/gm, "")
          .replace(/(\r\n|\n|\r|\\n)/gm, "")
          .replace("&hellip;", "...")
          .replace("&amp", "&");

        var storyLink = "https://edgeryders.eu/t/" + story.slug;

        var storyAuthor = usersArray.find(item => {
          return item.id == story.posters[0].user_id;
        });

        var authorAvatar =
          "https://edgeryders.eu" +
          storyAuthor.avatar_template.replace("{size}", "200");

        var storyObject = {
          title: story.title,
          excerpt: storyExcerpt,
          link: storyLink,
          image: story.image_url,
          views: story.views,
          comments: story.posts_count - 1,
          author: {
            name: storyAuthor.name,
            username: storyAuthor.username,
            avatar: authorAvatar
          },
          likes: story.like_count,
          created: story.created_at,
          updated: story.bumped_at
        };
        return storyObject;
      });
      data.stories = storiesArray;
    })
    .catch(function(error) {
      console.log(error);
    });

  axios
    .get("https://edgeryders.eu/tags/webcontent-festival-organiser-bio.json")
    .then(function(response) {
      var participantsArray = response.data.topic_list.topics.map(function(
        participant
      ) {
        var participantExcerpt = participant.excerpt
          .replace(/(@[^\s]*(?=<\/a>))/g, "")
          .replace(/(<([^>]+)>)/gi, "")
          .replace(/\s*\[.*?\]\s*/g, "")
          .replace("&hellip;", "...")
          .replace("&amp", "&")
          .split(/\n/g);

        if (participant.excerpt.match(/(@[^\s]*(?=<\/a>))/g) !== null) {
          var participantUsername = participant.excerpt.match(
            /(@[^\s]*(?=<\/a>))/g
          )[0];
        } else {
          participantUsername = null;
        }

        var participantObject = {
          title: participant.title,
          username: participantUsername,
          excerpt: participantExcerpt,
          image: participant.image_url,
          link: "https://edgeryders.eu/t/" + participant.slug,
          created: participant.created_at,
          updated: participant.bumped_at
        };
        return participantObject;
      });

      data.participants = participantsArray;
    })
    .catch(function(error) {
      console.log(error);
    });

  axios
    .get("https://edgeryders.eu/categories.json")
    .then(function(response) {
      let categoryArray = response.data.category_list.categories.filter(
        function(e) {
          return (
            e.name !== "Campfire" &&
            e.name !== "Workspaces" &&
            e.name !== "Knowledge Collection" &&
            e.name !== "Documentation & Support" &&
            e.description !== null
          );
        }
      );

      function sortCats(catdata) {
        return catdata.sort((a, b) =>
          a.topics[0].last_posted_at < b.topics[0].last_posted_at ? 1 : -1
        );
      }

      data.categories = sortCats(categoryArray);
    })
    .catch(function(error) {
      console.log(error);
    });

  axios
    .get("https://edgeryders.eu/tags/webcontent-festival-conversations.json")
    .then(function(response) {
      var usersArray = response.data.users;

      var conversationsArray = response.data.topic_list.topics.map(function(
        conversation
      ) {
        var conversationExcerpt = conversation.excerpt
          .replace(/(<([^>]+)>)/gi, "")
          .replace(/\s*\[.*?\]\s*/g, "")
          .replace(/(\r\n|\n|\r|\\n)/gm, "")
          .replace("&hellip;", "...")
          .replace("&amp", "&");

        var conversationLink = "https://edgeryders.eu/t/" + conversation.slug;

        var conversationAuthor = usersArray.find(item => {
          return item.id == conversation.posters[0].user_id;
        });

        var authorAvatar =
          "https://edgeryders.eu" +
          conversationAuthor.avatar_template.replace("{size}", "200");

        var conversationObject = {
          title: conversation.title,
          excerpt: conversationExcerpt,
          link: conversationLink,
          image: conversation.image_url,
          views: conversation.views,
          author: {
            name: conversationAuthor.name,
            username: conversationAuthor.username,
            avatar: authorAvatar
          },
          likes: conversation.like_count,
          comments: conversation.posts_count - 1,
          created: conversation.created_at,
          updated: conversation.bumped_at
        };
        return conversationObject;
      });

      data.conversations = conversationsArray;
    })
    .catch(function(error) {
      console.log(error);
    });

  app.get("/festival", (req, res) => {
    res.json(data);
  });
});

app.get("/", function(req, res) {
  res.send(JSON.stringify({ Hello: "World" }));
});

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json"
  );
  next();
});

const server = app.listen(port, function() {
  console.log("Example app listening on port: " + port);
});

const socketio = require("socket.io")(server);

socketio.emit("chat-message", data);
