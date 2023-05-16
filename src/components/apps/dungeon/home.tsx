import { useCallback, useEffect, useState, useMemo, useRef, useContext } from 'react';
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

import 'react-h5-audio-player/lib/styles.css'

import { LAMPORTS_PER_SOL, Keypair, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import {
        TOKEN_PROGRAM_ID,
        getAssociatedTokenAddress,
        ASSOCIATED_TOKEN_PROGRAM_ID
} from "@solana/spl-token";

import {
    WalletProvider,
    useWallet
} from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter, SolflareWalletAdapter, BackpackWalletAdapter } from '@solana/wallet-adapter-wallets';

import {
    WalletModalProvider,
    useWalletModal
} from '@solana/wallet-adapter-react-ui';

import BN from 'bn.js'
import bs58 from "bs58";


import dungeon_title from "./images/Dungeon_Logo.png"
import arena_title from "./images/Arena_Logo.png"

import large_door from "./images/Large_Door.gif"
import hallway from "./images/Hallway.gif"
import hallway2 from "./images/Hallway2.gif"

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
import { DEFAULT_FONT_SIZE, DUNGEON_FONT_SIZE, PROD,
    PYTH_BTC_DEV, PYTH_BTC_PROD, PYTH_ETH_DEV, PYTH_ETH_PROD, PYTH_SOL_DEV, PYTH_SOL_PROD,
    METAPLEX_META, SHOP_PROGRAM, DUNGEON_PROGRAM, SYSTEM_KEY, DEBUG, Screen, DM_PROGRAM, KeyType, MAIN_ACCOUNT_SEED} from './constants';

// dungeon utils
import { request_player_account_data, request_key_data_from_index, request_token_amount,
    serialise_play_instruction, serialise_basic_instruction, uInt16ToLEBytes, run_keyData_GPA, post_discord_message, request_player_achievement_data, serialise_claim_achievement_instruction, get_JWT_token, get_current_blockhash, send_transaction, check_signature, request_current_balance, AchievementData, NewDiscordMessage} from './utils';

import {DisplayPlayerSuccessText, DisplayPlayerFailedText, DisplayEnemyAppearsText, DisplayEnemy, DisplayPlayer, DisplayXP, DisplayLVL, DungeonEnemy, DungeonCharacter, DungeonStatus, WIN_FACTORS, DungeonCharacterEmoji, DungeonEnemyEmoji, GoldEmoji} from './dungeon_state';

import { AchievementCard, AchievementMetaData } from './achievements';

// navigation
import {Navigation} from './navigation';

// dungeon pages
import {FAQScreen} from './faq';
import {OddsScreen} from './odds';
import {HelpScreen} from './help';
import {ShopScreen} from './shop';
import {DMScreen} from './dm';
import { AchievementsScreen } from './achievements';
import {StatsScreen} from './stats';
import { Footer } from './footer';
import { MarketplaceScreen } from './marketplace';
import { ArenaScreen } from './arena';

//import {DungeonScreen} from './dungeon';

import wagerSelect from './sounds/Wager_Select.mp3'
import classSelect from './sounds/Class_Select.mp3'
import dungeonTile from './sounds/Open_Door.mp3'
import Retry from './sounds/Retry.mp3'
import Torch from './sounds/Torch.mp3'
import Escape from './sounds/Escape.mp3'
import Game_Over from './sounds/Game_Over.mp3'
import Player_Death from './sounds/Player_Death.mp3'
import Victory from './sounds/Victory.mp3'
import { MuteContext, MuteProvider } from './mute';


import './css/style.css';
import './css/fonts.css';
import './css/wallet.css';
require('@solana/wallet-adapter-react-ui/styles.css');

// free play mint
const FREE_PLAY_MINT = new PublicKey('4JxGUVRp6CRffKpbtnSCZ4Z5dHqUWMZSxMuvFd7fG3nC');

// achievement collection
const ACHIEVEMENTS_COLLECTION_MASTER = new PublicKey('72Lwj7RDVN4yzCzUsZnvRF4Nav8Z8rVXB2fYzrkWLbHk');
const ACHIEVEMENTS_COLLECTION_META = new PublicKey('FzbP3YEELyR1aMspJF9KgVAmTM7AJ2q8Y1ervqP3Wcq');
const ACHIEVEMENTS_COLLECTION_MINT = new PublicKey('3pA2AKFXzj9DspM6iinzcsdx5rW9pQdiNJY4eYvz126Q');

const ACHIEVEMENT_SEED = "achievements_s1";

const enum AccountStatus {
    unknown = 0,
    created = 1,
    not_created = 2
}
//const AccountStatusString = ["unknown", "created", "not_created"];

const DungeonStatusString = ["unknown", "alive", "dead", "exploring"];

const wagerSelectAudio = new Audio(wagerSelect)
const classSelectAudio = new Audio(classSelect)
const dungeonTileAudio = new Audio(dungeonTile)
const GameOverAudio = new Audio(Game_Over)
const EscapeAudio = new Audio(Escape)
const TorchAudio = new Audio(Torch)
const RetryAudio = new Audio(Retry)
const VictoryAudio = new Audio(Victory)
const PlayerDeathAudio = new Audio(Player_Death)

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
    explore = 3,
    claim_achievement = 4
}

export function DungeonApp() 
{
    const wallet = useWallet();

    // bearer token used to authorise RPC requests
    const [bearer_token, setBearerToken] = useState<string>("");
    const bearer_interval = useRef<number | null>(null);

    // properties used to set what to display
    const [data_account_status, setDataAccountStatus] = useState<AccountStatus>(AccountStatus.unknown);
    const initial_status = useRef<DungeonStatus>(DungeonStatus.unknown);

    // settings for this game
    const [bet_size, setBetSize] = useState<BetSize>(BetSize.SolanaBet1);
    const [bet_value, setBetValue] = useState<number>(BetSizeValues[0]);
    const [select_value, setSelectValue] = useState<BetValueObject | null>(null);


    const handleBetChange = (selected : BetSize) => {
        
        if (!isMuted) wagerSelectAudio.play()
        setBetSize(selected);
        setBetValue(BetSizeValues[selected])
    }

    // these come from the blockchain
    const [num_plays, setNumPlays] = useState<number>(-1);
    const [numXP, setNumXP] = useState<number>(0);
    const [current_level, setCurrentLevel] = useState<number>(0);
    const [currentStatus, setCurrentStatus] = useState<DungeonStatus>(DungeonStatus.unknown);
    const [current_enemy, setCurrentEnemy] = useState<DungeonEnemy>(DungeonEnemy.None);

    // achievement state
    const [which_achievement, setWhichAchievement] = useState<number | null>(null);
    const [show_achievement, setShowAchievement] = useState<boolean>(false);
    const [achievement_status, setAchievementStatus] = useState<number[] | null>(null);
    const [achievement_data, setAchievementData] = useState<AchievementData | null>(null);
    const [new_achievements, setNewAchievements] = useState<number[] | null>(null);
    const new_achievements_ref = useRef<number[]>([]);
    const achievement_interations = useRef<number>(-1);


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
    
    // animateLevel becomes a useRef
    const animateLevel = useRef(0);

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
    const check_achievements = useRef<boolean>(true);
    const state_interval = useRef<number | null>(null);


   


    //button processing
    const [processing_transaction, setProcessingTransaction] = useState<boolean>(false);

    // discord processing
    const discord_play_message_sent = useRef<boolean>(false);

    // Checking Mute state
    const { isMuted } = useContext(MuteContext);


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

     
      


    const CheckNewQuitAchievements = useCallback( async () => 
    {
        if (achievement_status === null)
            return;

        let temp_new : number[] = [];
        for (let i = 0; i < achievement_status.length; i++) {
            if (achievement_status[i] === 2 && AchievementMetaData[i].type === 1) {
                temp_new.push(i);
            }
        }
        setNewAchievements(temp_new);
        new_achievements_ref.current = temp_new;
        return;
        
    },[achievement_status]);

    useEffect(() => 
    {
      CheckNewQuitAchievements();

    }, [achievement_status, CheckNewQuitAchievements]);


    const CheckNewPlayAchievements = useCallback( async () => 
    {
        if (achievement_status === null)
            return;

        let temp_new : number[] = [];
        for (let i = 0; i < achievement_status.length; i++) {
            if (achievement_status[i] === 2 && AchievementMetaData[i].type === 0) {
               temp_new.push(i);
            }
        }
        setNewAchievements(temp_new);
        new_achievements_ref.current = temp_new;
        return;
        
    },[achievement_status]);

    useEffect(() => 
    {
        if (show_achievement === true || new_achievements_ref.current.length === 0)
            return;


        for (let i = 0; i < new_achievements_ref.current.length; i++) {
            if (DEBUG)
                console.log("Have achievement", i, AchievementMetaData[i].name, AchievementMetaData[i].description);
        }

        setWhichAchievement(new_achievements_ref.current[0]);
        setShowAchievement(true);

    }, [new_achievements, show_achievement]);


    function AchievementsModal() {
      
        const handleClose = () => {setShowAchievement(false)};
        if (which_achievement === null || show_achievement === false)
            return(<></>);

        if (new_achievements !== null && new_achievements.length !== 0) {
            let temp_new = new_achievements;
            temp_new.shift();
            new_achievements_ref.current = temp_new;
        }

        return (
          <>
            
            <Modal centered show={show_achievement} animation={true} onHide={handleClose} >
            <div className="font-face-sfpb">
              <Modal.Header style={{backgroundColor: "black"}}  closeButton>
              
                <Modal.Title  style={{"fontSize":30, "color":"white", "fontWeight":'semibold'}}>Achievement Unlocked!</Modal.Title>
                
              </Modal.Header>
              </div>
              <div className="font-face-sfpb text-center">
             
              <Modal.Body style={{"backgroundColor": "black", "fontSize":20, "color":"white", "fontWeight":'semibold'}}>
                
                    <AchievementCard index={which_achievement} AchievementState={achievement_status}  show_mint={false} ClaimAchievement={ClaimAchievement}/>
                </Modal.Body>
             
              </div>
             
              <Modal.Footer style={{alignItems: "center", justifyContent: "center","backgroundColor": "black"}} >
                <Box as='button' onClick={(e : any) => ClaimAchievement(which_achievement)}>
                    <div className="font-face-sfpb">
                        <Text style={{textDecoration: "underline"}} fontSize={DEFAULT_FONT_SIZE} textAlign="center" color="white">Claim Achievement</Text>      
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

        let signature_response = await check_signature(bearer_token, current_signature.current);

        if (signature_response === null) {
            return;
        }

        //console.log(signature_response);
        let confirmation = signature_response.result?.value[0];
        
        if (confirmation !== null) {

            if (confirmation?.err !== null) {
                console.log("error: ", confirmation?.err);
                setTransactionFailed(true);
            }
            else {
                setTransactionFailed(false);
            }

            current_signature.current = null;
            signature_check_count.current = 0;
            setProcessingTransaction(false);
        }
        else {
            signature_check_count.current += 1;
        }
        if (signature_check_count.current >= 10) {
            setTransactionFailed(true);
            setProcessingTransaction(false);
            current_signature.current = null;
            signature_check_count.current = 0;
        }

    }, [bearer_token]);

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

        if (bearer_token === "") {
            console.log("no bearer token set in check_state");
            return;
        }

        if (DEBUG) {
            console.log("in in it check_updates ", check_user_state.current, " check balance: ", check_data_account.current);
        }

        if (!wallet.publicKey) {
            return;
        }

        if (!check_user_state.current && !check_data_account.current && !check_achievements.current)
            return;

        let player_data_key = (PublicKey.findProgramAddressSync([wallet.publicKey.toBytes()], DUNGEON_PROGRAM))[0];

        if (check_data_account.current) {
            
            // first check if the data account exists
            try {

                let balance = await request_current_balance(bearer_token, player_data_key);
               
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
        

        if (check_user_state.current) {

            try {

                let player_data = await request_player_account_data(bearer_token, player_data_key);

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
                        //console.log("setting current status to alive", current_bet_value);
                    }
                }

                let current_num_plays = (new BN(player_data.num_plays)).toNumber();

                if (current_num_plays <= num_plays) {
                    if (DEBUG) {
                        console.log("num plays not increased", current_num_plays);
                    }
                    return;
                }

                if (current_status === DungeonStatus.alive && player_data.in_progress > 0) {
                    let current_bet_value_bn = new BN(player_data.current_bet_size);
                    let current_bet_value = current_bet_value_bn.toNumber() / LAMPORTS_PER_SOL;
                    setBetValue(current_bet_value);
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
        }

        if (check_achievements.current) {

            if (DEBUG) {
                console.log("check achievement status");
            }

            try {
                // get the achievement data
                let achievement_data_key = (PublicKey.findProgramAddressSync([wallet.publicKey.toBytes(), Buffer.from(ACHIEVEMENT_SEED)], DUNGEON_PROGRAM))[0];
                let achievement_data = await request_player_achievement_data(bearer_token, achievement_data_key);

                if (achievement_data !== null) {

                    if (DEBUG) {
                        console.log(achievement_data);
                        console.log(achievement_data.n_interactions,  achievement_interations.current);
                    }

                    if (achievement_data.n_interactions >= achievement_interations.current) {

                        if (DEBUG) {
                            console.log("update achievement state");
                        }

                        setAchievementData(achievement_data);
                        setAchievementStatus(achievement_data.achievement_state);
                        achievement_interations.current = achievement_data.n_interactions;
                        check_achievements.current = false;

                    }
                }
                else {
                    setAchievementStatus(null);
                    setAchievementData(null);
                    check_achievements.current = false;
                }
                
            } catch(error) {
                console.log(error);
                setAchievementStatus(null);
                setAchievementData(null);
            }
        }
        

    }, [wallet, num_plays, bearer_token]);

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
        setAchievementStatus(null);
        setAchievementData(null);
        achievement_interations.current = -1;

        check_data_account.current = true;
        check_user_state.current = true;
        check_sol_balance.current = true;
        check_achievements.current = true;
        signature_check_count.current = 0;

    }, [wallet]);


    
    useEffect(() => 
        {
            if (DEBUG) {
                console.log("in use effect, progress: ", current_level, "enemy", current_enemy, "currentStatus", DungeonStatusString[currentStatus], "num_plays", num_plays, "init num plays", initial_num_plays.current);
            }
      
            if (current_level === 0)
                return;

            if (check_user_state.current === false && screen === Screen.HOME_SCREEN && current_level > 0 && currentStatus === DungeonStatus.alive) {
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
                animateLevel.current=1
            }
            else {
                animateLevel.current=2
            }

        }, [num_plays, current_level, current_enemy, currentStatus, data_account_status, screen]);

        
        
        // New function to handle animation
        const handleAnimation = useCallback((level:number) => {
            if (level === 0) {
                return;
            }
            const timer = setTimeout(() => {
                if (level === 1) {
                    if (DEBUG) {
                        console.log("player killed enemy");
                    }
                    setPlayerState(DungeonStatus.alive);
                    setEnemyState(DungeonStatus.dead);
        
                    //Victory sound plays

                    if (!isMuted) {
                        try {
                            VictoryAudio.play()
                        } catch (error) {
                          console.log("Failed to play audio");
                        }
                      }
        
                } else {
                    if (DEBUG) {
                        console.log("enemy killed player")
                    }
                    setPlayerState(DungeonStatus.dead);
                    setEnemyState(DungeonStatus.alive);

                    if (!isMuted) {
                        try {
                          PlayerDeathAudio.play()
                        } catch (error) {
                          console.log("Failed to play audio");
                        }
                      }
                }
        
                if (current_level > 0 && PROD && discord_play_message_sent.current === false) {
                    const message: NewDiscordMessage = {
                        message_type: level === 1 ? "defeated" : "killed_by",
                        emoji_1: DungeonCharacterEmoji[player_character],
                        emoji_2: DungeonEnemyEmoji[current_enemy],
                        level: current_level,
                        sol_amount: 0,
                        achievement_name: ""
                    };
        
                    post_discord_message(message);
                    discord_play_message_sent.current = true;
                }
        
                animateLevel.current = 0;
                CheckNewPlayAchievements()
            }, 5000);
        
            return () => clearTimeout(timer);
        },[isMuted, current_level, player_character, current_enemy, CheckNewPlayAchievements])
        
        // Replace the previous useEffect with this one
        useEffect(() => {
            handleAnimation(animateLevel.current);
        }, [handleAnimation]);


    

    const set_JWT_token = useCallback(async () => 
    { 
        console.log("Setting new JWT token");
        let token = await get_JWT_token();
        setBearerToken(token["token"]);

    }, []);

    // interval for checking JWT
    useEffect(() => {

        let one_second = 1000;
        if (bearer_interval.current === null) {
            bearer_interval.current = window.setInterval(set_JWT_token, one_second * 60 * 5);
        }
        else{
            window.clearInterval(bearer_interval.current);
            bearer_interval.current = null;
            
        }
        // here's the cleanup function
        return () => {
            if (bearer_interval.current !== null) {
            window.clearInterval(bearer_interval.current);
            bearer_interval.current = null;
            }
        };
    }, [set_JWT_token]);

    useEffect(() => 
    {
        if (DEBUG) {
            console.log("In initial use effect");
        }

        set_JWT_token();
        setPlayerState(DungeonStatus.unknown);
        setEnemyState(DungeonStatus.unknown);
        


    }, [set_JWT_token]);

    const handleEnterBtn = ()=>{
        if (!isMuted) dungeonTileAudio.play()
    }

    const Play = useCallback( async () => 
    {
       
        
        setTransactionFailed(false);

        if (wallet.publicKey === null || wallet.signTransaction === undefined)
            return;

        setProcessingTransaction(true);
        if (DEBUG) {
            console.log("In play", bet_size, BetSizeValues[bet_size]);
        }
        let program_data_key = (PublicKey.findProgramAddressSync([Buffer.from(MAIN_ACCOUNT_SEED)], DUNGEON_PROGRAM))[0];
        let player_data_key = (PublicKey.findProgramAddressSync([wallet.publicKey.toBytes()], DUNGEON_PROGRAM))[0];
        let player_achievement_key = (PublicKey.findProgramAddressSync([wallet.publicKey.toBytes(), Buffer.from(ACHIEVEMENT_SEED)], DUNGEON_PROGRAM))[0];

        const instruction_data = serialise_play_instruction(DungeonInstruction.play, player_character, bet_size);

        var account_vector  = [
            {pubkey: wallet.publicKey, isSigner: true, isWritable: true},
            {pubkey: player_data_key, isSigner: false, isWritable: true},
            {pubkey: player_achievement_key, isSigner: false, isWritable: true}

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

        // next 3 accounts are for the free play tokens
        account_vector.push({pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false});
        account_vector.push({pubkey: FREE_PLAY_MINT, isSigner: false, isWritable: true});

        let free_play_token_account = await getAssociatedTokenAddress(
            FREE_PLAY_MINT, // mint
            wallet.publicKey, // owner
            true // allow owner off curve
        );

        account_vector.push({pubkey: free_play_token_account, isSigner: false, isWritable: true});



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

        let txArgs = await get_current_blockhash(bearer_token);

        let transaction = new Transaction(txArgs);
        transaction.feePayer = wallet.publicKey;


        transaction.add(play_instruction);

        try {
            let signed_transaction = await wallet.signTransaction(transaction);
            const encoded_transaction = bs58.encode(signed_transaction.serialize());

            var transaction_response = await send_transaction(bearer_token, encoded_transaction);
            
            if (transaction_response.result === "INVALID") {
                console.log(transaction_response)
                setProcessingTransaction(false);
                return;
            }

            let signature = transaction_response.result;

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
        //setProcessingTransaction(false);
        check_user_state.current = true;
        check_sol_balance.current = true;
        check_achievements.current = true;
        discord_play_message_sent.current = false;

    },[wallet, player_character, current_key_index, current_key_mint, bet_size, bearer_token]);

    const Quit = useCallback( async () => 
    {

        setTransactionFailed(false);
        if (wallet.publicKey === null || wallet.signTransaction === undefined)
            return;
        
        setProcessingTransaction(true);
        let program_data_key = (PublicKey.findProgramAddressSync([Buffer.from(MAIN_ACCOUNT_SEED)], DUNGEON_PROGRAM))[0];
        let player_data_key = (PublicKey.findProgramAddressSync([wallet.publicKey.toBytes()], DUNGEON_PROGRAM))[0];
        let dm_data_key = (PublicKey.findProgramAddressSync([Buffer.from("data_account")], DM_PROGRAM))[0];
        let player_achievement_key = (PublicKey.findProgramAddressSync([wallet.publicKey.toBytes(), Buffer.from(ACHIEVEMENT_SEED)], DUNGEON_PROGRAM))[0];


        const instruction_data = serialise_basic_instruction(DungeonInstruction.quit);

        var account_vector  = [
            {pubkey: wallet.publicKey, isSigner: true, isWritable: true},
            {pubkey: player_data_key, isSigner: false, isWritable: true},
            {pubkey: player_achievement_key, isSigner: false, isWritable: true},
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

        let txArgs = await get_current_blockhash(bearer_token);

        let transaction = new Transaction(txArgs);
        transaction.feePayer = wallet.publicKey;


        transaction.add(quit_instruction);

        try {
            let signed_transaction = await wallet.signTransaction(transaction);
            const encoded_transaction = bs58.encode(signed_transaction.serialize());

            var transaction_response = await send_transaction(bearer_token, encoded_transaction);
            
            if (transaction_response.result === "INVALID") {
                console.log(transaction_response)
                setProcessingTransaction(false);
                return;
            }

            let signature = transaction_response.result;
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
        //setProcessingTransaction(false);
        check_user_state.current = true;
        check_sol_balance.current = true;
        check_achievements.current = true;


        // send a discord message
        let current_win = WIN_FACTORS[current_level] * BetSizeValues[bet_size];

        const message: NewDiscordMessage = {
            message_type: current_level === 7 ? "retired" : "escaped",
            emoji_1: DungeonCharacterEmoji[player_character],
            emoji_2: GoldEmoji,
            level: current_level,
            sol_amount: current_win,
            achievement_name: ""
            
        };

        if (PROD) 
            post_discord_message(message);


        return;
    

    },[wallet, player_character, current_level, bet_size, bearer_token]);

    const ClaimAchievement = useCallback( async (which : number) => 
    {
        setTransactionFailed(false);

        if (wallet.publicKey === null || wallet.signTransaction === undefined || which === null)
            return;

        let program_data_key = (PublicKey.findProgramAddressSync([Buffer.from(MAIN_ACCOUNT_SEED)], DUNGEON_PROGRAM))[0];
        let player_data_key = (PublicKey.findProgramAddressSync([wallet.publicKey.toBytes()], DUNGEON_PROGRAM))[0];
        let player_achievement_key = (PublicKey.findProgramAddressSync([wallet.publicKey.toBytes(), Buffer.from(ACHIEVEMENT_SEED)], DUNGEON_PROGRAM))[0];

        let shop_program_data_key = (PublicKey.findProgramAddressSync([Buffer.from("data_account")], SHOP_PROGRAM))[0];


        const nft_mint_keypair = Keypair.generate();
        var nft_mint_pubkey = nft_mint_keypair.publicKey;

        let nft_meta_key = (PublicKey.findProgramAddressSync([Buffer.from("metadata"),
        METAPLEX_META.toBuffer(), nft_mint_pubkey.toBuffer()], METAPLEX_META))[0];

        let nft_master_key = (PublicKey.findProgramAddressSync([Buffer.from("metadata"),
        METAPLEX_META.toBuffer(), nft_mint_pubkey.toBuffer(), Buffer.from("edition")], METAPLEX_META))[0];

        let nft_account_key = await getAssociatedTokenAddress(
            nft_mint_pubkey, // mint
            wallet.publicKey, // owner
            true // allow owner off curve
        );

        const instruction_data = serialise_claim_achievement_instruction(DungeonInstruction.claim_achievement, which);
        const init_data = serialise_basic_instruction(DungeonInstruction.add_funds);

        var account_vector  = [
            {pubkey: wallet.publicKey, isSigner: true, isWritable: true},
            {pubkey: player_data_key, isSigner: false, isWritable: true},
            {pubkey: player_achievement_key, isSigner: false, isWritable: true},

            {pubkey: ACHIEVEMENTS_COLLECTION_MINT, isSigner: false, isWritable: true},
            {pubkey: ACHIEVEMENTS_COLLECTION_META, isSigner: false, isWritable: true},
            {pubkey: ACHIEVEMENTS_COLLECTION_MASTER, isSigner: false, isWritable: true},

            {pubkey: nft_mint_pubkey, isSigner: true, isWritable: true},
            {pubkey: nft_account_key, isSigner: false, isWritable: true},
            {pubkey: nft_meta_key, isSigner: false, isWritable: true},
            {pubkey: nft_master_key, isSigner: false, isWritable: true},

            {pubkey: program_data_key, isSigner: false, isWritable: true},
            {pubkey: shop_program_data_key, isSigner: false, isWritable: true},

            {pubkey: SHOP_PROGRAM, isSigner: false, isWritable: false},
            {pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
            {pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
            {pubkey: SYSTEM_KEY, isSigner: false, isWritable: false},
            {pubkey: METAPLEX_META, isSigner: false, isWritable: false}

        ];

        const play_instruction = new TransactionInstruction({
            keys: account_vector,
            programId: DUNGEON_PROGRAM,
            data: instruction_data
        });

        const init_instruction = new TransactionInstruction({
            keys: [
                {pubkey: wallet.publicKey, isSigner: true, isWritable: true},
                {pubkey: program_data_key, isSigner: false, isWritable: true},
                {pubkey: program_data_key, isSigner: false, isWritable: true},
                {pubkey: SYSTEM_KEY, isSigner: false, isWritable: true}
            ],
            programId: DUNGEON_PROGRAM,
            data: init_data
        });

        let txArgs = await get_current_blockhash(bearer_token);

        let transaction = new Transaction(txArgs);
        transaction.feePayer = wallet.publicKey;


        transaction.add(play_instruction);
        transaction.add(init_instruction);
        transaction.partialSign(nft_mint_keypair);


        try {
            let signed_transaction = await wallet.signTransaction(transaction);
            const encoded_transaction = bs58.encode(signed_transaction.serialize());

            var transaction_response = await send_transaction(bearer_token, encoded_transaction);
            
            if (transaction_response.result === "INVALID") {
                console.log(transaction_response)
                return;
            }

            let signature = transaction_response.result;

            if (DEBUG) {
                console.log("play signature: ", signature);
            }

            current_signature.current = signature;
            signature_check_count.current = 0;

        } catch(error) {
            console.log(error);
            return;
        }

        check_achievements.current = true;
        setShowAchievement(false)

        const message: NewDiscordMessage = {
            message_type: "achievement",
            emoji_1: DungeonCharacterEmoji[player_character],
            emoji_2: "",
            level: 0,
            sol_amount: 0,
            achievement_name: AchievementMetaData[which].name
            
        };

        if (PROD)
            post_discord_message(message);

    },[wallet, player_character, bearer_token]);

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
        let key_meta_data = await request_key_data_from_index(bearer_token, dungeon_key_lookup_account);
        
        // if we have been passed a number check the lookup account exists
        if (key_meta_data === null) {

            key_meta_data = await run_keyData_GPA(bearer_token, parsed_key_index);

            if (key_meta_data === null) {
                setDiscountError("Key " + discount_key_index + " has not been minted");
                return;
            }
        
        }

        console.log("key meta", key_meta_data, key_meta_data.key_mint.toString());

        let key_mint = key_meta_data.key_mint;
        let key_type = key_meta_data.key_type;
        let key_index = parsed_key_index;
    
        // before we go on lets check they actually own the nft
        let key_token_account = await getAssociatedTokenAddress(
            key_mint, // mint
            wallet.publicKey, // owner
            true // allow owner off curve
        );

        let token_amount = await request_token_amount(bearer_token, key_token_account);

        if (token_amount !== 1) {
            setDiscountError("User does not own dungeon key " + key_index.toString());
            return;
        }


        setCurrentKeyType(key_type);
        setCurrentKeyMint(key_mint);
        setCurrentKeyIndex(key_index);

    },[wallet, discount_key_index, bearer_token]);

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
                <img style={{"imageRendering":"pixelated"}} src={screen === Screen.ARENA_SCREEN ? arena_title : dungeon_title} width="500" alt={""}/>
            </Box>
        )
    }

    const SelectKnight = useCallback( async () => 
    {
        
        if (!isMuted) classSelectAudio.play()
        setWhichCharacter(DungeonCharacter.knight);
    },[isMuted]);

    const SelectRanger = useCallback( async () => 
    {
        if (!isMuted) classSelectAudio.play()
        setWhichCharacter(DungeonCharacter.ranger);
    },[isMuted]);

    const SelectWizard = useCallback( async () => 
    {
        if (!isMuted) classSelectAudio.play()
        setWhichCharacter(DungeonCharacter.wizard);
    },[isMuted]);

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
                                        {/*
                                        <Box borderWidth='2px'  borderColor="white" width="100%">
                                        <Text align="center" fontSize={font_size} color="white"> Back Soon! </Text>
                                        </Box>
                                        */}
                                        
                                        <Button variant='link' size='md' onClick={Play}>
                                        <img style={{"imageRendering":"pixelated"}} onClick={handleEnterBtn} src={enter_button} width={"60%"} alt={""}/>
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


    const handleExploreFurther = () => {
        if (!isMuted) TorchAudio.play()
        Play()
      };


    const handleEscape = () => {
        if (!isMuted) EscapeAudio.play()
        Quit()
      };


    const handleRetry = () => {
        if (!isMuted) RetryAudio.play()
        Play()
      };


      const handleExit = () => {
        if (!isMuted) GameOverAudio.play()
        ShowDeath()
      };


    const InDungeon = () =>  {

        var font_size = DEFAULT_FONT_SIZE;
        if (isMobile) {
            font_size = "15px";
        }

        if (DEBUG) {
            console.log("in dungeon: currentStatus ", DungeonStatusString[currentStatus], "player status", DungeonStatusString[player_state], "fulfilled ", current_level, "enemy state", DungeonStatusString[enemy_state], numXP);
        }

        let background_image = hallway;
        if(current_level > 4)
            background_image = hallway2;

        return (
            
        <>
        <VStack>
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
                    backgroundImage: `url(${background_image})`,
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
                                
                                <Button variant='link' size='md' onClick={handleExit} mr="5rem">
                                    <div className="font-face-sfpb">
                                        <Text textAlign="center" fontSize={font_size} color="white">Exit</Text>
                                    </div> 
                                </Button> 
                                {!processing_transaction &&
                                    <Button variant='link' size='md' onClick={handleRetry} ml="5rem">
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
                                    <Button variant='link' size='md' onClick={handleEscape} mr="3rem">
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
                                    <Button variant='link' size='md' onClick={handleExploreFurther} ml="10rem">
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
            
        <Navigation setScreen={setScreen} check_sol_balance={check_sol_balance} bearer_token={bearer_token}/>
        {(screen === Screen.HOME_SCREEN || screen === Screen.DUNGEON_SCREEN) &&
            <AchievementsModal/>
        }

        <Box width="100%" mb = "2%">
            <Center>
                <Title/>
            </Center>
        </Box>

        <Box width="100%">       
            <Center>

                    
                    {!wallet.publicKey && 
                    <>
                        {screen === Screen.ARENA_SCREEN &&
                            <ArenaScreen bearer_token={bearer_token}/>
                        }
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
                            <ShopScreen num_xp={numXP} bearer_token={bearer_token} check_sol_balance={check_sol_balance}/>
                        }
                        {screen === Screen.MARKETPLACE_SCREEN &&
                            <MarketplaceScreen bearer_token={bearer_token}/>
                        }
                        {screen === Screen.DM_SCREEN &&
                            <DMScreen bearer_token={bearer_token}/>
                        }
                        {screen === Screen.ACHIEVEMENT_SCREEN &&
                            <AchievementsScreen AchievementState={achievement_status} ClaimAchievement={ClaimAchievement}/>
                        }
                        {screen === Screen.STATS_SCREEN &&
                            <StatsScreen AchievementData={achievement_data}/>
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
                        {screen === Screen.ARENA_SCREEN &&
                            <ArenaScreen bearer_token={bearer_token}/>
                        }
                        {screen === Screen.ODDS_SCREEN &&
                            <OddsScreen/>
                        }
                        {screen === Screen.FAQ_SCREEN &&
                            <FAQScreen/>
                        }
                        {screen === Screen.SHOP_SCREEN &&
                            <ShopScreen num_xp={numXP} bearer_token={bearer_token} check_sol_balance={check_sol_balance}/>
                        }
                        {screen === Screen.MARKETPLACE_SCREEN &&
                            <MarketplaceScreen bearer_token={bearer_token}/>
                        }
                        {screen === Screen.HELP_SCREEN &&
                            <HelpScreen/>
                        }
                        {screen === Screen.ACHIEVEMENT_SCREEN &&
                            <AchievementsScreen AchievementState={achievement_status} ClaimAchievement={ClaimAchievement} />
                        }
                        {screen === Screen.STATS_SCREEN &&
                            <StatsScreen AchievementData={achievement_data}/>
                        }
                        {screen === Screen.DM_SCREEN &&
                            <DMScreen bearer_token={bearer_token}/>
                        }
                        </>
                    }                    
                
            </Center>
        </Box>
        </>
    );
}

function Home() {
    const wallets = useMemo(() => 
    [
        new PhantomWalletAdapter(),
        new SolflareWalletAdapter(),
        new BackpackWalletAdapter()
    ],
    []
  );
  document.body.setAttribute('style', 'background: black;');
    return (

        <ChakraProvider>
                <WalletProvider wallets={wallets} autoConnect>
                    <WalletModalProvider>
                    <MuteProvider isMuted={false}>
                        <DungeonApp />
                        <Footer/>
                    </MuteProvider>
                    </WalletModalProvider>
                </WalletProvider>
        </ChakraProvider>

    );
}

export default Home;