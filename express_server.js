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
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  const newString = generateRandomString()
  urlDatabase[newString] = req.body.longURL;
  res.redirect(`/urls/${newString}`);
  // res.send("Ok"); // Respond with 'Ok' (we will replace this)
});

app.get("/u/:id", (req, res) => {
  // console.log(req.url);
  let newTiny = req.url.slice(3)
  const longURL = urlDatabase[newTiny];
  res.redirect(longURL);
});

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"] };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
    // ... any other vars
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    username: req.cookies["username"]
  };
  // console.log(templateVars.username);

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
  console.log(req.body.newurl);
  urlDatabase[editID] = req.body.newurl;
  res.redirect('/urls/')
})

app.post("/urls/:id/delete", (req, res) => {
  const deleteID = req.params.id;
  console.log(req.params);
  delete (urlDatabase[deleteID]);
  res.redirect('/urls/');
})

app.post("/login", (req, res) => {
  res.cookie("username", req.body.username);
  res.redirect('/urls/');
})

app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect('/urls/');
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
