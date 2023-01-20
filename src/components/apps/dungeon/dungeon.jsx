import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
    ChakraProvider,
    Box,
    Button,
    HStack,
    theme,
    Center,
    Text,
    VStack
} from '@chakra-ui/react';
import { isMobile } from "react-device-detect";

import { serialize, deserialize } from 'borsh';

import { PublicKey, Transaction, TransactionInstruction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import {
    WalletProvider,
    useWallet,
} from '@solana/wallet-adapter-react';
import {
    getPhantomWallet,
    getSolflareWallet,
    getSolletWallet,
    getSolletExtensionWallet,
} from '@solana/wallet-adapter-wallets';
import {
    WalletModalProvider,
    WalletMultiButton,
    WalletDisconnectButton,
} from '@solana/wallet-adapter-react-ui';
import bs58 from "bs58";

import dungeon_title from "./Dungeon_Logo.png"
import large_door from "./Large_Door.gif"
import hallway from "./Hallway.gif"

//characters
import knight from "./Knight.gif"
import ranger from "./Ranger.gif"
import wizard from "./Wizard.gif"
import corpse from "./Corpse.png"
import selector from "./Selector.gif"

//enemies
import chest from "./Mimic.gif"
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

import './fonts.css';
require('@solana/wallet-adapter-react-ui/styles.css');




const DEFAULT_FONT_SIZE = "50px"
const PROGRAM_KEY = new PublicKey('53L6SWoPTx8tAfaBkxKRiRewzuMnQ8NoyeYRyoLLh3gC');
const SYSTEM_KEY = new PublicKey("11111111111111111111111111111111");
const DAOPLAYS_KEY = new PublicKey("2BLkynLAWGwW58SLDAnhwsoiAuVtzqyfHKA3W3MJFwEF");
const KAYAK_KEY = new PublicKey("GrTcMZ5qxQwxCo7ePrYaHgf3gLjetDT6Vew8n1ihNPG4");

const AccountStatus = {
    unknown : 0,
    created : 1,
    not_created : 2
}

const InitialDungeonStatus = {
    unknown : 0,
    alive : 1,
    dead : 2
}

const DungeonStatus = {
    alive : 0,
    dead : 1
}

const DungeonCharacter = {
    knight : 0,
    ranger : 1,
    wizard : 2
}


const Screen = {
    HOME_SCREEN : 0,
    DUNGEON_SCREEN : 1,
    DEATH_SCREEN : 2
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

const DungeonEnemyName = ["Mimic", "Slime", "Goblins", "Skeletons", "Skeletons", "Elves", "Orc", "Skeleton Knight", "Skeleton Wizard", "Reaper", "Boulder", "Floor Spikes"];


const DungeonEnemyInitialText = ["mimic", "an oozing green slime", "a pair of goblins", "a horde of skeletons", "a horde of skeletons", "a group of elven archers", "a huge orc", "a skeleton knight", "a skeleton wizard", "the Grim Reaper", "Boulder", "Floor Spikes"];

const DungeonEnemyDefeatText = ["The mimic's transformation stuns you for just a moment, but that is all it needed", "The slime oozes past your defenses and envelopes you, suffocating you where you stand", "The goblins are too fast, you lose sight of them for just a second and the next thing you see is a knife to your throat", "The skeletons manage to surround you, and strike from all sides", "There were just.. too many skeletons", "You take an arrow to the knee, and while stumbling are unable to dodge the next volley to the heart", "With one swing from it's axe the orc cracks your head open like an egg", "Your attacks are simply deflected off the knight's armour until it gets bored and strikes you down", "Hoarsely croaking some ancient incantation the wizard turns you inside out before you even have a chance to attack", "The Reaper's scythe passes through you as though you were no more than air as it claims another soul", "Boulder", "Floor Spikes"];

const DungeonInstruction = {
    add_funds : 0,
    distribute : 1,
    play : 2,
    quit : 3
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

const player_data_schema = new Map([
  [PlayerData, { kind: 'struct', 
  fields: [
        ['num_plays', 'u64'],
        ['in_progress', 'u8'],
        ['player_status', 'u8'],
        ['dungeon_enemy', 'u8'],
        ['player_character', 'u8']],
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


export function WalletConnected() 
{
    return (
        <Box>
            <WalletDisconnectButton />
        </Box>
    );
}

let intervalId;
var check_balance = true;
var initial_status_is_set = false;
var initial_num_plays = -1;
var need_to_create_account = false;
var last_num_plays = -1;
var transaction_failed = false;

export function DungeonApp() 
{
    const wallet = useWallet();

    // properties used to set what to display
    const [data_account_status, setDataAccountStatus] = useState(AccountStatus.unknown);
    const [initial_status, setInitialStatus] = useState(InitialDungeonStatus.unknown);

    // these come from the blockchain
    const [sol_balance, setSolBalance] = useState(null);
    const [numPlays, setNumPlays] = useState(0);
    const [currentLevel, setCurrentLevel] = useState(0);
    const [currentStatus, setCurrentStatus] = useState(true);
    const [current_enemy, setCurrentEnemy] = useState(DungeonEnemy.None);
    const [current_signature, setCurrentSignature] = useState(null);


    const [screen, setScreen] = useState(Screen.HOME_SCREEN);

    const [which_character, setWhichCharacter] = useState(DungeonCharacter.knight);
    const [enemy_state, setEnemyState] = useState(0);
    const [player_state, setPlayerState] = useState(0);
    const [animateLevel, setAnimateLevel] = useState(0);

    const check_signature = useCallback(async() =>
    {
        
            if (current_signature === null)
                return;

            //console.log("in check signature");
            const confirm_url = `/.netlify/functions/sig_status_dev?function_name=getSignatureStatuses&p1=`+current_signature;
            var signature_response = await fetch(confirm_url).then((res) => res.json());
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

    const init = useCallback(async () => 
    {       
        if (wallet.publicKey) {

            const account_info_url = `/.netlify/functions/solana_dev?function_name=getAccountInfo&p1=`+wallet.publicKey.toString();

            var account_info_result;
            try {
                account_info_result = await fetch(account_info_url).then((res) => res.json());
            }
            catch(error) {
                console.log(error);
                return;
            }

            let lamports_amount = account_info_result["result"]["value"]["lamports"];

            setSolBalance(lamports_amount  / LAMPORTS_PER_SOL);

            let player_data_key = (await PublicKey.findProgramAddress([wallet.publicKey.toBytes()], PROGRAM_KEY))[0];

            if (check_balance) {
                
                // first check if the data account exists
                try {

                    const balance_url = `/.netlify/functions/solana_dev?function_name=getBalance&p1=`+player_data_key.toString();
                    var balance_result;
                    try {
                        balance_result = await fetch(balance_url).then((res) => res.json());
                    }
                    catch(error) {
                        console.log(error);
                        return;
                    }
                    
                    let balance = balance_result["result"]["value"];
                    if (balance > 0) {
                        setDataAccountStatus(AccountStatus.created);
                        check_balance = false;
                    }
                    else {
                        need_to_create_account = true;
                        setDataAccountStatus(AccountStatus.not_created);
                        return;
                    }
                }
                catch(error) {
                    console.log(error);
                    return;
                }
            }

            try {

                const player_account_info_url = `/.netlify/functions/solana_dev?function_name=getAccountInfo&p1=`+player_data_key.toString()+`&p2=config&p3=base64&p4=commitment`;

                var player_account_info_result;
                try {
                    player_account_info_result = await fetch(player_account_info_url).then((res) => res.json());
                }
                catch(error) {
                    console.log(error);
                    return;
                }

                let player_account_encoded_data = player_account_info_result["result"]["value"]["data"];
                let player_account_data = Buffer.from(player_account_encoded_data[0], "base64");
                const player_data = deserialize(player_data_schema, PlayerData, player_account_data);


                if (!initial_status_is_set) {
                    if (player_data["player_status"] === DungeonStatus.alive){
                        setInitialStatus(InitialDungeonStatus.alive);
                    }

                    if (player_data["player_status"] === DungeonStatus.dead){
                        setInitialStatus(InitialDungeonStatus.dead);
                    }
                    
                }

                let num_plays = player_data["num_plays"].toNumber();


                if (num_plays < last_num_plays) {
                    return;
                }

                last_num_plays = num_plays;

                setNumPlays(num_plays);

                //console.log("in init, progress: ", player_data["in_progress"], "enemy", player_data["dungeon_enemy"], "alive", player_data["player_status"] === 0, "num_plays", num_plays);

                if (initial_num_plays ===  -1)
                {
                    initial_num_plays =  num_plays;
                }
                if (num_plays === 0)  {
                    return;
                }  

                setCurrentEnemy(player_data["dungeon_enemy"]);
                
                setCurrentLevel(player_data["in_progress"]);

                setCurrentStatus(player_data["player_status"]);

                
            } catch(error) {
                console.log(error);
                setCurrentLevel(0);
                setCurrentStatus(DungeonStatus.alive);
                setCurrentEnemy(DungeonEnemy.None);
            }
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
        //console.log("wallet things changed")

        check_balance = true;
        initial_status_is_set = false;
        initial_num_plays = -1;
        need_to_create_account = false;
        last_num_plays = -1;
        transaction_failed = false;
    }, [wallet]);


    
    useEffect(() => 
        {
            //console.log("in use effect, progress: ", currentLevel, "enemy", current_enemy, "alive", currentStatus === 0, "num_plays", numPlays);
      
            if (currentLevel === 0)
                return;

            if (currentStatus === DungeonStatus.alive) {
                setScreen(Screen.DUNGEON_SCREEN);
            }

            if (numPlays === initial_num_plays && !need_to_create_account && currentStatus === DungeonStatus.dead)
                return;

            // display the current enemy
            setEnemyState(1);
            if (currentStatus === DungeonStatus.alive) {
                //setEnemyState(2);
                setAnimateLevel(1);
            }
            else {
                //setPlayerState(2);
                setAnimateLevel(2);
            }

        }, [numPlays, currentLevel, current_enemy, currentStatus]);

    useEffect(() => 
    {
            if (animateLevel === 0) {
                return;
            }

            const timer = setTimeout(() => {
                //console.log('This will run after 5 seconds!');

                // player killed enemy
                if (animateLevel === 1) {
                    setPlayerState(1);
                    setEnemyState(2);
                }
                // enemy killed player
                else {
                    setPlayerState(2);
                    setEnemyState(1);
                }

                setAnimateLevel(0);
                }, 5000);
                return () => clearTimeout(timer);
        

    }, [animateLevel]);

    useEffect(() => 
    {
        setInitialStatus(InitialDungeonStatus.unknown);
        setPlayerState(1);
        setEnemyState(0);
        //console.log("this is only called once");

    }, []);




    const Play = useCallback( async () => 
    {

            let program_data_key = (await PublicKey.findProgramAddress(["main_data_account"], PROGRAM_KEY))[0];
            let player_data_key = (await PublicKey.findProgramAddress([wallet.publicKey.toBytes()], PROGRAM_KEY))[0];

            let btc_key = new PublicKey("HovQMDrbAgAYPCmHVSrezcSmkMtXSSUsLDFANExrZh2J");
            let eth_key = new PublicKey("EdVCmQ9FSPcVe5YySXDPCRmc8aDQLKJ9xvYBMZPie1Vw");
            let sol_key = new PublicKey("J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix");

            const play_meta = new PlayMeta({ instruction: DungeonInstruction.play, character: which_character});
            const instruction_data = serialize(play_scheme, play_meta);

            const play_instruction = new TransactionInstruction({
                keys: [
                    {pubkey: wallet.publicKey, isSigner: true, isWritable: true},
                    {pubkey: player_data_key, isSigner: false, isWritable: true},

                    {pubkey: btc_key, isSigner: false, isWritable: true},
                    {pubkey: eth_key, isSigner: false, isWritable: true},
                    {pubkey: sol_key, isSigner: false, isWritable: true},

                    {pubkey: program_data_key, isSigner: false, isWritable: true},

                    {pubkey: SYSTEM_KEY, isSigner: false, isWritable: false}

                ],
                programId: PROGRAM_KEY,
                data: instruction_data
            });

            const blockhash_url = `/.netlify/functions/solana_dev?function_name=getLatestBlockhash&p1=`;
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

                const send_url = `/.netlify/functions/solana_dev?function_name=sendTransaction&p1=`+encoded_transaction;
                var transaction_response = await fetch(send_url).then((res) => res.json());
                let signature = transaction_response["result"];

                setCurrentSignature(signature);

            } catch(error) {
                console.log(error);
                return;
            }

            //console.log("setting screen to dungeon");
            setScreen(Screen.DUNGEON_SCREEN);
            setEnemyState(0);
            setPlayerState(1);        

    },[wallet, which_character]);


    const Quit = useCallback( async () => 
    {

            let program_data_key = (await PublicKey.findProgramAddress(["main_data_account"], PROGRAM_KEY))[0];
            let player_data_key = (await PublicKey.findProgramAddress([wallet.publicKey.toBytes()], PROGRAM_KEY))[0];

            const instruction_meta = new InstructionMeta({ instruction: DungeonInstruction.quit});
            const instruction_data = serialize(instruction_schema, instruction_meta);

            const quit_instruction = new TransactionInstruction({
                keys: [
                    {pubkey: wallet.publicKey, isSigner: true, isWritable: true},
                    {pubkey: player_data_key, isSigner: false, isWritable: true},
                    {pubkey: program_data_key, isSigner: false, isWritable: true},

                    {pubkey: DAOPLAYS_KEY, isSigner: false, isWritable: true},
                    {pubkey: KAYAK_KEY, isSigner: false, isWritable: true},

                    {pubkey: SYSTEM_KEY, isSigner: false, isWritable: false}

                ],
                programId: PROGRAM_KEY,
                data: instruction_data
            });

            const blockhash_url = `/.netlify/functions/solana_dev?function_name=getLatestBlockhash&p1=`;
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

                const send_url = `/.netlify/functions/solana_dev?function_name=sendTransaction&p1=`+encoded_transaction;
                let transaction_response = await fetch(send_url).then((res) => res.json());

                let signature = transaction_response["result"];

                setCurrentSignature(signature);

            } catch(error) {
                console.log(error);
                return;
            }

            setScreen(Screen.HOME_SCREEN);
            setEnemyState(0);

            return;
        

    },[wallet]);

    const Reset = useCallback( async () => 
    {
            setScreen(Screen.HOME_SCREEN);
            setEnemyState(0);
            return;
        
    },[]);

    const ShowDeath = useCallback( async () => 
    {
            setScreen(Screen.DEATH_SCREEN);
            setEnemyState(0);
            return;
        
    },[]);

    const LargeDoor = () => {
        return (
            <Box bg='black' mt="2rem">
            <img style={{"imageRendering":"pixelated"}} src={large_door} width={1000} alt={"generic"}/>
            </Box>
        )
    }

    const Title = () =>  {

        return (
            <Box bg='black' mt="2rem">
                <img style={{"imageRendering":"pixelated"}} src={dungeon_title} width="1000" alt={""}/>
            </Box>
        )
    }

    const SelectKnight = useCallback( async () => 
    {
        setWhichCharacter(DungeonCharacter.knight);
        return;
        
    },[]);

    const SelectRanger = useCallback( async () => 
    {
        setWhichCharacter(DungeonCharacter.ranger);
        return;
        
    },[]);

    const SelectWizard = useCallback( async () => 
    {
        setWhichCharacter(DungeonCharacter.wizard);
        return;
        
    },[]);

    const HiddenCharacterSelect = () => {

        return (
            <HStack>
                
                    <Box  width="100%">
                        <Box>
                            <Button variant='link' size='md' onClick={SelectKnight}>
                                <img style={{"imageRendering":"pixelated", "visibility": "hidden"}} src={knight} width="10000" alt={""}/>
                            </Button>
                        </Box>
                    </Box>
                
                
                
                    <Box  width="100%">
                        <Box>
                            <Button variant='link' size='md' onClick={SelectRanger}>
                                <img style={{"imageRendering":"pixelated", "visibility": "hidden"}} src={ranger} width="10000" alt={""}/>
                            </Button>
                        </Box>
                    </Box>
                
                
                    <Box  width="100%">
                        <Box>
                            <Button variant='link' size='md' onClick={SelectWizard}>
                                <img style={{"imageRendering":"pixelated", "visibility": "hidden"}} src={wizard} width="10000" alt={""}/>
                            </Button>
                        </Box>
                    </Box>
                
            </HStack>
        );  
    }

    const CharacterSelect = () => {

        //console.log("in characterSelect, progress: ", currentLevel, "enemy", current_enemy, "alive", currentStatus === 0, "num_plays", numPlays,initial_num_plays, "dataaccount:", data_account_status, "create account", need_to_create_account, "initial status", initial_status, initial_status === InitialDungeonStatus.unknown);

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
                                <Button variant='link' size='md' onClick={SelectKnight}>
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
            font_size = "20px";
        }

        return (
            <VStack>
                <HStack>
                    <Box width="33%">
                        <div className="font-face-sfpb">
                            <Text  align="center"  ml="10%" mr="1%" fontSize={font_size} color="white">DUNGEON MASTER'S<br/> FEE: 2%</Text>
                        </div>    
                    </Box>            
                    <LargeDoor/>
                    <Box width="33%">
                        <Box ml="1%" mr="10%">
                            <VStack alignItems="center">
                                <div className="font-face-sfpb">
                                    <Text align="center" fontSize={font_size} color="white">CONNECT WALLET</Text>
                                </div>  
                                {!isMobile &&
                                    <WalletMultiButton />
                                }
                            </VStack>  
                        </Box>
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
        )
    }

    const ConnectedPageNoCS = () =>  {
        return(
            <VStack>
            <HStack mb = "10rem" mt="2rem">
                <Box width="33%">
                    <div className="font-face-sfpb">
                        <Text  align="center"  ml="10%" mr="1%" fontSize={DEFAULT_FONT_SIZE} color="black">DUNGEON MASTER'S<br/> FEE: 2%</Text>
                    </div>    
                </Box>   
                <LargeDoor/>
                <Box width="33%">
                    <Center>
                            <div className="font-face-sfpb">
                                <Text  ml="1%" mr="10%" textAlign="center" fontSize={DEFAULT_FONT_SIZE} color="black">ENTER<br/>DUNGEON</Text>
                            </div> 
                    </Center>
                    
                </Box>  
            </HStack>
            <HStack mb = "2rem" mt="2rem">
                <Box width="33%" mt="2rem"/>
                <Box width="33%" mt="2rem"><HiddenCharacterSelect/></Box>
                <Box width="33%" mt="2rem"/>
            </HStack>
        </VStack>
        );
    }

    const ConnectedPage = () =>  {

        //console.log("in characterSelect, progress: ", currentLevel, "enemy", current_enemy, "alive", currentStatus === 0, "num_plays", numPlays,initial_num_plays, "dataaccount:", data_account_status, "create account", need_to_create_account, "initial status", initial_status, initial_status === InitialDungeonStatus.unknown);

        // if i don't need to make an account but player status is unknown return nothing
        if (!need_to_create_account  && (initial_status === InitialDungeonStatus.unknown || (numPlays === initial_num_plays && InitialDungeonStatus === InitialDungeonStatus.alive))) {
            return(
                <ConnectedPageNoCS/>
            );
        }

        //console.log("have made it here in CS 2");
        // if i am alive and  the level is > 0 never show this
        if (data_account_status === AccountStatus.unknown ||  (currentLevel > 0 && currentStatus === DungeonStatus.alive)) {
            return(
                <ConnectedPageNoCS/>
            );
        }
        //console.log("have made it here in CS");

        return (
            <VStack>
                <HStack mb = "10rem" mt="2rem">
                    <Box width="33%">
                        <div className="font-face-sfpb">
                            <Text  align="center"  ml="10%" mr="1%" fontSize={DEFAULT_FONT_SIZE} color="white">DUNGEON MASTER'S<br/> FEE: 2%</Text>
                        </div>    
                    </Box>            
                    <LargeDoor/>
                    <Box width="33%">
                        <Center>
                            <Button variant='link' size='md' onClick={Play}>
                                <div className="font-face-sfpb">
                                    <Text  ml="1%" mr="10%" textAlign="center" fontSize={DEFAULT_FONT_SIZE} color="white">ENTER<br/>DUNGEON</Text>
                                </div> 
                            </Button> 
                        </Center>
                        
                    </Box>  
                </HStack>
                <HStack mb = "2rem" mt="2rem">
                    <Box width="33%" mt="2rem"/>
                    <Box width="33%" mt="2rem"><CharacterSelect/></Box>
                    <Box width="33%" mt="2rem"/>
                </HStack>
            </VStack>
        )
    }

    const DisplayPlayer = () => {

       // console.log("player state ", player_state);
        if (player_state === 0) {
            return(<></>);
        }

        if (player_state === 2)  {
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
                <Text fontSize={DEFAULT_FONT_SIZE} textAlign="center" color="white">You enter a suspiciously empty room...</Text>
            </div>
            );
         };

         if (current_enemy === DungeonEnemy.Chest) {
            return(
            <div className="font-face-sfpb">
               <Text fontSize={DEFAULT_FONT_SIZE} textAlign="center" color="white">You have encountered a <del>treasure chest</del> mimic in room {currentLevel}</Text>
           </div>
           );
        };
         

         // otherwise say the enemy type
         return(
            <div className="font-face-sfpb">
                <Text fontSize={DEFAULT_FONT_SIZE} textAlign="center" color="white">You have encountered {DungeonEnemyInitialText[current_enemy]} in room {currentLevel}</Text>
                <Text fontSize={DEFAULT_FONT_SIZE} textAlign="center" color="white">Prepare yourself!</Text>
            </div>
         );
     }

    const DisplaySuccessEnemyResultText = () => {

         
        // for the traps we have special text for survival
        if (current_enemy === DungeonEnemy.Boulder || current_enemy === DungeonEnemy.FloorSpikes) {
            return(
            <div className="font-face-sfpb">
                <Text fontSize={DEFAULT_FONT_SIZE} textAlign="center" color="white">...but pass through without incident.</Text>
                <Text fontSize={DEFAULT_FONT_SIZE} textAlign="center" color="white">Escape to claim your current loot of {Math.pow(2,currentLevel) *  0.2} SOL</Text>
                <Text fontSize={DEFAULT_FONT_SIZE} textAlign="center" color="white">Explore further to try and double your loot to {Math.pow(2,currentLevel+1) *  0.2} SOL</Text>
           </div>
           );
        };
        

        // otherwise say the enemy type
        return(
            <div className="font-face-sfpb">
                <Text fontSize={DEFAULT_FONT_SIZE} textAlign="center" color="white">You have defeated the {DungeonEnemyName[current_enemy]}</Text>
                <Text fontSize={DEFAULT_FONT_SIZE} textAlign="center" color="white">Escape to claim your current loot of {Math.pow(2,currentLevel) *  0.2} SOL</Text>
                <Text fontSize={DEFAULT_FONT_SIZE} textAlign="center" color="white">Explore further to try and double your loot to {Math.pow(2,currentLevel+1) *  0.2} SOL</Text>
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
                    <Text  fontSize={DEFAULT_FONT_SIZE} textAlign="center" color="white">A boulder suddenly falls from the ceiling, crushing you instantly.</Text>
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
                    <Text  fontSize={DEFAULT_FONT_SIZE} textAlign="center" color="white">A trapdoor opens beneath your feet, dropping you onto a mass of bloodied spikes.</Text>
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
                <Text  fontSize={DEFAULT_FONT_SIZE} textAlign="center" color="white">{DungeonEnemyDefeatText[current_enemy]}</Text>
            </div>
            </Box>
            </Center>
        );
    }

    const DisplayEnemy = () => {

       // console.log("enemy state ", enemy_state);
        if (enemy_state === 0) {
            return(<></>);
        }

        if (enemy_state === 2)  {

            // for the traps we don't return anything
            if (current_enemy === DungeonEnemy.Boulder) {
                return(<></>);
            }
            if (current_enemy === DungeonEnemy.FloorSpikes) {
                return(<></>);
            }


            return ( <img style={{"imageRendering":"pixelated"}} src={corpse} width="10000" alt={""}/> );
        }

        

        if (current_enemy === DungeonEnemy.Chest) {
            return ( <img style={{"imageRendering":"pixelated"}} src={chest} width="10000" alt={""}/> );
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

    const InDungeon = () =>  {

        return (
        <>
            <VStack>
                <HStack mb = "10rem" mt="2rem">
                    <Box width="10%"></Box>         
                    <Box  style={{
                        backgroundImage: `url(${hallway})`,
                        backgroundPosition: 'center',
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        imageRendering: "pixelated"

                    } } width="80%">
                    <HStack mb = "2rem" mt="2rem">
            
                        <Box width="30%"></Box>            
                        <Box width="15%"> <DisplayPlayer/></Box>  
                        <Box width="10%"></Box> 
                        <Box width="15%"> <DisplayEnemy/> </Box>  
                        <Box width="30%"></Box> 

                    </HStack>
                    </Box>
                    <Box width="10%"></Box> 
                    
                </HStack>
            </VStack>

            <VStack  alignItems="center" marginBottom  = "10px" >

                { transaction_failed &&
                    <div className="font-face-sfpb">
                        <Center>
                                <Text  fontSize={DEFAULT_FONT_SIZE} textAlign="center" color="red">Transaction Failed. <br/>Please Refresh.</Text>
                        </Center>
                    </div>
                }
                                        
                {player_state === 2 &&
                <>
                <VStack alignItems="center" spacing="3%">
                    <div className="font-face-sfpb">
                        <DisplayFailureEnemyResultText/>
                        <Center mt="3%">
                            <Button variant='link' size='md' onClick={ShowDeath}>
                                <div className="font-face-sfpb">
                                    <Text  ml="1%" mr="10%" textAlign="center" fontSize={DEFAULT_FONT_SIZE} color="white">Exit</Text>
                                </div> 
                            </Button> 
                        </Center>
                    </div>
                    </VStack>
                </>
                }
                {currentLevel > 0  &&
                    <>
                    { player_state === 1 && enemy_state  === 1  && 
                        <DisplayEnemyInitialText/>
                    }
                    {enemy_state === 2 &&

                        <VStack alignItems="center" spacing="3%">
                            <DisplaySuccessEnemyResultText/>
                            <HStack>
                            <Center>
                                <Button variant='link' size='md' onClick={Play} mr="3rem">
                                    <div className="font-face-sfpb">
                                        <Text  ml="1%" mr="10%" textAlign="center" fontSize={DEFAULT_FONT_SIZE} color="white">Explore Further</Text>
                                    </div> 
                                </Button> 
                                <Button variant='link' size='md' onClick={Quit} ml="10rem">
                                    <div className="font-face-sfpb">
                                        <Text  ml="1%" mr="10%" textAlign="center" fontSize={DEFAULT_FONT_SIZE} color="white">Escape</Text>
                                    </div> 
                                </Button> 
                            </Center>
                            </HStack>
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
                                <Text textAlign="center" fontSize={DEFAULT_FONT_SIZE} color="Red">You Have Died<br/><del>{Math.pow(2,currentLevel - 1) *  0.2} SOL</del></Text>
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
        
        <Center>
            <VStack>
                 {!wallet.publicKey &&
                    <Box  borderRadius="2rem" p='1rem' width='50%' mt="2rem"  mb="1rem">   
                    
                        
                                <HStack>
                                    <Button variant='link'  size='lg'>
                                    
                                    </Button>
                                    <div className="font-face-sfpb">
                                        <Text fontSize='25px' color="black">
                                            {
                                                "no balance"
                                            }
                                        </Text>
                                    </div>
                                </HStack>
                            
                        
                    </Box>
                }
                {wallet.publicKey &&
                    <Box width="100%">
                        <Box  borderRadius="2rem" p='1rem' width='50%' mt="2rem">   
                        
                           
                                    <HStack>
                                        <WalletConnected />
                                        <div className="font-face-sfpb">
                                            <Text fontSize='25px'  color="white">
                                                {
                                                    sol_balance
                                                    ? "Balance: " + sol_balance + ' SOL'
                                                    : '                                 '
                                                }
                                            </Text>
                                        </div>
                                    </HStack>
                                
                            
                        </Box>
                </Box>
                    
                }
                <Box width="100%">
                    <HStack mb = "2rem" mt="2rem">
                        <Box width="33%"/>
                        <Title/>
                        <Box width="33%"/>
                    </HStack>
                </Box>
                <Box width="100%">
                    
                    {!wallet.publicKey && <UnconnectedPage/>}
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
                        </>
                    }                    
                </Box>
            </VStack>               
        </Center>
    );
}

function Dungeon() {
    const network = 'devnet';
    const wallets = useMemo(() => 
    [
        getPhantomWallet(),
        getSolflareWallet(),
        getSolletWallet({ network }),
        getSolletExtensionWallet({ network }),
    ],
    [network]
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