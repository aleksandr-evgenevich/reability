
// replace these values with those generated in your TokBox Account
var apiKey = "46270232";
var sessionId = "2_MX40NjI3MDIzMn5-MTU1MDM5NjE0MDU2N35yWmJjMGlWNFI4MXd2RmIrQitiSUFDZUZ-fg";
var token = "T1==cGFydG5lcl9pZD00NjI3MDIzMiZzaWc9ODk2ZTlmZTNkNmM2ZDQwNDE1Y2VlYjllYzIxM2ZlNDY4YzUyNjJiYzpzZXNzaW9uX2lkPTJfTVg0ME5qSTNNREl6TW41LU1UVTFNRE01TmpFME1EVTJOMzV5V21Kak1HbFdORkk0TVhkMlJtSXJRaXRpU1VGRFpVWi1mZyZjcmVhdGVfdGltZT0xNTUwMzk2MTY2Jm5vbmNlPTAuMzI4NTAzODgxODg2MjQxOCZyb2xlPXB1Ymxpc2hlciZleHBpcmVfdGltZT0xNTUwMzk5NzY1JmluaXRpYWxfbGF5b3V0X2NsYXNzX2xpc3Q9";

var updateChart = undefined;

// (optional) add server code here
var SERVER_BASE_URL = 'https://dry-badlands-43357.herokuapp.com/';
fetch(SERVER_BASE_URL + '/session').then(function (res) {
  return res.json()
}).then(function (res) {
  apiKey = res.apiKey;
  sessionId = res.sessionId;
  token = res.token;
  initializeSession();
}).catch(handleError);

// Handling all of our errors here by alerting them
function handleError(error) {
  if (error) {
    alert(error.message);
  }
}

// https://canvasjs.com/javascript-charts/dynamic-spline-chart/
function createChart() {
  var dps = [];
  var lvl = [];
  var chart = new CanvasJS.Chart("chart", {
    exportEnabled: false,
    axisY: {
      includeZero: true,
      interval: 10,
      minimum: -50,
      maximum: 1,
    },
    data: [
      {
        type: "spline",
        markerSize: 0,
        dataPoints: dps
      },
      {
        type: "spline",
        axisYType: "secondary",
        markerSize: 0,
        dataPoints: lvl
      },
    ],
    axisY1: {
      includeZero: false,
      // minimum: 0,
      // maximum: 1000,
    },

  });

  var xVal = 0;
  var dataLength = 225; // number of dataPoints visible at any point

  updateChart = function (data) {
    dps.push({
      x: xVal,
      y: data.logLevel
    });

    lvl.push({
      x: xVal,
      y: data.pitch
    });


    xVal++;
    if (dps.length > dataLength) {
      dps.shift();
      lvl.shift();
    }
    chart.render();
  }
}

function displayData(data) {
  document.getElementById('loudness').innerHTML = Math.floor(data.logLevel) + " dB";
  document.getElementById('audioLevel').innerHTML = Math.floor(data.audioLevel);
  document.getElementById('pitch').innerHTML = Math.floor(data.pitch) + " Hz";
  document.getElementById('note').innerHTML = data.note;
}

function initializeSession() {
  var session = OT.initSession(apiKey, sessionId);

  // Subscribe to a newly created stream
  session.on('streamCreated', function (event) {
    session.subscribe(event.stream, 'subscriber', {
      insertMode: 'append',
      width: '100%',
      height: '100%'
    }, handleError);
  });

  // Create a publisher
  var publisher = OT.initPublisher('publisher', {
    insertMode: 'append',
    width: '100%',
    height: '100%'
  }, handleError);

  publisher.on('streamCreated', function (event) {
    const mediaStream = publisher.getAudioSource();
    const pitchDetect = new PitchDetect(new MediaStream([mediaStream]));
    var movingAvg = null;
    var start = performance.now();

    publisher.on('audioLevelUpdated', function (event) {
      const end = performance.now()
      const elapsed = end - start;
      if (elapsed < 150) {
        return
      }
      start = end;

      if (movingAvg === null || movingAvg <= event.audioLevel) {
        movingAvg = event.audioLevel;
      } else {
        movingAvg = 0.7 * movingAvg + 0.3 * event.audioLevel;
      }

      let logLevel = 20 * (Math.log(movingAvg) / Math.LN10);
      let pitch = pitchDetect.getPitch();
      let data = {
        logLevel: logLevel,
        audioLevel: event.audioLevel * 100,
        pitch: pitch.pitch || 0,
        note: pitch.note || 0
      };

      session.signal(
        {
          data: JSON.stringify(data)
        },
        function (error) {
          if (error) {
            console.log("signal error (" + error.name + "): " + error.message);
          } else {
            console.log("signal sent.");
          }
        }
      );

      displayData(data);
      updateChart(data);
    });

  });



  // Connect to the session
  session.connect(token, function (error) {
    // If the connection is successful, publish to the session
    if (error) {
      handleError(error);
    } else {
      session.publish(publisher, handleError);
    }

    createChart();
  });

}


