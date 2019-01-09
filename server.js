const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const expressValidator = require('express-validator');
var User = require('./userSchema')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MLAB_URI || 'mongodb://localhost/exercise-track' )

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.use(expressValidator())

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get('/api/exercise/log', function(req,res,next){
  console.log(req.query)
  User.findById(req.query.userId)
  .exec(function(err, data){
    if (err) next();
    var out = {
      _id: data._id,
      username: data.username,
      count:0,
      log:[]
    }
    var num=0;
    var query;
    var from = new Date(req.query.from)
    var to = new Date(req.query.to)
    data.log.forEach(function(element) {
      if (num<(req.query.limit || data.log.length)) {
        if (req.query.from && req.query.to) query=element.date>=from && element.date<to;
        else if (req.query.from) query=element.date>=from;
        else if (req.query.to) query=element.date<to;
        else query=1;
        console.log(element)
        if (query){
          num++;
          out.count = num;
          out.log.push({description: element.description,
                       duration: element.duration,
                       date: element.date.toDateString()});
          }
      }
    })
    res.send(out)
  })
  // User.aggregate([
  //   {
  //     $match: {_id: req.query.userId
  //              // "log.date": {$gte: req.query.from, $lt: req.query.to}
  //             }
  //   },
  //   { 
  //     $project: { _id: "$_id", 
  //                username: "$username",
  //                // count: {$sum:1},
  //                log: { $slice: [ "$log", req.query.limit ] } 
  //               }
  //   } 
  // ]).exec(function(err, data){
  //   if (err) next();
  //   res.send(data)
  // })
})

app.post('/api/exercise/new-user', function(req,res){
  
  req.checkBody('username', 'Path `username` is required.').notEmpty();
  
  var errors = req.validationErrors();
  if (errors) res.send(errors[0].msg)
  else{
    User.findOne({username: req.body.username}, function(err, user){
      if (err) res.send(err)
      if (user) res.send('username already taken')
      else {
        var newUser = new User();
        newUser.username = req.body.username
        newUser.save(function(err,data){
          if (err) res.send(err)
          else res.send({username: data.username, _id: data._id})
    })
    }
  })
  }
})

app.post('/api/exercise/add', function(req,res){
  
  req.checkBody('description', 'Path `description` is required.').notEmpty();
  req.checkBody('duration', 'Path `duration` is required.').notEmpty();
  
  var errors = req.validationErrors();
  if (errors) res.send(errors[0].msg)
  else{
    var log = {
        description: req.body.description,
        duration: req.body.duration,
        date: req.body.date || new Date().toDateString()
      }
  User.findOneAndUpdate({_id: req.body.userId}, {$inc: {count: 1},$push: {log: log}}, function(err, user){
    if (err) res.send(err)
    if (!user) res.send('unknown _id')
    else {
      res.send({_id: user._id, username: user.username, description: log.description, duration: log.duration, date: log.date})
    }
  })
  }
})

// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
