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

function generateRandomString(input) {
  const randomShortURL = Math.random().toString(36).substr(2, 6);
  urlDatabase[randomShortURL] = input;
  //console.log(urlDatabase);
  return randomShortURL;
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
  const templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  res.render("urls_index", templateVars);
});

app.get("/hello", (req, res) => {
  const templateVars = { greeting: 'Hello World!', username: req.cookies["username"] };
  res.render("hello_world", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { username: req.cookies["username"] };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString(req.body.longURL);
  //console.log(shortURL)
  res.redirect(`/urls/${shortURL}`);
  //console.log(req.body);  // Log the POST request body to the console
  //res.send("Ok");         // Respond with 'Ok' (we will replace this)
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: req.cookies["username"] };
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
  res.cookie('username', req.body.username);
  //console.log('Cookies: ', res.cookie('username', req.body.username));
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
})
