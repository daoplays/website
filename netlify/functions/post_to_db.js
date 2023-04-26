const axios = require("axios");

exports.handler = async function (event, context) {

    console.log(event);
    console.log(context);

    let baseURL = process.env.AWS_POKE_URL;

    let config = {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json',  'x-api-key': process.env.AWS_POKE_KEY}
    };


    try {

        let method = event.queryStringParameters.method;
        let game_id  = parseInt(event.queryStringParameters.game_id);

        var data;
        if (method == "Insert") {

            let player_id = parseInt(event.queryStringParameters.player_id);
            let move = parseInt(event.queryStringParameters.move);
            let round = parseInt(event.queryStringParameters.round);
    
            data = { 'method': method, 'game_id': game_id, 'player_id': player_id, "move" : move, "round": round };
        }
        else if (method == "Reveal") {
            data = { 'method': method, 'game_id': game_id };
        }
        
        

        const res = await axios.post(baseURL, data, config);

        console.log("RESPONSE RECEIVED: ", res.data);
        return {
            statusCode: 200,
            body: JSON.stringify(res.data),
        };
    }
    catch (err) {
      console.log("AXIOS ERROR: ", err);

      return {
        statusCode: 404,
        body: JSON.stringify(err),
      };
    };
};