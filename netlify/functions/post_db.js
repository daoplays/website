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

 
        let team_name = event.queryStringParameters.team_name;
        let button = event.queryStringParameters.button;
        let bid = event.queryStringParameters.bid;

        console.log("have team name ", team_name);
        var data = { 'team_name': team_name, "button": button, "bid": bid };

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
