const http = require("http");
var amqp = require('amqplib/callback_api');
const port = 3000
const amqpUrl = "amqp://rabbitmq"
const sendingQueueName = "requests"
const incomingQueueName = "responses"

http.createServer(function(request,response){

    amqp.connect(amqpUrl, function(error0, connection) {
        console.log("Start AMQP connect")
        if (error0) {
            throw error0;
        }
        connection.createChannel(function(error1, channel) {
            if (error1) {
                throw error1;
            }
            const msg = request.body;
            console.log(`Request body is ${msg}`)


            channel.assertQueue(sendingQueueName, {
                durable: false
            });

            console.log("Send AMQP message")
            channel.sendToQueue(sendingQueueName, Buffer.from(msg));
            console.log(" [x] Sent %s", msg);
            setTimeout(function() {
                console.log("Stop AMQP connection")
                connection.close();
            }, 0);
        });
    });

    amqp.connect(amqpUrl, function(error0, connection) {
        if (error0) {
            throw error0;
        }
        connection.createChannel(function(error1, channel) {
            if (error1) {
                throw error1;
            }

            channel.assertQueue(incomingQueueName, {
                durable: false
            });

            console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", incomingQueueName);

            channel.consume(incomingQueueName, function(msg) {
                console.log(" [x] Received %s", msg.content.toString());
                response.setHeader("Content-Type", "text/plain; charset=utf-8;");
                response.write(msg.content.toString())
                response.end();
            }, {
                noAck: true
            });
        });
    });

}).listen(port, "0.0.0.0",function(){
    console.log(`Сервер начал прослушивание запросов на порту ${port}`);
});