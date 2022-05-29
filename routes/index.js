var express = require('express');
var router = express.Router();
var request = require('request');
var parseString = require('xml2js').parseString;
var eyes = require('eyes');
var proxy = require('express-http-proxy');
var http = require('http');
var authentication = require('./server-authentication');
var config = require('../config');
var async = require('async');

var hydraHost = config.web.hydraHost
var hydraPort = config.web.hydraPort

var ethernetCardConfiguartionRequiresReboot = false;

/***********************************/
/************** GET ****************/
/***********************************/

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


/* GET hardwareconfig */
router.get('/hardwareconfig', authentication.accessAllowed, function(req, res, next) {
  if (req.session.error === "")
  {
    ethernetCardConfiguartionRequiresReboot = false;
    var networkDeviceinfo = {};
    var usbDeviceinfo = {};

    async.parallel([
        function(callback) { //This is the first task, and callback is its callback task
          //var deviceinfo = {};
          request(hydraHost + ":" + hydraPort + '/xoa/rest/api/1/networkdevices', function (error, response, xml) {
             if (!error && response.statusCode == 200) {
                parseString(xml, function (err, result) {
                   networkDeviceinfo = result;
                   eyes.inspect(networkDeviceinfo);
                   callback();
                });
             }
          });
        },
        function(callback) { //This is the second task, 
          //var deviceinfo = {};
          request(hydraHost + ":" + hydraPort + '/xoa/rest/api/1/usbdevices', function (error, response, xml) {
             if (!error && response.statusCode == 200) {
                parseString(xml, function (err, result) {
                   usbDeviceinfo = result;
                   eyes.inspect(usbDeviceinfo);
                   callback();
                });
             }
          });
        },
        function(callback) { //This is the second task, and callback is its callback task
          //var deviceinfo = {};
          request(hydraHost + ":" + hydraPort + '/xoa/rest/api/1/usbdevicemismatches', function (error, response, xml) {
             if (!error && response.statusCode == 200) {
                parseString(xml, function (err, result) {
                   usbDeviceMismatches = result;
                   eyes.inspect(usbDeviceMismatches);
                   callback();
                });
             }
          });
        },        
    ], function(err) { //This is the final callback
        if (usbDeviceinfo['DeviceInfo'] === '') 
        {
            usbDeviceinfoData = {}
            usbDeviceMismatchData = {}
        }
        else 
        {
            usbDeviceinfoData = usbDeviceinfo['DeviceInfo']['Devices']
            usbDeviceMismatchData = {}
        }
        
        
        if (networkDeviceinfo['DeviceInfo'] === '') 
        {
          networkDeviceinfoData = {}
        }
        else 
        {
          networkDeviceinfoData = networkDeviceinfo['DeviceInfo']['Devices']
        }
        
        
        if (usbDeviceMismatches['DeviceInfo'] === '') 
        {
          usbDeviceMismatchesData = {}
        }
        else 
        {
          usbDeviceMismatchesData = usbDeviceMismatches['DeviceInfo']['DeviceMismatches']
        }        
        
        res.render('hardwareconfig', { title: 'Heracles Xoa | Hardware Configuration', networkDeviceInformation: networkDeviceinfoData, usbDeviceInformation: usbDeviceinfoData, usbDeviceMismatchInformation: usbDeviceMismatchesData});
    });
  }
  else
  {
    res.redirect('/login');
  }
});

/* GET audiosettings */
router.get('/audiosettings', authentication.accessAllowed, function(req, res, next)
{
  if (req.session.error === "")
  {
    request(hydraHost + ":" + hydraPort + '/xoa/rest/api/1/audiosettings', function (error, response, xml)
    {
      if (!error && response.statusCode == 200)
      {
        parseString(xml, function (err, result)
        {
          audiosettings = result;
          eyes.inspect(audiosettings['AudioSettings'])

          var frontEnabled = false;
          var pcmEnabled = false;
          var masterEnabled = false;
          var headphoneEnabled = false;
          var speakerEnabled = false;

          var frontVolume = "0";
          var pcmVolume = "0";
          var masterVolume = "0";
          var headphoneVolume = "0";
          var speakerVolume = "0";

          if (audiosettings['AudioSettings'] != '') {
            for (i=0; i<audiosettings['AudioSettings']['Control'].length; i++) {

                var name = audiosettings['AudioSettings']['Control'][i]['$']['name']
                var volume = audiosettings['AudioSettings']['Control'][i]['Volume'][0]
                volume = volume.replace("%", "")

                if (name === "Front") {
                  frontEnabled = true
                  frontVolume = volume
                }
                if (name === "Pcm") {
                  pcmEnabled = true
                  pcmVolume = volume
                }
                if (name === "Master") {
                  masterEnabled = true
                  masterVolume = volume
                }
                if (name === "Headphone") {
                  headphoneEnabled = true
                  headphoneVolume = volume
                }
                if (name === "Speaker") {
                  speakerEnabled = true
                  speakerVolume = volume
                }
              }
            }

          res.render('audiosettings', { test: 'bob', title: 'Heracles Xoa | Audio Settings', frontEnabled: frontEnabled, frontVolume: frontVolume, pcmEnabled: pcmEnabled, pcmVolume: pcmVolume, masterEnabled: masterEnabled, masterVolume: masterVolume, headphoneEnabled: headphoneEnabled, headphoneVolume: headphoneVolume, speakerEnabled: speakerEnabled, speakerVolume: speakerVolume});
        });
      }
    });
  }
  else
  {
    res.redirect('/login');
  }
});

/* GET harddisk devices */
router.get('/formatHDD', authentication.accessAllowed, function(req, res, next)
{
  if (req.session.error === "")
  {
    request(hydraHost + ":" + hydraPort + '/xoa/rest/api/1/harddiskdrives', function (error, response, xml)
    {
      if (!error && response.statusCode == 200)
      {
        var diskinfo = {};

        parseString(xml, function (err, result)
        {
          diskinformation = result;
          eyes.inspect(diskinformation['DiskInformation']);

          if (diskinformation['DiskInformation'] != '') 
          {
            diskinfo = diskinformation['DiskInformation']['disk'];
          }
        });
        res.render('formatHDD', { title: 'Heracles Xoa | Disk formatting', diskList: diskinfo});
      };
    });
  }
  else
  {
    res.redirect('/login');
  }
});

/* GET resetconfiguration */
router.get('/resetconfiguration', authentication.accessAllowed, function(req, res, next) {
  if (req.session.error === "")
  {
    res.render('resetconfiguration', { test: 'bob', title: 'Heracles Xoa | Reset Configuration', hydraHost: hydraHost, hydraPort: hydraPort});
  }
  else
  {
    res.redirect('/login');
  }
});

/* GET login */
router.get('/login', function(req, res, next) {

  function randomString( length ) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for(var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  req.session.user = undefined
  req.session.password = undefined
  req.session.pinoftheday = undefined
  req.session.salt = randomString( 20 )
  res.cookie('ft2-salt', req.session.salt, { expires: 0, httpOnly: false });
  res.render('login')
});

/* GET logout */
router.get('/logout', function(req, res, next) {
  req.session.user = undefined
  req.session.password = undefined
  req.session.pinoftheday = undefined
  res.render('logout')
  req.session.destroy()
});

/* GET pinoftheday */
router.get('/pinoftheday', authentication.accessAllowedToEnterPinOfTheDay, function(req, res, next) {
  if (req.session.error === "")
  {
    res.render('pinoftheday')
  }
  else
  {
    res.redirect('/login');
  }
});


/***********************************/
/************** POST ***************/
/***********************************/


/* POST login */
router.post('/login', authentication.newUserAndPassword, function (req, res) {
  if (req.session.error === "")
  {
    res.redirect('/pinoftheday');
  }
  else
  {
    res.redirect('/login');
  }
});

/* POST pinoftheday */
router.post('/pinoftheday', authentication.newPinOfTheDay, function (req, res) {
  if (req.session.error === "")
  {
    res.redirect('/hardwareconfig');
  }
  else
  {
    if (req.session.error === "Wrong pin of the day")
    {
      res.redirect('/pinoftheday');
    }
    else
    {
      res.redirect('/login');
    }
  }
});

/* POST createdevicedataxml */
router.post('/createdevicedataxml', authentication.accessAllowed, function (req, res) {
  if (req.session.error === "")
  {
    if (ethernetCardConfiguartionRequiresReboot) {
      var url = config.web.hydraHost + ":" + config.web.hydraPort + '/xoa/rest/api/1/createdevicedataxml?reboot=true&disabledrivers=true'
    }
    else {
      var url = config.web.hydraHost + ":" + config.web.hydraPort + '/xoa/rest/api/1/createdevicedataxml?reboot=false&disabledrivers=false'
    }
    request(url, function (error, response, result) {});
  }

  res.redirect('/hardwareconfig');
});


function buildPutRequestXmlString(type, data) {

  var putRequestXmlString = '<?xml version="1.0" encoding="utf-8"?><DeviceInfo>'
  for (deviceKey in data) {
    var properties = data[deviceKey]

    if (data[deviceKey][0] === type) {
      putRequestXmlString = putRequestXmlString + '<Device'
      for ( var i=0; i<properties.length; i++)
      {
        if (properties[i].indexOf("=") != -1)
        {
          putRequestXmlString = putRequestXmlString + ' ' + properties[i]
        }
        else
        {
          var ttyU = properties[i];
          if (properties[i] === "MIO-1") {
            ttyU = "ttyU5"
          }
          else if (properties[i] === "MIO-1-part2")
          {
            ttyU = "ttyU6"
          }
          else if (properties[i] === "MIO-2")
          {
            ttyU = "ttyU7"
          }
          else if (properties[i] === "MIO-2-part2")
          {
            ttyU = "ttyU8"
          }   
                                
          putRequestXmlString = putRequestXmlString + ' DevName="' + ttyU + '"'
        }
      }
      putRequestXmlString = putRequestXmlString + ' />'
    }
  }
  putRequestXmlString = putRequestXmlString + "</DeviceInfo>"

  return putRequestXmlString;
}

function putHardwareconfig(type, dataXmlString) {

  var url = ""
  if (type === 'Type="Usb"') {
    url = "/xoa/rest/api/1/usbdevices"
  }
  else if (type === 'Type="Net"') {
    url = "/xoa/rest/api/1/networkdevices"
  }

  var putRequest = {
    host: "localhost",
      path: url,
      port: 8888,
      method: "PUT",
      headers: {
          'Cookie': "cookie",
          'Content-Type': 'text/xml',
          'Content-Length': Buffer.byteLength(dataXmlString)
      }
  };

  var buffer = "";

  var req = http.request( putRequest, function( res )    {

     var buffer = "";
     res.on( "data", function( data ) { buffer = buffer + data; } );
     res.on( "end", function( data ) { console.log( buffer ); } );

  });

  req.on('error', function(e) {
      console.log('problem with request: ' + e.message);
  });

  req.write( dataXmlString );
  req.end();
}

/* POST hardwareconfig */
router.post('/hardwareconfig', authentication.accessAllowed, function (req, res) {
  if (req.session.error === "")
  {

    if (req.body["ethernetCardsConfigured"] == "true") {
      ethernetCardConfiguartionRequiresReboot = true;
      var dataXmlString = buildPutRequestXmlString('Type="Net"', req.body);
      putHardwareconfig('Type="Net"', dataXmlString);
    }

    var dataXmlString = buildPutRequestXmlString('Type="Usb"', req.body);
    putHardwareconfig('Type="Usb"', dataXmlString);
  }
  else
  {
    res.redirect('/login');
  }
});


/* POST audiosettings */
router.post('/audiosettings', authentication.accessAllowed, function (req, res) {
  if (req.session.error === "")
  {
    var data = req.body

    eyes.inspect(data)

    request.put(hydraHost + ":" + hydraPort + '/xoa/rest/api/1/audiosettings').form({ front: data['front'], pcm: data['pcm'], master: data['master'], headphone: data['headphone'], speaker: data['speaker'] })
  }
  else
  {
    res.redirect('/login');
  }
});

/* POST formatting HD */
router.post('/formatHDD', authentication.accessAllowed, function (req, res) {
  if (req.session.error === "")
  {
    var data = req.body

    eyes.inspect(data)

    request.put(hydraHost + ":" + hydraPort + '/xoa/rest/api/1/harddiskdrives').form({formatCommand: data['launch']})
  }
  else
  {
    res.redirect('/login');
  }
});

/* POST deleteallcustomudevrules */
router.post('/deleteallcustomudevrules', authentication.accessAllowed, function (req, res) {
  if (req.session.error === "")
  {
    request.put(hydraHost + ":" + hydraPort + '/xoa/rest/api/1/deleteallcustomudevrules');
  }
  else
  {
    res.redirect('/login');
  }
});

/******************************************************************/
/*************************** PROXY ********************************/
/******************************************************************/

router.get('/xoa/*', proxy(hydraHost + ":" + hydraPort, {
    forwardPath: function(req, res) {
    return require('url').parse(req.url).path;
  }
}));

router.get('/*.php', proxy("http://localhost:80", {
    forwardPath: function(req, res) {
    return require('url').parse(req.url).path;
  }
}));

router.get('/ADPROXOClient.exe', proxy("http://localhost:80", {
    forwardPath: function(req, res) {
    return require('url').parse(req.url).path;
  }
}));

router.get('/*.trc', proxy("http://localhost:80", {
    forwardPath: function(req, res) {
    return require('url').parse(req.url).path;
  }
}));

module.exports = router;
