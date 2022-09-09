const express = require("express");
const app = express();
const PORT = 8080;
const bcrypt = require("bcryptjs");
const cookieSession = require('cookie-session');
const { getUserByEmail } = require('./views/helpers.js');

function generateRandomString (){
  return Math.random().toString(36).substr(2, 6);
}

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(
  cookieSession({
    name: 'session',
    keys: ['mySecretKey1', 'mySuperSecretKey2'],
    maxAge: 10 * 60 * 1000 // 10 min
  })
);

const urlDatabase = {
  b2xVn2: {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userOne",
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "userTwo",
  },
};

const users = {
  userOne: {
    id: "userOne",
    email: "rufus@example.com",
    password: "good-boy",
  },
  userTwo: {
    id: "userTwo",
    email: "blackmore@example.com",
    password: "leave-it",
  },
};

// function to return specific urls a user has created based on user id
const urlsForUser = id => {
  let urlsList = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      urlsList[url] = urlDatabase[url].longURL;
    }
  } return urlsList;
};

app.post("/urls", (req, res) => {
  // disallow user from modifying url if they are not logged in
  if (!req.session.user_id) {
    res.send("Cannot shorten url, please login first");
  } else if (req.session.user_id) {
    // generate random string for created tiny url
    const newString = generateRandomString();
    // add new url to the database
    urlDatabase[newString] = { longURL: req.body.longURL,
      userID: req.session.user_id};
    res.redirect(`/urls/${newString}`);
  }
});

app.get("/urls/register", (req, res) => {
  const templateVars = {id: req.params.id,
    user: users[req.session.user_id]};
  if (req.session.user_id) {
    res.redirect("/urls");
  }
  res.render("register", templateVars);
});

app.post("/urls/register", (req, res) => {
  const newUserID = generateRandomString();
  const newUserEmail = req.body.email;
  // create variable to hash password input by the user in register form
  const newUserPassword = bcrypt.hashSync(req.body.password, 10);
  // user password must be at least one character, this could be modified to some other minimum length
  if (req.body.password.length === 0) {
    return res.status(400).send({ Message: 'Bad request'});
  // user must input an email address and password to register
  } else if (newUserEmail === "" || newUserPassword === "") {
    return res.status(400).send({ Message: 'Bad request'});
  // check whether email already exists in user database
  } else if (getUserByEmail(newUserEmail, users) !== null) {
    return res.status(400).send({ Message: 'Bad request'});
  }
  // otherwise, create new user and add to the user database
  users[newUserID] = {
    "id": newUserID,
    "email": newUserEmail,
    "password": newUserPassword
  };
  // set a user_id cookie containing the user's newly generated ID
  req.session.user_id = newUserID;
  res.redirect('/urls');
});

app.get("/login", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.session.user_id] };
    // redirect user if user id can be obtained from login cookie
  if (req.session.user_id) {
    res.redirect("/urls");
  }
  res.render("login", templateVars);
});

app.get("/u/:id", (req, res) => {
  let newTiny = req.url.slice(3);
  const longURL = urlDatabase[newTiny].longURL;
  let tinyCheck = req.params.id;
  let checkResult = false;
  // check database for tiny url based on :id in the request
  for (const key in urlDatabase) {
    if (key === tinyCheck) {
      checkResult = true;
    }
  }
  // if url does not exist in database, user is not allowed access
  if (checkResult === false) {
    res.send("URL does not exist in the database, unable to access");
  } else if (checkResult === true) {
    res.redirect(longURL);
  }
});

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlsForUser(req.session.user_id),
    user: users[req.session.user_id],
    longURL: "longURL"};
    // display message telling user to login if there is no login cookie
  if (!templateVars.user) {
    return res.status(400).send({ Message: 'Please login first at http://localhost:8080/login'});
    // render page if login cookie exists
  } else if (templateVars.user) {
    res.render("urls_index", templateVars);
  }
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id]
  };
  // user is not allowed to create a new url if they are not logged in
  if (!req.session.user_id) {
    res.redirect("/login");
  // if user logged in, display form allowing them to create a new url
  } else if (req.session.user_id) {
    res.render("urls_new", templateVars);
  }
});

app.get("/urls/:id", (req, res) => {
  const templateVars = {
    urls: urlsForUser(req.session.user_id),
    id: req.params.id,
    longURL: urlDatabase[req.params.id]["longURL"],
    user: users[req.session.user_id]
  };
  // return an error if url user is attempting to reach was not created by them
  if (!templateVars["urls"][templateVars["id"]]) {
    return res.status(400).send({ Message: 'Bad request'});
  }
  // otherwise, render the page for that specific tiny url
  res.render("urls_show", templateVars);
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.post("/urls/:id/", (req, res) => {
  const editID = req.params.id;
  const templateVars = {
    urls: urlsForUser(req.session.user_id),
    longURL: urlDatabase[req.params.id]["longURL"],
    user: users[req.session.user_id]
  };
  // disallow user from modifying a url if it does not belong them them
  if (!templateVars["urls"][editID]) {
    return res.status(400).send({ Message: 'Bad request'});
  }
  urlDatabase[editID].longURL = req.body.newurl;
  res.redirect('/urls/');
});

app.post("/urls/:id/delete", (req, res) => {
  const deleteID = req.params.id;
  const templateVars = {
    urls: urlsForUser(req.session.user_id),
    longURL: urlDatabase[req.params.id]["longURL"],
    user: users[req.session.user_id]
  };
  // disallow user from deleting url's that don't belong to them
  if (!templateVars["urls"][deleteID]) {
    return res.status(400).send({ Message: 'Bad request'});
  } else if (req.session.user_id) {
    delete (urlDatabase[deleteID]);
    res.redirect('/urls/');
  }
});

app.post("/login", (req, res) => {
  const loginEmail = req.body.email;
  const loginPassword = req.body.password;
  const idCheck = (getUserByEmail(loginEmail, users));
  // check that user email exists in user database
  if (idCheck === null) {
    return res.status(403).send({ Message: 'Bad request'});
  // check that password is matching, if not send an error message
  } else if (!bcrypt.compareSync(loginPassword, users[idCheck].password)) {
    return res.status(403).send({ Message: 'Bad request'});
  } else if (bcrypt.compareSync(loginPassword, users[idCheck].password)) {
    req.session.user_id = idCheck;
  }
  // if password is matching, redirect to urls page
  res.redirect('/urls/');
});

app.post("/logout", (req, res) => {
  // remove cookies and other data from req.session
  req.session = null;
  res.redirect('/urls/');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
