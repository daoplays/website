//Import libraries
const jwt = require("jsonwebtoken")


exports.handler = async function (event, context) {

    // read private key
    const privateKey = atob(process.env.JWT_PRIVATE_KEY)

    //const encodedAccessToken = btoa(privateKey);
    //const decodedAccessToken = atob(encodedAccessToken);
    //console.log("encoded key:")
    //console.log(process.env.JWT_PRIVATE_KEY)
    //console.log(privateKey);
    //console.log(encodedAccessToken);
    //console.log(decodedAccessToken);

    try {
        //Create payload and JWT
        var token = jwt.sign({}, privateKey, {

            algorithm: 'RS256', //algo used to create JWT
            expiresIn: "2d" // set a 2 day expiration

        });

        return {
            statusCode: 200,
            body: JSON.stringify({ token: token }),
        };
    }
    catch(err) {
        console.log("JWT ERROR: ", err);

        return {
            statusCode: 404,
            body: JSON.stringify(err),
        };
    }

}