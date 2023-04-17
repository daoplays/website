import { useCallback, useEffect, useState, useRef } from 'react';

import {
    Box,
    Center,
    Text,
    HStack,
    VStack,
} from '@chakra-ui/react';

import {
    NumberInput,
    NumberInputField
  } from '@chakra-ui/react'

  import {
    useWallet,
} from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';

import bs58 from "bs58";
import BN from 'bn.js'

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

import { solid } from '@fortawesome/fontawesome-svg-core/import.macro' // <-- import styles to be used

import hallway from "./images/Arena1.gif"


import { DUNGEON_FONT_SIZE , ARENA_PROGRAM, SYSTEM_KEY, PROD, DM_PROGRAM, DEV_WSS_NODE} from './constants';

import {run_arena_free_game_GPA, GameData, bignum_to_num, get_current_blockhash, send_transaction, uInt32ToLEBytes, serialise_Arena_CreateGame_instruction, serialise_Arena_Move_instruction, serialise_basic_instruction, post_discord_message, serialise_Arena_Reveal_instruction, serialise_Arena_JoinGame_instruction, request_arena_game_data} from './utils';

import Table from 'react-bootstrap/Table';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import Container from 'react-bootstrap/Container';


//enemies
import assassin from "./images/Assassin.gif"
import blue_slime from "./images/Blue_Slime.gif"
//import boulder from "./images/Boulder.png"
import carnivine from "./images/Carnivine.gif"
import dungeon_master from "./images/Dungeon_Master.gif"
import elves from "./images/Elves.gif"
import giant_blue_slime from "./images/Giant_Blue_Slime.gif"
import giant_green_slime from "./images/Giant_Green_Slime.gif"
import giant_rat from "./images/Giant_Rat.gif"
import giant_spider from "./images/Giant_Spider.gif"
import goblins from "./images/Goblins.gif"
import green_slime from "./images/Green_Slime.gif"
//import mimic from "./images/Mimic.gif"
import orc from "./images/Orc.gif"
import shade from "./images/Shade.gif"
import skeleton_knight from "./images/Skelly_Knight.gif"
import skeletons from "./images/Skellies.gif"
import skeleton_wizard from "./images/Skelly_Wiz.gif"
//import floor_spikes from "./images/Spikes.png"
import werewolf from "./images/Werewolf.gif"

import closed_chest from "./images/chest_closed.png"
import open_chest from "./images/chest_open.png"
import bones from "./images/Bones.png"
import green_slime_corpse from "./images/slime_corpse.png"
import blue_slime_corpse from "./images/Blue_Slime_Corpse.png"
import spider_corpse from "./images/Spider_Corpse.png"
import carnivine_corpse from "./images/Vine_Corpse.png"
import werewolf_corpse from "./images/Wolf_Corpse.png"
import shade_corpse from "./images/Shade_Corpse.png"

//characters
import knight from "./images/Knight.gif"
import ranger from "./images/Ranger.gif"
import wizard from "./images/Wizard.gif"
import corpse from "./images/Corpse.png"

import assassin_emoji from "./emojis/Assassin.gif"
import blue_slime_emoji from "./emojis/BlueSlime.gif"
import boulder_emoji from "./emojis/Boulder.png"
import carnivine_emoji from "./emojis/Carnivine.gif"
import dungeon_master_emoji from "./emojis/DungeonMaster.gif"
import elves_emoji from "./emojis/Elves.gif"
import giant_blue_slime_emoji from "./emojis/GiantBlueSlime.gif"
import giant_green_slime_emoji from "./emojis/GiantGreenSlime.gif"
import giant_rat_emoji from "./emojis/GiantRat.gif"
import giant_spider_emoji from "./emojis/GiantSpider.gif"
import goblins_emoji from "./emojis/Goblin.gif"
import green_slime_emoji from "./emojis/GreenSlime.gif"
import mimic_emoji from "./emojis/Mimic.gif"
import orc_emoji from "./emojis/Orc.gif"
import shade_emoji from "./emojis/Shade.gif"
import skeleton_knight_emoji from "./emojis/SkellyKnight.gif"
import skeletons_emoji from "./emojis/Skellies.gif"
import skeleton_wizard_emoji from "./emojis/SkellyWiz.gif"
import floor_spikes_emoji from "./emojis/Spikes.png"
import werewolf_emoji from "./emojis/Werewolf.gif"

import knight_emoji from "./emojis/Knight.gif"
import ranger_emoji from "./emojis/Ranger.gif"
import wizard_emoji from "./emojis/Wizard.gif"

import './css/table.css';
import './css/fonts.css';
import './css/tabs.css';
import './css/containers.css'

const GoldEmoji : string = "<a:Gold:1086961346492510298>";

const ArenaCharacterEmoji : string[] = [
    "<a:Knight:1070460855575126116>",
    "<a:Ranger:1070471404425842688>",
    "<a:Wizard:1070471413829472287>",
    "<a:Assassin:1082340379204014170>",
    "<a:BlueSlime:1082339378573086821>",
    "<:Boulder:1070460848155410432>",
    "<a:Carnivine:1080810978347855952>",
    "<a:DM:1082380987465465968>",
    "<a:Elves:1070460851317907466>",
    "<a:GiantSlimeBlue:1082339381060313098>",
    "<a:GiantSlimeGreen:1082339382624780370>",
    "<a:GiantRat:1082339379445502023>",
    "<a:GiantSpider:1082339383740473406>",
    "<a:Goblins:1070460853436030997>",
    "<a:GreenSlime:1082339385502093402>",
    "<a:Mimic:1086994090543022131>",
    "<a:Orc:1070471402496462858>",
    "<a:Shade:1082342760947925072>",
    "<a:SkellyKnight:1070471408523677747>",
    "<a:Skellies:1070471406887907338>",
    "<a:SkellyWiz:1070471409622585394>",
    "<:Spikes:1070471412084654080>",
    "<a:Werewolf:1082339387557289994>",
]

const enum ArenaInstruction {
    init = 0,
    create_game = 1,
    join_game = 2,
    cancel_game = 3,
    take_move = 4,
    reveal_move = 5,
    claim_reward = 6
}


const enum RPSMove {
    none = 0,
    rock = 1,
    paper = 2,
    scissors = 3
}

const rps_move : string[] = [
    "None",
    "Rock",
    "Paper",
    "Scissors"
]

const enum PlayerCharacter {
    Knight = 0,
    Ranger,
    Wizard,
    Assassin,
    BlueSlime,
    BoulderTrap,
    Carnivine,
    DM,
    Elves,
    GiantBlueSlime,
    GiantGreenSlime,
    GiantRat,
    GiantSpider,
    Goblins,
    GreenSlime,
    Mimic,
    Orc,
    Shade,
    SkeletonKnight,
    Skeletons,
    SkeletonWizard,
    SpikeTrap,
    Werewolf
}


const player_emoji_map = new Map([
    // enemies
    [PlayerCharacter.Assassin, assassin_emoji],
    [PlayerCharacter.BlueSlime, blue_slime_emoji],
    [PlayerCharacter.BoulderTrap, boulder_emoji],
    [PlayerCharacter.Carnivine, carnivine_emoji],
    [PlayerCharacter.DM, dungeon_master_emoji],
    [PlayerCharacter.Elves, elves_emoji],
    [PlayerCharacter.GiantBlueSlime, giant_blue_slime_emoji],
    [PlayerCharacter.GiantGreenSlime, giant_green_slime_emoji],
    [PlayerCharacter.GiantRat, giant_rat_emoji],
    [PlayerCharacter.GiantSpider, giant_spider_emoji],
    [PlayerCharacter.Goblins, goblins_emoji],
    [PlayerCharacter.GreenSlime, green_slime_emoji],
    [PlayerCharacter.Mimic, mimic_emoji],
    [PlayerCharacter.Orc, orc_emoji],
    [PlayerCharacter.Shade, shade_emoji],
    [PlayerCharacter.SkeletonKnight, skeleton_knight_emoji],
    [PlayerCharacter.Skeletons, skeletons_emoji],
    [PlayerCharacter.SkeletonWizard, skeleton_wizard_emoji],
    [PlayerCharacter.SpikeTrap, floor_spikes_emoji],
    [PlayerCharacter.Werewolf, werewolf_emoji],

    // characters
    [PlayerCharacter.Knight, knight_emoji],
    [PlayerCharacter.Ranger, ranger_emoji],
    [PlayerCharacter.Wizard, wizard_emoji]
  ]);



const enum ArenaStatus {
    alive = 0,
    dead = 1,
    waiting = 2
}

const enum GameStatus {
    waiting = 0,
    in_progress = 1,
    in_reveal = 2,
    draw = 3,
    completed = 4
}

const enum GameSpeed {
    fast = 0,
    slow = 1
}

const game_status : string[] = [
    "Open",
    "In Progress",
    "In Reveal",
    "Draw",
    "Complete"
]

export function ArenaScreen({bearer_token} : {bearer_token : string})
{
    const wallet = useWallet();

    const [activeTab, setActiveTab] = useState<any>("game_list");
    const [chosen_character, setChosenCharacter] = useState<PlayerCharacter>(PlayerCharacter.Knight);
    const [chosen_speed, setChosenSpeed] = useState<GameSpeed>(GameSpeed.slow);

    const [waiting_games, setWaitingGames] = useState<GameData[]>([]);
    const [my_games, setMyGames] = useState<GameData[]>([]);
    const [active_game, setActiveGame] = useState<GameData | null>(null);

    const [bet_size_string, setBetSizeString] = useState<string>("0.05");

    const [show_new_game, setShowNewGame] = useState<boolean>(false);
    const [show_join_game, setShowJoinGame] = useState<boolean>(false);

    const check_arena = useRef<boolean>(true);

    const BetSizeRef = useRef<HTMLInputElement>(null);
    const game_interval = useRef<number | null>(null);

    const use_websocket = useRef<boolean>(true);
    const ws = useRef<WebSocket | null>(null);
    const ws_id = useRef<number | null>(null);

    const [processing_transaction, setProcessingTransaction] = useState<boolean>(false);

    const check_active_game = useCallback(async() => 
    {
        console.log("in check games")
        if (active_game === null) {
            return;
        }

        let seed_bytes = uInt32ToLEBytes(active_game.seed);
        let game_data_account = (PublicKey.findProgramAddressSync([active_game.player_one.toBytes(), seed_bytes, Buffer.from("Game")], ARENA_PROGRAM))[0];


        let game_data = await request_arena_game_data(bearer_token, game_data_account);

        if (game_data === null) {
            console.log("error getting active game data");
            return;
        }

        let new_game_id = game_data.game_id;

        if (bignum_to_num(new_game_id) !== bignum_to_num(active_game.game_id)) {
            console.log("active game has changed since requesting data");
            return;
        }

        let new_game_interactions = game_data.num_interactions;

        if (new_game_interactions <= game_data.num_interactions) {
            console.log("no change in game state for active game");
            return;
        }

        setActiveGame(game_data);

    }, [bearer_token, active_game]);


    useEffect(() => {

        if (use_websocket.current === false || DEV_WSS_NODE === undefined)
            return;

        console.log(DEV_WSS_NODE)
        if (active_game === null) {
            if (ws_id.current !== null) {
                let message = `{"id":1,"jsonrpc":"2.0","method": "accountUnsubscribe", "params": [` + ws_id.current + `]}`
                ws.current?.send(message);

            }
            return;
        }
 
        console.log("setup websocket for active game");
        let seed_bytes = uInt32ToLEBytes(active_game.seed);

        let game_data_account = (PublicKey.findProgramAddressSync([active_game.player_one.toBytes(), seed_bytes, Buffer.from("Game")], ARENA_PROGRAM))[0];


        let message = `{"id":1,"jsonrpc":"2.0","method":"accountSubscribe","params":["` + game_data_account.toString() + `",{"encoding": "jsonParsed"}]}`

        console.log(message);

        if (ws.current === null || ws.current.CLOSED) {
            ws.current = new WebSocket(DEV_WSS_NODE);
        }


        // when the websocket connects, send our request, and then in one second (hopefully long enough )
        ws.current.onopen = () => {ws.current?.send(message); console.log("ws opened");};
        ws.current.onclose = () => {ws_id.current = null; console.log("ws closed")};

        ws.current.onmessage = (event) => {

            // the first message will be the subscription id, once we have that get the current state of the game as we will be tracking and updates from then on via the subscription
            if (ws_id.current === null) {
                ws_id.current = event.data["result"];
                check_active_game();
            }
            console.log("got message", event.data);
        };
    
     
        return () => {
            ws.current?.close();
        };
        

    }, [active_game, check_active_game]);





    const check_games = useCallback(async() => 
    {
        console.log("in check games")
        if (check_arena.current === false) {
            return;
        }

        console.log("update games");

        let list = await run_arena_free_game_GPA(bearer_token);
        //console.log(list)

        let waiting_list = list.filter(function (game) {
            return game.status === 0 && wallet.publicKey !== null && (!game.player_one.equals(wallet.publicKey) && !game.player_two.equals(wallet.publicKey));
        });
        setWaitingGames(waiting_list);

        if (wallet.publicKey === null)
            return;

        let my_games = list.filter(function (game) {
            return wallet.publicKey !== null && (game.player_one.equals(wallet.publicKey) || game.player_two.equals(wallet.publicKey));
        });
        setMyGames(my_games);
/*
        let new_active_game = list.filter(function (game) {
            return (active_game !== null && bignum_to_num(game.game_id) === bignum_to_num(active_game.game_id));
        });

        if (new_active_game.length > 0) {
            
            setActiveGame(new_active_game[0]);
            console.log("found active game: ", new_active_game[0]);
        }
*/
        check_arena.current = false;

    }, [bearer_token, wallet]);

    // interval for checking state
    useEffect(() => {

        if (game_interval.current === null) {
            game_interval.current = window.setInterval(check_games, 5000);
        }
        else{
            window.clearInterval(game_interval.current);
            game_interval.current = null;
            
        }
        // here's the cleanup function
        return () => {
            if (game_interval.current !== null) {
                window.clearInterval(game_interval.current);
                game_interval.current = null;
            }
        };
    }, [check_games]);

    useEffect(() => 
    {
        if (!check_arena.current)
            return;

            check_games();
        
    }, [check_games]);

    const Listings = ({game_list} : {game_list : GameData[]}) => {
        return(
            <>{
                game_list.map((item : GameData, index) => 
                    <ArenaGameCard key={index} game={item} index={index}/>
            )
            }
            </>
        );
    }

    const GameTable = ({game_list} : {game_list : GameData[]}) => {
        return(
            <Box width = "100%">
                <div className="font-face-sfpb" style={{color: "white", fontSize: DUNGEON_FONT_SIZE}}>
                    <Table className="custom-centered-table">
                        <thead>
                        <tr>
                        <th>Game</th>
                        <th>Bet Size</th>
                        <th>Speed</th>
                        <th>Match</th>
                        <th>Status</th>
                        <th>
                        <Box as='button' onClick={() => {check_arena.current = true; check_games()}}>
                        <FontAwesomeIcon color="white"icon={solid("arrows-rotate")} size="lg"/>
                        </Box>
                        </th>
                        </tr>
                        </thead>
                        <tbody style={{
                            backgroundColor: 'black'
                        }}>
                            <Listings game_list={game_list}/>
                        </tbody>
                    </Table>
                </div>
            </Box>
        );
    }


    const ArenaGameCard = ({game, index} : {game : GameData, index : number}) => {

        console.log(index, game);
        let bet_size : number = bignum_to_num(game.bet_size) / LAMPORTS_PER_SOL;
        console.log("index", index, "price", bet_size);

        let EMOJI_SIZE=32;

        return (
            <tr>
                <td >RPS</td>
                <td >{bet_size}</td>
                <td>{game.game_speed === GameSpeed.fast ? "Fast" : "Slow"}</td>
                <td>
                    <Center>
                    <HStack>
                    <img src={player_emoji_map.get(game.player_one_character)} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/>
                    <Text  align="center" fontSize={DUNGEON_FONT_SIZE} color="white">vs</Text>
                    {game.status === GameStatus.waiting ?
                        <img src={player_emoji_map.get(game.player_two_character)} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE, visibility: "hidden"}}/>
                    :
                    <img src={player_emoji_map.get(game.player_two_character)} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/>

                    }

                    </HStack>
                    </Center>
                </td>
                <td >{game_status[game.status]}</td>
                <td>
                    {wallet.publicKey === null ?
                        <Box as='button' borderWidth='2px' borderColor="white"   width="60px">
                            <Text  align="center" fontSize={DUNGEON_FONT_SIZE} color="white">Join</Text>
                        </Box>
                    :
                        (game.player_one.equals(wallet.publicKey) || game.player_two.equals(wallet.publicKey)) ?
                            <Center>
                            <HStack >
                                <Box as='button' onClick={() => {setActiveGame(game)}} borderWidth='2px' borderColor="white"   width="70px">
                                    <Text  align="center" fontSize={DUNGEON_FONT_SIZE} color="white">View</Text>
                                </Box>
                                <Box as='button' onClick={processing_transaction ? () => {console.log("already clicked")} : () => CancelGameOnArena(index)}>
                                    <FontAwesomeIcon icon={solid("trash")} style={{color: "#ea1a1a",}} />
                                </Box>
                            </HStack>
                            </Center>

                        :
                        
                            <JoinGamePopOver index={index}/>
                        
                    }
                </td>
            </tr>
            
        );
    }

    const CancelGameOnArena = useCallback( async (index : number) => 
    {
       
        if (wallet.publicKey === null || wallet.signTransaction === undefined)
            return;

        setProcessingTransaction(true);
        let desired_game = my_games[index];
        let seed_bytes = uInt32ToLEBytes(desired_game.seed);
        let player_one = desired_game.player_one;

        let arena_account = (PublicKey.findProgramAddressSync([Buffer.from("arena_account")], ARENA_PROGRAM))[0];
        let game_data_account = (PublicKey.findProgramAddressSync([player_one.toBytes(), seed_bytes, Buffer.from("Game")], ARENA_PROGRAM))[0];
        let game_sol_account = (PublicKey.findProgramAddressSync([player_one.toBytes(), seed_bytes, Buffer.from("SOL")], ARENA_PROGRAM))[0];

        const instruction_data = serialise_basic_instruction(ArenaInstruction.cancel_game);

        var account_vector  = [
            {pubkey: wallet.publicKey, isSigner: true, isWritable: true},
            {pubkey: game_data_account, isSigner: false, isWritable: true},
            {pubkey: game_sol_account, isSigner: false, isWritable: true},

            {pubkey: arena_account, isSigner: false, isWritable: true},

            {pubkey: SYSTEM_KEY, isSigner: false, isWritable: false}
        ];


        const list_instruction = new TransactionInstruction({
            keys: account_vector,
            programId: ARENA_PROGRAM,
            data: instruction_data
        });

        let txArgs = await get_current_blockhash(bearer_token);

        let transaction = new Transaction(txArgs);
        transaction.feePayer = wallet.publicKey;


        transaction.add(list_instruction);

        try {
            let signed_transaction = await wallet.signTransaction(transaction);
            const encoded_transaction = bs58.encode(signed_transaction.serialize());

            var transaction_response = await send_transaction(bearer_token, encoded_transaction);
            
            if (transaction_response.result === "INVALID") {
                console.log(transaction_response)
                setProcessingTransaction(false);
                return;
            }


        } catch(error) {
            console.log(error);
            setProcessingTransaction(false);
            return;
        }

        setProcessingTransaction(false);


    },[wallet, my_games, bearer_token]);

    const ClaimReward = useCallback( async () => 
    {
       
        if (wallet.publicKey === null || wallet.signTransaction === undefined || active_game === null)
            return;

            setProcessingTransaction(true);

       
        let seed_bytes = uInt32ToLEBytes(active_game.seed);
        let player_one = active_game.player_one;

        let arena_account = (PublicKey.findProgramAddressSync([Buffer.from("arena_account")], ARENA_PROGRAM))[0];
        let game_data_account = (PublicKey.findProgramAddressSync([player_one.toBytes(), seed_bytes, Buffer.from("Game")], ARENA_PROGRAM))[0];
        let game_sol_account = (PublicKey.findProgramAddressSync([player_one.toBytes(), seed_bytes, Buffer.from("SOL")], ARENA_PROGRAM))[0];
        let fees_account = (PublicKey.findProgramAddressSync([Buffer.from("data_account")], DM_PROGRAM))[0];

        const instruction_data = serialise_basic_instruction(ArenaInstruction.claim_reward);

        var account_vector  = [
            {pubkey: wallet.publicKey, isSigner: true, isWritable: true},
            {pubkey: game_data_account, isSigner: false, isWritable: true},
            {pubkey: game_sol_account, isSigner: false, isWritable: true},
            {pubkey: fees_account, isSigner: false, isWritable: true},

            {pubkey: arena_account, isSigner: false, isWritable: true},

            {pubkey: SYSTEM_KEY, isSigner: false, isWritable: false}
        ];


        const list_instruction = new TransactionInstruction({
            keys: account_vector,
            programId: ARENA_PROGRAM,
            data: instruction_data
        });

        let txArgs = await get_current_blockhash(bearer_token);

        let transaction = new Transaction(txArgs);
        transaction.feePayer = wallet.publicKey;


        transaction.add(list_instruction);

        try {
            let signed_transaction = await wallet.signTransaction(transaction);
            const encoded_transaction = bs58.encode(signed_transaction.serialize());

            var transaction_response = await send_transaction(bearer_token, encoded_transaction);
            
            if (transaction_response.result === "INVALID") {
                console.log(transaction_response)
                setProcessingTransaction(false);
                return;
            }

            let player_emoji = ArenaCharacterEmoji[active_game.player_one_character];
            if (active_game.player_two.equals(wallet.publicKey)) {
                player_emoji = ArenaCharacterEmoji[active_game.player_two_character];
            }
            let post_string = player_emoji + " won " + (bignum_to_num(active_game.bet_size) / LAMPORTS_PER_SOL).toFixed(3) + " in the arena " + GoldEmoji;
            console.log(post_string);
            if (PROD)
                post_discord_message(post_string);

            setActiveGame(null);


        } catch(error) {
            console.log(error);
            setProcessingTransaction(false);
            return;
        }

        setProcessingTransaction(false);

    },[wallet, active_game, bearer_token]);


    const JoinGameOnArena = useCallback( async (index : number) => 
    {
       
        if (wallet.publicKey === null || wallet.signTransaction === undefined)
            return;

        setProcessingTransaction(true);

        let desired_game = waiting_games[index];
        let seed_bytes = uInt32ToLEBytes(desired_game.seed);
        let player_one = desired_game.player_one;

        let arena_account = (PublicKey.findProgramAddressSync([Buffer.from("arena_account")], ARENA_PROGRAM))[0];
        let game_data_account = (PublicKey.findProgramAddressSync([player_one.toBytes(), seed_bytes, Buffer.from("Game")], ARENA_PROGRAM))[0];
        let game_sol_account = (PublicKey.findProgramAddressSync([player_one.toBytes(), seed_bytes, Buffer.from("SOL")], ARENA_PROGRAM))[0];

        const instruction_data = serialise_Arena_JoinGame_instruction(ArenaInstruction.join_game, chosen_character);

        var account_vector  = [
            {pubkey: wallet.publicKey, isSigner: true, isWritable: true},
            {pubkey: game_data_account, isSigner: false, isWritable: true},
            {pubkey: game_sol_account, isSigner: false, isWritable: true},

            {pubkey: arena_account, isSigner: false, isWritable: true},

            {pubkey: SYSTEM_KEY, isSigner: false, isWritable: false}
        ];


        const list_instruction = new TransactionInstruction({
            keys: account_vector,
            programId: ARENA_PROGRAM,
            data: instruction_data
        });

        let txArgs = await get_current_blockhash(bearer_token);

        let transaction = new Transaction(txArgs);
        transaction.feePayer = wallet.publicKey;


        transaction.add(list_instruction);

        try {
            let signed_transaction = await wallet.signTransaction(transaction);
            const encoded_transaction = bs58.encode(signed_transaction.serialize());

            var transaction_response = await send_transaction(bearer_token, encoded_transaction);
            
            if (transaction_response.result === "INVALID") {
                console.log(transaction_response)
                setProcessingTransaction(false);
                return;
            }


        } catch(error) {
            console.log(error);
            setProcessingTransaction(false);
            return;
        }

        setProcessingTransaction(false);

        // if we get this far just set the joined game to the active one
        setActiveGame(desired_game);

    },[wallet, waiting_games, bearer_token, chosen_character]);

    const ListGameOnArena = useCallback( async () => 
    {
       
        if (wallet.publicKey === null || wallet.signTransaction === undefined)
            return;

        setProcessingTransaction(true);

        let seed = (Math.random()*1e9);
        console.log("seed", seed);
        let seed_bytes = uInt32ToLEBytes(seed);
        let arena_account = (PublicKey.findProgramAddressSync([Buffer.from("arena_account")], ARENA_PROGRAM))[0];
        let game_data_account = (PublicKey.findProgramAddressSync([wallet.publicKey.toBytes(), seed_bytes, Buffer.from("Game")], ARENA_PROGRAM))[0];
        let sol_data_account = (PublicKey.findProgramAddressSync([wallet.publicKey.toBytes(), seed_bytes, Buffer.from("SOL")], ARENA_PROGRAM))[0];

        console.log("arena: ", arena_account.toString());
        console.log("game_data_account: ", game_data_account.toString());
        console.log("sol_data_account: ", sol_data_account.toString());

        let bet_size = Number(bet_size_string);
        console.log(bet_size);

        if(bet_size < 0.05)
            return;

        let bet_size_bn = new BN(bet_size * LAMPORTS_PER_SOL);
        const instruction_data = serialise_Arena_CreateGame_instruction(ArenaInstruction.create_game, bet_size_bn, seed, chosen_character, chosen_speed);

        var account_vector  = [
            {pubkey: wallet.publicKey, isSigner: true, isWritable: true},
            {pubkey: game_data_account, isSigner: false, isWritable: true},
            {pubkey: sol_data_account, isSigner: false, isWritable: true},

            {pubkey: arena_account, isSigner: false, isWritable: true},
            {pubkey: SYSTEM_KEY, isSigner: false, isWritable: false}
        ];


        const list_instruction = new TransactionInstruction({
            keys: account_vector,
            programId: ARENA_PROGRAM,
            data: instruction_data
        });

        let txArgs = await get_current_blockhash(bearer_token);

        let transaction = new Transaction(txArgs);
        transaction.feePayer = wallet.publicKey;


        transaction.add(list_instruction);

        try {
            let signed_transaction = await wallet.signTransaction(transaction);
            const encoded_transaction = bs58.encode(signed_transaction.serialize());

            var transaction_response = await send_transaction(bearer_token, encoded_transaction);
            
            if (transaction_response.result === "INVALID") {
                console.log(transaction_response)
                setProcessingTransaction(false);
                return;
            }

        } catch(error) {
            console.log(error);
            setProcessingTransaction(false);
            return;
        }

        setProcessingTransaction(false);
        setShowNewGame(false);

    },[wallet, bet_size_string, bearer_token, chosen_character, chosen_speed]);

    const RevealMoveInGame = useCallback( async () => 
    {
       
        if (wallet.publicKey === null || wallet.signTransaction === undefined || active_game === null)
            return;

        setProcessingTransaction(true);

        console.log(active_game);
        let seed_bytes = uInt32ToLEBytes(active_game.seed);

        console.log("sending reveal move to DB");
        const db_url = `/.netlify/functions/post_to_db?method=Reveal&game_id=`+active_game.game_id;
        const send_result = await fetch(db_url).then((res) => res.json());
        console.log("Reveal send : ", send_result);

        if (send_result["statusCode"] !== 200) {
            console.log("Error getting moves from DB")
            setProcessingTransaction(false);
            return;
        }

        let message_body = JSON.parse(send_result["body"])
        console.log(message_body)


        let arena_account = (PublicKey.findProgramAddressSync([Buffer.from("arena_account")], ARENA_PROGRAM))[0];
        let game_data_account = (PublicKey.findProgramAddressSync([active_game.player_one.toBytes(), seed_bytes, Buffer.from("Game")], ARENA_PROGRAM))[0];
        let sol_data_account = (PublicKey.findProgramAddressSync([active_game.player_one.toBytes(), seed_bytes, Buffer.from("SOL")], ARENA_PROGRAM))[0];

        const instruction_data = serialise_Arena_Reveal_instruction(ArenaInstruction.reveal_move, message_body["move_0"], message_body["salt_0"], message_body["move_1"], message_body["salt_1"]);

        var account_vector  = [
            {pubkey: wallet.publicKey, isSigner: true, isWritable: true},
            {pubkey: game_data_account, isSigner: false, isWritable: true},
            {pubkey: sol_data_account, isSigner: false, isWritable: true},

            {pubkey: arena_account, isSigner: false, isWritable: true},
        
            {pubkey: SYSTEM_KEY, isSigner: false, isWritable: false}
        ];


        const list_instruction = new TransactionInstruction({
            keys: account_vector,
            programId: ARENA_PROGRAM,
            data: instruction_data
        });

        let txArgs = await get_current_blockhash(bearer_token);

        let transaction = new Transaction(txArgs);
        transaction.feePayer = wallet.publicKey;


        transaction.add(list_instruction);

        try {
            let signed_transaction = await wallet.signTransaction(transaction);
            const encoded_transaction = bs58.encode(signed_transaction.serialize());

            var transaction_response = await send_transaction(bearer_token, encoded_transaction);
            
            if (transaction_response.result === "INVALID") {
                console.log(transaction_response)
                setProcessingTransaction(false);
                return;
            }



        } catch(error) {
            console.log(error);
            setProcessingTransaction(false);
            return;
        }

        setProcessingTransaction(false);


    },[wallet, active_game, bearer_token]);

    const TakeMoveInGame = useCallback( async (move : number) => 
    {
       
        if (wallet.publicKey === null || wallet.signTransaction === undefined || active_game === null)
            return;

        setProcessingTransaction(true);

        console.log(active_game);
        let seed_bytes = uInt32ToLEBytes(active_game.seed);

        let arena_account = (PublicKey.findProgramAddressSync([Buffer.from("arena_account")], ARENA_PROGRAM))[0];
        let game_data_account = (PublicKey.findProgramAddressSync([active_game.player_one.toBytes(), seed_bytes, Buffer.from("Game")], ARENA_PROGRAM))[0];
        let sol_data_account = (PublicKey.findProgramAddressSync([active_game.player_one.toBytes(), seed_bytes, Buffer.from("SOL")], ARENA_PROGRAM))[0];

        let player_id;
        if (active_game.player_one.equals(wallet.publicKey)) {
            player_id = 0;
        }
        if (active_game.player_two.equals(wallet.publicKey)) {
            player_id = 1;
        }


        console.log("sending move to DB as player", player_id);
        const db_url = `/.netlify/functions/post_to_db?method=Insert&game_id=`+active_game.game_id+"&player_id=" + player_id + "&move="+ move + "&round="+ active_game.num_round;
        const send_result = await fetch(db_url).then((res) => res.json());
        console.log("Move send : ", send_result);

        if (send_result["statusCode"] !== 200) {
            console.log("Error sending move to DB")
            setProcessingTransaction(false);
            return;
        }

        let message_body = JSON.parse(send_result["body"])
        console.log(message_body)

        let hash_array = message_body["hash"];
        console.log(hash_array)
        const instruction_data = serialise_Arena_Move_instruction(ArenaInstruction.take_move, hash_array);

        var account_vector  = [
            {pubkey: wallet.publicKey, isSigner: true, isWritable: true},
            {pubkey: game_data_account, isSigner: false, isWritable: true},
            {pubkey: sol_data_account, isSigner: false, isWritable: true},

            {pubkey: arena_account, isSigner: false, isWritable: true},
        
            {pubkey: SYSTEM_KEY, isSigner: false, isWritable: false}
        ];


        const list_instruction = new TransactionInstruction({
            keys: account_vector,
            programId: ARENA_PROGRAM,
            data: instruction_data
        });

        let txArgs = await get_current_blockhash(bearer_token);

        let transaction = new Transaction(txArgs);
        transaction.feePayer = wallet.publicKey;


        transaction.add(list_instruction);

        try {
            let signed_transaction = await wallet.signTransaction(transaction);
            const encoded_transaction = bs58.encode(signed_transaction.serialize());

            var transaction_response = await send_transaction(bearer_token, encoded_transaction);
            
            if (transaction_response.result === "INVALID") {
                console.log(transaction_response)
                setProcessingTransaction(false);
                return;
            }



        } catch(error) {
            console.log(error);
            setProcessingTransaction(false);
            return;
        }

        setProcessingTransaction(false);

    },[wallet, active_game, bearer_token]);


    function CharacterSelect() {

        let EMOJI_SIZE = 32

        return(
            <VStack align={"center"}>

                <HStack>
                <Box as="button" onClick={() => setChosenCharacter(PlayerCharacter.Knight)} borderWidth= {chosen_character === PlayerCharacter.Knight ? "1px" : "0px"} borderColor="white">
                    <img src={knight_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/>
                </Box>
                <Box as="button" onClick={() => setChosenCharacter(PlayerCharacter.Ranger)} borderWidth= {chosen_character === PlayerCharacter.Ranger ? "1px" : "0px"} borderColor="white">
                    <img src={ranger_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}} />
                </Box>
                <Box as="button" onClick={() => setChosenCharacter(PlayerCharacter.Wizard)} borderWidth= {chosen_character === PlayerCharacter.Wizard ? "1px" : "0px"} borderColor="white">
                    <img src={wizard_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/>
                </Box>
                <Box as="button" onClick={() => setChosenCharacter(PlayerCharacter.GreenSlime)} borderWidth= {chosen_character === PlayerCharacter.GreenSlime ? "1px" : "0px"} borderColor="white">
                    <img src={green_slime_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/>
                </Box>
                <Box as="button" onClick={() => setChosenCharacter(PlayerCharacter.GiantRat)} borderWidth= {chosen_character === PlayerCharacter.GiantRat ? "1px" : "0px"} borderColor="white">
                    <img src={giant_rat_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/>
                </Box>
                <Box as="button" onClick={() => setChosenCharacter(PlayerCharacter.GiantSpider)} borderWidth= {chosen_character === PlayerCharacter.GiantSpider ? "1px" : "0px"} borderColor="white">
                    <img src={giant_spider_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/>
                </Box>
                </HStack>
                <HStack>
                    <img src={goblins_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE, filter: 'grayscale(1)'}}/>
                    <img src={boulder_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE, filter: 'grayscale(1)'}}/>
                    <img src={mimic_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE, filter: 'grayscale(1)'}}/>
                    <img src={skeletons_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE, filter: 'grayscale(1)'}}/>
                    <img src={floor_spikes_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE, filter: 'grayscale(1)'}}/>
                    <img src={carnivine_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE, filter: 'grayscale(1)'}}/>
                    <img src={giant_green_slime_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE, filter: 'grayscale(1)'}}/>
                </HStack>
                <HStack>
                    <img src={werewolf_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE, filter: 'grayscale(1)'}}/>
                    <img src={blue_slime_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE, filter: 'grayscale(1)'}}/>
                    <img src={elves_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE, filter: 'grayscale(1)'}}/>
                    <img src={giant_blue_slime_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE, filter: 'grayscale(1)'}}/>
                    <img src={orc_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE, filter: 'grayscale(1)'}}/>
                    <img src={skeleton_knight_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE, filter: 'grayscale(1)'}}/>
                    <img src={skeleton_wizard_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE, filter: 'grayscale(1)'}}/>
                </HStack>
                <HStack>
                    <img src={assassin_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE, filter: 'grayscale(1)'}}/>
                    <img src={dungeon_master_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE, filter: 'grayscale(1)'}}/>
                    <img src={shade_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE, filter: 'grayscale(1)'}}/>
                </HStack>
            </VStack>
        );
    }

    function JoinGamePopOver({index} : {index : number}) {

  
        return (
            <>
            <div style={{ margin: 0 }}>
              <Popover
                returnFocusOnClose={false}
                isOpen={show_join_game}
                onClose={() => setShowJoinGame(false)}
                placement="bottom"
                closeOnBlur={false}
              >
                <PopoverTrigger>
                  <Box
                    as="button"
                    onClick={() => setShowJoinGame(true)}
                    borderWidth="2px"
                    borderColor="white"
                    width="60px"
                  >
                    <div className="font-face-sfpb">
                    <Text align="center" fontSize={DUNGEON_FONT_SIZE} color="white">
                      Join
                    </Text>
                    </div>
                  </Box>
                </PopoverTrigger>
                <PopoverContent backgroundColor={"black"}>
                  <div className="font-face-sfpb" color="white">
                    <PopoverHeader
                      style={{ borderBottomWidth: 0 }}
                      fontSize={DUNGEON_FONT_SIZE}
                      color="white"
                      fontWeight="semibold"
                      ml="2rem"
                      mr="2rem"
                    >
                      Character Select
                    </PopoverHeader>
                  </div>
                  <PopoverArrow />
                  <PopoverCloseButton ml="1rem" color="white" />
                  <PopoverBody>
                    <FocusLock returnFocus persistentFocus={false}>
                      <div className="font-face-sfpb">
                        <VStack align="center" spacing="10px">
                          <CharacterSelect/>
                          <Box
                            as="button"
                            borderWidth="2px"
                            borderColor="white"
                            width="120px"
                          >
                            <Text align="center" onClick={processing_transaction ? () => {console.log("already clicked")} : () => JoinGameOnArena(index)} fontSize={DUNGEON_FONT_SIZE} color="white">
                              Let's Go!
                            </Text>
                          </Box>
                        </VStack>
                      </div>
                    </FocusLock>
                  </PopoverBody>
                </PopoverContent>
              </Popover>
            </div>
            </>
            )
        }


    function ListNewGame() {

  
        return (
            <>
            <div style={{ marginTop: "1rem" }}></div>
            <div style={{ margin: 0 }}>
              <Popover
                returnFocusOnClose={false}
                isOpen={show_new_game}
                onClose={() => setShowNewGame(false)}
                placement="bottom"
                closeOnBlur={false}
              >
                <PopoverTrigger>
                  <Box
                    as="button"
                    onClick={() => setShowNewGame(true)}
                    borderWidth="2px"
                    borderColor="white"
                    width="250px"
                  >
                    <div className="font-face-sfpb">
                    <Text align="center" fontSize={DUNGEON_FONT_SIZE} color="white">
                      Create New Game
                    </Text>
                    </div>
                  </Box>
                </PopoverTrigger>
                <PopoverContent backgroundColor={"black"}>
                  <div className="font-face-sfpb" color="white">
                    <PopoverHeader
                      style={{ borderBottomWidth: 0 }}
                      fontSize={DUNGEON_FONT_SIZE}
                      color="white"
                      fontWeight="semibold"
                      ml="2rem"
                      mr="2rem"
                    >
                      Enter Game Details
                    </PopoverHeader>
                  </div>
                  <PopoverArrow />
                  <PopoverCloseButton ml="1rem" color="white" />
                  <PopoverBody>
                    <FocusLock returnFocus persistentFocus={false}>
                      <div className="font-face-sfpb">
                        <VStack align="center" spacing="10px">
                          <HStack width="80%" align={"center"}>
                            <Box width="50%">
                              <Text align={"left"} fontSize={DUNGEON_FONT_SIZE} color="white">
                                Game:
                              </Text>
                            </Box>
                            <Box width="50%">
                              <Text align={"left"} fontSize={DUNGEON_FONT_SIZE} color="white">
                                RPS
                              </Text>
                            </Box>
                          </HStack>
                          <HStack width="80%" align={"center"}>
                            <Box width="50%">
                              <Text align={"left"} fontSize={DUNGEON_FONT_SIZE} color="white">
                                Bet Size:
                              </Text>
                            </Box>
                            <Box width="50%">
                              <NumberInput
                                id="desired_betsize"
                                ref={BetSizeRef}
                                fontSize={DUNGEON_FONT_SIZE}
                                color="white"
                                size="lg"
                                onChange={(valueString) => {
                                    setBetSizeString(valueString);
                                }}
                                value={bet_size_string}
                                borderColor="white"
                                min={0.05}
                              >
                                <NumberInputField
                                  height={DUNGEON_FONT_SIZE}
                                  paddingTop="1rem"
                                  paddingBottom="1rem"
                                  borderColor="white"
                                  autoFocus={false}
                                />
                              </NumberInput>
                            </Box>
                          </HStack>
                          <HStack width="80%" align={"center"}>
                            <Box  width="50%">
                                <Text align={"left"} fontSize={DUNGEON_FONT_SIZE} color="white">
                                    Speed:
                                </Text>
                            </Box>
                            <Box
                                as="button"
                                borderWidth="2px"
                                borderColor={chosen_speed === GameSpeed.slow ? "white" : "black"}
                                width="80px"
                                height={35}
                                onClick={() => setChosenSpeed(GameSpeed.slow)} 
                           
                            >
                            <Text align="center" fontSize={DUNGEON_FONT_SIZE} color="white">
                              Slow
                            </Text>
                          </Box>
                          
                          <Box
                            as="button"
                            borderWidth="2px"
                            borderColor={chosen_speed === GameSpeed.fast ? "white" : "black"}
                            width="80px"
                            height={35}
                            onClick={() => setChosenSpeed(GameSpeed.fast)} 

                          >
                            <Text align="center" fontSize={DUNGEON_FONT_SIZE} color="white">
                              Fast
                            </Text>

                          </Box>
                          
                          </HStack>
                          <Box width="80%">
                              <Text align={"left"} fontSize={DUNGEON_FONT_SIZE} color="white">
                                Character Select:
                              </Text>
                            </Box>
                          <CharacterSelect/>
                          <Box
                            as="button"
                            borderWidth="2px"
                            borderColor="white"
                            width="120px"
                          >
                            <Text align="center" onClick={processing_transaction ? () => {console.log("already clicked")} : ListGameOnArena} fontSize={DUNGEON_FONT_SIZE} color="white">
                              CREATE
                            </Text>
                          </Box>
                        </VStack>
                      </div>
                    </FocusLock>
                  </PopoverBody>
                </PopoverContent>
              </Popover>
            </div>
            </>
            )
        }

    
    const DisplayPlayer = ({player_character, player_status, is_player_one} : {player_character : PlayerCharacter, player_status : ArenaStatus, is_player_one : boolean}) => {

        let transform;
        if (player_status === ArenaStatus.dead) {
                // for the traps we don't return anything
                if (player_character === PlayerCharacter.BoulderTrap) {
                    return(<></>);
                }
                if (player_character === PlayerCharacter.SpikeTrap) {
                    return(<></>);
                }

                if (player_character === PlayerCharacter.Mimic) {
                    return ( <img style={{"imageRendering":"pixelated"}} src={open_chest} width="10000" alt={""}/> );
                }

                if (player_character === PlayerCharacter.GreenSlime || player_character === PlayerCharacter.GiantGreenSlime) {
                    return ( <img style={{"imageRendering":"pixelated"}} src={green_slime_corpse} width="10000" alt={""}/> );
                }

                if (player_character === PlayerCharacter.BlueSlime || player_character === PlayerCharacter.GiantBlueSlime) {
                    return ( <img style={{"imageRendering":"pixelated"}} src={blue_slime_corpse} width="10000" alt={""}/> );
                }

                if (player_character === PlayerCharacter.Werewolf) {
                    return ( <img style={{"imageRendering":"pixelated"}} src={werewolf_corpse} width="10000" alt={""}/> );
                }

                if (player_character === PlayerCharacter.Carnivine) {
                    return ( <img style={{"imageRendering":"pixelated"}} src={carnivine_corpse} width="10000" alt={""}/> );
                }

                if (player_character === PlayerCharacter.Shade) {
                    return ( <img style={{"imageRendering":"pixelated"}} src={shade_corpse} width="10000" alt={""}/> );
                }

                if (player_character === PlayerCharacter.GiantSpider) {
                    return ( <img style={{"imageRendering":"pixelated"}} src={spider_corpse} width="10000" alt={""}/> );
                }

                if (player_character === PlayerCharacter.Skeletons) {
                    return ( <img style={{"imageRendering":"pixelated"}} src={bones} width="10000" alt={""}/> );
                }

                return ( <img style={{"imageRendering":"pixelated"}} src={corpse} width="10000" alt={""}/> );
        }

        if (player_character === PlayerCharacter.Knight){
            transform = !is_player_one ? "scaleX(-1)" : "scaleX(1)";
            return ( <img style={{"imageRendering":"pixelated", "transform": transform}} src={knight} width="10000" alt={""}/> );
        }
        if (player_character === PlayerCharacter.Ranger){
            transform = !is_player_one ? "scaleX(-1)" : "scaleX(1)";
            return ( <img style={{"imageRendering":"pixelated", "transform": transform}} src={ranger} width="10000" alt={""}/> );
        }
        if (player_character === PlayerCharacter.Wizard){
            transform = !is_player_one ? "scaleX(-1)" : "scaleX(1)";
            return ( <img style={{"imageRendering":"pixelated", "transform": transform}} src={wizard} width="10000" alt={""}/> );
        }
        if (player_character === PlayerCharacter.Assassin) {
            transform = is_player_one ? "scaleX(-1)" : "scaleX(1)";
            return ( <img style={{"imageRendering":"pixelated", "transform": transform}} src={assassin} width="10000" alt={""}/> );
        }
        if (player_character === PlayerCharacter.BlueSlime) {
            transform = is_player_one ? "scaleX(-1)" : "scaleX(1)";
            return ( <img style={{"imageRendering":"pixelated", "transform": transform}} src={blue_slime} width="10000" alt={""}/> );
        }
        if (player_character === PlayerCharacter.Carnivine) {
            transform = is_player_one ? "scaleX(-1)" : "scaleX(1)";
            return ( <img style={{"imageRendering":"pixelated", "transform": transform}} src={carnivine} width="10000" alt={""}/> );
        }
        if (player_character === PlayerCharacter.DM) {
            transform = is_player_one ? "scaleX(-1)" : "scaleX(1)";
            return ( <img style={{"imageRendering":"pixelated", "transform": transform}} src={dungeon_master} width="10000" alt={""}/> );
        }
        if (player_character === PlayerCharacter.Elves) {
            transform = is_player_one ? "scaleX(-1)" : "scaleX(1)";
            return ( <img style={{"imageRendering":"pixelated", "transform": transform}} src={elves} width="10000" alt={""}/> );
        }
        if (player_character === PlayerCharacter.GiantBlueSlime) {
            transform = is_player_one ? "scaleX(-1)" : "scaleX(1)";
            return ( <img style={{"imageRendering":"pixelated", "transform": transform}} src={giant_blue_slime} width="10000" alt={""}/> );
        }
        if (player_character === PlayerCharacter.GiantGreenSlime) {
            transform = is_player_one ? "scaleX(-1)" : "scaleX(1)";
            return ( <img style={{"imageRendering":"pixelated", "transform": transform}} src={giant_green_slime} width="10000" alt={""}/> );
        }
        if (player_character === PlayerCharacter.GiantRat) {
            transform = is_player_one ? "scaleX(-1)" : "scaleX(1)";
            return ( <img style={{"imageRendering":"pixelated", "transform": transform}} src={giant_rat} width="10000" alt={""}/> );
        }
        if (player_character === PlayerCharacter.GiantSpider) {
            transform = is_player_one ? "scaleX(-1)" : "scaleX(1)";
            return ( <img style={{"imageRendering":"pixelated", "transform": transform}} src={giant_spider} width="10000" alt={""}/> );
        }
        if (player_character === PlayerCharacter.Goblins) {
            transform = is_player_one ? "scaleX(-1)" : "scaleX(1)";
            return ( <img style={{"imageRendering":"pixelated", "transform": transform}} src={goblins} width="10000" alt={""}/> );
        }
        if (player_character === PlayerCharacter.GreenSlime) {
            transform = is_player_one ? "scaleX(-1)" : "scaleX(1)";
            return ( <img style={{"imageRendering":"pixelated", "transform": transform}} src={green_slime} width="10000" alt={""}/> );
        }
        if (player_character === PlayerCharacter.Mimic) {
            transform = is_player_one ? "scaleX(-1)" : "scaleX(1)";
            return ( <img style={{"imageRendering":"pixelated", "transform": transform}} src={closed_chest} width="10000" alt={""}/> );
        }
        if (player_character === PlayerCharacter.Orc) {
            transform = is_player_one ? "scaleX(-1)" : "scaleX(1)";
            return ( <img style={{"imageRendering":"pixelated", "transform": transform}} src={orc} width="10000" alt={""}/> );
        }
        if (player_character === PlayerCharacter.Shade) {
            transform = is_player_one ? "scaleX(-1)" : "scaleX(1)";
            return ( <img style={{"imageRendering":"pixelated", "transform": transform}} src={shade} width="10000" alt={""}/> );
        }
        if (player_character === PlayerCharacter.SkeletonKnight) {
            transform = is_player_one ? "scaleX(-1)" : "scaleX(1)";
            return ( <img style={{"imageRendering":"pixelated", "transform": transform}} src={skeleton_knight} width="10000" alt={""}/> );
        }
        if (player_character === PlayerCharacter.Skeletons) {
            transform = is_player_one ? "scaleX(-1)" : "scaleX(1)";
            return ( <img style={{"imageRendering":"pixelated", "transform": transform}} src={skeletons} width="10000" alt={""}/> );
        }
        if (player_character === PlayerCharacter.SkeletonWizard) {
            transform = is_player_one ? "scaleX(-1)" : "scaleX(1)";
            return ( <img style={{"imageRendering":"pixelated", "transform": transform}} src={skeleton_wizard} width="10000" alt={""}/> );
        }
        if (player_character === PlayerCharacter.Werewolf) {
            transform = is_player_one ? "scaleX(-1)" : "scaleX(1)";
            return ( <img style={{"imageRendering":"pixelated", "transform": transform}} src={werewolf} width="10000" alt={""}/> );
        }

        // for the traps we don't return anything
        if (player_character === PlayerCharacter.BoulderTrap) {
            return(<></>);
        }
        if (player_character === PlayerCharacter.SpikeTrap) {
            return(<></>);
        }

        return(<></>);
    }




    function ActiveGame() {

        if (active_game === null || wallet.publicKey === null) {
            return(
                <VStack width="100%" mb="5rem">
                <HStack width="100%" mb = "2%" mt="1%">
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
                        <Box width="15%" visibility="hidden"> <DisplayPlayer player_character={0} player_status={0} is_player_one={true}/></Box>  
                        <Box width="10%"></Box> 
                        <Box width="15%" visibility="hidden"> <DisplayPlayer player_character={0} player_status={0} is_player_one={false}/> </Box>  
                        <Box width="30%"></Box> 
    
                    </HStack>
                    </Box>
                    <Box width="10%"></Box> 
                </HStack>
            </VStack>
            );
        }

        console.log("p1 ", active_game.player_one_status, " p2 ", active_game.player_two_status);
        console.log("p1 ", active_game.player_one.toString(), " p2 ", active_game.player_two.toString());

       
        let is_player_one : boolean = true;
        if (active_game.player_two.equals(wallet.publicKey)) {
            is_player_one = false;
        }

        let is_winner = false;
        
        if (active_game.status === GameStatus.completed) {
            if (is_player_one && active_game.player_one_status === ArenaStatus.alive) {
                is_winner = true;
            }
            if (!is_player_one && active_game.player_two_status === ArenaStatus.alive) {
                is_winner = true;
            }
        }

        let player_move = RPSMove.none;
        
        if (active_game.player_one.equals(wallet.publicKey)) {
            player_move = active_game.player_one_move;
        }
        if (active_game.player_two.equals(wallet.publicKey)) {
            player_move = active_game.player_two_move;
        }

        let player_sent_encrypted_move = false;
        let opponent_sent_encrypted_move = false;
        let sum_player_one_encrypted_move = 0;
        let sum_player_two_encrypted_move = 0;

        for (let i in active_game.player_one_encrypted_move) {
            sum_player_one_encrypted_move += active_game.player_one_encrypted_move[i];
        }

        for (let i in active_game.player_two_encrypted_move) {
            sum_player_two_encrypted_move += active_game.player_two_encrypted_move[i];
        }

        if (active_game.player_one.equals(wallet.publicKey)) {
            player_sent_encrypted_move = sum_player_one_encrypted_move > 0;
            opponent_sent_encrypted_move = sum_player_two_encrypted_move > 0;

        }
        if (active_game.player_two.equals(wallet.publicKey)) {
            player_sent_encrypted_move = sum_player_two_encrypted_move > 0;
            opponent_sent_encrypted_move = sum_player_one_encrypted_move > 0;
        }
        
        console.log("sum of encrypted data:", sum_player_one_encrypted_move, sum_player_two_encrypted_move);

        return(
            <>
            <Box width="100%" mb="5rem">
            <VStack width="100%">
                <HStack width="100%" mb = "2%" mt="1%">
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
                        <Box width="15%"> <DisplayPlayer player_character={active_game.player_one_character} player_status={active_game.player_one_status} is_player_one={true}/></Box>  
                        <Box width="10%"></Box> 
                        <Box width="15%" visibility={active_game.status === 0 ? "hidden" : "visible"}> <DisplayPlayer player_character={active_game.player_two_character} player_status={active_game.player_two_status} is_player_one={false}/> </Box>  
                        <Box width="30%"></Box> 
    
                    </HStack>
                    </Box>
                    <Box width="10%"></Box> 
                </HStack>
            </VStack>

            {(active_game.status === GameStatus.in_progress || active_game.status === GameStatus.draw) &&
            <Center width="100%">
                <VStack width="100%" alignItems="center">

                    {active_game.status === GameStatus.draw &&
                
                        <Text className="font-face-sfpb" align="center" fontSize={DUNGEON_FONT_SIZE} color="white"> It's a Draw! Play again.</Text>
                    
                    
                    }
                    {!player_sent_encrypted_move  && opponent_sent_encrypted_move &&
                        <Text className="font-face-sfpb" align="center" fontSize={DUNGEON_FONT_SIZE} color="white"> Opponent has chosen their move!  How will you respond?</Text>
                    }
                    {
                        !player_sent_encrypted_move  && !opponent_sent_encrypted_move &&
                        <Text className="font-face-sfpb" align="center" fontSize={DUNGEON_FONT_SIZE} color="white"> Choose your move</Text>

                    }
                     {!player_sent_encrypted_move 
                     ?
                    <HStack>

                        <Box  as="button" onClick={processing_transaction ? () => {console.log("already clicked")} : () => TakeMoveInGame(RPSMove.rock)} borderWidth="2px"  borderColor="white"  width="200px">
                            <Text className="font-face-sfpb" align="center" fontSize={DUNGEON_FONT_SIZE} color="white"> Rock </Text>
                        </Box>

                        <Box  as="button" onClick={processing_transaction ? () => {console.log("already clicked")} : () => TakeMoveInGame(RPSMove.paper)} borderWidth="2px"  borderColor="white"  width="200px">
                            <Text className="font-face-sfpb" align="center" fontSize={DUNGEON_FONT_SIZE} color="white"> Paper </Text>
                        </Box>

                        <Box  as="button" onClick={processing_transaction ? () => {console.log("already clicked")} : () => TakeMoveInGame(RPSMove.scissors)} borderWidth="2px"  borderColor="white"  width="200px">
                            <Text className="font-face-sfpb" align="center" fontSize={DUNGEON_FONT_SIZE} color="white"> Scissors </Text>
                        </Box>
                    </HStack>
                    :
                    player_move === RPSMove.none
                    ?
                        <Text className="font-face-sfpb" align="center" fontSize={DUNGEON_FONT_SIZE} color="white"> Your move has been sent to the arena.. waiting for your opponent</Text>
                    :
                        <Text className="font-face-sfpb" align="center" fontSize={DUNGEON_FONT_SIZE} color="white"> Decrypted Move Sent: {rps_move[player_move]}</Text>
                    }
                </VStack>
            </Center>
            }
            {active_game.status === GameStatus.in_reveal && 

            <Center>
                <VStack>
                <Text className="font-face-sfpb" align="center" fontSize={DUNGEON_FONT_SIZE} color="white"> All moves have been submitted! Let's end this. </Text>

                <Box  as="button" onClick={processing_transaction ? () => {console.log("already clicked")} : () => RevealMoveInGame()} borderWidth="2px"  borderColor="white"  width="200px">
                    
                    <Text className="font-face-sfpb" align="center" fontSize={DUNGEON_FONT_SIZE} color="white"> Reveal </Text>
                </Box>
                </VStack>
            </Center>
            }
            {active_game.status === GameStatus.completed && is_winner && 

                <Center>
                    <VStack>
                    <Text className="font-face-sfpb" align="center" fontSize={DUNGEON_FONT_SIZE} color="white"> You are victorious! </Text>
                    <Box  as="button" onClick={processing_transaction ? () => {console.log("already clicked")} : () => ClaimReward()} borderWidth="2px"  borderColor="white"  width="200px">
                        <Text className="font-face-sfpb" align="center" fontSize={DUNGEON_FONT_SIZE} color="white"> Claim Reward </Text>
                    </Box>
                    </VStack>
                </Center>
            }

            {active_game.status === GameStatus.completed && !is_winner && 

            <Center>
                <Box  width="200px">
                    <Text className="font-face-sfpb" align="center" fontSize={DUNGEON_FONT_SIZE} color="white"> You have been defeated </Text>
                </Box>
            </Center>
            }

            {active_game.status === 0 &&
            
                <Text className="font-face-sfpb" align="center" fontSize={DUNGEON_FONT_SIZE} color="white"> Waiting for challenger to arrive in the arena..</Text>
            
            }
            </Box>

            </>

        );
    }

    return(
        
    <VStack width="100%" alignItems="center" mb="10rem">

        <ActiveGame/>

        <Container className="centered">

        <Tabs
            className="custom-tab justify-content-center" activeKey={activeTab} onSelect={(eventKey) => setActiveTab(eventKey)}
        >
            <Tab eventKey="game_list" title="GAME LIST" tabClassName="custom-tab justify-content-center">
                
                <Center width="100%" marginBottom="5rem">
                    <VStack width="100%" alignItems="left">
                        <ListNewGame/>
                        <GameTable game_list={waiting_games}/>
                    </VStack>
                </Center>
            
            </Tab>
            <Tab eventKey="my_games" title="MY GAMES" tabClassName="custom-tab">
            <Center width="100%" marginBottom="5rem">
                <VStack width="100%" alignItems="left">
                <Box
                    as="button"
                    borderWidth="2px"
                    borderColor="white"
                    width="250px"
                    visibility="hidden"
                  >
                    <div className="font-face-sfpb">
                    <Text align="center" fontSize={DUNGEON_FONT_SIZE} color="white">
                      Create New Game
                    </Text>
                    </div>
                  </Box>
                  <GameTable game_list={my_games}/>

                </VStack>
                </Center>
            </Tab> 
        </Tabs>
        </Container>
    </VStack>

    );

}