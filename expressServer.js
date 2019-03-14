const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const cookieParser = require('cookie-parser');
app.use(cookieParser());

app.set("view engine", "ejs"); 
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const bcrypt = require('bcrypt');

const urlDatabase = {
  "b2xVn2": { longURL: "https://www.tsn.ca", userID: "gmjjl1" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "znmg1s" }
};

const users = { 
  "gmjjl1": {
    id: "agmjjl1c", 
    email: "random@random.com", 
    password: '$2b$10$raJIkbeqoaSSIswnzEt5/u/HTOei9wtvQ4S7FyGohI6Ve.yhKrKha'
  },
 "znmg1s": {
    id: "znmg1s", 
    email: "user@example.com", 
    password: '$2b$10$JpR.Px/xMdp7Ho99NSY5zu6PWsOIWB0trR/6omNHOFOkv4mNn37X6'
  }
}


function generateRandomString() {
  const randomString = Math.random().toString(36).substr(2, 6);
  //console.log(urlDatabase);
  return randomString;
}

function checkEmail(email){
  for(let u in users) {
    if(users[u]['email'] === email){
      return true;
    } //else return false;
  }
  return false;
}

function urlsForUser(id){
  const urls = {};
  for (let i in urlDatabase){
    if (urlDatabase[i]['userID'] === id){
      const shortURL = i;
      const longURL = urlDatabase[i]['longURL'];
      urls[shortURL] = longURL;
    }
  }
  return urls;
}

function checkUrlsBelongtoUser(url, user){
  if(urlDatabase[url]['userID'] === user){
    return true;
  }
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
  if(!req.cookies["user_id"]){
    res.redirect('/login');
  } else {
    const usersURL = urlsForUser(req.cookies["user_id"])
    const templateVars = { urls: usersURL, user: users[req.cookies["user_id"]] };
    res.render(`urls_index`, templateVars);
  }
});

app.get("/hello", (req, res) => {
  const templateVars = { greeting: 'Hello World!', user: users[req.cookies["user_id"]] };
  res.render("hello_world", templateVars);
});

app.get("/urls/new", (req, res) => {
  if(!req.cookies["user_id"]){
    res.redirect('/login');
  } else {
    const templateVars = { user: users[req.cookies["user_id"]] };
    res.render("urls_new", templateVars);
  }
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  //console.log(shortURL)
  urlDatabase[shortURL] = {longURL:(req.body.longURL), userID: req.cookies["user_id"]};
  res.redirect(`/urls/${shortURL}`);
  //console.log(req.body);  // Log the POST request body to the console
  //res.send("Ok");         // Respond with 'Ok' (we will replace this)
});

app.get("/urls/:shortURL", (req, res) => {
  if(!req.cookies["user_id"]){
    res.redirect('/login');
  } else {
    if(checkUrlsBelongtoUser(req.params.shortURL, req.cookies["user_id"])){
      const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]['longURL'], user: users[req.cookies["user_id"]] };
      res.render("urls_show", templateVars);
    } else {
      res.send ('This URL belongs to somebody else!')
    }
  }
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL]['longURL'];
  if(!urlDatabase[req.params.shortURL]){
    res.redirect('/urls/new');
  } else {
    res.redirect(longURL);
  }
});

app.post('/urls/:shortURL/delete', (req, res) => {
  if(!req.cookies["user_id"]){
    res.redirect('/login');
  } else {
    if(checkUrlsBelongtoUser(req.params.shortURL, req.cookies["user_id"])){
      delete urlDatabase[req.params.shortURL];
      res.redirect('/urls');
    }else {
      res.send ('This URL belongs to somebody else!')
    }
  }
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

app.get('/login', (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render('login', templateVars);
});

app.post('/login', (req, res) => {
  //res.cookie('userId', req.body.username);
  //console.log('Cookies: ', res.cookie('username', req.body.username));
  if (checkEmail(req.body.email) === false){
    res.statusCode = 403; 
    res.send('Email does not exist!')
  } else {
    for (let u in users){
      if(users[u]['email'] === req.body.email){
        storedPswd = users[u]['password'];
        if (bcrypt.compareSync(req.body.password, storedPswd)){
          res.cookie('user_id', u);
          res.redirect('/urls');
        } else {
          res.statusCode = 403;
          res.send('Email and password do not match!')
        }
      }
    }
  }
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.get('/register', (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render("register", templateVars);
});

app.post('/register', (req, res) => {
  if(!req.body.email || !req.body.password){
    res.statusCode = 400;
    res.send('Empty input!');
  } else if (checkEmail(req.body.email) === true){
    res.statusCode = 400;
    res.send('Email already exists!')
  } else {
      const userId = generateRandomString();
      users[userId] = {
        id: userId, 
        email: req.body.email, 
        password: bcrypt.hashSync(req.body.password, 10)
      }
      console.log(users);
      res.cookie('user_id', userId);
      res.redirect('/urls');
    }
})

