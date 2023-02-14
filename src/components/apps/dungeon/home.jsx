import React, { useCallback, useEffect, useState, useMemo } from 'react';
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
    Input,
    Divider
} from '@chakra-ui/react';

import {
    useDisclosure,
    Drawer,
    DrawerBody,
    DrawerOverlay,
    DrawerContent,
    DrawerCloseButton,
} from '@chakra-ui/react'

import {
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverHeader,
    PopoverBody,
    PopoverArrow,
    PopoverCloseButton,
  } from '@chakra-ui/react'

import FocusLock from 'react-focus-lock';


import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { brands, solid } from '@fortawesome/fontawesome-svg-core/import.macro' // <-- import styles to be used


import { isMobile } from "react-device-detect";
import { randomBytes } from 'crypto'
import { serialize, deserialize } from 'borsh';

import useSound from 'use-sound';

import { PublicKey, Transaction, TransactionInstruction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import {
    getAssociatedTokenAddress
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


import bs58 from "bs58";

import dungeon_title from "./Dungeon_Logo.png"
import large_door from "./Large_Door.gif"
import hallway from "./Hallway.gif"

//buttons
import enter_button from "./Enter_Button.png"

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

//  dungeon constants
import { DEFAULT_FONT_SIZE, DUNGEON_FONT_SIZE, network_string, PROD, Assignable ,
    PYTH_BTC_DEV, PYTH_BTC_PROD, PYTH_ETH_DEV, PYTH_ETH_PROD, PYTH_SOL_DEV, PYTH_SOL_PROD,
    METAPLEX_META, SHOP_PROGRAM, PROGRAM_KEY, SYSTEM_KEY,
    instruction_schema, InstructionMeta, StateContext, DEBUG} from './constants';

// dungeon utils
import { check_json, request_player_account_data, request_key_data_from_mint, request_key_data_from_index} from './utils';

// dungeon pages
import {FAQScreen} from './faq';
import {OddsScreen} from './odds';
import {HelpScreen} from './help';
import {ShopScreen} from './shop';
//import {DungeonScreen} from './dungeon';

import './style.css';
import './fonts.css';
import './wallet.css';
require('@solana/wallet-adapter-react-ui/styles.css');


const DAOPLAYS_KEY = new PublicKey("2BLkynLAWGwW58SLDAnhwsoiAuVtzqyfHKA3W3MJFwEF");
const KAYAK_KEY = new PublicKey("7oAfRLy81EwMJAXNKbZFaMTayBFoBpkua4ukWiCZBZz5");
const ORAO_KEY = new PublicKey("VRFzZoJdhFWL8rkvu87LpKM3RbcVezpMEc6X5GVDr7y");

const ORAO_RANDOMNESS_ACCOUNT_SEED = Buffer.from("orao-vrf-randomness-request");
const ORAO_CONFIG_ACCOUNT_SEED = Buffer.from("orao-vrf-network-configuration");






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




class PlayMeta extends Assignable { }
class ExploreMeta extends Assignable { }
class my_pubkey extends Assignable { }


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






const uIntToBytes = (num, size, method) => {
    const arr = new ArrayBuffer(size)
    const view = new DataView(arr)
    view[method + (size * 8)](0, num)
    return arr
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

    // error handling on applying the discount
    const [discount_error, setDiscountError] = useState(null);
    const [show_discount_error, setShowDiscountError] = useState(false);



    const [screen, setScreen] = useState(Screen.HOME_SCREEN);

    const [which_character, setWhichCharacter] = useState(DungeonCharacter.knight);
    const [enemy_state, setEnemyState] = useState(DungeonStatus.unknown);
    const [player_state, setPlayerState] = useState(DungeonStatus.unknown);
    const [animateLevel, setAnimateLevel] = useState(0);

    //button processing
    const [processing_transaction, setProcessingTransaction] = useState(false);


    useEffect(() => 
    {
        if (discount_error === null)
            return;

        setShowDiscountError(true);

    }, [discount_error, setDiscountError]);

    const CloseDiscountError = useCallback( async () => 
    {
        setShowDiscountError(false);
    },[]);

    const OpenDiscountError = useCallback( async () => 
    {
        setShowDiscountError(true);
    },[]);

    function DiscountKeyInput() {

        return (
        <div style={{ margin: 0 }}>
        <Popover
            returnFocusOnClose={false}
            isOpen={show_discount_error}
            onClose={CloseDiscountError}
            placement='left'
            closeOnBlur={false}
        >
            <PopoverTrigger>
                <HStack align="center">
                    <Box width="20%"></Box>
                    <div className="font-face-sfpb">                                           
                        <FormControl key="discount_form" id="existing_mint" maxWidth={"100%"} color="white">
                            <Input
                                autoFocus="autoFocus"
                                key="discount_input" 
                                placeholder='Key Mint/No.'
                                type="text"
                                value={existing_mint}
                                onChange={handleMintChange}
                            />
                        </FormControl>
                    </div>
                    <div className="font-face-sfpb" >

                        <Button variant='link' size='md' onClick={ApplyKey}>
                            <img style={{"imageRendering":"pixelated"}} src={key} width={"100%"} alt={""}/>
                        </Button> 
                        
                    </div>    
                        
                </HStack>
            </PopoverTrigger>
            <PopoverContent>
                <div className="font-face-sfpb">
                    <PopoverHeader fontWeight='semibold'>Dungeon Key Error</PopoverHeader>
                </div>
                <PopoverArrow />
                <PopoverCloseButton />
                <PopoverBody>
                    <div className="font-face-sfpb">
                        {discount_error}
                    </div>
                </PopoverBody>
            </PopoverContent>
        </Popover>
        </div>
        )
      }

      function MobileDiscountKeyInput() {

        return (
        <div style={{ margin: 0 }}>
        <Popover
            returnFocusOnClose={false}
            isOpen={show_discount_error}
            onClose={CloseDiscountError}
            placement='bottom'
            closeOnBlur={false}
        >
            <PopoverTrigger>
                <Button variant='link' size='md' onClick={OpenDiscountError}>
                    <img style={{"imageRendering":"pixelated"}} src={key} width={"100%"} alt={""}/>
                </Button> 
            </PopoverTrigger>
            <PopoverContent>
                <div className="font-face-sfpb">
                    <PopoverHeader fontSize={DEFAULT_FONT_SIZE} fontWeight='semibold'>Dungeon Key</PopoverHeader>
                </div>
                <PopoverArrow />
                <PopoverCloseButton />
                <PopoverBody>
                    <FocusLock returnFocus persistentFocus={false}>
                    <VStack align="center">
                        <div className="font-face-sfpb">                                           
                            <FormControl  key="discount_form" id="existing_mint" maxWidth={"100%"} color="black">
                                <Input
                                    autoFocus="autoFocus"
                                    key="discount_input" 
                                    placeholder='Key Mint/Number'
                                    type="text"
                                    value={existing_mint}
                                    onChange={handleMintChange}
                                />
                            </FormControl>
                        </div>
                        <div className="font-face-sfpb" color="black">

                            <Button variant='link' size='md' onClick={ApplyKey}>
                                Apply
                            </Button> 
                            
                        </div>    
                        
                    </VStack>
                    {discount_error &&
                    <>
                        <Divider mt = "1rem" mb = "1rem"/>
                        <div className="font-face-sfpb">
                            {discount_error}
                        </div>
                    </>
                    }
                    </FocusLock>
                </PopoverBody>
            </PopoverContent>
        </Popover>
        </div>
        )
      }

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

            const confirm_url = `/.netlify/functions/solana_sig_status?network=`+network_string+`&function_name=getSignatureStatuses&p1=`+current_signature;
            var signature_response = await fetch(confirm_url).then((res) => res.json());

            let valid_response = check_json(signature_response)
            if (!valid_response) {
                return;
            }

            let confirmation = signature_response["result"]["value"][0];
            
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

                return
            }

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

                    let valid_response = check_json(balance_result)
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

            let valid_response = check_json(randoms_account_info_result)
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
            
            if (Buffer.alloc(64).equals(randoms)) {
                return;
            }

            setRandomsFullfilled(true);
            global_randoms_address = null;
            

    }, []);

    
    useEffect(() => 
    {

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
            let valid_response = check_json(account_info_result)
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

                let valid_response = check_json(balance_result)
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

            //const player_data = await get_account_data({pubkey: player_data_key.toString(), schema: player_data_schema, map: PlayerData, raw: false})

            let player_data = await request_player_account_data(player_data_key);

            if (player_data === null) {
                return;
            }

            let current_status = player_data.player_status + 1;
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

            let num_plays = player_data.num_plays.toNumber();



            if (num_plays <= last_num_plays) {
                if (DEBUG) {
                    console.log("num plays not increased", num_plays);
                }
                return;
            }

            last_num_plays = num_plays;

            setNumPlays(num_plays);

            if (DEBUG) {
                console.log("in init, progress: ", player_data.in_progress, "enemy", player_data.dungeon_enemy, "alive", DungeonStatusString[player_data.player_status + 1], "num_plays", num_plays, "num_wins", player_data.num_wins.toNumber());
            }

            if (initial_num_plays ===  -1)
            {
                initial_num_plays =  num_plays;
            }
            if (num_plays === 0)  {
                return;
            }  

            const randoms_key = null;

            setCurrentEnemy(player_data.dungeon_enemy);
            
            setCurrentLevel(player_data.in_progress);

            setCurrentStatus(current_status);

            setNumXP(player_data.num_wins.toNumber());

            // only update the randoms key here if we are exploring
            if (current_status === DungeonStatus.exploring) {
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

            if (currentStatus === DungeonStatus.alive || currentStatus === DungeonStatus.exploring) {
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
            const timer = setTimeout(() => {

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
            setProcessingTransaction(true);
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

                let valid_response = check_json(transaction_response)
                if (!valid_response) {
                    console.log(transaction_response)
                    setProcessingTransaction(false);
                    return;
                }

                let signature = transaction_response["result"];

                if (DEBUG) {
                    console.log("play signature: ", signature);
                }

                setCurrentSignature(signature);

            } catch(error) {
                setProcessingTransaction(false);
                console.log(error);
                return;
            }

            if (DEBUG) {
                console.log("In Play - setting state");
            }

            setScreen(Screen.DUNGEON_SCREEN);
            setEnemyState(DungeonStatus.unknown);
            setPlayerState(DungeonStatus.alive);
            setProcessingTransaction(false);
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

            let valid_response = check_json(network_account_info_result)
            if (!valid_response) {
                return;
            }

            if (network_account_info_result["result"]["value"] == null || network_account_info_result["result"]["value"]["data"] == null ) {
                return;
            }

            let network_account_encoded_data = network_account_info_result["result"]["value"]["data"];
            let network_account_data = Buffer.from(network_account_encoded_data[0], "base64");

            const treasuryAddress = new PublicKey(deserialize(pubkey_scheme, my_pubkey, network_account_data.slice(8+32, 8+32 + 32)).value);

            const seed = randomBytes(32)

            let randomAddress = (await PublicKey.findProgramAddress([ORAO_RANDOMNESS_ACCOUNT_SEED, seed], ORAO_KEY))[0];

            const explore_meta = new ExploreMeta({ instruction: DungeonInstruction.explore, seed : seed, character: which_character});
            const instruction_data = serialize(explore_scheme, explore_meta);

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

                const send_url = `/.netlify/functions/solana?network=`+network_string+`&function_name=sendTransaction&p1=`+encoded_transaction;
                var transaction_response = await fetch(send_url).then((res) => res.json());

                let valid_response = check_json(network_account_info_result)
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

            
            setProcessingTransaction(true);
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

                let valid_response = check_json(transaction_response)

                if (!valid_response) {
                    console.log(transaction_response)
                    setProcessingTransaction(false);
                    return;
                }

                let signature = transaction_response["result"];

                setCurrentSignature(signature);

            } catch(error) {
                console.log(error);
                setProcessingTransaction(false);
                return;
            }

            if (DEBUG) {
                console.log("In quit, setting state");
            }

            setScreen(Screen.HOME_SCREEN);
            setEnemyState(DungeonStatus.unknown);
            setProcessingTransaction(false);
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

            const key_meta_data = await request_key_data_from_mint(dungeon_key_meta_account);
            
            if (key_meta_data === null) {                
                setDiscountError("Key account not found.<br/>Please check mint address is valid");
                return;
            }

            key_type = key_meta_data.key_type;
            key_index = key_meta_data.key_index;

        }
        // otherwise it should be an integer
        else {

            key_index = parseInt(existing_mint);
            let index_array_buffer = uIntToBytes(key_index, 2, "setUint");
            let index_buffer = new Buffer.from(index_array_buffer);
            let dungeon_key_lookup_account = (PublicKey.findProgramAddressSync([Buffer.from("key_meta"), index_buffer.reverse()], PROGRAM_KEY))[0];

            const key_meta_data = await request_key_data_from_index(dungeon_key_lookup_account);
            
            // if we have been passed a number check the lookup account exists
            if (key_meta_data === null) {
                setDiscountError("Key account not found.  Please pass key mint on first use");
                return;
            }

            key_mint = key_meta_data.key_mint;
            key_type = key_meta_data.key_type;

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

        let valid_response = check_json(token_balance_result)
        if (!valid_response || token_balance_result["result"]["value"] === null) {
            setDiscountError("Error retrieving nft account data.  Please try again.");
            return;
        }

        let token_balance = parseInt(token_balance_result["result"]["value"]["amount"]);

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
            setScreen(Screen.HOME_SCREEN);
            return;
        
    },[]);

    const ShowShop = useCallback( async () => 
    {
            setScreen(Screen.SHOP_SCREEN);
            return;
        
    },[]);

    const LargeDoor = () => {
        return (
            <>
            <Center>
            <img style={{"imageRendering":"pixelated"}} src={large_door} width={500} alt={"generic"}/>
            </Center>
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
                                    <Text  align="center" fontSize={font_size} color="white">DUNGEON<br/>MASTER'S<br/>FEE: 3.00%</Text>
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
                        <HStack visibility={"hidden"}>
                            <Box width="33%" mt="2rem"/>
                            <Box width="33%" mt="2rem"><CharacterSelect/></Box>
                            <Box width="33%" mt="2rem"/>
                        </HStack>
                        }
                    </VStack>
                
                
                </Center>
            </Box>
            </>
        )
    }

    const ConnectedPage = () =>  {

        var font_size = DEFAULT_FONT_SIZE;
        if (isMobile) {
            font_size = "15px";
        }

        var visibility = "visible";

        //console.log("in characterSelect, progress: ", currentLevel, "enemy", current_enemy, "status", DungeonStatusString[currentStatus], "num_plays", numPlays,  initial_num_plays, "dataaccount:", AccountStatusString[data_account_status],  "initial status", DungeonStatusString[initial_status], initial_status === DungeonStatus.unknown);

        // if i don't need to make an account but player status is unknown return nothing
        if (data_account_status === AccountStatus.created  && (initial_status === DungeonStatus.unknown || (numPlays === initial_num_plays && (DungeonStatus === DungeonStatus.alive || DungeonStatus === DungeonStatus.exploring)))) {
                visibility = "hidden";
            
        }

        //console.log("have made it here in CS 2");
        // if i am alive or exploring and  the level is > 0 never show this
        if (data_account_status === AccountStatus.unknown ||  (currentLevel > 0 && (currentStatus === DungeonStatus.alive || currentStatus === DungeonStatus.exploring))) {
                visibility = "hidden";
            
        }
        //console.log("have made it here in CS");
        return (
            <>
            <Box width="100%">
                <Center>
                    <VStack alignItems="center" spacing="3%" mt="2%">  
                        <HStack alignItems="center" spacing="1%" >
                            <Box width="27%" visibility={visibility}>
                                <div className="font-face-sfpb">
                                    {current_key_type  === KeyType.Unknown &&
                                        <Text  align="center" fontSize={font_size} color="white">DUNGEON<br/>MASTER'S<br/>FEE: 3.00%</Text>
                                    }
                                    {current_key_type  === KeyType.Bronze &&
                                        <Text  align="center" fontSize={font_size} color="#CD7F32">DUNGEON<br/>MASTER'S<br/>FEE: 2.25%</Text>
                                    }
                                    {current_key_type  === KeyType.Silver &&
                                        <Text  align="center" fontSize={font_size} color="silver">DUNGEON<br/>MASTER'S<br/>FEE: 1.50%</Text>
                                    }
                                    {current_key_type  === KeyType.Gold &&
                                        <Text  align="center" fontSize={font_size} color="gold">DUNGEON<br/>MASTER'S<br/>FEE: 0.75%</Text>
                                    }
                                </div>    
                            </Box>            
                            <Box width="46%">   
                                <LargeDoor/>
                            </Box>
                            <Box width="27%" visibility={visibility}>
                                <VStack align="center">
                                    <div className="font-face-sfpb">
                                        <Button variant='link' size='md' onClick={Play}>
                                        <img style={{"imageRendering":"pixelated"}} src={enter_button} width={"60%"} alt={""}/>
                                        </Button> 
                                    </div> 
                                    <div className="font-face-sfpb">
                                        <Text textAlign="center" fontSize={font_size} color="white">{BET_SIZE} SOL</Text>
                                    </div>
                                    {!isMobile &&
                                    <>
                                        <DiscountKeyInput/>
                                    </>  
                                    }
                                    {isMobile &&
                                    <>
                                        <MobileDiscountKeyInput/>
                                    </>  
                                    }
                                
                                 
                                </VStack>
                            </Box>  
                        </HStack>
                        <HStack visibility={visibility}>
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
                                        
                {player_state === DungeonStatus.dead &&
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
                                {!processing_transaction &&
                                    <Button variant='link' size='md' onClick={Play} ml="5rem">
                                        <div className="font-face-sfpb">
                                            <Text textAlign="center" fontSize={DEFAULT_FONT_SIZE} color="white">Retry</Text>
                                        </div> 
                                    </Button> 
                                }
                                {processing_transaction &&
                                    <Button variant='link' size='md' ml="5rem">
                                        <div className="font-face-sfpb">
                                            <Text textAlign="center" fontSize={DEFAULT_FONT_SIZE} color="white">Retry</Text>
                                        </div> 
                                    </Button> 
                                }
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
                                    {!processing_transaction &&
                                    <Button variant='link' size='md' onClick={Quit} mr="3rem">
                                        <div className="font-face-sfpb">
                                            <Text textAlign="center" fontSize={font_size} color="white">Escape</Text>
                                        </div> 
                                    </Button> 
                                    }
                                    {processing_transaction &&
                                        <Button variant='link' size='md' mr="3rem">
                                            <div className="font-face-sfpb">
                                                <Text textAlign="center" fontSize={font_size} color="white">Escape</Text>
                                            </div> 
                                        </Button> 
                                    }
                                    {!processing_transaction &&
                                    <Button variant='link' size='md' onClick={Play} ml="10rem">
                                        <div className="font-face-sfpb">
                                            <Text textAlign="center" fontSize={font_size} color="white">Explore Further</Text>
                                        </div> 
                                    </Button> 
                                    }
                                    {processing_transaction &&
                                    <Button variant='link' size='md' ml="10rem">
                                        <div className="font-face-sfpb">
                                            <Text textAlign="center" fontSize={font_size} color="white">Explore Further</Text>
                                        </div> 
                                    </Button> 
                                    }
                                    
                                
                                </HStack>
                                </Center>
                            }
                            {currentLevel >= 7  &&
                            <Center>
                                {!processing_transaction &&
                                    <Button variant='link' size='md' onClick={Quit}>
                                        <div className="font-face-sfpb">
                                            <Text  textAlign="center" fontSize={font_size} color="white">Retire</Text>
                                        </div> 
                                    </Button> 
                                }
                                {processing_transaction &&
                                    <Button variant='link' size='md'>
                                        <div className="font-face-sfpb">
                                            <Text  textAlign="center" fontSize={font_size} color="white">Retire</Text>
                                        </div> 
                                    </Button> 
                                }
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

function Home() {
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

export default Home;