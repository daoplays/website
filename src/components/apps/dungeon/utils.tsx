import { PublicKey } from '@solana/web3.js';
import { BeetStruct, uniformFixedSizeArray, fixedSizeArray, i32, u16, u8, u64, bignum } from '@metaplex-foundation/beet'

import { network_string } from './constants';


interface BasicReply {
    id : number;
    jsonrpc : string;
    result: string;
    error: string;
}

export function check_json(json_response : BasicReply) : boolean 
{

    if (json_response.result === undefined) {
        if (json_response.result !== undefined) {
            console.log(json_response.error)
            
        }
        return  false;
    }

    return true;
}

interface AccountData {
    id : number;
    jsonrpc : string;
    result: {
        context: {
            apiVersion : string;
            slot : number;
        };
        value : {
            data : [string, string];
            executable : boolean;
            lamports : number;
            owner : string;
        };
    };
    error: string;
}

class PlayerData {
    constructor(
      readonly num_plays: bignum,
      readonly num_wins: bignum,
      readonly in_progress: number,
      readonly player_status: number,
      readonly dungeon_enemy: number,
      readonly player_character: number,
      readonly current_bet_size: bignum,
      readonly current_key: number,
      readonly extra_data: number[]

    ) {}
  
    //resultArray: Array<number> = uniformFixedSizeArray(u8, 3)

    static readonly struct = new BeetStruct<PlayerData>(
      [
        ['num_plays', u64],
        ['num_wins', u64],
        ['in_progress', u8],
        ['player_status', u8],
        ['dungeon_enemy', u8],
        ['player_character', u8],
        ['current_bet_size', u64],
        ['current_key', u8],
        ['extra_data', uniformFixedSizeArray(u8, 23)],

      ],
      (args) => new PlayerData(args.num_plays!, args.num_wins!, args.in_progress!, args.player_status!, args.dungeon_enemy!, args.player_character!, args.current_bet_size!, args.current_key!, args.extra_data!),
      'PlayerData'
    )
  }

export async function request_account_data(pubkey : PublicKey) : Promise<PlayerData | null>
{
    const account_info_url = `/.netlify/functions/solana?network=`+network_string+`&function_name=getAccountInfo&p1=`+pubkey.toString()+`&p2=config&p3=base64&p4=commitment`;

    var response;
    try {
        response  = await fetch(account_info_url).then((res) => res.json());
    }
    catch(error) {
        console.log(error);
        return null;
    }
    //console.log("TS result: ", response)

    let valid_response = check_json(response)

    //console.log("valid ", valid_response);
    if (!valid_response) {
        return  null;
    }

    //let parsed_account_data : AccountData = response;

    //console.log("parsed", parsed_account_data);

    let account_encoded_data = response["result"]["value"]["data"];
    let account_data = Buffer.from(account_encoded_data[0], "base64");

    const [data] = PlayerData.struct.deserialize(account_data);

    console.log("deserialised in TS: ", data);

    return data;
}

