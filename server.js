const express = require("express");
const logger = require("morgan");
const mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
const axios = require("axios");
const cheerio = require("cheerio");

// Require all models
const db = require("./models");

const PORT = process.env.PORT || 3000;

// Initialize Express
const app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));
const exphbs = require('express-handlebars');
app.engine("handlebars", exphbs({ defaultLayout: "main"}));
app.set("view engine", "handlebars");

// Connect to the Mongo DB
mongoose.connect("mongodb://localhost/HeadlinesGenerator", { useNewUrlParser: true });

// Routes
app.get('/', function(req, res) {
    res.render('index');
});

//reddit Scrape
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with axios
  axios.get("https://old.reddit.com/r/news/").then(function(response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    // Now, we grab every h2 within an article tag, and do the following:
    $(".title").each(function(i, element) {
      // Save an empty result object
      var result = {};
      console.log(result);
      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this).children("a").text();
      result.link = $(this).children("a").attr("href");
      //console.log(result)

      // Create a new Article using the `result` object built from scraping
      db.Article.create(result)
        .then(function(dbArticle) {
          // View the added result in the console
          console.log(dbArticle);
        })
        .catch(function(err) {
          // If an error occurred, log it
          console.log(err);
        });
    });
    res.render("index");
  });
});

//Tech news
app.get("/scrape2", function(req, res) {
  axios.get("https://www.cnet.com/news/").then(function(response) {
    var $ = cheerio.load(response.data);
    $("h5").each(function(i, element) {
      var result = {};
      console.log(result);
      result.title = $(this).children("a").text();
      result.link = $(this).children("a").attr("href");
      db.Article.create(result)
        .then(function(dbArticle) {
          console.log(dbArticle);
        })
        .catch(function(err) {
          console.log(err);
        });
    });
    res.render("index");
  });
}); 

//Trending now route
app.get("/scrape3", function(req, res) {
  axios.get("https://www.buzzfeed.com/news").then(function(response) {
    var $ = cheerio.load(response.data);
    $("h2").each(function(i, element) {
      var result = {};
      console.log(result);
      result.title = $(this).children("a").text();
      result.link = $(this).children("a").attr("href");
      db.Article.create(result)
        .then(function(dbArticle) {
          console.log(dbArticle);
        })
        .catch(function(err) {
          console.log(err);
        });
    });
    res.render("index");
  });
}); 


// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  db.Article.find({})
    .then(function(dbArticle){
        res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.get("/user", function(req, res) {
  // TODO: Finish the route so it grabs all of the articles
  db.Note.find({})
    .then(function(dbArticle){
        res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurs, send the error back to the client
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  // TODO
  // ====
  // Finish the route so it finds one article using the req.params.id,
  db.Article.findById(req.params.id)
    .then(function(dbArticle){
      res.json(dbArticle);
    })
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  // TODO
  // ====
  db.Note.create(req.body)
    .then(function(dbArticle){
      return db.Article.findOneAndUpdate({_id: req.params.id},{ $push: {note: dbArticle._id}}, {new: true});
    })
  // save the new note that gets posted to the Notes collection
  // then find an article from the req.params.id
  // and update it's "note" property with the _id of the new note
});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
