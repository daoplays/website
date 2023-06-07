const axios = require("axios");

const valid_achievements = [
    "Dungeon Crawler",
    "Dungeon Explorer",
    "Dungeon Paragon",
    "First Blood",
    "Gotta Kill 'em All",
    "Rookie",
    "Adventurer",
    "Bat Out Of Hell",
    "Jack Of All Trades",
    "Like A Boss",
    "We Could Have Been Friends",
    "Yerr a Wizard, Harry",
    "Scrounger",
    "Scavenger",
    "Unlucky",
    "Cursed",
    "(╯°□°）╯︵ ┻━┻",
    "Cautious",
    "Coward",
    "Daily Dungeon I",
    "Daily Dungeon II",
    "Daily Dungeon III",
    "Once You Pop...",
    "Spoderman",
    "You Shall Not Pass!",
    "Looter",
    "Chicken",
    "Master Of None",
    "Master Of All",
    "Fertilizer",
    "DM Slayer"
]

const valid_emojis = [
    "<a:Gold:1086961346492510298>",
    "<a:Knight:1070460855575126116>",
    "<a:Ranger:1070471404425842688>",
    "<a:Wizard:1070471413829472287>",
    "<a:Assassin:1082340379204014170>",
    "<a:BlueSlime:1082339378573086821>",
    "<:Boulder:1070460848155410432>",
    "<a:Carnivine:1080810978347855952>",
    "<a:DM:1082380987465465968>",
    "<a:Elves:1070460851317907466>",
    "<a:GiantSlimeBlue:1082339381060313098>",
    "<a:GiantSlimeGreen:1082339382624780370>",
    "<a:GiantRat:1082339379445502023>",
    "<a:GiantSpider:1082339383740473406>",
    "<a:Goblins:1070460853436030997>",
    "<a:GreenSlime:1082339385502093402>",
    "<a:Mimic:1086994090543022131>",
    "<a:Orc:1070471402496462858>",
    "<a:Shade:1082342760947925072>",
    "<a:SkellyKnight:1070471408523677747>",
    "<a:Skellies:1070471406887907338>",
    "<a:SkellyWiz:1070471409622585394>",
    "<:Spikes:1070471412084654080>",
    "<a:Werewolf:1082339387557289994>",
]

// supported message types:
// defeated: X defeated Y in level Z
// killed_by: X killed by Y in level Z
// escaped: X escaped from level Y with Z SOL
// retired: X retired from level 7 with Z SOL
// achievement: X earned Y
// arena: X won Y in the arena
function verify_message(event) {

    if (event.queryStringParameters.emoji_1 !== undefined && !valid_emojis.includes(event.queryStringParameters.emoji_1)) {
        console.log("invalid e1");
        return "invalid";
    }

    if (event.queryStringParameters.emoji_2 !== undefined && !valid_emojis.includes(event.queryStringParameters.emoji_2)) {
        console.log("invalid e2",event.queryStringParameters.emoji_2,  event.queryStringParameters.emoji_2 !== "");

        return "invalid";
    }

    if (event.queryStringParameters.achievement !== undefined && !valid_achievements.includes(event.queryStringParameters.achievement)) {
        console.log("invalid achi", event.queryStringParameters.achievement, event.queryStringParameters.achievement !== "");

        return "invalid";
    }

    if (isNaN(event.queryStringParameters.level || isNaN(event.queryStringParameters.sol_amount))) {
        console.log("invalid num");

        return "invalid";
    }

    const message_type = event.queryStringParameters.message_type;

    let post_string;
    if (message_type === "defeated") {
        post_string = event.queryStringParameters.emoji_1 + " defeated " + event.queryStringParameters.emoji_2 + " in level " + event.queryStringParameters.level;
    }
    else if (message_type === "killed_by") {
        post_string = event.queryStringParameters.emoji_1 + " was killed by " + event.queryStringParameters.emoji_2 + " in level " + event.queryStringParameters.level;
    }
    else if (message_type === "retired") {
        post_string = event.queryStringParameters.emoji_1 + " retired at level " + event.queryStringParameters.level + " with " + event.queryStringParameters.sol_amount + " LOOT " + event.queryStringParameters.emoji_2;
    }
    else if (message_type === "escaped") {
        post_string = event.queryStringParameters.emoji_1 + " escaped from level " + event.queryStringParameters.level + " with " + event.queryStringParameters.sol_amount + " LOOT " + event.queryStringParameters.emoji_2;
    }
    else if (message_type === "achievement") {
        post_string = event.queryStringParameters.emoji_1 + " earned " + event.queryStringParameters.achievement_name;
    }
    else if (message_type === "arena") {
        post_string = event.queryStringParameters.emoji_1 + " won " + event.queryStringParameters.sol_amount + " in the arena " + event.queryStringParameters.emoji_2;
    }
    else {
        return "invalid";
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
