var express = require("express");
var app = express();
var PORT = 8080; // default port 8080

var cookieParser = require('cookie-parser');
app.use(cookieParser());

app.set("view engine", "ejs"); 
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

function generateRandomString() {
  const randomString = Math.random().toString(36).substr(2, 6);
  //console.log(urlDatabase);
  return randomString;
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, userId: req.cookies["user_id"], users: users };
  res.render("urls_index", templateVars);
});

app.get("/hello", (req, res) => {
  const templateVars = { greeting: 'Hello World!', userId: req.cookies["user_id"] };
  res.render("hello_world", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { userId: req.cookies["user_id"], users: users };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  //console.log(shortURL)
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
  //console.log(req.body);  // Log the POST request body to the console
  //res.send("Ok");         // Respond with 'Ok' (we will replace this)
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], userId: req.cookies["user_id"], users: users };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  if(!urlDatabase[req.params.shortURL]){
    res.redirect('/urls/new');
  } else {
    res.redirect(longURL);
  }
});

app.post('/urls/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

app.post('/urls/:shortURL', (req, res) => {
  const newLongURL = req.body.newLongURL;
  for(let i in urlDatabase){
    if(i = req.params.shortURL){
      urlDatabase[i] = newLongURL;
    }
  }
  res.redirect('/urls')
  // const templateVars = { shortURL: req.params.shortURL, longURL: newLongURL};
  // res.render("urls_show", templateVars);
});

app.post('/login', (req, res) => {
  res.cookie('userId', req.body.username);
  //console.log('Cookies: ', res.cookie('username', req.body.username));
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.get('/register', (req, res) => {
  const templateVars = { userId: req.cookies["user_id"] };
  res.render("register", templateVars);
});

app.post('/register', (req, res) => {
  const userId = generateRandomString();
  users[userId] = {
    id: userId, 
    email: req.body.email, 
    password: req.body.password
  }
  console.log(users);
  res.cookie('user_id', userId);
  res.redirect('/urls');
})
