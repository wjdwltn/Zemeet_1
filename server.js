class sv{
    init(){
        const path = require("path");
        const http = require("http");
        const express = require("express");
        const session = require('express-session'); 
        var ejs  = require('ejs');
        var fs = require('fs'); // node에있는 file system 모듈
        this.app = express();
        this.app.set('view engine', 'ejs');
        this.router = express.Router();
        const port = 3080;
        this.server = http.createServer(this.app);
        this.app.use
            (session({
                secret : "loginTest",
                resave : false,
                saveUninitialized : true,
                cookie: { secure: false }
          }))    
        const urls = ['login','loginProcess','vendor','dist','data']; // 관리자 권한 검사 안하고 넘길 url 배열 
        this.app.use('/admin/:link',function(req, res, next) {
            let url = req.originalUrl;                        
            if(urls.includes(url.split('/')[2])){
                next();
            }else{
                if(req.session.adminLogin == null){                   
                    res.redirect("/admin/login");
                }else{
                    next();
                }                
            }            
        });      
        this.app.use("/", this.router);
        this.app.use(express.static('C:/upload/zemeet/smartEditor/'));
        this.app.use(express.static(path.join(__dirname, './se2')));
        this.app.use(express.static(path.join(__dirname, './static')));
        this.app.use(express.static('C:/upload/zemeet/uploadedMenuFiles'));
        this.app.use(express.static('C:/upload/zemeet/uploadedGameFiles'));
        this.app.use(express.static('C:/upload/zemeet/uploadedRoomFiles'));
        this.server.listen(port, function () {
            var dir = 'C:/upload/zemeet/uploadedMenuFiles';
            if(!fs.existsSync(dir))fs.mkdirSync(dir , { recursive: true });
            var dir = 'C:/upload/zemeet/uploadedGameFiles';
            if(!fs.existsSync(dir))fs.mkdirSync(dir , { recursive: true });
            var dir = 'C:/upload/zemeet/uploadedRoomFiles';
            if(!fs.existsSync(dir))fs.mkdirSync(dir , { recursive: true });
            var dir = 'C:/upload/zemeet/smartEditor/';
            if(!fs.existsSync(dir))fs.mkdirSync(dir , { recursive: true });
            console.log(new Date() + " Server is listening on port " + port);
        });
    }
}
module.exports = new sv();
