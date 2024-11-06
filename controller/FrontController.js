sv = require("../server")
sampleDAO = require("../dbutil")
const { json, contentType } = require("express/lib/response");
const fs = require("fs");
const multer = require("multer");
const multiparty = require("multiparty");
const qs = require('querystring'); //json data parse 
sampleDAO.init()

var MainController={}

//================================(대기방 - 메인)
sv.router.get("/front/main", async function (req, res) {
  let rows = await sampleDAO.listRoomWaitroom();
  let todo = await sampleDAO.listTodo2()
  res.render('front/front',  
  {rows:rows, list:JSON.stringify(rows),todo:todo});
});
sv.router.get("/front/macroopen", async function (req, res) {
  let macro = await sampleDAO.listchatmacro();
  return res.json({'result' : 'success', 'macro':macro});
});
sv.router.get("/front/getRoom", async function (req, res) {
  let info = await sampleDAO.listRoom5();
  // let log = sampleDAO.timecalculate(req.query.idx);

  if(info.length == 0){
    return res.json({'result' : 'fail'});
  }else{
     return res.json({'result' : 'success', 'msg':info});
  }
});
sv.router.get("/timeCalculate", async function (req, res) {
  let log = await sampleDAO.timecalculate(req.query.idx);
  if(log.length == 0){
    return res.json({'result' : 'fail'});
  }else{
     return res.json({'result' : 'success','log':log});
  }
});
sv.router.get("/front/reservationCancelProcess", async function (req,res){
  let idx = req.query.idx;
  console.log("idx",idx)
  let room_idx= await sampleDAO.listRoom_roomreser(idx)
  await sampleDAO.cancelReservation(idx)
  await sampleDAO.UpdateStatus_0_front(idx)
  console.log("room_idx",room_idx)
  return res.json({'result' : 'success' , 'room_idx':room_idx});  
  });

sv.router.get("/front/reservationInfo", async function (req, res) {
  let today = await sampleDAO.listReservation_Api();
  return res.json({'result' : 'success', 'today':today});    
  });
sv.router.get("/orderdetail_front", async function (req, res) {
  console.log("!!!!!")
  let rows = await sampleDAO.listRoom1(req.query.idx);
  let ridx = rows[0].roomNm
  let list = await sampleDAO.orderdetail_front(req.query.idx);
  let room = await sampleDAO.orderroom_front(req.query.idx);
  console.log("list:",list)
  return res.json({'result' : 'success','msg':rows[0],'list':list ,'room':room });
});
sv.router.get("/ordersell", async function (req, res) {
  console.log("way:",req.query.way)
  sampleDAO.ordercalculate(req.query.idx, req.query.way,req.query.nextsell);

  return res.json({'result' : 'success','msg':'결제가 완료되었습니다' });
});
sv.router.get("/getTime", async function (req, res) {
  console.log("idxm",req.query.idx)
  let info = await sampleDAO.timecalculate(req.query.idx);
  var sdate = dateTimeOfficialFormat(info[0].stime)
  console.log("sdate",sdate)
  let edate= dateTimeOfficialFormat(info[0].stime,info[0].duration)
  console.log("sdate",sdate,"edate",edate)
  return res.json({'result' : 'success','msg':'결제가 완료되었습니다', 'info':info[0] , 'sdate':sdate ,'edate':edate });
});
sv.router.get("/RoomList", async function (req, res) {

  let info = await sampleDAO.listRoom();
  for(let i=0; i<info.length; i++){
    let reservation = await sampleDAO.listReservationRoomList_kiosk(info[i].idx)
    if(reservation[0].count != 0){
      reser=1;
      console.log("----------------예약--------------")
      await sampleDAO.UpdateStatus_2(info[i].idx)
    }
    let check = await sampleDAO.listReservationcancel_kiosk(info[i].idx);
    if(check.length !=0){
      cancel=1;
      console.log("-------------예약 취소-------------")
      await sampleDAO.UpdateStatus_0(info[i].idx)
      await sampleDAO.Updatereservation_0(check[0].idx)
    }

  }
  return res.json({'result' : 'success', 'msg':info[0]});
 
});

sv.router.get("/front/todopop", async function (req, res) {
  console.log("todopopppp")
  let todo = await sampleDAO.listTodo2()
  console.log("todo",todo,todo.length)
  return res.json({'result' : 'success','todo':todo});
});
sv.router.get("/front/todoshow", async function (req, res) {
  let todo = await sampleDAO.listTodolog()
  console.log("todo",todo,todo.length)
  return res.json({'result' : 'success','todo':todo});
});
sv.router.post("/front/todocomplete", async function (req,res){
  req.on('data' , async function(data){    
    let jsonData = qs.parse(data.toString());
    console.log("data",jsonData)
    let idx = jsonData.staff_idx;//staff idx
    let content =  jsonData.content;//todolist idx
    let number4 = jsonData.number4;
    if(Array.isArray(content)==true){
      for(var i=0;i<content.length;i++){
        await sampleDAO.insertTodolog(idx,content[i],number4)
      }
    }else{
      await sampleDAO.insertTodolog(idx,content,number4)
    }
    return res.json({'result' : 'success','msg':'업무가 완료처리되었습니다.'}); 
  })
})
sv.router.post("/front/todomembercheck", async function (req,res){
  req.on('data' , async function(data){    
    let jsonData = qs.parse(data.toString());
    console.log("data",jsonData)
    let content = jsonData.content_id;
    var number = jsonData.todonumber;
    console.log("~~~",number,content,typeof(number))
    if(checkNull(content)){
      console.log("1")
      return res.json({'result' : 'fail','msg':'수행 목록을 선택해주세요.'});
    };
    if(checkNull(number)){
      console.log("2")
      return res.json({'result' : 'fail','msg':'전화번호 뒤 4자리를 입력해주세요.'});
    };
    number = parseInt(jsonData.todonumber);
    if(isInt(number)==false){
      console.log("3")
      return res.json({'result' : 'fail','msg':'올바르지 않은 형식입니다.'});
    };
    let member = await sampleDAO.number4(number)
    if(member.length == 0){
      console.log("2")
      return res.json({'result' : 'fail','msg':'해당하는 직원의 번호를 찾을 수 없습니다.'});
    };
    console.log("content",content,content.length ,Array.isArray(content))
   
    return res.json({'result' : 'success','msg':'msg','member':member,'content':content,'number':number}); 
  })
})
sv.router.get("/getPointPercent", async function (req, res) {
  let percent = await sampleDAO.listSettings();
  return res.json({'result' : 'success', 'percent':percent});
});
sv.router.get("/getsavePoint_front", async function (req, res) {
  console.log("number",req.query.number)
  let list = await sampleDAO.pointMember(req.query.number);//번호가 똑같은 사람의 리스트
  if(list.length == 0){
    return res.json({'result' : 'fail','msg':'해당 번호에 일치하는 회원이 없습니다.'});
  }
  else{
    await sampleDAO.updatePoint(list[0].idx,req.query.point)
    await sampleDAO.insertPointlog(list[0].idx,'후불 결제 적립','1',req.query.point)
  }
  console.log("list",list[0])
  return res.json({'result' : 'success', 'list':list[0]});
});
///
function dateTimeOfficialFormat(sdate,duration='') {//input란에 ISO 시간대로 입력하기 위한 포맷
  let date = new Date(sdate);
  let month = date.getMonth() + 1;
  let day = date.getDate();
  let hour = date.getHours();
  let minute = date.getMinutes()+duration;
  let second = date.getSeconds();

  month = month >= 10 ? month : '0' + month;
  day = day >= 10 ? day : '0' + day;
  hour = hour >= 10 ? hour : '0' + hour;
  minute = minute >= 10 ? minute : '0' + minute;
  second = second >= 10 ? second : '0' + second;

  return date.getFullYear() + '-' + month + '-' + day + ' ' + hour + ':' + minute;
}
function isInt(num) {
  return num % 1 === 0;
}
function checkNull(str){ // 빈값인지 체크하는 함수 
  return str == null || str == "";
}
module.exports = MainController;