require('dotenv').config();
const dns = require("node:dns")
const express = require('express');
const mongoose = require('mongoose')
const cors = require('cors');
const bodyParser = require('body-parser');
const { error } = require('node:console');
const ShortUniqueId = require('short-unique-id');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use(bodyParser.urlencoded({ extended: true }))

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

//mongoose settings
mongoose.connect(process.env.MONGO_URI).then(() => console.log("connected !")).catch((error) => console.log(error))

const UrlsSchema = mongoose.Schema({
  original_url : String,
  short_url: String
}) 

const AllUrls = mongoose.model('AllUrls', UrlsSchema)

  // newUrl.save()
// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});


// Express backend
app.post('/api/shorturl', (req, res, next) => {
  const httpRegex = new RegExp("http://|https://", "g")
  const url = req.body.url
  const httpCondition = httpRegex.test(url)
// url sanity
  const sanityUrl = url.replace(httpRegex, "")
  //url filters and validating
  const options = {
    family: 6,
    hints: dns.ADDRCONFIG | dns.V4MAPPED,
  };

  dns.lookup(sanityUrl, options,async (err, address, family) => {
     if(!httpCondition || err) {
      return res.json({error: "Invalid URL"})
     }
     //saving url to mongoose mongoose
     //check url for already exits in database
     const uid = new ShortUniqueId({ length: 7 });
     const url_ID = uid.rnd()
     const urlCount = await AllUrls.find({original_url: new RegExp(`^${url}`,"g")})
     console.log(urlCount)
     if(urlCount.length != 0) {
      url_ID = `${urlCount[0].short_url}f${urlCount.length}`
     } 
     const newUrl = new AllUrls({original_url: url, short_url: url_ID})
     newUrl.save()
     res.json(newUrl)
     next()
  })



})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
