sv = require("../server")
sampleDAO = require("../dbutil")
const fs = require("fs");
const multer = require("multer");
const multiparty = require("multiparty");
const { nextTick } = require("process");
const qs = require('querystring'); //json data parse 
sampleDAO.init()

var MainController={}

//================================(회원관리)
sv.router.get("/admin/member", async function (req, res) {
  if(req.query.countperpage == undefined)
      req.query.countperpage = 10
  if(req.query.page == undefined)
      req.query.page = 0
  let countperpage = parseInt(req.query.countperpage)
  let page = parseInt(req.query.page)
  let searchType = req.query.type; // 검색타입
  let search = req.query.searchWord; // 검색어 
  let list =await sampleDAO.selectPagingMember(page, countperpage,searchType,search)
  let rt = await sampleDAO.selectPagingTotalMember(searchType,search)
  res.render('admin/member',
      {rows: list, page:page,totalitems:rt[0].count, countperpage:countperpage , search : search , searchType:searchType});
})
sv.router.get("/admin/member_write", async function (req, res) {
  res.render('admin/member_write');
});
sv.router.post("/admin/memberWriteProcess", async function (req,res){
  req.on('data' , async function(data){    
    let jsonData = qs.parse(data.toString());
    let id = jsonData.id;
    let name = jsonData.name;
    let nick = jsonData.nick;
    let ranking = jsonData.ranking;
    let pw = jsonData.pw;
    let birth = jsonData.birth;
    let rdate = jsonData.rdate;
    let numbers = jsonData.number;
    let number = numbers.replace(/\-/g,''); 
    let push = jsonData.push;
    let point = jsonData.point;
    console.log("point",point)
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
    if(checkNull(birth)){
      return res.json({'result' : 'fail','msg':'생년월일을 입력해주세요.'});
    };
    if(checkDate(birth)){
      return res.json({'result' : 'fail','msg':'올바르지 않은 날짜 형식입니다.'});
    };
    if(checkNull(rdate)){
      return res.json({'result' : 'fail','msg':'회원가입 날짜를 입력해주세요.'});
    };
    if(checkDate(rdate)){
      return res.json({'result' : 'fail','msg':'올바르지 않은 날짜 형식입니다.'});
    };
    if(checkNull(number)){
      return res.json({'result' : 'fail','msg':'회원 전화번호를 입력해주세요.'});
    };
    if(checkPhone(number)){
      return res.json({'result' : 'fail','msg':'올바르지 않은 전화번호 형식입니다.'});
    };
    if(checkNull(push)){
      return res.json({'result' : 'fail','msg':'푸쉬 알림 여부를 입력해주세요.'});
    };
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
      sampleDAO.insertMember(id, name, nick, ranking, pw, rdate, point, birth, number, push)
      return res.json({'result' : 'success','msg':'등록 완료되었습니다.'}); 
    }
  })
})
sv.router.get("/admin/member_detail", async function (req, res) {
  let memberDetail = await sampleDAO.listMemberIdx(req.query.idx);
  res.render('admin/member_detail', {rows:memberDetail[0]});
});
sv.router.get("/admin/member_update", async function (req, res) {
  let memberDetail = await sampleDAO.listMemberIdx(req.query.idx);
  res.render('admin/member_update', {rows:memberDetail[0]}) 
});
sv.router.get("/admin/deleteMember", async function (req, res) {
  await sampleDAO.deleteMember(req.query.idx)
  res.redirect('member') 
});
sv.router.post("/admin/memberUpdateProcess", async function (req,res){
  req.on('data' , async function(data){    
    let jsonData = qs.parse(data.toString());
    let idx = jsonData.idx;
    let id = jsonData.id;
    let name = jsonData.name;
    let nick = jsonData.nick;
    let ranking = jsonData.ranking;
    let pw = jsonData.pw;
    let rdate = jsonData.rdate;
    let point = jsonData.point;
    let birth = jsonData.birth;
    let numbers = jsonData.number;
    let number = numbers.replace(/\-/g,''); 
    let push = jsonData.push;
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
    if(checkDate(rdate)){
      return res.json({'result' : 'fail','msg':'올바르지 않은 날짜 형식입니다.'});
    };
    if(checkNull(birth)){
      return res.json({'result' : 'fail','msg':'생년월일을 입력해주세요.'});
    };
    if(checkDate(birth)){
      return res.json({'result' : 'fail','msg':'올바르지 않은 날짜 형식입니다.'});
    };
    if(checkNull(number)){
      return res.json({'result' : 'fail','msg':'회원 전화번호를 입력해주세요.'});
    };
    if(checkPhone(number)){
      return res.json({'result' : 'fail','msg':'올바르지 않은 전화번호 형식입니다.'});
    };
    if(checkNull(push)){
      return res.json({'result' : 'fail','msg':'푸쉬 알림 여부를 입력해주세요.'});
    };
    if(checkNull(point)){
      return res.json({'result' : 'fail','msg':'포인트를 입력해주세요.'});
    };
    sampleDAO.updateMember(idx, id, name, nick, ranking, pw, rdate, point, birth, number, push)
    return res.json({'result' : 'success','msg':'수정 완료되었습니다.'});    
  })
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
  var dateTimeRegExp = /^(19|20)\d{2}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[0-1])T([1-9]|[01][0-9]|2[0-3]):([0-5][0-9])$/;
  return !dateTimeRegExp.test(str); // 형식에 맞는 경우 false 리턴
 }
function dateFormat(sdate) {
  let date = new Date(sdate);
  let month = date.getMonth() + 1;
  let day = date.getDate();
  month = month >= 10 ? month : '0' + month;
  day = day >= 10 ? day : '0' + day;
  return date.getFullYear() + '-' + month + '-' + day;
}

module.exports = MainController;