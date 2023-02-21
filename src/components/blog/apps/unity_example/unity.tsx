import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Unity, useUnityContext } from "react-unity-webgl";

import { TransactionInstruction, Transaction, PublicKey, clusterApiUrl } from '@solana/web3.js';

import {
    ConnectionProvider,
    WalletProvider,
    useWallet,
    useConnection
} from '@solana/wallet-adapter-react';
import {
    WalletModalProvider,
    useWalletModal
} from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';

import BN from 'bn.js'
import { BeetStruct, u8, u64, bignum } from '@metaplex-foundation/beet'

import styles from "./app.module.css";

require('@solana/wallet-adapter-react-ui/styles.css');


const PROGRAM_KEY = new PublicKey("rRq66262Wk65NjAUjMa5EoJie5RSGk61hUjy21s1frV");
export const SYSTEM_KEY = new PublicKey("11111111111111111111111111111111");


export class HighScoreData {
    constructor(
      readonly high_score: bignum
    ) {}
  
    static readonly struct = new BeetStruct<HighScoreData>(
      [
        ['high_score', u64]
      ],
      (args) => new HighScoreData(args.high_score!),
      'HighScoreData'
    )
}

class HighScoreInstruction {
    constructor(
      readonly instruction: number,
      readonly high_score: bignum
    ) {}
  
    static readonly struct = new BeetStruct<HighScoreInstruction>(
      [
        ['instruction', u8],
        ['high_score', u64]
      ],
      (args) => new HighScoreInstruction(args.instruction!, args.high_score!),
      'HighScoreInstruction'
    )
}

function serialise_highscore_instruction(instruction : number, high_score : bignum) : Buffer
{

    const data = new HighScoreInstruction(instruction, high_score);
    const [buf] = HighScoreInstruction.struct.serialize(data);

    return buf;
}

function deserialise_highscore_data(buffer : Buffer) : HighScoreData | null
{

    const [data] = HighScoreData.struct.deserialize(buffer);

    return data;
}

export function UnityExample() {

    const wallet = useWallet();
    const {connect, disconnect} = useWallet();
    const { visible, setVisible } = useWalletModal();
    const { connection } = useConnection();

    const state_interval = useRef<number | null>(null);
    const game_connecting = useRef<boolean>(false);
    const have_initial_high_score = useRef<boolean>(false);


    const connect_to_wallet = useCallback(async () => {
        console.log("in connect_to_wallet")
        try{
            await connect();
        }
        catch(error) {
            return;
        }
    },[connect]);

    const disconnect_from_wallet = useCallback(async () => {
        console.log("in disconnect_from_wallet")
        if (wallet.disconnecting || !wallet.connected)
            return;

        try {
            await disconnect();
        }
        catch(error){
            return;
        }
    },[disconnect, wallet]);

    const UploadScore = useCallback( async (high_score : bignum) => 
    {

        if (!wallet.publicKey || wallet.sendTransaction === undefined)
            return;

        let program_data_key = (await PublicKey.findProgramAddressSync([wallet.publicKey.toBytes()], PROGRAM_KEY))[0];
       
        let idx_data = serialise_highscore_instruction(0, high_score);

        const eat_instruction = new TransactionInstruction({
            keys: [
                {pubkey: wallet.publicKey, isSigner: true, isWritable: true},
                {pubkey: program_data_key, isSigner: false, isWritable: true},
                {pubkey: SYSTEM_KEY, isSigner: false, isWritable: false}

            ],
            programId: PROGRAM_KEY,
            data: idx_data
        });


        try {
            await wallet.sendTransaction(
                new Transaction().add(eat_instruction),
                connection
            );

        } catch(error) {
            console.log(error);
        }

        return;
        

    },[wallet, connection]);



    const { unityProvider, addEventListener, removeEventListener, sendMessage } = useUnityContext({
        loaderUrl: "/unitybuild/p5.loader.js",
        dataUrl: "/unitybuild/p5.data",
        frameworkUrl: "/unitybuild/p5.framework.js",
        codeUrl: "/unitybuild/p5.wasm"
      });


    // unity -> react
    const handleGameOver = useCallback((score : number) => {
        //console.log("game over detected", score);
        setIsGameOver(true);
        setScore(score);
    }, []);

    useEffect(() => {

        addEventListener("SetGameOver", handleGameOver);
        return () => {
          removeEventListener("SetGameOver", handleGameOver);
        };
    }, [addEventListener, removeEventListener, handleGameOver]);


    // connect wallet listener
    const handleConnectWallet = useCallback(async () => {
        game_connecting.current = true;
        setVisible(true);
        //console.log("have set visible");
    }, [setVisible]);

    useEffect(() => {

        addEventListener("ConnectWallet", handleConnectWallet);
        return () => {
          removeEventListener("ConnectWallet", handleConnectWallet);
        };
    }, [addEventListener, removeEventListener, handleConnectWallet]);

    // disconnect wallet listener
    const handleDisconnectWallet = useCallback(async () => {
        game_connecting.current = false;
        await disconnect_from_wallet();
    }, [disconnect_from_wallet]);

    useEffect(() => {

        addEventListener("DisconnectWallet", handleDisconnectWallet);
        return () => {
          removeEventListener("DisconnectWallet", handleDisconnectWallet);
        };
    }, [addEventListener, removeEventListener, handleDisconnectWallet]);

    // upload highscore
    const handleSendScore = useCallback(async (score : number) => {
        let score_bn = new BN(score);
        console.log("detected send score", score, score_bn.toNumber());
        await UploadScore(score_bn);

    }, [UploadScore]);

    useEffect(() => {

        addEventListener("SendScore", handleSendScore);
        return () => {
          removeEventListener("SendScore", handleSendScore);
        };
    }, [addEventListener, removeEventListener, handleSendScore]);

      // react -> unity
    function setHighScore(new_score : number) {
        sendMessage("GameManager", "SetHighScore", new_score);
    };


    const check_state = useCallback(async () => 
    {     
        if (!wallet.publicKey) {
            return;
        }

        if(have_initial_high_score.current)
            return;

        let program_data_key = (await PublicKey.findProgramAddressSync([wallet.publicKey.toBytes()], PROGRAM_KEY))[0];
        let program_data_account = await connection.getAccountInfo(program_data_key);

        if (!program_data_account)
            return;

        let high_score_data = deserialise_highscore_data(program_data_account.data);

        if (!high_score_data)
            return;

        let high_score_bn = new BN(high_score_data.high_score);
        console.log("high score:", high_score_bn.toNumber());

        have_initial_high_score.current = true;

        setHighScore(high_score_bn.toNumber());
        

    }, [wallet]);

    
    useEffect(() => {

        if (!wallet.wallet)
            return;
        
        if (wallet.wallet.readyState === "NotDetected")
            return;

        if (!game_connecting.current)
            return;

        if (wallet.connecting || wallet.connected)
            return;


        //console.log("use effect for visible");
        //console.log(wallet);
        if (!visible) {
            //console.log("have closed visible");
            connect_to_wallet().catch(console.error);
        }
    }, [visible, connect_to_wallet, wallet]);


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



    useEffect(() => {

        console.log("Wallet state changed -> ", wallet.connecting, wallet.disconnecting, wallet.connected);
        //console.log(wallet);
        if (wallet.connecting || wallet.disconnecting)
            return;

        if (game_connecting.current && wallet.connected) {
            sendMessage("GameManager", "SetConnected");
            
            return;
        }

        if (!game_connecting.current && !wallet.connected){
            sendMessage("GameManager", "SetDisconnected");
            return;
        }

    }, [wallet.connected, wallet.connecting, wallet.disconnecting, sendMessage]);




  
    return( 
        <div className="home">
            <div className="container">

                <h1 className="h1 text-center mb-0 pt-3 font-weight-bold text-body">
                    Using Solana from Unity</h1>
                <h1 className="h5 text-center mb-1 pt-0 font-weight-bold text-secondary">Dec 01 2022</h1>
                <br />
               
                
                <br/>
                <div className={styles.container}>
                    <div className={styles.unityWrapper}>
                        <Unity unityProvider={unityProvider} />
                        </div>
                    </div>

                <br/>
                {wallet.publicKey &&
                    (
                        <p>{`Key!   ${wallet.publicKey}`}</p>
                    )
                }
                {!wallet.publicKey &&
                (
                    <p>{`No Key`}</p>
                )
                }   
            </div>
        </div>
    );
  }

  function UnityPost() {

    const network = 'devnet';
    const endpoint = clusterApiUrl(network);
    const wallets = useMemo(() => 
    [
        new PhantomWalletAdapter(),
    ],
    []
  );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets}>
                {/* @ts-ignore */}
                <WalletModalProvider>
                    <UnityExample />
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
                    
    );
}

export default UnityPost;