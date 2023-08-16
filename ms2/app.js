const http = require("http");
var amqp = require('amqplib/callback_api');
const port = 3001
const sendingQueueName = "requests"
const incomingQueueName = "responses"

amqp.connect(amqpUrl, function(error0, connection) {
    if (error0) {
        throw error0;
    }
    connection.createChannel(function(error1, channel) {
        if (error1) {
            throw error1;
        }

        channel.assertQueue(sendingQueueName, {
            durable: false
        });

        console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", sendingQueueName);

        channel.consume(sendingQueueName, function(msg) {
            console.log(" [x] Received %s", msg.content.toString());
            channel.assertQueue(incomingQueueName, {
                durable: false
            });

            console.log("Send AMQP message")
            channel.sendToQueue(incomingQueueName, Buffer.from(msg));
            console.log(" [x] Sent %s", msg);
        }, {
            noAck: true
        });
    });
});


http.createServer(function(request,response){
    response.end()
}).listen(port, "0.0.0.0",function(){
    console.log(`Сервер начал прослушивание запросов на порту ${port}`);
});