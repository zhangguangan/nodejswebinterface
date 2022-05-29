var Sha256 = require('../public/javascripts/sha256')
var request = require('request');
var config = require('../config')


exports.newUserAndPassword = function(req, res, callback) {
  if ( ('userid' in req.body) && ('password' in req.body) )
  {
    var enteredUser = req.body["userid"]
    var enteredPassword = req.body["password"]

    var url = config.web.hydraHost + ":" + config.web.hydraPort + '/xoa/rest/api/1/isValidUser?username=' + enteredUser + '&password=' + enteredPassword + '&type=technician&salt=' + req.session.salt
    request(url, function (error, response, result) {
      console.log(error)

      if (typeof response !== 'undefined')
      {
         console.log(response.statusCode)
      }
      else
      {
         console.log("No response from hydra web service!")
      }

      if (error == null && response.statusCode == 200) {
        console.log(result);
        //if (1) {
        if (result === "valid") {
          console.log("Valid username and password")
          req.session.user = enteredUser
          req.session.password = enteredPassword
          req.session.error = ""
          callback();
        }
        else
        {
          console.log("Wrong username or password")
          req.session.error = "Wrong username or password"
          callback();
        }
      }
      else {
        console.log("No valid response from on our isValidUser request")
        req.session.error = "No valid response from on our isValidUser request"
        callback();
      }
    });
  }
  else
  {
    console.log("No username or password provided")
    req.session.error = "No username or password provided"
    callback();
  }
};




exports.newPinOfTheDay = function(req, res, callback) {
  if (req.session.user != undefined && req.session.password != undefined)
  {
    if ('pinOfTheDay' in req.body)
    {
      var enteredPinOfTheDay = req.body["pinOfTheDay"]

      var url = config.web.hydraHost + ":" + config.web.hydraPort + '/xoa/rest/api/1/isValidPinOfTheDay?username=' + req.session.user + '&password=' + req.session.password + '&pinOfTheDay=' + enteredPinOfTheDay + '&salt=' + req.session.salt
      request(url, function (error, response, result) {
        console.log(result)
        console.log(error)
        console.log(response.statusCode)
        if (error == null && response.statusCode == 200) {
          //if (1) {
          if (result === "valid") {
            console.log("Valid pin of the day")
            req.session.pinOfTheDay = enteredPinOfTheDay
            req.session.error = "";
            callback();
          }
          else
          {
            console.log("Wrong pin of the day")
            req.session.error = "Wrong pin of the day"
            callback();
          }
        }
        else {
          console.log("No valid response from on our isValidPinOfTheDay request")
          req.session.error = "No valid response from on our isValidPinOfTheDay request"
          callback();
        }
      });
    }
    else
    {
      req.session.error = "No pin if the day provided"
      callback();
    }
  }
  else
  {
    console.log("No username or password provided")
    req.session.error = "No username or password provided"
    callback();
  }
};



exports.accessAllowedToEnterPinOfTheDay = function(req, res, callback) {
  if ( req.session.user != undefined && req.session.password != undefined)
  {
    var url = config.web.hydraHost + ":" + config.web.hydraPort + '/xoa/rest/api/1/isValidUser?username=' + req.session.user + '&password=' + req.session.password + '&type=technician&salt=' + req.session.salt
    request(url, function (error, response, result) {
      console.log(error)
      console.log(response.statusCode)
      if (error == null && response.statusCode == 200) {
        //if (1) {
        if (result === "valid") {
          req.session.error = ""
          callback();
        }
        else
        {
          console.log("Wrong username or password")
          req.session.error = "Wrong username or password"
          callback();
        }
      }
      else {
        console.log("No valid response from on our isValidUser request")
        req.session.error = "No valid response from on our isValidUser request"
        callback();
      }
    });
  }
  else
  {
    console.log("No username or password provided")
    req.session.error = "No username or password provided"
    callback();
  }
};


exports.accessAllowed = function(req, res, callback) {
  if ( req.session.user != undefined && req.session.password != undefined && req.session.pinOfTheDay != undefined )
  {
    var url = config.web.hydraHost + ":" + config.web.hydraPort + '/xoa/rest/api/1/isValidPinOfTheDay?username=' + req.session.user + '&password=' + req.session.password + '&pinOfTheDay=' + req.session.pinOfTheDay + '&salt=' + req.session.salt
    request(url, function (error, response, result) {
      if (error == null && response.statusCode == 200) {
        //if (1) {
        if (result === "valid") {
          console.log("Valid pin of the day")
          req.session.error = ""
          callback();
        }
        else
        {
          console.log("pin of the day is not valid")
          req.session.error = "pin of the day is not valid"
          callback();
        }
      }
      else {
        console.log("No valid response from on our isValidPinOfTheDay request")
        req.session.error = "No valid response from on our isValidPinOfTheDay request"
        callback();
      }
    });
  }
  else
  {
    console.log("No username, password and or pin of the day provided")
    req.session.error = "No username, password and or pin of the day provided"
    callback();
  }
};
