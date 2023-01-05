sv = require("./server")
sampleDAO = require("./dbutil")
const qs = require('querystring'); //json data parse 

var MainController={}

sv.router.get("/main", async function (req, res) {
  res.render('main');
})

module.exports = MainController
