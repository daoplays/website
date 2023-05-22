import { memo } from 'react';

import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BeetStruct, FixableBeetStruct, uniformFixedSizeArray,  utf8String, u8, u16, u32, u64, i64, bignum, bool } from '@metaplex-foundation/beet'
import { publicKey } from '@metaplex-foundation/beet-solana'

import { network_string, SHOP_PROGRAM, DEBUG, RPC_NODE, MARKETPLACE_PROGRAM, ARENA_PROGRAM} from './constants';
import {
    Box,
} from '@chakra-ui/react';

import BN from 'bn.js'
import bs58 from "bs58";

import {
    WalletDisconnectButton,
} from '@solana/wallet-adapter-react-ui';

// memo for wrapping video content
export const VideoComponent = memo(function MyVideoComponent({url, width, height} : {url : string, width : string, height : string}) {
      // only renders if url have changed!
      return (
        <video width={width} height={height}  controls controlsList="nodownload">
            <source src={url} type="video/mp4"/>
            Your browser does not support the video tag.
        </video>
        );
});

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

 export function uInt32ToLEBytes(num : number) : Buffer {

    const bytes = Buffer.alloc(4);
    bytes.writeUInt32LE(num);
   
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
    var body = {"id": 1, "jsonrpc": "2.0", "method": "sendTransaction", "params": [encoded_transaction, {"skipPreflight": true}]};
   
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
        // console.log(account_info_result);
        return 0;
    }

    if (account_info_result["result"]["value"] == null || account_info_result["result"]["value"]["lamports"] == null) {
        console.log("Error getting lamports for ", pubkey.toString());
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





export async function request_raw_account_data(bearer : string, pubkey : PublicKey, name : String = "default") : Promise<Buffer | null>
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
        console.log("error parsing ", name)
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

export interface NewDiscordMessage {
    message_type : string;
    emoji_1: string;
    emoji_2: string;
    level: number;
    sol_amount: number;
    achievement_name: string;
}


export async function post_discord_message(message : NewDiscordMessage) : Promise<null>
{

    const account_info_url = `/.netlify/functions/post_discord?method=post&message_type=` + message.message_type + `&emoji_1=` + message.emoji_1 + `&emoji_2=` + message.emoji_2 + `&level=` + message.level + `&sol_amount=` + message.sol_amount.toFixed(3) + `&achievement_name=` + message.achievement_name;

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
      readonly last_gold: bignum,
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
        ['last_gold', u64],
        ['extra_data', uniformFixedSizeArray(u8, 15)],

      ],
      (args) => new PlayerData(args.num_plays!, args.num_wins!, args.in_progress!, args.player_status!, args.dungeon_enemy!, args.player_character!, args.current_bet_size!, args.current_key!, args.last_gold!, args.extra_data!),
      'PlayerData'
    )
}

export class AchievementData {
    constructor(
      readonly achievement_state: number[],
      readonly levels_won: number[],
      readonly levels_quit: number[],
      readonly levels_lost: number[],
      readonly enemies_lose: number[],
      readonly enemies_win: number[],

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
      (args) => new AchievementData(args.achievement_state!, args.levels_won!, args.levels_quit!, args.levels_lost!, args.enemies_lose!, args.enemies_win!, args.games_played!, args.losing_streak!, args.winning_streak!, args.last_date_played!, args.play_streak!, args.games_played_today!, args.total_days_played!, args.total_lamports_claimed!, args.n_interactions!),
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

class DungeonQuitInstruction {
    constructor(
        readonly instruction: number,
        readonly ref_code: string

    ) {}
  
    static readonly struct = new FixableBeetStruct<DungeonQuitInstruction>(
      [
        ['instruction', u8],
        ['ref_code', utf8String]
      ],
      (args) => new DungeonQuitInstruction(args.instruction!, args.ref_code!),
      'DungeonQuitInstruction'
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

export function serialise_quit_instruction(instruction : number, ref_code : string) : Buffer
{

    const data = new DungeonQuitInstruction(instruction, ref_code);
    const [buf] = DungeonQuitInstruction.struct.serialize(data);

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
/////////////////////// Shop Instructions and MetaData /////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

class ShopMintFromCollectionInstruction {
    constructor(
        readonly instruction: number,
        readonly which_collection: number,
        readonly which_from_collection: number

    ) {}
  
    static readonly struct = new BeetStruct<ShopMintFromCollectionInstruction>(
      [
        ['instruction', u8],
        ['which_collection', u8],
        ['which_from_collection', u8]

      ],
      (args) => new ShopMintFromCollectionInstruction(args.instruction!, args.which_collection!, args.which_from_collection!),
      'ShopMintFromCollectionInstruction'
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

export class ShopData {
    constructor(
      readonly keys_bought: number,
      readonly key_types_bought: number[],
      readonly music_boxes_bought: number[],
      readonly paintings_bought: number[],
      readonly lore_pages_bought: number[],

    ) {}
  
    static readonly struct = new BeetStruct<ShopData>(
      [
        ['keys_bought', u16],
        ['key_types_bought', uniformFixedSizeArray(u16, 3)],
        ['music_boxes_bought', uniformFixedSizeArray(u16, 32)],
        ['paintings_bought', uniformFixedSizeArray(u16, 32)],
        ['lore_pages_bought', uniformFixedSizeArray(u16, 32)],

      ],
      (args) => new ShopData(args.keys_bought!, args.key_types_bought!, args.music_boxes_bought!, args.paintings_bought!, args.lore_pages_bought!),
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

    var body = {"id": 1, "jsonrpc": "2.0", "method": "getProgramAccounts", "params": [SHOP_PROGRAM.toString(), {"filters": [{"dataSize" : 35}, {"memcmp": {"offset":33, "bytes": encoded_key_index}}], "encoding": "base64", "commitment": "confirmed"}]};

    var program_accounts_result;
    try {
        program_accounts_result = await postData(RPC_NODE, bearer, body);
    }
    catch(error) {
        console.log("error with key GPA", error);
        console.log(error);
        return null;
    }


    console.log("key GPA result:", program_accounts_result["result"]);


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

export function serialise_mint_from_collection_instruction(instruction : number, which_collection : number, which_from_collection : number) : Buffer
{

    const data = new ShopMintFromCollectionInstruction(instruction, which_collection, which_from_collection);
    const [buf] = ShopMintFromCollectionInstruction.struct.serialize(data);

    return buf;
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

////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////// Marketplace Instructions and MetaData /////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

export class ListingData {
    constructor(
      readonly item: number,   
      readonly quantity: number,
      readonly price: bignum,
      readonly seller_account: PublicKey,
      readonly seed: number
    ) {}
  
    static readonly struct = new BeetStruct<ListingData>(
      [
        ['item', u8],
        ['quantity', u16],
        ['price', u64],
        ['seller_account', publicKey],
        ['seed', u32]
      ],
      (args) => new ListingData(args.item!, args.quantity!, args.price!, args.seller_account!, args.seed!),
      'ListingData'
    )
}

export async function run_marketplace_GPA(bearer : string) : Promise<ListingData[]>
{
    //let index_buffer = uInt16ToLEBytes(key_index);


    //let encoded_key_index = bs58.encode(index_buffer);
    const program_accounts_url = `/.netlify/functions/solana?bearer=`+bearer+`&network=`+network_string+`&function_name=getProgramAccounts&p1=`+MARKETPLACE_PROGRAM.toString()+`&config=true&encoding=base64&commitment=confirmed&filters=true&data_size_filter=47`;//&memcmp=true&offset=33&bytes=`+encoded_key_index;

    var program_accounts_result;
    try {
        program_accounts_result = await fetch(program_accounts_url).then((res) => res.json());
    }
    catch(error) {
        console.log(error);
        return [];
    }

    console.log(program_accounts_result["result"]);

    let result : ListingData[] = [];
    for (let i = 0; i < program_accounts_result["result"]?.length; i++) {
        console.log(program_accounts_result["result"][i]);
        let encoded_data = program_accounts_result["result"][i]["account"]["data"][0];
        let decoded_data = Buffer.from(encoded_data, "base64");
        const [listing] = ListingData.struct.deserialize(decoded_data);
        result.push(listing);
    }

    return result;
}

class Marketplace_List_Instruction {
    constructor(
        readonly instruction: number,
        readonly item: number,
        readonly quantity: number,
        readonly price: bignum,
        readonly seed: number
    ) {}
  
    static readonly struct = new BeetStruct<Marketplace_List_Instruction>(
      [
        ['instruction', u8],
        ['item', u8],
        ['quantity', u16],
        ['price', u64],
        ['seed', u32]
      ],
      (args) => new Marketplace_List_Instruction(args.instruction!, args.item!, args.quantity!, args.price!, args.seed!),
      'Marketplace_List_Instruction'
    )
}
/*
class Marketplace_Update_Instruction {
    constructor(
        readonly instruction: number,
        readonly quantity: number,
        readonly price: bignum
    ) {}
  
    static readonly struct = new BeetStruct<Marketplace_Update_Instruction>(
      [
        ['instruction', u8],
        ['quantity', u16],
        ['price', u64]
      ],
      (args) => new Marketplace_Update_Instruction(args.instruction!, args.quantity!, args.price!),
      'Marketplace_Update_Instruction'
    )
}
*/


class Marketplace_Buy_Instruction {
    constructor(
        readonly instruction: number,
        readonly quantity: number
    ) {}
  
    static readonly struct = new BeetStruct<Marketplace_Buy_Instruction>(
      [
        ['instruction', u8],
        ['quantity', u16]
      ],
      (args) => new Marketplace_Buy_Instruction(args.instruction!, args.quantity!),
      'Marketplace_Buy_Instruction'
    )
}



export function serialise_Marketplace_list_instruction(instruction : number, item : number, quantity : number, price : bignum, seed : number) : Buffer
{

    const data = new Marketplace_List_Instruction(instruction, item, quantity, price, seed);
    const [buf] = Marketplace_List_Instruction.struct.serialize(data);

    return buf;
}
/*
export function serialise_Marketplace_update_instruction(instruction : number, quantity : number, price : bignum) : Buffer
{

    const data = new Marketplace_Update_Instruction(instruction, quantity, price);
    const [buf] = Marketplace_Update_Instruction.struct.serialize(data);

    return buf;
}
*/
export function serialise_Marketplace_buy_instruction(instruction : number, quantity : number) : Buffer
{

    const data = new Marketplace_Buy_Instruction(instruction, quantity);
    const [buf] = Marketplace_Buy_Instruction.struct.serialize(data);

    return buf;
}



////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////// Arena Instructions and MetaData /////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

export class GameData {
    constructor(
        readonly game_id: bignum,
        readonly game_speed: number,
        readonly last_interaction: bignum,
        readonly num_interactions: number,   
        readonly num_round: number,   
        readonly bet_size: bignum,   
        readonly player_one: PublicKey,
        readonly player_two: PublicKey,
        readonly player_one_encrypted_move: number[],
        readonly player_two_encrypted_move: number[],
        readonly player_one_move: number,
        readonly player_two_move: number,
        readonly player_one_character: number,
        readonly player_two_character: number,
        readonly player_one_status: number,
        readonly player_two_status: number,
        readonly status: number,
        readonly seed: number,
        readonly max_rounds: number,
        readonly round_winners: number[],
        readonly spare_data: number[]
    ) {}
  
    static readonly struct = new BeetStruct<GameData>(
      [
        ['game_id', u64],
        ['game_speed', u8],
        ['last_interaction', i64],
        ['num_interactions', u16],
        ['num_round', u8],
        ['bet_size', u64],
        ['player_one', publicKey],
        ['player_two', publicKey],
        ['player_one_encrypted_move', uniformFixedSizeArray(u8, 32)],
        ['player_two_encrypted_move', uniformFixedSizeArray(u8, 32)],
        ['player_one_move', u8],
        ['player_two_move', u8],
        ['player_one_character', u8],
        ['player_two_character', u8],
        ['player_one_status', u8],
        ['player_two_status', u8],
        ['status', u8],
        ['seed', u32],
        ['max_rounds', u8],
        ['round_winners', uniformFixedSizeArray(u8, 5)],
        ['spare_data', uniformFixedSizeArray(u8, 32)]
      ],
      (args) => new GameData(args.game_id!, args.game_speed!, args.last_interaction!, args.num_interactions!, args.num_round!, args.bet_size!, args.player_one!, args.player_two!, args.player_one_encrypted_move!, args.player_two_encrypted_move!, args.player_one_move!, args.player_two_move!, args.player_one_character!, args.player_two_character!, args.player_one_status!, args.player_two_status!, args.status!, args.seed!, args.max_rounds!, args.round_winners!, args.spare_data!),
      'GameData'
    )
}

export async function request_arena_game_data(bearer : string, pubkey : PublicKey) : Promise<GameData | null>
{
 
    let account_data = await request_raw_account_data(bearer, pubkey);

    if (account_data === null) {
        return null;
    }

    const [data] = GameData.struct.deserialize(account_data);

    return data;
}

export async function run_arena_free_game_GPA(bearer : string) : Promise<GameData[]>
{

    var body = {"id": 1, "jsonrpc": "2.0", "method": "getProgramAccounts", "params": [ARENA_PROGRAM.toString(), {"filters": [{"dataSize" : 205}], "encoding": "base64", "commitment": "confirmed"}]};

    var program_accounts_result;
    try {
        program_accounts_result = await postData(RPC_NODE, bearer, body);
    }
    catch(error) {
        console.log(error);
        return [];
    }

    console.log(program_accounts_result["result"]);

    let result : GameData[] = [];
    for (let i = 0; i < program_accounts_result["result"]?.length; i++) {
        //console.log(program_accounts_result["result"][i]);
        let encoded_data = program_accounts_result["result"][i]["account"]["data"][0];
        let decoded_data = Buffer.from(encoded_data, "base64");
        const [game] = GameData.struct.deserialize(decoded_data);
        result.push(game);
    }

    return result;
}

class Arena_CreateGame_Instruction {
    constructor(
        readonly instruction: number,
        readonly bid_size: bignum,
        readonly seed: number,
        readonly character: number,
        readonly game_speed: number
    ) {}
  
    static readonly struct = new BeetStruct<Arena_CreateGame_Instruction>(
      [
        ['instruction', u8],
        ['bid_size', u64],
        ['seed', u32],
        ['character', u8],
        ['game_speed', u8]

      ],
      (args) => new Arena_CreateGame_Instruction(args.instruction!, args.bid_size!, args.seed!, args.character!, args.game_speed!),
      'Arena_CreateGame_Instruction'
    )
}

class Arena_JoinGame_Instruction {
    constructor(
        readonly instruction: number,
        readonly character: number
    ) {}
  
    static readonly struct = new BeetStruct<Arena_JoinGame_Instruction>(
      [
        ['instruction', u8],
        ['character', u8]
      ],
      (args) => new Arena_JoinGame_Instruction(args.instruction!, args.character!),
      'Arena_JoinGame_Instruction'
    )
}

class Arena_Move_Instruction {
    constructor(
        readonly instruction: number,
        readonly move: number[]
    ) {}
  
    static readonly struct = new BeetStruct<Arena_Move_Instruction>(
      [
        ['instruction', u8],
        ['move', uniformFixedSizeArray(u8, 32)]
      ],
      (args) => new Arena_Move_Instruction(args.instruction!, args.move!),
      'Arena_Move_Instruction'
    )
}

class Arena_Reveal_Instruction {
    constructor(
        readonly instruction: number,
        readonly move_one: number,
        readonly salt_one: string,
        readonly move_two: number,
        readonly salt_two: string,

    ) {}
  
    static readonly struct = new FixableBeetStruct<Arena_Reveal_Instruction>(
      [
        ['instruction', u8],
        ['move_one', u8],
        ['salt_one', utf8String],
        ['move_two', u8],
        ['salt_two', utf8String]
      ],
      (args) => new Arena_Reveal_Instruction(args.instruction!, args.move_one!, args.salt_one!, args.move_two!, args.salt_two!),
      'Arena_Reveal_Instruction'
    )
}


export function serialise_Arena_CreateGame_instruction(instruction : number, bid_size : bignum, seed : number, character : number, game_speed : number) : Buffer
{

    const data = new Arena_CreateGame_Instruction(instruction, bid_size, seed, character, game_speed);
    const [buf] = Arena_CreateGame_Instruction.struct.serialize(data);

    return buf;
}

export function serialise_Arena_JoinGame_instruction(instruction : number, character : number) : Buffer
{

    const data = new Arena_JoinGame_Instruction(instruction, character);
    const [buf] = Arena_JoinGame_Instruction.struct.serialize(data);

    return buf;
}

export function serialise_Arena_Move_instruction(instruction : number, move : number[]) : Buffer
{

    const data = new Arena_Move_Instruction(instruction, move);
    const [buf] = Arena_Move_Instruction.struct.serialize(data);

    return buf;
}

export function serialise_Arena_Reveal_instruction(instruction : number, move_one : number, salt_one : string, move_two : number, salt_two : string) : Buffer
{

    const data = new Arena_Reveal_Instruction(instruction, move_one, salt_one, move_two, salt_two);
    const [buf] = Arena_Reveal_Instruction.struct.serialize(data);

    return buf;
}

export function bignum_to_num(bn : bignum) : number
{
    let value = (new BN(bn)).toNumber();

    return value;
}