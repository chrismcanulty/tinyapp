const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

function generateRandomString() {
  return Math.random().toString(36).substr(2, 6)
}

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));

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
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id] };
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

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
