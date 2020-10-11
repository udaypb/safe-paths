var express = require('express');
var router = express.Router();
var https = require('https');
var polyline = require('google-polyline');
var fs = require('fs');
var async = require('async');
var mysql = require('mysql');
var path = require('path')

var spawn = require('child_process').spawn;

var connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '2621996!Upb',
  database: 'safepaths'
});

connection.connect(function (err) {
  if (err) {
    console.log(err);
    return
  }
  console.log('success connecting to sql');


});
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

var googlAPIKEY = 'AIzaSyBp5F5WYNq-5STvE_BwXAmChssKeLAo_yo';

router.post('/login', function (req, res, next) {
  console.log('login attempted');

  if (req.body.username) {
    req.session.username = req.body.username;
  }
  res.status(200);
  res.json({ 'error': null });
});
//get source and destination lat long objects, and do a google api call


router.post('/getDummy', function (req, res, n) {
  let data = JSON.parse(req.body);
  let toSend = {}



})
router.post('/paths', function (req, res, next) {
  // if (!req.session.username) {
  //   res.status(500)
  //   res.json({ 'error': 'user session not available' });
  //   return;
  // }
  let data = req.body;
  let origin = data.origin;
  let destination = data.destination;
  console.log(data);
  //reverse geocode origin:
  https.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${origin}&key=${googlAPIKEY}`, (response) => {
    //reverse geocode destination:
    let data = '';
    console.log(' geocode ', response);
    response.on('data', (chunk) => {
      data += chunk;
    });

    response.on('end', () => {
      data = JSON.parse(data);
      console.log(data)
      let source = data['results'][0]['geometry']['location'];

      https.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${destination}&key=${googlAPIKEY}`, (response2) => {
        let data2 = '';
        response2.on('data', (chunk) => {
          data2 += chunk;
        });

        response2.on('end', () => {
          data2 = JSON.parse(data2);
          let destination = data2['results'][0]['geometry']['location'];
          console.log('destination ', destination);
          console.log('source ', source);



          //main work .........
          //===============================++==========================================
          https.get(`https://maps.googleapis.com/maps/api/directions/json?origin=${source.lat},${destination.lng}&destination=${destination.lat},${destination.lng}&key=${googlAPIKEY}&alternatives=true`, (response) => {
            let data = '';
            response.on('data', (chunk) => {
              data += chunk;

            });

            response.on('end', () => {
              console.log(data)
              // console.log(data.status);
              data = JSON.parse(data);
              console.log(data.routes);
              let collectionOfRoutes = [];
              let polylines = [];
              let polylinesToSend = {};
              data.routes.map(function (r, index) {

                let overviewPoly = r['overview_polyline'] ? r['overview_polyline'] : 0;
                polylines.push(r['overview_polyline']);
                let distance = r["legs"][0]["distance"]["text"];
                polylinesToSend[index] = { 'polyline': r['overview_polyline'], 'safeScore': 1, 'distance': distance };

                // console.log('overview for ',i)
                // console.log('overview for ',overviewPoly);
                let decoded = polyline.decode(overviewPoly.points);
                // console.log('decoded polyline for ',i);
                // console.log(decoded);
                let obj = {}
                obj[index] = decoded
                collectionOfRoutes.push(obj);
              });

              if (collectionOfRoutes.length == 0) {
                res.status(200).json({
                  'err': 'No routes found between the source and the destination'
                });
                return;
              }
              console.log(collectionOfRoutes);
              let toSend = {};

              Object.keys(collectionOfRoutes[0]).map(function (k) {
                let arr = collectionOfRoutes[0][k];
                console.log(arr);
                toSend[k] = [];
                console.log('array length for the route ',arr.length);
                async.eachLimit(arr, 10, function (a, callback) {
                  let lat = a[0];
                  let lng = a[1];
                  // console.log('lat and lng are', lat, lng);
                  connection.query(`select a.fbi_code from (select * ,row_number() over(order by distance) as rn from ( 
                select * ,111.111 *
                  DEGREES(ACOS(LEAST(1.0, COS(RADIANS(crimes.Latitude))
                        * COS(RADIANS(?))
                        * COS(RADIANS(crimes.Longitude - (?)))
                        + SIN(RADIANS(crimes.Latitude))
                        * SIN(RADIANS(?))))) AS distance 
                        from crimes order by distance
                        )dist where dist.distance < 2 )a where mod(rn,10)=1;`, [lat, lng, lat], function (err, rows, f) {
                      if (err) {
                        console.log(err);
                        callback(err);
                        return;
                      }
                      // console.log(rows);
                      rows.forEach(function (r) {
                        // console.log(r.fbi_code);
                        if (r.fbi_code.length == 2 && r.fbi_code.charAt(0) == '0') {
                          r.fbi_code = r.fbi_code.charAt(1)
                        }
                        toSend[k].push(r.fbi_code);
                      });
                      callback();
                    });
                }, function (err) {
                  if (err) {
                    console.log('async error', err);
                    return;
                  }
                  console.log('to send is ', toSend);
                  // res.send(toSend);

                  var process = spawn('python3', [path.join(__dirname, '..', 'cluster.py'), JSON.stringify(toSend)]);
                  console.log('process called');
                  var tostr = function (d) {
                    return String.fromCharCode.apply(null, d);
                  }
                  process.stdout.on('data', function (d) {
                    // console.log('data from process',tostr(d));
                    let result = tostr(d);
                    console.log('routes safety object', result);
                    result=JSON.parse(result);
                    result.map(function (k, i) {
                      if (polylinesToSend[i]) {
                        console.log('safety score will be ',k)
                        polylinesToSend[i]['safeScore'] =k;
                      }
                    });
                    res.status(200);
                    res.json({ 'polyline': JSON.stringify(polylinesToSend), 'err': null });
                    return;
                  });
                  process.stderr.on('d', function (d) {
                    console.log(d)
                  })

                  process.on('exit', function (d, s) {
                    console.log('process exit :', d)
                  });
                });
              });
            });
          });
        });
      });
    });
  });




});

module.exports = router;
