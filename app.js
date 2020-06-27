  var bodyParser = require("body-parser"),
      mongoose    = require("mongoose"),
      express       = require("express"),
      app           = express(),
      port          = 4000||process.env.PORT;
      methodOverride = require("method-override");
      fs         = require("fs"),
      multer    = require("multer");


var passport = require("passport"),
    localStrategy = require("passport-local"),
    passportLocalMongoose = require("passport-local-mongoose");

// App configration
mongoose.connect("mongodb://localhost/restful_blog_app");
app.set("view engine","ejs");
app.use(express.static("public"));
app.use(methodOverride("_method"));
app.use(bodyParser.urlencoded({extended: true}));


//blog confrigration
var blogSchema= new mongoose.Schema({
  title: String,
  image: String,
  body: String,
  created: {type: Date, default: Date.now}
});
var Blog = mongoose.model("Blog",blogSchema);

//User model
var userSchema = new mongoose.Schema({
	username : String,
	password : String,
});

userSchema.plugin(passportLocalMongoose);

var User = mongoose.model("User", userSchema);


app.use(require("express-session")({
    secret : "I am Mudit",
    resave : false,
    saveUninitialized : false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    next();
});



//Routes
app.get("/",function(req,res){
  res.redirect("/blogs");
});

app.get("/blogs",function(req,res){
  Blog.find({},function(err,foundblog){
    if(err)
      console.log("Error");
    else
      res.render("index",{blogs: foundblog});
  });
});

//New Routes
//app.get("/blogs/new", function(req,res){
  //       res.render("new");
});

app.post("/blogs", function(req,res){
    Blog.create(req.body.blog, function(err, newblog){
      if(err)
         console.log("New");
      else
         res.redirect("/blogs");
    });
});

//show Routes

app.get("/blogs/:id", function(req,res){
  Blog.findById( req.params.id , function(err, foundblog){
    if(err)
        console.log(err);
    else{
       res.render("view", {blog: foundblog});
     }
   });
});

//Update Routes

app.put("/blogs/:id", function(req, res) {
  Blog.findById(req.params.id, function(err, foundBlog){
    if(err)
        res.redirect("/blogs");
    else {
       res.render("show", {blog: foundBlog});
    }
  });
});


//Edit Route
app.get("/blogs/:id/edit",isAuth, function(req,res){
  Blog.findBYId(req.params.id, function(err, foundBlog){
      if(err)
        res.redirect("/blogs");
      else
        res.render("edit", {blog:foundBlog});
  });
});



//delete Route
app.delete("/blogs/:id", function(req,res){
  Blog.findByIdAndRemove(req.params.id, function(err){
    if(err)
       res.redirect("/blogs");
    else {
      res.redirect("/blogs");
    }
  })
});


Blog.create({
  title: "Test Blog",
  image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=60",
  body: "Hello this is our first Schema",
});

//AUTH Routes


app.get("/register", function(req, res){
   res.render("register");
});

app.post("/register", function(req, res){
	var user = new User({username : req.body.username});
	User.register(user, req.body.password, function(err, newUser){
		if(err)
			console.log(err);
        else
        {
        	passport.authenticate("local")(req, res, function(){
         	    if(err)
         	     	 console.log(err);
                else
                {
                	res.redirect("/blogs");
                }
            });
        }
	});
});


app.get("/login", function(req, res){
	res.render("login");
});

app.post("/login", passport.authenticate("local",{
         successRedirect : "/blogs",
         failureRedirect : "/login"
    }));

app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/blogs");
});

// authenntication function
function isLoggedIn(req, res, next){
	if(req.user)
		return next();
	res.redirect("/login");
}


function isAuth(req, res, next){
	if(req.isAuthenticated())
	{
		Blog.findById(req.params.id, function(err, foundBlog){
	    	if(err)
	    	{
	    		res.redirect("back");
	    	}
	    	else
	    	{
	    		if(foundBlog.author.id.equals(req.user._id)){
	    			return next();
	    		}
	    		res.redirect("back");
	    	}
		});
	}
    else
    {
    	res.redirect("/login");
    }
}
app.listen(port, function(err){
  if(err)
    console.log(err);
  else
    console.log("Server has stared");
 }
);
