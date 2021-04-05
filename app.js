const express = require('express');
const app = express();
app.use(express.json());
const {
  models: { User },
} = require('./db');
const path = require('path');

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.post('/api/auth', async (req, res, next) => {
  try {
    const token = await User.authenticate(req.body);
    console.log('token from POST >>>', token);
    res.send({ token });
  } catch (ex) {
    next(ex);
  }
});
//>>> This route assumes that the authorization header has been set on the request and it uses that to verify the user by its token. It also uses a class method which has all the logic for handling the token. Replace this logic with your own so that you verify the given token was signed by your app. If it was, you can use the data in the token to identify the user and pull all their information from the database. The route should ultimately return a full user object.
//>>> create token variable to hold authenticated data of username and password, and send it as encoded text of the id only based on Token Logic, back to front end

app.get('/api/auth', async (req, res, next) => {
  try {
    console.log('GET ROUTE', req.headers.authorization);
    res.send(await User.byToken(req.headers.authorization));
  } catch (ex) {
    next(ex);
  }
});

app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status || 500).send({ error: err.message });
});

module.exports = app;
