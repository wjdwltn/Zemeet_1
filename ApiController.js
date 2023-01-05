sv = require("./server")
sampleDAO = require("./dbutil")
const qs = require('querystring'); //json data parse 
const fs = require("fs");
const multer = require("multer");
const multiparty = require("multiparty");
var MainController={}


//================================(Api - 고객센터)
sv.router.get("/api/customer", async function (req, res) {
  res.render('api/api-customer', 
  {session : req.session});
})
//================================(Api - 이벤트 상세보기)
sv.router.get("/api/eventdetail", async function (req, res) {
  let today = new Date()
  let today_ = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().slice(0,10)
  let list =await sampleDAO.listEvent(req.query.idx);
  let prev = await sampleDAO.prevEvent(req.query.no);
  let next = await sampleDAO.nextEvent(req.query.no);
  res.render('api/api-eventdetail',{list :list[0],prev:prev, next:next, session : req.session, today:today_ ,no:req.query.no});
})
//================================(Api - 이벤트 게시판)
sv.router.get("/api/eventboard", async function (req, res) {
  if(req.query.countperpage == undefined)
      req.query.countperpage =7
  if(req.query.page == undefined)
      req.query.page = 0
  let countperpage = parseInt(req.query.countperpage)
  let page = parseInt(req.query.page)
  let list =await sampleDAO.selectPagingEvent_api(page,countperpage)
  let today = new Date()
  let today_ = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().slice(0,10)
  let rt = await sampleDAO.selectPagingTotalEvent_api()
  res.render('api/api-eventboard',
  {rows: list, page:page,totalitems:rt[0].count, countperpage:countperpage, today:today_})
})
//================================(Api -게임 설명)
sv.router.get("/api/gamedetail", async function (req, res) {
  let idx = req.query.idx;
  let info = await sampleDAO.listGame2(idx);
  res.render('api/api-gamedetail',{rows : info[0], session : req.session});
});
sv.router.get("/getapiVideo", async function (req, res) {
  let info = await sampleDAO.selectGame(req.query.idx);
  if(info[0].vid == ''|| info[0].vid == null){
    return res.json({'result' : 'fail','msg':'준비된 영상이 없습니다.~'});
  }else{
    return res.json({'result' : 'success','msg':info[0].vid});
  }
});
sv.router.get("/getapiExplan", async function (req, res) {
  let info = await sampleDAO.selectGame(req.query.idx);
  if(info[0].explan == ''){
    return res.json({'result' : 'fail','msg':'등록된 내용이없습니다'});
  }else{
    return res.json({'result' : 'success','msg':info[0].explan});
  }
});
sv.router.get("/getapiQuestion", async function (req, res) {
  let info = await sampleDAO.selectGame_q(req.query.idx);
  if(info.length == 0){
    return res.json({'result' : 'fail','msg':'질문이 없습니다.~'});
  }else{
    return res.json({'result' : 'success','msg':info});
  }
});
//================================(Api -게임 검색)=========================================
sv.router.get("/api/gamesearch", async function (req, res) {
  let list =await sampleDAO.listGame();
  let list1 =await sampleDAO.listGame1();
  res.render('api/api-gamesearch',{rows :list , row : list1, session : req.session});
});
sv.router.post("/getApiSearch", function (req, res) {
  req.on('data', async function(data){
     return getApiSearchProcess(res,data)
  })
});
const getApiSearchProcess  = async function(res , data){
  let jsonData = qs.parse(data.toString()); 
  let usel = jsonData.people;
  let ptime = jsonData.playTime;
  let etime = jsonData.explanTime;
  let genr = jsonData.Genre;
  let lev = jsonData.Level;
  let search = jsonData.gamesearch;
  let compare = await sampleDAO.listComGame(search);
  if (compare.length ==0){
  }else{
    Grank=parseInt(compare[0].grank);
    Grank+=1;
    sampleDAO.updateGame2(Grank,compare[0].idx);
  }
  let info = await sampleDAO.selectGame2(usel,ptime,etime,genr,lev,search);
  if(info.length == 0){
    return res.json({'result' : 'fail','msg':'일치하는 게임이 없습니다.'});
  }else{
    return res.json({'result' : 'success','msg':info});
  }
}
//================================(Api - 메인페이지)========================================
sv.router.get("/api/main", async function (req, res) {
  let list =await sampleDAO.listGame();
  let room =await sampleDAO.listMainRoom();
  let pics = await sampleDAO.listRoomPic(req.query.idx);
  res.render('api/api-home',
  {rows :list, session : req.session, info:room , pics:pics});
})

sv.router.get("/gettopgamepop", async function (req, res) {
  let info = await sampleDAO.listGame2(req.query.idx);
  if(info.length == 0){
    return res.json({'result' : 'fail','msg':'게임이 없습니다.'});
  }else{
     return res.json({'result' : 'success','msg':info[0]});
  }
});
sv.router.get("/gettoproompop", async function (req, res) {
  let info = await sampleDAO.listRoom2(req.query.idx);
  let pics = await sampleDAO.listRoomPic(req.query.idx);
  if(info.length == 0){
    return res.json({'result' : 'fail','msg':'방이 없습니다.'});
  }else{
     return res.json({'result' : 'success', 'msg':info[0], 'pInfo':pics[0], 'pics':pics});
  }
});
sv.router.get("/getRoomPopHomeApi", async function (req, res) {
  let info = await sampleDAO.listRoom2(req.query.idx);
  let pics = await sampleDAO.listRoomPic(req.query.idx);
  let set = await sampleDAO.listSettings();
  if(info.length == 0){
    return res.json({'result' : 'fail','msg':'방이 없습니다.'});
  }else{
     return res.json({'result' : 'success', 'msg':info[0], 'pInfo':pics[0], 'pics':pics, 'set':set});
  }
});
//================================(Api - 로그인)
sv.router.get("/api/login", async function (req, res) {
  res.render('api/api-login', {session : req.session});
})
sv.router.post("/api/loginProcess", function (req, res) {  
  req.on('data' , async function(data){
    return loginProcess(res  , req , data);    
  })
})
const loginProcess = async function(res ,req , data){
  let jsonData = qs.parse(data.toString()); 
  let id = jsonData.id;
  let pw = jsonData.pw;
  if(checkNull(id)){
    return res.json({'result' : 'fail','msg':'아이디를 입력해주세요.'});
  };
  if(checkNull(pw)){
    return res.json({'result' : 'fail','msg':'비밀번호를 입력해주세요.'});
  };
  let checkLogin = await sampleDAO.checkLogin(id , pw);
  if(checkLogin[0] == null){ // 로그인 정보없음 
    return res.json({'result' : 'fail','msg':'회원정보가 없습니다.<br>아이디 혹은 비밀번호를 확인해주세요.'});
  }else{ // 로그인 완료
      // 세션에 회원 정보 저장
      req.session.idx = checkLogin[0].idx;
      req.session.uid = checkLogin[0].id;
      req.session.name = checkLogin[0].name;
      req.session.ranking = checkLogin[0].ranking;
      req.session.nick = checkLogin[0].nick;
      req.session.push = checkLogin[0].push;
      req.session.isLogin = true;      
      return res.json({'result':'success'});
  }
}
sv.router.get("/api/logout" , async function(req,res){ // 로그아웃
  delete req.session.idx;
  delete req.session.id;
  delete req.session.name;  
  delete req.session.isLogin;  
  res.redirect('/api/main') ;
})
sv.router.post("/api/findPwProcess", function (req, res) { // 비밀번호 찾기
  req.on('data' , async function(data){
    return findPwProcess(res  , req , data);    
  })
})
const findPwProcess = async function(res ,req , data){
  let jsonData = qs.parse(data.toString()); 
  let id = jsonData.id;
  let name = jsonData.name;
  let bNumber4 = jsonData.bNumber4;
  if(checkNull(id)){
    return res.json({'result' : 'fail','msg':'아이디를 입력해주세요.'});
  };
  if(checkNull(name)){
    return res.json({'result' : 'fail','msg':'이름을 입력해주세요.'});
  };
  if(checkNull(bNumber4)){
    return res.json({'result' : 'fail','msg':'연락처를 입력해주세요.'});
  };
  let findPw = await sampleDAO.findPw(id , name, bNumber4);
  if(findPw[0] != null){ // 해당하는 회원 정보가 있을 경우 - 비밀번호를 (0000)으로 초기화
    sampleDAO.resetPw(id , name);
    return res.json({'result' : 'success'});
  }else{ // 해당하는 회원 정보가 없을 경우
    return res.json({'result' : 'fail','msg':'회원정보가 없습니다.<br>아이디 혹은 비밀번호를 확인해주세요.'});
  }
}
//================================(Api - 회원가입)
sv.router.get("/api/registration", async function (req, res) {
  res.render('api/api-registration', 
  {session : req.session});
})
sv.router.post("/api/registrationProcess", function (req, res) {  
  req.on('data' , async function(data){
    return registrationProcess(res , data);    
  })
})
const registrationProcess = async function(res , data){
  let jsonData = qs.parse(data.toString());   
  let id = jsonData.id;
  let name = jsonData.name;
  let nick = jsonData.nick;
  let pw = jsonData.pw;
  let birth = jsonData.birth;
  let pwcheck = jsonData.pwcheck;
  let number = jsonData.number;
  if(checkNull(id)){
    return res.json({'result' : 'fail','msg':'아이디를 입력해주세요.'});
  };
  if(checkNull(name)){
    return res.json({'result' : 'fail','msg':'이름을 입력해주세요.'});
  };  
  if(checkNull(nick)){
    return res.json({'result' : 'fail','msg':'닉네임을 입력해주세요.'});
  };
  if(checkNull(number)){
    return res.json({'result' : 'fail','msg':'전화번호를 입력해주세요.'});
  };
  if(checkPhone(number)){
    return res.json({'result' : 'fail','msg':'올바르지 않은 전화번호 형식입니다.'});
  };
  if(checkNull(birth)){
    return res.json({'result' : 'fail','msg':'생년월일을 입력해주세요.'});
  };
  if(checkDate(birth)){
    return res.json({'result' : 'fail','msg':'올바르지 않은 날짜 형식입니다.'});
  };
  if(checkNull(pw)){
    return res.json({'result' : 'fail','msg':'비밀번호를 입력해주세요.'});
  };
  if(pw!==pwcheck){
    return res.json({'result' : 'fail','msg':'비밀번호가 일치하지 않습니다.'});
  }
  let checkId =await sampleDAO.checkDuplId(id);
  let checkNick =await sampleDAO.checkDuplNick(nick);
  let checkNumber =await sampleDAO.checkDuplNumber(number);
  if(checkId[0] != null){ // 중복된 아이디가 있을때 
    return res.json({'result' : 'fail','msg':'아이디가 중복되었습니다.'});
  }else if(checkNick[0] != null){ // 중복된 닉네임이 있을때 
    return res.json({'result' : 'fail','msg':'닉네임이 중복되었습니다.'});
  }else if(checkNumber[0] != null){ // 중복된 연락처가 있을때 
    return res.json({'result' : 'fail','msg':'연락처가 중복되었습니다.'});
  }else{
    await sampleDAO.registerMember(id,name,nick,pw,birth,number);
    return res.json({'result' : 'success','msg':'가입이 완료되었습니다.','id':id});
  }
}
sv.router.get("/api/registerAlarm", async function (req, res) {
  let id = await sampleDAO.id_(req.query.id);
  await sampleDAO.registerAlarm(id[0].idx)
  return res.json({'result' : 'success','id':id});
})
//================================(Api - 내 정보)
sv.router.get("/api/myinfo", async function (req, res) {
  if(typeof req.session.isLogin != 'undefined'){
    console.log("로그인함")
    let Midx = req.session.idx;
    let memberDetail = await sampleDAO.listMemberIdx(Midx);
    res.render('api/api-myinfo', 
    {session : req.session, info : memberDetail});
  }
  else{
    console.log("비회원")
    res.render('api/api-myinfo', 
    {session : req.session});
  }

})
//================================(Api - 푸쉬알람)
sv.router.get("/pushalarm", async function (req, res) {
  let idx = req.session.idx;
  let status = req.query.status;
  if(status == 'on'){
  await sampleDAO.pushalarm_on(idx);
  }
  else if(status == 'off'){
    await sampleDAO.pushalarm_off(idx);
  }
  return res.json({'result' : 'success','msg':'푸쉬알람이 해제되었습니다.'});
})
sv.router.get("/pushalarmcheck", async function (req, res) {
  let idx = req.session.idx;
  let push = await sampleDAO.checkDuplIdx(idx);
  return res.json({'result' : 'success','push':push});
})

//================================(Api - 내 정보 - 개인정보 수정)
sv.router.get("/api/myinfo-modify", async function (req, res) {
  let Midx = req.session.idx;
  let memberDetail = await sampleDAO.listMemberIdx(Midx);
  res.render('api/api-myinfo-modify', { session : req.session, info : memberDetail[0]});
})
sv.router.post("/api/memberUpdateProcess", async function (req,res){
  req.on('data' , async function(data){    
    let jsonData = qs.parse(data.toString());
    let idx = jsonData.idx;
    let id = jsonData.id;
    let name = jsonData.name;
    let nick = jsonData.nick;
    let ranking = jsonData.ranking;
    let pw = jsonData.pw;
    let pwcheck = jsonData.pwcheck;
    let rdate = jsonData.rdate;
    let birth = jsonData.birth;
    let numbers = jsonData.number;
    let number = numbers.replace(/\-/g,'');
    if(checkNull(id)){
      return res.json({'result' : 'fail','msg':'아이디를 입력해주세요.'});
    };
    if(checkNull(name)){
      return res.json({'result' : 'fail','msg':'이름을 입력해주세요.'});
    };
    if(checkNull(nick)){
      return res.json({'result' : 'fail','msg':'닉네임을 입력해주세요.'});
    };
    if(checkNull(ranking)){
      return res.json({'result' : 'fail','msg':'등급을 입력해주세요.'});
    };
    if(checkNull(pw)){
      return res.json({'result' : 'fail','msg':'비밀번호를 입력해주세요.'});
    };
    if(checkNull(rdate)){
      return res.json({'result' : 'fail','msg':'회원가입 날짜를 입력해주세요.'});
    };
    if(checkNull(birth)){
      return res.json({'result' : 'fail','msg':'생년월일을 입력해주세요.'});
    };
    if(checkDate(birth)){
      return res.json({'result' : 'fail','msg':'올바르지 않은 날짜 형식입니다.'});
    };
    if(checkNull(number)){
      return res.json({'result' : 'fail','msg':'전화번호를 입력해주세요.'});
    };
    if(checkPhone(number)){
      return res.json({'result' : 'fail','msg':'올바르지 않은 전화번호 형식입니다.'});
    };
    if(pw!==pwcheck){
      return res.json({'result' : 'fail','msg':'비밀번호가 일치하지 않습니다.'});
    }
    let checkNumber =await sampleDAO.countDuplNumber(number,idx);
    if(checkNumber[0].count != 0){ // 중복된 연락처가 있을때 (기존 연락처는 중복가능)
      return res.json({'result' : 'fail','msg':'연락처가 중복되었습니다.'});
    }else{
      sampleDAO.updateApiMember(idx, id, name, nick, ranking, pw, rdate, birth, number)
      return res.json({'result' : 'success','msg':'수정 완료되었습니다.'});   
    }
  })
})
//================================(Api - 공지사항 상세보기)
sv.router.get("/api/noticedetail", async function (req, res) {
  let list =await sampleDAO.listNotice(req.query.idx);
  let prev = await sampleDAO.prevNoitce(req.query.idx)
  let next = await sampleDAO.nextNoitce(req.query.idx)
  res.render('api/api-noticedetail',{list :list[0],  prev:prev, next:next,session : req.session});
})
//================================(Api - 공지사항 게시판)
sv.router.get("/api/noticeboard_", async function (req, res) {
  let list =await sampleDAO.listNotice_();
  res.render('api/api-noticeboard_',{rows :list , session : req.session});
})
sv.router.get("/api/noticeboard", async function (req, res) {
  if(req.query.countperpage == undefined)
      req.query.countperpage =7
  if(req.query.page == undefined)
      req.query.page = 0
  let countperpage = parseInt(req.query.countperpage)
  let page = parseInt(req.query.page)
  let list =await sampleDAO.selectPagingNotice(page,countperpage)
  let rt = await sampleDAO.selectPagingTotalNotice()
  res.render('api/api-noticeboard',
  {rows: list, page:page,totalitems:rt[0].count, countperpage:countperpage})
})
//================================(Api - 문의 작성)
sv.router.get("/api/question", async function (req, res) {
  res.render('api/api-question', 
  {session : req.session});
})
//================================(Api - 문의 게시판)
sv.router.get("/api/questionboard", async function (req, res) {
  if(req.query.countperpage == undefined)
      req.query.countperpage = 6
  if(req.query.page == undefined)
      req.query.page = 0
  let countperpage = parseInt(req.query.countperpage)
  let page = parseInt(req.query.page)
  let member=req.session.nick
  let list =await sampleDAO.selectPagingQuestion_api(page,countperpage,member)
  let rt = await sampleDAO.selectPagingTotalQuestion_api(member)
  res.render('api/api-questionboard',
  {rows: list, page:page,totalitems:rt[0].count, countperpage:countperpage})
})
//================================(Api - 문의 상세보기)
// - - - <<storage 세팅>>
var storage4 = multer.diskStorage({
  destination(req , file , cb){ // 저장경로
    cb(null , 'C:/upload/zemeet/smartEditor/');
  },
  filename(req,file,cb){ // 저장될 파일이름 
    // 파일명이 겹치는걸 방지해서 날짜를 넣음
    cb(null, `${Date.now()}__${file.originalname}`);
  }
})
var upload4 = multer({storage:storage4});
//====================================
sv.router.get("/api/questiondetail", async function (req, res) {
  let member=req.session.nick
  let list =await sampleDAO.listQuestion(req.query.idx);
  let prev = await sampleDAO.prevQuestion(req.query.idx,member);
  let next = await sampleDAO.nextQuestion(req.query.idx,member);
  res.render('api/api-questiondetail',{list :list[0],prev:prev, next:next, session : req.session});
})
sv.router.post("/api/questionFileProcess",  upload4.fields([{ name: 'pic1' }, { name: 'pic2' }]),function (req,res){
  let pic1 = req.files.pic1;
  let pic_1 ='';
  if(pic1 != null) pic_1 = pic1[0].filename;
  let pic2 = req.files.pic2;
  let pic_2 ='';
  if(pic2 != null) pic_2 = pic2[0].filename;
  let member=req.session.nick
  let category = req.body.category;
  let title = req.body.title;
  let content = req.body.content;
  if(checkNull(category)){
    return res.json({'result' : 'fail','msg':'카테고리을 선택해주세요.'});
  };
  if(checkNull(title)){
    return res.json({'result' : 'fail','msg':'제목을 입력해주세요.'});
  };
  if(checkNull(content)){
    return res.json({'result' : 'fail','msg':'내용을 입력해주세요.'});
  };
  sampleDAO.insertquestion(member,category,title,content,pic_1,pic_2);
  return res.json({'result' : 'success','msg':'문의사항 등록이 완료되었습니다.'});
})
sv.router.get("/admin/deleteQuestion", async function (req, res) {
  await sampleDAO.deleteQuestion(req.query.idx)
  return res.json({'result' : 'success','msg':'삭제완료되었습니다.'});
});
sv.router.get("/api/deleteQuestion_api", async function (req, res) {
  await sampleDAO.deleteQuestion(req.query.idx)
  return res.json({'result' : 'success','msg':'삭제완료되었습니다.'});
});
//================================(Api - 예약 내역)
sv.router.get("/api/reservation", async function (req, res) {
  let midx = req.session.idx
  let past = await sampleDAO.selectReservation_Api_past(midx);
  let current = await sampleDAO.selectReservation_Api_current(midx);
  res.render('api/api-reservation', 
  {session : req.session, past:past, current:current});
})
sv.router.get("/getReservationHistory", async function (req, res) {
  let resv = await sampleDAO.listReservationIdx(req.query.idx);
  if(resv.length == 0){
    return res.json({'result':'fail','msg':'예약 내역이 없습니다.'});
  }else{
     return res.json({'result':'success', 'resv':resv[0]});
  }
});
sv.router.post("/reservationCancelProcess", async function (req,res){
  req.on('data' , async function(data){   
    let idx = req.query.idx;
    let jsonData = qs.parse(data.toString());
    let reason = jsonData.reason;
    if(checkNull(reason)){
      return res.json({'result' : 'fail','msg':'취소 사유를 입력해주세요.'});
    };
    sampleDAO.cancelReservation_Api(idx, reason)
    sampleDAO.UpdateStatus_0_front(idx)
    return res.json({'result' : 'success'});
  })
})
//================================(Api - 적립금 게시판)
sv.router.get("/api/rewardboard", async function (req, res) {
  if(req.query.countperpage == undefined)
  req.query.countperpage =6
  if(req.query.page == undefined)
    req.query.page = 0
  let countperpage = parseInt(req.query.countperpage)
  let page = parseInt(req.query.page)
  let rt = await sampleDAO.selectPagingTotalpoint(req.session.idx)
  let point = await sampleDAO.listMemberIdx(req.session.idx);
  let list = await sampleDAO.selectPagingpoint(req.session.idx,page,countperpage);
  res.render('api/api-rewardboard', 
  {session : req.session, page:page,totalitems:rt[0].count, countperpage:countperpage,point:point,list:list});
})
//================================(Api - 알림 내역)
sv.router.get("/api/alarmlog", async function (req, res) {
  if(req.query.countperpage == undefined)
  req.query.countperpage =6
  if(req.query.page == undefined)
    req.query.page = 0
  let countperpage = parseInt(req.query.countperpage)
  let page = parseInt(req.query.page)
  let rt = await sampleDAO.selectPagingTotalAlarm(req.session.idx)
  let list = await sampleDAO.selectPagingAlarm(req.session.idx,page,countperpage);
  await sampleDAO.updateCheck(req.session.idx)
  res.render('api/api-alarmlog', 
  {session : req.session, page:page,totalitems:rt[0].count, countperpage:countperpage,list:list});
})
//================================(Api - 방 검색)
sv.router.get("/api/roomsearch", async function (req, res) {
  let room =await sampleDAO.listRoomWaitroom();
  let pics = await sampleDAO.listRoomPic(req.query.idx);
  var mainidx=-1;
  if(typeof(req.query.mainidx) != "undefined"){
    mainidx = req.query.mainidx;
  }
  res.render('api/api-roomsearch',
  {session : req.session, info:room , pics:pics,mainidx:mainidx});
})
sv.router.get("/getRoomPopApi", async function (req, res) {
  let info = await sampleDAO.listRoom2(req.query.idx);
  let pics = await sampleDAO.listRoomPic(req.query.idx);
  let set = await sampleDAO.listSettings();
  if(info.length == 0){
    return res.json({'result' : 'fail','msg':'방이 없습니다.'});
  }else{
     return res.json({'result' : 'success', 'msg':info[0], 'pInfo':pics[0], 'pics':pics, 'set':set});
  }
});

var dupleReservation = false;
sv.router.get("/getReserInfo", async function (req, res) {
  console.log(" getReserIndfo 들어옴 ...")
  var now = new Date()
  now = now.toISOString().split('T')[0]
  let stime = req.query.startT;
  var time = stime.replace(' ','T');
  var stimedate = stime.split(' ')[0]
  console.log("getReserInfo stimedate", stimedate)
  if(checkDateTime(time)){
    console.log("time",time)
    return res.json({'result' : 'fail'});
  };
  let resv = await sampleDAO.listReservationDuplCheck_api(req.query.idx, req.query.startT, req.query.endT);
  console.log("getReserInfo resv", resv)
  let info = await sampleDAO.listRoom1(req.query.idx);
  console.log("getReserInfo info", info)
  dupleReservation = false;
  if(info[0].status == 1){//키오스크에서 사용중인 방이면
    if(stimedate>now){//사용중이지만 선택 날짜가 오늘보다 크면
      if(resv[0].count != 0 ){//예약 불가 예약이 있음
        return res.json({'result' : 'fail','roomNm':info[0].roomNm});
      }else if (resv[0].count == 0){//예약 가능
        console.log("getReserInfo 예약 가능")
         return res.json({'result' : 'success','roomNm':info[0].roomNm});
      }
    }
    else{//사용중인 방이고 날짜가 오늘이면
      return res.json({'result' : 'fail1','roomNm':info[0].roomNm});
    }
  }
  else{//키오스크에서 사용중인 방이 아니면
    if(resv[0].count != 0 ){//예약 불가 예약이 있음
      return res.json({'result' : 'fail','roomNm':info[0].roomNm});
    }else if (resv[0].count == 0){//예약 가능
      console.log("getReserInfo 예약 가능 2")
       return res.json({'result' : 'success','roomNm':info[0].roomNm});
    }
  }
});
sv.router.post("/api/reservationWriteProcess", async function (req,res){// ------------------------------ 최종 Ver.에서 팝업으로 적용하기
  console.log("reservationWriteProcess 들어옴...")
  req.on('data' , async function(data){        
    let jsonData = qs.parse(data.toString());
    let ridx = jsonData.ridx;
    let roomNm = jsonData.roomNm;
    let stime = jsonData.stime;
    let duration = jsonData.duration;
    let people = jsonData.people;
    let expense = jsonData.expense;
    let reserve = jsonData.reserve;
    let memo = jsonData.memo;
    let midx = req.session.idx
    console.log("reservationWriteProcess ridx,stime,duration,people,expense,reserve,memo,midx",ridx, stime, duration, people, expense,reserve, memo, midx);
    if(checkNull(stime)){
      return res.json({'result' : 'fail','msg':'사용 일자 및 시간을 입력해주세요.'}); 
    };
    if(checkDateTime(stime)){
      return res.json({'result' : 'fail','msg':'올바르지 않은 날짜 형식입니다.'});
    };
    if(!dupleReservation) await sampleDAO.insertReservation(ridx, stime, duration, people, expense, memo, midx)
    dupleReservation = true;
    await sampleDAO.updatePoint(midx,reserve)
    await sampleDAO.insertPointlog(midx,'방 결제 적립','1',reserve)
    return res.json({'result' : 'success'});
  })
})
sv.router.get("/countAlarm", async function (req, res) {
  let alarm = await sampleDAO.alarmcount(req.query.idx);
  return res.json({'result' : 'success', 'alarm':alarm[0]});
});
//================================(Api - 이용약관)
sv.router.get("/api/terms", async function (req, res) {
  let list =await sampleDAO.terms();
  res.render('api/api-terms', 
  {rows : list,session : req.session});
})
//================================
function checkNull(str){ // 빈값인지 체크하는 함수 
  return str == null || str == "";
}
function checkPhone(str) {
  var regExp = /^01([0|1|6|7|8|9])-?([0-9]{3,4})-?([0-9]{4})$/;
  return !regExp.test(str); // 형식에 맞는 경우 false 리턴
 }
 function checkDate(str) {
  var dayRegExp = /^(19|20|21)\d{2}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[0-1])$/;
  return !dayRegExp.test(str); // 형식에 맞는 경우 false 리턴
 }
 function checkDateTime(str) {
  var dateTimeRegExp = /^(19|20)\d{2}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[0-1])T([1-9]|[01][0-9]|2[0-3]):([0-5][0-9])$/;
  return !dateTimeRegExp.test(str); // 형식에 맞는 경우 false 리턴
 }
 function getfilename(name){
  var parts = name.split('.');
  return parts[parts.length - 1];
}
function isImage(name){
  var name = getfilename(name);
  switch(name.toLowerCase()){
    case 'jpg':
    case 'gif':
    case 'bmp':
    case 'png':
      return true;
  }
  return false;
}
function isVideo(name){
  var name = getfilename(name);
  switch(name.toLowerCase()){
    case 'm4v':
    case 'avi':
    case 'mpg':
    case 'mp4':
      return true;
  }
  return false;
}
module.exports = MainController;