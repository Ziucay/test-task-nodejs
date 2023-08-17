const http = require("http");
const {createLogger, transports} = require("winston");
const LokiTransport = require("winston-loki");
var amqp = require('amqplib/callback_api');
const port = 3000
const amqpUrl = "amqp://rabbitmq"
const sendingQueueName = "requests"
const incomingQueueName = "responses"

const logger = createLogger({
    transports: [
        new LokiTransport({
            host: "http://loki:3100",
            interval: 5,
            labels: {
                job: 'nodejs-ms1'
            }
        }),
        new transports.Console()
    ]
})

http.createServer(function (request, response) {

    amqp.connect(amqpUrl, function (error0, connection) {
        logger.log({
            level: 'info',
            message: 'Start AMQP connect'
        });
        if (error0) {
            logger.error(error0)
            throw error0;
        }
        connection.createChannel(function (error1, channel) {
            if (error1) {
                logger.error(error1)
                throw error1;
            }
            const msg = request.method;

            logger.log({
                level: 'info',
                message: `Request method is ${msg}`
            });

            channel.assertQueue(sendingQueueName, {
                durable: false
            });


            logger.log({
                level: 'info',
                message: "Send AMQP message"
            });

            channel.sendToQueue(sendingQueueName, Buffer.from(msg));
            logger.debug(`[x] Sent ${msg}`)
            setTimeout(function () {
                logger.log({
                    level: 'info',
                    message: "Stop AMQP connection"
                });
                connection.close();
            }, 0);
        });
    });

    amqp.connect(amqpUrl, function (error0, connection) {
        if (error0) {
            logger.error(error0)
            throw error0;
        }
        connection.createChannel(function (error1, channel) {
            if (error1) {
                logger.error(error1)
                throw error1;
            }

            channel.assertQueue(incomingQueueName, {
                durable: false
            });

            logger.log({
                level: 'info',
                message: ` [*] Waiting for messages in ${incomingQueueName}. To exit press CTRL+C`
            });

            channel.consume(incomingQueueName, function (msg) {
                logger.debug(` [x] Received ${msg.content.toString()}`)
                response.setHeader("Content-Type", "text/plain; charset=utf-8;");
                response.write(msg.content.toString())
                response.end();
            }, {
                noAck: true
            });
        });
    });

}).listen(port, "0.0.0.0", function () {
    logger.log({
        level: 'info',
        message: `Сервер начал прослушивание запросов на порту ${port}`
    });
});