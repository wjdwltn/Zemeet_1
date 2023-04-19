const { format } = require("express/lib/response");
var sampleDAO = require("./db");
sampleDAO.init()
////

// 로그인 정보 확인
sampleDAO.checkAdmin = async function(id , pw) 
{			
	return await this.queryselect('select * from admin where id = "'+id+'" and pw = "'+pw+'"')
} 
// SELECT count(*) FROM roomreservation WHERE startT < DATE_ADD(stime, INTERVAL duration HOUR) AND endT > stime AND ridx = 4 AND status = 0
// SELECT count(*) FROM roomreservation WHERE startT < DATE_ADD(stime, INTERVAL duration + 1 HOUR) AND endT > DATE_SUB(stime, INTERVAL 1 HOUR) AND ridx = 5
// 예약 시작 시간 < 기존 예약 시작 시간 + 이용 시간 (=기존 예약 끝 시간) AND 예약 끝 시간 > 기존 예약 시작 시간 AND 같은 방 AND 예약이 취소되지 않은 상태
// 결과가 0이면 정상, 결과가 1이면 중복
//================================(Admin - 예약 관리)
sampleDAO.listResevation = async function() 
{
	return await this.queryselect("SELECT db_Reser.*, db_M.name , db_M.number , db_r.roomNm from roomreservation db_Reser LEFT JOIN member db_M on db_M.idx = db_Reser.midx LEFT JOIN room db_r on db_r.idx = db_Reser.ridx where db_Reser.status = 0 or db_Reser.status=2 order by idx desc")
}
sampleDAO.listReservationIdx = async function(dat)
{
  return await this.queryselect("SELECT db_Reser.*, db_M.name , db_M.number , db_r.roomNm , db_r.name AS roomName from roomreservation db_Reser LEFT JOIN member db_M on db_M.idx = db_Reser.midx LEFT JOIN room db_r on db_r.idx = db_Reser.ridx WHERE db_Reser.idx = "+dat+"")
}
sampleDAO.listReservationDuplCheck = async function(ridx,startT,endT,idx)
{
  let sql="SELECT count(*) AS count FROM roomreservation WHERE ridx = "+ridx+" and status=0 AND idx !="+idx
  sql+=" AND ('"+startT+"' < DATE_ADD(stime, INTERVAL duration + 10 MINUTE) AND '"+startT+"'> stime OR '"+endT+"' < DATE_ADD(stime, INTERVAL duration MINUTE ) AND '"+endT+"' > DATE_SUB(stime, INTERVAL 10 MINUTE))"
	return await this.queryselect(sql)
}
sampleDAO.listReservationDuplCheck_api = async function(idx,startT,endT)
{
  let sql="select count(*) AS count from roomreservation a, room b where b.idx = a.ridx AND b.idx = "+idx+" AND a.status = 0"
  sql+=" AND ('"+startT+"' <= DATE_ADD(a.stime, INTERVAL duration + 10 MINUTE) AND '"+startT+"'>= a.stime OR '"+endT+"' <= DATE_ADD(a.stime, INTERVAL duration MINUTE ) AND '"+endT+"' >= DATE_SUB(a.stime, INTERVAL 10 MINUTE))"
	return await this.queryselect(sql)
}
sampleDAO.listReservationUseTime_kiosk = async function(idx)
{
  let sql="SELECT a.* FROM roomreservation a, room b WHERE b.idx=a.ridx AND  b.idx ="+idx
  sql+=" AND now() <  DATE_ADD(a.stime, INTERVAL (duration*60) + 30 MINUTE) order by stime limit 1 "
	return await this.queryselect(sql)
}
sampleDAO.listReservationTimeCheck_kiosk = async function(idx, time)
{
  let sql="select * FROM(SELECT a.* FROM roomreservation a, room b WHERE b.idx=a.ridx AND  b.idx ="+idx
  sql+=" AND a.status=0 AND now() <a.stime order by a.stime limit 1) c where DATE_ADD(now(), INTERVAL "+time+" + 10 MINUTE) >= c.stime  "
	return await this.queryselect(sql)
}
sampleDAO.alladd = async function(idx)
{
  let sql="select * from room a, roomreservation b where a.idx=b.ridx and a.idx="+idx+" and b.status=0 "
	return await this.queryselect(sql)
}
sampleDAO.listReservationTimeCheck_customer = async function(idx, time)
{
  let sql="select * from (select distinct b.stime as bstime, c.stime as cstime, (c.duration + c.duration_add ) cduration from room a, roomreservation b, roomlog c where a.idx=b.ridx and a.idx=c.ridx and a.idx="+idx+" and b.status =0 and c.type=0) d "
  sql+=" where  DATE_ADD(DATE_ADD(d.cstime , INTERVAL d.cduration MINUTE), INTERVAL "+time+" + 10 MINUTE) >  d.bstime  "
	return await this.queryselect(sql)
}
sampleDAO.listReservationRoomList_kiosk = async function(idx)// 
{
  let sql="select count(*) AS count from(SELECT a.* FROM roomreservation a, room b WHERE b.idx=a.ridx AND b.idx ="+idx+" and a.status=0)c where c.stime<=now()"
  sql+=" AND DATE_ADD(c.stime ,INTERVAL 30 MINUTE)>=now() "
	return await this.queryselect(sql)
}
sampleDAO.listReservationcancel_kiosk = async function(idx)// 현재 예약 상태에 있는 것들 중에 30분이 지난 것들만 취소
{
  let sql="select * from(SELECT a.* FROM roomreservation a, room b WHERE b.idx=a.ridx AND a.status=0 and b.idx = "+idx+" and a.stime<now())c"
  sql+=" where DATE_ADD(c.stime,INTERVAL 30 MINUTE)<now()  "
	return await this.queryselect(sql)
}
sampleDAO.UpdateStatus_0 = async function(idx) 
{ //취소시 status를 0 -> 1로 변환. 사유를 관리자 재량으로 변환
	this.queryexec('update room set status =0 where idx = "'+idx+'"');
}
sampleDAO.UpdateStatus_0_front = async function(idx) 
{ 
	this.queryexec('update room a, roomreservation b set a.status =0 where b.ridx=a.idx and a.status=2 and b.idx='+idx+'');
}
sampleDAO.UpdateStatus_1 = async function(idx) 
{ //취소시 status를 0 -> 1로 변환. 사유를 관리자 재량으로 변환
	this.queryexec('update room set status =1 where idx = "'+idx+'"');
}
sampleDAO.UpdateStatus_2 = async function(idx) 
{ 
	this.queryexec('update room set status =2 where idx = "'+idx+'" and status =0');
}
sampleDAO.Updatereservation_0 = async function(idx) 
{ 
	this.queryexec('update roomreservation set status =1 , reason = "예약시간 30분 지남", ctime = now() where idx = "'+idx+'"');
}
sampleDAO.listReservation_Api = async function()
{ //오늘 날짜에 해당하는 것과 예약 status가 0인 것만 표시되도록
	return await this.queryselect("SELECT db_Reser.*, db_M.name , db_M.number , db_r.roomNm , db_r.peopleMin, db_r.peopleMax from roomreservation db_Reser LEFT JOIN member db_M on db_M.idx = db_Reser.midx LEFT JOIN room db_r on db_r.idx = db_Reser.ridx WHERE DATE(stime) = DATE(NOW()) AND db_Reser.status = 0 ")
}
sampleDAO.cancelReservation = async function(idx) 
{ //취소시 status를 0 -> 1로 변환. 사유를 관리자 재량으로 변환
	this.queryexec('update roomreservation set status = "1", reason = "관리자 권한에 의한 예약취소", ctime = now() where idx = "'+idx+'"');
}
sampleDAO.cancelReservation_Api = async function(idx, reason) 
{ //취소시 status를 0 -> 1로 변환. 취소 사유를 받아서 적용하여 취소 처리
	this.queryexec('update roomreservation set status = "1", reason = "'+reason+'", ctime = now() where idx = "'+idx+'"');
}
sampleDAO.listReservation_Kiosk = async function(number)
{ //오늘 날짜에 해당하는 것과 예약 status가 0인 것만 표시되도록
  return await this.queryselect("SELECT db_Reser.*, db_M.name , db_M.number ,db_r.idx as roomidx, db_r.roomNm from roomreservation db_Reser LEFT JOIN member db_M on db_M.idx = db_Reser.midx LEFT JOIN room db_r on db_r.idx = db_Reser.ridx WHERE db_M.number = "+number+" AND NOW() <= DATE_ADD(db_Reser.stime, INTERVAL 30 MINUTE) AND NOW()>= DATE_SUB(db_Reser.stime, INTERVAL 5 MINUTE) AND db_Reser.status = 0 ")
}
//+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
sampleDAO.selectPagingTotalReservation = async function(searchType,search,sdate,edate,result,statusType) 
{ 
  let sql = 'SELECT COUNT(*) count from roomreservation db_Reser LEFT JOIN member db_M on db_M.idx = db_Reser.midx LEFT JOIN room db_r on db_r.idx = db_Reser.ridx ';
  sql += 'WHERE 1=1 '
  if(result == 0) { //과거 내역 조회시
    sql += " AND db_Reser.stime < CURDATE() ";
  } else if (result == 1) { //현재 내역 조회시
    sql += " AND db_Reser.stime > CURDATE() ";
  }
  if(statusType != null && statusType != '' && statusType !="status"){
    sql += ' AND '
    switch(statusType){
		case"0": sql += "db_Reser.status = 0 "; break;
		case"1": sql += "db_Reser.status = 1 "; break;
    case"2": sql += "db_Reser.status = 2 "; break;
    }
  }
  if(search != null && search != ''){ // 검색어 있을 때
    sql += " AND "
    switch(searchType){
      case"reserver": sql += 'db_M.name LIKE '; break;
      case"reserRoom": sql += 'db_r.roomNm LIKE '; break;
      case"number": sql += 'db_M.number LIKE '; break;
    }
    if (searchType == 'number'){ //하이픈이 들어간 전화번호 검색시 하이픈 제거
      sql += " CONCAT ('%' , '"+search.replace(/\-/g,'')+"' , '%') "
    } else {
      sql += " CONCAT ('%' , '"+search+"' , '%') "
    }
  }
  if(sdate != null && sdate != '' && edate != null && edate != ''){ // 검색일 있을 때
    sql += "AND stime BETWEEN '" +sdate+"T00:00' AND '"+edate+"T23:59' " //시작일의 시작시간 과 종료일의 종료시간를 추가해야 작동
  } 
  return await this.queryselect(sql);
}
sampleDAO.selectPagingCalculate = async function(pagenum,pagepercount ,sdate,edate,sdate_month,edate_month,statusType) {
  let skip = pagenum*pagepercount;
  let sql = 'select c.* from ('
  sql += 'SELECT  b.date, a.totalfood, b.totalroom ' 
  if(statusType == 'month'){
    sql +=  ' from (select concat(YEAR(paymentTime) ,"-0",MONTH(paymentTime)) date, sum(price) totalfood from `order` where payment !=0 group by concat(YEAR(paymentTime) ,"-0",MONTH(paymentTime)) order by paymentTime desc)a'
  }else{
    sql +=  ' from (select DATE(paymentTime) date, sum(price) totalfood from `order` where payment !=0 group by  DATE(paymentTime) order by paymentTime desc)a'
  }
  if(statusType == 'month'){
    sql +=  ' left join  (select concat(YEAR(etime) ,"-0",MONTH(etime)) date, sum(fpay+apay) totalroom from roomlog where type !=0 group by concat(YEAR(etime) ,"-0",MONTH(etime))  order by etime desc )b '
  }else{
    sql +=  ' left join  (select DATE(etime) date, sum(fpay+apay) totalroom from roomlog where type !=0 group by  DATE(etime) order by etime desc)b'
  }
  sql +=  ' on  a.date = b.date'
  sql +=  ' union'
  sql +=  ' SELECT  b.date, a.totalfood, b.totalroom '
  if(statusType == 'month'){
    sql +=  ' from (select concat(YEAR(paymentTime) ,"-0",MONTH(paymentTime))date, sum(price) totalfood from `order` where payment !=0 group by concat(YEAR(paymentTime) ,"-0",MONTH(paymentTime))  order by paymentTime desc )a'
  }else{
    sql +=  ' from (select DATE(paymentTime) date, sum(price) totalfood from `order` where payment !=0 group by  DATE(paymentTime) order by paymentTime desc)a'
  }
  if(statusType == 'month'){
    sql +=  ' right join  (select concat(YEAR(etime) ,"-0",MONTH(etime)) date, sum(fpay+apay) totalroom from roomlog where type !=0 group by concat(YEAR(etime) ,"-0",MONTH(etime))  order by etime desc )b'
  }else{
    sql +=  ' right join  (select DATE(etime) date, sum(fpay+apay) totalroom from roomlog where type !=0 group by  DATE(etime) order by etime desc)b'
  }
  sql +=  ' on  a.date = b.date)c'
  if(sdate != null && sdate != '' && edate != null && edate != '' && statusType == 'day'){ 
    sql+=" where c.date between DATE('" +sdate+"') AND DATE('"+edate+"') "
  }
  else if(sdate_month != null && sdate_month != '' && edate_month != null && edate_month != '' && statusType=='month'){
    sql+=" where c.date between '" +sdate_month+"' AND '" +edate_month+"' "
  }// 검색일 있을 때
  sql +=  ' limit ' + skip + "," + pagepercount;
 
  return await this.queryselect(sql);
}
sampleDAO.selectPagingTotalCalculate = async function(pagenum,pagepercount ,sdate,edate,sdate_month,edate_month,statusType) {
  let sql = 'select count(*) count from ('
  sql += 'SELECT  b.date, a.totalfood, b.totalroom ' 
  if(statusType == 'month'){
    sql +=  ' from (select concat(YEAR(paymentTime) ,"-0",MONTH(paymentTime)) date, sum(price) totalfood from `order` where payment !=0 group by concat(YEAR(paymentTime) ,"-0",MONTH(paymentTime)) order by paymentTime desc)a'
  }else{
    sql +=  ' from (select DATE(paymentTime) date, sum(price) totalfood from `order` where payment !=0 group by  DATE(paymentTime) order by paymentTime desc)a'
  }
  if(statusType == 'month'){
    sql +=  ' left join  (select concat(YEAR(etime) ,"-0",MONTH(etime)) date, sum(fpay+apay) totalroom from roomlog where type !=0 group by concat(YEAR(etime) ,"-0",MONTH(etime))  order by etime desc )b '
  }else{
    sql +=  ' left join  (select DATE(etime) date, sum(fpay+apay) totalroom from roomlog where type !=0 group by  DATE(etime) order by etime desc)b'
  }
  sql +=  ' on  a.date = b.date'
  sql +=  ' union'
  sql +=  ' SELECT  b.date, a.totalfood, b.totalroom '
  if(statusType == 'month'){
    sql +=  ' from (select concat(YEAR(paymentTime) ,"-0",MONTH(paymentTime))date, sum(price) totalfood from `order` where payment !=0 group by concat(YEAR(paymentTime) ,"-0",MONTH(paymentTime))  order by paymentTime desc )a'
  }else{
    sql +=  ' from (select DATE(paymentTime) date, sum(price) totalfood from `order` where payment !=0 group by  DATE(paymentTime) order by paymentTime desc)a'
  }
  if(statusType == 'month'){
    sql +=  ' right join  (select concat(YEAR(etime) ,"-0",MONTH(etime)) date, sum(fpay+apay) totalroom from roomlog where type !=0 group by concat(YEAR(etime) ,"-0",MONTH(etime))  order by etime desc )b'
  }else{
    sql +=  ' right join  (select DATE(etime) date, sum(fpay+apay) totalroom from roomlog where type !=0 group by  DATE(etime) order by etime desc)b'
  }
  sql +=  ' on  a.date = b.date)c'
  if(sdate != null && sdate != '' && edate != null && edate != '' && statusType == 'day'){ 
    sql+=" where c.date between DATE('" +sdate+"') AND DATE('"+edate+"') "
  }
  else if(sdate_month != null && sdate_month != '' && edate_month != null && edate_month != '' && statusType=='month'){
    sql+=" where c.date between '" +sdate_month+"' AND '" +edate_month+"' "
  }// 검색일 있을 때
  return await this.queryselect(sql);

}
sampleDAO.selectPagingcalculate_detail = async function(pagenum,pagepercount,date,length) {
  let skip = pagenum*pagepercount;
  let sql = "select a.* from (select etime as 날짜,'방' as 종류, type as 결제, fpay+apay as 총금액  from roomlog"
  if(length ==10){
    sql += " where DATE(etime) = '"+date+"'" 
  }
  else{
    sql += ' where concat(YEAR(etime) ,"-0",MONTH(etime)) = "'+date+'"'
  }
  sql += " and type != 0  UNION select paymentTime,'음식', payment,amount*price from `order` "
  if(length ==10){
    sql += " where DATE(paymentTime) = '"+date+"'" 
  }
  else{
    sql += ' where concat(YEAR(paymentTime) ,"-0",MONTH(paymentTime)) = "'+date+'"'
  }
  sql += " and payment != 0)a order by a.날짜 desc"
  sql +=  ' limit ' + skip + "," + pagepercount;
  return await this.queryselect(sql);
}
sampleDAO.selectPagingTotalcalculate_detail = async function(date,length) {
  let sql = "select count(*) count from (select etime as 날짜,'방' as 종류, type as 결제, fpay+apay as 총금액  from roomlog"
  if(length ==10){
    sql += " where DATE(etime) = '"+date+"'" 
  }
  else{
    sql += ' where concat(YEAR(etime) ,"-0",MONTH(etime)) = "'+date+'"'
  }
  sql += " and type != 0  UNION select paymentTime,'음식', payment,amount*price from `order` "
  if(length ==10){
    sql += " where DATE(paymentTime) = '"+date+"'" 
  }
  else{
    sql += ' where concat(YEAR(paymentTime) ,"-0",MONTH(paymentTime)) = "'+date+'"'
  }
  sql += " and payment != 0)a order by a.날짜 desc"
  return await this.queryselect(sql);
}
sampleDAO.selectPagingReservation = async function(pagenum,pagepercount,searchType,search,sdate,edate,result,statusType) 
{
  let skip = pagenum*pagepercount;
  let sql = 'SELECT db_Reser.*, db_M.name , db_M.number , db_r.roomNm from roomreservation db_Reser LEFT JOIN member db_M on db_M.idx = db_Reser.midx LEFT JOIN room db_r on db_r.idx = db_Reser.ridx ';
  sql += 'WHERE 1=1 '
  if(result == 0) { //과거 내역 조회시
    sql += " AND db_Reser.stime < CURDATE() ";
  } else if (result == 1) { //현재 내역 조회시
    sql += " AND db_Reser.stime > CURDATE() ";
  }
  if(statusType != null && statusType != '' && statusType !="status"){
    sql += ' AND '
    switch(statusType){
		case"0": sql += "db_Reser.status = 0 "; break;
		case"1": sql += "db_Reser.status = 1 "; break;
    case"2": sql += "db_Reser.status = 2 "; break;
    }
  }
  if(search != null && search != ''){ // 검색어 있을 때
    sql += " AND "
    switch(searchType){
      case"reserver": sql += 'db_M.name LIKE '; break;
      case"reserRoom": sql += 'db_r.roomNm LIKE '; break;
      case"number": sql += 'db_M.number LIKE '; break;
    }
    if (searchType == 'number'){ //하이픈이 들어간 전화번호 검색시 하이픈 제거
      sql += " CONCAT ('%' , '"+search.replace(/\-/g,'')+"' , '%') "
    } else {
      sql += " CONCAT ('%' , '"+search+"' , '%') "
    }
  }
  if(sdate != null && sdate != '' && edate != null && edate != ''){ // 검색일 있을 때
    sql += "AND db_Reser.stime BETWEEN '" +sdate+"T00:00' AND '"+edate+"T23:59' "
  }
  sql += ' order by db_Reser.status asc ,db_Reser.stime desc  ' + 'limit ' + skip + "," + pagepercount;
  return await this.queryselect(sql);
}
sampleDAO.selectReservation_Api_past = async function(midx) 
{
  let sql = "SELECT db_Reser.*, db_M.name , db_M.number , db_r.roomNm, db_r.name AS roomName from roomreservation db_Reser LEFT JOIN member db_M on db_M.idx = db_Reser.midx LEFT JOIN room db_r on db_r.idx = db_Reser.ridx WHERE db_Reser.stime < CURDATE() AND db_Reser.midx = "+midx+"";
  return await this.queryselect(sql);
}
sampleDAO.selectReservation_Api_current = async function(midx) 
{
  let sql = "SELECT db_Reser.*, db_M.name , db_M.number , db_r.roomNm, db_r.name AS roomName from roomreservation db_Reser LEFT JOIN member db_M on db_M.idx = db_Reser.midx LEFT JOIN room db_r on db_r.idx = db_Reser.ridx WHERE db_Reser.stime > CURDATE() AND db_Reser.midx = "+midx+"";
  return await this.queryselect(sql);
}
sampleDAO.deleteReservation = async function(idx)
{
	await this.queryexec('delete from roomreservation where idx='+ idx)
}
sampleDAO.updateReservation = async function(idx, ridx, stime, duration, people ,memo, status, reason, ctime)
{
  if (status == 0 || status == 2) {
	this.queryexec('update roomreservation set ridx = "'+ridx+'", stime = "'+stime+'", duration = "'+duration+'", people = "'+people+'", memo = "'+memo+'" , memo = "'+memo+'" , status = "'+status+'" , reason = null , ctime = null where idx = "'+idx+'"');
  } else  {
    this.queryexec('update roomreservation set ridx = "'+ridx+'", stime = "'+stime+'", duration = "'+duration+'", people = "'+people+'", memo = "'+memo+'" , memo = "'+memo+'" , status = "'+status+'" , reason = "'+reason+'" , ctime = "'+ctime+'" where idx = "'+idx+'"');
  }
}
 //결제 기능 디벨롭 이후 총 결제액과 적립금 DB와 연동할 필요 (expense, reserve)
sampleDAO.insertReservation = async function(ridx, stime, duration, people, expense, memo, midx) {
	this.queryexec('insert into roomreservation (ridx, stime, duration, people, memo, midx, time, status,expense) values ("'+ridx+'","'+stime+'","'+duration+'","'+people+'","'+memo+'","'+midx+'",now(),0,'+expense+')');
}
//================================(Admin - 회원 관리)
sampleDAO.selectPagingTotalMember = async function(searchType , search)
{
	let sql = 'SELECT count(*) count FROM member ';
	if(search != null && search != ''){
		sql += 'where '
		switch(searchType){
			case"id": sql += 'id like '; break;
			case"name": sql += 'name like '; break;
			case"nick": sql += 'nick like '; break;
			case"rdate": sql += 'rdate like '; break;
			case"number": sql += 'number like '; break;
		}
    if (searchType == 'number'){ //문자열의 길이에 따라 Year, Month, Day 앞에 하이픈(-)기호를 삽입
      sql += " concat ('%' , '"+search.replace(/\-/g,'')+"' , '%') "
    } else if (searchType == 'rdate') {
      let searchD = search.replace(/\s/gi, "");
        if(searchD.length == 8) {
          var searchDate = searchD.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
          sql += " concat ('%' , '"+searchDate+"' , '%') "
          } else {
            sql += " concat ('%' , '"+searchD+"' , '%') "
          }
    } else {
      sql += " concat ('%' , '"+search+"' , '%') "
    }
	}
	return await this.queryselect(sql);
}
sampleDAO.selectPagingMember = async function(pagenum, pagepercount , searchType , search) 
{
	let skip = pagenum*pagepercount;
	let sql = 'select * from member ';
	if(search != null && search != ''){
		sql += 'where '
		switch(searchType){
			case"id": sql += 'id like '; break;
			case"name": sql += 'name like '; break;
			case"nick": sql += 'nick like '; break;
			case"rdate": sql += 'rdate like '; break;
			case"number": sql += 'number like '; break;
		}
    if (searchType == 'number'){ //문자열의 길이에 따라 Year, Month, Day 앞에 하이픈(-)기호를 삽입
      sql += " concat ('%' , '"+search.replace(/\-/g,'')+"' , '%') "
    } else if (searchType == 'rdate') {
      let searchD = search.replace(/\s/gi, "");
      if(searchD.length == 8) {
        var searchDate = searchD.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
        sql += " concat ('%' , '"+searchDate+"' , '%') "
        } else {
          sql += " concat ('%' , '"+searchD+"' , '%') "
        }
    } else {
      sql += " concat ('%' , '"+search+"' , '%') "
    }
	}
	sql += 'order by rdate desc ' + 'limit ' + skip + "," + pagepercount;
	return await this.queryselect(sql);
}
sampleDAO.checkLogin = async function(id,pw) 
{			
	return await this.queryselect('select * from member where id = "'+id+'" and pw = "'+pw+'"')
}
sampleDAO.checkDuplIdx = async function(idx) 
{
	return await this.queryselect('select * from member where idx = "'+idx+'" limit 1')
}
sampleDAO.checkDuplId = async function(id) 
{
	return await this.queryselect('select * from member where id = "'+id+'" limit 1')
}
sampleDAO.checkDuplNick = async function(nick) 
{
	return await this.queryselect('select * from member where nick = "'+nick+'" limit 1')
}
sampleDAO.checkDuplNumber = async function(number) 
{
	return await this.queryselect('select * from member where number = "'+number+'" limit 1')
}
sampleDAO.countDuplNumber = async function(number,idx) 
{
	return await this.queryselect('SELECT count(*) count FROM member where number = "'+number+'" and not idx  = "'+idx+'" ')
}
sampleDAO.findPw = async function(id,name,bNumber4) 
{			
	return await this.queryselect('select * from member where id = "'+id+'" and name = "'+name+'" and RIGHT(number, 4) = "'+bNumber4+'" ')
}
sampleDAO.resetPw = async function(id,name) 
{			
	return await this.queryselect('update member set pw = "0000" where id = "'+id+'" and name = "'+name+'"')
}
sampleDAO.listMemberIdx = async function(dat)
{
	return await this.queryselect("SELECT * FROM member WHERE idx = "+dat+"")
}
sampleDAO.insertMember = async function(id, name, nick, ranking, pw, rdate, point, birth, number, push) {
	this.queryexec('insert into member (id, name, nick, ranking, pw, rdate , point, birth, number, push) values ("'+id+'","'+name+'","'+nick+'","'+ranking+'","'+pw+'","'+rdate+'",'+point+',"'+birth+'","'+number+'","'+push+'")');
}
sampleDAO.registerMember = async function(id,name,pw,birth,number) {
	this.queryexec('insert into member (id,name,nick,ranking,push,pw,point,birth,rdate,number) values ("'+id+'","'+name+'","z","일반","Y","'+pw+'","0","'+birth+'",now(),"'+number+'")');
}
sampleDAO.deleteMember = async function(idx){
	await this.queryexec('delete from member where idx='+ idx)
}
sampleDAO.updateApiMember = async function(idx, id, name, nick, ranking, pw, rdate, birth, number){
	this.queryexec('update member set id = "'+id+'", name = "'+name+'", nick = "'+nick+'", ranking = "'+ranking+'", pw = "'+pw+'", rdate = "'+rdate+'", birth = "'+birth+'", number = "'+number+'" where idx = "'+idx+'"');
}
sampleDAO.updateMember = async function(idx, id, name, nick, ranking, pw, rdate, point ,birth, number, push){
	this.queryexec('update member set id = "'+id+'", name = "'+name+'", nick = "'+nick+'", ranking = "'+ranking+'", pw = "'+pw+'", rdate = "'+rdate+'", birth = "'+birth+'", point = "'+point+'", number = "'+number+'", push = "'+push+'" where idx = "'+idx+'"');
}
sampleDAO.pushalarm_off = async function(idx){
	this.queryexec('update member set push = "N" where idx = "'+idx+'"');
}
sampleDAO.pushalarm_on = async function(idx){
	this.queryexec('update member set push = "Y" where idx = "'+idx+'"');
}
//================================(point 관리)
sampleDAO.pointMember = async function(number){
	return await this.queryselect("SELECT * FROM member WHERE number = "+number+"")
}
sampleDAO.updatePoint = async function(idx,point){
	this.queryexec('update member set point = point+'+point+' where idx = "'+idx+'"');
}
sampleDAO.insertPointlog = async function(midx,content,kind,amount) {
  this.queryexec('insert into pointlog(midx, content ,kind, amount, time) values ("'+midx+'","'+content+'","'+kind+'","'+amount+'",now())');
}
sampleDAO.selectPagingpoint = async function(idx,pagenum, pagepercount) {
  let skip = pagenum*pagepercount;
  return await this.queryselect("SELECT * FROM pointlog WHERE midx = "+idx+" order by time desc limit " + skip + "," + pagepercount)
}
sampleDAO.selectPagingTotalpoint = async function(idx) 
{
	let sql = 'SELECT count(*) count from pointlog where midx ='+idx;
  return await this.queryselect(sql);
}
//================================(alarm 관리)
sampleDAO.selectPagingAlarm = async function(idx,pagenum, pagepercount) {
  let skip = pagenum*pagepercount;
  return await this.queryselect("SELECT * FROM alarmlog WHERE midx = "+idx+" order by time desc limit " + skip + "," + pagepercount)
}
sampleDAO.selectPagingTotalAlarm = async function(idx) 
{
	let sql = 'SELECT count(*) count from alarmlog where midx ='+idx;
  return await this.queryselect(sql);
}
sampleDAO.registerAlarm = async function(idx) {
	this.queryexec('insert into alarmlog (kind, midx, content, status, time) values ("가입", '+idx+', "가입을 환영합니다!",0,now())');
}
sampleDAO.id_ = async function(id) 
{
  return await this.queryselect('select * from member where id="'+id+'"');
}
sampleDAO.qa_idx= async function(idx) 
{
  return await this.queryselect('select * from member a where a.nick in (select member from qa where idx="'+idx+'")');
}
sampleDAO.roomreser_idx= async function(idx) 
{
  return await this.queryselect('select b.idx as midx, c.roomNm  from roomreservation a, member b,room c where b.idx= a.midx and a.ridx=c.idx and a.idx="'+idx+'"');
}
sampleDAO.registerAlarm_qa = async function(idx) {
	this.queryexec('insert into alarmlog (kind, midx, content, status, time) values ("문의답변", '+idx+', "문의하신 답변이 등록되었습니다.",0, now())');
}
sampleDAO.resercancelAlarm = async function(idx,roomNm){
  this.queryexec('insert into alarmlog (kind, midx, content,status, time) values ("예약취소", '+idx+',"['+roomNm+'번 방] 예약 시간 30분이 지나 예약이 취소되었습니다.",0,now())')
}
// sampleDAO.reserAlarm = async function(idx,roomNm){
//   this.queryexec('insert into alarmlog (kind, midx, content, time) values ("예약완료", '+idx+',"['+roomNm+'번 방] 예약이 완료되었습니다.",now())')
// }
sampleDAO.reser5check = async function(idx){
  return await this.queryselect('select b.midx , a.roomNm from room a, roomreservation b where b.ridx = a.idx and a.idx ='+idx+' and b.status=0 and NOW()>=DATE_SUB(b.stime, INTERVAL 5 MINUTE) AND DATE_SUB(b.stime,INTERVAL 4 MINUTE) >NOW()')
}
sampleDAO.reser5mAlarm = async function(idx,roomNm){
  this.queryexec('insert into alarmlog (kind, midx, content, status, time) values ("입장대기", '+idx+',"['+roomNm+'번 방] 입장대기 안내입니다. 5분 이내에 입장 완료 바랍니다. ",0,now())')
}
sampleDAO.alarmcount = async function(idx){
  return await this.queryselect('select count(*) count from alarmlog where status=0 and midx='+idx+' order by time desc')
}
sampleDAO.updateCheck = async function(idx){
  this.queryexec('update alarmlog set status=1 where midx='+idx+' and status=0')
}
//================================(Admin- 알림 관리)
sampleDAO.selectPagingAlarmlog = async function(pagenum, pagepercount,search, searchalarmType) {
  let skip = pagenum*pagepercount;
  let sql = 'SELECT a.*,b.id FROM alarmlog a, member b where b.idx = a.midx ';
  if(searchalarmType != null && searchalarmType != '' && searchalarmType !="ALL"){
    sql += ' AND '
    switch(searchalarmType){
      case"가입": sql += 'kind = "가입" '; break;
      case"예약취소": sql += 'kind = "예약취소" '; break;
      case"입장대기": sql += 'kind = "입장대기" '; break;
      case"문의답변": sql += 'kind = "문의답변" '; break;
    }
  }
  if(search != null && search != ''){
    sql += " AND (id like concat ('%' , '"+search+"' , '%'))"
  }
  sql +=' order by time desc '
  sql += 'limit ' + skip + "," + pagepercount;
  return await this.queryselect(sql);
}
sampleDAO.selectPagingTotalAlarmlog = async function(search, searchalarmType) 
{
  let sql = 'SELECT a.*,count(b.id) count FROM alarmlog a, member b where b.idx = a.midx ';
  if(searchalarmType != null && searchalarmType != '' && searchalarmType !="ALL"){
    sql += ' AND '
    switch(searchalarmType){
      case"가입": sql += 'kind = "가입" '; break;
      case"예약취소": sql += 'kind = "예약취소" '; break;
      case"입장대기": sql += 'kind = "입장대기" '; break;
      case"문의답변": sql += 'kind = "문의답변" '; break;
    }
  }
  if(search != null && search != ''){
    sql += " AND (id like concat ('%' , '"+search+"' , '%'))"
  }
  sql +=' order by time desc '
  return await this.queryselect(sql);
}

//================================(Admin - 메뉴 관리)
sampleDAO.listMenu = async function(){
	return await this.queryselect("select * from menu order by udate desc");
}
sampleDAO.listMenucate = async function(cate)
{
	return await this.queryselect("SELECT * FROM menu WHERE category ='"+cate+"'")
}
sampleDAO.listMenuname = async function(name)
{
	return await this.queryselect("SELECT * FROM menu WHERE name ='"+name+"'")
}
sampleDAO.orderprice = async function(midx)
{
	return await this.queryselect("SELECT * FROM menu WHERE idx ='"+midx+"'")
}

//---------------------------------(주문 관리)
sampleDAO.listorder = async function(ridx,midx)
{
	return await this.queryselect("SELECT * FROM `order` WHERE ridx ='"+ridx+"' AND midx ='"+midx+"'")
}
sampleDAO.insertorder = async function(ridx,gidx,midx,amount,price,request) {
  this.queryexec('insert into `order`(ridx, gidx ,midx, amount, price ,request, payment, orderTime) values ("'+ridx+'","'+gidx+'","'+midx+'","'+amount+'","'+price+'","'+request+'",0,now())');
}
sampleDAO.selectPagingTotalOrder = async function(searchPaymentType,search) 
{
	let sql = "SELECT count(gidx) count from(select gidx from `order` where 1=1 ";
	
	if(searchPaymentType != null && searchPaymentType != '' && searchPaymentType !="pay"){
		sql += ' AND '
		switch(searchPaymentType){
		case"0": sql += 'payment = 0 '; break;
		case"1": sql += 'payment = 1 '; break;
    case"2": sql += 'payment = 2 '; break;
		}
	}
	if(search != null && search != ''){
		sql += " AND ridx like concat ('%' , '"+search+"' , '%')"
	}
	sql += " group by gidx)A "
	return await this.queryselect(sql)
}
sampleDAO.selectPagingOrder = async function(pagenum, pagepercount,searchPaymentType,search) 
{
	let skip = pagenum*pagepercount;
  let sql = "select *, case when a.paymentTime is null  then 0 when a.payment is not null then 1 end ing "
	sql += "from (select ridx , gidx,  sum(amount) amount , sum(amount * price) price, payment , orderTime , paymentTime from `order` where 1=1 ";
	if(searchPaymentType != null && searchPaymentType != '' && searchPaymentType !="pay"){
		sql += ' AND '
		switch(searchPaymentType){
		case"0": sql += 'payment = 0 '; break;
		case"1": sql += 'payment = 1 '; break;
    case"2": sql += 'payment = 2 '; break;
		}
	}
	if(search != null && search != ''){
		sql += " AND ridx like concat ('%' , '"+search+"' , '%') "
	}
	sql +=' group by gidx, ridx order by orderTime desc)a '
  sql +='order by ing ,paymentTime desc limit ' + skip + "," + pagepercount
	return await this.queryselect(sql)
}
sampleDAO.selectPagingTotalOrder_detail = async function(ridx,gidx) 
{
	return await this.queryselect("SELECT count(*) count FROM `order` WHERE ridx ='"+ridx+"' AND gidx = '"+gidx+"'")
}
sampleDAO.selectPagingOrder_detail = async function(pagenum, pagepercount,ridx,gidx) 
{
	let skip = pagenum*pagepercount;
	return await this.queryselect("SELECT  a.name,b.*  FROM menu a, `order` b WHERE a.idx = b.midx AND ridx ='"+ridx+"' AND gidx = '"+gidx+"' order by orderTime desc limit " + skip + "," + pagepercount)
}
sampleDAO.orderdetail_front = async function(ridx)//room roomNm
{
  return await this.queryselect("SELECT a.midx,b.name,b.price,a.amount FROM `order`a, menu b where a.midx=b.idx and a.ridx='"+ridx+"' and a.payment=0")
}
sampleDAO.ordersell = async function(ridx)
{
  return await this.queryselect("select * from `order` where ridx ='"+ridx+"' order by idx desc limit 1")
}
sampleDAO.ordersell_gidx = async function()
{
  return await this.queryselect("select gidx from `order` order by idx desc limit 1")
}
sampleDAO.ordercalculate = async function(idx,way,nextsell){
  this.queryexec('update `order` a, room b set a.payment ='+way+', a.paymentTime = now() where b.idx=a.ridx and b.idx='+idx+' and a.payment=0');
  this.queryexec('update roomlog a, room b set a.type ='+way+',a.etime = now() , b.status = 0 where b.idx=a.ridx and b.idx='+idx+' and a.type =0');
}

  //+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
  sampleDAO.selectPagingTotalMenu = async function(searchCateType,searchSellType,search) 
  {  
  let sql = 'SELECT count(*) count FROM pet where 1=1';
  if(searchCateType != null && searchCateType != '' && searchCateType !="ALLC"){
    sql += ' AND '
    switch(searchCateType){
    case"강아지": sql += 'name = "강아지" '; break;
    case"고양이": sql += 'name = "고양이" '; break;
    }
  }
  if(searchSellType != null && searchSellType != '' && searchSellType !="ALLS"){
    sql += 'AND '
    switch(searchSellType){
      case"서울시": sql += 'category= 서울시 '; break;
      case"인천시": sql += 'category= 인천시 '; break;
      case"대전시": sql += 'category= 대전시 '; break;
      case"광주시": sql += 'category= 광주시 '; break;
      case"대구시": sql += 'category= 대구시 '; break;
      case"울산시": sql += 'category= 울산시 '; break;
      case"부산시": sql += 'category= 부산시 '; break;
      case"경기도": sql += 'category= 경기도 '; break;
      case"강원도": sql += 'category= 강원도 '; break;
      case"세종시": sql += 'category= 세종시 '; break;
      case"충청남도": sql += 'category= 충청남도 '; break;
      case"충청북도": sql += 'category= 충청북도 '; break;
      case"전라남도": sql += 'category= 전라남도 '; break;
      case"전라북도": sql += 'category= 전라북도 '; break;
      case"경상남도": sql += 'category= 경상남도 '; break;
      case"경상북도": sql += 'category= 경상북도 '; break;
      case"제주도": sql += 'category= 제주도 '; break;
    }
  }
  // if(search != null && search != ''){
  //   sql += " AND name like concat ('%' , '"+search+"' , '%') "
  // }
  return await this.queryselect(sql);
  }
  sampleDAO.selectPagingMenu = async function(pagenum, pagepercount,searchCateType,searchSellType,search) 
  {  
  let skip = pagenum*pagepercount;
  let sql = 'SELECT * FROM pet where 1=1 ';
  if(searchCateType != null && searchCateType != '' && searchCateType !="ALLC"){
    sql += ' AND '
    switch(searchCateType){
    case"강아지": sql += 'name = "강아지" '; break;
    case"고양이": sql += 'name = "고양이" '; break;
    }
  }
  if(searchSellType != null && searchSellType != '' && searchSellType !="ALLS"){
    sql += 'AND '
    switch(searchSellType){
      case"서울시": sql += 'category= 서울시 '; break;
      case"인천시": sql += 'category= 인천시 '; break;
      case"대전시": sql += 'category= 대전시 '; break;
      case"광주시": sql += 'category= 광주시 '; break;
      case"대구시": sql += 'category= 대구시 '; break;
      case"울산시": sql += 'category= 울산시 '; break;
      case"부산시": sql += 'category= 부산시 '; break;
      case"경기도": sql += 'category= 경기도 '; break;
      case"강원도": sql += 'category= 강원도 '; break;
      case"세종시": sql += 'category= 세종시 '; break;
      case"충청남도": sql += 'category= 충청남도 '; break;
      case"충청북도": sql += 'category= 충청북도 '; break;
      case"전라남도": sql += 'category= 전라남도 '; break;
      case"전라북도": sql += 'category= 전라북도 '; break;
      case"경상남도": sql += 'category= 경상남도 '; break;
      case"경상북도": sql += 'category= 경상북도 '; break;
      case"제주도": sql += 'category= 제주도 '; break;
    }
  }
  sql +='order by date desc '
  sql += 'limit ' + skip + "," + pagepercount;
  return await this.queryselect(sql);
  }
  sampleDAO.insertMenuFile = async function(pic,name,category, date) {
  this.queryexec('insert into pet (pic, name, category, date) values ("'+pic+'","'+name+'","'+category+'","'+date+'")');
  }
  sampleDAO.deleteMenu = async function(idx){
  await this.queryexec('delete from pet where idx='+ idx)
  }
  sampleDAO.listMenu1 = async function(idx){
  return await this.queryselect("select * from pet where idx = "+idx);
  }
  sampleDAO.updateMenu = async function(idx,pic, name, category, date){
  this.queryexec('update pet set pic = "'+pic+'", name = "'+name+'", category = "'+category+'", date = "'+date+'" where idx = "'+idx+'"');
  }
  // 추가 사진 정보 (단건)
  sampleDAO.selectMenuFileDetail = async function(idx){
  return await this.queryselect('select * from menu where idx='+idx);
  }
  //추가 사진 삭제
  sampleDAO.deleteMenuFile = async function(idx){
  this.queryexec('delete from menu where idx ='+idx);
  }
//================================(Admin - 게임 관리)
sampleDAO.listGame = async function() // 데이터를 5개 제한 값만 가져와서 ranking대로 나열
{
  return this.queryselect("SELECT * FROM game order by grank desc limit 5 ") // 받아올 db 갯수 제한, order - 순위대로 정렬 (desc - 큰 값부터)
}
sampleDAO.listGame1 = async function() // 데이터를 5개 제한 값만 가져와서 ranking대로 나열
{
  return this.queryselect("SELECT * FROM game order by grank desc ") // 받아올 db 갯수 제한, order - 순위대로 정렬 (desc - 큰 값부터)
}
sampleDAO.listGame2 = async function(idx_) 
{
  return await tlanhis.queryselect("SELECT * FROM game WHERE idx = '"+idx_+"'" )
}
sampleDAO.listGame3 = async function(idx_) 
{
  return await this.queryselect("SELECT * FROM game_que WHERE idx = '"+idx_+"'" )
}
sampleDAO.listGame4 = async function(idx_) 
{
  return await this.queryselect("SELECT * FROM game_que WHERE gidx = '"+idx_+"'" )
}
sampleDAO.listComGame = async function(dat) 
{
  return await this.queryselect("SELECT * FROM game WHERE Kname like '"+dat+"' OR Ename like '"+dat+"'")
}
sampleDAO.insertGameFile = async function(pic, Kname,Ename, genre, umin, umax, playtime,explantime,level, loc, simexplan,vid, explan) {
  this.queryexec('insert into game (pic, Kname, Ename, genre, grank, umin, umax, playtime, explantime, level, loc, simexplan ,vid, explan, udate) values ("'+pic+'","'+Kname+'","'+Ename+'","'+genre+'",0,"'+umin+'","'+umax+'","'+playtime+'","'+explantime+'","'+level+'","'+loc+'","'+simexplan+'","'+vid+'","'+explan+'",now())');
}
sampleDAO.insertGameque = async function(idx_,que,ans) {
  this.queryexec('insert into game_que (gidx,que,ans,udate) values ("'+idx_+'","'+que+'","'+ans+'",now())');
}
sampleDAO.deleteGame = async function(idx)
{
  await this.queryexec('delete from game where idx='+ idx)
}
sampleDAO.deleteGame1 = async function(idx)
{
  await this.queryexec('delete from game_que where idx='+ idx)
}
sampleDAO.updateGame = async function(pic, Kname,Ename, genre, umin, umax, playtime,explantime,level, loc, simexplan ,vid, explan,idx)
{
  await this.queryexec('update game set pic = "'+pic+'", Kname = "'+Kname+'", Ename = "'+Ename+'", genre = "'+genre+'" , umin = "'+umin+'" , umax = "'+umax+'", playtime = "'+playtime+'", explantime = "'+explantime+'", level = "'+level+'", loc = "'+loc+'" , simexplan = "'+simexplan+'" , vid = "'+vid+'", explan = "'+explan+'" where idx = "'+idx+'"');
}
sampleDAO.updateGame1 = async function(que,ans,idx)
{
  await this.queryexec('update game_que set que = "'+que+'", ans = "'+ans+'" where idx ='+idx );
}
sampleDAO.updateGame2 = async function(grank,idx)
{
  await this.queryexec('update game set grank = "'+grank+'" where idx='+idx );
}

//+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
sampleDAO.selectPagingTotalGame = async function(searchGenreType,searchLevelType,search) 
{
  let sql = 'SELECT count(*) count FROM game where 1=1';
  if(searchGenreType != null && searchGenreType != '' && searchGenreType !="ALLG"){
    sql += ' AND '
    switch(searchGenreType){
      case"경쟁": sql += 'genre = "경쟁" '; break;
      case"추리": sql += 'genre = "추리" '; break;
      case"사고": sql += 'genre = "사고" '; break;
      case"순발력": sql += 'genre = "순발력" '; break;
      case"전략": sql += 'genre = "전략" '; break;
    }
    }
  if(searchLevelType != null && searchLevelType != '' && searchLevelType !="ALLL"){
    sql += ' AND '
    switch(searchLevelType){
      case"easy": sql += 'level = "easy" '; break;
      case"normal": sql += 'level = "normal" '; break;
      case"hard": sql += 'level = "hard" '; break;
      case"very hard": sql += 'level = "very hard" '; break;
    }
  }
  if(search != null && search != ''){
    sql += " AND (Kname like concat ('%' , '"+search+"' , '%') OR Ename like concat ('%' , '"+search+"' , '%'))"
  }
  return await this.queryselect(sql);
}
sampleDAO.selectPagingTotalGame_q = async function(gidx) 
{
  return await this.queryselect("SELECT count(*) count FROM game_que where gidx ="+gidx);
}
sampleDAO.selectPagingGame = async function(pagenum, pagepercount,searchGenreType,searchLevelType,search) 
{
  let skip = pagenum*pagepercount;
  let sql = 'SELECT * FROM game where 1=1';
  if(searchGenreType != null && searchGenreType != '' && searchGenreType !="ALLG"){
    sql += ' AND '
    switch(searchGenreType){
      case"경쟁": sql += 'genre = "경쟁" '; break;
      case"추리": sql += 'genre = "추리" '; break;
      case"사고": sql += 'genre = "사고" '; break;
      case"순발력": sql += 'genre = "순발력" '; break;
      case"전략": sql += 'genre = "전략" '; break;
    }
    }
  if(searchLevelType != null && searchLevelType != '' && searchLevelType !="ALLL"){
    sql += ' AND '
    switch(searchLevelType){
      case"easy": sql += 'level = "easy" '; break;
      case"normal": sql += 'level = "normal" '; break;
      case"hard": sql += 'level = "hard" '; break;
      case"very hard": sql += 'level = "very hard" '; break;
    }
  }
  if(search != null && search != ''){
    sql += " AND (Kname like concat ('%' , '"+search+"' , '%') OR Ename like concat ('%' , '"+search+"' , '%'))"
  }
  sql +=' order by udate desc '
  sql += 'limit ' + skip + "," + pagepercount;
  return await this.queryselect(sql);
}
sampleDAO.selectPagingGame_q = async function(pagenum, pagepercount , gidx) 
{
  let skip = pagenum*pagepercount;
  return await this.queryselect("SELECT * FROM game_que where gidx = "+gidx+" order by udate desc , idx desc limit " + skip + "," + pagepercount )
}
sampleDAO.insertgamePic = async function(gamePic,gameName,) {
  this.queryexec('insert into menu (pic, menuName, price, udate) values ("'+pic+'","'+menuName+'","'+price+'",now())');
}

//================================(Customer - 메인 페이지 - 게임 순위)
sampleDAO.selectGame = async function(idx) 
{
	return await this.queryselect("SELECT * FROM game WHERE idx = "+idx)
}
sampleDAO.selectGame_q = async function(idx) 
{
	return await this.queryselect("SELECT * FROM game_que WHERE gidx ="+idx)
}
sampleDAO.selectGame2 = async function(usel,ptime,etime,genr,lev,search) 
{
	let sql = "SELECT * FROM game WHERE 1=1";
	if(usel != '' && usel != null) {
		console.log("usel",usel)
		if(usel =="6"){
			sql += ' AND umax >= 5 ';}
			else{sql += ' AND umax >= '+usel+' AND umin <= '+usel;}
	}
	if(ptime != '' && ptime != null) sql += ' AND playtime = "'+ptime+'"';
	if(etime != '' && etime != null) sql += ' AND explantime = "'+etime+'"';
	if(genr != '' && genr != null) sql += ' AND genre = "'+genr+'"';
	if(lev != '' && lev != null) sql += ' AND level = "'+lev+'"';
	if(search != '' && search != null) sql += ' AND (Kname like "%'+search+'%" OR Ename like "%'+search+'%")';
	return await this.queryselect(sql)
	//"SELECT * FROM game WHERE umax>= '"+usel+"'AND playtime = '"+ptime+"' AND  explantime ='"+etime+"' AND genre = '"+genr+"' AND level = '"+lev+"' "
}
//  =  =  =  =  =  =  =  =  =  =  =  =  =  =  =
sampleDAO.deleteTitle4 = async function(idx)
{
	await this.queryexec('delete from game where idx='+idx)
}
sampleDAO.selectPagingTotal4 = async function() 
{
	return await this.queryselect("SELECT count(*) count FROM menudb")
}
sampleDAO.selectPaging4 = async function(pagenum, pagepercount) 
{
	let skip = pagenum*pagepercount;
	return await this.queryselect("SELECT * FROM menudb limit " + skip + "," + pagepercount)
}
sampleDAO.insertTitle4 = async function(idx,content,number) 
{
	await this.queryexec('insert into menudb(idx,content,number) value("'+idx+'","'+content+'","'+number+'")')
}
//================================(Admin - 방 관리)
sampleDAO.listRoomWaitroom = async function()
{
  return await this.queryselect("select *,(select file from roomPic where ridx = room.idx limit 1 ) AS file from room order by roomNm asc ")
}
sampleDAO.listRoom = async function()
{
	return await this.queryselect("select * ,(select file from roomPic where ridx = room.idx limit 1 ) roomPic from room order by roomNm asc ")
}
sampleDAO.listMainRoom = async function()
{
	return await this.queryselect("SELECT * ,(SELECT file FROM roomPic WHERE ridx = room.idx limit 1 ) AS file FROM room ORDER BY RAND() LIMIT 5 ")
}
sampleDAO.listRoom2 = async function(idx) 
{
	return await this.queryselect("SELECT *,(SELECT file FROM roomPic WHERE ridx = room.idx limit 1 ) AS file FROM room WHERE idx = '"+idx+"'")
}
sampleDAO.listRoom1 = async function(idx) 
{
	return await this.queryselect("SELECT * FROM room WHERE idx = '"+idx+"'")
}
sampleDAO.listRoom3 = async function(idx) 
{
	return await this.queryselect("SELECT roomNm FROM room WHERE idx = '"+idx+"'")
}
sampleDAO.listRoom4 = async function(idx) 
{
	return await this.queryselect("SELECT roomNm FROM room order by roomNm")
}
sampleDAO.listRoom4_idx = async function(idx) 
{
	return await this.queryselect("SELECT idx FROM room order by roomNm")
}
sampleDAO.listRoom5 = async function(idx) 
{
	return await this.queryselect("SELECT * FROM room order by roomNm asc")
}
sampleDAO.listRoomNm = async function(roomNm) 
{
	return await this.queryselect("SELECT idx FROM room WHERE roomNm = '"+roomNm+"'")
}
sampleDAO.listRoom_roomreser = async function(idx) 
{
	return await this.queryselect("SELECT a.* FROM room a, roomreservation b WHERE b.ridx=a.roomNm and b.idx = '"+idx+"'")
}
sampleDAO.listRoomPic = async function(idx)
{
	return await this.queryselect("SELECT idx AS subIdx, ridx, file FROM roomPic WHERE ridx = '"+idx+"'")
}
sampleDAO.selectPagingTotalRoom = async function() 
{
	return await this.queryselect("SELECT count(*) count FROM room order by roomNm")
}
sampleDAO.selectPagingRoom = async function(pagenum, pagepercount) 
{
	let skip = pagenum*pagepercount;
	return await this.queryselect("SELECT * FROM room order by roomNm limit " + skip + "," + pagepercount)
}
sampleDAO.countDuplroomNm = async function(roomNm,idx) 
{
	return await this.queryselect('SELECT count(*) count FROM room where roomNm = "'+roomNm+'" and not idx  = "'+idx+'" ')
}
sampleDAO.insertRoomInfo = async function(account,name,roomNm,peopleMin,peopleMax,price,TPRate,PPRate){	
	await this.queryexec('insert into room(account,name,roomNm,peopleMin,peopleMax,price,TPRate,PPRate,rdate,status) values("'+account+'","'+name+'","'+roomNm+'","'+peopleMin+'","'+peopleMax+'","'+price+'","'+TPRate+'","'+PPRate+'",now(),0);');
	return await this.queryselect('SELECT idx from room order by idx desc limit 1 ');
}
sampleDAO.insertRoomFiles = async function(ridx, files){
	this.queryexec('insert into roomPic (ridx, file) values ("'+ridx+'" , "'+files+'")');
}
sampleDAO.updateRoomInfo = async function(idx,account,name,roomNm,peopleMin,peopleMax,price,TPRate,PPRate)
{
	await this.queryexec("update room set account = '"+account+"',name = '"+name+"',roomNm = '"+roomNm+"',peopleMin = '"+peopleMin+"',peopleMax = '"+peopleMax+"',price = '"+price+"',TPRate = '"+TPRate+"',PPRate = '"+PPRate+"' where idx = '"+idx+"'");
}
sampleDAO.deleteRoom = async function(idx)
{
	await this.queryexec('delete from room where idx='+ idx)
	await this.queryexec('delete from roomPic where ridx='+ idx)
}
sampleDAO.selectOneRoomPic = async function(idx){
	return await this.queryselect('select * from roomPic where idx='+idx);
}
sampleDAO.selectRoomPic = async function(idx){
	return await this.queryselect('select * from roomPic where ridx='+idx);
}
sampleDAO.deleteOneRoomPic = async function(idx){
	this.queryexec('delete from roomPic where idx ='+idx);
}
sampleDAO.updateOneRoomPic = async function(idx , saveNm){
	this.queryexec('update roomPic set file ="'+saveNm+'" where idx = '+idx)
}
//================================(Admin - 방 사용 관리)
sampleDAO.selectPagingTotalRoomlog = async function(search) 
{
	let sql = "SELECT count(*) count from roomlog where 1=1 ";
	if(search != null && search != ''){
		sql += " AND ridx like concat ('%' , '"+search+"' , '%')"
	}
	return await this.queryselect(sql)
}
sampleDAO.selectPagingRoomlog = async function(pagenum, pagepercount,search) 
{
	let skip = pagenum*pagepercount;
  let sql = "select *, case when a.type !=0 then 0 when a.type=0 then 1 end ing "
	sql += "from(SELECT c.* , b.roomNm as roomNm FROM `roomlog`c, room b where 1=1 and b.idx = c.ridx  ";
	if(search != null && search != ''){
		sql += " AND ridx like concat ('%' , '"+search+"' , '%') "
	}
	sql +='  order by c.stime desc)a '
  sql +='order by ing desc,etime desc,stime desc limit ' + skip + "," + pagepercount
	return await this.queryselect(sql)
}

//================================(Admin - 직원 관리)
sampleDAO.selectPagingTotalStaff = async function(searchType , search)
{
	let sql = 'SELECT count(*) count FROM staff ';
	if(search != null && search != ''){
		sql += 'where '
		switch(searchType){
			case"idx": sql += 'idx like '; break;
			case"name": sql += 'name like '; break;
			case"number": sql += 'number like '; break;
		}
    if (searchType == 'number'){ //하이픈이 들어간 전화번호 검색시 하이픈 제거
      sql += " concat ('%' , '"+search.replace(/\-/g,'')+"' , '%') "
    } else {
      sql += " concat ('%' , '"+search+"' , '%') "
    }
	}
	return await this.queryselect(sql);
}
sampleDAO.selectPagingStaff = async function(pagenum, pagepercount , searchType , search) 
{
	let skip = pagenum*pagepercount;
	let sql = 'SELECT * FROM staff ';
	if(search != null && search != ''){
		sql += 'where '
		switch(searchType){
			case"idx": sql += 'idx like '; break;
			case"name": sql += 'name like '; break;
			case"number": sql += 'number like '; break;
		}
    if (searchType == 'number'){ //하이픈이 들어간 전화번호 검색시 하이픈 제거
      sql += " concat ('%' , '"+search.replace(/\-/g,'')+"' , '%') "
    } else {
      sql += " concat ('%' , '"+search+"' , '%') "
    }
	}
	sql += 'order by hdate desc ' + 'limit ' + skip + "," + pagepercount;
	return await this.queryselect(sql);
}
sampleDAO.listStaffIdx = async function(dat)
{
	return await this.queryselect("SELECT * FROM staff WHERE idx = "+dat+"")
}
sampleDAO.insertStaff = async function(name, hdate, birth, number, address, etc) {
	this.queryexec('insert into staff (name, hdate, birth, number, address, etc) values ("'+name+'","'+hdate+'","'+birth+'","'+number+'","'+address+'","'+etc+'")');
}
sampleDAO.deleteStaff = async function(idx){
	await this.queryexec('delete from staff where idx='+ idx)
}
sampleDAO.updateStaff = async function(idx, name, hdate, birth, number, address, etc){
	this.queryexec('update staff set name = "'+name+'", hdate = "'+hdate+'", birth = "'+birth+'", number = "'+number+'", address = "'+address+'", etc = "'+etc+'" where idx = "'+idx+'"');
}
//================================(Admin - 적립금 및 등급 관리)
sampleDAO.listSettings = async function()
{
	return await this.queryselect("SELECT * FROM settings limit 1 ")
}
sampleDAO.updateSettings = async function(idx, rrate, rankstand){
	this.queryexec('update settings set rrate = "'+rrate+'", rankstand = "'+rankstand+'" where idx = "'+idx+'"');
}
sampleDAO.selectPagingTotalPointlog = async function(search) 
{
  let sql = 'select a.*,count(b.id) count from pointlog a, member b where a.midx = b.idx ';
  if(search != null && search != ''){
    sql += " AND (b.id like concat ('%' , '"+search+"' , '%'))"
  }
  sql += ' order by a.time desc '
  return await this.queryselect(sql);
}
sampleDAO.selectPagingPointlog = async function(pagenum, pagepercount,search) 
{
  let skip = pagenum*pagepercount;
  let sql = 'select a.*,b.id from pointlog a, member b where a.midx = b.idx ';
  if(search != null && search != ''){
    sql += " AND (b.id like concat ('%' , '"+search+"' , '%'))"
  }
  sql +=' order by a.time desc '
  sql += 'limit ' + skip + "," + pagepercount;
  return await this.queryselect(sql);
}
//================================(wifi - wifi)
sampleDAO.listWifi = async function()
{
  return await this.queryselect("select * from wifi")
}
sampleDAO.insertwifidefault = async function(id1,id2,pw) 
{
  await this.queryexec("insert into wifi(id1, id2, pw) value('','','')")
}
sampleDAO.updateWifi = async function(id1, id2, pw){
	this.queryexec('update wifi set id1 = "'+id1+'", id2 = "'+id2+'" , pw = "'+pw+'"');
}
sampleDAO.updatedeletewifi = async function(){
	this.queryexec('update wifi set id1 = "", id2 = "" , pw = ""');
}
//================================(Admin - 채팅)
sampleDAO.selectlistchatmacro = async function(pagenum, pagepercount) 
{
	let skip = pagenum*pagepercount;
	return await this.queryselect("select * from chatmacro limit " + skip + "," + pagepercount)
}
sampleDAO.selectlistTotalchatmacro = async function()
{
  return await this.queryselect("select count(*) count from chatmacro")
}
sampleDAO.listchatmacro = async function()
{
  return await this.queryselect("select * from chatmacro")
}
sampleDAO.insertmacro= async function(data) 
{
  await this.queryexec('insert into chatmacro(macro) value("'+data+'")')
}
sampleDAO.updatemacro = async function(idx,macro){
	this.queryexec('update chatmacro set macro = "'+macro+'" where idx = '+idx);
}
sampleDAO.deletemacro = async function(idx){
	this.queryexec('delete from chatmacro where idx = '+idx);
}
//================================(Admin - 공지사항)
sampleDAO.listNotice_ = async function()
{
  return this.queryselect("SELECT * FROM notice where (process=2 || process=0) order by udate desc") // 정확히 dat에 해당하는 인자값(idx)과 관련된 데이터들을 가져오도록 함.
}
sampleDAO.listNotice = async function(dat)
{
  return this.queryselect("SELECT * FROM notice WHERE idx = "+dat+" order by udate desc") // 정확히 dat에 해당하는 인자값(idx)과 관련된 데이터들을 가져오도록 함.
}
sampleDAO.prevNoitce = async function(idx)
{
	return await this.queryselect("SELECT * FROM notice WHERE idx < "+idx+" ORDER BY idx DESC LIMIT 1");
};
sampleDAO.nextNoitce = async function(idx)
{
	let sql = "SELECT * FROM notice WHERE idx > "+idx+" ORDER BY idx LIMIT 1 ";
	return await this.queryselect(sql);
};
//+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
sampleDAO.selectPagingTotalNotice = async function(search) 
{
	let sql = 'SELECT count(*) count FROM notice ';
	if(search != null && search != ''){
		sql += 'where '
		sql += " title like concat ('%' , '"+search+"' , '%') "
	}
	return await this.queryselect(sql);
}
sampleDAO.selectPagingNotice = async function(pagenum, pagepercount,search) 
{
	let skip = pagenum*pagepercount;
	let sql = 'SELECT * FROM notice ';
	if(search != null && search != ''){
		sql += 'where '
		sql += " title like concat ('%' , '"+search+"' , '%') "
	}
	sql += 'order by udate desc ' + 'limit ' + skip + "," + pagepercount;
	return await this.queryselect(sql);
} 
sampleDAO.selectNoticeDetail = async function(idx){
  return await this.queryselect("select * from notice where idx = "+idx);
}
sampleDAO.insertNotice = async function(title,content) 
{
  await this.queryexec("insert into notice(title, content, udate) value('"+title+"','"+content+"',now())")
}
sampleDAO.deleteNotice = async function(idx)
{
  await this.queryexec('delete from notice where idx='+ idx)
}
sampleDAO.updateNotice = async function(idx,title,content){
  this.queryexec("update notice set title = '"+title+"', content ='"+content+"' where idx = '"+idx+"'");
}
//=================================================이벤트
sampleDAO.selectPagingTotalEvent = async function(searchProcessType,search,today) 
{
  let sql = 'SELECT count(*) count FROM event where 1=1';
//   if( st != null && st != '' && ed !=null && ed != ''){
// 	sql += ' AND '
// 	sql +=' start>="'+st+'" && end<="'+ed+'"'
//    }
  if(searchProcessType != null && searchProcessType != '' && searchProcessType !="process"){
    sql += ' AND '
    switch(searchProcessType){
		case"0": sql += " DATE(now()) BETWEEN DATE(start) AND DATE(end)"; break;
		case"1": sql += "DATE(start) > DATE(now()) "; break;
		case"2": sql += "DATE(end) < DATE(now()) "; break;
    }
  }
  if(search != null && search != ''){
    sql += " AND title like concat ('%' , '"+search+"' , '%')"
  }
  return await this.queryselect(sql);
}
sampleDAO.selectPagingEvent = async function(pagenum, pagepercount,searchProcessType,search,today) 
{
	let skip = pagenum*pagepercount;
	let sql = 'SELECT * FROM event where 1=1 ';
	// if(st != null && st != ''&&ed != null && ed != ''){
	// 	sql += ' AND '
	// 	sql +=' start>="'+st+'" && end<="'+ed+'"'
	// }
	if(searchProcessType != null && searchProcessType != '' && searchProcessType !="process"){
		sql += ' AND '
		switch(searchProcessType){
		  case"0": sql += " DATE(now()) BETWEEN DATE(start) AND DATE(end)"; break;
		  start <= today && today <= list[i].end
		  case"1": sql += "DATE(start) > DATE(now()) "; break;
		  case"2": sql += "DATE(end) < DATE(now()) "; break;
		}
	  }
	  if(search != null && search != ''){
		sql += " AND title like concat ('%' , '"+search+"' , '%')"
	  }
	sql +='order by udate desc '
	sql += 'limit ' + skip + "," + pagepercount;
	return await this.queryselect(sql);
} 
sampleDAO.insertEvent = async function(title,content,start,end) {
	this.queryexec("insert into event (title,content,start,end,udate) values ('"+title+"','"+content+"','"+start+"','"+end+"',now())");
}
sampleDAO.listEvent = async function(dat)
{
  return this.queryselect("SELECT * FROM event WHERE idx = "+dat+" ") // 정확히 dat에 해당하는 인자값(idx)과 관련된 데이터들을 가져오도록 함.
}
sampleDAO.updateEvent = async function(title,content,start,end,idx) 
{
	this.queryexec("update event set title = '"+title+"', content = '"+content+"', start = '"+start+"', end = '"+end+"' where idx = '"+idx+"'");
}
sampleDAO.deleteEvent = async function(idx)
{
  await this.queryexec('delete from event where idx='+ idx)
}
sampleDAO.nextEvent = async function(no)
{
  let sql ='select * from(select  * ,case when date(now())  between date(start) and date(end) then 0 when date(now()) < date(start) then 1 when date(now()) > date(end) then 2 end ing , @rownum:=@rownum+1 no ';
	sql +='FROM event , (SELECT @rownum:=0) TMP '
  sql +='order by ing , end , udate)A '
  sql +='where no<"'+no+'" order by no desc limit 1'
	return await this.queryselect(sql);
};
sampleDAO.prevEvent = async function(no)
{
	let sql ='select * from(select  * ,case when date(now())  between date(start) and date(end) then 0 when date(now()) < date(start) then 1 when date(now()) > date(end) then 2 end ing , @rownum:=@rownum+1 no ';
	sql +='FROM event , (SELECT @rownum:=0) TMP '
  sql +='order by ing , end , udate)A '
  sql +='where no>"'+no+'" order by no limit 1'
	return await this.queryselect(sql);
};
sampleDAO.selectPagingTotalEvent_api = async function() 
{
	let sql = 'SELECT count(*) count from `event` ';
  return await this.queryselect(sql);
}
sampleDAO.selectPagingEvent_api = async function(pagenum, pagepercount) 
{
	let skip = pagenum*pagepercount;
	let sql = 'SELECT * from(SELECT *, case when date(now())  between date(start) and date(end) then 0 when date(now()) < date(start) then 1 when date(now()) > date(end) then 2 end ing , @rownum:=@rownum+1 no '
	sql +='FROM event , (SELECT @rownum:=0) TMP '
  sql +='order by ing , end , udate) A '
	sql += 'limit ' + skip + "," + pagepercount;
	return await this.queryselect(sql);
} 
//==================================문의내역
sampleDAO.selectPagingTotalQuestion = async function(searchCateType,searchCheckType,search) 
{
  let sql = 'SELECT count(*) count FROM qa where 1=1';
  if(searchCateType != null && searchCateType != '' && searchCateType !="ALLG"){
    sql += ' AND '
    switch(searchCateType){
      case"예약": sql += 'category = "예약" '; break;
      case"게임": sql += 'category = "게임" '; break;
      case"기타": sql += 'category = "기타" '; break;
    }
    }
  if(searchCheckType != null && searchCheckType != '' && searchCheckType !="ALLL"){
    sql += ' AND '
    switch(searchCheckType){
      case"O": sql += 'anscheck = "답변 완료" '; break;
      case"X": sql += 'anscheck = "미답변" '; break;
    }
  }
  if(search != null && search != ''){
    sql += " AND title like concat ('%' , '"+search+"' , '%')"
  }
  sql +=' order by udate desc'
  return await this.queryselect(sql);
}
sampleDAO.selectPagingQuestion = async function(pagenum, pagepercount,searchCateType,searchCheckType,search) 
{
  let skip = pagenum*pagepercount;
  let sql = 'SELECT * FROM qa where 1=1';
  if(searchCateType != null && searchCateType != '' && searchCateType !="ALLG"){
    sql += ' AND '
    switch(searchCateType){
		case"예약": sql += 'category = "예약" '; break;
		case"게임": sql += 'category = "게임" '; break;
		case"기타": sql += 'category = "기타" '; break;
	  }
	  }
	if(searchCheckType != null && searchCheckType != '' && searchCheckType !="ALLL"){
	  sql += ' AND '
	  switch(searchCheckType){
		case"O": sql += 'anscheck = "답변 완료" '; break;
		case"X": sql += 'anscheck = "미답변" '; break;
	  }
	}
	if(search != null && search != ''){
	  sql += " AND title like concat ('%' , '"+search+"' , '%')"
	}
  sql +=' order by udate desc '
  sql += 'limit ' + skip + "," + pagepercount;
  return await this.queryselect(sql);
}
sampleDAO.selectPagingTotalQuestion_api = async function(member) 
{
  let sql = 'SELECT count(*) count FROM qa where 1=1';
  sql +=" AND member ='"+member+"'"
  sql +=' order by udate desc'
  return await this.queryselect(sql);
}
sampleDAO.selectPagingQuestion_api = async function(pagenum, pagepercount,member) 
{
  let skip = pagenum*pagepercount;
  let sql = 'SELECT * FROM qa where 1=1';
  sql +=" AND member ='"+member+"'"
  sql +=' order by udate desc '
  sql += 'limit ' + skip + "," + pagepercount;
  return await this.queryselect(sql);
}
sampleDAO.insertquestion = async function(member,category,title,content,pic1,pic2) 
{
	this.queryexec("insert into qa(member,category,title,content,anscheck,pic1,pic2,udate) values ('"+member+"','"+category+"','"+title+"','"+content+"','미답변','"+pic1+"','"+pic2+"',now())");
}
sampleDAO.listQuestion = async function(idx)
{
  return this.queryselect("SELECT * FROM qa WHERE idx = "+idx+" ") // 정확히 dat에 해당하는 인자값(idx)과 관련된 데이터들을 가져오도록 함.
}
sampleDAO.prevQuestion = async function(idx,member)
{
	return await this.queryselect("SELECT * FROM qa WHERE member ='"+member+"' AND idx < "+idx+" ORDER BY idx DESC LIMIT 1");
};
sampleDAO.nextQuestion = async function(idx,member)
{
	return await this.queryselect("SELECT * FROM qa WHERE member ='"+member+"' AND idx > "+idx+" ORDER BY idx LIMIT 1 ");
};
sampleDAO.deleteQuestion = async function(idx)
{
  await this.queryexec('delete from qa where idx='+ idx)
}
sampleDAO.answerQuestion = async function(idx,anscontent) 
{
	this.queryexec("update qa set anscontent = '"+anscontent+"', anscheck = '답변 완료', ansdate = now() where idx = '"+idx+"'");
}

//=======================================(이용약관)
sampleDAO.terms = async function() 
{
	return await this.queryselect("select * from terms")
}
sampleDAO.insertTerms = async function(title,content) 
{
	this.queryexec("insert into terms(title,content) values ('"+title+"','"+content+"')");
}
sampleDAO.updateTerms = async function(title,content) 
{
	this.queryexec("update terms set title = '"+title+"', content = '"+content+"'");
}
sampleDAO.deleteTemrs = async function()
{
  await this.queryexec('delete from terms')
}
//=======================================(Waitroom - 방 사용하기(KIOSK))
sampleDAO.orderRoom = async function(idx, duration, people, price) {
	this.queryexec('insert into roomlog (ridx, duration,duration_add, people, fpay,apay, stime,type) values ("'+idx+'","'+duration+'", 0 ,"'+people+'","'+price+'",0,now(),0)');
}
sampleDAO.updatestatus = async function(idx) 
{
	this.queryexec("update room set status = 1 where idx = '"+idx+"'");
}
sampleDAO.updatestatus_roomreser = async function(roomreseridx) 
{
	this.queryexec("update roomreservation set status = 2 where idx = '"+roomreseridx+"' and status=0");
}
sampleDAO.listRoomoption = async function(people)
{
  let sql = "select * from room where 1=1 "
  if(people != null && people != '' && people !="1"){
    if(people=='5'){
      sql += " and peopleMax >="+people;
     }else{
      sql += " and "+people+" >= peopleMin and "+people+" <=peopleMax ";
     }
     sql += " and status=0 ";
    }
  return await this.queryselect(sql);
}
sampleDAO.timecalculate = async function(idx)
{
	return await this.queryselect("SELECT b.* FROM room a, roomlog b where a.idx=b.ridx and a.idx="+idx+" and b.type = 0 ");
};
sampleDAO.orderroom_front = async function(idx)
{
  return await this.queryselect("select b.* from room a, roomlog b where a.idx = b.ridx and a.idx="+idx+" and b.type = 0")
}
sampleDAO.reserveUseRoom = async function(ridx, stime, duration, people,expense) {
	this.queryexec('insert into roomLog (ridx, stime, duration,duration_add,people,fpay,apay,type) values ("'+ridx+'","'+stime+'","'+duration+'",0,"'+people+'",'+expense+',0,0)');
}
sampleDAO.getRoomLog = async function(ridx)
{
  return await this.queryselect("select a.idx, a.roomNm, b.duration, b.people, b.fpay from room a, roomlog b where b.ridx = a.idx and b.ridx = "+ridx+" and b.type = 0")
}
sampleDAO.updateduration = async function(idx,time,apay) 
{
	this.queryexec('update room a,roomlog b set b.duration_add=(b.duration_add+"'+time+'") , b.apay=(b.apay+"'+apay+'")  where a.idx=b.ridx and a.idx="'+idx+'" and b.type = 0');
}
sampleDAO.addtime_apay = async function(idx)
{
  return await this.queryselect("select a.*, b.* from room a, roomlog b where a.idx = b.ridx and a.idx="+idx+" and b.type = 0")
}
//===================================================(To-do-list)
sampleDAO.selectPagingTotalTodo = async function(todoProcessType) 
{ 
  let sql='SELECT count(*) count FROM todolist where 1=1'
  if(todoProcessType != null && todoProcessType != '' && todoProcessType !="process"){
    sql += ' AND '
    switch(todoProcessType){
		case"2": sql += " day like concat('%' , 2 , '%')"; break;
    case"3": sql += " day like concat('%' , 3 , '%')"; break;
    case"4": sql += " day like concat('%' , 4 , '%')"; break;
    case"5": sql += " day like concat('%' , 5 , '%')"; break;
    case"6": sql += " day like concat('%' , 6 , '%')"; break;
    case"7": sql += " day like concat('%' , 7 , '%')"; break;
    case"1": sql += " day like concat('%' , 1 , '%')"; break;
    case"0": sql += " day like concat('%' , 0 , '%')"; break;
    }
  }
  sql+=' or day = 0'
  sql +=' order by etime desc,stime desc,day desc'
	return await this.queryselect(sql)
}
sampleDAO.selectPagingTodo = async function(pagenum, pagepercount,todoProcessType) 
{
  let sql='SELECT * FROM todolist where 1=1'
	let skip = pagenum*pagepercount;
  if(todoProcessType != null && todoProcessType != '' && todoProcessType !="process"){
    sql += ' AND '
    switch(todoProcessType){
		case"2": sql += " day like concat('%' , 2 , '%')"; break;
    case"3": sql += " day like concat('%' , 3 , '%')"; break;
    case"4": sql += " day like concat('%' , 4 , '%')"; break;
    case"5": sql += " day like concat('%' , 5 , '%')"; break;
    case"6": sql += " day like concat('%' , 6 , '%')"; break;
    case"7": sql += " day like concat('%' , 7 , '%')"; break;
    case"1": sql += " day like concat('%' , 1 , '%')"; break;
    case"0": sql += " day like concat('%' , 0 , '%')"; break;
    }
  }
  sql+=' or day = 0'
  sql +=' order by etime desc,stime desc,day desc'
  sql +=' limit ' + skip + "," + pagepercount;
	return await this.queryselect(sql)
}
sampleDAO.insertTodolist = async function(content,gidx,stime,etime,day) {
	this.queryexec('insert into todolist (content,gidx,stime,etime,day) values ("'+content+'","'+gidx+'","'+stime+'","'+etime+'","'+day+'")');
}
sampleDAO.listTodo = async function(gidx)
{
  return this.queryselect("SELECT * FROM todolist WHERE gidx = "+gidx+" ") //gidx값을 대입
}
sampleDAO.listTodo1 = async function()
{
  return this.queryselect("SELECT * FROM todolist WHERE gidx ") //gidx값을 대입
}
sampleDAO.listTodo2 = async function()
{
  return this.queryselect('select  * from todolist where CURDATE() between stime and etime AND (day like concat("%" , dayofweek(curdate()) , "%") OR day=0) and  idx not  in (select content from todolog where CURDATE()=DATE_FORMAT(date,"%Y-%m-%d"))') //gidx값을 대입
}
sampleDAO.getGidx = async function()
{
  return this.queryselect("SELECT gidx FROM todolist order by gidx desc limit 1 ") // gidx만 가져오기
}
sampleDAO.gidxArray = async function(gidx)
{
  return this.queryselect("select * from todolist where gidx = "+gidx) 
}
sampleDAO.deleteTodo = async function(idx)
{
  await this.queryexec('delete from todolist where idx='+idx)
}
sampleDAO.deleteTodo_gidx = async function(gidx)
{
  await this.queryexec('delete from todolist where gidx='+gidx)
}
sampleDAO.number4 = async function(number4) 
{			
	return await this.queryselect('select * from staff where RIGHT(number, 4) = "'+number4+'" ')
}
sampleDAO.insertTodolog = async function(idx,content,number4) {
	this.queryexec('insert into todolog (midx,content,number4,date) values ('+idx+','+content+','+number4+',now())');
}
//========================================================(todolog)
sampleDAO.selectPagingTotalTodolog = async function() 
{
	return await this.queryselect("SELECT count(*) count FROM todolog")
}
sampleDAO.selectPagingTodolog = async function(pagenum, pagepercount) 
{
	let skip = pagenum*pagepercount;
	return await this.queryselect("SELECT a.content ,b.number4,c.name,b.date FROM todolist a,todolog b,staff c where a.idx=b.content and b.midx = c.idx order by date desc limit " + skip + "," + pagepercount)
}
sampleDAO.listTodolog = async function()
{
  return this.queryselect("SELECT distinct a.content ,b.number4,c.name FROM todolist a,todolog b,staff c where a.idx=b.content and b.midx = c.idx and CURDATE()=DATE_FORMAT(b.date,'%Y-%m-%d') order by date desc;") //gidx값을 대입
}
//================ export part
module.exports = sampleDAO;
