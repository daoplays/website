import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
    ChakraProvider,
    Box,
    Button,
    HStack,
    theme,
    Input,
    FormControl,
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
require('@solana/wallet-adapter-react-ui/styles.css');


const PROGRAM_KEY = new PublicKey('Hh2mLgqvPcCMFbhtiL1rTdJ2DYhHjvEHDmRuAxGSK1zL');
const SYSTEM_KEY = new PublicKey("11111111111111111111111111111111");

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
        ['character', 'u8']],
    }]
]);

const instruction_schema = new Map([
    [InstructionMeta, { kind: 'struct', 
    fields: [
          ['instruction', 'u8']],
      }]
  ]);


export function WalletNotConnected() 
{
    return (
        <Box marginBottom  = "10px">
            <HStack spacing='24px'>
                <Box>
                    <WalletMultiButton />
                </Box>
                <Box>
                    Connect a wallet to get started!
                </Box>
            </HStack>
        </Box>
    );
}

export function WalletConnected(publicKey) 
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
                console.log("have player in progress ", player_data["in_progress"], first_move);

                setProgress(player_data["in_progress"]);


                if (player_data["player_status"] === 0) {
                    setAlive(true);
                }

                if (first_move === true && player_data["player_status"] === 1) {
                    setAlive(false)
                }

                if (first_move === false && player_data["player_status"] === 1) {
                    setAlive(true)
                }


            } catch(error) {
                console.log(error);
                setProgress(-1);
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

    return { progress, sol_balance, player_alive };
}

export function AirDropApp() 
{
    const { connection } = useConnection();
    const wallet = useWallet();
    const { progress, sol_balance, player_alive } = useSolanaAccount();

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



    return (
        <Center>
        <Box borderWidth='2px' borderRadius="2rem" p='1rem' width='50%' mt="2rem">   
            {wallet.publicKey && (
                <Box>
                    <HStack>
                        <WalletConnected publicKey={sol_balance} />
                        <FormControl id="balance" maxWidth={"250px"}>
                                <Input
                                    type="text"
                                    value={
                                        sol_balance
                                        ? "Balance: " + sol_balance + ' SOL'
                                        : 'Balance: Loading..'
                                    }
                                    readOnly
                                />
                            </FormControl>
                    </HStack>
                    <VStack marginBottom  = "10px" >
                       
                       
                        {(progress === -1 || progress === 0)  && player_alive === true &&
                        <>
                            <Text>You are standing at the entrance to a dungeon</Text>
                            <Button size='md' onClick={Play}>
                                Enter Dungeon
                            </Button>
                        </>
                        }
                        {(progress === 0  && player_alive === false) &&
                        <>
                            <Text>You Have Died {player_alive} </Text>
                            <Button size='md' onClick={Reset}>
                                Try Again
                            </Button>
                        </>
                        }
                        {(progress > 0)  &&
                        <>
                        <Text>You have defeated the enemy in room {progress}</Text>
                        <Text>Escape to claim your current loot of {Math.pow(2,progress) *  0.2} SOL</Text>
                        <Text>Explore further to try and double your loot to {Math.pow(2,progress+1) *  0.2} SOL</Text>
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
                </Box>
            )}
            {!wallet.publicKey && <WalletNotConnected />}

     
        </Box>
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