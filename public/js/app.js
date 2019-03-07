


// replace these values with those generated in your TokBox Account
var apiKey = "46270232";
var sessionId = "2_MX40NjI3MDIzMn5-MTU1MDM5NjE0MDU2N35yWmJjMGlWNFI4MXd2RmIrQitiSUFDZUZ-fg";
var token = "T1==cGFydG5lcl9pZD00NjI3MDIzMiZzaWc9ODk2ZTlmZTNkNmM2ZDQwNDE1Y2VlYjllYzIxM2ZlNDY4YzUyNjJiYzpzZXNzaW9uX2lkPTJfTVg0ME5qSTNNREl6TW41LU1UVTFNRE01TmpFME1EVTJOMzV5V21Kak1HbFdORkk0TVhkMlJtSXJRaXRpU1VGRFpVWi1mZyZjcmVhdGVfdGltZT0xNTUwMzk2MTY2Jm5vbmNlPTAuMzI4NTAzODgxODg2MjQxOCZyb2xlPXB1Ymxpc2hlciZleHBpcmVfdGltZT0xNTUwMzk5NzY1JmluaXRpYWxfbGF5b3V0X2NsYXNzX2xpc3Q9";


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

function initializeSession() {
  var session = OT.initSession(apiKey, sessionId);

  // Subscribe to a newly created stream
  session.on('streamCreated', function (event) {
    var subscriber = session.subscribe(event.stream, 'subscriber', {
      insertMode: 'append',
      width: '100%',
      height: '100%'
    }, handleError);

    var movingAvg = null;
    subscriber.on('audioLevelUpdated', function (event) {
      if (movingAvg === null || movingAvg <= event.audioLevel) {
        movingAvg = event.audioLevel;
      } else {
        movingAvg = 0.7 * movingAvg + 0.3 * event.audioLevel;
      }

      // 1.5 scaling to map the -30 - 0 dBm range to [0,1]
      // var logLevel = (Math.log(movingAvg) / Math.LN10) / 1.5 + 1;
      var logLevel = 20 * (Math.log(movingAvg) / Math.LN10);
      // logLevel = Math.min(Math.max(logLevel, 0), 1);
      // var logLevel = (Math.log(movingAvg) / Math.LN10);
      // logLevel = Math.floor(logLevel * 100)
      // document.getElementById('subscriberMeter').value = Math.floor(logLevel);

      // document.getElementById('subscriberMeter').innerHTML = Math.floor(logLevel);

      // document.getElementById('subscriberMeter').innerHTML = logLevel;
      
    });
  });

  // Create a publisher
  var publisher = OT.initPublisher('publisher', {
    insertMode: 'append',
    width: '100%',
    height: '100%'
  }, handleError);

  publisher.on('streamCreated', function (event) {
    let mediaStream = publisher.getAudioSource();
    pitchDetect = new PitchDetect(new MediaStream([mediaStream]));

    var movingAvg = null;
    publisher.on('audioLevelUpdated', function (event) {
      if (movingAvg === null || movingAvg <= event.audioLevel) {
        movingAvg = event.audioLevel;
      } else {
        movingAvg = 0.7 * movingAvg + 0.3 * event.audioLevel;
      }

      // 1.5 scaling to map the -30 - 0 dBm range to [0,1]
      // var logLevel = (Math.log(movingAvg) / Math.LN10) / 1.5 + 1;
      var logLevel = 20 * (Math.log(movingAvg) / Math.LN10);
      // logLevel = Math.min(Math.max(logLevel, 0), 1);
      // document.getElementById('publisherMeter').value = Math.floor(logLevel);

      // Pitch
      var pitch = pitchDetect.getPitch();
      pitch.logLevel = logLevel;

      session.signal(
        {
          data: JSON.stringify(pitch)
        },
        function (error) {
          if (error) {
            console.log("signal error ("
              + error.name
              + "): " + error.message);
          } else {
            console.log("signal sent.");
          }
        }
      );

      // if (pitch.type) {
      //   document.getElementById('pitchType').value = pitch.type;
      // };
      // if (pitch.pitch) {
      //   document.getElementById('pitchPitch').value = Math.floor(pitch.pitch);
      // };
      // if (pitch.noteNumber) {
      //   document.getElementById('pitchNoteNumber').value = pitch.noteNumber;
      // };
      // if (pitch.note) {
      //   document.getElementById('pitchNote').value = pitch.note;
      // };
      // if (pitch.detune) {
      //   document.getElementById('pitchDetune').value = pitch.detune;
      // };
      // if (pitch.flat) {
      //   document.getElementById('pitchFlat').value = pitch.flat;
      // };
      // if (pitch.sharp) {
      //   document.getElementById('pitchSharp').value = pitch.sharp;
      // };
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
  });

  session.on("signal", function (event) {
    var me = session.connection.connectionId;
    var from = event.from.connectionId;
    if (from !== me) {
      // Signal received from client
      console.log("Signal sent from connection " + event.from.id);
      // Process the event.data property, if there is any data.
      pitch = JSON.parse(event.data);
      // if (pitch.type) {
      //   document.getElementById('subscriberPitchType').value = pitch.type;
      // };
      if (pitch.logLevel) {
        document.getElementById('subscriberMeter').innerHTML = Math.floor(pitch.logLevel);
      }

      if (pitch.pitch) {
        document.getElementById('subscriberPitchPitch').innerHTML = Math.floor(pitch.pitch);
      };
      // if (pitch.noteNumber) {
      //   document.getElementById('subscriberPitchNoteNumber').value = pitch.noteNumber;
      // };
      if (pitch.note) {
        document.getElementById('subscriberPitchNote').innerHTML = pitch.note;
      };
      // if (pitch.detune) {
      //   document.getElementById('subscriberPitchDetune').value = pitch.detune;
      // };
      // if (pitch.flat) {
      //   document.getElementById('subscriberPitchFlat').value = pitch.flat;
      // };
      // if (pitch.sharp) {
      //   document.getElementById('subscriberPitchSharp').value = pitch.sharp;
      // };
    };
  });
}
