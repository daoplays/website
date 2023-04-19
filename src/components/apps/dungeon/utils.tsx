import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BeetStruct, FixableBeetStruct, uniformFixedSizeArray,  utf8String, u8, u16, u64, bignum, bool } from '@metaplex-foundation/beet'
import { publicKey } from '@metaplex-foundation/beet-solana'

import { network_string, SHOP_PROGRAM, DEBUG, RPC_NODE} from './constants';
import {
    Box,
} from '@chakra-ui/react';

import BN from 'bn.js'
import bs58 from "bs58";

import {
    WalletDisconnectButton,
} from '@solana/wallet-adapter-react-ui';

export async function get_JWT_token() : Promise<any | null>
{
   
    const token_url = `/.netlify/functions/jwt`;

    var token_result;
    try {
        token_result = await fetch(token_url).then((res) => res.json());
    }
    catch(error) {
        console.log(error);
        return null;
    }

    if (DEBUG)
        console.log(token_result);


    return token_result
}


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

// Example POST method implementation:
async function postData(url = "", bearer = "", data = {}) {
    // Default options are marked with *
    const response = await fetch(url, {
      method: "POST", // *GET, POST, PUT, DELETE, etc.
      headers: {
        'Accept': 'application/json', 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bearer}`
      },
      body: JSON.stringify(data), // body data type must match "Content-Type" header
    });
    return response.json(); // parses JSON response into native JavaScript objects
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
        if (json_response.error !== undefined) {
            console.log(json_response.error)
            
        }
        return  false;
    }

    if (json_response.result === null)
        return false;

    return true;
}

////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////// Transactions ///////////////////////// /////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////



interface BlockHash {
   blockhash : string;
   lastValidBlockHeight : number;
}

export async function get_current_blockhash(bearer : string) : Promise<BlockHash>
{
    var body = {"id": 1, "jsonrpc": "2.0", "method": "getLatestBlockhash"};
    const blockhash_data_result = await postData(RPC_NODE, bearer, body);

    
    let blockhash = blockhash_data_result["result"]["value"]["blockhash"];
    let last_valid = blockhash_data_result["result"]["value"]["lastValidBlockHeight"];

    let hash_data : BlockHash = { blockhash: blockhash, lastValidBlockHeight: last_valid};

    return hash_data;

}

interface TransactionResponseData {
    id : number;
    jsonrpc : string;
    result : string;
}


export async function send_transaction(bearer : string, encoded_transaction : string) : Promise <TransactionResponseData>
{
    var body = {"id": 1, "jsonrpc": "2.0", "method": "sendTransaction", "params": [encoded_transaction]};
   
    var response_json = await postData(RPC_NODE, bearer, body);
    let transaction_response : TransactionResponseData = response_json;

    let valid_json = check_json(response_json);

    if (valid_json)
        return transaction_response;

    transaction_response.result = "INVALID"
    return transaction_response;

    
}

interface SignatureResponseData {
    id : number;
    jsonrpc : string;
    result: {
        context: {
            apiVersion : string;
            slot : number;
        };
        value : [{
            confirmationStatus : string;
            confirmations : number;
            err : string | null;
            slot : number;
        }];
    } | null;
}


export async function check_signature(bearer : string, signature : string) : Promise <SignatureResponseData | null>
{

    var body = {"id": 1, "jsonrpc": "2.0", "method": "getSignatureStatuses", "params": [[signature],{"searchTransactionHistory": true}]};
   
    var response_json = await postData(RPC_NODE, bearer, body);
    let transaction_response : SignatureResponseData = response_json;

    let valid_json = check_json(response_json);

    if (valid_json)
        return transaction_response;

    
    return null;

    
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

export async function request_current_balance(bearer : string, pubkey : PublicKey) : Promise<number>
{

    var body = {"id": 1, "jsonrpc": "2.0", "method": "getAccountInfo", "params": [pubkey.toString(), {"encoding": "base64", "commitment": "confirmed"}]};

    var account_info_result;
    try {
        account_info_result = await postData(RPC_NODE, bearer, body);
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
        // console.log("Error getting lamports for ", pubkey.toString());
        return 0;
    }

    let current_balance : number = account_info_result["result"]["value"]["lamports"] / LAMPORTS_PER_SOL;

    return current_balance;

}
export async function request_token_amount(bearer : string, pubkey : PublicKey) : Promise<number>
{
    var body = {"id": 1, "jsonrpc": "2.0", "method": "getTokenAccountBalance", "params": [pubkey.toString(), {"encoding": "base64", "commitment": "confirmed"}]};

    var response;
    try {
        response  = await postData(RPC_NODE, bearer, body);
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





export async function request_raw_account_data(bearer : string, pubkey : PublicKey) : Promise<Buffer | null>
{
    var body = {"id": 1, "jsonrpc": "2.0", "method": "getAccountInfo", "params": [pubkey.toString(), {"encoding": "base64", "commitment": "confirmed"}]};

    var response;
    try {
        response = await postData(RPC_NODE, bearer, body);
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



export function serialise_basic_instruction(instruction : number) : Buffer
{

    const data = new InstructionNoArgs(instruction);
    const [buf] = InstructionNoArgs.struct.serialize(data);

    return buf;
}

export async function post_discord_message(message : string) : Promise<null>
{

    const account_info_url = `/.netlify/functions/post_discord?method=post&content=`+message;

    var response;
    try {
        response  = await fetch(account_info_url).then((res) => res.json());
    }
    catch(error) {
        console.log(error);
        return null;
    }

    if (DEBUG)
        console.log(response);

    return null;
}

export interface DiscordMessage {
    message : string;
    time: string;
}

export async function get_discord_messages() : Promise<DiscordMessage[] | null>
{

    const account_info_url = `/.netlify/functions/post_discord?method=get`;

    var response;
    try {
        response  = await fetch(account_info_url).then((res) => res.json());
    }
    catch(error) {
        console.log(error);
        return null;
    }

    let parsed_response : DiscordMessage[] = [];

    for (let i = 0; i < response.length; i++) {
        let dm : DiscordMessage = {message: response[i]["content"], time: response[i]["timestamp"]}
        parsed_response.push(dm)
    }

    //console.log(parsed_response[0]);

    return parsed_response;
}

////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////// Dungeon Game Instructions and MetaData /////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////


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

class AchievementData {
    constructor(
      readonly achievement_state: number[],
      readonly levels_won: number[][],
      readonly levels_quit: number[],
      readonly levels_lost: number[],
      readonly enemies_lose: number[][],
      readonly enemies_win: number[][],

      readonly games_played: number,
      readonly losing_streak: number,
      readonly winning_streak: number,

      readonly last_date_played: number,
      readonly play_streak: number,
      readonly games_played_today: number,
      readonly total_days_played: number,

      readonly total_lamports_claimed: bignum,

      readonly n_interactions: number,


    ) {}
  
    static readonly struct = new BeetStruct<AchievementData>(
      [
        ['achievement_state', uniformFixedSizeArray(u8, 128)],
        ['levels_won', uniformFixedSizeArray(u16, 3*7)],
        ['levels_quit', uniformFixedSizeArray(u16, 7)],
        ['levels_lost', uniformFixedSizeArray(u16, 7)],
        ['enemies_lose', uniformFixedSizeArray(u16, 3*32)],
        ['enemies_win', uniformFixedSizeArray(u16, 3*32)],

        ['games_played', u16],
        ['losing_streak', u16],
        ['winning_streak', u16],

        ['last_date_played', u16],
        ['play_streak', u16],
        ['games_played_today', u16],
        ['total_days_played', u16],

        ['total_lamports_claimed', u64],

        ['n_interactions', u16]


      ],
      (args) => new AchievementData(args.achievement_state!, args.levels_won!, args.levels_quit!, args.levels_lost!, args.enemies_lose!, args.enemies_win!, args.games_played!, args.losing_streak!, args.winning_streak!, args.last_date_played!, args.play_streak!, args.games_played!, args.total_days_played!, args.total_lamports_claimed!, args.n_interactions!),
      'AchievementData'
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


class DungeonClaimAchievementInstruction {
    constructor(
      readonly instruction: number,
      readonly achievement: number

    ) {}
  
    static readonly struct = new FixableBeetStruct<DungeonClaimAchievementInstruction>(
      [
        ['instruction', u8],
        ['achievement', u8]
      ],
      (args) => new DungeonClaimAchievementInstruction(args.instruction!, args.achievement!),
      'DungeonClaimAchievementInstruction'
    )
}

export async function request_player_account_data(bearer : string, pubkey : PublicKey) : Promise<PlayerData | null>
{
 
    let account_data = await request_raw_account_data(bearer, pubkey);

    if (account_data === null) {
        return null;
    }

    const [data] = PlayerData.struct.deserialize(account_data);

    return data;
}

export async function request_player_achievement_data(bearer : string, pubkey : PublicKey) : Promise<AchievementData | null>
{
 
    let account_data = await request_raw_account_data(bearer, pubkey);

    if (account_data === null) {
        return null;
    }

    const [data] = AchievementData.struct.deserialize(account_data);

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

export function serialise_claim_achievement_instruction(instruction : number, achievement : number) : Buffer
{

    const data = new DungeonClaimAchievementInstruction(instruction, achievement);
    const [buf] = DungeonClaimAchievementInstruction.struct.serialize(data);

    return buf;
}

////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////// Key Shop Instructions and MetaData /////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////


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

export async function request_key_data_from_mint(bearer : string, pubkey : PublicKey) : Promise<KeyDataFromMint | null>
{
 
    let account_data = await request_raw_account_data(bearer, pubkey);

    if (account_data === null) {
        return null;
    }

    const [data] = KeyDataFromMint.struct.deserialize(account_data);

    return data;
}

export async function request_key_data_from_index(bearer : string, pubkey : PublicKey) : Promise<KeyDataFromIndex | null>
{
 
    let account_data = await request_raw_account_data(bearer ,pubkey);

    if (account_data === null) {
        return null;
    }

    const [data] = KeyDataFromIndex.struct.deserialize(account_data);

    return data;
}

export async function request_shop_data(bearer : string, pubkey : PublicKey) : Promise<ShopData | null>
{
 
    let account_data = await request_raw_account_data(bearer, pubkey);

    if (account_data === null) {
        return null;
    }

    const [data] = ShopData.struct.deserialize(account_data);

    return data;
}


export async function request_shop_user_data(bearer : string, pubkey : PublicKey) : Promise<ShopUserData | null>
{
 
    let account_data = await request_raw_account_data(bearer, pubkey);

    if (account_data === null) {
        return null;
    }

    const [data] = ShopUserData.struct.deserialize(account_data);

    return data;
}

export async function run_keyData_GPA(bearer : string, key_index : number) : Promise<KeyDataFromMint | null>
{
    let index_buffer = uInt16ToLEBytes(key_index);


    let encoded_key_index = bs58.encode(index_buffer);
    const program_accounts_url = `/.netlify/functions/solana?bearer=`+bearer+`&network=`+network_string+`&function_name=getProgramAccounts&p1=`+SHOP_PROGRAM.toString()+`&config=true&encoding=base64&commitment=confirmed&filters=true&data_size_filter=35&memcmp=true&offset=33&bytes=`+encoded_key_index;

    var program_accounts_result;
    try {
        program_accounts_result = await fetch(program_accounts_url).then((res) => res.json());
    }
    catch(error) {
        console.log(error);
        return null;
    }

    console.log(program_accounts_result["result"]);

    // this should only be of length 1
    if ( program_accounts_result["result"].length !== 1) {
        console.log("GPA returned wrong number of accounts");
        return null
    }

    

    let encoded_data = program_accounts_result["result"][0]["account"]["data"][0];
    let decoded_data = Buffer.from(encoded_data, "base64");

    const [data] = KeyDataFromMint.struct.deserialize(decoded_data);


    if (data.key_index !== key_index) {
        console.log("GPA returned incorrect key");
        return null;
    }

    return data
}


////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////// Dungeon Master Instructions and MetaData /////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////


class DMManagerData {
    constructor(
      readonly total_dms: number,
      readonly dms_minted: boolean[],
      readonly total_fees: bignum,
      readonly last_fees: bignum,

      readonly dm_fees: bignum[],
      readonly founders_fees: bignum[],
      

    ) {}
  
    static readonly struct = new BeetStruct<DMManagerData>(
      [
        ['total_dms', u16],
        ['dms_minted', uniformFixedSizeArray(bool, 256)],
        ['total_fees', u64],
        ['last_fees', u64],
        ['dm_fees', uniformFixedSizeArray(u64, 256)],
        ['founders_fees', uniformFixedSizeArray(u64, 2)],

      ],
      (args) => new DMManagerData(args.total_dms!, args.dms_minted!, args.total_fees!, args.last_fees!, args.dm_fees!, args.founders_fees!),
      'DMManagerData'
    )
}

class DMData {
    constructor(
      readonly dm_index: number,
      readonly dm_mint: PublicKey,
      readonly total_fees_raised: bignum
    ) {}
  
    static readonly struct = new BeetStruct<DMData>(
      [
        ['dm_index', u16],
        ['dm_mint', publicKey],
        ['total_fees_raised', u64]
      ],
      (args) => new DMData(args.dm_index!, args.dm_mint!, args.total_fees_raised!),
      'DMData'
    )
}

class DMUserData {
    constructor(
      readonly keys_burnt: number
    ) {}
  
    static readonly struct = new BeetStruct<DMUserData>(
      [
        ['keys_burnt', u16]
      ],
      (args) => new DMUserData(args.keys_burnt!),
      'DMUserData'
    )
}


class DM_Mint_Instruction {
    constructor(
      readonly instruction: number,
      readonly name: string

    ) {}
  
    static readonly struct = new FixableBeetStruct<DM_Mint_Instruction>(
      [
        ['instruction', u8],
        ['name', utf8String]
      ],
      (args) => new DM_Mint_Instruction(args.instruction!, args.name!),
      'DM_Mint_Instruction'
    )
}


export function serialise_DM_Mint_instruction(instruction : number, name : string) : Buffer
{

    const data = new DM_Mint_Instruction(instruction, name);
    const [buf] = DM_Mint_Instruction.struct.serialize(data);

    return buf;
}

export async function request_DM_Manager_data(bearer : string, pubkey : PublicKey) : Promise<DMManagerData | null>
{
 
    let account_data = await request_raw_account_data(bearer, pubkey);

    if (account_data === null) {
        return null;
    }

    const [data] = DMManagerData.struct.deserialize(account_data);

    return data;
}

export async function request_DM_data(bearer : string, pubkey : PublicKey) : Promise<DMData | null>
{
 
    let account_data = await request_raw_account_data(bearer, pubkey);

    if (account_data === null) {
        return null;
    }

    const [data] = DMData.struct.deserialize(account_data);

    return data;
}

export async function request_DM_User_data(bearer : string, pubkey : PublicKey) : Promise<DMUserData | null>
{
 
    let account_data = await request_raw_account_data(bearer, pubkey);

    if (account_data === null) {
        return null;
    }

    const [data] = DMUserData.struct.deserialize(account_data);

    return data;
}

export function bignum_to_num(bn : bignum) : number
{
    let value = (new BN(bn)).toNumber();

    return value;
}