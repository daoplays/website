const axios = require("axios");

exports.handler = async function (event, context) {

    console.log(event);
    console.log(context);

    let baseURL = "https://api.unsplash.com/photos/random/?query=chocolate&orientation=squarish&client_id=HlHQ4rQUd05b8kAOQF1-WNFQvkQBV4pxYwt030NmWU4";

    let config = {
        timeout: 10000,
        headers: {'Content-Type': 'application/json'}
    };

    try {

        

        const res = await axios.get(baseURL, config);

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
