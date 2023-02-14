import { PublicKey } from '@solana/web3.js';
import { BeetStruct, uniformFixedSizeArray,  u8, u16, u64, bignum } from '@metaplex-foundation/beet'
import { publicKey } from '@metaplex-foundation/beet-solana'

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


class KeyDataFromMint {
    constructor(
      readonly key_type: number,
      readonly key_index: number,
    ) {}
  
    //resultArray: Array<number> = uniformFixedSizeArray(u8, 3)

    static readonly struct = new BeetStruct<KeyDataFromMint>(
      [
        ['key_type', u8],
        ['key_index', u16],
      ],
      (args) => new KeyDataFromMint(args.key_type!, args.key_index!),
      'KeyDataFromMint'
    )
}

class KeyDataFromIndex {
    constructor(
      readonly key_type: number,
      readonly key_mint: PublicKey,
    ) {}
  
    //resultArray: Array<number> = uniformFixedSizeArray(u8, 3)

    static readonly struct = new BeetStruct<KeyDataFromIndex>(
      [
        ['key_type', u8],
        ['key_mint', publicKey],
      ],
      (args) => new KeyDataFromIndex(args.key_type!, args.key_mint!),
      'KeyDataFromIndex'
    )
}

class ShopData {
    constructor(
      readonly keys_bought: bignum,
      readonly key_types_bought: bignum[],
    ) {}
  
    //resultArray: Array<number> = uniformFixedSizeArray(u8, 3)

    static readonly struct = new BeetStruct<ShopData>(
      [
        ['keys_bought', u64],
        ['key_types_bought', uniformFixedSizeArray(u64, 5)],
      ],
      (args) => new ShopData(args.keys_bought!, args.key_types_bought!),
      'ShopData'
    )
}


class ShopUserData {
    constructor(
      readonly num_keys: bignum,
      readonly last_xp: bignum,
    ) {}
  
    //resultArray: Array<number> = uniformFixedSizeArray(u8, 3)

    static readonly struct = new BeetStruct<ShopUserData>(
      [
        ['num_keys', u64],
        ['last_xp', u64],
      ],
      (args) => new ShopUserData(args.num_keys!, args.last_xp!),
      'ShopUserData'
    )
}

export async function request_raw_account_data(pubkey : PublicKey) : Promise<Buffer | null>
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

    let account_data;
    try {
        let parsed_account_data : AccountData = response;

        //console.log("parsed", parsed_account_data);

        let account_encoded_data = parsed_account_data.result.value.data;
        account_data = Buffer.from(account_encoded_data[0], "base64");
    }
    catch (error) {
        console.log(error);
        return null;
    }

    return account_data;
}



export async function request_player_account_data(pubkey : PublicKey) : Promise<PlayerData | null>
{
 
    let account_data = await request_raw_account_data(pubkey);

    if (account_data === null) {
        return null;
    }

    const [data] = PlayerData.struct.deserialize(account_data);

    return data;
}

export async function request_key_data_from_mint(pubkey : PublicKey) : Promise<KeyDataFromMint | null>
{
 
    let account_data = await request_raw_account_data(pubkey);

    if (account_data === null) {
        return null;
    }

    const [data] = KeyDataFromMint.struct.deserialize(account_data);

    return data;
}

export async function request_key_data_from_index(pubkey : PublicKey) : Promise<KeyDataFromIndex | null>
{
 
    let account_data = await request_raw_account_data(pubkey);

    if (account_data === null) {
        return null;
    }

    const [data] = KeyDataFromIndex.struct.deserialize(account_data);

    return data;
}

export async function request_shop_data(pubkey : PublicKey) : Promise<ShopData | null>
{
 
    let account_data = await request_raw_account_data(pubkey);

    if (account_data === null) {
        return null;
    }

    const [data] = ShopData.struct.deserialize(account_data);

    return data;
}


export async function request_shop_user_data(pubkey : PublicKey) : Promise<ShopUserData | null>
{
 
    let account_data = await request_raw_account_data(pubkey);

    if (account_data === null) {
        return null;
    }

    const [data] = ShopUserData.struct.deserialize(account_data);

    return data;
}