
// replace these values with those generated in your TokBox Account
var apiKey = "46270232";
var sessionId = "2_MX40NjI3MDIzMn5-MTU1MDM5NjE0MDU2N35yWmJjMGlWNFI4MXd2RmIrQitiSUFDZUZ-fg";
var token = "T1==cGFydG5lcl9pZD00NjI3MDIzMiZzaWc9ODk2ZTlmZTNkNmM2ZDQwNDE1Y2VlYjllYzIxM2ZlNDY4YzUyNjJiYzpzZXNzaW9uX2lkPTJfTVg0ME5qSTNNREl6TW41LU1UVTFNRE01TmpFME1EVTJOMzV5V21Kak1HbFdORkk0TVhkMlJtSXJRaXRpU1VGRFpVWi1mZyZjcmVhdGVfdGltZT0xNTUwMzk2MTY2Jm5vbmNlPTAuMzI4NTAzODgxODg2MjQxOCZyb2xlPXB1Ymxpc2hlciZleHBpcmVfdGltZT0xNTUwMzk5NzY1JmluaXRpYWxfbGF5b3V0X2NsYXNzX2xpc3Q9";


var watch = false;
var avrg = {};

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

function buttonClick() {
  if (watch == true) {
    watch = false;

    data = {
      logLevel: (avrg.loudness / avrg.n) * 100,
      pitch: (avrg.pitch / avrg.n) * 100,
    };
    displayData(data);
  }
  else {
    avrg = {
      loudness: 0,
      pitch: 0,
      n: 1
    };
    watch = true;
  }

  let button = document.getElementById("btnWatch");
  if (watch == true) {
    button.value = "Stop";
  }
  else {
    button.value = "Start";
  }
}

function displayData(data) {
  if (data.logLevel) {
    document.getElementById('loudness').innerHTML = Math.floor(data.logLevel) + " dB";
  }
  if (data.audioLevel) {
    document.getElementById('audioLevel').innerHTML = Math.floor(data.audioLevel);
  }
  if (data.pitch) {
    document.getElementById('pitch').innerHTML = Math.floor(data.pitch) + " Hz";
  };
  if (data.note) {
    document.getElementById('note').innerHTML = data.note;
  };
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
  });

  // Create a publisher
  var publisher = OT.initPublisher('publisher', {
    insertMode: 'append',
    width: '100%',
    height: '100%'
  }, handleError);

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
    if (watch === false) {
      return;
    }

    var me = session.connection.connectionId;
    var from = event.from.connectionId;
    // if (from !== me) {
    if (true) {      
      // Signal received from client
      console.log("Signal sent from connection " + event.from.id);

      // Process the event.data property, if there is any data.
      pitch = JSON.parse(event.data);
      data = {
        logLevel: pitch.logLevel,
        audioLevel: pitch.audioLevel,
        pitch: pitch.pitch,
        note: pitch.note
      };
      displayData(data);

      if (data.logLevel !== undefined & data.pitch !== undefined) {

        avrg.loudness += Math.abs(data.logLevel) / 100;
        avrg.pitch += Math.abs(data.pitch) /100;
        avrg.n += 1;
      }

    };
  });
}
