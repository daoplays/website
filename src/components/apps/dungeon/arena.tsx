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

import hallway from "./images/Hallway.gif"


import { DUNGEON_FONT_SIZE , ARENA_PROGRAM, SYSTEM_KEY, PROD, DM_PROGRAM} from './constants';

import {run_arena_free_game_GPA, GameData, bignum_to_num, get_current_blockhash, send_transaction, uInt32ToLEBytes, serialise_Arena_CreateGame_instruction, serialise_Arena_Move_instruction, serialise_basic_instruction, post_discord_message} from './utils';


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

import './css/table.css';
import './css/fonts.css';
import './css/tabs.css';


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
    claim_reward = 5
}


const enum RPSMove {
    none = 0,
    rock = 1,
    paper = 2,
    scissors = 3
}

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

const enum ArenaStatus {
    alive = 0,
    dead = 1,
    waiting = 2
}

const enum GameStatus {
    waiting = 0,
    in_progress = 1,
    draw = 2,
    completed = 3
}

const game_status : string[] = [
    "Open",
    "In Progress",
    "Draw",
    "Complete"
]

export function ArenaScreen({bearer_token} : {bearer_token : string})
{
    const wallet = useWallet();

    const [activeTab, setActiveTab] = useState<any>("game_list");

    const [waiting_games, setWaitingGames] = useState<GameData[]>([]);
    const [my_games, setMyGames] = useState<GameData[]>([]);
    const [active_game, setActiveGame] = useState<GameData | null>(null);

    const [bet_size_string, setBetSizeString] = useState<string>("");

    const [show_new_game, setShowNewGame] = useState<boolean>(false);
    const check_arena = useRef<boolean>(true);

    const BetSizeRef = useRef<HTMLInputElement>(null);
    const game_interval = useRef<number | null>(null);

    //const ws = useRef<WebSocket | null>(null);
    //const ws_id = useRef<number | null>(null);


/*
    useEffect(() => {

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

        if (ws.current === null || ws.current.CLOSED)
            ws.current = new WebSocket(DEV_WSS_NODE);


        ws.current.onopen = () => {ws.current?.send(message); console.log("ws opened")};
        ws.current.onclose = () => {ws_id.current = null; console.log("ws closed")};

        ws.current.onmessage = (event) => {
            if (ws_id.current === null) {
                ws_id.current = event.data["result"];
            }
            console.log("got message", event.data);
        };
    
     
        return () => {
            ws.current?.close();
        };

    }, [active_game, bearer_token]);
*/

    const check_games = useCallback(async() => 
    {
        
        if (check_arena.current === false && (activeTab !== "active_game" || active_game === null)) {
            return;
        }

        console.log("update games");

        let list = await run_arena_free_game_GPA(bearer_token);
        console.log(list)

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

        let new_active_game = list.filter(function (game) {
            return (active_game !== null && bignum_to_num(game.game_id) === bignum_to_num(active_game.game_id));
        });

        if (new_active_game.length > 0) {
            setActiveGame(new_active_game[0]);
            console.log("found active game: ", new_active_game[0]);
        }

        check_arena.current = false;

    }, [bearer_token, wallet, activeTab, active_game]);

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
        return (
            <tr>
                <td >RPS</td>
                <td >{bet_size}</td>
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
                                <Box as='button' onClick={() => {setActiveGame(game);  setActiveTab("active_game")}} borderWidth='2px' borderColor="white"   width="70px">
                                    <Text  align="center" fontSize={DUNGEON_FONT_SIZE} color="white">View</Text>
                                </Box>
                                <Box as='button' onClick={() => CancelGameOnArena(index)}>
                                    <FontAwesomeIcon icon={solid("trash")} style={{color: "#ea1a1a",}} />
                                </Box>
                            </HStack>
                            </Center>

                        :
                            <Box as='button' onClick={() => JoinGameOnArena(index)} borderWidth='2px' borderColor="white"   width="60px">
                                    <Text  align="center" fontSize={DUNGEON_FONT_SIZE} color="white">Join</Text>
                            </Box>
                    }
                </td>
            </tr>
            
        );
    }

    const CancelGameOnArena = useCallback( async (index : number) => 
    {
       
        if (wallet.publicKey === null || wallet.signTransaction === undefined)
            return;

        
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
                return;
            }


        } catch(error) {
            console.log(error);
            return;
        }

 

    },[wallet, my_games, bearer_token]);

    const ClaimReward = useCallback( async () => 
    {
       
        if (wallet.publicKey === null || wallet.signTransaction === undefined || active_game === null)
            return;

        
       
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
            return;
        }

 

    },[wallet, active_game, bearer_token]);


    const JoinGameOnArena = useCallback( async (index : number) => 
    {
       
        if (wallet.publicKey === null || wallet.signTransaction === undefined)
            return;

        
        let desired_game = waiting_games[index];
        let seed_bytes = uInt32ToLEBytes(desired_game.seed);
        let player_one = desired_game.player_one;

        let arena_account = (PublicKey.findProgramAddressSync([Buffer.from("arena_account")], ARENA_PROGRAM))[0];
        let game_data_account = (PublicKey.findProgramAddressSync([player_one.toBytes(), seed_bytes, Buffer.from("Game")], ARENA_PROGRAM))[0];
        let game_sol_account = (PublicKey.findProgramAddressSync([player_one.toBytes(), seed_bytes, Buffer.from("SOL")], ARENA_PROGRAM))[0];

        const instruction_data = serialise_basic_instruction(ArenaInstruction.join_game);

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
                return;
            }


        } catch(error) {
            console.log(error);
            return;
        }

 

    },[wallet, waiting_games, bearer_token]);

    const ListGameOnArena = useCallback( async () => 
    {
       
        if (wallet.publicKey === null || wallet.signTransaction === undefined)
            return;

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
        const instruction_data = serialise_Arena_CreateGame_instruction(ArenaInstruction.create_game, bet_size_bn, seed);

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
                return;
            }

        } catch(error) {
            console.log(error);
            return;
        }

 

    },[wallet, bet_size_string, bearer_token]);

    const TakeMoveInGame = useCallback( async (move : number) => 
    {
       
        if (wallet.publicKey === null || wallet.signTransaction === undefined || active_game === null)
            return;

        console.log(active_game);
        let seed_bytes = uInt32ToLEBytes(active_game.seed);

        let arena_account = (PublicKey.findProgramAddressSync([Buffer.from("arena_account")], ARENA_PROGRAM))[0];
        let game_data_account = (PublicKey.findProgramAddressSync([active_game.player_one.toBytes(), seed_bytes, Buffer.from("Game")], ARENA_PROGRAM))[0];
        let sol_data_account = (PublicKey.findProgramAddressSync([active_game.player_one.toBytes(), seed_bytes, Buffer.from("SOL")], ARENA_PROGRAM))[0];


        const instruction_data = serialise_Arena_Move_instruction(ArenaInstruction.take_move, move);

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
                return;
            }



        } catch(error) {
            console.log(error);
            return;
        }

 

    },[wallet, active_game, bearer_token]);

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
                        <VStack align="center">
                          <HStack width="80%" align={"left"}>
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
                          <HStack width="80%" align={"left"}>
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
                                precision={3}
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
                          <Box
                            as="button"
                            borderWidth="2px"
                            borderColor="white"
                            width="120px"
                          >
                            <Text align="center" onClick={ListGameOnArena} fontSize={DUNGEON_FONT_SIZE} color="white">
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

    
    const DisplayPlayer = ({player_character, player_status} : {player_character : PlayerCharacter, player_status : ArenaStatus}) => {


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
            return ( <img style={{"imageRendering":"pixelated"}} src={knight} width="10000" alt={""}/> );
        }
        if (player_character === PlayerCharacter.Ranger){
            return ( <img style={{"imageRendering":"pixelated"}} src={ranger} width="10000" alt={""}/> );
        }
        if (player_character === PlayerCharacter.Wizard){
            return ( <img style={{"imageRendering":"pixelated"}} src={wizard} width="10000" alt={""}/> );
        }
        if (player_character === PlayerCharacter.Assassin) {
            return ( <img style={{"imageRendering":"pixelated"}} src={assassin} width="10000" alt={""}/> );
        }
        if (player_character === PlayerCharacter.BlueSlime) {
            return ( <img style={{"imageRendering":"pixelated"}} src={blue_slime} width="10000" alt={""}/> );
        }
        if (player_character === PlayerCharacter.Carnivine) {
            return ( <img style={{"imageRendering":"pixelated"}} src={carnivine} width="10000" alt={""}/> );
        }
        if (player_character === PlayerCharacter.DM) {
            return ( <img style={{"imageRendering":"pixelated"}} src={dungeon_master} width="10000" alt={""}/> );
        }
        if (player_character === PlayerCharacter.Elves) {
            return ( <img style={{"imageRendering":"pixelated"}} src={elves} width="10000" alt={""}/> );
        }
        if (player_character === PlayerCharacter.GiantBlueSlime) {
            return ( <img style={{"imageRendering":"pixelated"}} src={giant_blue_slime} width="10000" alt={""}/> );
        }
        if (player_character === PlayerCharacter.GiantGreenSlime) {
            return ( <img style={{"imageRendering":"pixelated"}} src={giant_green_slime} width="10000" alt={""}/> );
        }
        if (player_character === PlayerCharacter.GiantRat) {
            return ( <img style={{"imageRendering":"pixelated"}} src={giant_rat} width="10000" alt={""}/> );
        }
        if (player_character === PlayerCharacter.GiantSpider) {
            return ( <img style={{"imageRendering":"pixelated"}} src={giant_spider} width="10000" alt={""}/> );
        }
        if (player_character === PlayerCharacter.Goblins) {
            return ( <img style={{"imageRendering":"pixelated"}} src={goblins} width="10000" alt={""}/> );
        }
        if (player_character === PlayerCharacter.GreenSlime) {
            return ( <img style={{"imageRendering":"pixelated"}} src={green_slime} width="10000" alt={""}/> );
        }
        if (player_character === PlayerCharacter.Mimic) {
            return ( <img style={{"imageRendering":"pixelated"}} src={closed_chest} width="10000" alt={""}/> );
        }
        if (player_character === PlayerCharacter.Orc) {
            return ( <img style={{"imageRendering":"pixelated"}} src={orc} width="10000" alt={""}/> );
        }
        if (player_character === PlayerCharacter.Shade) {
            return ( <img style={{"imageRendering":"pixelated"}} src={shade} width="10000" alt={""}/> );
        }
        if (player_character === PlayerCharacter.SkeletonKnight) {
            return ( <img style={{"imageRendering":"pixelated"}} src={skeleton_knight} width="10000" alt={""}/> );
        }
        if (player_character === PlayerCharacter.Skeletons) {
            return ( <img style={{"imageRendering":"pixelated"}} src={skeletons} width="10000" alt={""}/> );
        }
        if (player_character === PlayerCharacter.SkeletonWizard) {
            return ( <img style={{"imageRendering":"pixelated"}} src={skeleton_wizard} width="10000" alt={""}/> );
        }
        if (player_character === PlayerCharacter.Werewolf) {
            return ( <img style={{"imageRendering":"pixelated"}} src={werewolf} width="10000" alt={""}/> );
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
                <div className="font-face-sfpb">
                    <Text align="center" fontSize={DUNGEON_FONT_SIZE} color="white">
                        No Active Game
                    </Text>
                </div>
            );
        }

        console.log("p1 ", active_game.player_one_status, " p2 ", active_game.player_two_status);

        let is_winner = false;
        
        if (active_game.status === GameStatus.completed) {
            if (active_game.player_one.equals(wallet.publicKey) && active_game.player_one_status === ArenaStatus.alive) {
                is_winner = true;
            }
            if (active_game.player_two.equals(wallet.publicKey) && active_game.player_two_status === ArenaStatus.alive) {
                is_winner = true;
            }
        }

        return(
            <>
            <VStack width="100%">
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
                        <Box width="15%"> <DisplayPlayer player_character={active_game.player_one_character} player_status={active_game.player_one_status} /></Box>  
                        <Box width="10%"></Box> 
                        <Box width="15%" visibility={active_game.status === 0 ? "hidden" : "visible"}> <DisplayPlayer player_character={active_game.player_two_character} player_status={active_game.player_two_status} /> </Box>  
                        <Box width="30%"></Box> 
    
                    </HStack>
                    </Box>
                    <Box width="10%"></Box> 
                </HStack>
            </VStack>

            {(active_game.status === GameStatus.in_progress || active_game.status === GameStatus.draw) &&
            <Center width="100%">
                <VStack width="100%" alignItems="center">

                    {active_game.status === GameStatus.draw 
                    ?
                        <Text className="font-face-sfpb" align="center" fontSize={DUNGEON_FONT_SIZE} color="white"> It's a Draw! Play again.</Text>
                    :
                        <Text className="font-face-sfpb" align="center" fontSize={DUNGEON_FONT_SIZE} color="white"> Choose your move to play</Text>
                    }
                    <HStack>

                        <Box  as="button" onClick={() => TakeMoveInGame(RPSMove.rock)} borderWidth="2px"  borderColor="white"  width="200px">
                            <Text className="font-face-sfpb" align="center" fontSize={DUNGEON_FONT_SIZE} color="white"> Rock </Text>
                        </Box>

                        <Box  as="button" onClick={() => TakeMoveInGame(RPSMove.paper)} borderWidth="2px"  borderColor="white"  width="200px">
                            <Text className="font-face-sfpb" align="center" fontSize={DUNGEON_FONT_SIZE} color="white"> Paper </Text>
                        </Box>

                        <Box  as="button" onClick={() => TakeMoveInGame(RPSMove.scissors)} borderWidth="2px"  borderColor="white"  width="200px">
                            <Text className="font-face-sfpb" align="center" fontSize={DUNGEON_FONT_SIZE} color="white"> Scissors </Text>
                        </Box>
                    </HStack>
                </VStack>
            </Center>
            }
            {active_game.status === GameStatus.completed && is_winner && 

                <Center>
                    <Box  as="button" onClick={() => ClaimReward()} borderWidth="2px"  borderColor="white"  width="200px">
                        <Text className="font-face-sfpb" align="center" fontSize={DUNGEON_FONT_SIZE} color="white"> Get Reward </Text>
                    </Box>
                </Center>
            }

            {active_game.status === GameStatus.completed && !is_winner && 

            <Center>
                <Box  width="200px">
                    <Text className="font-face-sfpb" align="center" fontSize={DUNGEON_FONT_SIZE} color="white"> You Lost </Text>
                </Box>
            </Center>
            }


            </>

        );
    }

    return(
        


    <Container>
    <Tabs
        className="custom-tab" activeKey={activeTab} onSelect={(eventKey) => setActiveTab(eventKey)}
    >
        <Tab eventKey="game_list" title="GAME LIST" tabClassName="custom-tab">
            <Center width="80%" marginBottom="5rem">
                <VStack width="100%" alignItems="left">
                    <ListNewGame/>
                    <GameTable game_list={waiting_games}/>
                </VStack>
            </Center>
           
        </Tab>
        <Tab eventKey="my_games" title="MY GAMES" tabClassName="custom-tab">
        <Center width="80%" marginBottom="5rem">
                <GameTable game_list={my_games}/>
            </Center>
        </Tab> 
        
        <Tab eventKey="active_game" title="ACTIVE GAME" tabClassName="custom-tab">
            <ActiveGame/>
        </Tab>     
        
    </Tabs>
    </Container>
    );

}