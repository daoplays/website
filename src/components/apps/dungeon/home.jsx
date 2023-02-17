import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import {
    ChakraProvider,
    Box,
    Button,
    HStack,
    theme,
    Center,
    Text,
    VStack,
    Divider,
    NumberInput,
    NumberInputField
} from '@chakra-ui/react';

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

import { isMobile } from "react-device-detect";

import useSound from 'use-sound';

import { PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
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
    WalletMultiButton
} from '@solana/wallet-adapter-react-ui';


import bs58 from "bs58";

import dungeon_title from "./images/Dungeon_Logo.png"
import large_door from "./images/Large_Door.gif"
import hallway from "./images/Hallway.gif"

//buttons
import enter_button from "./images/Enter_Button.png"

// shop items
import key from "./images/Key.png"

//characters
import knight from "./images/Knight.gif"
import ranger from "./images/Ranger.gif"
import wizard from "./images/Wizard.gif"
import corpse from "./images/Corpse.png"
import selector from "./images/Selector.gif"

//sounds
import click_sound from './sounds/click.mp3';

//  dungeon constants
import { DEFAULT_FONT_SIZE, DUNGEON_FONT_SIZE, network_string, PROD,
    PYTH_BTC_DEV, PYTH_BTC_PROD, PYTH_ETH_DEV, PYTH_ETH_PROD, PYTH_SOL_DEV, PYTH_SOL_PROD,
    METAPLEX_META, SHOP_PROGRAM, DUNGEON_PROGRAM, SYSTEM_KEY, StateContext, DEBUG, Screen, BET_SIZE} from './constants';

// dungeon utils
import { check_json, request_player_account_data, request_key_data_from_index, KeyDataFromMint, request_token_amount,
    serialise_play_instruction, serialise_basic_instruction, uInt16ToLEBytes} from './utils';

import {DisplayPlayerSuccessText, DisplayPlayerFailedText, DisplayEnemyAppearsText, DisplayEnemy, DisplayPlayer, DisplayXP, DisplayLVL} from './dungeon_state';

// navigation
import {Navigation} from './navigation';

// dungeon pages
import {FAQScreen} from './faq';
import {OddsScreen} from './odds';
import {HelpScreen} from './help';
import {ShopScreen} from './shop';
//import {DungeonScreen} from './dungeon';

import './css/style.css';
import './css/fonts.css';
import './css/wallet.css';
require('@solana/wallet-adapter-react-ui/styles.css');


const DAOPLAYS_KEY = new PublicKey("2BLkynLAWGwW58SLDAnhwsoiAuVtzqyfHKA3W3MJFwEF");
const KAYAK_KEY = new PublicKey("7oAfRLy81EwMJAXNKbZFaMTayBFoBpkua4ukWiCZBZz5");

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

const DungeonInstruction = {
    add_funds : 0,
    distribute : 1,
    play : 2,
    quit : 3,
    explore : 4
}




export function DungeonApp() 
{
    const wallet = useWallet();

    // properties used to set what to display
    const [data_account_status, setDataAccountStatus] = useState(AccountStatus.unknown);
    const initial_status = useRef(DungeonStatus.unknown);

    // these come from the blockchain
    const [num_plays, setNumPlays] = useState(-1);
    const [numXP, setNumXP] = useState(0);
    const [current_level, setCurrentLevel] = useState(0);
    const [currentStatus, setCurrentStatus] = useState(DungeonStatus.unknown);
    const [current_enemy, setCurrentEnemy] = useState(DungeonEnemy.None);

    // if we have a key then discounts can be applied
    const [discount_key_index, setDiscountKeyIndex] = useState("")
    const [current_key_type, setCurrentKeyType] = useState(KeyType.Unknown);
    const [current_key_mint, setCurrentKeyMint] = useState(null);
    const [current_key_index, setCurrentKeyIndex] = useState(null);

    // error handling on applying the discount
    const [discount_error, setDiscountError] = useState(null);
    const [show_discount_error, setShowDiscountError] = useState(false);



    const [screen, setScreen] = useState(Screen.HOME_SCREEN);

    const [player_character, setWhichCharacter] = useState(DungeonCharacter.knight);
    const [enemy_state, setEnemyState] = useState(DungeonStatus.unknown);
    const [player_state, setPlayerState] = useState(DungeonStatus.unknown);
    const [animateLevel, setAnimateLevel] = useState(0);

    // refs to hold initial status
    const initial_num_plays = useRef(-1);

    // refs for checking signatures
    const signature_interval = useRef(null);
    const current_signature = useRef(null);
    const signature_check_count = useRef(0);
    const [transaction_failed, setTransactionFailed] = useState(false);


    // refs for setting whether we continue to check state
    const check_data_account = useRef(true);
    const check_sol_balance = useRef(true);
    const check_user_state = useRef(true);
    const state_interval = useRef(null);



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

    let key_size = "50";
    if(isMobile) {
        key_size = "40";
    }

    return (
        <>
    <div mt = "2rem"></div>
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
                <img style={{"imageRendering":"pixelated"}} src={key} width={key_size} alt={""}/>
            </Button> 
        </PopoverTrigger>
        <PopoverContent>
            <div className="font-face-sfpb">
                <PopoverHeader fontSize={DUNGEON_FONT_SIZE} fontWeight='semibold'>Enter Key Number</PopoverHeader>
            </div>
            <PopoverArrow />
            <PopoverCloseButton />
            <PopoverBody>
                <FocusLock returnFocus persistentFocus={false}>
                <VStack align="center">
                    <div className="font-face-sfpb">                                           
                    <NumberInput 
                        onChange={(valueString) => setDiscountKeyIndex(valueString)}
                        value={discount_key_index}
                        precision={0}
                        min={1} max={3500}>
                        <NumberInputField/>
                    </NumberInput>
                    </div>
                    <div className="font-face-sfpb">

                        <Button variant='link' size='md'  onClick={ApplyKey}> 
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
    </>
    )
    }

    const CheckSignature = useCallback(async() =>
    {
        
        if (current_signature.current === null)
            return;

        const confirm_url = `/.netlify/functions/solana_sig_status?network=`+network_string+`&function_name=getSignatureStatuses&p1=`+current_signature.current;
        var signature_response = await fetch(confirm_url).then((res) => res.json());

        console.log("sig response:", signature_response);
        let valid_response = check_json(signature_response)
        if (!valid_response) {
            return;
        }

        let confirmation = signature_response["result"]["value"][0];
        
        if (confirmation !== null) {

            if (confirmation["err"] !== null) {
                console.log("error: ", confirmation["err"]);
                setTransactionFailed(true);
            }
            else {
                setTransactionFailed(false);
            }

            current_signature.current = null;
            signature_check_count.current = 0;
        }

        if (signature_check_count.current >= 10) {
            setTransactionFailed(true);
            current_signature.current = null;
            signature_check_count.current = 0;
        }

    }, []);

    // interval for checking signatures
    useEffect(() => {

        if (signature_interval.current === null) {
            signature_interval.current = window.setInterval(CheckSignature, 1000);
        }
        else{
            window.clearInterval(signature_interval.current);
            signature_interval.current = null;
            
        }
        // here's the cleanup function
        return () => {
            if (signature_interval.current !== null) {
            window.clearInterval(signature_interval.current);
            signature_interval.current = null;
            }
        };
    }, [CheckSignature]);

     
    const check_state = useCallback(async () => 
    {     
        if (DEBUG) {
            console.log("in in it check_updates ", check_user_state.current, " check balance: ", check_data_account.current);
        }

        if (!wallet.publicKey) {
            return;
        }

        if (!check_user_state.current && !check_data_account.current)
            return;

        let player_data_key = (PublicKey.findProgramAddressSync([wallet.publicKey.toBytes()], DUNGEON_PROGRAM))[0];

        if (check_data_account.current) {
            
            // first check if the data account exists
            try {

                const balance_url = `/.netlify/functions/solana?network=`+network_string+`&function_name=getBalance&p1=`+player_data_key.toString()+"&config=true&encoding=base64&commitment=confirmed";
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
                    check_data_account.current = false;
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
        

        if (!check_user_state.current)
            return;

        try {

            let player_data = await request_player_account_data(player_data_key);

            if (player_data === null) {
                return;
            }

            let current_status = player_data.player_status + 1;
            if (initial_status.current === DungeonStatus.unknown) {
                initial_status.current = current_status;
            }

            let current_num_plays = player_data.num_plays.toNumber();

            if (current_num_plays <= num_plays) {
                if (DEBUG) {
                    console.log("num plays not increased", current_num_plays);
                }
                return;
            }

            setNumPlays(current_num_plays);

            if (DEBUG) {
                console.log("in init, progress: ", player_data.in_progress, "enemy", player_data.dungeon_enemy, "alive", DungeonStatusString[player_data.player_status + 1], "num_plays", current_num_plays, "num_wins", player_data.num_wins.toNumber());
            }

            if (initial_num_plays.current ===  -1) {
                initial_num_plays.current =  current_num_plays;
            }

            if (current_num_plays === 0)  {
                return;
            }  

            setCurrentEnemy(player_data.dungeon_enemy);
            
            setCurrentLevel(player_data.in_progress);

            setCurrentStatus(current_status);

            setNumXP(player_data.num_wins.toNumber());

            check_user_state.current = false;

            
        } catch(error) {
            console.log(error);
            setCurrentLevel(0);
            setCurrentStatus(DungeonStatus.unknown);
            setCurrentEnemy(DungeonEnemy.None);
        }
        

    }, [wallet, num_plays]);

    // interval for checking state
    useEffect(() => {

        if (state_interval.current === null) {
            state_interval.current = window.setInterval(check_state, 1000);
        }
        else{
            window.clearInterval(state_interval.current);
            state_interval.current = null;
            
        }
        // here's the cleanup function
        return () => {
            if (state_interval.current !== null) {
            window.clearInterval(state_interval.current);
            state_interval.current = null;
            }
        };
    }, [check_state]);

    // reset things when the wallet changes
    useEffect(() => 
    {
        if (DEBUG) {
            console.log("wallet things changed")
        }

        initial_num_plays.current = -1;
        initial_status.current = DungeonStatus.unknown;
        setTransactionFailed(false);
        setScreen(Screen.HOME_SCREEN);
        setCurrentLevel(0);
        setNumPlays(-1);
        setNumXP(0);
        setDataAccountStatus(AccountStatus.unknown);
        setCurrentStatus(DungeonStatus.unknown);
        setPlayerState(DungeonStatus.unknown);
        setCurrentEnemy(DungeonEnemy.None);
        setEnemyState(DungeonStatus.unknown);

        check_data_account.current = true;
        check_user_state.current = true;
        check_sol_balance.current = true;
        signature_check_count.current = 0;

    }, [wallet]);


    
    useEffect(() => 
        {
            if (DEBUG) {
                console.log("in use effect, progress: ", current_level, "enemy", current_enemy, "currentStatus", DungeonStatusString[currentStatus], "num_plays", num_plays, "init num plays", initial_num_plays.current);
            }
      
            if (current_level === 0)
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
            if (num_plays > 1 && num_plays === initial_num_plays.current && data_account_status === AccountStatus.created && currentStatus !== DungeonStatus.alive)
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

        }, [num_plays, current_level, current_enemy, currentStatus, data_account_status]);

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

        setPlayerState(DungeonStatus.unknown);
        setEnemyState(DungeonStatus.unknown);
        


    }, []);


    const Play = useCallback( async () => 
    {
            setProcessingTransaction(true);
            if (DEBUG) {
                console.log("In play");
            }
            let program_data_key = (PublicKey.findProgramAddressSync(["main_data_account"], DUNGEON_PROGRAM))[0];
            let player_data_key = (PublicKey.findProgramAddressSync([wallet.publicKey.toBytes()], DUNGEON_PROGRAM))[0];

            const instruction_data = serialise_play_instruction(DungeonInstruction.play, player_character);

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

                
                let index_buffer = uInt16ToLEBytes(current_key_index);
                let dungeon_key_lookup_account = (PublicKey.findProgramAddressSync([Buffer.from("key_meta"), index_buffer], DUNGEON_PROGRAM))[0];

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
                programId: DUNGEON_PROGRAM,
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

                const send_url = `/.netlify/functions/solana?network=`+network_string+`&function_name=sendTransaction&p1=`+encoded_transaction+"&config=true&p3=skippreflight";
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

                current_signature.current = signature;
                signature_check_count.current = 0;

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
            check_user_state.current = true;
            check_sol_balance.current = true;


    },[wallet, player_character, current_key_index, current_key_mint]);

    const Quit = useCallback( async () => 
    {

            
            setProcessingTransaction(true);
            let program_data_key = (PublicKey.findProgramAddressSync(["main_data_account"], DUNGEON_PROGRAM))[0];
            let player_data_key = (PublicKey.findProgramAddressSync([wallet.publicKey.toBytes()], DUNGEON_PROGRAM))[0];

            const instruction_data = serialise_basic_instruction(DungeonInstruction.quit);

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
                programId: DUNGEON_PROGRAM,
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

                current_signature.current = signature;
                signature_check_count.current = 0;

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
            check_user_state.current = true;
            check_sol_balance.current = true;
            return;
        

    },[wallet]);

    const ApplyKey = useCallback( async () => 
    {

        setDiscountError(null);
 

        let parsed_key_index = parseInt(discount_key_index);
        //console.log("key index", discount_key_index, parsed_key_index, isNaN(parsed_key_index));

        if (isNaN(parsed_key_index))
            return;
        

        // if the string is more than 4 digits this should be a mint address
        let index_buffer = uInt16ToLEBytes(parsed_key_index);

        let dungeon_key_lookup_account = (PublicKey.findProgramAddressSync([Buffer.from("key_meta"), index_buffer], DUNGEON_PROGRAM))[0];

        //console.log("lookup: ", Buffer.from("key_meta"), reversed_buffer);
        let key_meta_data = await request_key_data_from_index(dungeon_key_lookup_account);
        
        // if we have been passed a number check the lookup account exists
        if (key_meta_data === null) {

            let encoded_key_index = bs58.encode(index_buffer);
            const program_accounts_url = `/.netlify/functions/solana?network=`+network_string+`&function_name=getProgramAccounts&p1=`+SHOP_PROGRAM.toString()+`&config=true&encoding=base64&commitment=confirmed&filters=true&data_size_filter=35&memcmp=true&offset=33&bytes=`+encoded_key_index;

            var program_accounts_result;
            try {
                program_accounts_result = await fetch(program_accounts_url).then((res) => res.json());
            }
            catch(error) {
                console.log(error);
            }

            console.log(program_accounts_result["result"]);

            let account_found = false;
            for (let i = 0; i < program_accounts_result["result"].length; i++) {

                let encoded_data = program_accounts_result["result"][i]["account"]["data"][0];
                let decoded_data = Buffer.from(encoded_data, "base64");

                const [data] = KeyDataFromMint.struct.deserialize(decoded_data);


                if (data.key_index !== parsed_key_index)
                    continue;

                account_found = true;

                key_meta_data = data;
            }

            if (!account_found) {
                setDiscountError("Key " + discount_key_index + " has not been minted");
                return;
            }
        
        }

        let key_mint = key_meta_data.key_mint;
        let key_type = key_meta_data.key_type;
        let key_index = parsed_key_index;
    
        // before we go on lets check they actually own the nft
        let key_token_account = await getAssociatedTokenAddress(
            key_mint, // mint
            wallet.publicKey, // owner
            true // allow owner off curve
        );

        let token_amount = await request_token_amount(key_token_account);

        if (token_amount !== 1) {
            setDiscountError("User does not own dungeon key " + key_index.toString());
            return;
        }


        setCurrentKeyType(key_type);
        setCurrentKeyMint(key_mint.toString());
        setCurrentKeyIndex(key_index);

    },[wallet, discount_key_index]);

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

        //console.log("in characterSelect, progress: ", current_level, "enemy", current_enemy, "alive", currentStatus === 0, "num_plays", num_plays,initial_num_plays.current, "dataaccount:", data_account_status, "initial status", initial_status.current, initial_status.current === DungeonStatus.unknown);
            return (
                
                <HStack>
                    {player_character === DungeonCharacter.knight &&
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
                    {player_character !== DungeonCharacter.knight &&
                        <Box  width="100%">
                            <Box>
                                <Button variant='link' size='md' onClick={SelectKnight}>
                                    <img style={{"imageRendering":"pixelated"}} src={knight} width="10000" alt={""}/>
                                </Button>
                            </Box>
                        </Box>
                    }
                    
                    {player_character === DungeonCharacter.ranger &&
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
                    {player_character !== DungeonCharacter.ranger &&
                        <Box  width="100%">
                            <Box>
                                <Button variant='link' size='md' onClick={SelectRanger}>
                                    <img style={{"imageRendering":"pixelated"}} src={ranger} width="10000" alt={""}/>
                                </Button>
                            </Box>
                        </Box>
                    }
                    {player_character === DungeonCharacter.wizard &&
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
                    {player_character !== DungeonCharacter.wizard &&
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

        //console.log("in characterSelect, progress: ", current_level, "enemy", current_enemy, "status", DungeonStatusString[currentStatus], "num_plays", num_plays,  initial_num_plays.current, "dataaccount:", AccountStatusString[data_account_status],  "initial status", DungeonStatusString[initial_status.current], initial_status.current === DungeonStatus.unknown);

        // if i don't need to make an account but player status is unknown return nothing
        if (data_account_status === AccountStatus.created  && (initial_status.current === DungeonStatus.unknown || (num_plays === initial_num_plays.current && currentStatus === DungeonStatus.alive))) {
                visibility = "hidden";
            
        }

        //console.log("have made it here in CS 2");
        // if i am alive or exploring and  the level is > 0 never show this
        if (data_account_status === AccountStatus.unknown ||  (current_level > 0 && currentStatus === DungeonStatus.alive)) {
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
                                    
                                    <DiscountKeyInput/>
                                    
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


    const InDungeon = () =>  {

        var font_size = DEFAULT_FONT_SIZE;
        if (isMobile) {
            font_size = "15px";
        }

        if (DEBUG) {
            console.log("in dungeon: currentStatus ", DungeonStatusString[currentStatus], "player status", DungeonStatusString[player_state], "fulfilled ", current_level, "enemy state", DungeonStatusString[enemy_state], numXP);
        }
        return (
            
        <>
            <Box width="100%">
                    <HStack>
                        <Box width="25%"></Box>  
                        <DisplayLVL current_level={current_level}/>
                        <Box width="30%"></Box>     
                        <DisplayXP current_xp={numXP}/>
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
                    <Box width="15%"> <DisplayPlayer player_state={player_state} player_character={player_character} current_enemy={current_enemy}/></Box>  
                    <Box width="10%"></Box> 
                    <Box width="15%"> <DisplayEnemy player_state={player_state} enemy_state={enemy_state} current_enemy={current_enemy}/> </Box>  
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
                        <DisplayPlayerFailedText current_enemy={current_enemy}/>
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
                {player_state === DungeonStatus.alive && current_level > 0  && 
                    <>
                                      
                    {enemy_state  === DungeonStatus.alive  && 
                        <DisplayEnemyAppearsText current_enemy={current_enemy} current_level={current_level}/>
                    }
                    {enemy_state === DungeonStatus.dead &&

                        <VStack alignItems="center" spacing="2%">
                            <DisplayPlayerSuccessText current_level={current_level} current_enemy={current_enemy}/>

                            {current_level < 7 &&
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
                            {current_level >= 7  &&
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
                                <Text textAlign="center" fontSize={DUNGEON_FONT_SIZE} color="Red">You Have Died<br/><del>{Math.pow(2,current_level - 1) *  BET_SIZE} SOL</del></Text>
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

    return (
        <StateContext.Provider value={[numXP]}>
        <>
            
        <Navigation setScreen={setScreen} check_sol_balance={check_sol_balance}/>

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