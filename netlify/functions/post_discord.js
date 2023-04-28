const axios = require("axios");

// supported message types:
// defeated: X defeated Y in level Z
// killed_by: X killed by Y in level Z
// escaped: X escaped from level Y with Z SOL
// retired: X retired from level 7 with Z SOL
// achievement: X earned Y
// arena: X won Y in the arena
function verify_message(event) {

    const message_type = event.queryStringParameters.message_type;

    let post_string;
    if (message_type === "defeated") {
        post_string = event.queryStringParameters.emoji_1 + " defeated " + event.queryStringParameters.emoji_2 + " in level " + event.queryStringParameters.level;
    }
    else if (message_type === "killed_by") {
        post_string = event.queryStringParameters.emoji_1 + " was killed by " + event.queryStringParameters.emoji_2 + " in level " + event.queryStringParameters.level;
    }
    else if (message_type === "retired") {
        post_string = event.queryStringParameters.emoji_1 + " retired at level " + event.queryStringParameters.level + " with " + event.queryStringParameters.sol_amount + " SOL " + event.queryStringParameters.emoji_2;
    }
    else if (message_type === "escaped") {
        post_string = event.queryStringParameters.emoji_1 + " escaped from level " + event.queryStringParameters.level + " with " + event.queryStringParameters.sol_amount + " SOL " + event.queryStringParameters.emoji_2;
    }
    else if (message_type === "achievement") {
        post_string = event.queryStringParameters.emoji_1 + " earned " + event.queryStringParameters.achievement_name;
    }
    else if (message_type === "arena") {
        post_string = event.queryStringParameters.emoji_1 + " won " + event.queryStringParameters.sol_amount + " in the arena " + event.queryStringParameters.emoji_2;
    }
    else {
        post_string = "invalid"
    }

    return post_string;
}

exports.handler = async function (event, context) {

    //console.log(event);
    //console.log(context);
    
    let baseURL = "https://discord.com/api/channels/1086998476245700739/messages"
    //let baseURL = "https://discord.com/api/channels/1091376581877973014/messages"
    let bot_key = "Bot " + process.env.DISCORD_DUNGEON_BOT;
    let config = {
        timeout: 10000,
        headers: { 'authorization': bot_key}
    };


    try {

        const method = event.queryStringParameters.method;

        if (method === "post") {

            let post_string = verify_message(event);
            if (post_string === "invalid") {
                return {
                    statusCode: 404,
                    body: JSON.stringify("invalid message"),
                };
            }
            

            var data = { 'content': post_string};

            const res = await axios.post(baseURL, data, config);

            console.log("DISCORD POST RESPONSE RECEIVED");
            return {
                statusCode: 200,
                body: JSON.stringify(res.data),
            };
        }
        else if (method === "get") {
            const res = await axios.get(baseURL, config);

            console.log("DISCORD GET RESPONSE RECEIVED");
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
