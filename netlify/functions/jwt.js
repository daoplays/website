//Import libraries
const jwt = require("jsonwebtoken")


exports.handler = async function (event, context) {

    // read private key
    const privateKey = process.env.JWT_PRIVATE_KEY

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