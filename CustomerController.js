sv = require("./server")
sampleDAO = require("./dbutil")
const qs = require('querystring'); //json data parse 
var MainController={}

//======================================================================(게임방 앱(내부) -메인,게임검색 )
sv.router.get("/customer/main", async function (req, res) {
  let list =await sampleDAO.listGame();
  let list1 =await sampleDAO.listGame1();
  let list2 = await sampleDAO.listMenu();
  let list3 = await sampleDAO.listRoom5();
  let wifi = await sampleDAO.listWifi();
  console.log("dfjsl",list3[0],list3[1]);
  res.render('customer/customer',
  {rows : list , row : list1 , menu : list2 , room : list3, wifi:wifi});
});

sv.router.get("/getExplan", async function (req, res) {
  console.log(req.query.idx);
  let info = await sampleDAO.selectGame(req.query.idx);
  console.log("info.length : " + info[0].explan);
  if(info[0].explan == ''){
    return res.json({'result' : 'fail','msg':'등록된 내용이없습니다'});
  }else{
    return res.json({'result' : 'success','msg':info});
  }
});
sv.router.get("/getVideo", async function (req, res) {
  console.log(req.query.idx);
  let info = await sampleDAO.selectGame(req.query.idx);
  console.log("info.vid: " + info[0].vid);
  if(info[0].vid == ''){
    console.log("fail??")
    return res.json({'result' : 'fail','msg':'준비된 영상이 없습니다.~'});
  }else{
    console.log("success")
    return res.json({'result' : 'success','msg':info[0].vid});
  }
});
sv.router.get("/getQuestion", async function (req, res) {
  console.log(req.query.idx);
  let info = await sampleDAO.selectGame_q(req.query.idx);
  let info2 = await sampleDAO.selectGame(req.query.idx);
  if(info.length == 0){
    console.log("fail??")
    return res.json({'result' : 'fail','msg':'질문이 없습니다.~'});
  }else{
    console.log("success")
    console.log("dsfsfsfs",info[0].que)
  console.log("답변,,,",info[0].ans)
  console.log("날짜",info[0].udate)
    return res.json({'result' : 'success','msg':info ,'msg2':info2});
  }
});

sv.router.post("/getSearch", function (req, res) {
  req.on('data', async function(data){
     return getSearchProcess(res,data)
  })
});
const getSearchProcess  = async function(res , data){
  let jsonData = qs.parse(data.toString()); 
  let usel = jsonData.people;
  let ptime = jsonData.playTime;
  let etime = jsonData.explanTime;
  let genr = jsonData.Genre;
  let lev = jsonData.Level;
  let search = jsonData.gamesearch;
  console.log("getsearch??????????????????",usel)
  console.log("adfksakfl;kaf;ldfk",ptime)
  let compare = await sampleDAO.listComGame(search);
  console.log("compare~!!!!!!!!!!!!!!!!!!!",compare)
  if (compare.length ==0){
    console.log("들어옴?1")
  }else{
    console.log("들어옴?2",compare[0].grank)
    Grank=parseInt(compare[0].grank);
    console.log("Grank",Grank);
    Grank+=1;
    console.log("fdsfsdfsdfssdfdf",Grank)
    sampleDAO.updateGame2(Grank,compare[0].idx);
  }
  let info = await sampleDAO.selectGame2(usel,ptime,etime,genr,lev,search);
  console.log("info",info)
  if(info.length == 0){
    return res.json({'result' : 'fail','msg':'일치하는 게임이 없습니다.'});
  }else{
    return res.json({'result' : 'success','msg':info});
  }
}
// ==================================================================음식주문
sv.router.get("/getlistFood", async function (req, res) {
  console.log(req.query.category);
  if (req.query.category == "All"){
   console.log("여기 들어감?????")
   var info = await sampleDAO.listMenu()
  }else{
   var info = await sampleDAO.listMenucate(req.query.category);
  }
  console.log("info.length : " + info.length);
  if(info.length == 0){
    return res.json({'result' : 'fail','msg':'등록된 음식이없습니다'});
  }else{
    return res.json({'result' : 'success','msg':info});
  }
});
sv.router.get("/getfoodSave", async function (req, res) {
  console.log("여기 들어옴??????????")
  console.log(req.query.name);
  let info = await sampleDAO.listMenuname(req.query.name);
  if(info[0].category == ''){
    return res.json({'result' : 'fail','msg':'등록된 음식이없습니다'});
  }else{
    return res.json({'result' : 'success','msg':info[0]});
  }
});

sv.router.post("/orderMenu", function (req, res) {
  // 스마트에디터 , 긴글 => req.on('data') = > 데이터 가공 / req.on('end') => 리턴 
  // body-parser req.body =>>> 
  req.on('data', async function(data){
    let jsonData = JSON.parse(data.toString()); 
    console.log("jsondata:",jsonData);
    let info = await sampleDAO.ordersell(jsonData[0].ridx)
    var ggidx = await sampleDAO.ordersell_gidx()
    if(ggidx == ''){//전체 첫 주문이라면
      ggidx=0;
      for(i=0;i<jsonData.length;i++){
        sampleDAO.insertorder(jsonData[i].ridx,ggidx,jsonData[i].midx,jsonData[i].foodSum,jsonData[i].foodPrice,jsonData[i].request);
      }
    }
    else{
      ggidx= ggidx[0].gidx
      if(info == ''){// 그 방에 처음 주문이라면
        ggidx+=1;
        for(i=0;i<jsonData.length;i++){
          sampleDAO.insertorder(jsonData[i].ridx,ggidx,jsonData[i].midx,jsonData[i].foodSum,jsonData[i].foodPrice,jsonData[i].request);
        }
      }
      else{// 그 방에 첫 주문이 아니고
        if(info[0].payment == 1 || info[0].payment == 2){ // 마지막 주문이 결제가 되었을 때(손님이 가고 다른 손님이 와서 주문했을 때)
          ggidx+=1;
          console.log("ggidx",ggidx)
          for(i=0;i<jsonData.length;i++){
            sampleDAO.insertorder(jsonData[i].ridx,ggidx,jsonData[i].midx,jsonData[i].foodSum,jsonData[i].foodPrice,jsonData[i].request);
          }
        }
        else{// 그 방에서 최종적으로 나와 결제하기 전에 또 다시 주문을 한 경우
          for(i=0;i<jsonData.length;i++){
            sampleDAO.insertorder(jsonData[i].ridx,info[0].gidx,jsonData[i].midx,jsonData[i].foodSum,jsonData[i].foodPrice,jsonData[i].request);
          }
        }
      }
    }
    return res.json({'result' : 'success','msg':'주문이 완료되었습니다.'});
  })
});
sv.router.get("/lastprice", async function (req, res) {
  console.log("ridx",req.query.idx)
  let list = await sampleDAO.orderdetail_front(req.query.idx);
  let room = await sampleDAO.orderroom_front(req.query.idx);
  console.log("list:",list)
  return res.json({'result' : 'success','list':list ,'room':room });
});
sv.router.get("/roomlist_", async function (req, res) {
  let list3 = await sampleDAO.listRoom1(req.query.idx);
  console.log("list3",list3)
  return res.json({'result' : 'success','list':list3});
});

sv.router.get("/timeCalculate_customer", async function (req, res) {
  let log = await sampleDAO.timecalculate(req.query.idx);
  console.log("log",log[0])
  if(log.length == 0){
    return res.json({'result' : 'fail'});
  }else{
     return res.json({'result' : 'success','log':log});
  }
});
sv.router.get("/addtime", async function (req, res) {
  console.log("idx,time",req.query.idx, req.query.time)
  let roomstatus = await sampleDAO.listRoom1(req.query.idx)//빈방인지 확인하려고
  let alladd = await sampleDAO.alladd(req.query.idx)// 해당 방에 예약이 있는 지 확인하려고 
  if(roomstatus[0].status == 1 && alladd.length == 0){//사용중인 방이고 해당 idx의 예약이 없어서 제한 없이 시간 추가 가능
    console.log("시간 추가 가능!!")
    return res.json({'result' : 'success'});
  }
  else if(roomstatus[0].status == 1 && alladd.length != 0){//해당 idx의 예약이 있음
    let reservation = await sampleDAO.listReservationTimeCheck_customer(req.query.idx,req.query.time)
    if(reservation.length == 0){
      console.log("시간 추가 가능!!~~")
      return res.json({'result' : 'success'});
    }
    else{
      console.log("시간추가 불가")
      return res.json({'result' : 'fail'});
    }
  }
  else{
    console.log('방 사용중이 아님')
    return res.json({'result' : 'noRoom'});
  }
  
});
sv.router.get("/addtimesuccess", async function (req, res) {
  console.log("idx,time",req.query.idx, req.query.time)
  let addtime = await sampleDAO.addtime_apay(req.query.idx)
  let TPRate=addtime[0].TPRate;
  let PPRate = addtime[0].PPRate;
  let people = addtime[0].people;
  let apaycalculate = (TPRate*req.query.time/10 + PPRate*people)
  await sampleDAO.updateduration(req.query.idx,req.query.time,apaycalculate)
  return res.json({'result' : 'success'});
});
sv.router.get("/wifipop", async function (req, res) {
  let wifi = await sampleDAO.listWifi()
  console.log("dsff",wifi)
  return res.json({'result' : 'success','wifi':wifi});
});

  

module.exports = MainController
