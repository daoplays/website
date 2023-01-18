const axios = require("axios");

exports.handler = async function (event, context) {

    console.log(event);
    console.log(context);

    let baseURL = process.env.DEVNET_URL;

    let config = {
        timeout: 10000,
        headers: {'Content-Type': 'application/json'}
    };

    try {

        const function_name = event.queryStringParameters.function_name;

        var params = []
        if (event.queryStringParameters.p1) {
            params.push(event.queryStringParameters.p1)
        }
        if (event.queryStringParameters.p2) {
            let p2 = event.queryStringParameters.p2;

            if (function_name == "requestAirdrop") {
                p2 = parseInt(p2);
            }

            if (p2 == "config") {
                var extra_config = {};

                if (event.queryStringParameters.p3) {
                    let p3 = event.queryStringParameters.p3;

                    if (p3 == "base64") {
                        extra_config["encoding"] = "base64";
                    }
                    else if (p3 == "skippreflight") {
                        extra_config["skipPreflight"] = true;
                    }
                }

                if (event.queryStringParameters.p4) {
                    let p4 = event.queryStringParameters.p4;
                    
                    if (p4 == "commitment") {
                        extra_config["commitment"] = "confirmed";
                    }
                    
                }
                

                params.push(extra_config);
            }
            else {
                params.push(p2);
            }

        }

        console.log("have param names ", function_name, params);
        var data = {"id": 1, "jsonrpc": "2.0", "method": function_name, "params": params};

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
