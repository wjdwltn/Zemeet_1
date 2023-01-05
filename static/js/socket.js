var wsUri = "ws://"+window.location.host+"/"; //주소 확인!!
function socketInit() {            
  websocket = new WebSocket(wsUri);
  websocket.onopen = function(evt) {
      onOpen(evt);
  };
  websocket.onmessage = function(evt) {
      onMessage(evt);
  };
  websocket.onerror = function(evt) {
      onError(evt);
  };
}
function onOpen(evt) {            
  console.log("onOpen!");  
}
function onError(evt) {
  writeToScreen('ERROR: ' + evt.data);
}

function doSend(message) {
  websocket.send(message)
}           

socketInit();