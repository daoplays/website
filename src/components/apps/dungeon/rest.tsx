import React, { useCallback, useEffect, useRef } from "react";
import { Unity, useUnityContext } from "react-unity-webgl";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import bs58 from "bs58";

//  dungeon constants
import {
    DUNGEON_PROGRAM,
    SYSTEM_KEY,
} from "./constants";

// dungeon utils
import {
    get_current_blockhash,
    send_transaction,
    serialise_save_home_instruction,
    request_raw_account_data,
    HouseData,
    bignum_to_num,
    u64Data
} from "./utils";

import {
    DungeonInstruction,
} from "./dungeon_state";




const styles = require('./css/unity.css');
require("@solana/wallet-adapter-react-ui/styles.css");

export function RestScreen({ bearer_token }: { bearer_token: string }) {

    const wallet = useWallet();
    const rest_state_interval = useRef<number | null>(null);
    const check_rest_state = useRef<boolean>(true);
    const level_loaded = useRef<boolean>(false);
    const unity_initialised = useRef<boolean>(false);

    

    const { unityProvider, addEventListener, removeEventListener, sendMessage } = useUnityContext({
        loaderUrl: "/unitybuild/LevelEditor.loader.js",
        dataUrl: "/unitybuild/LevelEditor.data",
        frameworkUrl: "/unitybuild/LevelEditor.framework.js",
        codeUrl: "/unitybuild/LevelEditor.wasm",
    });

        
    const setLevelData = useCallback((level : string) => {
        sendMessage("LevelEditor", "LoadFromBlockChain", level);
    }, [sendMessage]);


    const get_rest_state = useCallback(async () => {

        if (!wallet.publicKey) {
            return;
        }

        console.log("unity initialised? ", unity_initialised.current);

        if (!unity_initialised.current) {
            return;
        }

        if (!check_rest_state.current && level_loaded.current) {
            return;
        }
        let player_home_key = PublicKey.findProgramAddressSync([wallet.publicKey.toBytes(), Buffer.from("home")], DUNGEON_PROGRAM)[0];

        let house_data = await request_raw_account_data(bearer_token, player_home_key);

        if (house_data === null) {
            setLevelData("");
            check_rest_state.current = false;
            return;
        }
        
        console.log(house_data);

        let size_bytes : number[] = [];
        for (let i = 0 ; i < 8; i++)
            size_bytes.push(house_data[i]);

        const [size] = u64Data.struct.deserialize(house_data.slice(0,8));
        let size_val = bignum_to_num(size.value);
        console.log("house data size: ", size_val);

        const [house] = HouseData.struct.deserialize(house_data.slice(8,8+size_val));
        console.log("house data: ", house);

        let sprite_json = [];
        for (let x = 0; x < house.grid_width; x++) {
            for (let y = 0; y < house.grid_height; y++) {
                let index = x * house.grid_height + y;
                let sprite_object = {
                    x : x,
                    y : y,
                    tilemapSprite : house.sprites[index]
                }
                sprite_json.push(sprite_object);
            }
        }

        let player_json = [];
        for (let i = 0; i < house.player_data.length; i++) {
            player_json.push(JSON.parse(house.player_data[i]));
        }

        let enemy_json = [];
        for (let i = 0; i < house.enemy_data.length; i++) {
            enemy_json.push(JSON.parse(house.enemy_data[i]));
        }


        let json_result = {
            
            tile_map : {
                gridWidth : house.grid_width,
                gridHeight : house.grid_height,
                gridCellSize : house.grid_cell_size,
                gridOffset : {
                    x : house.grid_offset[0],
                    y : house.grid_offset[1],
                    z : house.grid_offset[2]
                },
                tilemapObjectArray : sprite_json
            },
            player_prefabs : player_json,
            enemy_prefabs : enemy_json
        }

        
        console.log(JSON.stringify(json_result));

        setLevelData(JSON.stringify(json_result));
        check_rest_state.current = false;

        return;        
        

    }, [wallet, bearer_token, setLevelData]);

    // interval for checking state
    useEffect(() => {
        if (rest_state_interval.current === null) {
            rest_state_interval.current = window.setInterval(get_rest_state, 1000);
        } else {
            window.clearInterval(rest_state_interval.current);
            rest_state_interval.current = null;
        }
        // here's the cleanup function
        return () => {
            if (rest_state_interval.current !== null) {
                window.clearInterval(rest_state_interval.current);
                rest_state_interval.current = null;
            }
        };
    }, [get_rest_state]);


    // Unity -> React

    const UploadLevel = useCallback(
        async (house_data : HouseData) => {

            if (wallet.publicKey === null || wallet.signTransaction === undefined || wallet.signMessage === undefined) return;


            let player_home_key = PublicKey.findProgramAddressSync([wallet.publicKey.toBytes(), Buffer.from("home")], DUNGEON_PROGRAM)[0];

    
            const instruction_data = serialise_save_home_instruction(DungeonInstruction.save_home, house_data);

            let max_size = 1044;
            if (instruction_data.length > max_size)
                return;

            var account_vector = [
                { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
                { pubkey: player_home_key, isSigner: false, isWritable: true },
                { pubkey: SYSTEM_KEY, isSigner: false, isWritable: false },
            ];

            const play_instruction = new TransactionInstruction({
                keys: account_vector,
                programId: DUNGEON_PROGRAM,
                data: instruction_data,
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
                    console.log(transaction_response);
                    return;
                }

            } catch (error) {
                console.log(error);
                return;
            }
        },
        [wallet, bearer_token]
    );

    // Save the level data

    const handleSaveData = useCallback(async (level : string) => {

        console.log(level);
        let json = JSON.parse(level);

        let tilemap = json["tile_map"];
        let player_data : string[] = [];
        let enemy_data : string[] = [];

        for (let i = 0; i < json["player_prefabs"].length; i++)
            player_data.push(JSON.stringify(json["player_prefabs"][i]));

        for (let i = 0; i < json["enemy_prefabs"].length; i++)
            enemy_data.push(JSON.stringify(json["enemy_prefabs"][i]));

        console.log("detected save data", json);
        let sprites : number[] = [];
        for (let i = 0; i < tilemap["tilemapObjectArray"].length; i++) {
            sprites.push(tilemap["tilemapObjectArray"][i]["tilemapSprite"])
        }

        let offset : number[] = [tilemap["gridOffset"]["x"], tilemap["gridOffset"]["y"], tilemap["gridOffset"]["z"]]
        let house_data = new HouseData(tilemap["gridWidth"], tilemap["gridHeight"], tilemap["gridCellSize"], offset, sprites, player_data, enemy_data);
       
        console.log("buffer", house_data);

        await UploadLevel(house_data);

    }, [UploadLevel]);

    useEffect(() => {

        addEventListener("SendSaveData", handleSaveData);
        return () => {
          removeEventListener("SendSaveData", handleSaveData);
        };
    }, [addEventListener, removeEventListener, handleSaveData]);

    const handleConfirmDataLoaded = useCallback(async () => {
        console.log("load succeeded");
        level_loaded.current = true;
    }, []);

    useEffect(() => {

        addEventListener("ConfirmDataLoaded", handleConfirmDataLoaded);
        return () => {
          removeEventListener("ConfirmDataLoaded", handleConfirmDataLoaded);
        };
    }, [addEventListener, removeEventListener, handleConfirmDataLoaded]);

    const handleConfirmInitialised = useCallback(async () => {
        console.log("initialised succeeded");
        unity_initialised.current = true;
    }, []);

    useEffect(() => {

        addEventListener("ConfirmInitialised", handleConfirmInitialised);
        return () => {
          removeEventListener("ConfirmInitialised", handleConfirmInitialised);
        };
    }, [addEventListener, removeEventListener, handleConfirmInitialised]);


    // React -> Unity

    // Send Level Data



    return (
        <>
        {!wallet.publicKey &&
            <></>
        }

        {wallet.publicKey &&
            <div className="home">
                <div className="container">
                    <div className={styles.container}>
                        <div className={styles.unityWrapper}>
                            <Unity unityProvider={unityProvider} style={{ width: 1920, height: 1080 }}/>
                        </div>
                    </div>

                    <br />
                </div>
            </div>
        }
        </>
    );
}
