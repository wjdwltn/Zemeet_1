sv = require("../server")
sampleDAO = require("../dbutil")
const { json } = require("express/lib/response");
const fs = require("fs");
const multer = require("multer");
const multiparty = require("multiparty");
const { off } = require("process");
const qs = require('querystring'); //json data parse 
sampleDAO.init()

var MainController={}

//================================(메인페이지)
sv.router.get("/admin/login", async function (req, res) {
  res.render('admin/login');
});
sv.router.post("/admin/loginProcess", function (req, res) {  
  console.log(req.body);
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
  let checkAdmin = await sampleDAO.checkAdmin(id , pw);
  if(checkAdmin[0] == null){ // 로그인 정보없음 
    return res.json({'result' : 'fail','msg':'회원정보가 없습니다 \n아이디 혹은 비밀번호를 확인해주세요.'});
  }else{ // 로그인 완료
      // 세션에 회원 정보 저장      
      req.session.adminIdx = checkAdmin[0].idx;      
      req.session.adminLogin = true;
      return res.json({'result':'success'})
  }
}
sv.router.get("/admin/logout" , async function(req,res){
  delete req.session.adminIdx;
  delete req.session.id;
  delete req.session.pw;  
  delete req.session.adminLogin;  
  res.redirect('/admin/login') ;
})
sv.router.get("/admin/register", async function (req, res) {
  res.render('admin/register');
});
//================================(예약관리)
sv.router.get("/admin/reservation", async function (req, res) {
  let reservationList = await sampleDAO.listResevation();  
  res.render('admin/reservation', {list:JSON.stringify(reservationList)});
});
sv.router.get("/admin/reservation_list", async function (req, res) {  
  if(req.query.countperpage == undefined) // 페이지 당 게시물 수
      req.query.countperpage = 20
  if(req.query.page == undefined) // 기본 페이지
      req.query.page = 0
  let countperpage = parseInt(req.query.countperpage) 
  let page = parseInt(req.query.page)  
  let searchType = req.query.type; // 검색타입
  let statusType = req.query.status //예약상태
  let search = req.query.searchWord; // 검색어
  let sdate = req.query.sdate //시작검색일
  let edate = req.query.edate //종료검색일
  let result = req.query.result //과거 혹은 현재 내역 선택
  console.log("result:",result)
  let list =await sampleDAO.selectPagingReservation(page,countperpage ,searchType,search,sdate,edate,result,statusType)
  let rt = await sampleDAO.selectPagingTotalReservation(searchType,search,sdate,edate,result,statusType)
  console.log("@@@@",Math.ceil(rt[0].count/countperpage))
  res.render('admin/reservation_list',{rows: list, page:page,totalitems:rt[0].count,countperpage:countperpage,search:search,searchType:searchType,statusType:statusType,sdate:sdate,edate:edate,result:result});
})
sv.router.get("/admin/reservation_detail", async function (req, res) {
  let result = req.query.result;
  console.log("result,",result)
  let reservationDetail = await sampleDAO.listReservationIdx(req.query.idx);
  let jsondata = {'stime':reservationDetail[0].stime+'','duration' : reservationDetail[0].duration}
  res.render('admin/reservation_detail', {info:reservationDetail[0], jsInfo : JSON.stringify(jsondata), result : result});
});
sv.router.get("/admin/deleteReservation", async function (req, res) {
  let result = req.query.result;
  console.log("result,m,,",result)
  await sampleDAO.deleteReservation(req.query.idx)
  res.redirect('reservation_list?result='+result)
});
sv.router.get("/admin/reservation_update", async function (req, res) {
  let result = req.query.result;
  let reservationDetail = await sampleDAO.listReservationIdx(req.query.idx);
  res.render('admin/reservation_update', {info:reservationDetail[0], result : result}) 
});
sv.router.post("/admin/reservationUpdateProcess", async function (req,res){
  req.on('data' , async function(data){    
    let jsonData = qs.parse(data.toString());
    let idx = jsonData.idx;//수정하려는 본인 idx
    console.log("idx:",idx)
    let roomNm = jsonData.roomNm;
    if(checkNull(roomNm)){
      return res.json({'result' : 'fail','msg':'방 번호를 입력해주세요.'});
    };
    let ridx_x = await sampleDAO.listRoomNm(roomNm);
    let ridx = ridx_x[0].idx;
    let stime = jsonData.stime;
    let duration = jsonData.duration;
    let people = jsonData.people;
    let memo = jsonData.memo;
    let reason = jsonData.reason;
    let ctime = jsonData.ctime;
    let status = jsonData.status;
    var startT = stime.replace('T', ' ');
    console.log("start,",startT);
    var date = new Date(stime.replace('T', ' '));
    var endT = new Date(date.setTime(date.getTime() + (duration*60*1000))).toLocaleString('sv');
    console.log("endt",endT);
    console.log("data,",date)
    let resv = await sampleDAO.listReservationDuplCheck(ridx,startT,endT,idx);
    if(checkNull(stime)){
      return res.json({'result' : 'fail','msg':'예약 날짜와 시간을 입력해주세요.'});
    };
    if(checkDateTime(stime)){
      return res.json({'result' : 'fail','msg':'올바르지 않은 날짜 형식입니다.'});
    };
    if(checkNull(duration)){
      return res.json({'result' : 'fail','msg':'이용시간을 입력해주세요.'});
    };
    if(checkNull(people)){
      return res.json({'result' : 'fail','msg':'이용 인원을 입력해주세요.'});
    };
    if(status == 1){
      if(checkNull(reason)){
        return res.json({'result' : 'fail','msg':'취소 사유를 입력해주세요.'});
      };
      if(checkNull(ctime)){
        return res.json({'result' : 'fail','msg':'취소 시간을 입력해주세요.'});
      };
      if(checkDateTime(endT)){
        return res.json({'result' : 'fail','msg':'올바르지 않은 날짜 형식입니다.'});
      };
    }

    if(resv[0].count == 0){
      sampleDAO.updateReservation(idx, ridx, stime, duration, people ,memo, status, reason, ctime)
      return res.json({'result' : 'success','msg':'수정 완료되었습니다.'});    
    } else {
      return res.json({'result' : 'fail','msg':'해당시간에 이미 예약된 방입니다.'});
    }
  })
})
//================================(정산)
sv.router.get("/admin/calculate", async function (req, res) {  
  if(req.query.countperpage == undefined) // 페이지 당 게시물 수
      req.query.countperpage = 20
  if(req.query.page == undefined) // 기본 페이지
      req.query.page = 0
  let countperpage = parseInt(req.query.countperpage) 
  let page = parseInt(req.query.page)  
  // let searchType = req.query.type; // 검색타입
  let statusType = req.query.status //조회상태
  // let search = req.query.searchWord; // 검색어
  let sdate = req.query.sdate //시작검색일
  let edate = req.query.edate //종료검색일
  let sdate_month = req.query.sdate_month //시작검색일
  let edate_month = req.query.edate_month //종료검색일
  let list =await sampleDAO.selectPagingCalculate(page,countperpage ,sdate,edate,sdate_month,edate_month,statusType)
  // let rt = await sampleDAO.selectPagingTotalCalculate(sdate,edate,sdate_month,edate_month,statusType)
  // console.log("@@@@",Math.ceil(rt[0].count/countperpage))
  //{rows: list, page:page,totalitems:rt[0].count,countperpage:countperpage,search:search,searchType:searchType,statusType:statusType,sdate:sdate,edate:edate,result:result}
  res.render('admin/calculate',{rows: list,countperpage:countperpage,page:page,statusType:statusType,sdate:sdate,edate:edate,sdate_month:sdate_month,edate_month:edate_month});
})
sv.router.get("/admin/calculate_detail", async function (req, res) {
  if(req.query.countperpage == undefined)
      req.query.countperpage = 10
  if(req.query.page == undefined)
      req.query.page = 0
  let countperpage = parseInt(req.query.countperpage)
  let page = parseInt(req.query.page)
  let date = req.query.date;
  if(date.length!=7){
    date = dateFormat(date)
  }
  console.log("dateee",date)
  console.log("date.length",date.length)
  let list =await sampleDAO.selectPagingcalculate_detail(page,countperpage,date,date.length)
  let rt = await sampleDAO.selectPagingTotalcalculate_detail(date,date.length)
  res.render('admin/calculate_detail',
  {list: list,page:page,totalitems:rt[0].count, countperpage:countperpage,date:date})
})
//================================(Q&A)
sv.router.get("/admin/qa", async function (req, res) {
  if(req.query.countperpage == undefined)
      req.query.countperpage = 10
  if(req.query.page == undefined)
      req.query.page = 0
  let countperpage = parseInt(req.query.countperpage)
  let page = parseInt(req.query.page)
  let searchCateType = req.query.Catetype; // 장르 검색타입
  let searchCheckType = req.query.Checktype; // 난이도 검색타입
  let search = req.query.searchWord; // 검색어 
  let list =await sampleDAO.selectPagingQuestion(page,countperpage,searchCateType,searchCheckType,search)
  let rt = await sampleDAO.selectPagingTotalQuestion(searchCateType,searchCheckType,search)
  res.render('admin/qa',
      { list: list, page:page,totalitems:rt[0].count, countperpage:countperpage, searchCateType:searchCateType, searchCheckType:searchCheckType,search:search })
})
sv.router.get("/admin/qa_detail", async function (req, res) { //(게시글 상세보기)
  let menudetail = await sampleDAO.listQuestion(req.query.idx);
  res.render('admin/qa_detail', {info:menudetail[0]});
});
sv.router.get("/admin/deleteQuestion", async function (req, res) {
  await sampleDAO.deleteQuestion(req.query.idx)
  return res.json({'result' : 'success','msg':'삭제완료되었습니다.'});
});
sv.router.get("/admin/qa_answer", async function (req, res) { //(게시글 수정 페이지)
  let info = await sampleDAO.listQuestion(req.query.idx);
  res.render('admin/qa_answer', {info:info[0]});
})
sv.router.post("/admin/answerQuestion", async function (req, res) {
  req.on('data' , async function(data){    
    let jsonData = qs.parse(data.toString());   
    let idx= jsonData.idx;ㄹ
    let anscontent = jsonData.anscontent;
    if(checkNull(anscontent)){
      return res.json({'result' : 'fail','msg':'내용을 입력해주세요.'});
    };
    sampleDAO.answerQuestion(idx,anscontent)
  return res.json({'result' : 'success','msg':'답변 완료되었습니다.','idx':idx});    
  })
});
sv.router.get("/admin/answeralarm", async function (req, res) {
  let idx =  await sampleDAO.qa_idx(req.query.qa)
  await sampleDAO.registerAlarm_qa(idx[0].idx)
  return res.json({'result' : 'success','idx':idx});
});
//================================(공지사항)
sv.router.get("/admin/notice", async function (req, res) {
  if(req.query.countperpage == undefined)
      req.query.countperpage = 10
  if(req.query.page == undefined)
      req.query.page = 0
  let countperpage = parseInt(req.query.countperpage)
  let page = parseInt(req.query.page)
  let search = req.query.searchWord; // 검색어 
  let list =await sampleDAO.selectPagingNotice(page,countperpage,search)
  let rt = await sampleDAO.selectPagingTotalNotice(search)
  res.render('admin/notice',
      { list: list, page:page,totalitems:rt[0].count, countperpage:countperpage, search:search })
})
sv.router.get("/admin/notice_write", async function (req, res) { //(게시글 작성 페이지)
  res.render('admin/notice_write');
});
sv.router.post("/noticeInsertProcess", function (req,res){
  req.on('data' , async function(data){    
    let jsonData = qs.parse(data.toString());    
    let title = jsonData.title;
    let content = jsonData.content;
    if(checkNull(title)){
      return res.json({'result' : 'fail','msg':'제목을 입력해주세요.'});
    };
    if(checkNull(content)){
      return res.json({'result' : 'fail','msg':'내용을 입력해주세요.'});
    };
   
    sampleDAO.insertNotice(title,content);
     return res.json({'result' : 'success','msg':'게시물 등록이 완료되었습니다.'});
  })
})
sv.router.get("/admin/notice_update", async function (req, res) { //(게시글 수정 페이지)
  let info = await sampleDAO.listNotice(req.query.idx);
  res.render('admin/notice_update', {rows:info[0], idx:req.query.idx});
})
sv.router.get("/admin/inputNotice", async function (req, res) { //(게시글 작성하기)
  await sampleDAO.insertNotice(req.query.title, req.query.writer, req.query.date, req.query.count, req.query.content)
  res.redirect('/notice') 
});
sv.router.get("/admin/notice_detail", async function (req, res) { //(게시글 상세보기)
  let list = await sampleDAO.listNotice(req.query.idx); //idx에 해당하는 인자 값을 요청하도록 함
  res.render('admin/notice_detail',{info:list[0]});
});

sv.router.post("/admin/updateNotice", async function (req, res) {
  req.on('data' , async function(data){    
    let jsonData = qs.parse(data.toString());   
    let idx= jsonData.idx;
    let title = jsonData.title;
    let content = jsonData.content;
    if(checkNull(title)){
      return res.json({'result' : 'fail','msg':'제목을 입력해주세요.'});
    };
    if(checkNull(content)){
      return res.json({'result' : 'fail','msg':'내용을 입력해주세요.'});
    };
    sampleDAO.updateNotice(idx, title, content)
  return res.json({'result' : 'success','msg':'수정 완료되었습니다.','idx':idx});    
  })
});
sv.router.get("/admin/deleteNotice", async function (req, res) {
  await sampleDAO.deleteNotice(req.query.idx)
  return res.json({'result' : 'success','msg':'삭제완료되었습니다.'});
});
//=================================================(이벤트)
sv.router.get("/admin/event", async function (req, res) {
  if(req.query.countperpage == undefined)
      req.query.countperpage = 10
  if(req.query.page == undefined)
      req.query.page = 0
  let countperpage = parseInt(req.query.countperpage)
  let page = parseInt(req.query.page)
  let searchProcessType = req.query.ProcessType; // 장르 검색타입
  let search = req.query.searchWord; // 검색어 
  let today = new Date()
  let today_ = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().slice(0,10)
  let list =await sampleDAO.selectPagingEvent(page,countperpage,searchProcessType,search)
  let rt = await sampleDAO.selectPagingTotalEvent(searchProcessType,search,today)
  console.log("today_:",today_)
  res.render('admin/event',
      { list: list, page:page,totalitems:rt[0].count, countperpage:countperpage, searchProcessType:searchProcessType,search:search, today:today_ })
})
sv.router.get("/admin/event_write", async function (req, res) { //(게시글 작성 페이지)
  res.render('admin/event_write');
});
sv.router.post("/admin/eventWriteProcess", async function (req,res){
  req.on('data' , async function(data){    
    let jsonData = qs.parse(data.toString());
    let today = new Date(+new Date() + 3240 * 10000).toISOString().split("T")[0];
    let title = jsonData.title;
    let content = jsonData.content;
    let start = jsonData.start;
    let end = jsonData.end;
    if(checkNull(title)){
      return res.json({'result' : 'fail','msg':'제목을 입력해주세요.'});
    };
    if(checkNull(content)){
      return res.json({'result' : 'fail','msg':'내용을 입력해주세요.'});
    };
    if(checkNull(start)){
      return res.json({'result' : 'fail','msg':'시작일을 설정해주세요.'});
    };
    if(checkNull(end)){
      return res.json({'result' : 'fail','msg':'종료일을 설정해주세요.'});
    };
    let st = new Date(+new Date(start) + 3240 * 10000).toISOString().split("T")[0];
    let ed = new Date(+new Date(end) + 3240 * 10000).toISOString().split("T")[0];
    if(st<today){
      return res.json({'result' : 'fail','msg':'날짜를 정확하게 선택해주세요'});
    };
    if(ed<today){
      return res.json({'result' : 'fail','msg':'날짜를 정확하게 선택해주세요'});
    };
    if(st>ed){
      return res.json({'result' : 'fail','msg':'시작일과 종료일을 정확하게 선택해주세요'});
    };
    sampleDAO.insertEvent(title,content,start,end)
    return res.json({'result' : 'success','msg':'등록 완료되었습니다.'}); 
  })
})
sv.router.get("/admin/event_detail", async function (req, res) { //(게시글 상세보기)
  let list = await sampleDAO.listEvent(req.query.idx); //idx에 해당하는 인자 값을 요청하도록 함
  let today = new Date()
  let today_ = dateFormat(today)
  console.log("today:",today_)
  res.render('admin/event_detail',{rows:list[0], today:today_ });
});
sv.router.get("/admin/event_update", async function (req, res) { //(게시글 수정 페이지)
  let info = await sampleDAO.listEvent(req.query.idx);
  res.render('admin/event_update', {rows:info[0]});
})

sv.router.post("/admin/updateEvent", async function (req, res) {
  req.on('data' , async function(data){    
    let jsonData = qs.parse(data.toString());   
    let idx= jsonData.idx;
    let title = jsonData.title;
    let content = jsonData.content;
    let start = jsonData.start;
    let end = jsonData.end;
    let today = new Date(+new Date() + 3240 * 10000).toISOString().split("T")[0];
    if(checkNull(title)){
      return res.json({'result' : 'fail','msg':'제목을 입력해주세요.'});
    };
    if(checkNull(content)){
      return res.json({'result' : 'fail','msg':'내용을 입력해주세요.'});
    };
    if(checkNull(start)){
      return res.json({'result' : 'fail','msg':'시작일을 설정해주세요.'});
    };
    if(checkNull(end)){
      return res.json({'result' : 'fail','msg':'종료일을 설정해주세요.'});
    };
    // let st = new Date(+new Date(start) + 3240 * 10000).toISOString().split("T")[0];
    // let ed = new Date(+new Date(end) + 3240 * 10000).toISOString().split("T")[0];
    if(start>end){
      return res.json({'result' : 'fail','msg':'시작일과 종료일을 정확하게 선택해주세요'});
    };
    console.log("start",start)
    console.log("end",end)
    sampleDAO.updateEvent(title, content, start, end, idx)
    return res.json({'result' : 'success','msg':'수정 완료되었습니다.','idx':idx});    
  })
});
sv.router.get("/admin/deleteEvent", async function (req, res) {
  await sampleDAO.deleteEvent(req.query.idx)
  return res.json({'result' : 'success','msg':'삭제완료되었습니다.'});
});
//==============================================(이용약관)
sv.router.get("/admin/terms", async function (req, res) {
  let list = await sampleDAO.terms(); 
  res.render('admin/terms', {list:list});
});
sv.router.get("/admin/terms_write", async function (req, res) { //(게시글 작성 페이지)
  res.render('admin/terms_write');
});
sv.router.post("/admin/insertTerms", async function (req, res) {
  let body = '';
  req.on('data',function(data){
    body += data;
  });
  req.on('end',function(){
    let jsonData = qs.parse(body.toString());
    let title = jsonData.title;
    let content = jsonData.content;
    content = content.replace(/\'/gi ,'&#39;' )
    if(checkNull(title)){
      return res.json({'result' : 'fail','msg':'제목을 입력해주세요.'});
    };
    if(checkNull(content)){
      return res.json({'result' : 'fail','msg':'내용을 입력해주세요.'});
    };
    sampleDAO.insertTerms(title, content)
    return res.json({'result' : 'success','msg':'등록 완료되었습니다.' });
  })
});  

sv.router.get("/admin/terms_detail", async function (req, res) { //(게시글 상세보기)
  let list = await sampleDAO.terms(); //idx에 해당하는 인자 값을 요청하도록 함
  res.render('admin/terms_detail',{info:list[0]});
});
sv.router.get("/admin/deleteTemrs", async function (req, res) {
  await sampleDAO.deleteTemrs()
  return res.json({'result' : 'success','msg':'삭제완료되었습니다.'});
});
sv.router.get("/admin/terms_update", async function (req, res) { //(게시글 수정 페이지)
  let info = await sampleDAO.terms();
  res.render('admin/terms_update', {rows:info[0]});
})

sv.router.post("/admin/updateTerms", async function (req, res) {
  let body = '';
  req.on('data',function(data){
    body += data;
  });
  req.on('end',function(){
    let jsonData = qs.parse(body.toString());
    let title = jsonData.title;
    let content = jsonData.content;
    content = content.replace(/\'/gi ,'&#39;' )
    if(checkNull(title)){
      return res.json({'result' : 'fail','msg':'제목을 입력해주세요.'});
    };
    if(checkNull(content)){
      return res.json({'result' : 'fail','msg':'내용을 입력해주세요.'});
    };
    sampleDAO.updateTerms(title, content)
    return res.json({'result' : 'success','msg':'수정이 완료되었습니다.' });
  })
});

//=================================================(메뉴 관리)

// - - - <<storage 세팅>>
var storage3 = multer.diskStorage({
  destination(req , file , cb){ // 저장경로
    cb(null , 'C:/upload/zemeet/uploadedMenuFiles/');
  },
  filename(req,file,cb){ // 저장될 파일이름 
    // 파일명이 겹치는걸 방지해서 날짜를 넣음
    cb(null, `${Date.now()}__${file.originalname}`);
  }
})
var upload3 = multer({storage:storage3});
// - - - <<등록>>

sv.router.get("/admin/menuFileDeleteProcess" ,async function (req,res){  
  let idx = req.query.idx; // get방식으로보냄 => queryString으로 오니까 req.query로 데이터 받음   
  let fileInfo = await sampleDAO.selectMenuFileDetail(idx);
  if(fs.existsSync('uploadedMenuFiles/'+fileInfo[0].pic)){ // 업로드파일에 사진이 존재하면 
    fs.unlinkSync('uploadedMenuFiles/'+fileInfo[0].pic); // 해당파일 삭제 
  }
  sampleDAO.deleteMenuFile(idx); // TB에서만 지움 
  return res.json({'result' : 'success','msg':'삭제완료되었습니다.'});
})
//===============================================================
//===============================================================(게임 관리)
sv.router.get("/admin/game", async function (req, res) {
  if(req.query.countperpage == undefined)
      req.query.countperpage =10
  if(req.query.page == undefined)
      req.query.page = 0
  let countperpage = parseInt(req.query.countperpage)
  let page = parseInt(req.query.page)
  let searchGenreType = req.query.Genretype; // 장르 검색타입
  let searchLevelType = req.query.Leveltype; // 난이도 검색타입
  let search = req.query.searchWord; // 검색어 
  let list =await sampleDAO.selectPagingGame(page,countperpage,searchGenreType,searchLevelType,search)
  let rt = await sampleDAO.selectPagingTotalGame(searchGenreType,searchLevelType,search)
  res.render('admin/game',
  {list: list, page:page,totalitems:rt[0].count, countperpage:countperpage  , search : search , searchGenreType:searchGenreType ,searchLevelType:searchLevelType })
})
var storage1 = multer.diskStorage({
  destination(req , file , cb){ // 저장경로
    cb(null , 'C:/upload/zemeet/uploadedGameFiles/');
  },
  filename(req,file,cb){ // 저장될 파일이름 
    // 파일명이 겹치는걸 방지해서 날짜를 넣음
    cb(null, `${Date.now()}__${file.originalname}`);
  }
})
var upload1 = multer({storage:storage1});
sv.router.get("/admin/game_que", async function (req, res) { //(게시글 상세보기)
  let gidx = req.query.gidx; // 게임 idx 
  console.log("gidx::",gidx)
  if(req.query.countperpage == undefined)
  req.query.countperpage = 10
  if(req.query.page == undefined)
  req.query.page = 0
  let countperpage = parseInt(req.query.countperpage)
  let page = parseInt(req.query.page)
  let list =await sampleDAO.selectPagingGame_q(page,countperpage, gidx)
  console.log('gidx : ' + gidx);
  let rt = await sampleDAO.selectPagingTotalGame_q(gidx)
  console.log("rt",rt)
  console.log("count",rt[0].count)
  res.render('admin/game_que',
  {list: list, page:page,totalitems:rt[0].count, countperpage:countperpage , gidx : gidx})
});

sv.router.get("/admin/game_qwrite", async function (req, res) { //(게시글 작성 페이지)
  let gidx = req.query.gidx;
  let gamedetail = await sampleDAO.listGame2(gidx);
  res.render('admin/game_qwrite',{'gamedetail':gamedetail[0]});
});

sv.router.post("/admin/game_quewrite",function (req,res){//게임 자주묻는질문 등록
  req.on('data' , async function(data){    
    let jsonData = qs.parse(data.toString());    
    let idx_ = jsonData.gidx;
    let que = jsonData.que;
    let ans = jsonData.ans;
    if(checkNull(que)){
      return res.json({'result' : 'fail','msg':'질문을 입력해주세요.'});
    };
    if(checkNull(ans)){
      return res.json({'result' : 'fail','msg':'답변을 입력해주세요.'});
    }
    console.log('insert 전')
    sampleDAO.insertGameque(idx_,que,ans);
    console.log('insert 후')
    return res.json({'result' : 'success','msg':'게시물 등록이 완료되었습니다.' });

})
  
})
sv.router.get("/admin/game_write", async function (req, res) { //(게시글 작성 페이지)
  res.render('admin/game_write');
});
-sv.router.post("/admin/gameFileProcess", upload1.fields([{ name: 'pic' }, { name: 'vid' }]),function (req,res){//게임 등록  
  //console.log("file",req.files.vid)
  console.log(req.files);
  if(req.files.pic == null){
    return res.json({'result' : 'fail','msg':'메인 사진을 등록해주세요.'});
  } 
  let Kname = req.body.Kname
  let Ename = req.body.Ename
  let genre = req.body.genre
  let umin = req.body.umin
  let umax = req.body.umax
  let playtime = req.body.playtime
  let explantime = req.body.explantime
  let level = req.body.level
  let loc = req.body.loc
  let simexplan = req.body.simexplan
  let vid = req.files.vid
  let vname = '';
  if(vid != null) vname = vid[0].filename;
  let explan = req.body.explan
  console.log("umax:",umax)
  if(checkNull(Kname)){
    return res.json({'result' : 'fail','msg':'한글 게임 이름을 입력해주세요.'});
  };
  if(checkNull(Ename)){
    return res.json({'result' : 'fail','msg':'영문 게임 이름을 입력해주세요.'});
  };
  if(checkNull(genre)){
    return res.json({'result' : 'fail','msg':'장르를 선택해주세요.'});
  };
  if(checkNull(umin)){
    return res.json({'result' : 'fail','msg':'최소인원을 선택해주세요.'});  
  };
  if(checkNull(umax)){
    return res.json({'result' : 'fail','msg':'최대인원을 선택해주세요.'});  
  };
  if(checkNull(playtime)){
    return res.json({'result' : 'fail','msg':'플레이시간을 입력해주세요.'});  
  };
  if(checkNull(explantime)){
    return res.json({'result' : 'fail','msg':'설명시간을 입력해주세요.'});  
  };
  if(checkNull(level)){
    return res.json({'result' : 'fail','msg':'난이도를 선택해주세요.'});  
  };
  if(checkNull(loc)){
    return res.json({'result' : 'fail','msg':'진열위치을 입력해주세요.'});  
  };
  if(checkNull(simexplan)){
    return res.json({'result' : 'fail','msg':'한 줄 설명을 입력해주세요.'});  
  };
  if(umin>umax){
    return res.json({'result' : 'fail','msg':'최소 인원과 최대 인원이 올바르지 않습니다. 다시 설정해주세요.'});
  };
  
  sampleDAO.insertGameFile(req.files.pic[0].filename,Kname,Ename,genre,umin,umax,playtime,explantime,level,loc,simexplan,vname,explan);
  return res.json({'result' : 'success','msg':'게시물 등록이 완료되었습니다.'});
})
sv.router.get("/admin/game_qdetail", async function (req, res) { //(게시글 상세보기)
  let gamedetail = await sampleDAO.listGame3(req.query.idx);
  res.render('admin/game_qdetail', {info:gamedetail[0]});
});

sv.router.get("/admin/game_detail", async function (req, res) { //(게시글 상세보기)
  let gamedetail = await sampleDAO.listGame2(req.query.idx);
  
  res.render('admin/game_detail', {info:gamedetail[0]});
});
sv.router.get("/admin/game_update", async function (req, res) { //(게시글 상세보기)
  let list = await sampleDAO.listGame2(req.query.idx); //idx에 해당하는 인자 값을 요청하도록 함
  console.log("hi~~~~~~~~",list)
   res.render('admin/game_update',
   {rows:list[0]});
});
sv.router.get("/admin/game_qupdate", async function (req, res) { //(게시글 상세보기)
  let list = await sampleDAO.listGame3(req.query.idx); //idx에 해당하는 인자 값을 요청하도록 함
  console.log("hi~~~~~~~~",list)
   res.render('admin/game_qupdate',
   {rows:list[0]});
});

sv.router.post("/admin/updateGame",  upload1.fields([{ name: 'pic' }, { name: 'vid' }])  ,async function (req, res) { // 게임 목록 수정
  let pic = req.files.pic;
  let vpic ='';
  if(pic != null) vpic = pic[0].filename;
  let Kname = req.body.Kname;
  let Ename = req.body.Ename;
  let genre = req.body.genre
  let umin = req.body.umin
  let umax = req.body.umax
  let playtime = req.body.playtime
  let explantime = req.body.explantime
  let level = req.body.level
  let loc = req.body.loc
  let simexplan = req.body.simexplan
  let vid = req.files.vid
  let vname = '';
  if(vid != null) vname = vid[0].filename;
  let explan = req.body.explan
  if(checkNull(Kname)){
    return res.json({'result' : 'fail','msg':'한글 게임 이름을 입력해주세요.'});
  };
  if(checkNull(Ename)){
    return res.json({'result' : 'fail','msg':'영문 게임 이름을 입력해주세요.'});
  };
  if(checkNull(genre)){
    return res.json({'result' : 'fail','msg':'장르를 선택해주세요.'});
  };
  if(checkNull(umin)){
    return res.json({'result' : 'fail','msg':'최소인원을 선택해주세요.'});  
  };
  if(checkNull(umax)){
    return res.json({'result' : 'fail','msg':'최대인원을 선택해주세요.'});  
  };
  if(checkNull(playtime)){
    return res.json({'result' : 'fail','msg':'플레이시간을 입력해주세요.'});  
  };
  if(checkNull(explantime)){
    return res.json({'result' : 'fail','msg':'설명시간을 입력해주세요.'});  
  };
  if(checkNull(level)){
    return res.json({'result' : 'fail','msg':'난이도를 선택해주세요.'});  
  };
  if(checkNull(loc)){
    return res.json({'result' : 'fail','msg':'진열위치을 입력해주세요.'});  
  };
  if(checkNull(simexplan)){
    return res.json({'result' : 'fail','msg':'한 줄 설명을 입력해주세요.'});  
  };
  if(umin>umax){
    return res.json({'result' : 'fail','msg':'최소 인원과 최대 인원이 올바르지 않습니다. 다시 설정해주세요.'});
  };
  
  if(pic == null){ // 새사진 X 
    vpic=req.body.originFile;
    if(vid == null) {
      console.log("둘다기존")
      vname=req.body.originFilevid;
      sampleDAO.updateGame(vpic,Kname,Ename,genre,umin,umax,playtime,explantime,level,loc,simexplan,vname,explan,req.body.idx);
    }
    else{
      vname=vid[0].filename;
      console.log("비디오만바꿈")
      sampleDAO.updateGame(vpic,Kname,Ename,genre,umin,umax,playtime,explantime,level,loc,simexplan,vname,explan,req.body.idx);
    }
  }
  else{
    vpic=pic[0].filename;
    if(vid == null) {
      console.log("사진만바꿈")
      vname=req.body.originFilevid;
      sampleDAO.updateGame(vpic,Kname,Ename,genre,umin,umax,playtime,explantime,level,loc,simexplan,vname,explan,req.body.idx);
    }
    else{
      console.log("둘다바꿈")
      vname=vid[0].filename;
      sampleDAO.updateGame(vpic,Kname,Ename,genre,umin,umax,playtime,explantime,level,loc,simexplan,vname,explan,req.body.idx);
    }
  }
  return res.json({'result' : 'success','msg':'수정완료되었습니다.'});
  //res.redirect('/game') 
});
sv.router.get("/admin/updateGame1",async function (req, res) { // 게임 목록 수정
  let idx = req.query.idx;
  let que=  req.query.que;
  let ans= req.query.ans;
  
  if(checkNull(que)){
    return res.json({'result' : 'fail','msg':'질문을 입력해주세요.'});
  };
  if(checkNull(ans)){
    return res.json({'result' : 'fail','msg':'답변을 입력해주세요.'});
  };
  sampleDAO.updateGame1(que,ans,idx)
  return res.json({'result' : 'success','msg':'수정 완료되었습니다.'});    
});

sv.router.get("/admin/deleteGame", async function (req, res) { // 게임 목록 삭제
  await sampleDAO.deleteGame(req.query.idx)
  return res.json({'result' : 'success','msg':'삭제완료되었습니다.'});
  //res.redirect('/notice') 
});
sv.router.get("/admin/deleteGame1", async function (req, res) { // 게임 목록 삭제
  await sampleDAO.deleteGame1(req.query.idx)
  return res.json({'result' : 'success','msg':'삭제완료되었습니다.'});
  //res.redirect('/notice') 
});
sv.router.get("/admin/inputGame", async function (req, res) { //(게시글 작성)
  await sampleDAO.insertGame(req.query.title, req.query.writer, req.query.date, req.query.count, req.query.content)
  res.redirect('/notice') 
});
sv.router.get("/admin/menu_write", async function (req, res) {
  res.render('admin/menu_write')
})

//===============================================================(방 관리)
sv.router.get("/admin/room", async function (req, res) {
  if(req.query.countperpage == undefined)
      req.query.countperpage = 10
  if(req.query.page == undefined)
      req.query.page = 0
  let countperpage = parseInt(req.query.countperpage)
  let page = parseInt(req.query.page)
  let list =await sampleDAO.selectPagingRoom(page,countperpage)
  let rt = await sampleDAO.selectPagingTotalRoom()
  let rows = await sampleDAO.listRoom()
  res.render('admin/room',
  {list: list, page:page,totalitems:rt[0].count, countperpage:countperpage, rows: rows})
})
sv.router.get("/admin/room_detail", async function (req, res) {
  let room_detail = await sampleDAO.listRoom1(req.query.idx);
  let room_Pic = await sampleDAO.listRoomPic(req.query.idx)
  res.render('admin/room_detail', {list:room_detail[0], rows:room_Pic});
});
sv.router.get("/admin/room_write", async function (req, res) {
  res.render('admin/room_write');
});

var storage2 = multer.diskStorage({
  destination(req , file , cb){ // 저장경로
    cb(null , 'C:/upload/zemeet/uploadedRoomFiles/');
  },
  filename(req,file,cb){
    cb(null, `${Date.now()}__${file.originalname}`);
  }
})
var upload2 = multer({storage:storage2});
sv.router.post("/admin/roomInfoProcess", upload2.array('file'), async function (req,res){  
    let files = req.files;
    console.log("files :::::::: " + files)
    let account = req.body.account;
    let name = req.body.name;
    let roomNm = req.body.roomNm;
    let peopleMin = req.body.peopleMin;
    let peopleMax = req.body.peopleMax;
    let TPRate = req.body.TPRate;
    let PPRate = req.body.PPRate;
    let price = req.body.price;
    let roomnumcheck = await sampleDAO.listRoomNm(roomNm);
    if(roomnumcheck.length!=0){
      return res.json({'result' : 'fail','msg':'중복된 방이 존재합니다. 방 번호를 다시 설정해주세요.'});
    }
    else{
      if(files.length == 0){
        return res.json({'result' : 'fail','msg':'사진을 등록해주세요.'});
      }
      if(checkNull(account)){
        return res.json({'result' : 'fail','msg':'방 설명을 입력해주세요.'});
      };
      if(checkNull(name)){
        return res.json({'result' : 'fail','msg':'방 이름을 입력해주세요.'});
      };
      if(checkNull(roomNm)){
        return res.json({'result' : 'fail','msg':'방 번호를 입력해주세요.'});
      };
      if(checkNull(peopleMin)){
        return res.json({'result' : 'fail','msg':'최소 이용가능 인원수를 입력해주세요.'});
      };
      if(checkNull(peopleMax)){
        return res.json({'result' : 'fail','msg':'최대 이용가능 인원수를 입력해주세요.'});
      };
      if(checkNull(price)){
        return res.json({'result' : 'fail','msg':'기본 가격을 입력해주세요.'});
      };
      if(checkNull(TPRate)){
        return res.json({'result' : 'fail','msg':'시간당 추가 금액을 입력해주세요.'});
      };
      if(checkNull(PPRate)){
        return res.json({'result' : 'fail','msg':'인원당 추가 금액을 입력해주세요.'});
      };
      if(isInt(roomNm)==false){
        return res.json({'result' : 'fail','msg':'방번호를 정확하게 입력해주세요.'});
      }
      if(peopleMin>peopleMax){
        return res.json({'result' : 'fail','msg':'인원수를 정확하게 설정해주세요.'});
      };
      if(isInt(price)==false){
        return res.json({'result' : 'fail','msg':'가격을 정확하게 입력해주세요.'});
      }
      let process = await sampleDAO.insertRoomInfo(account,name,roomNm,peopleMin,peopleMax,price,TPRate,PPRate);
      let ridx = process[0].idx;
      for(var i=0; i< files.length; i++){
        sampleDAO.insertRoomFiles(ridx, files[i].filename);
      }
      return res.json({'result' : 'success','msg':'방이 성공적으로 등록되었습니다.'});
    }
});
sv.router.get("/admin/room_update", async function (req, res) {
  let list = await sampleDAO.listRoom1(req.query.idx);
  let room_Pic = await sampleDAO.listRoomPic(req.query.idx)
   res.render('admin/room_update',
   {pics:room_Pic, rows:list[0]});
});
sv.router.post("/UpdateOneRoomProcess", upload2.single('file') , async function (req,res){
  let idx = req.query.subIdx;
  if(req.file == null){ 
    return res.json({'result' : 'fail','msg':'사진을 등록해주세요.'});
  }else{ // 새사진 O - 기존 사진은 삭제
    let fileInfo = await sampleDAO.selectOneRoomPic(idx);
    if(fs.existsSync('C:/upload/zemeet/uploadedRoomFiles/'+fileInfo[0].file)){ 
      fs.unlinkSync('C:/upload/zemeet/uploadedRoomFiles/'+fileInfo[0].file);
    }
    sampleDAO.updateOneRoomPic(idx , req.file.filename);
    return res.json({'result' : 'success','msg':'수정완료되었습니다.'});
  }    
})
sv.router.get("/DeleteOneRoomProcess" ,async function (req,res){  
  let idx = req.query.subIdx;  
  let fileInfo = await sampleDAO.selectOneRoomPic(idx);
  if(fs.existsSync('C:/upload/zemeet/uploadedRoomFiles/'+fileInfo[0].file)){ 
    fs.unlinkSync('C:/upload/zemeet/uploadedRoomFiles/'+fileInfo[0].file);
  }
  sampleDAO.deleteOneRoomPic(idx);
  return res.json({'result' : 'success','msg':'삭제되었습니다.'});
})
sv.router.get("/admin/deleteRoom", async function (req, res) { 
  let idx = req.query.idx;  
  let fileInfo = await sampleDAO.selectRoomPic(idx);
  if(fileInfo.length != null){
    for(var i=0; i< fileInfo.length; i++){
      if(fs.existsSync('C:/upload/zemeet/uploadedRoomFiles/'+fileInfo[i].file)){ // 업로드파일에 사진이 존재하면 
        fs.unlinkSync('C:/upload/zemeet/uploadedRoomFiles/'+fileInfo[i].file); // 해당파일 삭제 
      }
    }
  }
  await sampleDAO.deleteRoom(idx);
  return res.json({'result' : 'success','msg':'삭제되었습니다.'});
});
sv.router.post("/admin/roomUpdateProcess", upload2.array('file'), async function (req,res){  
  let idx = req.body.idx
  let account = req.body.account;
  let name = req.body.name;
  let roomNm = req.body.roomNm;
  let peopleMin = req.body.peopleMin;
  let peopleMax = req.body.peopleMax;
  let TPRate = req.body.TPRate;
  let PPRate = req.body.PPRate;
  let price = req.body.price;
  console.log("integerm,",isInt(roomNm))
  let checkRoomNM =await sampleDAO.countDuplroomNm(roomNm,idx);
  if(checkNull(account)){
    return res.json({'result' : 'fail','msg':'방 설명을 입력해주세요.'});
  };
  if(checkNull(name)){
    return res.json({'result' : 'fail','msg':'방 이름을 입력해주세요.'});
  };
  if(checkRoomNM.count > 1){ // 중복된 방번호가 있을때 (기존 방 번호는 중복가능)
    return res.json({'result' : 'fail','msg':'방 번호를 입력해주세요.'});
  };
  if(checkNull(peopleMin)){
    return res.json({'result' : 'fail','msg':'최소 이용가능 인원수를 입력해주세요.'});
  };
  if(checkNull(peopleMax)){
    return res.json({'result' : 'fail','msg':'최대 이용가능 인원수를 입력해주세요.'});
  };
  if(checkNull(price)){
    return res.json({'result' : 'fail','msg':'기본 가격을 입력해주세요.'});
  };
  if(checkNull(TPRate)){
    return res.json({'result' : 'fail','msg':'시간당 추가 금액을 입력해주세요.'});
  };
  if(checkNull(PPRate)){
    return res.json({'result' : 'fail','msg':'인원당 추가 금액을 입력해주세요.'});
  };
  if(isInt(roomNm)==false){
    return res.json({'result' : 'fail','msg':'방번호를 정확하게 입력해주세요.'});
  }
  if(peopleMin>peopleMax){
    return res.json({'result' : 'fail','msg':'인원수를 정확하게 설정해주세요.'});
  };
  if(isInt(price)==false){
    return res.json({'result' : 'fail','msg':'가격을 정확하게 입력해주세요.'});
  }
  if(checkRoomNM[0].count != 0){ // 중복된 방번호가 있을때 (기존 방 번호는 중복가능)
    return res.json({'result' : 'fail','msg':'중복된 방이 존재합니다. 방 번호를 다시 설정해주세요.'});
  }else{
    await sampleDAO.updateRoomInfo(idx,account,name,roomNm,peopleMin,peopleMax,price,TPRate,PPRate);
    let files = req.files;
    let ridx = idx;
    if(files.length != null){
      for(var i=0; i< files.length; i++){
        sampleDAO.insertRoomFiles(ridx, files[i].filename);
      }
    }
    return res.json({'result' : 'success','msg':'성공적으로 수정되었습니다.','idx':idx});
  }
});
//-----------------------------------(방 사용 관리)
sv.router.get("/admin/roomlog", async function (req, res) {
  if(req.query.countperpage == undefined)
      req.query.countperpage = 10
  if(req.query.page == undefined)
      req.query.page = 0
  let countperpage = parseInt(req.query.countperpage)
  let page = parseInt(req.query.page)
  // let searchPaymentType = req.query.paymenttype; // 카테고리 검색타입
  let search = req.query.searchWord; // 검색어 
  let list =await sampleDAO.selectPagingRoomlog(page,countperpage,search)
  let rt = await sampleDAO.selectPagingTotalRoomlog(search)
  // console.log("search",search)
  // console.log("searchCateType",searchCateType)
  console.log("list",list)
  console.log("rt",rt)
  res.render('admin/roomlog',
  {list: list,page:page,totalitems:rt[0].count, countperpage:countperpage , search:search })
})
// ================================================= <<메인등록>>
// sv.router.post("/gameFileProcess", upload.single('gamePic'),function (req,res){
//   if(req.file == null){
//     return res.json({'result' : 'fail','msg':'메인 사진을 등록해주세요.'});
//   } 
//   let gameName = req.body.gameName;
//   let ranking = req.body.ranking
//   if(checkNull(gameName)){
//     return res.json({'result' : 'fail','msg':'게임명을 입력해주세요.'});
//   };
//   if(checkNull(ranking)){
//     return res.json({'result' : 'fail','msg':'순위를 입력해주세요.'});
//   };
//   sampleDAO.insertMenuFile(req.file.filename,menuName,price);
//   return res.json({'result' : 'success','msg':'게시물 등록이 완료되었습니다.'});
// })
// sv.router.get("/game_write", async function (req, res) {
//   res.render('admin/game_write');
// });
//================================(대기실 관리)
//================================(적립금 및 등급 관리)
sv.router.get("/admin/settings", async function (req, res) {
  let list =await sampleDAO.listSettings()
  res.render('admin/settings',{list:list[0]});
});
sv.router.post("/admin/settingsUpdateProcess", async function (req,res){
  req.on('data' , async function(data){    
    let jsonData = qs.parse(data.toString());
    let idx = jsonData.idx;
    let rrate = jsonData.rrate;
    let rankstand = jsonData.rankstand;
    if(checkNull(rrate)){
      return res.json({'result' : 'fail','msg':'포인트 적립률 입력해주세요.'});
    };
    if(checkNull(rankstand)){
      return res.json({'result' : 'fail','msg':'등급 기준액(최근 1년 간의 총 결제액)을 입력해주세요.'});
    };
    sampleDAO.updateSettings(idx, rrate, rankstand)
    return res.json({'result' : 'success','msg':'적용되었습니다.'});    
  })
})
//================================(pointlog)
sv.router.get("/admin/pointlog", async function (req, res) {
  if(req.query.countperpage == undefined)
      req.query.countperpage = 10
  if(req.query.page == undefined)
      req.query.page = 0
  let countperpage = parseInt(req.query.countperpage)
  let page = parseInt(req.query.page)
  let search = req.query.searchWord; // 검색어
  let list =await sampleDAO.selectPagingPointlog(page,countperpage,search)
  let rt = await sampleDAO.selectPagingTotalPointlog(search)
  res.render('admin/pointlog',
      { rows: list, page:page,totalitems:rt[0].count, countperpage:countperpage,search:search})
})
//================================(alarmlog)
sv.router.get("/admin/alarmlog", async function (req, res) {
  if(req.query.countperpage == undefined)
      req.query.countperpage = 10
  if(req.query.page == undefined)
      req.query.page = 0
  let countperpage = parseInt(req.query.countperpage)
  let page = parseInt(req.query.page)
  let search = req.query.searchWord; // 검색어
  let searchalarmType = req.query.alarmtype;
  console.log("search",searchalarmType)
  let list =await sampleDAO.selectPagingAlarmlog(page,countperpage,search,searchalarmType)
  let rt = await sampleDAO.selectPagingTotalAlarmlog(search,searchalarmType)
  res.render('admin/alarmlog',
      { rows: list, page:page,totalitems:rt[0].count, countperpage:countperpage,search:search,searchalarmType:searchalarmType})
})
//================================(To-do-list)
sv.router.get("/admin/todolist", async function (req, res) {
  if(req.query.countperpage == undefined)
      req.query.countperpage = 10
  if(req.query.page == undefined)
      req.query.page = 0
  let countperpage = parseInt(req.query.countperpage)
  let page = parseInt(req.query.page)
  let todoProcessType = req.query.todoDateType; // 장르 검색타입
  let list =await sampleDAO.selectPagingTodo(page,countperpage,todoProcessType)
  let rt = await sampleDAO.selectPagingTotalTodo(todoProcessType)
  console.log("rt",rt,rt.length)
  console.log("list",list)
  res.render('admin/todolist',
      { rows: list, page:page,totalitems:rt[0].count, countperpage:countperpage,todoProcessType:todoProcessType})
})
sv.router.post("/admin/insertTodo", async function (req,res){
  req.on('data' , async function(data){    
    let jsonData = qs.parse(data.toString());
    console.log("data",jsonData)
    let content = jsonData.content;
    let stime = jsonData.stime;
    let etime = jsonData.etime;
    let day = jsonData.day;
    var daylist=[];
    var gidx=0;
    let gidxGet = await sampleDAO.getGidx()
    if(gidxGet.length==0){
      gidx=0;
    }else{
      gidx=parseInt(gidxGet[0].gidx)+1;
    }
    if(checkNull(content)){
      return res.json({'result' : 'fail','msg':'내용을 입력해주세요.'});
    };
    if(checkNull(stime)){
      return res.json({'result' : 'fail','msg':'시작일을 설정해주세요.'});
    };
    if(checkNull(etime)){
      return res.json({'result' : 'fail','msg':'종료일을 설정해주세요.'});
    };
    if(checkNull(day)){
      return res.json({'result' : 'fail','msg':'반복일을 선택해주세요.'});
    };
    if(day[0]=='selday'){
      console.log("day",day)
      console.log("gidx",gidx)
      for(var i=1;i<day.length;i++){
        daylist.push(day[i])
      }
      console.log("daylist",daylist)
      sampleDAO.insertTodolist(content,gidx,stime, etime, daylist)    
    }else{
      console.log("gidxx",gidx)
      sampleDAO.insertTodolist(content,gidx,stime, etime, day)
    }
    return res.json({'result' : 'success','msg':'등록 완료되었습니다.'}); 
  })
})
sv.router.get("/admin/todoUpdate", async function (req, res) {
  let todo = await sampleDAO.listTodo(req.query.gidx);
  console.log("todo",todo)
  var dayarray=[];
  for(var i=0; i<(todo[0].day.length+1)/2;i++){
    day =parseInt(todo[0].day.split(',')[i])
    dayarray.push(day)
  }
  console.log("dayarray",dayarray)
  res.render('admin/todo_update', {todo:todo[0],dayarray:dayarray}) 
});
sv.router.get("/admin/getGidx", async function (req, res) {
  let gidxarray =  await sampleDAO.gidxArray(req.query.idx)
  res.render('admin/todolist',
      { 'list':gidxarray })
});
sv.router.get("/admin/updateTodo", async function (req, res) {
  await sampleDAO.updateTodo(req.query.idx, req.query.content, req.query.date, req.query.phonenum, req.query.check)
  res.redirect('/todolist') 
});
sv.router.get("/admin/deleteTodo", async function (req, res) {
  await sampleDAO.deleteTodo(req.query.idx)
  return res.json({'result' : 'success','msg':'삭제 완료되었습니다.'}); 
});
sv.router.post("/admin/todoUpdateProcess", async function (req,res){
  req.on('data' , async function(data){    
    let jsonData = qs.parse(data.toString());
    let content = jsonData.content;
    let stime = jsonData.stime;
    let etime = jsonData.etime;
    let day = jsonData.day;
    let gidx = jsonData.gidx;
    var daylist=[];
    await sampleDAO.deleteTodo_gidx(gidx)
    if(checkNull(content)){
      return res.json({'result' : 'fail','msg':'내용을 입력해주세요.'});
    };
    if(checkNull(stime)){
      return res.json({'result' : 'fail','msg':'시작일을 설정해주세요.'});
    };
    if(checkNull(etime)){
      return res.json({'result' : 'fail','msg':'종료일을 설정해주세요.'});
    };
    if(checkNull(day)){
      return res.json({'result' : 'fail','msg':'반복일을 선택해주세요.'});
    };
    if(stime>etime){
      return res.json({'result' : 'fail','msg':'시작일과 종료일을 정확하게 선택해주세요.'});
    }
    console.log("gidx",gidx)
    if(day[0]=='selday'){
      console.log("gidx",gidx)
      for(var i=1;i<day.length;i++){
        daylist.push(day[i])
      }
      await sampleDAO.insertTodolist(content,gidx,stime, etime, daylist)    
    }else{
      await sampleDAO.insertTodolist(content,gidx,stime, etime, day)
    }
    return res.json({'result' : 'success','msg':'수정 완료되었습니다.'});    
  })
})
//================================(todolog)
sv.router.get("/admin/todolog", async function (req, res) {
  if(req.query.countperpage == undefined)
      req.query.countperpage = 10
  if(req.query.page == undefined)
      req.query.page = 0
  let countperpage = parseInt(req.query.countperpage)
  let page = parseInt(req.query.page)
  let list =await sampleDAO.selectPagingTodolog(page,countperpage)
  let rt = await sampleDAO.selectPagingTotalTodolog()
  res.render('admin/todolog',
      { list: list, page:page,totalitems:rt[0].count, countperpage:countperpage})
})
//================================(직원 관리)
sv.router.get("/admin/staff", async function (req, res) {  
  if(req.query.countperpage == undefined) // 페이지 당 게시물 수
      req.query.countperpage = 20
  if(req.query.page == undefined) // 기본 페이지
      req.query.page = 0
  let countperpage = parseInt(req.query.countperpage) 
  let page = parseInt(req.query.page)  
  let searchType = req.query.type; // 검색타입
  let search = req.query.searchWord; // 검색어 
  let list =await sampleDAO.selectPagingStaff(page,countperpage ,searchType,search)
  let rt = await sampleDAO.selectPagingTotalStaff(searchType,search)
  res.render('admin/staff',{ rows: list, page:page,totalitems:rt[0].count, countperpage:countperpage , search : search , searchType:searchType});
})
sv.router.get("/admin/staff_write", async function (req, res) {
  res.render('admin/staff_write');
});
sv.router.post("/admin/staffWriteProcess", async function (req,res){
  req.on('data' , async function(data){    
    let jsonData = qs.parse(data.toString());
    let name = jsonData.name;
    let hdate = jsonData.hdate;
    let birth = jsonData.birth;
    let numbers = jsonData.number;
    let number = numbers.replace(/\-/g,'');
    let address = jsonData.address;
    let etc = jsonData.etc;
    if(checkNull(name)){
      return res.json({'result' : 'fail','msg':'이름을 입력해주세요.'});
    };
    if(checkNull(number)){
      return res.json({'result' : 'fail','msg':'전화번호를 입력해주세요.'});
    };
    if(checkPhone(number)){
      return res.json({'result' : 'fail','msg':'올바르지 않은 전화번호 형식입니다.'});
    };
    if(checkDate(birth)){
      return res.json({'result' : 'fail','msg':'생년월일을 정확하게 선택해주세요.'});
    };
    if(checkDate(hdate)){
      return res.json({'result' : 'fail','msg':'고용일을 정확하게 선택해주세요.'});
    };
    sampleDAO.insertStaff(name, hdate, birth, number, address, etc)
    return res.json({'result' : 'success','msg':'등록 완료되었습니다.'}); 
  })
})
sv.router.get("/admin/staff_detail", async function (req, res) {
  let staffDetail = await sampleDAO.listStaffIdx(req.query.idx);
  res.render('admin/staff_detail', {rows:staffDetail[0]});
});
sv.router.get("/admin/staff_update", async function (req, res) {
  let staffDetail = await sampleDAO.listStaffIdx(req.query.idx);
  res.render('admin/staff_update', {rows:staffDetail[0]}) 
});
sv.router.get("/admin/deletestaff", async function (req, res) {
  await sampleDAO.deleteStaff(req.query.idx)
  res.redirect('staff') 
});
sv.router.post("/admin/staffUpdateProcess", async function (req,res){
  req.on('data' , async function(data){    
    let jsonData = qs.parse(data.toString());
    let idx = jsonData.idx;
    let name = jsonData.name;
    let hdate = jsonData.hdate;
    let birth = jsonData.birth;
    let number = jsonData.number;
    let address = jsonData.address;
    let etc = jsonData.etc;
    if(checkNull(name)){
      return res.json({'result' : 'fail','msg':'이름을 입력해주세요.'});
    };
    if(checkNull(number)){
      return res.json({'result' : 'fail','msg':'전화번호를 입력해주세요.'});
    };
    if(checkPhone(number)){
      return res.json({'result' : 'fail','msg':'올바르지 않은 전화번호 형식입니다.'});
    };
    if(checkDate(birth)){
      return res.json({'result' : 'fail','msg':'올바르지 않은 날짜 형식입니다.'});
    };
    if(checkDate(hdate)){
      return res.json({'result' : 'fail','msg':'올바르지 않은 날짜 형식입니다.'});
    };
    sampleDAO.updateStaff(idx, name, hdate, birth, number, address, etc)
    return res.json({'result' : 'success','msg':'수정 완료되었습니다.'});    
  })
})
//================================(채팅 관리)
sv.router.get("/admin/chat", async function (req,res){
  if(req.query.countperpage == undefined) // 페이지 당 게시물 수
      req.query.countperpage = 10
  if(req.query.page == undefined) // 기본 페이지
      req.query.page = 0
  let countperpage = parseInt(req.query.countperpage) 
  let page = parseInt(req.query.page)  
  let list =await sampleDAO.selectlistchatmacro(page,countperpage)
  let rt = await sampleDAO.selectlistTotalchatmacro()
  res.render('admin/chatting',{ list: list, page:page,totalitems:rt[0].count, countperpage:countperpage, page:page});
})
sv.router.get("/admin/macroinsert", async function (req,res){
   let macro = req.query.macro
    sampleDAO.insertmacro(macro)
    return res.json({'result' : 'success','msg':'등록 완료되었습니다.'});
})
sv.router.get("/admin/macroUpdateProcess", async function (req,res){
    let idx = req.query.idx;
    let macro = req.query.macro;
    sampleDAO.updatemacro(idx,macro)
    return res.json({'result' : 'success','msg':'수정 완료되었습니다.'}); 
})
sv.router.get("/admin/macrodelete", async function (req, res) {
  await sampleDAO.deletemacro(req.query.idx)
  return res.json({'result' : 'success','msg':'삭제 완료되었습니다.'}); 
});
//================================(알림 설정)
//================================(지점별 게임기기 관리)
//=================================(wifi)
sv.router.get("/admin/wifi", async function (req, res) {
  let list1 =await sampleDAO.listWifi();
  if(list1.length==0){
    await sampleDAO.insertwifidefault()  
  }
  let list =await sampleDAO.listWifi();
  console.log("list",list)
  res.render('admin/wifi',{list:list});
});
sv.router.post("/admin/wifiUpdateProcess", async function (req,res){
  req.on('data' , async function(data){    
    let jsonData = qs.parse(data.toString());
    let id1 = jsonData.id1;
    let id2 = jsonData.id2;
    let pw = jsonData.pw;
    sampleDAO.updateWifi(id1,id2,pw)
    return res.json({'result' : 'success','msg':'wifi가 등록되었습니다.'});    
  })
})
sv.router.get("/admin/wifiDelete", async function (req, res) {
  await sampleDAO.updatedeletewifi()
  return res.json({'result' : 'success','msg':'삭제 완료되었습니다.'}); 
});
//===============================================

// attach_photo.js에 설정된 url 
var seStorage = multer.diskStorage({
  destination(req , file , cb){ // 저장경로
    cb(null , 'C:/upload/zemeet/smartEditor/');
  },
  filename(req,file,cb){ // 저장될 파일이름 
    // 파일명이 겹치는걸 방지해서 날짜를 넣음
    cb(null, `${Date.now()}__${file.originalname}`);
  }
})
var seUpload = multer({storage:seStorage});

sv.router.post("/editorFileUpload", seUpload.array('file') ,async function (req, res){
  try {
    var sFileInfo = "";    
    sFileInfo += "&bNewLine=true";
    sFileInfo += "&sFileName="+ req.files[0].filename;
    sFileInfo += "&sFileURL=/"+req.files[0].filename; //에디터 이미지 나타낼 소스 경로
    res.send(sFileInfo);
  } catch (error) {
      console.log(error);
  }
})

// 공통 사용 함수 
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
  var dateTimeRegExp = /^(19|20)\d{2}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[0-1])T([1-9]|[01][0-9]|2[0-3]):([0-5][0-9])|:([0-9][0-9])$/;
  return !dateTimeRegExp.test(str); // 형식에 맞는 경우 false 리턴
 }
 function isInt(num) {
  return num % 1 === 0;
}
function dateFormat(sdate) {
  let date = new Date(sdate);
  let month = date.getMonth() + 1;
  let day = date.getDate();
  month = month >= 10 ? month : '0' + month;
  day = day >= 10 ? day : '0' + day;
  return date.getFullYear() + '-' + month + '-' + day;
} function dateFormat_month(sdate) {
  let date = new Date(sdate);
  let month = date.getMonth() + 1;
  month = month >= 10 ? month : '0' + month;
  return date.getFullYear() + '-' + month;
}
function dateFormat_month(sdate) {
  let date = new Date(sdate);
  let month = date.getMonth() + 1;
  month = month >= 10 ? month : '0' + month;
  return date.getFullYear() + '-' + month;
}
module.exports = MainController;