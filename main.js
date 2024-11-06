sv = require("./server")
sv.init()
socketHandler = require("./Sockethandler")
require("./controller/MainController")
require("./controller/WaitroomController")
require("./controller/CustomerController")
require("./controller/AdminController")
require("./controller/ApiController")
require("./controller/FrontController")
require("./controller/AdminMenuController")
require("./controller/AdminController_member")



