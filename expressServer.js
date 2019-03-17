const cookieSession = require('cookie-session');
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
app.use(cookieSession({
  name: 'session',
  keys: ['49f68a5c8493ec2c0bf489821c21fc3b']
}))


app.set("view engine", "ejs"); 
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const bcrypt = require('bcrypt');

//-------- Databases --------
let urlDatabase = {
  "b2xVn2": { longURL: "https://www.tsn.ca", userID: "gmjjl1", date: 'Fri Mar 15 2019 15:31:07 GMT+0000 (UTC)' },
  "9sm5xK": { longURL: "http://www.google.com", userID: "znmg1s", date: 'Fri Mar 15 2019 09:30:05 GMT+0000 (UTC)' },
  "chjib3": { longURL: "https://stackoverflow.com", userID: "gmjjl1", date: 'Fri Mar 15 2019 15:51:22 GMT+0000 (UTC)'}
};

let users = { 
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
//-------- End of databases --------


//-------- Helper functions --------
function generateRandomString() {
  const randomString = Math.random().toString(36).substr(2, 6);
  return randomString;
}

//check if an Email exists in database
function checkEmail(email){
  for(let u in users) {
    if(users[u]['email'] === email){
      return true;
    } 
  }
  return false;
}

//given an user, output this user's shortURLs, longURLs, and date of creation
function urlsForUser(id){
  const urls = {};
  for (let i in urlDatabase){
    if (urlDatabase[i]['userID'] === id){
      const shortURL = i;
      const longURL = urlDatabase[i]['longURL'];
      const date = urlDatabase[i]['date'];
      urls[shortURL] = {longURL: longURL, date: date};
    }
  }
  return urls;
}

//check if a url belongs to an user
function checkUrlsBelongtoUser(url, user){
  if(urlDatabase[url]['userID'] === user){
    return true;
  }
}

//check if an URL exists in database
function checkURL(url){
  if(urlDatabase[url]){
    return true;
  }
}
//-------- End of helper functions --------

//-------- Routes --------
app.get("/", (req, res) => {
  res.redirect('/urls'); //set homepage to urls
});

//-------- Routes: get urls --------
app.get("/urls", (req, res) => {
  if(!req.session.user_id){ // check if the user is logged in
    res.redirect('/login');
  } else {
    const usersURL = urlsForUser(req.session.user_id);
    const templateVars = { urls: usersURL, user: users[req.session.user_id] };
    res.render(`urls_index`, templateVars);
  }
});

//-------- Routes: get urls/new; open up a page with a form where user can add new long url --------
app.get("/urls/new", (req, res) => {
  if(!req.session.user_id){
    res.redirect('/login');
  } else {
    const templateVars = { user: users[req.session.user_id] };
    res.render("urls_new", templateVars);
  }
});
//-------- Routes: post to urls; server generates a short url for user's long url --------
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  var localTime = new Date().toLocaleString("en-US", { timeZone: 'America/Vancouver' });
  localTime = new Date(localTime); 
  urlDatabase[shortURL] = {longURL:(req.body.longURL), userID: req.session.user_id, date: localTime};
  //add the shortURL, longURL and the date of creation into database
  res.redirect(`/urls/${shortURL}`);
});

//-------- Routes: get /urls/:shortURL; show the details of an url --------
app.get("/urls/:shortURL", (req, res) => {
  if(!req.session.user_id){
    res.redirect('/login');
  } else {
    if(checkURL(req.params.shortURL)){
      if(checkUrlsBelongtoUser(req.params.shortURL, req.session.user_id)){
        const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]['longURL'], user: users[req.session.user_id], date: urlDatabase[req.params.shortURL]['date'] };
        res.render("urls_show", templateVars);
      } else {
        res.redirect('/error/notyoururl');
      }
    } else {
      res.redirect('/error/nosuchurl');
    }
  }
});

//-------- Routes: get /u/:shortURL; without user authentication, given a short url, redirect user to the long url --------
app.get("/u/:shortURL", (req, res) => {
  if(checkURL(req.params.shortURL)){
    const longURL = urlDatabase[req.params.shortURL]['longURL'];
    res.redirect(longURL);
  } else {
    res.redirect('/error/nosuchurl');
  } 
});

//-------- Routes: post /urls/:shortURL/delete; delete the url from urlDatabase --------
app.post('/urls/:shortURL/delete', (req, res) => {
  if(!req.session.user_id){
    res.redirect('/error/notlogin');
  } else {
    if(checkUrlsBelongtoUser(req.params.shortURL, req.session.user_id)){
      delete urlDatabase[req.params.shortURL];
      res.redirect('/urls');
    }else {
      res.redirect('/error/notyoururl');
    }
  }
});

//-------- Routes: post /urls/:shortURL; update the long url in urlDatabase--------
app.post('/urls/:shortURL', (req, res) => {
  const newLongURL = req.body.newLongURL;
  urlDatabase[req.params.shortURL]['longURL'] = newLongURL; //update the database with the newURL that user entered
  res.redirect('/urls');
});

//-------- Routes: get /login; load the log in page --------
app.get('/login', (req, res) => {
  const templateVars = { user: users[req.session.user_id] };
  res.render('login', templateVars);
});

//-------- Routes: post /login; perform user authentication --------
app.post('/login', (req, res) => {
  if (checkEmail(req.body.email) === false){
    res.statusCode = 403; 
    res.redirect('/error/emailnotexist');
  } else {
    for (let u in users){
      if(users[u]['email'] === req.body.email){
        storedPswd = users[u]['password'];
        if (bcrypt.compareSync(req.body.password, storedPswd)){
          req.session.user_id = u; // set cookie
          res.redirect('/urls'); // only if user gives the matching email and password, his urls will be displayed
        } else {
          res.statusCode = 403;
          res.redirect('/error/wrongpswd');
        }
      }
    }
  }
});

//-------- Routes: post /logout; clear session --------
app.post('/logout', (req, res) => {
  req.session.user_id = null; 
  res.redirect('/urls');
});

//-------- Routes: get /register; load the register page --------
app.get('/register', (req, res) => {
  const templateVars = { user: users[req.session.user_id] };
  res.render("register", templateVars);
});

//-------- Routes: post /register; check user input, update users database, and set session --------
app.post('/register', (req, res) => {
  if(!req.session.user_id){
    if(!req.body.email || !req.body.password){
      res.statusCode = 400;
      res.redirect('/error/noinput');
    } else if (checkEmail(req.body.email) === true){
      res.statusCode = 400;
      res.redirect('/error/emailexists');
    } else {
        const userId = generateRandomString();
        users[userId] = {
          id: userId, 
          email: req.body.email, 
          password: bcrypt.hashSync(req.body.password, 10) //store the id, email and the encryped password in database
        };
        req.session.user_id = userId; 
        res.redirect('/urls');
    }
  } else {
    res.redirect('/urls');
  }
});

//-------- Routes: get /error/:reason; load the relevant error message page --------
app.get('/error/:reason', (req, res) => {
  const templateVars = { user: users[req.session.user_id], reason: req.params.reason };
  res.render("error", templateVars);
});
//-------- End of routes --------

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});