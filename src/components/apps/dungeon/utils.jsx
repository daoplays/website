import { deserialize } from 'borsh';

import { network_string } from './constants';


export function check_json({json_response}) 
{
    if (json_response["result"] == null) {
        if (json_response["error"] !== null) {
            console.log(json_response["error"])
            
        }
        return  false;
    }

    return true;
}

export async function get_account_data({pubkey, schema, map, raw})
{

    const account_info_url = `/.netlify/functions/solana?network=`+network_string+`&function_name=getAccountInfo&p1=`+pubkey.toString()+`&p2=config&p3=base64&p4=commitment`;

    var account_info_result;
    try {
        account_info_result = await fetch(account_info_url).then((res) => res.json());
    }
    catch(error) {
        console.log(error);
        return null;
    }

    let valid_response = check_json({json_response: account_info_result})
    if (!valid_response) {
        return  null;
    }

    if (account_info_result["result"]["value"] == null || account_info_result["result"]["value"]["data"] == null ) {
        return null;
    }

    let account_encoded_data = account_info_result["result"]["value"]["data"];
    let account_data = Buffer.from(account_encoded_data[0], "base64");

    if (raw) {
        return account_data;
    }

    
    const data = deserialize(schema, map, account_data);


    return data;
}