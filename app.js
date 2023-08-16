const http = require("http");
http.createServer(function(request,response){
    response.setHeader("Content-Type", "text/plain; charset=utf-8;");
    response.write("Hello NodeJS changed!")
    response.end();

}).listen(3000, "127.0.0.1",function(){
    console.log("Сервер начал прослушивание запросов на порту 3000");
});