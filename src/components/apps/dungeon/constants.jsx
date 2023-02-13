import {createContext} from 'react';
import { deserialize } from 'borsh';

import { isMobile } from "react-device-detect";
import { PublicKey} from '@solana/web3.js';
import { check_json} from './utils';

// set font size
export var DEFAULT_FONT_SIZE = "30px"
export var DUNGEON_FONT_SIZE = "20px"

if (isMobile) {
    DEFAULT_FONT_SIZE = "15px"
    DUNGEON_FONT_SIZE = "10px"
}

export const PROD = false;
export const DEBUG = true;

export var network_string = "devnet";
if (PROD) {
    network_string = "mainnet"
}

export class Assignable {
    constructor(properties) {
      Object.keys(properties).map((key) => {
        return (this[key] = properties[key]);
      });
    }
  }



//pyth oracles
export const PYTH_BTC_DEV = new PublicKey('HovQMDrbAgAYPCmHVSrezcSmkMtXSSUsLDFANExrZh2J');   
export const PYTH_ETH_DEV = new PublicKey('EdVCmQ9FSPcVe5YySXDPCRmc8aDQLKJ9xvYBMZPie1Vw');   
export const PYTH_SOL_DEV = new PublicKey('J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix');  

export const PYTH_BTC_PROD = new PublicKey('GVXRSBjFk6e6J3NbVPXohDJetcTjaeeuykUpbQF8UoMU');   
export const PYTH_ETH_PROD = new PublicKey('JBu1AL4obBcCMqKBBxhpWCNUt136ijcuMZLFvTP7iWdB');   
export const PYTH_SOL_PROD = new PublicKey('H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG');

export const METAPLEX_META = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
export const SHOP_PROGRAM = new PublicKey("7furJTvAgYYEjFkCbhiYsmEXMtzbUyMj1Q6gwspioCpk");
export const PROGRAM_KEY = new PublicKey('FUjAo5wevsyS2jpe2XnkYN3SyQVbxAjoy8fuWrw3wjUk');
export const SYSTEM_KEY = new PublicKey("11111111111111111111111111111111");



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

    let valid_response = check_json(account_info_result)
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

export class InstructionMeta extends Assignable { }
export const instruction_schema = new Map([
    [InstructionMeta, { kind: 'struct', 
    fields: [
          ['instruction', 'u8']],
      }]
]);

// context for all the state
export const StateContext = createContext();
