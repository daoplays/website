import React, { useCallback, useEffect, useState, useMemo, useRef, Fragment } from "react";

import { ChakraProvider, Box, HStack, Center, Text, VStack } from "@chakra-ui/react";

import { useMediaQuery } from "react-responsive";

import { isMobile } from "react-device-detect";

//import useSound from 'use-sound';

import "react-h5-audio-player/lib/styles.css";
import "./css/home.css";

import { Keypair, PublicKey, Transaction, TransactionInstruction, LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";

import { WalletProvider, useWallet } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter, SolflareWalletAdapter, BackpackWalletAdapter } from "@solana/wallet-adapter-wallets";

import { WalletModalProvider, useWalletModal } from "@solana/wallet-adapter-react-ui";
import { createMessage, readMessage, decrypt, encrypt } from "openpgp";

import BN from "bn.js";
import bs58 from "bs58";

import large_door from "./images/Large_Door.gif";

import { Unity, useUnityContext } from "react-unity-webgl";
import { bignum } from "@metaplex-foundation/beet";

//  dungeon constants
import { DEFAULT_FONT_SIZE, DUNGEON_PROGRAM, SYSTEM_KEY, DEBUG, LOOT_TOKEN_MINT } from "./constants";

// dungeon utils
import {
    request_player_account_data,
    request_token_amount,
    get_JWT_token,
    get_current_blockhash,
    send_transaction,
    bignum_to_num,
    PlayerData,
    request_current_balance,
    request_raw_account_data,
    serialise_save_home_instruction,
    HouseData,
    HouseStateData,
    u64Data,
    serialise_create_account_instruction,
    PlayerAccountData,
    serialise_gather_instruction,
} from "./utils";

import { DungeonInstruction } from "./dungeon_state";

import { Play, Quit, BuyItem } from "./unity/dungeon_instructions";

// navigation
import { Navigation } from "./navigation";

import { Footer } from "./footer";

import "./css/style.css";
import "./css/fonts.css";
import "./css/wallet.css";
const styles = require("./css/unity.css");

require("@solana/wallet-adapter-react-ui/styles.css");

export function DungeonApp() {
    const wallet = useWallet();

    // bearer token used to authorise RPC requests
    const [bearer_token, setBearerToken] = useState<string>("");
    const bearer_interval = useRef<number | null>(null);

    /*
    const DiscountKeyInput: React.FC<DiscountKeyInputProps> = ({ connect }) => {
        let key_size = "50";
        if (isMobile) {
            key_size = "40";
        }
        const { setVisible } = useWalletModal();

        const handleConnectWallet = useCallback(async () => {
            setVisible(true);
        }, [setVisible]);

        return (
            <>
                <div style={{ marginTop: "1rem" }}></div>
                <div
                    style={{ margin: 0 }}
                    onClick={
                        connect
                            ? () => {
                                  CloseDiscountError();
                                  handleConnectWallet();
                              }
                            : undefined
                    }
                >
                    <Popover
                        returnFocusOnClose={false}
                        isOpen={show_discount_error}
                        onClose={CloseDiscountError}
                        placement="bottom"
                        closeOnBlur={false}
                    >
                        <PopoverTrigger>
                            <Button variant="link" size="md" onClick={OpenDiscountError}>
                                <img style={{ imageRendering: "pixelated" }} src={key} width={key_size} alt={""} />
                            </Button>
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
                                    Enter Key Number
                                </PopoverHeader>
                            </div>
                            <PopoverArrow />
                            <PopoverCloseButton ml="1rem" color="white" />
                            <PopoverBody>
                                <FocusLock returnFocus persistentFocus={false}>
                                    <VStack align="center">
                                        <div className="font-face-sfpb">
                                            <NumberInput
                                                fontSize={DUNGEON_FONT_SIZE}
                                                color="white"
                                                size="lg"
                                                onChange={(valueString) => setDiscountKeyIndex(valueString)}
                                                value={discount_key_index}
                                                precision={0}
                                                borderColor="white"
                                                min={1}
                                                max={3500}
                                            >
                                                <NumberInputField
                                                    height={DUNGEON_FONT_SIZE}
                                                    paddingTop="1rem"
                                                    paddingBottom="1rem"
                                                    borderColor="white"
                                                />
                                            </NumberInput>
                                        </div>
                                        <div className="font-face-sfpb">
                                            <Button variant="link" size="md" color="white" onClick={ApplyKey}>
                                                Apply
                                            </Button>
                                        </div>
                                    </VStack>
                                    {key_freeplays >= 0 && (
                                        <>
                                            <Divider mt="1rem" mb="1rem" />
                                            <div className="font-face-sfpb">
                                                <Text color="white">{key_freeplays} freeplays remaining</Text>
                                            </div>
                                        </>
                                    )}
                                    {discount_error && (
                                        <>
                                            <Divider mt="1rem" mb="1rem" />
                                            <div className="font-face-sfpb">
                                                <Text color="white">{discount_error}</Text>
                                            </div>
                                        </>
                                    )}
                                </FocusLock>
                            </PopoverBody>
                        </PopoverContent>
                    </Popover>
                </div>
            </>
        );
    };
*/
    function Disclaimer() {
        const { setVisible } = useWalletModal();
        const isTabletOrMobile = useMediaQuery({ query: "(max-width: 900px)" });

        const handleConnectWallet = useCallback(async () => {
            setVisible(true);
        }, [setVisible]);

        return (
            <>
                <Box as="button" onClick={handleConnectWallet}>
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
    /*
    function RestModal() {
        const handleClose = () => {
            setShowRest(false);
        };

        if (show_rest === false) return <></>;

        return (
            <>
                <Modal centered show={show_rest} animation={false} onHide={handleClose}>
                    <div className="font-face-sfpb">
                        <Modal.Header style={{ backgroundColor: "black" }} closeButton>
                            <Modal.Title style={{ fontSize: 30, color: "white", fontWeight: "semibold" }}>Rest at the Inn</Modal.Title>
                        </Modal.Header>
                    </div>
                    <div className="font-face-sfpb text-center">
                        <Modal.Body style={{ backgroundColor: "black", fontSize: 20, color: "white", fontWeight: "semibold" }}>
                            <HStack>
                                <VStack>
                                    <Box
                                        as="button"
                                        borderWidth="1px"
                                        borderColor={rest_state === 0 ? "blue" : "black"}
                                        onClick={() => setRestState(0)}
                                    >
                                        <img style={{ imageRendering: "pixelated" }} src={xp_bed} width={400} alt={"generic"} />
                                    </Box>
                                    <Text className="font-face-sfpb" fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">
                                        XP
                                    </Text>
                                    <Text className="font-face-sfpb" fontSize="10px" textAlign="center" color="grey">
                                        50% chance to gain +1 XP per room
                                    </Text>
                                </VStack>
                                <VStack>
                                    <Box
                                        as="button"
                                        borderWidth="1px"
                                        borderColor={rest_state === 1 ? "green" : "black"}
                                        onClick={() => setRestState(1)}
                                    >
                                        <img style={{ imageRendering: "pixelated" }} src={loot_bed} width={400} alt={"generic"} />
                                    </Box>
                                    <Text className="font-face-sfpb" fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">
                                        Loot
                                    </Text>
                                    <Text className="font-face-sfpb" fontSize="10px" textAlign="center" color="grey">
                                        +35% Loot per room
                                    </Text>
                                </VStack>
                                <VStack>
                                    <Box
                                        as="button"
                                        borderWidth="1px"
                                        borderColor={rest_state === 2 ? "green" : "black"}
                                        onClick={() => setRestState(2)}
                                    >
                                        <img style={{ imageRendering: "pixelated" }} src={power_bed} width={400} alt={"generic"} />
                                    </Box>
                                    <Text className="font-face-sfpb" fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">
                                        Power
                                    </Text>
                                    <Text className="font-face-sfpb" fontSize="10px" textAlign="center" color="grey">
                                        +1 Power per room
                                    </Text>
                                </VStack>
                            </HStack>
                        </Modal.Body>
                    </div>

                    <Modal.Footer style={{ alignItems: "center", justifyContent: "center", backgroundColor: "black" }}>
                        <Center width="100%">
                            <VStack width="100%">
                                <HStack width="100%">
                                    <VStack width="33%">
                                        <Box as="button" onClick={(e: any) => Rest(0)}>
                                            <Text className="font-face-sfpb" fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">
                                                1h
                                                <br />
                                                (4 LOOT)
                                            </Text>
                                        </Box>
                                        <Text className="font-face-sfpb" fontSize="10px" textAlign="center" color="grey">
                                            +5 Energy
                                        </Text>
                                    </VStack>
                                    <VStack width="33%">
                                        <Box as="button" onClick={(e: any) => Rest(1)}>
                                            <Text className="font-face-sfpb" fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">
                                                4h
                                                <br />
                                                (20 LOOT)
                                            </Text>
                                        </Box>
                                        <Text className="font-face-sfpb" fontSize="10px" textAlign="center" color="grey">
                                            +25 Energy
                                        </Text>
                                    </VStack>
                                    <VStack width="33%">
                                        <Box as="button" onClick={(e: any) => Rest(2)}>
                                            <Text className="font-face-sfpb" fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">
                                                8h
                                                <br />
                                                (40 LOOT)
                                            </Text>
                                        </Box>
                                        <Text className="font-face-sfpb" fontSize="10px" textAlign="center" color="grey">
                                            +60 Energy
                                        </Text>
                                    </VStack>
                                </HStack>
                            </VStack>
                        </Center>
                    </Modal.Footer>
                </Modal>
            </>
        );
    }
*/
    /*
    const check_state = useCallback(async () => {
        if (bearer_token === "") {
            console.log("no bearer token set in check_state");
            return;
        }

        if (DEBUG) {
            console.log("in in it check_updates ", check_user_state.current);
        }

        if (!wallet.publicKey) {
            return;
        }

        if (num_state_checks.current > 2) check_user_state.current = false;

        if (!check_user_state.current && !check_achievements.current) return;

        let player_data_key = PublicKey.findProgramAddressSync([wallet.publicKey.toBytes()], DUNGEON_PROGRAM)[0];

        let program_data_key = PublicKey.findProgramAddressSync([Buffer.from(DATA_ACCOUNT_SEED)], DUNGEON_PROGRAM)[0];

        if (check_user_state.current) {
            try {
                let dungeon_program_data = await request_dungeon_program_data(bearer_token, program_data_key);

                if (dungeon_program_data !== null) {
                    let ema_value = new BN(dungeon_program_data?.current_ema_value).toNumber() / 1e6;

                    setLootPerDay(24 * 60 * ema_value);
                }
            } catch (error) {
                console.log(error);
                setLootPerDay(0);
            }

            try {
                let player_data = await request_player_account_data(bearer_token, player_data_key);

                if (player_data === null) {
                    num_state_checks.current += 1;
                    setDataAccountStatus(AccountStatus.not_created);
                    return;
                }

                setDataAccountStatus(AccountStatus.created);

                let current_status = player_data.player_status + 1;
                if (initial_status.current === DungeonStatus.unknown) {
                    initial_status.current = current_status;
                }

                let current_num_interactions = new BN(player_data.num_interactions).toNumber();

                if (current_interaction.current !== null && current_num_interactions <= current_interaction.current) {
                    if (DEBUG) {
                        console.log("num plays not increased", current_num_interactions);
                    }
                    return;
                }

                setPlayerData(player_data);

                current_interaction.current = current_num_interactions;

                num_interactions.current = current_num_interactions;

                let current_xp = new BN(player_data.num_xp).toNumber();

                if (DEBUG) {
                    console.log(
                        "in init, progress: ",
                        player_data.current_room,
                        "enemy",
                        player_data.current_enemy,
                        "alive",
                        DungeonStatusString[player_data.player_status + 1],
                        "num_interactions",
                        current_num_interactions,
                        "num_xp",
                        current_xp,
                    );
                }

                if (initial_num_interactions.current === -1) {
                    initial_num_interactions.current = current_num_interactions;
                }

                if (current_num_interactions === 0) {
                    return;
                }

                check_user_state.current = false;

                setWhichCharacter(player_data.player_character);

                setCurrentEnemy(player_data.current_enemy);

                setCurrentLevel(player_data.current_room);

                setCurrentStatus(current_status);

                setTotalLoot(bignum_to_num(player_data.total_gold) / 1e6);

                setLastLoot(bignum_to_num(player_data.last_gold) / 1e6);

                setAdvantage(player_data.advantage === 1);

                let loot_bonus_time = bignum_to_num(player_data.bonus_loot_activation_time);
                let current_time = Date.now() / 1000;

                setLootBonus(player_data.bonus_loot === 1 && (current_time - loot_bonus_time) / 60 < 10.1);

                if (update_status_effects.current) {
                    update_status_effects.current = false;
                }

                roll_one.current = player_data.dice_one;
                roll_two.current = player_data.dice_two;

                // just check the freeplay key if the amount remaining is greater than zero
                if (current_key_mint !== null && key_freeplays > 0) {
                    let key_freeplays_account = PublicKey.findProgramAddressSync(
                        [Buffer.from("key_freeplays"), current_key_mint.toBytes()],
                        DUNGEON_PROGRAM,
                    )[0];

                    let freeplay_data = await request_key_freeplays_data(bearer_token, key_freeplays_account);

                    if (freeplay_data !== null) {
                        console.log("free plays remaining", freeplay_data);
                        setKeyFreePlays(freeplay_data.freeplays_remaining);
                    }
                }
                num_state_checks.current = 0;
            } catch (error) {
                console.log(error);
                setCurrentLevel(0);
                setCurrentStatus(DungeonStatus.unknown);
                setCurrentEnemy(DungeonEnemy.None);
                setDataAccountStatus(AccountStatus.not_created);
                num_state_checks.current += 1;
            }
        }

        if (check_achievements.current) {
            if (DEBUG) {
                console.log("check achievement status");
            }

            try {
                // get the achievement data
                let achievement_data_key = PublicKey.findProgramAddressSync(
                    [wallet.publicKey.toBytes(), Buffer.from(ACHIEVEMENT_SEED)],
                    DUNGEON_PROGRAM,
                )[0];
                let achievement_data = await request_player_achievement_data(bearer_token, achievement_data_key);

                if (achievement_data !== null) {
                    if (DEBUG) {
                        console.log(achievement_data);
                        console.log(achievement_data.n_interactions, achievement_interations.current);
                    }

                    if (achievement_data.n_interactions >= achievement_interations.current) {
                        if (DEBUG) {
                            console.log("update achievement state");
                        }

                        setAchievementData(achievement_data);
                        setAchievementStatus(achievement_data.achievement_state);
                        achievement_interations.current = achievement_data.n_interactions;
                        check_achievements.current = false;
                    }
                } else {
                    setAchievementStatus(null);
                    setAchievementData(null);
                    check_achievements.current = false;
                }
            } catch (error) {
                console.log(error);
                setAchievementStatus(null);
                setAchievementData(null);
            }
        }
    }, [wallet, bearer_token, current_key_mint, key_freeplays]);
*/

    const set_JWT_token = useCallback(async () => {
        console.log("Setting new JWT token");
        let token = await get_JWT_token();
        setBearerToken(token["token"]);
    }, []);

    // interval for checking JWT
    useEffect(() => {
        let one_second = 1000;
        if (bearer_interval.current === null) {
            bearer_interval.current = window.setInterval(set_JWT_token, one_second * 60 * 5);
        } else {
            window.clearInterval(bearer_interval.current);
            bearer_interval.current = null;
        }
        // here's the cleanup function
        return () => {
            if (bearer_interval.current !== null) {
                window.clearInterval(bearer_interval.current);
                bearer_interval.current = null;
            }
        };
    }, [set_JWT_token]);

    useEffect(() => {
        if (DEBUG) {
            console.log("In initial use effect");
        }

        set_JWT_token();
    }, [set_JWT_token]);

    /*
    const ApplyKey = useCallback(async () => {
        if (wallet.publicKey === null) return;

        setDiscountError(null);

        let parsed_key_index = parseInt(discount_key_index);
        //console.log("key index", discount_key_index, parsed_key_index, isNaN(parsed_key_index));

        if (isNaN(parsed_key_index)) return;

        let key_meta_data = await run_keyData_GPA(bearer_token, parsed_key_index);

        if (key_meta_data === null) {
            setDiscountError("Key " + discount_key_index + " has not been minted");
            return;
        }

        //console.log("key meta", key_meta_data, key_meta_data.key_mint.toString());

        let key_mint = key_meta_data.key_mint;
        let key_type = key_meta_data.key_type;
        let key_index = parsed_key_index;

        // before we go on lets check they actually own the nft
        let key_token_account = await getAssociatedTokenAddress(
            key_mint, // mint
            wallet.publicKey, // owner
            true, // allow owner off curve
        );

        let token_amount = await request_token_amount(bearer_token, key_token_account);

        if (token_amount !== 1) {
            setDiscountError("User does not own dungeon key " + key_index.toString());
            return;
        }

        let max_freeplays = 10;
        if (key_type === KeyType.Silver) max_freeplays = 20;
        if (key_type === KeyType.Gold) max_freeplays = 30;

        // get remaining freeplays
        let key_freeplays_account = PublicKey.findProgramAddressSync(
            [Buffer.from("key_freeplays"), key_mint.toBytes()],
            DUNGEON_PROGRAM,
        )[0];

        let freeplay_data = await request_key_freeplays_data(bearer_token, key_freeplays_account);

        if (freeplay_data === null) {
            //console.log("no free play account found, setting to ", max_freeplays);
            setKeyFreePlays(max_freeplays);
        } else {
            let current_time = Date.now() / 1000;
            let current_date = Math.floor(current_time / 24 / 60 / 60);
            //console.log("free plays remaining", freeplay_data.freeplays_remaining, freeplay_data.last_date, current_date);
            if (current_date === freeplay_data.last_date) {
                setKeyFreePlays(freeplay_data.freeplays_remaining);
            } else {
                setKeyFreePlays(max_freeplays);
            }
        }

        setCurrentKeyMint(key_mint);
        setCurrentKeyIndex(key_index);
    }, [wallet, discount_key_index, bearer_token]);
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
    const password = useRef<string | null>(null);
    const user_keypair = useRef<Keypair | null>(null);

    const player_state = useRef<PlayerData | null>(null);
    const check_user_state = useRef<boolean>(true);
    const state_interval = useRef<number | null>(null);

    const check_loot_balance = useRef<boolean>(true);
    const check_user_balance = useRef<boolean>(true);
    const user_sol_balance = useRef<number>(0);
    const user_loot_balance = useRef<number>(0);

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

    const setBalance = useCallback(
        (pubkey: string, balance: number, decimals: number, uiAmount: number) => {
            let account_data_json = {
                pubkey: pubkey,
                balance: balance,
                decimals: decimals,
                uiAmount: uiAmount,
            };

            sendMessage("DataManager", "UpdateSolAccount", JSON.stringify(account_data_json));
        },
        [sendMessage],
    );

    const setLootBalance = useCallback(
        (pubkey: string, balance: number, decimals: number, uiAmount: number) => {
            let account_data_json = {
                pubkey: pubkey,
                balance: balance,
                decimals: decimals,
                uiAmount: uiAmount,
            };

            sendMessage("DataManager", "UpdateLootAccount", JSON.stringify(account_data_json));
        },
        [sendMessage],
    );

    const UpdateDungeonData = useCallback(
        (data: string) => {
            sendMessage("DataManager", "UpdateDungeonData", data);
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

        if (!check_user_state.current && !check_user_balance.current) return;

        console.log("check user state");
        if (check_user_balance.current) {
            let new_balance = await request_current_balance(bearer_token, user_keypair.current.publicKey);

            if (user_sol_balance.current === 0 || new_balance !== user_sol_balance.current) {
                user_sol_balance.current = new_balance;
                check_user_balance.current = false;
                setBalance(
                    user_keypair.current.publicKey.toString(),
                    Math.floor(user_sol_balance.current * LAMPORTS_PER_SOL),
                    9,
                    user_sol_balance.current,
                );
            }
        }

        if (check_loot_balance.current) {
            // get loot balance
            let loot_token_account = await getAssociatedTokenAddress(
                LOOT_TOKEN_MINT, // mint
                user_keypair.current.publicKey, // owner
                true, // allow owner off curve
            );

            let loot_amount = await request_token_amount(bearer_token, loot_token_account);
            loot_amount = loot_amount / 1.0e6;

            if (user_loot_balance.current === 0 || loot_amount !== user_loot_balance.current) {
                user_loot_balance.current = loot_amount;
                check_loot_balance.current = false;
                setLootBalance(loot_token_account.toString(), Math.floor(user_loot_balance.current * 1e6), 6, user_loot_balance.current);
            }
        }

        let player_data_key = PublicKey.findProgramAddressSync([user_keypair.current.publicKey.toBytes()], DUNGEON_PROGRAM)[0];

        try {
            let player_data = await request_player_account_data(bearer_token, player_data_key);

            if (player_data === null) {
                return;
            }

            if (player_state.current === null) {
                console.log("current state is null, update");
                player_state.current = player_data;
                check_user_state.current = false;

                let data_string = JSON.stringify(player_data);
                console.log("have player data", player_data);
                console.log("have player data string", data_string);
                console.log(
                    "gold: ",
                    player_data.last_gold.toString(),
                    player_data.total_gold.toString(),
                    new BN(player_data.total_gold).toJSON,
                );
                UpdateDungeonData(data_string);
                return;
            }
            console.log("have player data", player_data);

            console.log(bignum_to_num(player_data.num_interactions), bignum_to_num(player_state.current.num_interactions));
            if (bignum_to_num(player_state.current.num_interactions) >= bignum_to_num(player_data.num_interactions)) return;

            let data_string = JSON.stringify(player_data);

            UpdateDungeonData(data_string);

            player_state.current = player_data;
            check_user_state.current = false;
        } catch (error) {
            console.log(error);
            player_state.current = null;
        }
    }, [bearer_token, setBalance, setLootBalance, UpdateDungeonData]);

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

        let house_data = await request_raw_account_data(bearer_token, player_home_key, "home data");

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
        [wallet, bearer_token, sendLoginConfirmation],
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
                let player_account_data = await request_raw_account_data(bearer_token, player_account_key, "player account data");

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

                        let message_json = {
                            result_code: -1,
                            result_message: "Incorrect Passphrase",
                        };

                        sendLoginConfirmation(JSON.stringify(message_json));
                        return;
                    }

                    unity_initialised.current = true;

                    let message_json = {
                        result_code: 0,
                        result_message: "Login Succeeded",
                    };

                    sendLoginConfirmation(JSON.stringify(message_json));

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
        [bearer_token, CreatePlayerAccount, sendLoginConfirmation],
    );

    const handleTransferSOL = useCallback(
        async (amount: number) => {
            console.log("Transfer sol", amount);
            if (wallet.publicKey === null || wallet.signTransaction === undefined) return;

            if (user_keypair.current === null) return;

            let amount_bn = BigInt(amount * LAMPORTS_PER_SOL);
            const transfer_instruction = SystemProgram.transfer({
                fromPubkey: wallet.publicKey,
                toPubkey: user_keypair.current.publicKey,
                lamports: amount_bn,
            });

            let txArgs = await get_current_blockhash(bearer_token);

            let transaction = new Transaction(txArgs);
            transaction.feePayer = wallet.publicKey;

            console.log(transaction.recentBlockhash, transaction.lastValidBlockHeight);

            transaction.add(transfer_instruction);
            console.log("send transaction");
            try {
                let signed_transaction = await wallet.signTransaction(transaction);
                const encoded_transaction = bs58.encode(signed_transaction.serialize());

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

            check_user_balance.current = true;
        },
        [wallet, bearer_token],
    );

    const handleTransferLOOT = useCallback(async () => {}, []);

    useEffect(() => {
        console.log("Have transfer sol event");
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

            console.log(transaction.recentBlockhash, transaction.lastValidBlockHeight);

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

    const handleDungeonInstruction = useCallback(
        async (instruction_string: string) => {
            console.log("detected dungeon instruction", instruction_string);

            if (user_keypair.current === null) return;

            let instruction_json = JSON.parse(instruction_string);

            if (instruction_json["instruction"] === DungeonInstruction.play)
                await Play(bearer_token, user_keypair.current, instruction_json);
            else if (instruction_json["instruction"] === DungeonInstruction.quit) {
                await Quit(bearer_token, user_keypair.current, instruction_json);
                check_loot_balance.current = true;
            } else if (instruction_json["instruction"] === DungeonInstruction.buy_potion) {
                await BuyItem(bearer_token, user_keypair.current, instruction_json);
                check_loot_balance.current = true;
            }

            check_user_state.current = true;
        },
        [bearer_token],
    );

    useEffect(() => {
        addEventListener("SendDungeonInstruction", handleDungeonInstruction);
        return () => {
            removeEventListener("SendDungeonInstruction", handleDungeonInstruction);
        };
    }, [addEventListener, removeEventListener, handleDungeonInstruction]);

    function handleClickEnterFullscreen() {
        requestFullscreen(true);
    }

    return (
        <>
            <Navigation />

            <Box width="100%">
                <Center>
                    {!wallet.publicKey && (
                        <>
                            <UnconnectedPage />
                        </>
                    )}

                    {wallet.publicKey && (
                        <>
                            <div className="home">
                                <div className="container">
                                    <div className={styles.container}>
                                        <div className={styles.unityWrapper}>
                                            <Fragment>
                                                <Unity unityProvider={unityProvider} style={{ width: 1920, height: 1080 }} />
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
