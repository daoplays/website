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


import { DUNGEON_FONT_SIZE , ARENA_PROGRAM, SYSTEM_KEY} from './constants';

import {run_arena_free_game_GPA, GameData, bignum_to_num, get_current_blockhash, send_transaction, uInt32ToLEBytes, serialise_Arena_CreateGame_instruction, serialise_Arena_Move_instruction, serialise_basic_instruction} from './utils';

import {DisplayEnemy, DisplayPlayer, DungeonEnemy, DungeonCharacter, DungeonStatus} from './dungeon_state';

import Table from 'react-bootstrap/Table';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import Container from 'react-bootstrap/Container';

import './css/table.css';
import './css/fonts.css';
import './css/tabs.css';

const enum ArenaInstruction {
    init = 0,
    create_game = 1,
    join_game = 2,
    cancel_game = 3,
    take_move = 4
}


const enum RPSMove {
    none = 0,
    rock = 1,
    paper = 2,
    scissors = 3
}

const game_status : string[] = [
    "Open",
    "In Progress",
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

    const check_games = useCallback(async() => 
    {
        

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

        check_arena.current = false;

    }, [bearer_token, wallet]);

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
                        <Box as='button' onClick={() => check_games()}>
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
                <td >RPS Game</td>
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

    function ActiveGame() {

        if (active_game === null) {
            return(
                <div className="font-face-sfpb">
                    <Text align="center" fontSize={DUNGEON_FONT_SIZE} color="white">
                        No Active Game
                    </Text>
                </div>
            );
        }

        return(
            <>
            <VStack>
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
                        <Box width="15%"> <DisplayPlayer player_state={DungeonStatus.alive} player_character={DungeonCharacter.knight} current_enemy={DungeonEnemy.GreenSlime}/></Box>  
                        <Box width="10%"></Box> 
                        <Box width="15%"> <DisplayEnemy player_state={DungeonStatus.alive} enemy_state={DungeonStatus.alive} current_enemy={DungeonEnemy.GreenSlime}/> </Box>  
                        <Box width="30%"></Box> 
    
                    </HStack>
                    </Box>
                    <Box width="10%"></Box> 
                </HStack>
            </VStack>
            <Center>

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
            </Center>

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