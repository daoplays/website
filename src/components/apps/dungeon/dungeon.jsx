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

var first_move = false;
let intervalId;
function useSolanaAccount() 
{
    const [progress, setProgress] = useState(null);
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
                console.log("have player in progress ", player_data["in_progress"], player_data["player_status"], player_data["dungeon_enemy"]);

                setProgress(player_data["in_progress"]);
                setCurrentEnemy(player_data["dungeon_enemy"]);    

                if (player_data["player_status"] === 0) {
                    setAlive(true);
                }

                if (first_move === true && player_data["player_status"] === 1) {
                    setAlive(false)
                    setCurrentEnemy(player_data["dungeon_enemy"]);
                }

                if (first_move === false && player_data["player_status"] === 1) {
                    setAlive(true)
                }


            } catch(error) {
                console.log(error);
                setProgress(-1);
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

    return { progress, sol_balance, player_alive, current_enemy };
}

export function AirDropApp() 
{
    const { connection } = useConnection();
    const wallet = useWallet();
    const { progress, sol_balance, player_alive, current_enemy } = useSolanaAccount();

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

            first_move = true;
        

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

            return;
        

    },[wallet, connection]);

    const Reset = useCallback( async () => 
    {

            first_move = false;

            return;
        

    },[]);

    const VanillaMapper = (props) => {
 
        const handleOnClick = (e) => {
            e.preventDefault();
            console.log("You have clicked in the specified area")
        }
 
     return (
        <Box bg='black' mt="2rem">
        <img style={{"imageRendering":"pixelated"}} src={large_door} width={1000} alt={"generic"} useMap="#workmap"/>
        <map id = "workmap" name="workmap">
            <area shape="poly" coords="50,47,56,454,257,357,254,139" alt="test" href="#" onClick={handleOnClick}/>
        </map>
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

    const DisplayEnemy = () => {
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
        if (current_enemy === 10) {
            return ( <img style={{"imageRendering":"pixelated"}} src={boulder} width="10000" alt={""}/> );
        }
        if (current_enemy === 11) {
            return ( <img style={{"imageRendering":"pixelated"}} src={floor_spikes} width="10000" alt={""}/> );
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
                            
                                
                    <Box width="15%"> <img style={{"imageRendering":"pixelated"}} src={ranger} width="10000" alt={""}/></Box>  

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
                    <VStack>
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
                    <VStack  alignItems="center" marginBottom  = "10px" >
                       
                        {(progress === 0  && player_alive === false) &&
                        <>
                            <div className="font-face-sfpb">
                            <Text  textAlign="center" color="white">The {DungeonEnemyName[current_enemy]} Won.  You Have Died {player_alive} </Text>
                            <Button size='md' onClick={Reset}>
                                Try Again
                            </Button>
                            </div>
                        </>
                        }
                        {(progress > 0)  &&
                        <>
                        <div className="font-face-sfpb">
                            <Text textAlign="center" color="white">You have defeated the {DungeonEnemyName[current_enemy]} in room {progress}</Text>
                            <Text textAlign="center" color="white">Escape to claim your current loot of {Math.pow(2,progress) *  0.2} SOL</Text>
                            <Text textAlign="center" color="white">Explore further to try and double your loot to {Math.pow(2,progress+1) *  0.2} SOL</Text>
                        </div>
                        <HStack>
                            <Button size='md' onClick={Play}>
                                Explore Further
                            </Button>
                            <Button size='md' onClick={Quit}>
                                Escape
                            </Button>
                        </HStack>
                        </>
                        }
                        
                        
                    </VStack>
                    </VStack>
                </Box>
            </Box>
        }
        <Box width="100%">
            {!wallet.publicKey && <ConnectPage/>}
            {wallet.publicKey && 
                <>
                {(progress === -1 || progress === 0)  && player_alive === true &&
                    <ConnectedPage/>
                }
                {(progress > 0)  &&
                    <InDungeon/>
                }
                {(progress === 0  && player_alive === false) &&
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