var lastImage;
var lastTopColor = [0, 0, 0]
var currImage;
var canvas;
var ctx;
var jpg;
var THRESHOLD = 15;

var getUserMedia = function(t, onsuccess, onerror) {
  if (navigator.getUserMedia) {
    return navigator.getUserMedia(t, onsuccess, onerror);
  } else if (navigator.webkitGetUserMedia) {
    return navigator.webkitGetUserMedia(t, onsuccess, onerror);
  } else if (navigator.mozGetUserMedia) {
    return navigator.mozGetUserMedia(t, onsuccess, onerror);
  } else if (navigator.msGetUserMedia) {
    return navigator.msGetUserMedia(t, onsuccess, onerror);
  } else {
    onerror(new Error("No getUserMedia implementation found."));
  }
};

var URL = window.URL || window.webkitURL;
var createObjectURL = URL.createObjectURL || webkitURL.createObjectURL;
if (!createObjectURL) {
  throw new Error("URL.createObjectURL not found.");
}

var envSource;
MediaStreamTrack.getSources(function(sourceInfos) {
envSource = sourceInfos.filter(function(sourceInfo) {
    return sourceInfo.kind == "video"
        && sourceInfo.facing == "environment";
  }).reduce(function(a, source) {
    return source;
  }, null);

var constraints = {
      audio: false,
      video: {
        optional: [
            { maxFrameRate: 6 },
            { souceId: envSource ? envSource.id : null }
        ]
      }
   }

getUserMedia(constraints,
  function(stream) {
    var url = createObjectURL(stream);
    video.src = url;
    canvas = document.createElement('canvas');
    ctx = canvas.getContext('2d');
    video.addEventListener('timeupdate', processFrame);
    video.addEventListener('click', identifyView);
  },
  function(error) {
    alert("Couldn't access webcam.");
  }
);

});

var difference = function(c1, c2) {
    return Math.sqrt(Math.pow(c1[0]-c2[0], 2) + Math.pow(c1[1]-c2[1], 2) + Math.pow(c1[2]-c2[2], 2))
}

var processFrame = function() {
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;

//    if(lastImage == null) {
//        ctx.drawImage(video, 0, 0);
//        lastImage = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
//    } else {

    ctx.drawImage(video, 0, 0);
    currImage = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    var curTopColor = [0,0,0]
    count = 0;
    for(var i = 0; i < currImage.length / 2; i += 4*6) {
        curTopColor[0] = curTopColor[0] + currImage[i];
        curTopColor[1] = curTopColor[1] + currImage[i+1];
        curTopColor[2] = curTopColor[2] + currImage[i+2];
        count++;
    }
    curTopColor[0] = ~~ (curTopColor[0] / count);
    curTopColor[1] = ~~ (curTopColor[1] / count);
    curTopColor[2] = ~~ (curTopColor[2] / count);

    console.log(difference(curTopColor, lastTopColor));

    if(difference(curTopColor, lastTopColor) > THRESHOLD) {
        document.getElementById('beep').currentTime = 0;
        document.getElementById('beep').play();
        console.log("BIGDIFF");
        lastTopColor = curTopColor;
    }
};

var processViewID = function(data) {
    console.log(data);
}

var identifyView = function() {
    document.getElementById('beep').load();
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    $.ajax({
        url: "http://gateway-a.watsonplatform.net/calls/image/ImageGetRankedImageKeywords",
        jsonp: "callback",
        dataType: "jsonp",
        data: {
            apikey: "8fa2a912f8aac33cdb33258ea15de3c793b3f377",
            image: canvas.toDataURL(),
            imagePostMode: "raw",
            outputMode: "json",
        },
        success: processViewID
    });
} 