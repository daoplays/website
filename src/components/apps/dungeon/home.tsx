import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import {
    ChakraProvider,
    Box,
    Button,
    HStack,
    Center,
    Text,
    VStack,
    Divider,
    NumberInput,
    NumberInputField,
} from '@chakra-ui/react';

import Modal from 'react-bootstrap/Modal';


import {
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverHeader,
    PopoverBody,
    PopoverArrow,
    PopoverCloseButton,
  } from '@chakra-ui/react'

import Select, { StylesConfig }  from 'react-select';
import FocusLock from 'react-focus-lock';

import { isMobile } from "react-device-detect";

//import useSound from 'use-sound';

import { LAMPORTS_PER_SOL, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import {
        getAssociatedTokenAddress
} from "@solana/spl-token";
import {
    WalletProvider,
    useWallet
} from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';

import {
    WalletModalProvider,
    WalletMultiButton,
    useWalletModal
} from '@solana/wallet-adapter-react-ui';

import BN from 'bn.js'
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


//  dungeon constants
import { DEFAULT_FONT_SIZE, DUNGEON_FONT_SIZE, network_string, PROD,
    PYTH_BTC_DEV, PYTH_BTC_PROD, PYTH_ETH_DEV, PYTH_ETH_PROD, PYTH_SOL_DEV, PYTH_SOL_PROD,
    METAPLEX_META, SHOP_PROGRAM, DUNGEON_PROGRAM, SYSTEM_KEY, DEBUG, Screen, DM_PROGRAM, KeyType} from './constants';

// dungeon utils
import { check_json, request_player_account_data, request_key_data_from_index, request_token_amount,
    serialise_play_instruction, serialise_basic_instruction, uInt16ToLEBytes, run_keyData_GPA, post_discord_message} from './utils';

import {DisplayPlayerSuccessText, DisplayPlayerFailedText, DisplayEnemyAppearsText, DisplayEnemy, DisplayPlayer, DisplayXP, DisplayLVL, DungeonEnemy, DungeonCharacter, DungeonStatus, WIN_FACTORS, DungeonCharacterEmoji, DungeonEnemyEmoji, GoldEmoji} from './dungeon_state';

// navigation
import {Navigation} from './navigation';

// dungeon pages
import {FAQScreen} from './faq';
import {OddsScreen} from './odds';
import {HelpScreen} from './help';
import {ShopScreen} from './shop';
import {DMScreen} from './dm';
//import {DungeonScreen} from './dungeon';

import './css/style.css';
import './css/fonts.css';
import './css/wallet.css';
require('@solana/wallet-adapter-react-ui/styles.css');

const enum AccountStatus {
    unknown = 0,
    created = 1,
    not_created = 2
}
//const AccountStatusString = ["unknown", "created", "not_created"];

const DungeonStatusString = ["unknown", "alive", "dead", "exploring"];



const enum BetSize {
    SolanaBet1 = 0,
    SolanaBet2 = 1,
    SolanaBet3 = 2,
}

const BetSizeValues : number[] = [0.05, 0.1, 0.25];

type BetValueObject = Object & {
    value: BetSize,
    label: string
}


const enum DungeonInstruction {
    add_funds = 0,
    play = 1,
    quit = 2,
    explore = 3
}

export function DungeonApp() 
{
    const wallet = useWallet();

    // properties used to set what to display
    const [data_account_status, setDataAccountStatus] = useState<AccountStatus>(AccountStatus.unknown);
    const initial_status = useRef<DungeonStatus>(DungeonStatus.unknown);

    // settings for this game
    const [bet_size, setBetSize] = useState<BetSize>(BetSize.SolanaBet1);
    const [bet_value, setBetValue] = useState<number>(BetSizeValues[0]);
    const [select_value, setSelectValue] = useState<BetValueObject | null>(null);


    const handleBetChange = (selected : BetSize) => {
        setBetSize(selected);
        setBetValue(BetSizeValues[selected])
    }

    // these come from the blockchain
    const [num_plays, setNumPlays] = useState<number>(-1);
    const [numXP, setNumXP] = useState<number>(0);
    const [current_level, setCurrentLevel] = useState<number>(0);
    const [currentStatus, setCurrentStatus] = useState<DungeonStatus>(DungeonStatus.unknown);
    const [current_enemy, setCurrentEnemy] = useState<DungeonEnemy>(DungeonEnemy.None);


    // if we have a key then discounts can be applied
    const [discount_key_index, setDiscountKeyIndex] = useState<string>("")
    const [current_key_type, setCurrentKeyType] = useState<KeyType>(KeyType.Unknown);
    const [current_key_mint, setCurrentKeyMint] = useState<PublicKey | null>(null);
    const [current_key_index, setCurrentKeyIndex] = useState<number | null>(null);

    // error handling on applying the discount
    const [discount_error, setDiscountError] = useState<string | null>(null);
    const [show_discount_error, setShowDiscountError] = useState<boolean>(false);



    const [screen, setScreen] = useState<Screen>(Screen.HOME_SCREEN);

    const [player_character, setWhichCharacter] = useState<DungeonCharacter>(DungeonCharacter.knight);
    const [enemy_state, setEnemyState] = useState<DungeonStatus>(DungeonStatus.unknown);
    const [player_state, setPlayerState] = useState<DungeonStatus>(DungeonStatus.unknown);
    const [animateLevel, setAnimateLevel] = useState<number>(0);

    // refs to hold initial status
    const initial_num_plays = useRef<number>(-1);

    // refs for checking signatures
    const signature_interval = useRef<number | null>(null);
    const current_signature = useRef<string | null>(null);
    const signature_check_count = useRef<number>(0);
    const [transaction_failed, setTransactionFailed] = useState<boolean>(false);


    // refs for setting whether we continue to check state
    const check_data_account = useRef<boolean>(true);
    const check_sol_balance = useRef<boolean>(true);
    const check_user_state = useRef<boolean>(true);
    const state_interval = useRef<number | null>(null);



    //button processing
    const [processing_transaction, setProcessingTransaction] = useState<boolean>(false);


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

    function BetSizeInput() {


        const handleSelectChange = (selected: SelectValue) => {
            let selected_bet = selected as BetValueObject;
            setSelectValue(selected_bet);
            setBetSize(selected_bet.value);
            setBetValue(BetSizeValues[selected_bet.value])
        };


        type SelectValue = BetValueObject | BetValueObject[] | null | undefined;
        
        const colourStyles: StylesConfig<BetValueObject, false> = {
            menu: (base) => ({
                ...base,
                width: "max-content",
                minWidth: "100%"
           }),
            control: (provided) => ({ 
                ...provided,
                backgroundColor: 'black',
                color: 'white'
            }),
            singleValue: (provided) => ({ 
                ...provided,
                fontSize: DUNGEON_FONT_SIZE,
                backgroundColor: 'black',
                color: 'white'
            }),
            placeholder: (provided) => ({ 
                ...provided,
                fontSize: DUNGEON_FONT_SIZE,
                backgroundColor: 'black',
                color: 'white'
            }),
            clearIndicator: (provided) => ({
                ...provided,
                padding: "0px"
            }),
            dropdownIndicator: (provided) => ({
                ...provided,
                padding: "0px"
            }),
            option: (provided, {isFocused}) => {
              return {
                ...provided,
        
                backgroundColor: isFocused ? 'grey' : 'black',
                color: 'white'
              };
              
            },
          };
          
          return(
            <div className="font-face-sfpb">

            {!isMobile &&
                <HStack alignItems="center" spacing="1px">
                    <Box as='button' onClick={() => handleBetChange(BetSize.SolanaBet1)} borderWidth='2px' height={"30px"}  borderColor={bet_size === BetSize.SolanaBet1 ? "white" : "black"}  width={"60px"}>
                            <Text  align="center" fontSize={DUNGEON_FONT_SIZE} color="white">{BetSizeValues[0]}</Text>
                    </Box>
                    <Box as='button' onClick={() => handleBetChange(BetSize.SolanaBet2)} height={"30px"}  borderWidth='2px'borderColor={bet_size === BetSize.SolanaBet2 ? "white" : "black"}  width={"60px"}>
                            <Text  align="center" fontSize={DUNGEON_FONT_SIZE} color="white">{BetSizeValues[1]}</Text>
                    </Box>
                    <Box as='button' onClick={() => handleBetChange(BetSize.SolanaBet3)} height={"30px"}  borderWidth='2px' borderColor={bet_size === BetSize.SolanaBet3 ? "white" : "black"}  width={"60px"}>
                            <Text  align="center" fontSize={DUNGEON_FONT_SIZE} color="white">{BetSizeValues[2]}</Text>
                    </Box>
                    <Box borderWidth='2px'  borderColor="black" height={"30px"} width={"60px"}>
                        <Text  align="center" fontSize={DUNGEON_FONT_SIZE} color="white">SOL</Text>
                    </Box>
                </HStack>
            }
            {isMobile &&
                    <Select 
                    placeholder={BetSizeValues[0] + ' SOL'}
                    styles={colourStyles}
                    isSearchable={false}
                    onChange={(choice: SelectValue) => {handleSelectChange(choice)}}
                    value={select_value}
                    options = {[
                        { value: BetSize.SolanaBet1, label: BetSizeValues[0] + ' SOL' },
                        { value: BetSize.SolanaBet2, label: BetSizeValues[1] + ' SOL' },
                        { value: BetSize.SolanaBet3, label: BetSizeValues[2] + ' SOL' }
                    ]}      
                /> 
            }
            </div>

          );
    }
    

    function DiscountKeyInput() {

    let key_size = "50";
    if(isMobile) {
        key_size = "40";
    }

    return (
        <>
    <div style={{marginTop : "1rem"}}></div>
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
        <PopoverContent backgroundColor={"black"} >
            <div className="font-face-sfpb" color="white">
                <PopoverHeader  style={{borderBottomWidth:0}} fontSize={DUNGEON_FONT_SIZE} color="white" fontWeight='semibold' ml="2rem" mr="2rem">Enter Key Number</PopoverHeader>
            </div>
            <PopoverArrow />
            <PopoverCloseButton ml="1rem" color="white"/>
            <PopoverBody>
                <FocusLock returnFocus persistentFocus={false}>
                <VStack align="center">
                    <div className="font-face-sfpb">                                           
                    <NumberInput 
                        fontSize={DUNGEON_FONT_SIZE} 
                        color="white"
                        size="lg"
                        onChange={(valueString) => setDiscountKeyIndex(valueString)}
                        value={discount_key_index}
                        precision={0}
                        borderColor="white"
                        min={1} max={3500}>
                        
                        
                        <NumberInputField
                        height={DUNGEON_FONT_SIZE} 
                        paddingTop="1rem"
                        paddingBottom="1rem"
                        borderColor="white"
                        />
                    </NumberInput>
                    </div>
                    <div className="font-face-sfpb">

                        <Button variant='link' size='md'  color="white" onClick={ApplyKey}> 
                            Apply
                        </Button> 
                        
                    </div>    
                    
                </VStack>
                {discount_error &&
                <>
                    <Divider mt = "1rem" mb = "1rem"/>
                    <div className="font-face-sfpb">
                        <Text color="white" >
                        {discount_error}
                        </Text>
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

    function Disclaimer() {
        const [show, setShow] = useState(false);
      
        const handleClose = () => setShow(false);
        const handleShow = () => setShow(true);

        const { setVisible } = useWalletModal();

        const handleConnectWallet = useCallback(async () => {
            setShow(false);
            setVisible(true);
        }, [setVisible, setShow]);

        return (
          <>
            <Box as='button' onClick={handleShow}>
                <div className="font-face-sfpb">
                    <Text style={{textDecoration: "underline"}} fontSize={DEFAULT_FONT_SIZE} textAlign="center" color="white">CONNECT<br/>WALLET</Text>      
                </div> 
            </Box> 
            
            <Modal centered show={show} onHide={handleClose} >
            <div className="font-face-sfpb">
              <Modal.Header style={{backgroundColor: "black"}}  closeButton>
              
                <Modal.Title  style={{"fontSize":30, "color":"white", "fontWeight":'semibold'}}>DISCLAIMER</Modal.Title>
                
              </Modal.Header>
              </div>
              <div className="font-face-sfpb text-center">
             
              <Modal.Body style={{"backgroundColor": "black", "fontSize":20, "color":"white", "fontWeight":'semibold'}}>I confirm online gambling is not forbidden in my jurisdiction and I'm at least 18 years old</Modal.Body>
             
              </div>
             
              <Modal.Footer style={{alignItems: "center", justifyContent: "center","backgroundColor": "black"}} >
                <Box as='button' onClick={handleConnectWallet}>
                    <div className="font-face-sfpb">
                        <Text style={{textDecoration: "underline"}} fontSize={DEFAULT_FONT_SIZE} textAlign="center" color="white">CONFIRM</Text>      
                    </div> 
                </Box> 
              </Modal.Footer>
            </Modal>
          </>
        );
      }
    

    const CheckSignature = useCallback(async() =>
    {
        
        if (current_signature.current === null)
            return;

        const confirm_url = `/.netlify/functions/solana_sig_status?network=`+network_string+`&function_name=getSignatureStatuses&p1=`+current_signature.current;
        var signature_response = await fetch(confirm_url).then((res) => res.json());

        if (DEBUG) 
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
        else {
            signature_check_count.current += 1;
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
                if (current_status === DungeonStatus.alive && player_data.in_progress > 0) {
                    let current_bet_value_bn = new BN(player_data.current_bet_size);
                    let current_bet_value = current_bet_value_bn.toNumber() / LAMPORTS_PER_SOL;
                    setBetValue(current_bet_value);
                    console.log("setting current status to alive", current_bet_value);
                }
            }

            let current_num_plays = (new BN(player_data.num_plays)).toNumber();

            if (current_num_plays <= num_plays) {
                if (DEBUG) {
                    console.log("num plays not increased", current_num_plays);
                }
                return;
            }

            setNumPlays(current_num_plays);

            let current_num_wins = (new BN(player_data.num_wins)).toNumber();

            if (DEBUG) {
                console.log("in init, progress: ", player_data.in_progress, "enemy", player_data.dungeon_enemy, "alive", DungeonStatusString[player_data.player_status + 1], "num_plays", current_num_plays, "num_wins", current_num_wins);
            }

            if (initial_num_plays.current ===  -1) {
                initial_num_plays.current =  current_num_plays;
            }

            if (current_num_plays === 0)  {
                return;
            }  

            setWhichCharacter(player_data.player_character);

            setCurrentEnemy(player_data.dungeon_enemy);
            
            setCurrentLevel(player_data.in_progress);

            setCurrentStatus(current_status);

            setNumXP(current_num_wins);

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

            if (currentStatus === DungeonStatus.alive) {
                setScreen(Screen.DUNGEON_SCREEN);
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

                // create the string we will post to discord
                let post_string = DungeonCharacterEmoji[player_character]

                // player killed enemy
                if (animateLevel === 1) {
                    if (DEBUG) {
                        console.log("player killed enemy");
                    }
                    setPlayerState(DungeonStatus.alive);
                    setEnemyState(DungeonStatus.dead);
                    post_string += " defeated ";
                }
                // enemy killed player
                else {
                    if (DEBUG) {
                        console.log("enemy killed player")
                    }
                    setPlayerState(DungeonStatus.dead);
                    setEnemyState(DungeonStatus.alive);
                    post_string += " was killed by ";
                }
                post_string += DungeonEnemyEmoji[current_enemy] + " in level " + current_level;

                if (current_level > 0)
                    post_discord_message(post_string);

                setAnimateLevel(0);
                }, 5000);
                return () => clearTimeout(timer);
        

    }, [animateLevel, player_character, current_enemy, current_level]);

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
        setTransactionFailed(false);

        if (wallet.publicKey === null || wallet.signTransaction === undefined)
            return;

        setProcessingTransaction(true);
        if (DEBUG) {
            console.log("In play", bet_size, BetSizeValues[bet_size]);
        }
        let program_data_key = (PublicKey.findProgramAddressSync([Buffer.from("main_data_account")], DUNGEON_PROGRAM))[0];
        let player_data_key = (PublicKey.findProgramAddressSync([wallet.publicKey.toBytes()], DUNGEON_PROGRAM))[0];

        const instruction_data = serialise_play_instruction(DungeonInstruction.play, player_character, bet_size);

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

        if (current_key_mint && current_key_index) {

            let dungeon_key_meta_account = (PublicKey.findProgramAddressSync([Buffer.from("key_meta"), current_key_mint.toBuffer()], SHOP_PROGRAM))[0];

            
            let index_buffer = uInt16ToLEBytes(current_key_index);
            let dungeon_key_lookup_account = (PublicKey.findProgramAddressSync([Buffer.from("key_meta"), index_buffer], DUNGEON_PROGRAM))[0];

            let key_token_account = await getAssociatedTokenAddress(
                current_key_mint, // mint
                wallet.publicKey, // owner
                true // allow owner off curve
            );

            let dungeon_key_metaplex_account = (PublicKey.findProgramAddressSync([Buffer.from("metadata"),
                METAPLEX_META.toBuffer(), current_key_mint.toBuffer()], METAPLEX_META))[0];


            
            // accounts for discount key
            account_vector.push({pubkey: current_key_mint, isSigner: false, isWritable: false});
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


    },[wallet, player_character, current_key_index, current_key_mint, bet_size]);

    const Quit = useCallback( async () => 
    {

        setTransactionFailed(false);
        if (wallet.publicKey === null || wallet.signTransaction === undefined)
            return;
        
        setProcessingTransaction(true);
        let program_data_key = (PublicKey.findProgramAddressSync([Buffer.from("main_data_account")], DUNGEON_PROGRAM))[0];
        let player_data_key = (PublicKey.findProgramAddressSync([wallet.publicKey.toBytes()], DUNGEON_PROGRAM))[0];
        let dm_data_key = (PublicKey.findProgramAddressSync([Buffer.from("data_account")], DM_PROGRAM))[0];

        const instruction_data = serialise_basic_instruction(DungeonInstruction.quit);

        var account_vector  = [
            {pubkey: wallet.publicKey, isSigner: true, isWritable: true},
            {pubkey: player_data_key, isSigner: false, isWritable: true},
            {pubkey: program_data_key, isSigner: false, isWritable: true},

            {pubkey: SYSTEM_KEY, isSigner: false, isWritable: false},

            {pubkey: DM_PROGRAM, isSigner: false, isWritable: false},
            {pubkey: dm_data_key, isSigner: false, isWritable: true}
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

            const send_url = `/.netlify/functions/solana?network=`+network_string+`&function_name=sendTransaction&p1=`+encoded_transaction+"&config=true&p3=skippreflight";
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

        // send a discord message
        let current_win = WIN_FACTORS[current_level] * BetSizeValues[bet_size];
        let exit_string = current_level === 7 ? "retired at" : "escaped from";
        let post_string = DungeonCharacterEmoji[player_character] + " has " + exit_string + " level " + current_level + " with " + current_win.toFixed(3) + " SOL " + GoldEmoji;
        post_discord_message(post_string);

        return;
    

    },[wallet, player_character, current_level, bet_size]);

    const ApplyKey = useCallback( async () => 
    {

        if (wallet.publicKey === null)
            return;

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

            key_meta_data = await run_keyData_GPA(parsed_key_index);

            if (key_meta_data === null) {
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
        setCurrentKeyMint(key_mint);
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

    const SelectKnight = useCallback( async () => 
    {
        setWhichCharacter(DungeonCharacter.knight);
    },[]);

    const SelectRanger = useCallback( async () => 
    {
        setWhichCharacter(DungeonCharacter.ranger);
    },[]);

    const SelectWizard = useCallback( async () => 
    {
        setWhichCharacter(DungeonCharacter.wizard);
    },[]);

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
                                
                                <Disclaimer/>
                                
                            </Box>  
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

        var visible = true;

        //console.log("in characterSelect, progress: ", current_level, "enemy", current_enemy, "status", DungeonStatusString[currentStatus], "num_plays", num_plays,  initial_num_plays.current, "dataaccount:", AccountStatusString[data_account_status],  "initial status", DungeonStatusString[initial_status.current]);

        // if i don't need to make an account but player status is unknown return nothing
        if (data_account_status === AccountStatus.created  && (initial_status.current === DungeonStatus.unknown || (num_plays === initial_num_plays.current && currentStatus === DungeonStatus.alive && current_level > 0))) {
            visible = false;
            
        }

        //console.log("have made it here in CS 2");
        // if i am alive or exploring and  the level is > 0 never show this
        if (data_account_status === AccountStatus.unknown ||  (current_level > 0 && currentStatus === DungeonStatus.alive)) {
            visible = false;
            
        }
        //console.log("have made it here in CS");
        return (
            <>
            <Box width="100%">
                <Center>
                    <VStack alignItems="center" spacing="3%" mt="2%">  
                        <HStack alignItems="center" spacing="1%" >
                            <Box width="27%" visibility={visible ? "visible" : "hidden"}>
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
                            <Box width="27%" visibility={visible ? "visible" : "hidden"}>
                                <VStack align="center">
                                    <div className="font-face-sfpb">
                                        <Button variant='link' size='md' onClick={Play}>
                                        <img style={{"imageRendering":"pixelated"}} src={enter_button} width={"60%"} alt={""}/>
                                        </Button> 
                                    </div> 
                                    <BetSizeInput/>


                                    <DiscountKeyInput/>
                                    
                                </VStack>
                            </Box>  
                        </HStack>
                        <HStack visibility={visible ? "visible" : "hidden"}>
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
                        <DisplayPlayerFailedText current_enemy={current_enemy} current_level={current_level} num_plays={num_plays}/>
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
                        <DisplayEnemyAppearsText current_enemy={current_enemy} current_level={current_level} num_plays={num_plays}/>
                    }
                    {enemy_state === DungeonStatus.dead &&

                        <VStack alignItems="center" spacing="2%">
                            <DisplayPlayerSuccessText current_level={current_level} current_enemy={current_enemy} bet_size={bet_value} num_plays={num_plays}/>

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
                                <Text textAlign="center" fontSize={DUNGEON_FONT_SIZE} color="Red">You Have Died<br/><del>{(WIN_FACTORS[current_level - 1] *  bet_value).toFixed(3)} SOL</del></Text>
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
                            <ShopScreen num_xp={numXP}/>
                        }
                        {screen === Screen.DM_SCREEN &&
                            <DMScreen/>
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
                            <ShopScreen num_xp={numXP}/>
                        }
                        {screen === Screen.HELP_SCREEN &&
                            <HelpScreen/>
                        }
                        {screen === Screen.DM_SCREEN &&
                            <DMScreen/>
                        }
                        </>
                    }                    
                
                </VStack>               
            </Center>
        </Box>
        </>
    );
}

function Home() {
    const wallets = useMemo(() => 
    [
        new PhantomWalletAdapter(),
    ],
    []
  );
  document.body.setAttribute('style', 'background: black;');
    return (

        <ChakraProvider>
                <WalletProvider wallets={wallets} autoConnect>
                    <WalletModalProvider>
                        <DungeonApp />
                    </WalletModalProvider>
                </WalletProvider>
        </ChakraProvider>

    );
}

export default Home;