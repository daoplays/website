import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BeetStruct, uniformFixedSizeArray,  u8, u16, u64, bignum } from '@metaplex-foundation/beet'
import { publicKey } from '@metaplex-foundation/beet-solana'

import { network_string } from './constants';
import {
    Box,
} from '@chakra-ui/react';


import {
    WalletDisconnectButton,
} from '@solana/wallet-adapter-react-ui';

export function WalletConnected() 
{
    return (
        <Box>
            <WalletDisconnectButton  
                className="wallet-disconnect-button"  
            />
        </Box>
    );
}


export function uInt16ToLEBytes(num : number) : Buffer {

    const bytes = Buffer.alloc(2);
    bytes.writeUInt16LE(num);
   
    return bytes
 }


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

interface TokenBalanceData {
    id : number;
    jsonrpc : string;
    result: {
        context: {
            apiVersion : string;
            slot : number;
        };
        value : {
            amount : string;
            decimals : number;
            uiAmount : number;
            uiAmountString : string;
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


export class KeyDataFromMint {
    constructor(
      readonly key_mint: PublicKey,   
      readonly key_type: number,
      readonly key_index: number
    ) {}
  
    static readonly struct = new BeetStruct<KeyDataFromMint>(
      [
        ['key_mint', publicKey],
        ['key_type', u8],
        ['key_index', u16]
      ],
      (args) => new KeyDataFromMint(args.key_mint!, args.key_type!, args.key_index!),
      'KeyDataFromMint'
    )
}

class KeyDataFromIndex {
    constructor(
      readonly key_type: number,
      readonly key_mint: PublicKey,
    ) {}
  
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
      readonly keys_bought: number,
      readonly key_types_bought: number[],
    ) {}
  
    static readonly struct = new BeetStruct<ShopData>(
      [
        ['keys_bought', u16],
        ['key_types_bought', uniformFixedSizeArray(u16, 3)],
      ],
      (args) => new ShopData(args.keys_bought!, args.key_types_bought!),
      'ShopData'
    )
}


class ShopUserData {
    constructor(
      readonly num_keys: number
    ) {}
  
    static readonly struct = new BeetStruct<ShopUserData>(
      [
        ['num_keys', u16]
      ],
      (args) => new ShopUserData(args.num_keys!),
      'ShopUserData'
    )
}

class InstructionNoArgs {
    constructor(
      readonly instruction: number
    ) {}
  
    static readonly struct = new BeetStruct<InstructionNoArgs>(
      [
        ['instruction', u8]
      ],
      (args) => new InstructionNoArgs(args.instruction!),
      'InstructionNoArgs'
    )
}

class DungeonPlayInstruction {
    constructor(
      readonly instruction: number,
      readonly character: number,
      readonly bet_size: number

    ) {}
  
    static readonly struct = new BeetStruct<DungeonPlayInstruction>(
      [
        ['instruction', u8],
        ['character', u8],
        ['bet_size', u8]
      ],
      (args) => new DungeonPlayInstruction(args.instruction!, args.character!, args.bet_size!),
      'DungeonPlayInstruction'
    )
}

class DungeonExploreInstruction {
    constructor(
      readonly instruction: number,
      readonly seed: number[],
      readonly character: number
    ) {}
  
    static readonly struct = new BeetStruct<DungeonExploreInstruction>(
      [
        ['instruction', u8],
        ['seed', uniformFixedSizeArray(u8, 32)],
        ['character', u8]
      ],
      (args) => new DungeonExploreInstruction(args.instruction!, args.seed!, args.character!),
      'DungeonExploreInstruction'
    )
}

export async function request_current_balance(pubkey : PublicKey) : Promise<number>
{
    const account_info_url = `/.netlify/functions/solana?network=`+network_string+`&function_name=getAccountInfo&p1=`+pubkey.toString()+"&config=true&encoding=base64&commitment=confirmed";

    var account_info_result;
    try {
        account_info_result = await fetch(account_info_url).then((res) => res.json());
    }
    catch(error) {
        console.log(error);
        return 0;
    }
    let valid_response = check_json(account_info_result)
    if (!valid_response) {
        console.log(account_info_result);
        return 0;
    }

    if (account_info_result["result"]["value"] == null || account_info_result["result"]["value"]["lamports"] == null) {
        console.log("Error getting lamports for ", pubkey.toString());
        return 0;
    }

    let current_balance : number = account_info_result["result"]["value"]["lamports"] / LAMPORTS_PER_SOL;

    return current_balance;

}
export async function request_token_amount(pubkey : PublicKey) : Promise<number>
{
    const url = `/.netlify/functions/solana?network=`+network_string+`&function_name=getTokenAccountBalance&p1=`+pubkey.toString()+`&config=true&encoding=base64&commitment=confirmed`;

    var response;
    try {
        response  = await fetch(url).then((res) => res.json());
    }
    catch(error) {
        console.log(error);
        return 0;
    }
    //console.log("TS result: ", response)

    let valid_response = check_json(response)

    //console.log("valid ", valid_response);
    if (!valid_response) {
        return  0;
    }

    let token_amount;
    try {
        let parsed_response : TokenBalanceData = response;

        //console.log("parsed", parsed_account_data);

        token_amount = parseInt(parsed_response.result.value.amount);
    }
    catch (error) {
        console.log(error);
        return 0;
    }

    return token_amount;
}

export async function request_raw_account_data(pubkey : PublicKey) : Promise<Buffer | null>
{
    const account_info_url = `/.netlify/functions/solana?network=`+network_string+`&function_name=getAccountInfo&p1=`+pubkey.toString()+`&config=true&encoding=base64&commitment=confirmed`;

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

export function serialise_play_instruction(instruction : number, which_character : number, bet_size : number) : Buffer
{

    const data = new DungeonPlayInstruction(instruction, which_character, bet_size);
    const [buf] = DungeonPlayInstruction.struct.serialize(data);

    return buf;
}

export function serialise_explore_instruction(instruction : number, seed : number[], which_character : number) : Buffer
{

    const data = new DungeonExploreInstruction(instruction, seed, which_character);
    const [buf] = DungeonExploreInstruction.struct.serialize(data);

    return buf;
}

export function serialise_basic_instruction(instruction : number) : Buffer
{

    const data = new InstructionNoArgs(instruction);
    const [buf] = InstructionNoArgs.struct.serialize(data);

    return buf;
}