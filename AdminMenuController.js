sv = require("./server")
sampleDAO = require("./dbutil")
const fs = require("fs");
const multer = require("multer");
const multiparty = require("multiparty");
const qs = require('querystring'); //json data parse 
sampleDAO.init()

var MainController={}

//=================================================(메뉴 관리)
sv.router.get("/admin/menu", async function (req, res) {
  if(req.query.countperpage == undefined)
      req.query.countperpage = 10
  if(req.query.page == undefined)
      req.query.page = 0
  let countperpage = parseInt(req.query.countperpage)
  let page = parseInt(req.query.page)
  let searchCateType = req.query.Catetype; // 카테고리 검색타입
  let searchSellType = req.query.Selltype; // 품절여부 검색타입
  let search = req.query.searchWord; // 검색어 
  let list =await sampleDAO.selectPagingMenu(page,countperpage,searchCateType,searchSellType,search)
  let rt = await sampleDAO.selectPagingTotalMenu(searchCateType,searchSellType,search)
  console.log("search",search)
  console.log("searchCateType",searchCateType)
  console.log("searchSellType",searchSellType)
  res.render('admin/menu',
  {list: list,page:page,totalitems:rt[0].count, countperpage:countperpage , search : search , searchCateType:searchCateType , searchSellType:searchSellType })
})
// - - - <<storage 세팅>>
var storage = multer.diskStorage({
  destination(req , file , cb){ // 저장경로
    cb(null , 'C:/upload/zemeet/uploadedMenuFiles/');
  },
  filename(req,file,cb){ // 저장될 파일이름 
    // 파일명이 겹치는걸 방지해서 날짜를 넣음
    cb(null, `${Date.now()}__${file.originalname}`);
  }
})
var upload = multer({storage:storage});
// - - - <<등록>>
sv.router.get("/admin/menu_write", async function (req, res) {
  res.render('admin/menu_write')
})
sv.router.post("/admin/menuFileProcess", upload.single('pic'),function (req,res){
  if(req.file == null){
    return res.json({'result' : 'fail','msg':'메인 사진을 등록해주세요.'});
  } 
  let name = req.body.name;
  let category = req.body.category;
  let date = req.body.date;
  // let explain = req.body.explain;
  if(checkNull(name)){
    return res.json({'result' : 'fail','msg':'종류를 선택해주세요.'});
  };
  if(checkNull(category)){
    return res.json({'result' : 'fail','msg':'카테고리을 선택해주세요.'});
  };
  if(checkNull(date)){
    return res.json({'result' : 'fail','msg':'날짜를 선택해주세요.'});
  };
  
  sampleDAO.insertMenuFile(req.file.filename,name,category,date);
  return res.json({'result' : 'success','msg':'게시물 등록이 완료되었습니다.'});
})

sv.router.get("/admin/menu_detail", async function (req, res) { //(게시글 상세보기)
  let menudetail = await sampleDAO.listMenu1(req.query.idx);
  res.render('admin/menu_detail', {info:menudetail[0]});
});



// - - - <수정>
sv.router.get("/admin/menu_update", async function (req, res) {
  let info = await sampleDAO.listMenu1(req.query.idx);
  res.render('admin/menu_update' , {rows:info[0]});
})
sv.router.post("/admin/updateMenu", upload.single('pic') , function (req,res){
  let name = req.body.name;
  let category = req.body.category;
  let date = req.body.date;
  if(checkNull(name)){
    return res.json({'result' : 'fail','msg':'종류를 선택해주세요.'});
  };
  if(checkNull(category)){
    return res.json({'result' : 'fail','msg':'카테고리을 선택해주세요.'});
  };
  if(checkNull(date)){
    return res.json({'result' : 'fail','msg':'날짜를 선택해주세요.'});
  };
  if(req.file == null){ // 새사진 X 
    sampleDAO.updateMenu(req.body.idx, req.body.originFile,name,category,date);
  }else{ // 새사진 O
    sampleDAO.updateMenu(req.body.idx, req.file.filename, name,category,date);
  }
  return res.json({'result' : 'success','msg':'수정완료되었습니다.'});
})
// --- 삭제
sv.router.get("/admin/deleteMenu", async function (req, res) { // 게임 목록 삭제
  await sampleDAO.deleteMenu(req.query.idx)
  return res.json({'result' : 'success','msg':'삭제완료되었습니다.'});
  //res.redirect('/notice') 
});
//?
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
//===============================================================(주문 관리)
sv.router.get("/admin/order", async function (req, res) {
  if(req.query.countperpage == undefined)
      req.query.countperpage = 10
  if(req.query.page == undefined)
      req.query.page = 0
  let countperpage = parseInt(req.query.countperpage)
  let page = parseInt(req.query.page)
  let searchPaymentType = req.query.paymenttype; // 카테고리 검색타입
  let search = req.query.searchWord; // 검색어 
  let list =await sampleDAO.selectPagingOrder(page,countperpage,searchPaymentType,search)
  let rt = await sampleDAO.selectPagingTotalOrder(searchPaymentType,search)
  // console.log("search",search)
  // console.log("searchCateType",searchCateType)
  console.log("list",list)
  console.log("rt",rt)
  res.render('admin/order',
  {list: list,page:page,totalitems:rt[0].count, countperpage:countperpage, searchPaymentType:searchPaymentType , search:search })
})
sv.router.get("/admin/order_detail", async function (req, res) {
  if(req.query.countperpage == undefined)
      req.query.countperpage = 10
  if(req.query.page == undefined)
      req.query.page = 0
  let countperpage = parseInt(req.query.countperpage)
  let page = parseInt(req.query.page)
  let ridx= req.query.ridx;
  console.log("ridx:",ridx)
  let gidx = req.query.gidx;
  console.log("gidx:",gidx)
  let list =await sampleDAO.selectPagingOrder_detail(page,countperpage,ridx,gidx)
  let rt = await sampleDAO.selectPagingTotalOrder_detail(ridx,gidx)
  res.render('admin/order_detail',
  {list: list,page:page,totalitems:rt[0].count, countperpage:countperpage,ridx:ridx,gidx:gidx })
})
sv.router.get("/admin/order_qdetail", async function (req, res) { //(게시글 상세보기)
  let orderdetail = await sampleDAO.listorder(req.query.ridx,req.query.midx);
  let ordermenudetail = await sampleDAO.orderprice(req.query.midx);
  res.render('admin/order_qdetail', {info:orderdetail[0],info2:ordermenudetail[0] });
});

// 공통 사용 함수 =================================================================
function checkNull(str){ // 빈값인지 체크하는 함수 
  return str == null || str == "";
}


module.exports = MainController;