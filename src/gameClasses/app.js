
// redirect android or iOS
var isMobile = {
      Android: function() {
          return navigator.userAgent.match(/Android/i);
      },
      BlackBerry: function() {
          return navigator.userAgent.match(/BlackBerry/i);
      },
      iOS: function() {
          return navigator.userAgent.match(/iPhone|iPad|iPod/i);
      },
      Opera: function() {
          return navigator.userAgent.match(/Opera Mini/i);
      },
      Windows: function() {
          return navigator.userAgent.match(/IEMobile/i);
      },
      any: function() {
          return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
      }

  };

if ( isMobile.Android() ) 
{
    window.location.replace('https://play.google.com/store/apps/details?id=com.jaeyunnoh.braainsio');
}
else if(isMobile.iOS())
{
    window.location.replace('https://itunes.apple.com/us/app/braains.io/id1177022124?mt=8');
}

function prerollComplete() {

  ige.client.adFinished.resolve();

  ige.client.adsDue = false;
  adIsPlaying = false;
}

function showAipPreroll() {
  if(typeof aipPlayer != "undefined") {
    adplayer = new aipPlayer({
      AD_WIDTH: 960,
      AD_HEIGHT: 540,
      AD_FULLSCREEN: false,
      PREROLL_ELEM: document.getElementById('preroll'),
      AIP_COMPLETE: function ()  {
        prerollComplete();
      } 
    });
    adIsPlaying = true;
    adplayer.startPreRoll(); /* show the preroll */
  } else {
    // failed to load the adslib ads are probably blocked
    prerollComplete();
  }
}

function showAipMidroll() {
  if(typeof aipPlayer != "undefined") {
    adplayer = new aipPlayer({
      AD_WIDTH: 960,
      AD_HEIGHT: 540,
      AD_FULLSCREEN: false,
      PREROLL_ELEM: document.getElementById('preroll'),
      AIP_COMPLETE: function ()  {
        prerollComplete();
      } 
    });
    adIsPlaying = true;

    

    adplayer.startMidRoll(); /* show the preroll */
  } else {
    // failed to load the adslib ads are probably blocked
    prerollComplete();
  }
}

function getScript (src, callback) {
  var scripts = document.getElementsByTagName('script');
  var script = document.createElement("script");
  var once = true;
  script.async = "async";
  script.type = "text/javascript";
  script.charset = "UTF-8";
  script.src = src;
  script.onload = script.onreadystatechange = function () {
    if (once && (!script.readyState || /loaded|complete/.test(script.readyState))) {
      once = false;
      script.onload = script.onreadystatechange = null;
    }
  };
  scripts[0].parentNode.insertBefore(script, scripts[0]);
}

pathArray = window.location.href.split( '/' );
host = pathArray[2];


// Once the document has been fully loaded, start the engine initiation process
$(document).ready(function() {

  // populateServerList();
  
  // getScript('//api.adinplay.com/player/v2/BRN/braains.io/player.min.js');


});