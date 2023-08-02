import React, { useCallback, useEffect, useState, useMemo, useRef, Fragment } from "react";

import { ChakraProvider, Box, HStack, Center, Text, VStack } from "@chakra-ui/react";

import { useMediaQuery } from "react-responsive";

//import useSound from 'use-sound';

import "react-h5-audio-player/lib/styles.css";
import "./css/home.css";

import { Keypair, PublicKey, Transaction, TransactionInstruction, LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";

import { WalletProvider, useWallet } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter, SolflareWalletAdapter, BackpackWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletModalProvider, useWalletModal } from "@solana/wallet-adapter-react-ui";

import BN from "bn.js";
import bs58 from "bs58";

import large_door from "./images/Large_Door.gif";

import { Unity, useUnityContext } from "react-unity-webgl";
import { bignum } from "@metaplex-foundation/beet";

//  dungeon constants
import { DEFAULT_FONT_SIZE, DUNGEON_PROGRAM, SYSTEM_KEY, LOOT_TOKEN_MINT } from "./constants";

// dungeon utils
import {
    get_current_blockhash,
    send_transaction,
    bignum_to_num,
    request_raw_account_data,
    HouseStateData,
    u64Data,
    serialise_create_account_instruction,
    serialise_gather_instruction,
} from "./utils";

// navigation
import { Navigation } from "./navigation";

import { Footer } from "./footer";

import "./css/style.css";
import "./css/fonts.css";
import "./css/wallet.css";
import { createTransferInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
const styles = require("./css/unity.css");

require("@solana/wallet-adapter-react-ui/styles.css");

//var CryptoJS = require("crypto-js");

export function DungeonApp() {
    const wallet = useWallet();

    // bearer token used to authorise RPC requests
    const [ready, setReady] = useState<boolean>(false);

    function Disclaimer() {
        const { setVisible } = useWalletModal();
        const isTabletOrMobile = useMediaQuery({ query: "(max-width: 900px)" });

        const handleConnectWallet = useCallback(async () => {
            setVisible(true);
        }, [setVisible]);

        return (
            <>
                <Box
                    as="button"
                    onClick={() => {
                        handleConnectWallet();
                        setReady(true);
                    }}
                >
                    <div className="font-face-sfpb">
                        <Text
                            style={{ textDecoration: isTabletOrMobile ? "none" : "underline", margin: isTabletOrMobile ? "30px 0 0 0" : 0 }}
                            fontSize={isTabletOrMobile ? 25 : DEFAULT_FONT_SIZE}
                            textAlign="center"
                            color="white"
                        >
                            CONNECT WALLET
                        </Text>
                    </div>
                </Box>
            </>
        );
    }
    /*
    const CheckNewQuitAchievements = useCallback(async () => {
        if (achievement_status === null) return;

        let temp_new: number[] = [];
        for (let i = 0; i < achievement_status.length; i++) {
            if (achievement_status[i] === 2 && AchievementMetaData[i].type === 1) {
                temp_new.push(i);
            }
        }
        setNewAchievements(temp_new);
        new_achievements_ref.current = temp_new;
        return;
    }, [achievement_status]);

    useEffect(() => {
        CheckNewQuitAchievements();
    }, [achievement_status, CheckNewQuitAchievements]);

    const CheckNewPlayAchievements = useCallback(async () => {
        if (achievement_status === null) return;

        let temp_new: number[] = [];
        for (let i = 0; i < achievement_status.length; i++) {
            if (achievement_status[i] === 2 && AchievementMetaData[i].type === 0) {
                temp_new.push(i);
            }
        }
        setNewAchievements(temp_new);
        new_achievements_ref.current = temp_new;
        return;
    }, [achievement_status]);

    useEffect(() => {
        if (show_achievement === true || new_achievements_ref.current.length === 0) return;

        for (let i = 0; i < new_achievements_ref.current.length; i++) {
            if (DEBUG) console.log("Have achievement", i, AchievementMetaData[i].name, AchievementMetaData[i].description);
        }

        setWhichAchievement(new_achievements_ref.current[0]);
        setShowAchievement(true);
    }, [new_achievements, show_achievement]);
*/
    /*
    function AchievementsModal() {
        const handleClose = () => {
            setShowAchievement(false);
        };
        if (which_achievement === null || show_achievement === false) return <></>;

        if (new_achievements !== null && new_achievements.length !== 0) {
            let temp_new = new_achievements;
            temp_new.shift();
            new_achievements_ref.current = temp_new;
        }

        return (
            <>
                <Modal centered show={show_achievement} animation={true} onHide={handleClose}>
                    <div className="font-face-sfpb">
                        <Modal.Header style={{ backgroundColor: "black" }} closeButton>
                            <Modal.Title style={{ fontSize: 30, color: "white", fontWeight: "semibold" }}>
                                Achievement Unlocked!
                            </Modal.Title>
                        </Modal.Header>
                    </div>
                    <div className="font-face-sfpb text-center">
                        <Modal.Body style={{ backgroundColor: "black", fontSize: 20, color: "white", fontWeight: "semibold" }}>
                            <AchievementCard
                                index={which_achievement}
                                AchievementState={achievement_status}
                                show_mint={false}
                                ClaimAchievement={ClaimAchievement}
                            />
                        </Modal.Body>
                    </div>

                    <Modal.Footer style={{ alignItems: "center", justifyContent: "center", backgroundColor: "black" }}>
                        <Box as="button" onClick={(e: any) => ClaimAchievement(which_achievement)}>
                            <div className="font-face-sfpb">
                                <Text style={{ textDecoration: "underline" }} fontSize={DEFAULT_FONT_SIZE} textAlign="center" color="white">
                                    Claim Achievement
                                </Text>
                            </div>
                        </Box>
                    </Modal.Footer>
                </Modal>
            </>
        );
    }
    */

    const LargeDoor = () => {
        const isTabletOrMobile = useMediaQuery({ query: "(max-width: 900px)" });

        return (
            <>
                <Center>
                    <img
                        style={{ imageRendering: "pixelated", marginTop: isTabletOrMobile ? 10 : 0 }}
                        src={large_door}
                        width={isTabletOrMobile ? 220 : 400}
                        alt={"generic"}
                    />
                </Center>
            </>
        );
    };

    const UnconnectedPage = () => {
        const isTabletOrMobile = useMediaQuery({ query: "(max-width: 900px)" });

        return (
            <>
                {isTabletOrMobile ? (
                    <>
                        <div className="homeBodyColumn">
                            <div className="homeContainer">
                                <div>
                                    <LargeDoor />
                                </div>
                                <div>
                                    <Disclaimer />
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <Box width="100%">
                        <Center>
                            <VStack alignItems="center" spacing="3%" mt="2%">
                                <HStack alignItems="center" spacing="1%">
                                    <Box width="41%"></Box>
                                    <Box width="46%">
                                        <LargeDoor />
                                    </Box>
                                    <Box width="27%">
                                        <Disclaimer />
                                    </Box>
                                </HStack>
                                {!isMobile && (
                                    <HStack visibility={"hidden"}>
                                        <Box width="33%" mt="2rem" />
                                        <Box width="33%" mt="2rem"></Box>
                                        <Box width="33%" mt="2rem" />
                                    </HStack>
                                )}
                            </VStack>
                        </Center>
                    </Box>
                )}
            </>
        );
    };

    const rest_state_interval = useRef<number | null>(null);
    const check_rest_state = useRef<boolean>(true);
    const level_loaded = useRef<boolean>(false);
    const unity_initialised = useRef<boolean>(false);

    // account data
    const user_name = useRef<string | null>(null);
    const user_keypair = useRef<Keypair | null>(null);

    const {
        unityProvider,
        requestFullscreen,
        isLoaded,
        addEventListener,
        removeEventListener,
        sendMessage,
        UNSAFE__detachAndUnloadImmediate: detachAndUnloadImmediate,
    } = useUnityContext({
        loaderUrl: "/unitybuild/LevelEditor.loader.js",
        dataUrl: "/unitybuild/LevelEditor.data",
        frameworkUrl: "/unitybuild/LevelEditor.framework.js",
        codeUrl: "/unitybuild/LevelEditor.wasm",
    });

    useEffect(() => {
        return () => {
            detachAndUnloadImmediate().catch((reason) => {
                console.log(reason);
            });
        };
    }, [detachAndUnloadImmediate]);

    const setBrowserWallet = useCallback(
        (pubkey: string) => {
            sendMessage("ConnectUI", "setBrowserPubkey", pubkey);
        },
        [sendMessage],
    );

    useEffect(() => {
        console.log("Wallet has changed", wallet.connected, wallet.connecting, wallet.disconnecting);
        if (wallet.publicKey == null) return;

        setBrowserWallet(wallet.publicKey.toString());
    }, [wallet, setBrowserWallet]);

    const sendLoginConfirmation = useCallback(
        (message: string) => {
            console.log("has unity loaded in sendLoginConfirmation", isLoaded);
            sendMessage("ConnectUI", "ConfirmLogIn", message);
        },
        [sendMessage, isLoaded],
    );

    const setLevelData = useCallback(
        (level: string) => {
            console.log("has unity loaded in setLevelData", isLoaded);
            sendMessage("DataManager", "UpdateWorldData", level);
        },
        [sendMessage, isLoaded],
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

        if (!check_rest_state.current) {
            return;
        }
        let player_home_key = PublicKey.findProgramAddressSync(
            [user_keypair.current.publicKey.toBytes(), Buffer.from("home")],
            DUNGEON_PROGRAM,
        )[0];

        let house_data = await request_raw_account_data("", player_home_key, "home data");

        if (house_data === null) {
            console.log("Set home data to empty string");
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
            level_data: layers_array,
        };
        //console.log(JSON.stringify(layers_json));

        setLevelData(JSON.stringify(layers_json));
        check_rest_state.current = false;

        return;
    }, [setLevelData]);

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
    /*
    const UploadLevel = useCallback(async (house_data: HouseData, layer: number) => {
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

        let txArgs = await get_current_blockhash("");

        let transaction = new Transaction(txArgs);
        transaction.feePayer = user_keypair.current.publicKey;

        transaction.add(play_instruction);

        transaction.sign(user_keypair.current);

        try {
            const encoded_transaction = bs58.encode(transaction.serialize());

            var transaction_response = await send_transaction("", encoded_transaction);

            if (transaction_response.result === "INVALID") {
                console.log(transaction_response);
                return;
            }
        } catch (error) {
            console.log(error);
            return;
        }
    }, []);
*/

    const enum DungeonInstruction {
        add_funds = 0,
        play = 1,
        quit = 2,
        explore = 3,
        claim_achievement = 4,
        drink_potion = 5,
        buy_potion = 6,
        save_home = 7,
        rest = 8,
        create_account = 9,
        craft = 10,
    }

    const CreatePlayerAccount = useCallback(
        async (name: string, balance: bignum, iv: number[], salt: number[], data: number[], keypair: Keypair) => {
            console.log("create player account", wallet.publicKey === null);
            if (wallet.publicKey === null || wallet.signTransaction === undefined) return;

            let player_account_key = PublicKey.findProgramAddressSync([Buffer.from(name)], DUNGEON_PROGRAM)[0];
            let player_dungeon_key = PublicKey.findProgramAddressSync([keypair.publicKey.toBytes()], DUNGEON_PROGRAM)[0];

            console.log("iv :", iv, iv.length);
            console.log("salt :", salt, salt.length);

            const instruction_data = serialise_create_account_instruction(DungeonInstruction.create_account, name, balance, iv, salt, data);

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

            let txArgs = await get_current_blockhash("");

            console.log("txArgs: ", txArgs);

            let transaction = new Transaction(txArgs);
            transaction.feePayer = wallet.publicKey;

            transaction.add(play_instruction);

            transaction.partialSign(keypair);

            try {
                console.log("sign transaction");
                let signed_transaction = await wallet.signTransaction(transaction);
                const encoded_transaction = bs58.encode(signed_transaction.serialize());

                var transaction_response = await send_transaction("", encoded_transaction);

                if (transaction_response.result === "INVALID") {
                    console.log(transaction_response);

                    let message_json = {
                        result_code: -1,
                        result_message: "Transaction Failed, Try Again",
                    };
                    sendLoginConfirmation(JSON.stringify(message_json));

                    return;
                }
            } catch (error) {
                console.log(error);

                let message_json = {
                    result_code: -1,
                    result_message: "Transaction Failed, Try Again",
                };
                sendLoginConfirmation(JSON.stringify(message_json));

                return;
            }

            user_keypair.current = keypair;
            unity_initialised.current = true;

            let message_json = {
                result_code: 0,
                result_message: "Login Succeeded",
            };
            sendLoginConfirmation(JSON.stringify(message_json));
        },
        [wallet, sendLoginConfirmation, DungeonInstruction.create_account],
    );

    // Save the level data
    /*
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
*/
    const handleAccountData = useCallback(
        async (account_data: string) => {
            console.log(account_data);
            let account_json = JSON.parse(account_data);

            user_name.current = account_json["user_name"];
            let balance: number = account_json["balance"];
            let iv: number[] = account_json["iv"];
            let salt: number[] = account_json["salt"];
            let data: number[] = account_json["data"];
            let private_key: number[] = account_json["private_key"];

            console.log("have user data", iv, salt, data);

            user_keypair.current = Keypair.fromSecretKey(new Uint8Array(private_key));

            console.log(
                "have key ",
                balance,
                user_name.current,
                user_keypair.current.publicKey.toString(),
                user_keypair.current.secretKey.toString(),
            );

            if (balance === 0) {
                return;
            }

            if (user_name.current === null) return;

            await CreatePlayerAccount(
                user_name.current,
                new BN(Math.floor(balance * LAMPORTS_PER_SOL)),
                Array.from(iv),
                Array.from(salt),
                Array.from(data),
                user_keypair.current,
            );
        },
        [CreatePlayerAccount],
    );

    const handleTransferSOL = useCallback(
        async (amount: number) => {
            console.log("Transfer sol", amount, wallet.publicKey === null, user_keypair.current === null);
            if (wallet.publicKey === null || wallet.signTransaction === undefined) return;

            if (user_keypair.current === null) return;

            let amount_bn = BigInt(amount * LAMPORTS_PER_SOL);
            const transfer_instruction = SystemProgram.transfer({
                fromPubkey: wallet.publicKey,
                toPubkey: user_keypair.current.publicKey,
                lamports: amount_bn,
            });

            let txArgs = await get_current_blockhash("");

            let transaction = new Transaction(txArgs);
            transaction.feePayer = wallet.publicKey;

            console.log(transaction.recentBlockhash, transaction.lastValidBlockHeight);

            transaction.add(transfer_instruction);
            console.log("send transaction");
            try {
                let signed_transaction = await wallet.signTransaction(transaction);
                const encoded_transaction = bs58.encode(signed_transaction.serialize());

                var transaction_response = await send_transaction("", encoded_transaction);
                console.log("transaction response:", transaction_response);
                if (transaction_response.result === "INVALID") {
                    console.log(transaction_response);
                    return;
                }
            } catch (error) {
                console.log(error);
                return;
            }
        },
        [wallet],
    );

    const handleTransferLOOT = useCallback(
        async (amount: number) => {
            console.log("Transfer loot", amount, wallet.publicKey === null, user_keypair.current === null);
            if (wallet.publicKey === null || wallet.signTransaction === undefined) return;

            if (user_keypair.current === null) return;

            let source_token_account = await getAssociatedTokenAddress(
                LOOT_TOKEN_MINT, // mint
                wallet.publicKey, // owner
                true, // allow owner off curve
            );

            let destination_token_account = await getAssociatedTokenAddress(
                LOOT_TOKEN_MINT, // mint
                user_keypair.current.publicKey, // owner
                true, // allow owner off curve
            );

            let amount_bn = BigInt(amount * 1e6);
            const transfer_instruction = createTransferInstruction(
                source_token_account,
                destination_token_account,
                wallet.publicKey,
                amount_bn,
                undefined,
                TOKEN_PROGRAM_ID,
            );

            let txArgs = await get_current_blockhash("");

            let transaction = new Transaction(txArgs);
            transaction.feePayer = wallet.publicKey;

            console.log(transaction.recentBlockhash, transaction.lastValidBlockHeight);

            transaction.add(transfer_instruction);
            console.log("send transaction");
            try {
                let signed_transaction = await wallet.signTransaction(transaction);
                const encoded_transaction = bs58.encode(signed_transaction.serialize());

                var transaction_response = await send_transaction("", encoded_transaction);
                console.log("transaction response:", transaction_response);
                if (transaction_response.result === "INVALID") {
                    console.log(transaction_response);
                    return;
                }
            } catch (error) {
                console.log(error);
                return;
            }
        },
        [wallet],
    );

    useEffect(() => {
        addEventListener("TransferSOL", handleTransferSOL);
        return () => {
            removeEventListener("TransferSOL", handleTransferSOL);
        };
    }, [addEventListener, removeEventListener, handleTransferSOL]);

    useEffect(() => {
        addEventListener("TransferLOOT", handleTransferLOOT);
        return () => {
            removeEventListener("TransferLOOT", handleTransferLOOT);
        };
    }, [addEventListener, removeEventListener, handleTransferLOOT]);

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

            let txArgs = await get_current_blockhash("");

            let transaction = new Transaction(txArgs);
            transaction.feePayer = user_keypair.current.publicKey;

            console.log(transaction.recentBlockhash, transaction.lastValidBlockHeight);

            transaction.add(play_instruction);

            transaction.sign(user_keypair.current);

            console.log("sign with ", user_keypair.current.publicKey.toString());
            try {
                const encoded_transaction = bs58.encode(transaction.serialize());

                var transaction_response = await send_transaction("", encoded_transaction);
                console.log("transaction response:", transaction_response);
                if (transaction_response.result === "INVALID") {
                    console.log(transaction_response);
                    return;
                }
            } catch (error) {
                console.log(error);
                return;
            }
        },
        [DungeonInstruction.craft],
    );

    useEffect(() => {
        addEventListener("StartCrafting", handleStartGathering);
        return () => {
            removeEventListener("StartCrafting", handleStartGathering);
        };
    }, [addEventListener, removeEventListener, handleStartGathering]);

    function handleClickEnterFullscreen() {
        requestFullscreen(true);
    }

    const isMobile = useMediaQuery({ query: "(max-width: 1920px)" });

    let width = 1920;
    let height = 1080;

    if (isMobile) {
        width = window.innerWidth;
        height = window.innerHeight;
    }

    return (
        <>
            <Navigation />
            <Text color="white">
                {width} vs {height}
            </Text>
            <Box width="100%">
                <Center>
                    {!ready && (
                        <>
                            <UnconnectedPage />
                        </>
                    )}

                    {ready && (
                        <>
                            <div className="home">
                                <div className="container">
                                    <div className={styles.container}>
                                        <div className={styles.unityWrapper}>
                                            <Fragment>
                                                <Unity unityProvider={unityProvider} style={{ width: width, height: height }} />
                                                <Box as="button" onClick={handleClickEnterFullscreen}>
                                                    <div className="font-face-sfpb">
                                                        <Text fontSize={25} textAlign="center" color="white">
                                                            FullScreen
                                                        </Text>
                                                    </div>
                                                </Box>
                                            </Fragment>
                                        </div>
                                    </div>

                                    <br />
                                </div>
                            </div>
                        </>
                    )}
                </Center>
            </Box>
        </>
    );
}

function Home() {
    const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter(), new BackpackWalletAdapter()], []);

    document.body.setAttribute("style", "background: black;");

    return (
        <ChakraProvider>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    <DungeonApp />
                    <Footer />
                </WalletModalProvider>
            </WalletProvider>
        </ChakraProvider>
    );
}

export default Home;
