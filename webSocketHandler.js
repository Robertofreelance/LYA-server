const mqtt = require("mqtt");

class MqttHandler {
  constructor() {
    this.mqttClient = null;
    this.host = "mqtt://mqtt.lyaelectronic.com:4010";
  }

  connect() {
    this.mqttClient = mqtt.connect(this.host);

    this.mqttClient.on("error", (err) => {
      console.log(err);
      this.mqttClient.end();
    });

    this.mqttClient.on("connect", () => {
      console.log(`mqtt client connected`);
    });

    this.mqttClient.subscribe("lyatest/Roberto", { qos: 0 });

    this.mqttClient.on("message", function (topic, message) {
      console.log(message.toString());
    });

    this.mqttClient.on("close", () => {
      console.log(`mqtt client disconnected`);
    });
  }
  sendMessage(message, user) {
    this.mqttClient.publish("lyatest/Roberto", JSON.stringify({ message, user }));
  }
}

module.exports = MqttHandler;
