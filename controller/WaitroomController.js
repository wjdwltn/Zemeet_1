sv = require("../server")
sampleDAO = require("../dbutil")
const { json } = require("express/lib/response");
const fs = require("fs");
const qs = require('querystring'); //json data parse 
sampleDAO.init()

var MainController={}

//================================(대기방 - main,home,room )
sv.router.get("/waitroom/main", async function (req, res) {
  let rows = await sampleDAO.listRoomWaitroom();
  let room_Pic = await sampleDAO.listRoomPic(req.query.idx)
  let peopleType = req.query.people_option; // 검색타입
  let durationType = req.query.duration_option //예약상태
  res.render('waitroom/waitroom',
  {rows:rows, list:JSON.stringify(rows), pics:room_Pic, peopleType:peopleType, durationType:durationType  })
})

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
      console.log("-------------예약 취소-------------")//30분 지나면 취소
      await sampleDAO.UpdateStatus_0(info[i].idx)
      await sampleDAO.Updatereservation_0(check[0].idx)//roomreservation idx
      let midx = await sampleDAO.roomreser_idx(check[0].idx)
      await sampleDAO.resercancelAlarm(midx[0].midx,midx[0].roomNm)
    }
    let check_5m = await sampleDAO.reser5check(info[i].idx)
    if(check_5m.length !=0){
      console.log("------------예약 5분 전 알림---------- " + new Date().getMinutes() + " : " + new Date().getSeconds());
      await sampleDAO.reser5mAlarm(check_5m[0].midx,check_5m[0].roomNm)
    }
  } 
  return res.json({'result' : 'success', 'msg':info[0]});
});

sv.router.get("/getRoomPop", async function (req, res) {
  let info = await sampleDAO.listRoom2(req.query.idx);
  let pics = await sampleDAO.listRoomPic(req.query.idx);
  let time = await sampleDAO.listReservationUseTime_kiosk(req.query.idx)
  var today = new Date()
  today = dateTimeOfficialFormat(today)
  // var date = new Date(today.replace('T', ' '));
  // var endT = new Date(date.setTime(date.getTime() + (duration*60*60*1000))).toLocaleString('sv');
  console.log("time",time)
  console.log("now",today)
  // console.log("end",endT)
  if(info.length == 0){
    return res.json({'result' : 'fail','msg':'방이 없습니다.'});
  }else{
    // var lt = dateTimeOfficialFormat(time[0].stime)
    // console.log("timemdm,",lt)
     return res.json({'result' : 'success', 'msg':info[0], 'pInfo':pics[0], 'pics':pics});
  }
});
sv.router.get("/TimeCheck", async function (req, res) {
  let time = await sampleDAO.listReservationTimeCheck_kiosk(req.query.idx,req.query.time)
  var today = new Date()
  today = dateTimeOfficialFormat(today)
  console.log("time.length",time.length)
  
  if(time.length==0){
    console.log("~~~~~")
    return res.json({'result' : 'success', 'msg':time[0]});
  }else{
    console.log("!!!!!!")
    return res.json({'result' : 'fail','msg':'해당 시간에 예약된 방이 있습니다.'});
  }
});
sv.router.get("/waitroom/getRoom", async function (req, res) {
  let info = await sampleDAO.listRoom();
  if(info.length == 0){
    return res.json({'result' : 'fail'});
  }else{
     return res.json({'result' : 'success', 'msg':info});
  }
});
sv.router.get("/waitroom/getRoomInfo", async function (req, res) {
  let info = await sampleDAO.listRoom2(req.query.idx);//해당 방 정보
  let pics = await sampleDAO.listRoomPic(req.query.idx);//해당 방 사진
  let set = await sampleDAO.listSettings();
  if(info.length == 0){
    return res.json({'result' : 'fail','msg':'방이 없습니다.'});
  }else{
     return res.json({'result' : 'success', 'msg':info[0], 'pInfo':pics[0], 'pics':pics, 'set':set});
  }
});
sv.router.get("/buyRoomPop", async function (req, res) {
  let info = await sampleDAO.listRoom2(req.query.idx);//해당 방 정보
  let pics = await sampleDAO.listRoomPic(req.query.idx);//해당 방 사진
  if(info.length == 0){
    return res.json({'result' : 'fail','msg':'방이 없습니다.'});
  }else{
     return res.json({'result' : 'success', 'msg':info[0], 'pInfo':pics[0], 'pics':pics});
  }
});
sv.router.get("/getlistFood_wait", async function (req, res) {
  console.log("???????????")
  console.log(req.query.category);
  let info = await sampleDAO.listMenucate(req.query.category);
  console.log("info",info[0])
  if(info.length == 0){
    return res.json({'result' : 'fail','msg':'등록된 음식이없습니다'});
  }else{
    return res.json({'result' : 'success','msg':info});
  }
});
sv.router.get("/getReservationByNum", async function (req, res) {
  console.log("어기 들어롤~~~~~~~~~~~~~~~~~~~");
  console.log("phonenumber", req.query.number);
  if(checkPhoneNohyphen(req.query.number)){
    console.log("형식 틀림0");
    return res.json({'result' : 'fail_form','msg':'올바르지 않은 전화번호 형식입니다.'});
  };
  let info = await sampleDAO.listReservation_Kiosk(req.query.number);
  console.log("info",info);
  if(info.length == 0){
    return res.json({'result' : 'fail','msg':'연락처와 일치하는 예약내역이 없습니다.'});
  }else{
    return res.json({'result' : 'success','msg':info});
  }
});
sv.router.post("/orderRoom_waitroom", function (req, res) {
  req.on('data', async function(data){
    let jsonData = JSON.parse(data.toString());
    let idx= jsonData[0].ridx; 
    let roomNm = jsonData[0].roomNm;
    let duration = jsonData[0].duration;
    let people = jsonData[0].people;
    let price = stringNumberToInt(jsonData[0].price);
    
    await sampleDAO.orderRoom(idx, duration, people, price)
    await sampleDAO.updatestatus(idx)
    return res.json({'result' : 'success'});
  });
})
sv.router.post("/orderMenu_waitroom", function (req, res) {
  req.on('data', async function(data){
    let jsonData = JSON.parse(data.toString()); 
    console.log("jsondata:",jsonData);
    let info = await sampleDAO.ordersell(jsonData[0].ridx)
    var ggidx = await sampleDAO.ordersell_gidx()
    let request = ''
    if(jsonData[0].kind == 0){
      console.log("000000000000")
    }
    else if( jsonData[0].kind == 1){
      if(ggidx == ''){//전체 첫 주문이라면
        ggidx=0;
        for(i=0;i<jsonData.length;i++){
          sampleDAO.insertorder(jsonData[i].ridx,ggidx,jsonData[i].midx,jsonData[i].foodSum,stringNumberToInt(jsonData[i].foodPrice),request);
        }
      }
      else{
        ggidx= ggidx[0].gidx
        if(info == ''){// 그 방에 처음 주문이라면
          ggidx+=1;
          for(i=0;i<jsonData.length;i++){
            sampleDAO.insertorder(jsonData[i].ridx,ggidx,jsonData[i].midx,jsonData[i].foodSum,stringNumberToInt(jsonData[i].foodPrice),request);
          }
        }
        else{// 그 방에 첫 주문이 아니고
          if(info[0].payment == 1 || info[0].payment == 2){ // 마지막 주문이 결제가 되었을 때(손님이 가고 다른 손님이 와서 주문했을 때)
            ggidx+=1;
            for(i=0;i<jsonData.length;i++){
              sampleDAO.insertorder(jsonData[i].ridx,ggidx,jsonData[i].midx,jsonData[i].foodSum,stringNumberToInt(jsonData[i].foodPrice),request);
            }
          }
          else{// 그 방에서 최종적으로 나와 결제하기 전에 또 다시 주문을 한 경우
            for(i=0;i<jsonData.length;i++){
              sampleDAO.insertorder(jsonData[i].ridx,info[0].gidx,jsonData[i].midx,jsonData[i].foodSum,stringNumberToInt(jsonData[i].foodPrice),request);
            }
          }
        }
      }
    }
    return res.json({'result' : 'success','msg':'주문이 완료되었습니다.'});
  })
});
sv.router.post("/optionselect", function (req, res) {
  req.on('data', async function(data){
    let jsonData = qs.parse(data.toString()); 
    let people = jsonData.people_option;
    console.log("people",people)
    let info = await sampleDAO.listRoomoption(people)
    if(info.length == 0){
      return res.json({'result' : 'fail','msg':'이용가능한 방이 없습니다.'});
    }else{
       return res.json({'result' : 'success','info':info});
    }
  });
})
sv.router.get("/timeCalculate", async function (req, res) {
  let log = await sampleDAO.timecalculate(req.query.idx);//roomlog
  if(log.length == 0){
    return res.json({'result' : 'fail'});
  }else{
     return res.json({'result' : 'success','log':log});
  }
});

sv.router.post("/reseruseroom", function (req, res) {
  req.on('data', async function(data){
    let jsonData = qs.parse(data.toString()); 
    console.log("datalist:",jsonData)
    let roomreseridx = jsonData.idx;
    let ridx = jsonData.ridx;
    let stime =dateTimeOfficialFormat(jsonData.stime);
    let duration = jsonData.duration;
    let people = jsonData.people;
    let expense = jsonData.expense;
    console.log("roomreseridx",roomreseridx)
    await sampleDAO.reserveUseRoom(ridx,stime,duration,people,expense);
    await sampleDAO.updatestatus(ridx)
    await sampleDAO.updatestatus_roomreser(roomreseridx)
    return res.json({'result' : 'success', 'ridx':ridx});
  });
})
sv.router.get("/getdata", async function (req, res) {
  console.log("ridx",req.query.ridx)
  let log = await sampleDAO.getRoomLog(req.query.ridx);//roomNm
  console.log("log",log[0])
  return res.json({'result' : 'success', 'log':log[0]});
});
sv.router.get("/getsavePoint", async function (req, res) {
  console.log("number",req.query.number)
  let list = await sampleDAO.pointMember(req.query.number);//번호가 똑같은 사람의 리스트
  if(list.length == 0){
    return res.json({'result' : 'fail','msg':'해당 번호에 일치하는 회원이 없습니다.'});
  }
  else{
    await sampleDAO.updatePoint(list[0].idx,req.query.point)
    await sampleDAO.insertPointlog(list[0].idx,'방 결제 적립','1',req.query.point)
  }
  console.log("list",list[0])
  return res.json({'result' : 'success', 'list':list[0]});
});
sv.router.get("/getPointPercent", async function (req, res) {
  let percent = await sampleDAO.listSettings();
  return res.json({'result' : 'success', 'percent':percent});
});
//공통함수
function stringNumberToInt(stringNumber){// 숫자 ,로 변환된 문자열을 계산 전에 정수형으로 바꿔줌
  return parseInt(stringNumber.replace(/,/g , ''));
}
function checkPhoneNohyphen(str) {
  console.log("str",str)
  var regExp = /^01([0|1|6|7|8|9])([0-9]{3,4})([0-9]{4})$/;
  console.log("ddd",!regExp.test(str))
  return !regExp.test(str); // 형식에 맞는 경우 false 리턴
}
function dateTimeOfficialFormat(sdate) {//input란에 ISO 시간대로 입력하기 위한 포맷
  let date = new Date(sdate);
  let month = date.getMonth() + 1;
  let day = date.getDate();
  let hour = date.getHours();
  let minute = date.getMinutes();
  let second = date.getSeconds();

  month = month >= 10 ? month : '0' + month;
  day = day >= 10 ? day : '0' + day;
  hour = hour >= 10 ? hour : '0' + hour;
  minute = minute >= 10 ? minute : '0' + minute;
  second = second >= 10 ? second : '0' + second;
  return date.getFullYear() + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second;
}
module.exports = MainController;