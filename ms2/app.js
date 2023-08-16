const http = require("http");
var amqp = require('amqplib/callback_api');
const {createLogger, transports} = require("winston");
const LokiTransport = require("winston-loki");
const port = 3001
const amqpUrl = "amqp://rabbitmq"
const sendingQueueName = "requests"
const incomingQueueName = "responses"

const logger = createLogger({
    transports: [
        new LokiTransport({
            host: "http://loki:3100",
            interval: 5,
            labels: {
                job: 'nodejs-ms2'
            }
        })
    ]
})

amqp.connect(amqpUrl, function (error0, connection) {
    if (error0) {
        throw error0;
    }
    connection.createChannel(function (error1, channel) {
        if (error1) {
            throw error1;
        }

        channel.assertQueue(sendingQueueName, {
            durable: false
        });

        logger.log({
            level: 'info',
            message: ` [*] Waiting for messages in ${sendingQueueName}. To exit press CTRL+C`
        });

        channel.consume(sendingQueueName, function (msg) {
            logger.log({
                level: 'debug',
                message: `[x] Received ${msg.content.toString()}`
            });

            channel.assertQueue(incomingQueueName, {
                durable: false
            });

            logger.log({
                level: 'info',
                message: `Send AMQP message`
            });
            channel.sendToQueue(incomingQueueName, Buffer.from(msg.content.toString() + " PROCESSED"));
            logger.log({
                level: 'debug',
                message: `[x] Sent ${msg}`
            });
        }, {
            noAck: true
        });
    });
});


http.createServer(function (request, response) {
    response.end()
}).listen(port, "0.0.0.0", function () {
    logger.log({
        level: 'info',
        message: `Сервер начал прослушивание запросов на порту ${port}`
    });
});