import React, { useCallback, useEffect, useState, useMemo, createContext, useContext } from 'react';
import {
    ChakraProvider,
    Box,
    Button,
    HStack,
    theme,
    Center,
    Text,
    VStack,
    FormControl,
    Input
} from '@chakra-ui/react';

import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
} from '@chakra-ui/react'

import {
    useDisclosure,
    Drawer,
    DrawerBody,
    DrawerOverlay,
    DrawerContent,
    DrawerCloseButton,
  } from '@chakra-ui/react'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { brands, solid } from '@fortawesome/fontawesome-svg-core/import.macro' // <-- import styles to be used


import { isMobile } from "react-device-detect";
import { randomBytes } from 'crypto'
import { serialize, deserialize } from 'borsh';

import useSound from 'use-sound';

import { PublicKey, Keypair, Transaction, TransactionInstruction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import {
    getAssociatedTokenAddress,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  } from "@solana/spl-token";
import {
    WalletProvider,
    useWallet,
} from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';

import {
    WalletModalProvider,
    WalletMultiButton,
    WalletDisconnectButton,
} from '@solana/wallet-adapter-react-ui';

import { Metadata } from '@metaplex-foundation/mpl-token-metadata';

import bs58 from "bs58";

import dungeon_title from "./Dungeon_Logo.png"
import large_door from "./Large_Door.gif"
import hallway from "./Hallway.gif"
import shop from "./ShopBuild.gif"

// shop items
import key from "./Key.png"

//characters
import knight from "./Knight.gif"
import ranger from "./Ranger.gif"
import wizard from "./Wizard.gif"
import corpse from "./Corpse.png"
import selector from "./Selector.gif"

//enemies
import closed_chest from "./chest_closed.png"
import open_chest from "./chest_open.png"
import mimic from "./Mimic.gif"
import slime from "./Slime.gif"
import goblins from "./Goblins.gif"
import skeletons_hallway from "./Skellies.gif"
import skeletons_graveyard from "./Skellies.gif"
import elves from "./Elves.gif"
import orc from "./Orc.gif"
import skeleton_knight from "./Skelly_Knight.gif"
import skeleton_wizard from "./Skelly_Wiz.gif"
import reaper from "./Reaper.gif"
import boulder from "./Boulder.png"
import floor_spikes from "./Spikes.png"

//sounds
import click_sound from './sounds/click.mp3';

import './fonts.css';
import './wallet.css';
require('@solana/wallet-adapter-react-ui/styles.css');


const DEBUG = true;
const PROD = false;

var network_string = "devnet";
if (PROD) {
    network_string = "mainnet"
}

//pyth oracles
const PYTH_BTC_DEV = new PublicKey('HovQMDrbAgAYPCmHVSrezcSmkMtXSSUsLDFANExrZh2J');   
const PYTH_ETH_DEV = new PublicKey('EdVCmQ9FSPcVe5YySXDPCRmc8aDQLKJ9xvYBMZPie1Vw');   
const PYTH_SOL_DEV = new PublicKey('J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix');  

const PYTH_BTC_PROD = new PublicKey('GVXRSBjFk6e6J3NbVPXohDJetcTjaeeuykUpbQF8UoMU');   
const PYTH_ETH_PROD = new PublicKey('JBu1AL4obBcCMqKBBxhpWCNUt136ijcuMZLFvTP7iWdB');   
const PYTH_SOL_PROD = new PublicKey('H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG');

const METAPLEX_META = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

const SHOP_PROGRAM = new PublicKey("7furJTvAgYYEjFkCbhiYsmEXMtzbUyMj1Q6gwspioCpk");
const COLLECTION_MASTER = new PublicKey('DoQvfRLYGS2bgjc63cGCFpB4P9WVr325Qxm4QHcwdZ8P');
const COLLECTION_META = new PublicKey('CZptrCQokZCuou1B6HPoEXoT6hg4LcsRZczsoJQRKhEw');
const COLLECTION_MINT = new PublicKey('6QWFyyfNfDgzhzhZ5Ry2rVvyBHRyMhD2xDymu7Bc9KiK');

const PROGRAM_KEY = new PublicKey('FUjAo5wevsyS2jpe2XnkYN3SyQVbxAjoy8fuWrw3wjUk');


const SYSTEM_KEY = new PublicKey("11111111111111111111111111111111");
const DAOPLAYS_KEY = new PublicKey("2BLkynLAWGwW58SLDAnhwsoiAuVtzqyfHKA3W3MJFwEF");
const KAYAK_KEY = new PublicKey("7oAfRLy81EwMJAXNKbZFaMTayBFoBpkua4ukWiCZBZz5");
const ORAO_KEY = new PublicKey("VRFzZoJdhFWL8rkvu87LpKM3RbcVezpMEc6X5GVDr7y");

const ORAO_RANDOMNESS_ACCOUNT_SEED = Buffer.from("orao-vrf-randomness-request");
const ORAO_CONFIG_ACCOUNT_SEED = Buffer.from("orao-vrf-network-configuration");

const WHITELIST_TOKEN =  new PublicKey("CisHceikLeKxYiUqgDVduw2py2GEK71FTRykXGdwf22h");

// set font size
var DEFAULT_FONT_SIZE = "30px"
var DUNGEON_FONT_SIZE = "20px"

if (isMobile) {
    DEFAULT_FONT_SIZE = "15px"
    DUNGEON_FONT_SIZE = "10px"
}

// context for all the state
const StateContext = createContext();


const BET_SIZE = 0.05;

const AccountStatus = {
    unknown : 0,
    created : 1,
    not_created : 2
}
//const AccountStatusString = ["unknown", "created", "not_created"];

const DungeonStatus = {
    unknown : 0,
    alive : 1,
    dead : 2,
    exploring : 3
}
const DungeonStatusString = ["unknown", "alive", "dead", "exploring"];

const ChestStatus = {
    closed : 0,
    open : 1,
    lead : 2,
    bronze : 3,
    silver : 4,
    gold : 5,
    obsidian  : 6
}

const DungeonCharacter = {
    knight : 0,
    ranger : 1,
    wizard : 2
}


const Screen = {
    HOME_SCREEN : 0,
    DUNGEON_SCREEN : 1,
    DEATH_SCREEN : 2,
    FAQ_SCREEN : 3,
    ODDS_SCREEN : 4,
    HELP_SCREEN : 5,
    SHOP_SCREEN : 6
}

const DungeonEnemy = {
    
    Chest : 0,
    Slime : 1,
    Goblins : 2,
    SkeletonsHallway : 3,
    SkeletonsGraveyard : 4,
    Elves : 5,
    Orc : 6,
    SkellyKnight : 7,
    SkellyWizard : 8,
    Reaper : 9,
    Boulder : 10,
    FloorSpikes : 11,
    None : 12
}

const KeyType = {
    Bronze : 0,
    Silver : 1,
    Gold : 2,
    Unknown : 3
}

const DungeonEnemyName = ["Mimic", "Slime", "Goblins", "Skeletons", "Skeletons", "Elves", "Orc", "Skeleton Knight", "Skeleton Wizard", "Reaper", "Boulder", "Floor Spikes"];


const DungeonEnemyInitialText = ["mimic", "an oozing green slime", "a pair of goblins", "a horde of skeletons", "a horde of skeletons", "a group of elven archers", "a huge orc", "a skeleton knight", "a skeleton wizard", "the Grim Reaper", "Boulder", "Floor Spikes"];

const DungeonEnemyDefeatText = ["The mimic's transformation stuns you for just a moment, but that is all it needed", "The slime oozes past your defenses and envelopes you, suffocating you where you stand", "The goblins are too fast, you lose sight of them for just a second and the next thing you see is a knife to your throat", "The skeletons manage to surround you, and strike from all sides", "There were just.. too many skeletons", "You take an arrow to the knee, and while stumbling are unable to dodge the next volley to the heart", "With one swing from it's axe the orc cracks your head open like an egg", "Your attacks are simply deflected off the knight's armour until it gets bored and strikes you down", "Hoarsely croaking some ancient incantation the wizard turns you inside out before you even have a chance to attack", "The Reaper's scythe passes through you as though you were no more than air as it claims another soul", "Boulder", "Floor Spikes"];

const DungeonInstruction = {
    add_funds : 0,
    distribute : 1,
    play : 2,
    quit : 3,
    explore : 4
}

const ShopInstruction = {
    init : 0,
    create_token : 1,
    create_collection : 2,
    burn_token : 3
}

class Assignable {
    constructor(properties) {
      Object.keys(properties).map((key) => {
        return (this[key] = properties[key]);
      });
    }
  }

class PlayerData extends Assignable { }
class InstructionMeta extends Assignable { }
class PlayMeta extends Assignable { }
class ExploreMeta extends Assignable { }
class my_pubkey extends Assignable { }
class ShopData extends Assignable { }
class ShopUserData extends Assignable { }
class KeyMetaData extends Assignable { }
class KeyMetaData2 extends Assignable { }


const player_data_schema = new Map([
  [PlayerData, { kind: 'struct', 
  fields: [
        ['num_plays', 'u64'],
        ['num_wins', 'u64'],
        ['in_progress', 'u8'],
        ['player_status', 'u8'],
        ['dungeon_enemy', 'u8'],
        ['player_character', 'u8'],
        ['current_bet_size', 'u64'],
        ['current_key', 'u8'],
        ['extra_data', [23]]
    ],
    }]
]);

const instruction_schema = new Map([
    [InstructionMeta, { kind: 'struct', 
    fields: [
          ['instruction', 'u8']],
      }]
]);

const play_scheme = new Map([
    [PlayMeta, { kind: 'struct', 
    fields: [
          ['instruction', 'u8'],
          ['character', 'u8']
        ],
      }]
]);

const explore_scheme = new Map([
    [ExploreMeta, { kind: 'struct', 
    fields: [
          ['instruction', 'u8'],
          ['seed', [32]],
          ['character', 'u8']
        ],
      }]
]);


const pubkey_scheme = new Map([
    [my_pubkey, { kind: 'struct', 
    fields: [
    ['value', [32]]] }]
]);

const shop_data_schema = new Map([
    [ShopData, { kind: 'struct', 
    fields: [
          ['keys_bought', 'u64'],
          ['key_types_bought',  [40]]],
      }]
  ]);

const shop_user_data_schema = new Map([
    [ShopUserData, { kind: 'struct', 
    fields: [
          ['num_keys', 'u64'],
          ['last_xp',   'u64']],
      }]
  ]);

  const key_meta_data_schema = new Map([
    [KeyMetaData, { kind: 'struct', 
    fields: [
          ['key_type', 'u8'],
          ['key_index', 'u16']
        ],
      }]
  ]);

  const key_meta_data2_schema = new Map([
    [KeyMetaData2, { kind: 'struct', 
    fields: [
          ['key_type', 'u8'],
          ['key_mint', [32]]
        ],
      }]
  ]);

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

export function OddsScreen()
{
    let table_size = "md";
    if (isMobile)
        table_size = "sm"

    return(
        <>
        <Center>
        <Box width = "80%">
        <div className="font-face-sfpb" style={{color: "white", fontSize: DUNGEON_FONT_SIZE}}>

        <h2 className="mt-5" style={{fontSize: DEFAULT_FONT_SIZE}}>Overview</h2><br />

        Each Room in the DUNGEON spawns a Peril. Most Perils are Enemies you will need to fight, but some are Traps such as falling boulders, or spike pits.

        Each type of Peril has its own chance of death, with some Perils being more likely to kill  than others. However, each Room has an overall 50/50 chance of success.

        <h2 className="mt-5" style={{fontSize: DEFAULT_FONT_SIZE}}>Probability Table</h2><br />

        
        <TableContainer >
            <Table variant='simple' size={table_size}>
            <Thead>
            <Tr>
                <Th>Peril</Th>
                {!isMobile &&
                    <Th isNumeric>Spawn %</Th>
                }
                {isMobile &&
                    <Th isNumeric>S %</Th>
                }
                {!isMobile &&
                    <Th isNumeric>Death %</Th>
                }
                {isMobile &&
                    <Th isNumeric>D %</Th>
                }
                {!isMobile &&
                    <Th isNumeric>Weighted Probability</Th>
                }
                {isMobile &&
                    <Th isNumeric>W. Pb</Th>
                }
                
            </Tr>
            </Thead>
            <Tbody>
            <Tr>
                <Td>Mimic</Td>
                <Td isNumeric>5</Td>
                <Td isNumeric>22</Td>
                <Td isNumeric>1.1</Td>
            </Tr>
            <Tr>
                <Td>Slime</Td>
                <Td isNumeric>10</Td>
                <Td isNumeric>10</Td>
                <Td isNumeric>1</Td>
            </Tr>
            <Tr>
                <Td>Goblins</Td>
                <Td isNumeric>15</Td>
                <Td isNumeric>40</Td>
                <Td isNumeric>6</Td>
            </Tr>
            <Tr>
                <Td>Skeletons</Td>
                <Td isNumeric>12</Td>
                <Td isNumeric>50</Td>
                <Td isNumeric>6</Td>
            </Tr>
            <Tr>
                <Td>Elves</Td>
                <Td isNumeric>10</Td>
                <Td isNumeric>55</Td>
                <Td isNumeric>5.5</Td>
            </Tr>
            <Tr>
                <Td>Orc</Td>
                <Td isNumeric>10</Td>
                <Td isNumeric>65</Td>
                <Td isNumeric>6.5</Td>
            </Tr>
            <Tr>
                {!isMobile &&
                    <Td>Skeleton Knight</Td>
                }
                {isMobile &&
                    <Td>Sk. Knight</Td>
                }
                <Td isNumeric>8</Td>
                <Td isNumeric>75</Td>
                <Td isNumeric>6</Td>
            </Tr>
            <Tr>
                {!isMobile &&
                    <Td>Skeleton Wizard</Td>
                }
                {isMobile &&
                    <Td>Sk. Wizard</Td>
                }
                <Td isNumeric>8</Td>
                <Td isNumeric>90</Td>
                <Td isNumeric>7.2</Td>
            </Tr>
            <Tr>
                <Td>Reaper</Td>
                <Td isNumeric>10</Td>
                <Td isNumeric>65</Td>
                <Td isNumeric>6.5</Td>
            </Tr>
            <Tr>
                {!isMobile &&
                    <Td>Boulder Trap</Td>
                }
                {isMobile &&
                    <Td>Boulder</Td>
                }
                <Td isNumeric>6</Td>
                <Td isNumeric>35</Td>
                <Td isNumeric>2.1</Td>
            </Tr>
            <Tr>
                {!isMobile &&
                    <Td>Spike Trap</Td>
                }
                {isMobile &&
                    <Td>Spike</Td>
                }
                <Td isNumeric>6</Td>
                <Td isNumeric>35</Td>
                <Td isNumeric>2.1</Td>
            </Tr>
             <Tr>
                <Td></Td>
                <Td isNumeric>100</Td>
                <Td isNumeric></Td>
                <Td isNumeric>50</Td>
            </Tr>
            </Tbody>
        </Table>
        </TableContainer>

        </div>
        </Box>
        </Center>
        </>
    );
}

export function FAQScreen()
{
    return(
        <>
        <Center>
        <Box width = "80%">
        <div className="font-face-sfpb" style={{color: "white", fontSize: DUNGEON_FONT_SIZE}}>

        <h2 className="mt-5" style={{fontSize: DEFAULT_FONT_SIZE}}>What is Dungeons & Degens</h2><br />
        
        
        DUNGEONS & DEGENS is a Web3 gaming site inspired by retro dungeon crawlers and RPGs. It combines elements of wagering and RPG progression to create an exciting and immersive entertainment experience.

        The XP System grants Players XP points as they progress through the dungeon. XP points can be spent on a variety of rewards such as free raffle entries and Solana Loot NFTs.

        The Solana Loot System is similar to Loot NFTs on Ethereum but intended to be interoperable within the Solana network instead.

        Our first game available, DUNGEON, puts a fresh spin on the tired coin-flip games while keeping the appealing 50/50 odds of doubling your wager.

        
        <h2 className="mt-5" style={{fontSize: DEFAULT_FONT_SIZE}}>Is there a cost to play</h2><br />
        
        
        There is a 3% Dungeon Fee applied to Player winnings when exiting the dungeon alive. No fee is taken on losses.

        Coming Soon: The Dungeon Fee can be reduced by entering a Key Code from our Dungeon Key NFTs. A set of 10 Keys can also be burned for a Dungeon Master NFT.

        To find out more about our NFT collections please visit our Discord channel.
        
        <h2 className="mt-5" style={{fontSize: DEFAULT_FONT_SIZE}}>How does Dungeon work</h2><br />

        <ul>
            <li>Connect your Phantom Wallet. A dedicated burner wallet is recommended</li>
            <li>Select your Hero (Cosmetic only - No gameplay impact)</li>
            <li>Click "Enter Dungeon" and accept the wager transaction.   The first time you play this will create a data account to track your progress</li>
            <li>Wait for the Room to spawn a Peril and resolve it</li>
            <li>Exit the dungeon or Continue to the next Room (Double or Nothing)</li>
            <li>After earning 100XP, visit the Merchant to redeem a Whitelist Token to our Dungeon Key Mint (Coming Soon) </li>
            <li>If you need any further help please submit a support ticket in our Discord channel  </li>
        </ul>
        
        
        <h2 className="mt-5" style={{fontSize: DEFAULT_FONT_SIZE}}>Who are the team</h2><br />
        
        <i>Master Mason</i> is the sole creator of DUNGEONS & DEGENS. They are responsible for the art, design, and programming of the game.

        They are an active Solana NFT project founder but using a different alias for regulatory purposes.  You can find them hanging out on our discord channel!
        
        <h2 className="mt-5" style={{fontSize: DEFAULT_FONT_SIZE}}>Do you have a gambling license</h2><br />
        
        No. At this point in time DUNGEONS & DEGENS is not a licensed gambling operation, hence the need for the <i>Master Mason</i> alias.

        However, if the game does well enough to justify the costs, then a license will be obtained and the creator will doxx themselves.

        </div>
        </Box>
        </Center>
        </>
    );
}

export function HelpScreen()
{
    return(
        <>
        <Center>
        <Box width = "80%">
        <div className="font-face-sfpb" style={{color: "white", fontSize: DUNGEON_FONT_SIZE}}>
        <h2 className="mt-5" style={{fontSize: DEFAULT_FONT_SIZE}}>Help!</h2><br />

        If you have any questions that aren't covered in the FAQ, or find any technical issues with the site, please head over to our Discord channel and make a support ticket to let us know.

        </div>
        </Box>
        </Center>
        </>
    );
}

async function get_account_data({pubkey, schema, map, raw})
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

const uIntToBytes = (num, size, method) => {
    const arr = new ArrayBuffer(size)
    const view = new DataView(arr)
    view[method + (size * 8)](0, num)
    return arr
 }

let keyIntervalId;
let xpIntervalId;

let current_key = null;
let current_meta_key = null;
let current_n_keys = -1;
let check_xp = true;
export function ShopScreen()
{
    const wallet = useWallet();
    const [chest_state, setChestState] = useState(ChestStatus.closed);
    const [current_mint, setCurrentMint]  = useState(null);
    const [which_key, setWhichKey] = useState(null);
    const [key_description, setKeyDescription] = useState(null);
    const [key_image, setKeyImage] = useState(null);
    const [xp_req, setXPReq] = useState(null);
    //const [countdown_string, setCountDownString] = useState(null);
    const [countdown_value, setCountDown] = useState(null);


    const [numXP] = useContext(StateContext);



    const check_xp_reqs = useCallback(async() => 
    {
        var launch_date = new Date(Date.UTC(2021, 1, 9, 15, 0)).getTime();

        // just set the countdown here also
        var now = new Date().getTime();

        var distance = Math.max(0, launch_date - now);

        // Time calculations for days, hours, minutes and seconds
        //var days = Math.floor(distance / (1000 * 60 * 60 * 24));
        //var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        //var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        //var seconds = Math.floor((distance % (1000 * 60)) / 1000);

        //let countdown_string = days + "d " + hours + "h " + minutes + "m " + seconds + "s ";
        //setCountDownString(countdown_string);
        setCountDown(distance);

        if (!wallet.publicKey)
            return;

        if  (!check_xp)
            return;

        let program_data_key = (await PublicKey.findProgramAddress(["data_account"], SHOP_PROGRAM))[0];
        let dungeon_key_data_account = (await PublicKey.findProgramAddress([wallet.publicKey.toBuffer()], SHOP_PROGRAM))[0];


        let user_data = await get_account_data({pubkey: dungeon_key_data_account.toString(), schema: shop_user_data_schema, map: ShopUserData, raw: false});
        

        let user_keys_bought = 0;

        if (user_data !== null ) {
          
            user_keys_bought = user_data["num_keys"].toNumber();
        }

        if (user_keys_bought <= current_n_keys) {
            return;
        }

        current_n_keys = user_keys_bought
        check_xp = false;

        let shop_data = await get_account_data({pubkey: program_data_key.toString(), schema: shop_data_schema, map: ShopData, raw: false});

        // if the shop hasn't been set up yet just return
        if (shop_data === null)
            return;
        
        let total_keys_bought = shop_data["keys_bought"].toNumber();

        //console.log("total keys bought: ", total_keys_bought);
        //console.log("user keys bought: ", user_keys_bought);

        let n_levels = 10.0;
        let total_keys = 3000.0;
        let keys_per_level = total_keys / n_levels;
        let current_level = Math.floor(total_keys_bought / keys_per_level);


        let base_xp = 100;
        let xp_cap_per_key = 500;
        var base_xp_req = base_xp + current_level * 50;

        //console.log("xp calc: ", n_levels, keys_per_level, current_level, base_xp_req);

        if (base_xp_req > xp_cap_per_key) {
            base_xp_req = xp_cap_per_key;
        }

        var total_xp_req = base_xp_req;
        var next_key_req = base_xp_req + 50;
        if (next_key_req > xp_cap_per_key) {
            next_key_req = xp_cap_per_key;
        }

        for (let i = 0; i < user_keys_bought; i++) {
            total_xp_req += next_key_req;
            next_key_req += 50;

            if (next_key_req > xp_cap_per_key) {
                next_key_req = xp_cap_per_key;
            }
        }
        //console.log("total xp req ", total_xp_req);
        setXPReq(total_xp_req);

    }, [wallet]);

    const check_key = useCallback(async() =>
    {
        
        if (current_key  === null)
            return;

        try {

            let raw_meta_data = await get_account_data({pubkey: current_meta_key.toString(), schema: null, map: null, raw: true});

            if (raw_meta_data === null) {
                return;
            }

            let meta_data = Metadata.deserialize(raw_meta_data);

            let uri_json = await fetch(meta_data[0].data.uri).then(res => res.json());

            setWhichKey(uri_json["name"]);
            setKeyDescription(uri_json["description"]);
            setKeyImage(uri_json["image"]);
            setCurrentMint(meta_data[0].mint.toString());
            setChestState(ChestStatus.closed);

            current_key = null;
        
        } catch(error) {
            console.log(error);
            return;
        }
            

    }, []);

    useEffect(() => 
    {
        if (wallet.publicKey && !keyIntervalId) {
            keyIntervalId = setInterval(check_key, 1000);
        }
        else{
            clearInterval(keyIntervalId);
            keyIntervalId = null;
        }
    }, [check_key, wallet]);

    useEffect(() => 
    {
        if (wallet.publicKey && !xpIntervalId) {
            xpIntervalId = setInterval(check_xp_reqs, 1000);
        }
        else{
            clearInterval(xpIntervalId);
            xpIntervalId = null;
        }
    }, [check_xp_reqs, wallet]);


    useEffect(() => 
    {
        current_n_keys = -1;
        check_xp = true;
        
    }, [wallet]);

    useEffect(() => 
    {
        
    }, []);


    const DisplayChest = ({visibility}) => {

         if (chest_state === ChestStatus.closed) {
             return ( <img style={{"imageRendering":"pixelated", "visibility": visibility}} src={closed_chest} width="10000" alt={""}/> );
         }
         if (chest_state === ChestStatus.open) {
             return ( <img style={{"imageRendering":"pixelated", "visibility": visibility}} src={open_chest} width="10000" alt={""}/> );
         }        
     }



    const Mint = useCallback( async () => 
    {

            setWhichKey(null);
            setKeyDescription(null);
            setKeyImage(null);
       
            setChestState(ChestStatus.open);

            const nft_mint_keypair = Keypair.generate();
            var nft_mint_pubkey = nft_mint_keypair.publicKey;
            
            let program_data_key = (PublicKey.findProgramAddressSync(["data_account"], SHOP_PROGRAM))[0];
            let dungeon_key_data_account = (PublicKey.findProgramAddressSync([wallet.publicKey.toBuffer()], SHOP_PROGRAM))[0];
            let dungeon_key_meta_account = (PublicKey.findProgramAddressSync(["key_meta", nft_mint_pubkey.toBuffer()], SHOP_PROGRAM))[0];


            let nft_meta_key = (PublicKey.findProgramAddressSync([Buffer.from("metadata"),
            METAPLEX_META.toBuffer(), nft_mint_pubkey.toBuffer()], METAPLEX_META))[0];

            let nft_master_key = (PublicKey.findProgramAddressSync([Buffer.from("metadata"),
            METAPLEX_META.toBuffer(), nft_mint_pubkey.toBuffer(), Buffer.from("edition")], METAPLEX_META))[0];

            let nft_account_key = await getAssociatedTokenAddress(
                nft_mint_pubkey, // mint
                wallet.publicKey, // owner
                true // allow owner off curve
            );

            let whitelist_account_key = await getAssociatedTokenAddress(
                WHITELIST_TOKEN, // mint
                wallet.publicKey, // owner
                true // allow owner off curve
            );

            let player_data_key = (PublicKey.findProgramAddressSync([wallet.publicKey.toBytes()], PROGRAM_KEY))[0];

            const create_token_meta = new InstructionMeta({ instruction: ShopInstruction.create_token});
            const create_token_data = serialize(instruction_schema, create_token_meta);

            const init_meta = new InstructionMeta({ instruction: ShopInstruction.init});
            const init_data = serialize(instruction_schema, init_meta);

            var account_vector  = [
                {pubkey: wallet.publicKey, isSigner: true, isWritable: true},

                {pubkey: nft_mint_pubkey, isSigner: true, isWritable: true},
                {pubkey: nft_account_key, isSigner: false, isWritable: true},
                {pubkey: nft_meta_key, isSigner: false, isWritable: true},
                {pubkey: nft_master_key, isSigner: false, isWritable: true},

                {pubkey: player_data_key, isSigner: false, isWritable: true},
                {pubkey: dungeon_key_data_account, isSigner: false, isWritable: true},
                {pubkey: program_data_key, isSigner: false, isWritable: true},
                {pubkey: dungeon_key_meta_account, isSigner: false, isWritable: true}

            ];

            account_vector.push({pubkey: COLLECTION_MINT, isSigner: false, isWritable: true});
            account_vector.push({pubkey: COLLECTION_META, isSigner: false, isWritable: true});
            account_vector.push({pubkey: COLLECTION_MASTER, isSigner: false, isWritable: true});


            if (PROD) {
                account_vector.push({pubkey: PYTH_BTC_PROD, isSigner: false, isWritable: false});
                account_vector.push({pubkey: PYTH_ETH_PROD, isSigner: false, isWritable: false});
                account_vector.push({pubkey: PYTH_SOL_PROD, isSigner: false, isWritable: false});
            }
            else {
                account_vector.push({pubkey: PYTH_BTC_DEV, isSigner: false, isWritable: false});
                account_vector.push({pubkey: PYTH_ETH_DEV, isSigner: false, isWritable: false});
                account_vector.push({pubkey: PYTH_SOL_DEV, isSigner: false, isWritable: false});
            } 

            account_vector.push({pubkey: WHITELIST_TOKEN, isSigner: false, isWritable: true});
            account_vector.push({pubkey: whitelist_account_key, isSigner: false, isWritable: true});


            
            account_vector.push({pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false});
            account_vector.push({pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false});
            account_vector.push({pubkey: SYSTEM_KEY, isSigner: false, isWritable: true});
            account_vector.push({pubkey: METAPLEX_META, isSigner: false, isWritable: false});



            const create_token_instruction = new TransactionInstruction({
                keys: account_vector,
                programId: SHOP_PROGRAM,
                data: create_token_data
            });

            const init_instruction = new TransactionInstruction({
                keys: [
                    {pubkey: wallet.publicKey, isSigner: true, isWritable: true},
                    {pubkey: program_data_key, isSigner: false, isWritable: true},
                    {pubkey: SYSTEM_KEY, isSigner: false, isWritable: true}
                ],
                programId: SHOP_PROGRAM,
                data: init_data
            });

            const blockhash_url = `/.netlify/functions/solana?network=`+network_string+`&function_name=getLatestBlockhash&p1=`;
            const blockhash_data_result = await fetch(blockhash_url).then((res) => res.json());
            let blockhash = blockhash_data_result["result"]["value"]["blockhash"];
            let last_valid = blockhash_data_result["result"]["value"]["lastValidBlockHeight"];
            const txArgs = { blockhash: blockhash, lastValidBlockHeight: last_valid};

            let transaction = new Transaction(txArgs);
            transaction.feePayer = wallet.publicKey;


            transaction.add(create_token_instruction);
            transaction.add(init_instruction);

            transaction.partialSign(nft_mint_keypair);


            try {
                let signed_transaction = await wallet.signTransaction(transaction);
                const encoded_transaction = bs58.encode(signed_transaction.serialize());

                const send_url = `/.netlify/functions/solana?network=`+network_string+`&function_name=sendTransaction&p1=`+encoded_transaction+"&p2=config&p3=skippreflight";
                let transaction_response = await fetch(send_url).then((res) => res.json());

                let valid_response = check_json({json_response: transaction_response})

                if (!valid_response) {
                    console.log(transaction_response)
                    return;
                }

                console.log(transaction_response);
                let signature = transaction_response["result"];
                console.log("sig: ", signature);
     
            } catch(error) {
                console.log(error);
                return;
            }

            
            current_key = nft_mint_pubkey;
            current_meta_key = nft_meta_key;
            check_xp = true;
            
            return;
        

    },[wallet]);
/*
    const Burn = useCallback( async () => 
    {

            
            var nft_mint_pubkey = new PublicKey("AdWqAKwFusKTo2JavMNnUUVY7YoBHx9v58BPvRF3DNcW");
            
            let nft_meta_key = (await PublicKey.findProgramAddress([Buffer.from("metadata"),
            METAPLEX_META.toBuffer(), nft_mint_pubkey.toBuffer()], METAPLEX_META))[0];

            let nft_master_key = (await PublicKey.findProgramAddress([Buffer.from("metadata"),
            METAPLEX_META.toBuffer(), nft_mint_pubkey.toBuffer(), Buffer.from("edition")], METAPLEX_META))[0];

            let nft_account_key = await getAssociatedTokenAddress(
                nft_mint_pubkey, // mint
                wallet.publicKey, // owner
                true // allow owner off curve
            );

            const burn_token_meta = new InstructionMeta({ instruction: ShopInstruction.burn_token});
            const burn_token_data = serialize(instruction_schema, burn_token_meta);

            var account_vector  = [
                {pubkey: wallet.publicKey, isSigner: true, isWritable: true},

                {pubkey: nft_mint_pubkey, isSigner: false, isWritable: true},
                {pubkey: nft_account_key, isSigner: false, isWritable: true},
                {pubkey: nft_meta_key, isSigner: false, isWritable: true},
                {pubkey: nft_master_key, isSigner: false, isWritable: true},


            ];

            account_vector.push({pubkey: COLLECTION_META, isSigner: false, isWritable: true});            
            account_vector.push({pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false});
            account_vector.push({pubkey: SYSTEM_KEY, isSigner: false, isWritable: true});
            account_vector.push({pubkey: METAPLEX_META, isSigner: false, isWritable: false});



            const burn_token_instruction = new TransactionInstruction({
                keys: account_vector,
                programId: SHOP_PROGRAM,
                data: burn_token_data
            });

            const blockhash_url = `/.netlify/functions/solana?network=`+network_string+`&function_name=getLatestBlockhash&p1=`;
            const blockhash_data_result = await fetch(blockhash_url).then((res) => res.json());
            let blockhash = blockhash_data_result["result"]["value"]["blockhash"];
            let last_valid = blockhash_data_result["result"]["value"]["lastValidBlockHeight"];
            const txArgs = { blockhash: blockhash, lastValidBlockHeight: last_valid};

            let transaction = new Transaction(txArgs);
            transaction.feePayer = wallet.publicKey;


            transaction.add(burn_token_instruction);

            try {
                let signed_transaction = await wallet.signTransaction(transaction);
                const encoded_transaction = bs58.encode(signed_transaction.serialize());

                const send_url = `/.netlify/functions/solana?network=`+network_string+`&function_name=sendTransaction&p1=`+encoded_transaction;//+"&p2=config&p3=skippreflight";
                let transaction_response = await fetch(send_url).then((res) => res.json());

                let valid_response = check_json({json_response: transaction_response})

                if (!valid_response) {
                    console.log(transaction_response)
                    return;
                }

                console.log(transaction_response);
                let signature = transaction_response["result"];
                console.log("sig: ", signature);
     
            } catch(error) {
                console.log(error);
                return;
            }

            return;
        

    },[wallet]);
   */
    return(
        <>
        <Box width="100%">
                    <HStack>
                        <Box width="65%"></Box>  
                        <Box width="10%">
                            <div className="font-face-sfpb">
                                    
                                    <Text  fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">XP {numXP}</Text>
                                    
                            </div>
                        </Box>
                        <Box width="25%"></Box>  
                    </HStack>
                </Box>
        <Box width="100%">       
            <Center>
            
                <VStack alignItems="center" spacing="2%">

                

                <HStack>
                    <Box width="10%"></Box>         
                    <Box  style={{
                        backgroundImage: `url(${shop})`,
                        backgroundPosition: 'center',
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        imageRendering: "pixelated"

                    } } width="80%">
                        <HStack>
                
                            <Box width="35%"></Box> 
                            {countdown_value !== null && countdown_value === 0 &&           
                                <Box width="15%"> <DisplayChest visibility = {"visible"}/></Box>  
                            }
                            {(countdown_value === null || countdown_value > 0) &&           
                                <Box width="15%"> <DisplayChest visibility = {"hidden"}/></Box>  
                            }
                            <Box width="5%"></Box> 
                            <Box width="15%" pb = "10%"><DisplayChest visibility = {"hidden"}/> </Box>  
                            <Box width="30%"></Box> 

                        </HStack>
                    </Box>
                    <Box width="10%"></Box> 
                </HStack>

                {!wallet.publicKey &&
                <>
                    <div className="font-face-sfpb">
                        <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">Welcome Stranger!  Connect your wallet below so we can do business.</Text>
                    </div>

                    {!isMobile &&
                        <div className="font-face-sfpb">
                                    <WalletMultiButton  
                                    className="wallet-button"  
                                    >CONNECT WALLET</WalletMultiButton>
                        </div>
                    }
                     {isMobile &&
                        <div className="font-face-sfpb">
                                    <WalletMultiButton  
                                    className="mobile-wallet-button"  
                                    >CONNECT WALLET</WalletMultiButton>
                        </div>
                    }
                </>
                }

                {wallet.publicKey && 
                <>
                <Box width="80%" >
                    <div className="font-face-sfpb">
                        {countdown_value !== null && countdown_value === 0 &&
                        <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">Welcome Adventurer!  Unfortunately the shop isn't quite ready yet, but I do have this magnificent chest of keys.. Rummage around for something you like, i'm sure whatever you find will come in handy in your travels!</Text>
                        }
                        {countdown_value !== null && countdown_value > 0 &&
                        <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">Welcome Adventurer!  We are just getting ready for our grand opening, if you come back soon we'll have some rare things on sale!</Text>
                        }
                        {countdown_value === null &&
                        <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white" style={{"visibility": "visible"}}>Welcome Adventurer!  We are just getting ready for our grand opening, if you come back soon we'll have some rare things on sale!</Text>
                        }
                    </div>
                </Box>
                <HStack alignItems="center">
                    {countdown_value !== null && countdown_value === 0 &&
                    <>

                        <Box width="15%"> <img style={{"imageRendering":"pixelated"}} src={key} width="100" alt={""}/></Box>
                        <Button variant='link' size='lg' onClick={Mint}>
                            <div className="font-face-sfpb">
                                <Text fontSize={DEFAULT_FONT_SIZE} color="white"> Buy Key (1 SOL, {xp_req} XP required) </Text>      
                            </div> 
                        </Button>  
   
                    </>
                    }
                    {(countdown_value === null || countdown_value > 0) &&
                    <>
                    <Box width="15%"> <img style={{"imageRendering":"pixelated", "visibility": "hidden"}} src={key} width="100" alt={""}/></Box>
                    <Button variant='link' size='lg' onClick={Mint}>
                        <div className="font-face-sfpb">
                            <Text fontSize={DEFAULT_FONT_SIZE}  color="white" style={{"visibility": "hidden"}}> Buy Key (1 SOL, {xp_req} XP required) </Text>      
                        </div> 
                    </Button>              
                    </>
                    }
                </HStack>
                </>
                }

                {which_key !== null &&
                    <>
                    <VStack spacing="3%">
                    <HStack alignItems="center">
                        <Box width="15%">
                            <img style={{"imageRendering":"pixelated"}} src={key_image} width="100" alt={""}/>
                        </Box>
                                    
                            <div className="font-face-sfpb">
                                <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">You have found {which_key}! </Text>
                            </div>
                    </HStack>
                    <div className="font-face-sfpb">
                        <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">{key_description}  View it <a style={{textDecoration: "underline"}} href={"https://explorer.solana.com/address/"+current_mint+"?cluster=devnet"}>here</a></Text>
                    </div>
                    </VStack>
                    </>            
                }


                </VStack>
            </Center>
        </Box>
        </>
    );
}


let intervalId;
let randomsIntervalId;
var check_balance = true;
var initial_status_is_set = false;
var initial_num_plays = -1;
var last_num_plays = -1;
var last_sol_balance = -1;

var transaction_failed = false;
var global_randoms_address = null;
var check_for_data_updates = true;
var check_for_sol_updates = true;

var have_created_randoms_account = false;
export function DungeonApp() 
{
    const wallet = useWallet();

    // properties used to set what to display
    const [data_account_status, setDataAccountStatus] = useState(AccountStatus.unknown);
    const [initial_status, setInitialStatus] = useState(DungeonStatus.unknown);

    // these come from the blockchain
    const [sol_balance, setSolBalance] = useState(null);
    const [numPlays, setNumPlays] = useState(0);
    const [numXP, setNumXP] = useState(0);
    const [currentLevel, setCurrentLevel] = useState(0);
    const [currentStatus, setCurrentStatus] = useState(DungeonStatus.unknown);
    const [current_enemy, setCurrentEnemy] = useState(DungeonEnemy.None);
    const [current_signature, setCurrentSignature] = useState(null);

    // there are three bits of information to store about the randoms account
    // the key, whether the account has been created, and whether the randoms have been fulfilled
    //const [current_randoms_key, setCurrentRandomsKey] = useState(null);
    const [randoms_fulfilled, setRandomsFullfilled] = useState(false);

    // if we have a key then discounts can be applied
    const [existing_mint, setExistingMint] = React.useState("")
    const handleMintChange = (e) => setExistingMint(e.target.value)
    const [current_key_type, setCurrentKeyType] = useState(KeyType.Unknown);
    const [current_key_mint, setCurrentKeyMint] = useState(null);
    const [current_key_index, setCurrentKeyIndex] = useState(null);
    const [discount_error, setDiscountError] = useState(null);


    const [screen, setScreen] = useState(Screen.HOME_SCREEN);

    const [which_character, setWhichCharacter] = useState(DungeonCharacter.knight);
    const [enemy_state, setEnemyState] = useState(DungeonStatus.unknown);
    const [player_state, setPlayerState] = useState(DungeonStatus.unknown);
    const [animateLevel, setAnimateLevel] = useState(0);

    function MobileNavigation()  {
        const { isOpen, onOpen, onClose } = useDisclosure()
        //const btnRef = React.useRef()

        return (
            <Box width="100%" ml="1%" mt="1%" mb="1%" mr="1%">
              <HStack>
                {wallet.publicKey &&
                      <Box width="70%">
                          <HStack>
                              <WalletConnected />
                              {!isMobile &&
                                <div className="font-face-sfpb">
                                    <Text fontSize='16px'  color="white">
                                      {
                                          sol_balance
                                          ? "Balance: " + sol_balance + ' SOL'
                                          : '                                 '
                                      }
                                    </Text>
                                </div>
                                }
                          </HStack>
                      </Box>
                      
                  }
                  {!wallet.publicKey &&
                      <Box width="75%"></Box>
                  }
                  <Box width="25%">
                    <HStack spacing="10%">
                        <a href="https://twitter.com/sol_dungeon">
                            <FontAwesomeIcon color="white" icon={brands('twitter')} size="lg"/>
                        </a>

                        <a href="https://discord.gg/HeKJZZEaPn">
                            <FontAwesomeIcon color="white" icon={brands('discord')} size="lg"/>
                        </a>

                        <FontAwesomeIcon  color="white" icon={solid('bars')} size="lg" onClick={onOpen}/>

                        
                        <Drawer
                            isOpen={isOpen}
                            placement='right'
                            onClose={onClose}
                        >
                            <DrawerOverlay />
                            <DrawerContent>
                            <DrawerCloseButton color="white"/>

                            <DrawerBody bg='black'>
                                <VStack spacing='24px'>
                                    <Button variant='link' size='md' onClick={ShowHome}>
                                    <div className="font-face-sfpb">
                                        <Text fontSize='16px'  color="white"> Home </Text>      
                                    </div> 
                                    </Button>
                                    <Button variant='link' size='md' onClick={ShowShop}>
                                        <div className="font-face-sfpb">
                                            <Text fontSize='16px'  color="white"> Shop </Text>      
                                        </div> 
                                    </Button>
                                    <Button variant='link' size='md' onClick={ShowOdds}>
                                        <div className="font-face-sfpb">
                                            <Text fontSize='16px'  color="white"> Odds </Text>      
                                        </div> 
                                    </Button>
                                    <Button variant='link' size='md' onClick={ShowFAQ}>
                                        <div className="font-face-sfpb">
                                            <Text fontSize='16px'  color="white"> FAQ </Text>      
                                        </div> 
                                    </Button>
                                    
                                    <Button variant='link' size='md' onClick={ShowHelp}>
                                        <div className="font-face-sfpb">
                                            <Text fontSize='16px'  color="white"> Help </Text>      
                                        </div> 
                                    </Button>
                                </VStack>
                            </DrawerBody>

                            
                            </DrawerContent>
                        </Drawer>
                    </HStack>
                  </Box>
                  </HStack>
              </Box>
          );
    }

    function Navigation() {

        

        return (
          <Box width="100%" ml="1%" mt="1%" mb="1%" mr="1%">
            <HStack>
              {wallet.publicKey &&
                    <Box width="70%">
                        <HStack>
                            <WalletConnected />
                            <div className="font-face-sfpb">
                                <Text fontSize='16px'  color="white">
                                    {
                                        sol_balance
                                        ? "Balance: " + sol_balance + ' SOL'
                                        : '                                 '
                                    }
                                </Text>
                            </div>
                        </HStack>
                    </Box>
                    
                }
                {!wallet.publicKey &&
                    <Box width="70%"></Box>
                }
                <Box width="30%">
                    <HStack spacing="5%">
                        <Button variant='link' size='md' onClick={ShowHome}>
                            <div className="font-face-sfpb">
                                <Text fontSize='16px'  color="white"> Home </Text>      
                            </div> 
                        </Button>
                        <Button variant='link' size='md' onClick={ShowShop}>
                            <div className="font-face-sfpb">
                                <Text fontSize='16px'  color="white"> Shop </Text>      
                            </div> 
                        </Button>
                        <Button variant='link' size='md' onClick={ShowOdds}>
                            <div className="font-face-sfpb">
                                <Text fontSize='16px'  color="white"> Odds </Text>      
                            </div> 
                        </Button>
                        <Button variant='link' size='md' onClick={ShowFAQ}>
                            <div className="font-face-sfpb">
                                <Text fontSize='16px'  color="white"> FAQ </Text>      
                            </div> 
                        </Button>
                        
                        <Button variant='link' size='md' onClick={ShowHelp}>
                            <div className="font-face-sfpb">
                                <Text fontSize='16px'  color="white"> Help </Text>      
                            </div> 
                        </Button>
                        <a href="https://twitter.com/sol_dungeon">
                            <FontAwesomeIcon color="white" icon={brands('twitter')} size="lg"/>
                        </a>

                        <a href="https://discord.gg/HeKJZZEaPn">
                            <FontAwesomeIcon color="white" icon={brands('discord')} size="lg"/>
                        </a>
                    </HStack>
                </Box>
                </HStack>
            </Box>
        );
      }

    const check_signature = useCallback(async() =>
    {
        
            if (current_signature === null)
                return;

            //console.log("in check signature");
            const confirm_url = `/.netlify/functions/solana_sig_status?network=`+network_string+`&function_name=getSignatureStatuses&p1=`+current_signature;
            var signature_response = await fetch(confirm_url).then((res) => res.json());

            let valid_response = check_json({json_response: signature_response})
            if (!valid_response) {
                return;
            }

            let confirmation = signature_response["result"]["value"][0];
            
            //console.log(confirmation);
            if (confirmation !== null) {

                if (confirmation["err"] !== null) {
                    console.log("error: ", confirmation["err"]);
                    transaction_failed = true;
                }
                else {
                    transaction_failed = false;
                    
                }

                setCurrentSignature(null)
            }

    }, [current_signature]);

    useEffect(() => 
    {
        if (current_signature === null)
            return;

        //console.log("in use effect of check signature");
        check_signature();

        if (current_signature === null)
            return;
        
        const timer = setTimeout(() => {
            check_signature();
            }, 1000);
            return () => clearTimeout(timer);

    }, [current_signature, check_signature]);

    const check_randoms = useCallback(async() =>
    {

            if (global_randoms_address === null) {
                //console.log("in check randoms: null")

                return
            }

            //console.log("in check randoms: ", global_randoms_address.toString())

            //console.log("check account created")
            if (!have_created_randoms_account) {
            
                // first check if the data account exists
                try {

                    const balance_url = `/.netlify/functions/solana?network=`+network_string+`&function_name=getBalance&p1=`+global_randoms_address.toString();
                    var balance_result;
                    try {
                        balance_result = await fetch(balance_url).then((res) => res.json());
                    }
                    catch(error) {
                        console.log(error);
                        return;
                    }

                    let valid_response = check_json({json_response: balance_result})
                    if (!valid_response) {
                        return;
                    }

                    if (balance_result["result"]["value"] == null)
                        return;
                    
                    let balance = balance_result["result"]["value"];
                    if (balance > 0) {
                        have_created_randoms_account = true;
                    }
                    else {
                        have_created_randoms_account = false;
                        return;
                    }
                }
                catch(error) {
                    console.log(error);
                    return;
                }
            }

            const randoms_account_info_url = `/.netlify/functions/solana?network=`+network_string+`&function_name=getAccountInfo&p1=`+global_randoms_address.toString()+`&p2=config&p3=base64&p4=commitment`;

            var randoms_account_info_result;
            try {
                randoms_account_info_result = await fetch(randoms_account_info_url).then((res) => res.json());
            }
            catch(error) {
                console.log(error);
                return;
            }

            let valid_response = check_json({json_response: randoms_account_info_result})
            if (!valid_response) {
                return;
            }

            if (randoms_account_info_result["result"]["value"]["data"]  === null) {
                return;
            }

            let randoms_account_encoded_data = randoms_account_info_result["result"]["value"]["data"];
            let randoms_account_data = Buffer.from(randoms_account_encoded_data[0], "base64");

            // data structure of randomness:
            // 8 bytes anchor stuff
            // 32 bytes seed
            // 64 bytes randomness
            // vector of responses, each 32 (key) + 64 (randomness) = 96 bytes
            let randoms = randoms_account_data.slice(8 + 32, 8 + 32 + 64)
            //console.log(randoms_account_data);
            //console.log(randoms);
    
            if (Buffer.alloc(64).equals(randoms)) {
                //console.log("randoms still zero");
                return;
            }

            //console.log("randoms ha ve been fulfilled");
            setRandomsFullfilled(true);
            global_randoms_address = null;
            

    }, []);

    
    useEffect(() => 
    {
        //console.log("in randoms use effect", randomsIntervalId);

        if (wallet.publicKey && !randomsIntervalId) {
            randomsIntervalId = setInterval(check_randoms, 1000);
        }
        else{
            clearInterval(randomsIntervalId);
            randomsIntervalId = null;
        }
        

    }, [wallet, check_randoms]);
    
    const init = useCallback(async () => 
    {     
        if (DEBUG) {
            console.log("in in it check_updates ", check_for_data_updates, " check balance: ", check_balance, "check sol", check_for_sol_updates);
        }

        if (!wallet.publicKey) {
            return;
        }

        if (!check_for_data_updates && !check_for_sol_updates && !check_balance)
            return;

        if (check_for_sol_updates) {

            
            const account_info_url = `/.netlify/functions/solana?network=`+network_string+`&function_name=getAccountInfo&p1=`+wallet.publicKey.toString()+"&p2=config&p3=base64&p4=commitment";

            var account_info_result;
            try {
                account_info_result = await fetch(account_info_url).then((res) => res.json());
            }
            catch(error) {
                console.log(error);
                return;
            }
            let valid_response = check_json({json_response: account_info_result})
            if (!valid_response) {
                console.log(account_info_result);
                return;
            }

            if (account_info_result["result"]["value"] == null || account_info_result["result"]["value"]["lamports"] == null) {
                console.log("Error getting lamports for ", wallet.publicKey.toString());
                return;
            }

            let lamports_amount = account_info_result["result"]["value"]["lamports"];

            if (lamports_amount !== last_sol_balance) {
                last_sol_balance = lamports_amount;
                check_for_sol_updates = false;
            }

            setSolBalance((lamports_amount  / LAMPORTS_PER_SOL).toFixed(3));
        }

        let player_data_key = (await PublicKey.findProgramAddress([wallet.publicKey.toBytes()], PROGRAM_KEY))[0];

        if (check_balance) {
            
            // first check if the data account exists
            try {

                const balance_url = `/.netlify/functions/solana?network=`+network_string+`&function_name=getBalance&p1=`+player_data_key.toString()+"&p2=config&p3=base64&p4=commitment";
                var balance_result;
                try {
                    balance_result = await fetch(balance_url).then((res) => res.json());
                }
                catch(error) {
                    console.log(error);
                    return;
                }

                let valid_response = check_json({json_response: balance_result})
                if (!valid_response) {
                    return;
                }

                if (balance_result["result"]["value"] == null) {
                    return;
                }
                
                let balance = balance_result["result"]["value"];
                if (balance > 0) {
                    setDataAccountStatus(AccountStatus.created);
                    check_balance = false;
                }
                else {
                    setDataAccountStatus(AccountStatus.not_created);
                    return;
                }
            }
            catch(error) {
                console.log(error);
                return;
            }
        }
        

        if (!check_for_data_updates)
            return;

        try {

            const player_data = await get_account_data({pubkey: player_data_key.toString(), schema: player_data_schema, map: PlayerData, raw: false})

            if (player_data === null) {
                return;
            }

            //console.log(player_data);

            //console.log("bet size: ", player_data["current_bet_size"].toNumber());
            let current_status = player_data["player_status"] + 1;
            if (!initial_status_is_set) {

                if (current_status === DungeonStatus.alive){
                    setInitialStatus(DungeonStatus.alive);
                }

                if (current_status === DungeonStatus.dead){
                    setInitialStatus(DungeonStatus.dead);
                }

                if (current_status === DungeonStatus.exploring){
                    setInitialStatus(DungeonStatus.exploring);
                }

                initial_status_is_set = true;
                
            }

            let num_plays = player_data["num_plays"].toNumber();



            if (num_plays <= last_num_plays) {
                if (DEBUG) {
                    console.log("num plays not increased", num_plays);
                }
                return;
            }

            last_num_plays = num_plays;

            setNumPlays(num_plays);

            if (DEBUG) {
                console.log("in init, progress: ", player_data["in_progress"], "enemy", player_data["dungeon_enemy"], "alive", DungeonStatusString[player_data["player_status"] + 1], "num_plays", num_plays, "num_wins", player_data["num_wins"].toNumber());
            }

            if (initial_num_plays ===  -1)
            {
                initial_num_plays =  num_plays;
            }
            if (num_plays === 0)  {
                return;
            }  

            const randoms_key = null;

            //console.log(randoms_key.toString());


            setCurrentEnemy(player_data["dungeon_enemy"]);
            
            setCurrentLevel(player_data["in_progress"]);

            setCurrentStatus(current_status);

            setNumXP(player_data["num_wins"].toNumber());

            // only update the randoms key here if we are exploring
            if (current_status === DungeonStatus.exploring) {
                //console.log("set current randoms key", randoms_key)
                //setCurrentRandomsKey(randoms_key);
                global_randoms_address = randoms_key;
            }

            check_for_data_updates = false;

            
        } catch(error) {
            console.log(error);
            setCurrentLevel(0);
            setCurrentStatus(DungeonStatus.unknown);
            setCurrentEnemy(DungeonEnemy.None);
        }
        

    }, [wallet]);

    useEffect(() => 
    {
        if (wallet.publicKey && !intervalId) {
            intervalId = setInterval(init, 1000);
        }
        else{
            clearInterval(intervalId);
            intervalId = null;
        }
    }, [init, wallet]);

    // reset things when the wallet changes
    useEffect(() => 
    {
        if (DEBUG) {
            console.log("wallet things changed")
        }

        check_balance = true;
        initial_status_is_set = false;
        initial_num_plays = -1;
        last_num_plays = -1;
        last_sol_balance = -1;
        transaction_failed = false;
        setSolBalance(null);
        setScreen(Screen.HOME_SCREEN);
        setCurrentLevel(0);
        setNumPlays(0);
        setNumXP(0);
        setDataAccountStatus(AccountStatus.unknown);
        setInitialStatus(DungeonStatus.unknown);
        setCurrentStatus(DungeonStatus.unknown);
        setPlayerState(DungeonStatus.unknown);
        setCurrentEnemy(DungeonEnemy.None);
        setEnemyState(DungeonStatus.unknown);
        check_for_data_updates = true;
        check_for_sol_updates = true;
    }, [wallet]);


    
    useEffect(() => 
        {
            if (DEBUG) {
                console.log("in use effect, progress: ", currentLevel, "enemy", current_enemy, "currentStatus", DungeonStatusString[currentStatus], "num_plays", numPlays, "init num plays", initial_num_plays);
            }
      
            if (currentLevel === 0)
                return;

            //console.log(currentStatus === DungeonStatus.alive , currentStatus === DungeonStatus.exploring)
            if (currentStatus === DungeonStatus.alive || currentStatus === DungeonStatus.exploring) {
                //console.log("set dungeon screen")
                setScreen(Screen.DUNGEON_SCREEN);
            }

            // if we are exploring we shouldn't display the enemy
            if (currentStatus === DungeonStatus.exploring) {
                setPlayerState(DungeonStatus.exploring);
                return;
            }

            // if we aren't alive and numplays is still initial num plays we shouldn't display the enemy
            if (numPlays > 1 && numPlays === initial_num_plays && data_account_status === AccountStatus.created && currentStatus !== DungeonStatus.alive)
                return;

            if (DEBUG) {
                console.log("display enemy")
            }
            // display the current enemy
            setEnemyState(DungeonStatus.alive);
            setPlayerState(DungeonStatus.alive);
            if (currentStatus === DungeonStatus.alive) {
                setAnimateLevel(1);
            }
            else {
                setAnimateLevel(2);
            }

        }, [numPlays, currentLevel, current_enemy, currentStatus, data_account_status]);

    useEffect(() => 
    {
            if (animateLevel === 0) {
                return;
            }
            //console.log('This will run after 5 seconds!');
            const timer = setTimeout(() => {
                //console.log('5 seconds has passed!');

                // player killed enemy
                if (animateLevel === 1) {
                    if (DEBUG) {
                        console.log("player killed enemy");
                    }
                    setPlayerState(DungeonStatus.alive);
                    setEnemyState(DungeonStatus.dead);
                }
                // enemy killed player
                else {
                    if (DEBUG) {
                        console.log("enemy killed player")
                    }
                    setPlayerState(DungeonStatus.dead);
                    setEnemyState(DungeonStatus.alive);
                }

                setAnimateLevel(0);
                }, 5000);
                return () => clearTimeout(timer);
        

    }, [animateLevel]);

    useEffect(() => 
    {
        if (DEBUG) {
            console.log("In initial use effect");
        }

        setInitialStatus(DungeonStatus.unknown);
        setPlayerState(DungeonStatus.unknown);
        setEnemyState(DungeonStatus.unknown);
        


    }, []);




    const Play = useCallback( async () => 
    {

            if (DEBUG) {
                console.log("In play");
            }
            let program_data_key = (await PublicKey.findProgramAddress(["main_data_account"], PROGRAM_KEY))[0];
            let player_data_key = (await PublicKey.findProgramAddress([wallet.publicKey.toBytes()], PROGRAM_KEY))[0];

            


            const play_meta = new PlayMeta({ instruction: DungeonInstruction.play, character: which_character});
            const instruction_data = serialize(play_scheme, play_meta);

            var account_vector  = [
                {pubkey: wallet.publicKey, isSigner: true, isWritable: true},
                {pubkey: player_data_key, isSigner: false, isWritable: true}
            ];

            if (PROD) {
                account_vector.push({pubkey: PYTH_BTC_PROD, isSigner: false, isWritable: false});
                account_vector.push({pubkey: PYTH_ETH_PROD, isSigner: false, isWritable: false});
                account_vector.push({pubkey: PYTH_SOL_PROD, isSigner: false, isWritable: false});
            }
            else {
                account_vector.push({pubkey: PYTH_BTC_DEV, isSigner: false, isWritable: false});
                account_vector.push({pubkey: PYTH_ETH_DEV, isSigner: false, isWritable: false});
                account_vector.push({pubkey: PYTH_SOL_DEV, isSigner: false, isWritable: false});
            } 

            account_vector.push({pubkey: program_data_key, isSigner: false, isWritable: true});
            account_vector.push({pubkey: SYSTEM_KEY, isSigner: false, isWritable: false});

            if (current_key_mint) {

                console.log("mint ", current_key_mint);
                let key_mint_account = new PublicKey(current_key_mint);
                let dungeon_key_meta_account = (PublicKey.findProgramAddressSync(["key_meta", key_mint_account.toBuffer()], SHOP_PROGRAM))[0];

                let index_array_buffer = uIntToBytes(current_key_index, 2, "setUint");
                let index_buffer = new Buffer.from(index_array_buffer);
                let dungeon_key_lookup_account = (PublicKey.findProgramAddressSync([Buffer.from("key_meta"), index_buffer.reverse()], PROGRAM_KEY))[0];

                let key_token_account = await getAssociatedTokenAddress(
                    key_mint_account, // mint
                    wallet.publicKey, // owner
                    true // allow owner off curve
                );

                console.log("key token account", key_token_account.toString());
                console.log("key lookup ", dungeon_key_lookup_account.toString(), Buffer.from("key_meta"), index_buffer);

                let dungeon_key_metaplex_account = (PublicKey.findProgramAddressSync([Buffer.from("metadata"),
                 METAPLEX_META.toBuffer(), key_mint_account.toBuffer()], METAPLEX_META))[0];


                
                // accounts for discount key
                account_vector.push({pubkey: key_mint_account, isSigner: false, isWritable: false});
                account_vector.push({pubkey: key_token_account, isSigner: false, isWritable: false});
                account_vector.push({pubkey: dungeon_key_meta_account, isSigner: false, isWritable: false});
                account_vector.push({pubkey: dungeon_key_metaplex_account, isSigner: false, isWritable: false});
                account_vector.push({pubkey: dungeon_key_lookup_account, isSigner: false, isWritable: true});

            }


            const play_instruction = new TransactionInstruction({
                keys: account_vector,
                programId: PROGRAM_KEY,
                data: instruction_data
            });

            const blockhash_url = `/.netlify/functions/solana?network=`+network_string+`&function_name=getLatestBlockhash&p1=`;
            const blockhash_data_result = await fetch(blockhash_url).then((res) => res.json());
            let blockhash = blockhash_data_result["result"]["value"]["blockhash"];
            let last_valid = blockhash_data_result["result"]["value"]["lastValidBlockHeight"];
            const txArgs = { blockhash: blockhash, lastValidBlockHeight: last_valid};

            let transaction = new Transaction(txArgs);
            transaction.feePayer = wallet.publicKey;


            transaction.add(play_instruction);

            try {
                let signed_transaction = await wallet.signTransaction(transaction);
                const encoded_transaction = bs58.encode(signed_transaction.serialize());

                const send_url = `/.netlify/functions/solana?network=`+network_string+`&function_name=sendTransaction&p1=`+encoded_transaction+"&p2=config&p3=skippreflight";
                var transaction_response = await fetch(send_url).then((res) => res.json());

                let valid_response = check_json({json_response: transaction_response})
                if (!valid_response) {
                    console.log(transaction_response)
                    return;
                }

                let signature = transaction_response["result"];

                if (DEBUG) {
                    console.log("play signature: ", signature);
                }

                setCurrentSignature(signature);

            } catch(error) {
                console.log(error);
                return;
            }

            if (DEBUG) {
                console.log("In Play - setting state");
            }
            setScreen(Screen.DUNGEON_SCREEN);
            setEnemyState(DungeonStatus.unknown);
            setPlayerState(DungeonStatus.alive);
            check_for_data_updates = true;
            check_for_sol_updates = true;


    },[wallet, which_character, current_key_index, current_key_mint]);

    const Explore = useCallback( async () => 
    {

            let program_data_key = (await PublicKey.findProgramAddress(["main_data_account"], PROGRAM_KEY))[0];
            let player_data_key = (await PublicKey.findProgramAddress([wallet.publicKey.toBytes()], PROGRAM_KEY))[0];

            let networkStateAddress = (await PublicKey.findProgramAddress([ORAO_CONFIG_ACCOUNT_SEED], ORAO_KEY))[0];

            const network_account_info_url = `/.netlify/functions/solana?network=`+network_string+`&function_name=getAccountInfo&p1=`+networkStateAddress.toString()+`&p2=config&p3=base64&p4=commitment`;

            var network_account_info_result;
            try {
                network_account_info_result = await fetch(network_account_info_url).then((res) => res.json());
            }
            catch(error) {
                console.log(error);
                return;
            }

            let valid_response = check_json({json_response: network_account_info_result})
            if (!valid_response) {
                return;
            }

            if (network_account_info_result["result"]["value"] == null || network_account_info_result["result"]["value"]["data"] == null ) {
                return;
            }

            let network_account_encoded_data = network_account_info_result["result"]["value"]["data"];
            let network_account_data = Buffer.from(network_account_encoded_data[0], "base64");

            //console.log(network_account_data)
            const treasuryAddress = new PublicKey(deserialize(pubkey_scheme, my_pubkey, network_account_data.slice(8+32, 8+32 + 32)).value);

            //console.log(treasuryAddress.toString())
            const seed = randomBytes(32)

            let randomAddress = (await PublicKey.findProgramAddress([ORAO_RANDOMNESS_ACCOUNT_SEED, seed], ORAO_KEY))[0];

            const explore_meta = new ExploreMeta({ instruction: DungeonInstruction.explore, seed : seed, character: which_character});
            const instruction_data = serialize(explore_scheme, explore_meta);

            //console.log("orao ", ORAO_KEY.toString())
            //console.log("network ", networkStateAddress.toString())
            //console.log("seed: ", seed);
            //console.log("random ", randomAddress.toString())


            const play_instruction = new TransactionInstruction({
                keys: [
                    {pubkey: wallet.publicKey, isSigner: true, isWritable: true},
                    {pubkey: player_data_key, isSigner: false, isWritable: true},
                    {pubkey: program_data_key, isSigner: false, isWritable: true},

                    {pubkey: networkStateAddress, isSigner: false, isWritable: true},
                    {pubkey: treasuryAddress, isSigner: false, isWritable: true},
                    {pubkey: randomAddress, isSigner: false, isWritable: true},

                    {pubkey: ORAO_KEY, isSigner: false, isWritable: false},
                    {pubkey: SYSTEM_KEY, isSigner: false, isWritable: false}

                ],
                programId: PROGRAM_KEY,
                data: instruction_data
            });

            const blockhash_url = `/.netlify/functions/solana?network=`+network_string+`&function_name=getLatestBlockhash&p1=`;
            const blockhash_data_result = await fetch(blockhash_url).then((res) => res.json());
            let blockhash = blockhash_data_result["result"]["value"]["blockhash"];
            let last_valid = blockhash_data_result["result"]["value"]["lastValidBlockHeight"];
            const txArgs = { blockhash: blockhash, lastValidBlockHeight: last_valid};

            let transaction = new Transaction(txArgs);
            transaction.feePayer = wallet.publicKey;


            transaction.add(play_instruction);

            try {
                let signed_transaction = await wallet.signTransaction(transaction);
                const encoded_transaction = bs58.encode(signed_transaction.serialize());

                const send_url = `/.netlify/functions/solana?network=`+network_string+`&function_name=sendTransaction&p1=`+encoded_transaction+"&p2=config&p3=skippreflight";
                var transaction_response = await fetch(send_url).then((res) => res.json());

                let valid_response = check_json({json_response: network_account_info_result})
                if (!valid_response) {
                    console.log(transaction_response)
                    return;
                }
                let signature = transaction_response["result"];

                setCurrentSignature(signature);

            } catch(error) {
                console.log(error);
                return;
            }

            if (DEBUG) {
                console.log("in explore: setting state");
            }
            setScreen(Screen.DUNGEON_SCREEN);
            setEnemyState(DungeonStatus.unknown);
            setPlayerState(DungeonStatus.exploring);
            setCurrentStatus(DungeonStatus.exploring);

            global_randoms_address  = null;
            //setCurrentRandomsKey(null);
            setRandomsFullfilled(false);
            check_for_data_updates = true;
            check_for_sol_updates = true;

    },[wallet, which_character]);  


    const Quit = useCallback( async () => 
    {

            let program_data_key = (await PublicKey.findProgramAddress(["main_data_account"], PROGRAM_KEY))[0];
            let player_data_key = (await PublicKey.findProgramAddress([wallet.publicKey.toBytes()], PROGRAM_KEY))[0];

            

            const instruction_meta = new InstructionMeta({ instruction: DungeonInstruction.quit});
            const instruction_data = serialize(instruction_schema, instruction_meta);

            var account_vector  = [
                {pubkey: wallet.publicKey, isSigner: true, isWritable: true},
                {pubkey: player_data_key, isSigner: false, isWritable: true},
                {pubkey: program_data_key, isSigner: false, isWritable: true},

                {pubkey: DAOPLAYS_KEY, isSigner: false, isWritable: true},
                {pubkey: KAYAK_KEY, isSigner: false, isWritable: true},

                {pubkey: SYSTEM_KEY, isSigner: false, isWritable: false}
            ];

            const quit_instruction = new TransactionInstruction({
                keys: account_vector,
                programId: PROGRAM_KEY,
                data: instruction_data
            });

            const blockhash_url = `/.netlify/functions/solana?network=`+network_string+`&function_name=getLatestBlockhash&p1=`;
            const blockhash_data_result = await fetch(blockhash_url).then((res) => res.json());
            let blockhash = blockhash_data_result["result"]["value"]["blockhash"];
            let last_valid = blockhash_data_result["result"]["value"]["lastValidBlockHeight"];
            const txArgs = { blockhash: blockhash, lastValidBlockHeight: last_valid};

            let transaction = new Transaction(txArgs);
            transaction.feePayer = wallet.publicKey;


            transaction.add(quit_instruction);

            try {
                let signed_transaction = await wallet.signTransaction(transaction);
                const encoded_transaction = bs58.encode(signed_transaction.serialize());

                const send_url = `/.netlify/functions/solana?network=`+network_string+`&function_name=sendTransaction&p1=`+encoded_transaction;
                let transaction_response = await fetch(send_url).then((res) => res.json());

                let valid_response = check_json({json_response: transaction_response})

                if (!valid_response) {
                    console.log(transaction_response)
                    return;
                }

                let signature = transaction_response["result"];

                setCurrentSignature(signature);

            } catch(error) {
                console.log(error);
                return;
            }

            if (DEBUG) {
                console.log("In quit, setting state");
            }

            setScreen(Screen.HOME_SCREEN);
            setEnemyState(DungeonStatus.unknown);
            check_for_data_updates = true;
            check_for_sol_updates = true;
            return;
        

    },[wallet]);

    const ApplyKey = useCallback( async () => 
    {

        setDiscountError(null);
        if (existing_mint === "")
            return;

        var key_type;
        var key_mint;
        var key_index;

        console.log("length", existing_mint.length);
        // if the string is more than 4 digits this should be a mint address
        if (existing_mint.length > 4) {

            try {
                key_mint = new PublicKey(existing_mint);
            }
            catch{
                setDiscountError("Invalid public key");
                return;
            }

            let dungeon_key_meta_account = (PublicKey.findProgramAddressSync(["key_meta", key_mint.toBuffer()], SHOP_PROGRAM))[0];

            const key_meta_data = await get_account_data({pubkey: dungeon_key_meta_account.toString(), schema : key_meta_data_schema, map  : KeyMetaData, raw : false})

            if (key_meta_data === null) {                
                setDiscountError("Key account not found. Please check mint address is valid");
                return;
            }

            console.log("meta from mint", key_meta_data);

            key_type = key_meta_data["key_type"];
            key_index = key_meta_data["key_index"];

        }
        // otherwise it should be an integer
        else {

            key_index = parseInt(existing_mint);
            let index_array_buffer = uIntToBytes(key_index, 2, "setUint");
            let index_buffer = new Buffer.from(index_array_buffer);
            let dungeon_key_lookup_account = (PublicKey.findProgramAddressSync([Buffer.from("key_meta"), index_buffer.reverse()], PROGRAM_KEY))[0];

            console.log(Buffer.from("key_meta"), index_buffer.reverse());
            console.log("key from int: ", dungeon_key_lookup_account.toString());
            const key_meta_data = await get_account_data({pubkey: dungeon_key_lookup_account.toString(), schema : key_meta_data2_schema, map  : KeyMetaData2, raw : false})

            // if we have been passed a number check the lookup account exists
            if (key_meta_data === null) {
                setDiscountError("Key account not found. Please pass key mint on first use");
                return;
            }

            key_mint = new PublicKey(key_meta_data["key_mint"]);

            console.log("meta from index", key_meta_data, key_mint.toString());

            key_type = key_meta_data["key_type"];

        }

        // before we go on lets check they actually own the nft
        let key_token_account = await getAssociatedTokenAddress(
            key_mint, // mint
            wallet.publicKey, // owner
            true // allow owner off curve
        );

        const token_balance_url = `/.netlify/functions/solana?network=`+network_string+`&function_name=getTokenAccountBalance&p1=`+key_token_account.toString()+`&p2=config&p3=base64&p4=commitment`;

        var token_balance_result;
        try {
            token_balance_result = await fetch(token_balance_url).then((res) => res.json());
        }
        catch {
            setDiscountError("Error retrieving nft account data");
            return;
        }

        let valid_response = check_json({json_response: token_balance_result})
        if (!valid_response || token_balance_result["result"]["value"] === null) {
            setDiscountError("Error retrieving nft account data.  Please try again.");
            return;
        }

        let token_balance = parseInt(token_balance_result["result"]["value"]["amount"]);
        console.log("token_balance", token_balance);

        if (token_balance !== 1) {
            setDiscountError("User does not own dungeon key " + key_index.toString());
            return;
        }


        setCurrentKeyType(key_type);
        setCurrentKeyMint(key_mint.toString());
        setCurrentKeyIndex(key_index);

    },[wallet, existing_mint]);

    const Reset = useCallback( async () => 
    {
            if (DEBUG) {
                console.log("In reset - setting state");
            }
            setScreen(Screen.HOME_SCREEN);
            setEnemyState(DungeonStatus.unknown);
            return;
        
    },[]);

    const ShowDeath = useCallback( async () => 
    {
            if (DEBUG) {
                console.log("In show death - setting state");
            }
            setScreen(Screen.DEATH_SCREEN);
            setEnemyState(DungeonStatus.unknown);
            return;
        
    },[]);

    const ShowFAQ = useCallback( async () => 
    {
            setScreen(Screen.FAQ_SCREEN);
            return;
        
    },[]);

    const ShowOdds = useCallback( async () => 
    {
            setScreen(Screen.ODDS_SCREEN);
            return;
        
    },[]);

    const ShowHelp = useCallback( async () => 
    {
            setScreen(Screen.HELP_SCREEN);
            return;
        
    },[]);

    const ShowHome = useCallback( async () => 
    {
            clearInterval(xpIntervalId);
            xpIntervalId = null;
            setScreen(Screen.HOME_SCREEN);
            return;
        
    },[]);

    const ShowShop = useCallback( async () => 
    {
            clearInterval(xpIntervalId);
            xpIntervalId = null;
            setScreen(Screen.SHOP_SCREEN);
            return;
        
    },[]);

    const LargeDoor = () => {
        return (
            <>
            
            <img style={{"imageRendering":"pixelated"}} src={large_door} width={500} alt={"generic"}/>
            
            </>
        )
    }

    const Title = () =>  {

        return (
            <Box bg='black'>
                <img style={{"imageRendering":"pixelated"}} src={dungeon_title} width="500" alt={""}/>
            </Box>
        )
    }

    const [SelectKnight] = useSound(click_sound, {
        onplay: () => setWhichCharacter(DungeonCharacter.knight)
    });

    const [SelectRanger] = useSound(click_sound, {
        onplay: () => setWhichCharacter(DungeonCharacter.ranger)
    });

    const [SelectWizard] = useSound(click_sound, {
        onplay: () => setWhichCharacter(DungeonCharacter.wizard)
    });

     const HiddenCharacterSelect = () => {

        return (
            <HStack>
                    
                    <Box  width="100%">
                        <Box>
                            <Button variant='link' size='md'>
                                <img style={{"imageRendering":"pixelated", "visibility": "hidden"}} src={knight} width="10000" alt={""}/>
                            </Button>
                        </Box>
                    </Box>
                
                
                
                    <Box  width="100%">
                        <Box>
                            <Button variant='link' size='md'>
                                <img style={{"imageRendering":"pixelated", "visibility": "hidden"}} src={ranger} width="10000" alt={""}/>
                            </Button>
                        </Box>
                    </Box>
                
                
                    <Box  width="100%">
                        <Box>
                            <Button variant='link' size='md'>
                                <img style={{"imageRendering":"pixelated", "visibility": "hidden"}} src={wizard} width="10000" alt={""}/>
                            </Button>
                        </Box>
                    </Box>
                
            </HStack>
        );  
    }

    const CharacterSelect = () => {

        //console.log("in characterSelect, progress: ", currentLevel, "enemy", current_enemy, "alive", currentStatus === 0, "num_plays", numPlays,initial_num_plays, "dataaccount:", data_account_status, "initial status", initial_status, initial_status === DungeonStatus.unknown);
            return (
                
                <HStack>
                    {which_character === DungeonCharacter.knight &&
                        <Box  style={{
                            backgroundImage: `url(${selector})`,
                            backgroundPosition: 'center',
                            backgroundSize: 'contain',
                            backgroundRepeat: 'no-repeat',
                            imageRendering: "pixelated"

                        } } width="100%">
                            <Box>
                                <Button variant='link' size='md'  onClick={SelectKnight}>
                                    <img style={{"imageRendering":"pixelated"}} src={knight} width="10000" alt={""}/>
                                </Button>
                            </Box>
                        </Box>
                    }
                    {which_character !== DungeonCharacter.knight &&
                        <Box  width="100%">
                            <Box>
                                <Button variant='link' size='md' onClick={SelectKnight}>
                                    <img style={{"imageRendering":"pixelated"}} src={knight} width="10000" alt={""}/>
                                </Button>
                            </Box>
                        </Box>
                    }
                    
                    {which_character === DungeonCharacter.ranger &&
                        <Box  style={{
                            backgroundImage: `url(${selector})`,
                            backgroundPosition: 'center',
                            backgroundSize: 'contain',
                            backgroundRepeat: 'no-repeat',
                            imageRendering: "pixelated"

                        } } width="100%">
                            <Box>
                                <Button variant='link' size='md' onClick={SelectRanger}>
                                    <img style={{"imageRendering":"pixelated"}} src={ranger} width="10000" alt={""}/>
                                </Button>
                            </Box>
                        </Box>
                    }
                    {which_character !== DungeonCharacter.ranger &&
                        <Box  width="100%">
                            <Box>
                                <Button variant='link' size='md' onClick={SelectRanger}>
                                    <img style={{"imageRendering":"pixelated"}} src={ranger} width="10000" alt={""}/>
                                </Button>
                            </Box>
                        </Box>
                    }
                    {which_character === DungeonCharacter.wizard &&
                        <Box  style={{
                            backgroundImage: `url(${selector})`,
                            backgroundPosition: 'center',
                            backgroundSize: 'contain',
                            backgroundRepeat: 'no-repeat',
                            imageRendering: "pixelated"

                        } } width="100%">
                            <Box>
                                <Button variant='link' size='md' onClick={SelectWizard}>
                                    <img style={{"imageRendering":"pixelated"}} src={wizard} width="10000" alt={""}/>
                                </Button>
                            </Box>
                        </Box>
                    }
                    {which_character !== DungeonCharacter.wizard &&
                        <Box  width="100%">
                            <Box>
                                <Button variant='link' size='md' onClick={SelectWizard}>
                                    <img style={{"imageRendering":"pixelated"}} src={wizard} width="10000" alt={""}/>
                                </Button>
                            </Box>
                        </Box>
                    }
                </HStack>
            );        
    }

    const UnconnectedPage = () =>  {

        var font_size = DEFAULT_FONT_SIZE;
        if (isMobile) {
            font_size = "15px";
        }

        return (
            <>
            <Box width="100%">
                <Center>
                
                    <VStack alignItems="center" spacing="3%" mt="2%">                
                        <HStack alignItems="center" spacing="1%">
                            <Box width="27%">
                                <div className="font-face-sfpb">
                                    <Text  align="center" fontSize={font_size} color="white">DUNGEON MASTER'S<br/> FEE: 3%</Text>
                                </div>    
                            </Box>  
                            <Box width="46%">
                                <LargeDoor/>
                            </Box>
                            <Box width="27%">
                                
                                    {!isMobile &&
                                        <div className="font-face-sfpb">
                                        <WalletMultiButton  
                                        className="wallet-button"  
                                        >CONNECT<br/>WALLET</WalletMultiButton>
                                        </div>
                                    }
                                    {isMobile &&
                                        <div className="font-face-sfpb">
                                        <WalletMultiButton  
                                        className="mobile-wallet-button"  
                                        >CONNECT<br/>WALLET</WalletMultiButton>
                                        </div>
                                    }
                                
                            </Box>  
                        </HStack>
                        
                        <HStack>
                            <Box width="33%"/>
                                <div className="font-face-sfpb">
                                    <Text align="center" fontSize={font_size} color="white">50% CHANCE TO  DOUBLE YOUR SOL</Text>
                                </div>   
                            <Box width="33%"/>
                        </HStack>

                        {!isMobile &&
                        <HStack>
                            <Box width="33%" mt="2rem"/>
                            <Box width="33%" mt="2rem"><HiddenCharacterSelect/></Box>
                            <Box width="33%" mt="2rem"/>
                        </HStack>
                        }
                    </VStack>
                
                
                </Center>
            </Box>
            </>
        )
    }

    const ConnectedPageNoCS = () =>  {

        var font_size = DEFAULT_FONT_SIZE;
        if (isMobile) {
            font_size = "15px";
        }

        return(
            <Box width="100%">
                <Center>
                
                    <VStack alignItems="center" spacing="3%" mt="2%">  
                        <HStack alignItems="center" spacing="1%">
                            <Box width="27%">
                                <div className="font-face-sfpb">
                                    <Text  align="center" fontSize={font_size} color="black">DUNGEON MASTER'S<br/> FEE: 3%</Text>
                                </div>    
                            </Box>   
                            <Box width="46%">
                                <LargeDoor/>
                            </Box>
                            <Box width="27%">
                                <VStack style={{"visibility": "hidden"}}>
                                    <div className="font-face-sfpb">
                                        <Button variant='link' size='md'>
                                                <Text  textAlign="center" fontSize={font_size} color="black">ENTER<br/>DUNGEON</Text>
                                        </Button> 
                                    
                                        <Text textAlign="center" fontSize={font_size} color="black">{BET_SIZE} SOL</Text>
                                    </div> 
                                </VStack>

                            </Box>  
                        </HStack>
                        <HStack>
                            <Box width="33%" mt="2rem"/>
                            <Box width="33%" mt="2rem"><HiddenCharacterSelect/></Box>
                            <Box width="33%" mt="2rem"/>
                        </HStack>
                    </VStack>
                </Center>
                
            </Box>
        
        );
    }

    const ConnectedPage = () =>  {

        var font_size = DEFAULT_FONT_SIZE;
        if (isMobile) {
            font_size = "15px";
        }

        //console.log("in characterSelect, progress: ", currentLevel, "enemy", current_enemy, "status", DungeonStatusString[currentStatus], "num_plays", numPlays,  initial_num_plays, "dataaccount:", AccountStatusString[data_account_status],  "initial status", DungeonStatusString[initial_status], initial_status === DungeonStatus.unknown);

        // if i don't need to make an account but player status is unknown return nothing
        if (data_account_status === AccountStatus.created  && (initial_status === DungeonStatus.unknown || (numPlays === initial_num_plays && (DungeonStatus === DungeonStatus.alive || DungeonStatus === DungeonStatus.exploring)))) {
            return(
                <ConnectedPageNoCS/>
            );
        }

        //console.log("have made it here in CS 2");
        // if i am alive or e xploring and  the level is > 0 never show this
        if (data_account_status === AccountStatus.unknown ||  (currentLevel > 0 && (currentStatus === DungeonStatus.alive || currentStatus === DungeonStatus.exploring))) {
            return(
                <ConnectedPageNoCS/>
            );
        }
        //console.log("have made it here in CS");
        return (
            <>
            <Box width="100%">
                <Center>
                    <VStack alignItems="center" spacing="3%" mt="2%">  
                        <HStack alignItems="center" spacing="1%">
                            <Box width="27%">
                                <div className="font-face-sfpb">
                                    {current_key_type  === KeyType.Unknown &&
                                        <Text  align="center" fontSize={font_size} color="white">DUNGEON MASTER'S<br/> FEE: 3%</Text>
                                    }
                                    {current_key_type  === KeyType.Bronze &&
                                        <Text  align="center" fontSize={font_size} color="#CD7F32">DUNGEON MASTER'S<br/> FEE: 2.25%</Text>
                                    }
                                    {current_key_type  === KeyType.Silver &&
                                        <Text  align="center" fontSize={font_size} color="silver">DUNGEON MASTER'S<br/> FEE: 1.5%</Text>
                                    }
                                    {current_key_type  === KeyType.Gold &&
                                        <Text  align="center" fontSize={font_size} color="gold">DUNGEON MASTER'S<br/> FEE: 0.75%</Text>
                                    }
                                </div>    
                            </Box>            
                            <Box width="46%">
                                <LargeDoor/>
                            </Box>
                            <Box width="27%">
                                <VStack alignItems="center">
                                    <div className="font-face-sfpb">
                                        <Button variant='link' size='md' onClick={Play}>
                                                <Text  textAlign="center" fontSize={font_size} color="white">ENTER<br/>DUNGEON</Text>
                                        </Button> 
                                    </div> 
                                    <div className="font-face-sfpb">
                                        <Text textAlign="center" fontSize={font_size} color="white">{BET_SIZE} SOL</Text>
                                    </div>

                                    <Box height="40px" width='350px'>  
                                    <HStack>
                                    <div className="font-face-sfpb">                                           
                                            <FormControl key="discount_form" id="existing_mint" maxWidth={"350px"} color="white">
                                                <Input
                                                    autoFocus="autoFocus"
                                                    key="discount_input" 
                                                    placeholder='Dungeon Key'
                                                    type="text"
                                                    value={existing_mint}
                                                    onChange={handleMintChange}
                                                />
                                            </FormControl>
                                    </div>
                                    <div className="font-face-sfpb">
                                        <Button variant='link' size='md' onClick={ApplyKey}>
                                                <Text  textAlign="center" fontSize={font_size} color="white">Apply</Text>
                                        </Button> 
                                    </div>    
                                        
                                    </HStack>
                                    {discount_error &&
                                    <div className="font-face-sfpb">
                                        <Text  textAlign="center" fontSize={font_size} color="red">{discount_error}</Text>
                                    </div>     
                                    }
                                </Box>
                                    
                                </VStack>
                            </Box>  
                        </HStack>
                        <HStack>
                            <Box width="33%" mt="2rem"/>
                            <Box width="33%" mt="2rem"><CharacterSelect/></Box>
                            <Box width="33%" mt="2rem"/>
                        </HStack>
                    </VStack>
            
                </Center>
            </Box>
            </>
        )
    }

    const DisplayPlayer = () => {

       // console.log("player state ", player_state);
        if (player_state === DungeonStatus.unknown) {
            return(<></>);
        }

        if (player_state === DungeonStatus.dead)  {
            // if the current enemy is a trap we should return that here
            if (current_enemy === DungeonEnemy.Boulder) {
                return ( <img style={{"imageRendering":"pixelated"}} src={boulder} width="10000" alt={""}/> );
            }
            if (current_enemy === DungeonEnemy.FloorSpikes) {
                return ( <img style={{"imageRendering":"pixelated"}} src={floor_spikes} width="10000" alt={""}/> );
            }

            // otherwise return the corpse
            return ( <img style={{"imageRendering":"pixelated"}} src={corpse} width="10000" alt={""}/> );
        }
        
        // otherwise just return the player
        if (which_character === DungeonCharacter.knight){
            return ( <img style={{"imageRendering":"pixelated"}} src={knight} width="10000" alt={""}/> );
        }

        if (which_character === DungeonCharacter.ranger){
            return ( <img style={{"imageRendering":"pixelated"}} src={ranger} width="10000" alt={""}/> );
        }

        if (which_character === DungeonCharacter.wizard){
            return ( <img style={{"imageRendering":"pixelated"}} src={wizard} width="10000" alt={""}/> );
        }
        
    }

    const DisplayEnemyInitialText = () => {

         
         // for the traps we report an empty room
         if (current_enemy === DungeonEnemy.Boulder || current_enemy === DungeonEnemy.FloorSpikes) {
             return(
             <div className="font-face-sfpb">
                <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">You enter a suspiciously empty room...</Text>
            </div>
            );
         };

         if (current_enemy === DungeonEnemy.Chest) {
            return(
            <div className="font-face-sfpb">
               <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">You have found a treasure chest in room {currentLevel}!</Text>
           </div>
           );
        };
         

         // otherwise say the enemy type
         return(
            <div className="font-face-sfpb">
                <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">You have encountered {DungeonEnemyInitialText[current_enemy]} in room {currentLevel}</Text>
                <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">Prepare yourself!</Text>
            </div>
         );
     }

    const SuccessEnemyResultText = () => {

        // for the traps we have special text for survival
        if (current_enemy === DungeonEnemy.Boulder || current_enemy === DungeonEnemy.FloorSpikes) {
            return(
                <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">...but pass through without incident.</Text>
             );
        };

        if (current_enemy === DungeonEnemy.Chest) {
            return(
                <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">You approach with great suspicion, but open it to find it full of gold!</Text>
             );
        };

        // otherwise say the enemy type
        return(
            <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">You have defeated the {DungeonEnemyName[current_enemy]}</Text>  
        );
        

    }

    const DisplaySuccessEnemyResultText = () => {

        if (currentLevel <  7) {
            return(
            <div className="font-face-sfpb">
                <SuccessEnemyResultText/>
                <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">Escape to claim your current loot of {Math.pow(2,currentLevel) *  BET_SIZE} SOL</Text>
                <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">Explore further to try and double your loot to {Math.pow(2,currentLevel+1) *  BET_SIZE} SOL</Text>
           </div>
           );
        }

        // otherwise  we retire
        return(
            <div className="font-face-sfpb">
                <SuccessEnemyResultText/>
                <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">Looking around you realise your job is done and there is nothing left to kill</Text>
                <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">Retire to claim your current loot of {Math.pow(2,currentLevel) *  BET_SIZE} SOL</Text>
                
           </div>
           );

    }

    const DisplayFailureEnemyResultText = () => {

         
        // for the traps we have special text for failure
        if (current_enemy === DungeonEnemy.Boulder) {
            return(
                <Center>
                <Box width="80%">
                <div className="font-face-sfpb">
                    <Text  fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">A boulder suddenly falls from the ceiling, crushing you instantly.</Text>
                </div>
                </Box>
                </Center>
            );
        }

        if (current_enemy === DungeonEnemy.FloorSpikes) {
            return(
                <Center>
                <Box width="80%">
                <div className="font-face-sfpb">
                    <Text  fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">A trapdoor opens beneath your feet, dropping you onto a mass of bloodied spikes.</Text>
                </div>
                </Box>
                </Center>
            );
        }
        

        // otherwise say the enemy type
        return(
            <Center>
                <Box width="80%">
                    <div className="font-face-sfpb">
                        <Text  fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">{DungeonEnemyDefeatText[current_enemy]}</Text>
                    </div>
                </Box>
            </Center>
        );
    }

    const DisplayEnemy = () => {

       // console.log("enemy state ", enemy_state);
        if (enemy_state === DungeonStatus.unknown) {
            return(<></>);
        }

        if (enemy_state === DungeonStatus.dead)  {

            // for the traps we don't return anything
            if (current_enemy === DungeonEnemy.Boulder) {
                return(<></>);
            }
            if (current_enemy === DungeonEnemy.FloorSpikes) {
                return(<></>);
            }

            if (current_enemy === DungeonEnemy.Chest) {
                return ( <img style={{"imageRendering":"pixelated"}} src={open_chest} width="10000" alt={""}/> );
            }


            return ( <img style={{"imageRendering":"pixelated"}} src={corpse} width="10000" alt={""}/> );
        }

        if (player_state === DungeonStatus.dead) {
            if (current_enemy === DungeonEnemy.Chest) {
                return ( <img style={{"imageRendering":"pixelated"}} src={mimic} width="10000" alt={""}/> );
            }
        }

        

        if (current_enemy === DungeonEnemy.Chest) {
            return ( <img style={{"imageRendering":"pixelated"}} src={closed_chest} width="10000" alt={""}/> );
        }
        if (current_enemy === DungeonEnemy.Slime) {
            return ( <img style={{"imageRendering":"pixelated"}} src={slime} width="10000" alt={""}/> );
        }
        if (current_enemy === DungeonEnemy.Goblins) {
            return ( <img style={{"imageRendering":"pixelated"}} src={goblins} width="10000" alt={""}/> );
        }
        if (current_enemy === DungeonEnemy.SkeletonsHallway) {
            return ( <img style={{"imageRendering":"pixelated"}} src={skeletons_hallway} width="10000" alt={""}/> );
        }
        if (current_enemy === DungeonEnemy.SkeletonsGraveyard) {
            return ( <img style={{"imageRendering":"pixelated"}} src={skeletons_graveyard} width="10000" alt={""}/> );
        }
        if (current_enemy === DungeonEnemy.Elves) {
            return ( <img style={{"imageRendering":"pixelated"}} src={elves} width="10000" alt={""}/> );
        }
        if (current_enemy === DungeonEnemy.Orc) {
            return ( <img style={{"imageRendering":"pixelated"}} src={orc} width="10000" alt={""}/> );
        }
        if (current_enemy === DungeonEnemy.SkellyKnight) {
            return ( <img style={{"imageRendering":"pixelated"}} src={skeleton_knight} width="10000" alt={""}/> );
        }
        if (current_enemy === DungeonEnemy.SkellyWizard) {
            return ( <img style={{"imageRendering":"pixelated"}} src={skeleton_wizard} width="10000" alt={""}/> );
        }
        if (current_enemy === DungeonEnemy.Reaper) {
            return ( <img style={{"imageRendering":"pixelated"}} src={reaper} width="10000" alt={""}/> );
        }

        // for the traps we don't return anything
        if (current_enemy === DungeonEnemy.Boulder) {
            return(<></>);
        }
        if (current_enemy === DungeonEnemy.FloorSpikes) {
            return(<></>);
        }
    }

    const DisplayXP = () =>  {

        
        return(
                <Box width="10%">
                    <div className="font-face-sfpb">
                            
                            <Text  fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">XP {numXP}</Text>
                            
                    </div>
                </Box>
        );
    }


    const DisplayLVL = () =>  {

        
        return(
                <Box width="10%">
                    <div className="font-face-sfpb">
                            
                            <Text  fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">Lvl. {currentLevel}</Text>
                            
                    </div>
                </Box>
        );
    }

    const InDungeon = () =>  {

        var font_size = DEFAULT_FONT_SIZE;
        if (isMobile) {
            font_size = "15px";
        }

        if (DEBUG) {
            console.log("in dungeon: currentStatus ", DungeonStatusString[currentStatus], "player status", DungeonStatusString[player_state], "fulfilled ", randoms_fulfilled, "current level", currentLevel, "enemy state", DungeonStatusString[enemy_state], numXP);
        }
        return (
            
        <>
            <Box width="100%">
                    <HStack>
                        <Box width="25%"></Box>  
                        <DisplayLVL/>
                        <Box width="30%"></Box>     
                        <DisplayXP/>
                        <Box width="25%"></Box>  
                </HStack>
            </Box>

            <HStack mb = "2%" mt="1%">
                <Box width="10%"></Box>         
                <Box  style={{
                    backgroundImage: `url(${hallway})`,
                    backgroundPosition: 'center',
                    backgroundSize: 'contain',
                    backgroundRepeat: 'no-repeat',
                    imageRendering: "pixelated"

                } } width="80%">
                <HStack>
        
                    <Box width="30%"></Box>            
                    <Box width="15%"> <DisplayPlayer/></Box>  
                    <Box width="10%"></Box> 
                    <Box width="15%"> <DisplayEnemy/> </Box>  
                    <Box width="30%"></Box> 

                </HStack>
                </Box>
                <Box width="10%"></Box> 
                
            </HStack>
            

            <VStack  alignItems="center">

                { transaction_failed &&
                    <div className="font-face-sfpb">
                        <Center>
                                <Text  fontSize={font_size} textAlign="center" color="red">Transaction Failed. <br/>Please Refresh.</Text>
                        </Center>
                    </div>
                }
                                        
                {currentStatus === DungeonStatus.dead && player_state === DungeonStatus.dead &&
                <>
                <VStack alignItems="center" spacing="2%">
                        <DisplayFailureEnemyResultText/>
                        <Center>
                            <HStack alignItems="center">
                                
                                <Button variant='link' size='md' onClick={ShowDeath} mr="5rem">
                                    <div className="font-face-sfpb">
                                        <Text textAlign="center" fontSize={font_size} color="white">Exit</Text>
                                    </div> 
                                </Button> 
                                <Button variant='link' size='md' onClick={Play} ml="5rem">
                                    <div className="font-face-sfpb">
                                        <Text textAlign="center" fontSize={DEFAULT_FONT_SIZE} color="white">Retry</Text>
                                    </div> 
                                </Button> 
                            </HStack>
                        </Center>
                </VStack>
                </>
                }
                {currentLevel > 0  && 
                    <>
                    
                    { currentStatus === DungeonStatus.exploring  && randoms_fulfilled === false  &&
                        <div className="font-face-sfpb">
                            <Text fontSize={font_size} textAlign="center" color="white">You stumble through the darkened passage ways </Text>
                        </div>
                    }
                    { currentStatus === DungeonStatus.exploring  && randoms_fulfilled === true  &&
                    <VStack  alignItems="center" spacing="3%">
                            <Box width = "80%">
                            <div className="font-face-sfpb">
                                <Text fontSize={font_size} textAlign="center" color="white">You come across an unlocked door, and cracking it ajar hear the chittering sounds of some ancient evil from within</Text>
                            </div>
                            </Box>
                            <Button variant='link' size='md' onClick={Explore} ml="10rem">
                                <div className="font-face-sfpb">
                                    <Text textAlign="center" fontSize={font_size} color="white">Enter Room</Text>
                                </div> 
                            </Button> 
                        
                    </VStack>
                    }
                    { player_state === DungeonStatus.alive && enemy_state  === DungeonStatus.alive  && 
                        <DisplayEnemyInitialText/>
                    }
                    {player_state === DungeonStatus.alive && enemy_state === DungeonStatus.dead &&

                        <VStack alignItems="center" spacing="2%">
                            <DisplaySuccessEnemyResultText/>
                            {currentLevel < 7 &&
                                <Center>

                                <HStack>
                                    <Button variant='link' size='md' onClick={Play} mr="3rem">
                                        <div className="font-face-sfpb">
                                            <Text textAlign="center" fontSize={font_size} color="white">Explore Further</Text>
                                        </div> 
                                    </Button> 
                                    <Button variant='link' size='md' onClick={Quit} ml="10rem">
                                        <div className="font-face-sfpb">
                                            <Text textAlign="center" fontSize={font_size} color="white">Escape</Text>
                                        </div> 
                                    </Button> 
                                
                                </HStack>
                                </Center>
                            }
                            {currentLevel >= 7  &&
                            <Center>
                                <Button variant='link' size='md' onClick={Quit}>
                                    <div className="font-face-sfpb">
                                        <Text  textAlign="center" fontSize={font_size} color="white">Retire</Text>
                                    </div> 
                                </Button> 
                            </Center>
                        }
                        </VStack>

                    }
                </>
                }
            </VStack>
        </>
        )
    }

    const DeathScreen = () =>  {


        return (
            <>            
            <VStack>
                <HStack>
                    <Box width="40%"></Box>    
                    <Box width="20%"><img style={{"imageRendering":"pixelated"}} src={corpse} width="10000" alt={""}/></Box>    
                    <Box width="40%"></Box> 
                </HStack>

                <Box width="100%">
                    <Center>
                            <div className="font-face-sfpb">
                                <Text textAlign="center" fontSize={DUNGEON_FONT_SIZE} color="Red">You Have Died<br/><del>{Math.pow(2,currentLevel - 1) *  BET_SIZE} SOL</del></Text>
                            </div> 
                    </Center>
                </Box>
                   
                <HStack>
                    <Box width="33%"/>
                        <Center>
                            <Button variant='link' size='md' onClick={Reset}>
                                <div className="font-face-sfpb">
                                    <Text textAlign="center" fontSize={DEFAULT_FONT_SIZE} color="white">Try Again</Text>
                                </div> 
                            </Button> 
                        </Center>
                    <Box width="33%"/>
                </HStack>
            </VStack>
        </>

        )
    }

    /*const VictoryScreen = () =>  {


        return (
            <>            
            <VStack>
                <HStack>
                    <Box width="40%"></Box>    
                    <Box width="20%"><DisplayPlayer/></Box>    
                    <Box width="40%"></Box> 
                </HStack>

                <Box width="100%">
                    <Center>
                            <div className="font-face-sfpb">
                                <Text textAlign="center" fontSize={DEFAULT_FONT_SIZE} color="Green">You Have Survived Level {currentLevel}<br/>Loot: {Math.pow(2,currentLevel - 1) *  BET_SIZE} SOL</Text>
                                <Text textAlign="center" fontSize={DEFAULT_FONT_SIZE} color="Red">DM Fee: {Math.pow(2,currentLevel - 1) *  BET_SIZE * 0.02} SOL</Text>
                            </div> 
                    </Center>
                </Box>
                   
                <HStack>
                    <Box width="33%"/>
                        <Center>
                            <Button variant='link' size='md' onClick={Reset}>
                                <div className="font-face-sfpb">
                                    <Text textAlign="center" fontSize={DEFAULT_FONT_SIZE} color="white">Exit</Text>
                                </div> 
                            </Button> 
                        </Center>
                    <Box width="33%"/>
                </HStack>
            </VStack>
        </>

        )
    }*/


    return (
        <StateContext.Provider value={[numXP]}>
        <>
        {!isMobile &&
            <Navigation/>
        }
        {isMobile &&
            <MobileNavigation/>
        }
        
        <Box width="100%" mb = "2%">
            <Center>
                <Title/>
            </Center>
        </Box>

        <Box width="100%">       
            <Center>
                <VStack alignItems="center">
                 
                
                
                    
                    {!wallet.publicKey && 
                    <>
                        {screen === Screen.ODDS_SCREEN &&
                            <OddsScreen/>
                        }
                        {screen === Screen.FAQ_SCREEN &&
                            <FAQScreen/>
                        }
                        {screen === Screen.HELP_SCREEN &&
                            <HelpScreen/>
                        }
                        {screen === Screen.SHOP_SCREEN &&
                            <ShopScreen/>
                        }
                        {(screen === Screen.HOME_SCREEN || screen === Screen.DUNGEON_SCREEN || screen === Screen.DEATH_SCREEN) &&
                            <UnconnectedPage/>
                        }
                    </>
                    }
                    {wallet.publicKey && 
                        <>
                        {screen === Screen.HOME_SCREEN &&
                            <ConnectedPage/>
                        }
                        {screen === Screen.DUNGEON_SCREEN  &&
                            <InDungeon/>
                        }
                        {screen === Screen.DEATH_SCREEN &&
                            <DeathScreen/>
                        }
                        {screen === Screen.ODDS_SCREEN &&
                            <OddsScreen/>
                        }
                        {screen === Screen.FAQ_SCREEN &&
                            <FAQScreen/>
                        }
                        {screen === Screen.SHOP_SCREEN &&
                            <ShopScreen/>
                        }
                        {screen === Screen.HELP_SCREEN &&
                            <HelpScreen/>
                        }
                        </>
                    }                    
                
                </VStack>               
            </Center>
        </Box>
        </>
        </StateContext.Provider>
    );
}

function Dungeon() {
    const wallets = useMemo(() => 
    [
        new PhantomWalletAdapter(),
    ],
    []
  );
  document.body.style = 'background: black;';
    return (

        <ChakraProvider theme={theme}>
                <WalletProvider wallets={wallets} autoConnect>
                    <WalletModalProvider>
                        <DungeonApp />
                    </WalletModalProvider>
                </WalletProvider>
        </ChakraProvider>

    );
}

export default Dungeon;