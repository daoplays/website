import React, { useCallback, useEffect, useRef } from "react";
import { Unity, useUnityContext } from "react-unity-webgl";
import { useWallet } from "@solana/wallet-adapter-react";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import bs58 from "bs58";
import BN from "bn.js";

//  dungeon constants
import { DUNGEON_PROGRAM, SYSTEM_KEY } from "./constants";

// dungeon utils
import {
    get_current_blockhash,
    send_transaction,
    serialise_save_home_instruction,
    request_raw_account_data,
    HouseData,
    HouseStateData,
    bignum_to_num,
    u64Data,
    serialise_create_account_instruction,
    PlayerAccountData,
    serialise_gather_instruction,
    request_player_account_data,
    PlayerData,
    request_current_balance,
} from "./utils";

import { DungeonInstruction } from "./dungeon_state";
import { createMessage, readMessage, decrypt, encrypt } from "openpgp";
import { bignum } from "@metaplex-foundation/beet";

const styles = require("./css/unity.css");
require("@solana/wallet-adapter-react-ui/styles.css");

export function RestScreen({ bearer_token }: { bearer_token: string }) {
    const wallet = useWallet();
    const rest_state_interval = useRef<number | null>(null);
    const check_rest_state = useRef<boolean>(true);
    const level_loaded = useRef<boolean>(false);
    const unity_initialised = useRef<boolean>(false);

    // account data
    const user_name = useRef<string | null>(null);
    const password = useRef<string | null>(null);
    const user_keypair = useRef<Keypair | null>(null);

    const player_state = useRef<PlayerData | null>(null);
    const check_user_state = useRef<boolean>(true);
    const state_interval = useRef<number | null>(null);

    const { unityProvider, addEventListener, removeEventListener, sendMessage } = useUnityContext({
        loaderUrl: "/unitybuild/LevelEditor.loader.js",
        dataUrl: "/unitybuild/LevelEditor.data",
        frameworkUrl: "/unitybuild/LevelEditor.framework.js",
        codeUrl: "/unitybuild/LevelEditor.wasm",
    });

    const setBalances = useCallback(
        (sol_balance: string, wood_balance: string, stone_balance: string) => {
            let player_data_json = {
                sol_balance: sol_balance,
                wood_balance: wood_balance,
                stone_balance: stone_balance,
            };

            sendMessage("PlayerManager", "LoadPlayerData", JSON.stringify(player_data_json));
        },
        [sendMessage],
    );

    const setWoodBalance = useCallback(
        (wood_balance: string) => {
            sendMessage("PlayerManager", "SetWoodBalance", wood_balance);
        },
        [sendMessage],
    );

    const setStoneBalance = useCallback(
        (stone_balance: string) => {
            sendMessage("PlayerManager", "SetStoneBalance", stone_balance);
        },
        [sendMessage],
    );

    const check_state = useCallback(async () => {
        if (bearer_token === "") {
            console.log("no bearer token set in check_state");
            return;
        }

        if (user_keypair.current === null) {
            return;
        }

        if (!check_user_state.current) return;

        let current_balance = await request_current_balance(bearer_token, user_keypair.current.publicKey);

        let player_data_key = PublicKey.findProgramAddressSync([user_keypair.current.publicKey.toBytes()], DUNGEON_PROGRAM)[0];

        if (check_user_state.current) {
            try {
                let player_data = await request_player_account_data(bearer_token, player_data_key);

                if (player_data === null) {
                    return;
                }

                if (player_state.current === null) {
                    player_state.current = player_data;
                    check_user_state.current = false;

                    setBalances(current_balance.toFixed(4), player_data.wood_amount.toString(), player_data.stone_amount.toString());

                    return;
                }
                console.log(bignum_to_num(player_data.num_plays), bignum_to_num(player_state.current.num_plays));
                if (bignum_to_num(player_state.current.num_plays) >= bignum_to_num(player_data.num_plays)) return;

                console.log(
                    "wood ",
                    player_data.wood_amount,
                    player_state.current.wood_amount,
                    " stone ",
                    player_data.stone_amount,
                    player_state.current.stone_amount,
                );

                if (player_data.wood_amount > player_state.current.wood_amount) setWoodBalance(player_data.wood_amount.toString());

                if (player_data.stone_amount > player_state.current.stone_amount) setStoneBalance(player_data.stone_amount.toString());

                player_state.current = player_data;
                check_user_state.current = false;
            } catch (error) {
                console.log(error);
                player_state.current = null;
            }
        }
    }, [bearer_token, setBalances, setWoodBalance, setStoneBalance]);

    // interval for checking state
    useEffect(() => {
        if (state_interval.current === null) {
            state_interval.current = window.setInterval(check_state, 1000);
        } else {
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

    const setLevelData = useCallback(
        (level: string) => {
            sendMessage("LevelEditor", "LoadFromBlockChain", level);
        },
        [sendMessage],
    );

    const get_rest_state = useCallback(async () => {
        if (user_keypair.current === null) {
            return;
        }
        //return;
        console.log("unity initialised? ", unity_initialised.current);

        if (!unity_initialised.current) {
            return;
        }

        if (!check_rest_state.current && level_loaded.current) {
            return;
        }
        let player_home_key = PublicKey.findProgramAddressSync(
            [user_keypair.current.publicKey.toBytes(), Buffer.from("home")],
            DUNGEON_PROGRAM,
        )[0];

        let house_data = await request_raw_account_data(bearer_token, player_home_key);

        if (house_data === null) {
            setLevelData("");
            check_rest_state.current = false;
            return;
        }
        let size_bytes: number[] = [];
        for (let i = 0; i < 8; i++) size_bytes.push(house_data[i]);

        const [size] = u64Data.struct.deserialize(house_data.slice(0, 8));
        let size_val = bignum_to_num(size.value);

        const [house] = HouseStateData.struct.deserialize(house_data.slice(8, 8 + size_val));
        console.log("house data: ", house.data, house.data.length);

        let layers_array = [];
        for (let l = 0; l < house.data.length; l++) {
            let sprite_json = [];
            for (let x = 0; x < house.data[l].grid_width; x++) {
                for (let y = 0; y < house.data[l].grid_height; y++) {
                    let index = x * house.data[l].grid_height + y;
                    let sprite_object = {
                        x: x,
                        y: y,
                        tilemapSprite: house.data[l].sprites[index],
                    };
                    sprite_json.push(sprite_object);
                }
            }

            let player_json = [];
            for (let i = 0; i < house.data[l].player_data.length; i++) {
                player_json.push(JSON.parse(house.data[l].player_data[i]));
            }

            let enemy_json = [];
            for (let i = 0; i < house.data[l].enemy_data.length; i++) {
                enemy_json.push(JSON.parse(house.data[l].enemy_data[i]));
            }

            let json_result = {
                tile_map: {
                    gridWidth: house.data[l].grid_width,
                    gridHeight: house.data[l].grid_height,
                    gridCellSize: house.data[l].grid_cell_size,
                    gridOffset: {
                        x: house.data[l].grid_offset[0],
                        y: house.data[l].grid_offset[1],
                        z: house.data[l].grid_offset[2],
                    },
                    tilemapObjectArray: sprite_json,
                },
                player_prefabs: player_json,
                enemy_prefabs: enemy_json,
            };

            layers_array.push(JSON.stringify(json_result));
        }

        let layers_json = {
            layer_saves: layers_array,
        };
        console.log(JSON.stringify(layers_json));

        setLevelData(JSON.stringify(layers_json));
        check_rest_state.current = false;

        return;
    }, [bearer_token, setLevelData]);

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
        async (house_data: HouseData, layer: number) => {
            if (user_keypair.current === null) return;

            let player_home_key = PublicKey.findProgramAddressSync(
                [user_keypair.current.publicKey.toBytes(), Buffer.from("home")],
                DUNGEON_PROGRAM,
            )[0];

            const instruction_data = serialise_save_home_instruction(DungeonInstruction.save_home, layer, house_data);

            let max_size = 1044;
            if (instruction_data.length > max_size) return;

            var account_vector = [
                { pubkey: user_keypair.current.publicKey, isSigner: true, isWritable: true },
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
            transaction.feePayer = user_keypair.current.publicKey;

            transaction.add(play_instruction);

            transaction.sign(user_keypair.current);

            try {
                const encoded_transaction = bs58.encode(transaction.serialize());

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
        [bearer_token],
    );

    const CreatePlayerAccount = useCallback(
        async (name: string, balance: bignum, data: number[], keypair: Keypair) => {
            if (wallet.publicKey === null || wallet.signTransaction === undefined || wallet.signMessage === undefined) return;

            let player_account_key = PublicKey.findProgramAddressSync([Buffer.from(name)], DUNGEON_PROGRAM)[0];
            let player_dungeon_key = PublicKey.findProgramAddressSync([keypair.publicKey.toBytes()], DUNGEON_PROGRAM)[0];

            const instruction_data = serialise_create_account_instruction(DungeonInstruction.create_account, name, balance, data);

            let max_size = 1044;
            if (instruction_data.length > max_size) return;

            var account_vector = [
                { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
                { pubkey: player_account_key, isSigner: false, isWritable: true },
                { pubkey: keypair.publicKey, isSigner: true, isWritable: true },
                { pubkey: player_dungeon_key, isSigner: false, isWritable: true },

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

            transaction.partialSign(keypair);

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

            user_keypair.current = keypair;
            unity_initialised.current = true;
        },
        [wallet, bearer_token],
    );

    // Save the level data

    const handleSaveData = useCallback(
        async (level: string) => {
            console.log(level);
            let json = JSON.parse(level);

            let layers: string[] = json["layer_saves"];
            let num_layers = layers.length;

            console.log("Have ", num_layers, " layers");

            for (let i = 0; i < num_layers; i++) {
                if (layers[i] === "") continue;

                let layer: any = JSON.parse(layers[i]);

                let tilemap = layer["tile_map"];
                let player_data: string[] = [];
                let enemy_data: string[] = [];

                //for (let i = 0; i < layer["player_prefabs"].length; i++) player_data.push(JSON.stringify(layer["player_prefabs"][i]));

                for (let i = 0; i < layer["enemy_prefabs"].length; i++) enemy_data.push(JSON.stringify(layer["enemy_prefabs"][i]));

                console.log("detected save data", layer);
                let sprites: number[] = [];
                for (let i = 0; i < tilemap["tilemapObjectArray"].length; i++) {
                    sprites.push(tilemap["tilemapObjectArray"][i]["tilemapSprite"]);
                }

                let offset: number[] = [tilemap["gridOffset"]["x"], tilemap["gridOffset"]["y"], tilemap["gridOffset"]["z"]];
                let house_data = new HouseData(
                    tilemap["gridWidth"],
                    tilemap["gridHeight"],
                    tilemap["gridCellSize"],
                    offset,
                    sprites,
                    player_data,
                    enemy_data,
                );

                await UploadLevel(house_data, i);

                console.log("buffer", house_data);
            }
        },
        [UploadLevel],
    );

    const handleAccountData = useCallback(
        async (account_data: string) => {
            console.log(account_data);
            let account_json = JSON.parse(account_data);

            user_name.current = account_json["user_name"];
            password.current = account_json["password"];
            let balance: string = account_json["balance"];

            console.log("have user/pw", user_name.current, password.current);

            if (user_name.current == null || password.current == null) return;

            // we do have an account
            if (balance === "null") {
                let player_account_key = PublicKey.findProgramAddressSync([Buffer.from(user_name.current)], DUNGEON_PROGRAM)[0];
                let player_account_data = await request_raw_account_data(bearer_token, player_account_key);

                if (player_account_data !== null) {
                    const [encrypted_data] = PlayerAccountData.struct.deserialize(player_account_data);

                    console.log("chain data: ", encrypted_data);
                    const encryptedMessage = await readMessage({
                        binaryMessage: Uint8Array.from(encrypted_data.data), // parse encrypted bytes
                    });
                    try {
                        const { data: decrypted } = await decrypt({
                            message: encryptedMessage,
                            passwords: [password.current], // decrypt with password
                            format: "binary", // output as Uint8Array
                        });

                        console.log("decrypted:", decrypted); // Uint8Array([0x01, 0x01, 0x01])
                        let decrypted_json: any = JSON.parse(Buffer.from(decrypted).toString("utf8"));
                        console.log("json: ", decrypted_json);

                        let decrypted_keypair: Keypair = Keypair.fromSecretKey(Uint8Array.from(decrypted_json["secret"]));
                        console.log(decrypted_keypair.publicKey.toString());

                        user_keypair.current = decrypted_keypair;
                    } catch (error) {
                        console.log("error decrypting data, wrong password");
                        console.log(error);
                        return;
                    }

                    unity_initialised.current = true;

                    return;
                }

                console.log("player data was null");
                return;
            }

            // if not then we need to set one up
            const accountKeypair = Keypair.generate();
            let secret: Uint8Array = accountKeypair.secretKey;

            let json_result = {
                name: user_name.current,
                secret: Array.from(secret),
            };

            let to_encrypt = Buffer.from(JSON.stringify(json_result));

            console.log("encrypt: ", JSON.stringify(json_result), to_encrypt);
            const message = await createMessage({ binary: to_encrypt });
            const encrypted = await encrypt({
                message, // input as Message object
                passwords: [password.current], // multiple passwords possible
                format: "binary", // don't ASCII armor (for Uint8Array output)
            });
            console.log("encrypted:", encrypted); // Uint8Array

            let new_balance: bignum = new BN(parseFloat(balance) * LAMPORTS_PER_SOL);

            await CreatePlayerAccount(user_name.current, new_balance, Array.from(encrypted), accountKeypair);
        },
        [bearer_token, CreatePlayerAccount],
    );

    useEffect(() => {
        addEventListener("SendSaveData", handleSaveData);
        return () => {
            removeEventListener("SendSaveData", handleSaveData);
        };
    }, [addEventListener, removeEventListener, handleSaveData]);

    useEffect(() => {
        addEventListener("SendAccountInfo", handleAccountData);
        return () => {
            removeEventListener("SendAccountInfo", handleAccountData);
        };
    }, [addEventListener, removeEventListener, handleAccountData]);

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

    const handleStartGathering = useCallback(
        async (gathering_type: number) => {
            console.log("detected start crafting", gathering_type);

            if (user_keypair.current === null) return;

            let player_data_key = PublicKey.findProgramAddressSync([user_keypair.current.publicKey.toBytes()], DUNGEON_PROGRAM)[0];

            const instruction_data = serialise_gather_instruction(DungeonInstruction.craft, gathering_type);

            var account_vector = [
                { pubkey: user_keypair.current.publicKey, isSigner: true, isWritable: true },
                { pubkey: player_data_key, isSigner: false, isWritable: true },

                { pubkey: SYSTEM_KEY, isSigner: false, isWritable: false },
            ];

            const play_instruction = new TransactionInstruction({
                keys: account_vector,
                programId: DUNGEON_PROGRAM,
                data: instruction_data,
            });

            let txArgs = await get_current_blockhash(bearer_token);

            let transaction = new Transaction(txArgs);
            transaction.feePayer = user_keypair.current.publicKey;

            transaction.add(play_instruction);

            transaction.sign(user_keypair.current);

            console.log("sign with ", user_keypair.current.publicKey.toString());
            try {
                const encoded_transaction = bs58.encode(transaction.serialize());

                var transaction_response = await send_transaction(bearer_token, encoded_transaction);
                console.log("transaction response:", transaction_response);
                if (transaction_response.result === "INVALID") {
                    console.log(transaction_response);
                    return;
                }
            } catch (error) {
                console.log(error);
                return;
            }

            check_user_state.current = true;
        },
        [bearer_token],
    );

    useEffect(() => {
        addEventListener("StartCrafting", handleStartGathering);
        return () => {
            removeEventListener("StartCrafting", handleStartGathering);
        };
    }, [addEventListener, removeEventListener, handleStartGathering]);

    return (
        <>
            {!wallet.publicKey && <></>}

            {wallet.publicKey && (
                <div className="home">
                    <div className="container">
                        <div className={styles.container}>
                            <div className={styles.unityWrapper}>
                                <Unity unityProvider={unityProvider} style={{ width: 1920, height: 1080 }} />
                            </div>
                        </div>

                        <br />
                    </div>
                </div>
            )}
        </>
    );
}
