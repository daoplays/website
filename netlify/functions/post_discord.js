const axios = require("axios");

exports.handler = async function (event, context) {

    console.log(event);
    console.log(context);

    let baseURL = "https://discord.com/api/channels/1086998476245700739/messages"
    let bot_key = "Bot " + process.env.DISCORD_DUNGEON_BOT;
    let config = {
        timeout: 10000,
        headers: { 'authorization': bot_key}
    };


    try {

        const method = event.queryStringParameters.method;

        if (method === "post") {
            const content = event.queryStringParameters.content;

            var data = { 'content': content};

            const res = await axios.post(baseURL, data, config);

            console.log("RESPONSE RECEIVED: ", res.data);
            return {
                statusCode: 200,
                body: JSON.stringify(res.data),
            };
        }
        else if (method === "get") {
            const res = await axios.get(baseURL, config);

            console.log("RESPONSE RECEIVED: ", res.data);
            return {
                statusCode: 200,
                body: JSON.stringify(res.data),
            };
        }
    }
    catch (err) {
      console.log("AXIOS ERROR: ", err);

      return {
        statusCode: 404,
        body: JSON.stringify(err),
      };
    };
};
