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
import { serialize, deserialize } from 'borsh';

import { PublicKey, Transaction, TransactionInstruction, LAMPORTS_PER_SOL, clusterApiUrl } from '@solana/web3.js';
import {
    ConnectionProvider,
    WalletProvider,
    useConnection,
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

import dungeon_title from "./Dungeon_Logo.png"
import large_door from "./Large_Door.gif"
import hallway from "./Hallway.gif"

//characters
import knight from "./Knight.gif"
import ranger from "./Ranger.gif"
import wizard from "./Wizard.gif"
import corpse from "./Corpse.png"

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



const PROGRAM_KEY = new PublicKey('8vrwPyHgHgdXzosYvHdmiE2n723KB4deahAwYgJme3vJ');
const SYSTEM_KEY = new PublicKey("11111111111111111111111111111111");
const DAOPLAYS_KEY = new PublicKey("2BLkynLAWGwW58SLDAnhwsoiAuVtzqyfHKA3W3MJFwEF");
const KAYAK_KEY = new PublicKey("GrTcMZ5qxQwxCo7ePrYaHgf3gLjetDT6Vew8n1ihNPG4");


/*
const DungeonCharacter = {
    warrior : 0,
    archer : 1,
    wizard : 2
}
*/

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

const DungeonEnemyName = ["Chest", "Slime", "Goblins", "Hallway Skeletons", "Graveyard Skeletons", "Elves", "Orc", "Skeleton Knight", "Skeleton Wizard", "Reaper", "Boulder", "Floor Spikes"];


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

const player_data_schema = new Map([
  [PlayerData, { kind: 'struct', 
  fields: [
        ['in_progress', 'u8'],
        ['player_status', 'u8'],
        ['dungeon_enemy', 'u8']],
    }]
]);

const instruction_schema = new Map([
    [InstructionMeta, { kind: 'struct', 
    fields: [
          ['instruction', 'u8']],
      }]
  ]);


export function WalletConnected() 
{
    return (
        <Box marginBottom  = "10px">
            <WalletDisconnectButton />
        </Box>
    );
}

let intervalId;
/*
function useSolanaAccount() 
{
    const [currentLevel, setCurrentLevel] = useState(0);
    const [player_alive, setAlive] = useState(true);
    const [current_enemy, setCurrentEnemy] = useState(DungeonEnemy.None);

    const [sol_balance, setSolBalance] = useState(null);
    const { connection } = useConnection();
    const wallet = useWallet();

    const init = useCallback(async () => 
    {       
        if (wallet.publicKey) {

            let acc = await connection.getAccountInfo(wallet.publicKey);
            setSolBalance(acc.lamports  / LAMPORTS_PER_SOL);

            let player_data_key = (await PublicKey.findProgramAddress([wallet.publicKey.toBytes()], PROGRAM_KEY))[0];

            try {

                let player_data_account = await connection.getAccountInfo(player_data_key);
                const player_data = deserialize(player_data_schema, PlayerData, player_data_account.data);

                console.log("player in progress: ", player_data["in_progress"], " status: ", player_data["player_status"], "enemy: ", player_data["dungeon_enemy"]);
                //console.log("clcked play:", has_clicked_play);

                setCurrentEnemy(player_data["dungeon_enemy"]);
                
                setCurrentLevel(player_data["in_progress"]);

                
                if (player_data["player_status"] === 0) {
                    setAlive(true);
                }

                if (player_data["player_status"] === 1) {
                    setAlive(false)
                }

            } catch(error) {
                console.log(error);
                setCurrentLevel(0);
                setAlive(true);
                setCurrentEnemy(DungeonEnemy.None);
            }
        }

    }, [wallet, connection]);

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

    return { currentLevel, sol_balance, player_alive, current_enemy };
}
*/

var first_living_update = false;
export function AirDropApp() 
{
    const { connection } = useConnection();
    const wallet = useWallet();

    // these come from the blockchain
    const [sol_balance, setSolBalance] = useState(null);
    const [currentLevel, setCurrentLevel] = useState(0);
    const [player_alive, setAlive] = useState(true);
    const [current_enemy, setCurrentEnemy] = useState(DungeonEnemy.None);

    //const { progress, sol_balance, player_alive, current_enemy } = useSolanaAccount();

    const [screen, setScreen] = useState(Screen.HOME_SCREEN);

    const [enemy_state, setEnemyState] = useState(0);
    const [player_state, setPlayerState] = useState(0);
    const [animateLevel, setAnimateLevel] = useState(0);

    //const { connection } = useConnection();
    //const wallet = useWallet();

    const init = useCallback(async () => 
    {       
        if (wallet.publicKey) {

            let acc = await connection.getAccountInfo(wallet.publicKey);
            setSolBalance(acc.lamports  / LAMPORTS_PER_SOL);

            let player_data_key = (await PublicKey.findProgramAddress([wallet.publicKey.toBytes()], PROGRAM_KEY))[0];

            try {

                let player_data_account = await connection.getAccountInfo(player_data_key);
                const player_data = deserialize(player_data_schema, PlayerData, player_data_account.data);

                //console.log("in init, progress: ", player_data["in_progress"], "enemy", player_data["dungeon_enemy"], "alive", player_data["player_status"] === 0);

                if (player_data["player_status"] === 0){
                    first_living_update = true;
                }

                if (!first_living_update) {
                    return;
                }
                //console.log("updating stats");
                

                setCurrentEnemy(player_data["dungeon_enemy"]);
                
                setCurrentLevel(player_data["in_progress"]);

                
                if (player_data["player_status"] === 0) {
                    setAlive(true);
                }

                if (player_data["player_status"] === 1) {
                    setAlive(false)
                }

            } catch(error) {
                console.log(error);
                setCurrentLevel(0);
                setAlive(true);
                setCurrentEnemy(DungeonEnemy.None);
            }
        }

    }, [wallet, connection]);

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


    
    useEffect(() => 
        {
            //console.log("in use effect, progress: ", currentLevel, "enemy", current_enemy, "alive", player_alive);

            if (currentLevel === 0)
                return;

            if (player_alive) {
                setScreen(Screen.DUNGEON_SCREEN);
            }

            // display the current enemy
            setEnemyState(1);
            if (player_alive) {
                //setEnemyState(2);
                setAnimateLevel(1);
            }
            else {
                //setPlayerState(2);
                setAnimateLevel(2);
            }

        }, [currentLevel, current_enemy, player_alive]);

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

            const instruction_meta = new InstructionMeta({ instruction: DungeonInstruction.play});
            const instruction_data = serialize(instruction_schema, instruction_meta);

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


            try {
                await wallet.sendTransaction(
                    new Transaction().add(play_instruction),
                    connection
                );

            } catch(error) {
                console.log(error);
            }

            //console.log("setting screen to dungeon");
            setScreen(Screen.DUNGEON_SCREEN);
            setEnemyState(0);
            setPlayerState(1);        

    },[wallet, connection]);


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


            try {
                await wallet.sendTransaction(
                    new Transaction().add(quit_instruction),
                    connection
                );

            } catch(error) {
                console.log(error);
            }

            setScreen(Screen.HOME_SCREEN);
            setEnemyState(0);

            return;
        

    },[wallet, connection]);

    const Reset = useCallback( async () => 
    {
            setScreen(Screen.HOME_SCREEN);
            setEnemyState(0);
            return;
        
    },[]);

    const VanillaMapper = () => {
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
        </Box>)
    }

    const CharacterSelect = () => {

        return (
            <HStack>
                <Box bg='black' mt="2rem">
                    <img style={{"imageRendering":"pixelated"}} src={knight} width="1000" alt={""}/>
                </Box>
                <Box bg='black' mt="2rem">
                    <img style={{"imageRendering":"pixelated"}} src={ranger} width="1000" alt={""}/>
                </Box>
                <Box bg='black' mt="2rem">
                    <img style={{"imageRendering":"pixelated"}} src={wizard} width="1000" alt={""}/>
                </Box>
            </HStack>
        )
    }

    const ConnectPage = () =>  {

        return (
            <VStack>
            <HStack mb = "2rem" mt="2rem">
                <Box width="33%"/>
                <Title/>
                <Box width="33%"/>
            </HStack>
            <HStack mb = "10rem" mt="2rem">
                <Box width="33%">
                    <div className="font-face-sfpb">
                        <Text  align="center"  ml="10%" mr="1%" fontSize='50px' color="white">DUNGEON MASTER'S<br/> FEE: 2%</Text>
                    </div>    
                </Box>            
                <VanillaMapper/>
                <Box width="33%">
                    <Box ml="1%" mr="10%">
                        <VStack alignItems="center">
                            <div className="font-face-sfpb">
                                <Text align="center" fontSize='50px' color="white">CONNECT WALLET</Text>
                            </div>  
                            <WalletMultiButton />
                        </VStack>  
                    </Box>
                </Box>  
            </HStack>
            <HStack mb = "2rem" mt="2rem">
                <Box width="33%"/>
                    <div className="font-face-sfpb">
                        <Text align="center" fontSize='50px' color="white">50% CHANCE TO  DOUBLE YOUR SOL</Text>
                    </div>   
                <Box width="33%"/>
            </HStack>
            </VStack>
        )
    }

    const ConnectedPage = () =>  {

        return (
            <VStack>
            <HStack mb = "2rem" mt="2rem">
                <Box width="33%"/>
                <Title/>
                <Box width="33%"/>
            </HStack>
            <HStack mb = "10rem" mt="2rem">
                <Box width="33%">
                    <div className="font-face-sfpb">
                        <Text  align="center"  ml="10%" mr="1%" fontSize='50px' color="white">DUNGEON MASTER'S<br/> FEE: 2%</Text>
                    </div>    
                </Box>            
                <VanillaMapper/>
                <Box width="33%">
                    <Center>
                        <Button variant='link' size='md' onClick={Play}>
                            <div className="font-face-sfpb">
                                <Text  ml="1%" mr="10%" textAlign="center" fontSize='50px' color="white">ENTER<br/>DUNGEON</Text>
                            </div> 
                        </Button> 
                    </Center>
                    
                </Box>  
            </HStack>
            <HStack mb = "2rem" mt="2rem">
                <Box width="33%"/>
                <Box width="33%"><CharacterSelect/></Box>
                <Box width="33%"/>
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
            if (current_enemy === 10) {
                return ( <img style={{"imageRendering":"pixelated"}} src={boulder} width="10000" alt={""}/> );
            }
            if (current_enemy === 11) {
                return ( <img style={{"imageRendering":"pixelated"}} src={floor_spikes} width="10000" alt={""}/> );
            }

            // otherwise return the corpse
            return ( <img style={{"imageRendering":"pixelated"}} src={corpse} width="10000" alt={""}/> );
        }
        
        // otherwise just return the player
        return ( <img style={{"imageRendering":"pixelated"}} src={ranger} width="10000" alt={""}/> );
        
    }

    const DisplayEnemyInitialText = () => {

         
         // for the traps we report an empty room
         if (current_enemy === 10 || current_enemy === 11) {
             return(
             <div className="font-face-sfpb">
                <Text fontSize='50px' textAlign="center" color="white">You enter a suspiciously empty room...</Text>
            </div>
            );
         };
         

         // otherwise say the enemy type
         return(
            <div className="font-face-sfpb">
                <Text fontSize='50px' textAlign="center" color="white">You have encountered the {DungeonEnemyName[current_enemy]} in room {currentLevel}</Text>
                <Text fontSize='50px' textAlign="center" color="white">Prepare yourself!</Text>
            </div>
         );
     }

    const DisplayEnemyResultText = () => {

         
        // for the traps we report an empty room
        if (current_enemy === 10 || current_enemy === 11) {
            return(
            <div className="font-face-sfpb">
                <Text fontSize='50px' textAlign="center" color="white">...but pass through without incident.</Text>
                <Text fontSize='50px' textAlign="center" color="white">Escape to claim your current loot of {Math.pow(2,currentLevel) *  0.2} SOL</Text>
                <Text fontSize='50px' textAlign="center" color="white">Explore further to try and double your loot to {Math.pow(2,currentLevel+1) *  0.2} SOL</Text>
           </div>
           );
        };
        

        // otherwise say the enemy type
        return(
            <div className="font-face-sfpb">
                <Text fontSize='50px' textAlign="center" color="white">You have defeated the {DungeonEnemyName[current_enemy]} in room {currentLevel}</Text>
                <Text fontSize='50px' textAlign="center" color="white">Escape to claim your current loot of {Math.pow(2,currentLevel) *  0.2} SOL</Text>
                <Text fontSize='50px' textAlign="center" color="white">Explore further to try and double your loot to {Math.pow(2,currentLevel+1) *  0.2} SOL</Text>
        </div>
        );
    }

    const DisplayEnemy = () => {

       // console.log("enemy state ", enemy_state);
        if (enemy_state === 0) {
            return(<></>);
        }

        if (enemy_state === 2)  {

            // for the traps we don't return anything
            if (current_enemy === 10) {
                return(<></>);
            }
            if (current_enemy === 11) {
                return(<></>);
            }


            return ( <img style={{"imageRendering":"pixelated"}} src={corpse} width="10000" alt={""}/> );
        }

        

        if (current_enemy === 0) {
            return ( <img style={{"imageRendering":"pixelated"}} src={chest} width="10000" alt={""}/> );
        }
        if (current_enemy === 1) {
            return ( <img style={{"imageRendering":"pixelated"}} src={slime} width="10000" alt={""}/> );
        }
        if (current_enemy === 2) {
            return ( <img style={{"imageRendering":"pixelated"}} src={goblins} width="10000" alt={""}/> );
        }
        if (current_enemy === 3) {
            return ( <img style={{"imageRendering":"pixelated"}} src={skeletons_hallway} width="10000" alt={""}/> );
        }
        if (current_enemy === 4) {
            return ( <img style={{"imageRendering":"pixelated"}} src={skeletons_graveyard} width="10000" alt={""}/> );
        }
        if (current_enemy === 5) {
            return ( <img style={{"imageRendering":"pixelated"}} src={elves} width="10000" alt={""}/> );
        }
        if (current_enemy === 6) {
            return ( <img style={{"imageRendering":"pixelated"}} src={orc} width="10000" alt={""}/> );
        }
        if (current_enemy === 7) {
            return ( <img style={{"imageRendering":"pixelated"}} src={skeleton_knight} width="10000" alt={""}/> );
        }
        if (current_enemy === 8) {
            return ( <img style={{"imageRendering":"pixelated"}} src={skeleton_wizard} width="10000" alt={""}/> );
        }
        if (current_enemy === 9) {
            return ( <img style={{"imageRendering":"pixelated"}} src={reaper} width="10000" alt={""}/> );
        }

        // for the traps we don't return anything
        if (current_enemy === 10) {
            return(<></>);
        }
        if (current_enemy === 11) {
            return(<></>);
        }
    }

    const InDungeon = () =>  {

        return (
            <VStack>
            <HStack mb = "2rem" mt="2rem">
                <Box width="33%"/>
                <Title/>
                <Box width="33%"/>
            </HStack>
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
        )
    }

    const DeathScreen = () =>  {

        return (
            <VStack>
            <HStack mb = "2rem" mt="2rem">
                <Box width="33%"/>
                <Title/>
                <Box width="33%"/>
            </HStack>
            <HStack mb = "10rem" mt="2rem">
                <Box width="33%"></Box>    
                     
                        
                <Box width="33%"><img style={{"imageRendering":"pixelated"}} src={corpse} width="1000" alt={""}/></Box>    
                <Box width="33%"></Box> 
                 
            </HStack>
            <HStack mb = "2rem" mt="2rem">
                <Box width="33%"/>
                <Box width="33%"></Box>
                <Box width="33%"/>
            </HStack>
            </VStack>
        )
    }


    return (
        
        <Center>
            <VStack>
                {wallet.publicKey &&
                    <Box  borderRadius="2rem" p='1rem' width='50%' mt="2rem">   
                    
                        <Box width="100%">
                                <HStack>
                                    <WalletConnected />
                                    <div className="font-face-sfpb">
                                        <Text color="white">
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
                    {!wallet.publicKey && <ConnectPage/>}
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
                <VStack  alignItems="center" marginBottom  = "10px" >
                            
                    {screen === Screen.DUNGEON_SCREEN  && player_state === 2 && first_living_update &&
                    <>
                        <div className="font-face-sfpb">
                        <Text  fontSize='50px' textAlign="center" color="white">The {DungeonEnemyName[current_enemy]} Won.  You Have Died {player_alive} </Text>
                        <Button size='lg' onClick={Reset}>
                            Try Again
                        </Button>
                        </div>
                    </>
                    }
                    {screen === Screen.DUNGEON_SCREEN  && currentLevel > 0  &&
                    <>
                    {/* enemy_state  === 0  && <>
                        <div className="font-face-sfpb">
                            <Text textAlign="center" color="white">Enemy State is zero</Text>
                        </div>
                        <Button size='md' onClick={Play}>
                                Explore Further
                            </Button>
                    </>
                    */}
                    { player_state === 1 && enemy_state  === 1  && 
                        <DisplayEnemyInitialText/>
                    }
                    {enemy_state === 2 &&
                    <>
                        <VStack alignItems="center">
                            <DisplayEnemyResultText/>
                            <HStack>
                                <Button size='lg' onClick={Play}>
                                    Explore Further
                                </Button>
                                <Button size='lg' onClick={Quit}>
                                    Escape
                                </Button>
                            </HStack>
                        </VStack>
                    </>
                    }
                    </>
                    }
                    
                    
                </VStack>
            </VStack>               
        </Center>
    );
}

function Dungeon() {
    const network = 'devnet';
    const endpoint = clusterApiUrl(network);
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
            <ConnectionProvider endpoint={endpoint}>
                <WalletProvider wallets={wallets} autoConnect>
                    <WalletModalProvider>
                        <AirDropApp />
                    </WalletModalProvider>
                </WalletProvider>
            </ConnectionProvider>
        </ChakraProvider>
    );
}

export default Dungeon;