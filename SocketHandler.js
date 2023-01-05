server = require("./server")
const WebSocketServer = require('websocket').server;
const wsServer = new WebSocketServer({  //웹소켓 서버 생성
    httpServer: server.server,
    autoAcceptConnections: false
});
var users = [];
var menuInfo = [];
var roomStatus = [];
var socketid=0
wsServer.on('request', function(request) {
    let newconnection = request.accept();
    socketid++;
    newconnection.userid = socketid;
    users.push(newconnection);
    console.log((new Date()) + ' Connection accepted.');
    newconnection.on('message', function(message) {
        if (message.type === 'utf8') {
            SocketHandler.OnMessage(this,message.utf8Data)
        }
    });
    newconnection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + this.remoteAddress + ' disconnected. id:'+this.userid +" total:"+ users.length);
        users = users.filter((u) => u.userid != this.userid); 
        console.log("after:",users.length)
    });
});
var SocketHandler={}
SocketHandler.router = server.router
SocketHandler.OnMessage=function(session,message){
    console.log("message:",message)
    // console.log("protocol:",message[1])
    let obj = JSON.parse(message)
    console.log("obj:",obj)
    if(obj.protocol == "toFront"){ sendAll(obj); } // 채팅
    else if(obj.protocol == 'chat'){ sendTo(obj) }// 
    else if(obj.protocol == 'autoLogin'){ setLogin(session , obj);}// 
    else if(obj.protocol == 'toFrontOrder'){ sendOrder(obj);}// 
    else if(obj.protocol == 'useRoom'){ sendRoomInfo(obj);}// 
    else if(obj.protocol == 'roomEndwait'){ sendRoomEndwait(obj);}
    else if(obj.protocol == 'roomEndcustomer'){ sendRoomEndcus(obj);}
    else if(obj.protocol == 'useRoom_reser'){ sendRoomInfo_reser(obj);}
    else if(obj.protocol == 'customertime'){ CustomerTime(obj);}
    else if(obj.protocol == 'addtimecheck'){ sendaddcheck(obj);}
    else if(obj.protocol == 'staffcall'){ sendstaffcall(obj);}
    else if(obj.protocol == 'exit_5'){ sendexit5(obj);}
    else if(obj.protocol == 'exit_end'){ sendexitend(obj);}
    else if(obj.protocol == 'resercancel_front'){ sendcancelalarm(obj);}
}
function setLogin(session , sobj){
    console.log('setLogin .... ~ ' + sobj);
    console.log("roomnum:",sobj.roomNum)
    for(i in users){
        if(session.userid == users[i].userid){            
            users[i].roomNum = sobj.roomNum;
        }        
    }
}
function sendTo(sobj){
    let obj = new Object();
    obj.protocol = "answer";
    obj.chat = sobj.chat;
    obj.time =sobj.time;
    console.log("obj",obj)
    for(i in users){
        if(users[i].roomNum == sobj.roomNum){
             users[i].sendUTF(JSON.stringify(obj))
         }
    }
}
function sendAll(msg){    
    let obj = new Object();
    obj.protocol = "chat";
    obj.chat = msg.chat;
    obj.roomNum = msg.roomNum;
    obj.time =msg.time;
    console.log("obj",obj)
    for(i in users){
        users[i].sendUTF(JSON.stringify(obj));
    }
}
function sendOrder(sobj){    
    let obj = new Object();
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@")
    console.log("sobj",sobj)
    obj.protocol = "order"
    obj.roomNum = sobj.roomNum;
    //obj.menu = sobj.ordermenu;
    let menu = sobj.ordermenu;
    menuInfo.push(menu);
    //console.log(menuInfo.length-1);
    obj.menuNum = menuInfo.length-1;
    console.log("menuInfo:",menuInfo);
    console.log("menunum:",obj.menuNum,"번째")
    for(i in users){
        users[i].sendUTF(JSON.stringify(obj));
    }
}
function sendRoomInfo(sobj){    
    console.log("message received. >>>>>>>>>>>>>>>>>>>>>>>>>>")
    let obj = new Object();
    console.log("sobj",sobj)
    obj.protocol = "roomStatus"
    obj.ridx = sobj.ridx;
    obj.roomNm = sobj.roomNm;
    obj.price = sobj.price
    let room = sobj.orderRoom;
    roomStatus.push(room);
    for(i in users){
        users[i].sendUTF(JSON.stringify(obj));
    }
}
function sendRoomInfo_reser(sobj){    
    console.log("message received. >>>>>>>>>>>>>>>>>>>>>>>>>>")
    let obj = new Object();
    console.log("sobj",sobj)
    obj.protocol = "roomStatus_reser"
    obj.ridx = sobj.idx;
    obj.roomNm = sobj.roomNm;
    obj.price = sobj.price;
    for(i in users){
        users[i].sendUTF(JSON.stringify(obj));
    }
}
function sendRoomEndwait(sobj){
    let obj = new Object();
    console.log("sobj",sobj)
    obj.protocol = "roomendwait"
    obj.idx = sobj.idx;
    obj.roomNm =sobj.roomNm;
    for(i in users){
        users[i].sendUTF(JSON.stringify(obj));
    }
}
function sendRoomEndcus(sobj){
    let obj = new Object();
    console.log("sobj",sobj)
    obj.protocol = "roomendcus"
    obj.idx = sobj.idx;
    obj.roomNm =sobj.roomNm;
    for(i in users){
        if(users[i].roomNum == sobj.roomNm){
             users[i].sendUTF(JSON.stringify(obj))
         }
    }
}
function CustomerTime(sobj){
    let obj = new Object();
    console.log("sobj",sobj)
    obj.protocol = "timealarm"
    obj.idx = sobj.idx;
    obj.roomNm = sobj.roomNm
    console.log("obj,",obj)
    for(i in users){
        if(users[i].roomNum == sobj.roomNm){
             users[i].sendUTF(JSON.stringify(obj))
         }
    }
}
function sendaddcheck(sobj){
    let obj = new Object();
    obj.protocol = "checkadd"
    obj.roomNm = sobj.roomNm
    obj.time = sobj.time
    for(i in users){
        users[i].sendUTF(JSON.stringify(obj));
    }
}
function sendstaffcall(sobj){
    let obj = new Object();
    obj.protocol = "frontstaffcall"
    obj.roomNm = sobj.roomNm
    obj.idx = sobj.idx
    for(i in users){
        users[i].sendUTF(JSON.stringify(obj));
    }
}
function sendexit5(sobj){
    let obj = new Object();
    obj.protocol = 'frontexit5';
    obj.roomNm = sobj.roomNm;
    obj.idx = sobj.idx;
    for(i in users){
        users[i].sendUTF(JSON.stringify(obj));
    }
}
function sendexitend(sobj){
    let obj = new Object();
    obj.protocol = 'frontexitend';
    obj.roomNm = sobj.roomNm;
    obj.idx = sobj.idx;
    for(i in users){
        users[i].sendUTF(JSON.stringify(obj));
    }
}
function sendcancelalarm(){
    let obj = new Object();
    obj.protocol = "cancelalarm"
    for(i in users){
        users[i].sendUTF(JSON.stringify(obj));
    }
}


server.router.get("/getOrderDetail", async function (req, res) {
    return res.json({'menulist' : menuInfo[req.query.menunum]});
  })
  server.router.get("/getRoomStatus", async function (req, res) {
    return res.json({'roomstatus':roomStatus[req.query.what]});
  })
function stepThread(){
    setTimeout(stepThread,10)
}
function dateTimeOfficialFormat(sdate) {//input란에 ISO 시간대로 입력하기 위한 포맷
    let date = new Date(sdate);
    let hour = date.getHours();
    let minute = date.getMinutes();
  
    hour = hour >= 10 ? hour : '0' + hour;
    minute = minute >= 10 ? minute : '0' + minute;
  
    return hour + ':' + minute ;
  }
setTimeout(stepThread,10)

module.exports = SocketHandler;