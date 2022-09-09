const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require('cookie-parser')

function generateRandomString() {
  return Math.random().toString(36).substr(2, 6)
}

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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

const urlsForUser = id => {
  let urlsList = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      // object with tinyURL: longURL key value pair
      urlsList[url] = urlDatabase[url].longURL
      // urlsList.push(urlDatabase[url].longURL)
    }
  } return urlsList;
}

const getUserByEmail = (email, userList) => {
  for (let user in userList) {
    if (email === userList[user].email) {
      return userList[user].id;
    }
  } return null
}

app.post("/urls", (req, res) => {
  // console.log(req.body); // Log the POST request body to the console
  if (!req.cookies.id) {
    res.send("Cannot shorten url, please login first")
  } else if (req.cookies.id) {
  const newString = generateRandomString()
  urlDatabase[newString] = { longURL: req.body.longURL,
    userID: req.cookies.id};
  res.redirect(`/urls/${newString}`);
  }
});

app.get("/urls/register", (req, res) => {
  const templateVars = {id: req.params.id,
    // longURL: urlDatabase[req.params.id]["longURL"],
    user: users[req.cookies.id]};
    if (req.cookies.id) {
      res.redirect("/urls")
    }
  res.render("register", templateVars)
})

app.post("/urls/register", (req, res) => {
  const newUserID = generateRandomString();
  const newUserEmail = req.body.email;
  const newUserPassword = req.body.password;
  if (newUserEmail === "" || newUserPassword === "") {
    return res.status(400).send({ Message: 'Bad request'});
  } else if (getUserByEmail(newUserEmail, users) !== null) {
    return res.status(400).send({ Message: 'Bad request'});
  }
  users[newUserID] = {
    "id": newUserID,
    "email": newUserEmail,
    "password": newUserPassword
  }
  // set a user_id cookie containing the user's newly generated ID
  res.cookie("id", newUserID);
  res.redirect('/urls');
})

app.get("/login", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies.id] };
  if (req.cookies.id) {
    res.redirect("/urls")
  }
  res.render("login", templateVars);
})

app.get("/u/:id", (req, res) => {
  // console.log(req.url);
  let newTiny = req.url.slice(3)
  const longURL = urlDatabase[newTiny].longURL;
  let tinyCheck = req.params.id;
  let checkResult = false;
  for (const key in urlDatabase) {
    if (key === tinyCheck) {
      checkResult = true;
    }
  }
  if (checkResult === false) {
  res.send("URL does not exist in the database, unable to access")
  }
  else if (checkResult = true) {
  res.redirect(longURL)};
});

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlsForUser(req.cookies.id),
    user: users[req.cookies.id],
    longURL: "longURL"};
  if (!templateVars.user) {
    return res.status(400).send({ Message: 'Please login first at http://localhost:8080/login'})
  } else if (templateVars.user) {
    res.render("urls_index", templateVars)};
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.cookies.id]
    // ... any other vars
  };
  if (!req.cookies.id) {
    res.redirect("/login")
  } else if (req.cookies.id) {
  res.render("urls_new", templateVars)};
});

app.get("/urls/:id", (req, res) => {
  const templateVars = {
    urls: urlsForUser(req.cookies.id),
    id: req.params.id,
    longURL: urlDatabase[req.params.id]["longURL"],
    user: users[req.cookies.id]
  };
  // if (!templateVars.user) {
  //   res.redirect('/login')
  // return error message if user does not own the url at /urls/:id
  if (!templateVars["urls"][templateVars["id"]]) {
    return res.status(400).send({ Message: 'Bad request'});
  }
  res.render("urls_show", templateVars);
});

app.get("/", (req, res) => {
  res.send("Hello!")
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
    urls: urlsForUser(req.cookies.id),
    // id: req.params.id,
    longURL: urlDatabase[req.params.id]["longURL"],
    user: users[req.cookies.id]
  }
  console.log(editID);
  if (!templateVars["urls"][editID]) {
    return res.status(400).send({ Message: 'Bad request'});
  }
  urlDatabase[editID].longURL = req.body.newurl;
  res.redirect('/urls/')
})

app.post("/urls/:id/delete", (req, res) => {
  const deleteID = req.params.id;
  // console.log(req.params);
  const templateVars = {
    urls: urlsForUser(req.cookies.id),
    // id: req.params.id,
    longURL: urlDatabase[req.params.id]["longURL"],
    user: users[req.cookies.id]
  }
  // if (!deleteID) {
  //   return res.status(400).send({ Message: 'Bad request'})};
  if (!templateVars["urls"][deleteID]) {
    return res.status(400).send({ Message: 'Bad request'});
  }
  // if (!req.cookies.id) {
  //   res.redirect("/login")
  else if (req.cookies.id) {
  delete (urlDatabase[deleteID]);
  res.redirect('/urls/')};
})

app.post("/login", (req, res) => {
  const loginEmail = req.body.email;
  const loginPassword = req.body.password;
  const idCheck = (getUserByEmail(loginEmail, users));
  console.log(idCheck);
  if (idCheck === null) {
    return res.status(403).send({ Message: 'Bad request'});
  } else if (users[idCheck].password !== loginPassword) {
    return res.status(403).send({ Message: 'Bad request'});
  }
  else if (users[idCheck].password === loginPassword) {
    res.cookie("id", idCheck);
  }
  // users[newUserID] = {
  //   "id": newUserID,
  //   "email": newUserEmail,
  //   "password": newUserPassword
  // }
  // set a user_id cookie containing the user's newly generated ID
  res.redirect('/urls/');
})

app.post("/logout", (req, res) => {
  res.clearCookie("id");
  res.redirect('/urls/');
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
