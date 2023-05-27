import { useCallback, useEffect, useState, useRef } from "react";

import { Box, Center, Text, HStack, VStack } from "@chakra-ui/react";

import { NumberInput, NumberInputField } from "@chakra-ui/react";

import { useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { isMobile } from "react-device-detect";

import bs58 from "bs58";
import BN from "bn.js";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { solid } from "@fortawesome/fontawesome-svg-core/import.macro"; // <-- import styles to be used

import hallway from "./images/Arena1.gif";

import { DEFAULT_FONT_SIZE, ARENA_PROGRAM, SYSTEM_KEY, PROD, DM_PROGRAM, WSS_NODE, DEBUG, EMOJI_SIZE } from "./constants";

import {
    run_arena_free_game_GPA,
    GameData,
    bignum_to_num,
    get_current_blockhash,
    send_transaction,
    uInt32ToLEBytes,
    serialise_Arena_CreateGame_instruction,
    serialise_Arena_Move_instruction,
    serialise_basic_instruction,
    post_discord_message,
    serialise_Arena_Reveal_instruction,
    serialise_Arena_JoinGame_instruction,
    check_signature,
    request_arena_game_data,
    NewDiscordMessage,
} from "./utils";

import { PlayerCharacter, player_emoji_map, WaitingForPlayerText, DrawText, GameOverText } from "./arena_state";

import Table from "react-bootstrap/Table";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import Container from "react-bootstrap/Container";
import Modal from "react-bootstrap/Modal";

//enemies
import assassin from "./images/Assassin.gif";
import blue_slime from "./images/Blue_Slime.gif";
//import boulder from "./images/Boulder.png"
import carnivine from "./images/Carnivine.gif";
import dungeon_master from "./images/Dungeon_Master.gif";
import elves from "./images/Elves.gif";
import giant_blue_slime from "./images/Giant_Blue_Slime.gif";
import giant_green_slime from "./images/Giant_Green_Slime.gif";
import giant_rat from "./images/Giant_Rat.gif";
import giant_spider from "./images/Giant_Spider.gif";
import goblins from "./images/Goblins.gif";
import green_slime from "./images/Green_Slime.gif";
//import mimic from "./images/Mimic.gif"
import orc from "./images/Orc.gif";
import shade from "./images/Shade.gif";
import skeleton_knight from "./images/Skelly_Knight.gif";
import skeletons from "./images/Skellies.gif";
import skeleton_wizard from "./images/Skelly_Wiz.gif";
//import floor_spikes from "./images/Spikes.png"
import werewolf from "./images/Werewolf.gif";

import closed_chest from "./images/chest_closed.png";
import open_chest from "./images/chest_open.png";
import bones from "./images/Bones.png";
import green_slime_corpse from "./images/slime_corpse.png";
import blue_slime_corpse from "./images/Blue_Slime_Corpse.png";
import spider_corpse from "./images/Spider_Corpse.png";
import carnivine_corpse from "./images/Vine_Corpse.png";
import werewolf_corpse from "./images/Wolf_Corpse.png";
import shade_corpse from "./images/Shade_Corpse.png";

//characters
import knight from "./images/Knight.gif";
import ranger from "./images/Ranger.gif";
import wizard from "./images/Wizard.gif";
import corpse from "./images/Corpse.png";

// arena move icons
import acid_move from "./arena_images/Acid.png";
import arrow_move from "./arena_images/Arrow.png";
import barrier_move from "./arena_images/Barrier.png";
//import battleaxe_move from "./arena_images/Battleaxe.png"
import bite_move from "./arena_images/Bite.png";
//import bonk_move from "./arena_images/Bonk.png"
//import charm_move from "./arena_images/Charm.png"
import claws_move from "./arena_images/Claws.png";
//import curse_move from "./arena_images/Curse.png"
import dagger_move from "./arena_images/Dagger.png";
import disease_move from "./arena_images/Disease.png";
import dodge_move from "./arena_images/Dodge.png";
import firebolt_move from "./arena_images/FireBolt.png";
//import freeze_move from "./arena_images/Freeze.png"
//import graspinghand_move from "./arena_images/GraspingHand.png"
//import hypnosis_move from "./arena_images/Hypnosis.png"
//import icicles_move from "./arena_images/Icicles.png"
//import jaggedbone_move from "./arena_images/JaggedBone.png"
///import kick_move from "./arena_images/Kick.png"
import lightning_move from "./arena_images/Lightning.png";
//import magicarrow_move from "./arena_images/MagicArrow.png"
//import multiply_move from "./arena_images/Multiply.png"
//import music_move from "./arena_images/Music.png"
//import net_move from "./arena_images/Net.png"
//import pocketsand_move from "./arena_images/PocketSand.png"
//import poisondagger_move from "./arena_images/PoisonDagger.png"
//import radiance_move from "./arena_images/Radiance.png"
import ratswarm_move from "./arena_images/RatSwarm.png";
//import rock_move from "./arena_images/Rock.png"
//import roll_move from "./arena_images/Roll.png"
//import scythe_move from "./arena_images/Scythe.png"
//import shadowbolt_move from "./arena_images/ShadowBolt.png"
import shield_move from "./arena_images/Shield.png";
//import shroom_move from "./arena_images/Shroom.png"
//import sleep_move from "./arena_images/Sleep.png"
import slimejump_move from "./arena_images/SlimeJump.png";
//import spores_move from "./arena_images/Spores.png"
//import stomp_move from "./arena_images/Stomp.png"
import sword_move from "./arena_images/Sword.png";
//import throwingknives_move from "./arena_images/ThrowingKnives.png"
//import trident_move from "./arena_images/Trident.png"
import venom_move from "./arena_images/Venom.png";
import voice_move from "./arena_images/Voice.png";
//import ward_move from "./arena_images/Ward.png"
//import warhammer_move from "./arena_images/Warhammer.png"
import web_move from "./arena_images/Web.png";
import execute from "./arena_images/Execute.png";

import "./css/table.css";
import "./css/fonts.css";
import "./css/tabs.css";
import "./css/containers.css";

const GoldEmoji: string = "<a:Gold:1086961346492510298>";

const ArenaCharacterEmoji: string[] = [
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
];

const enum ArenaInstruction {
    init = 0,
    create_game = 1,
    join_game = 2,
    cancel_game = 3,
    take_move = 4,
    reveal_move = 5,
    claim_reward = 6,
    forfeit = 7,
}

const enum RPSMove {
    none = 0,
    rock = 1,
    paper = 2,
    scissors = 3,
}

const enum ArenaStatus {
    alive = 0,
    dead = 1,
    waiting = 2,
}

const enum GameStatus {
    waiting = 0,
    in_progress = 1,
    in_reveal = 2,
    draw = 3,
    completed = 4,
}

const enum GameSpeed {
    fast = 0,
    slow = 1,
}

const game_status: string[] = ["Open", "Choose", "Fight", "Draw", "Complete"];

const ARENA_FONT_SIZE = "12px";

interface GameMap {
    key: PublicKey;
    index: number;
}

export function ArenaScreen({ bearer_token }: { bearer_token: string }) {
    const wallet = useWallet();

    const [activeTab, setActiveTab] = useState<any>("my_games");
    const [chosen_character, setChosenCharacter] = useState<PlayerCharacter>(PlayerCharacter.Knight);
    const [chosen_speed, setChosenSpeed] = useState<GameSpeed>(GameSpeed.slow);

    const [waiting_games, setWaitingGames] = useState<GameData[]>([]);
    const [my_games, setMyGames] = useState<GameData[]>([]);
    const [active_game, setActiveGame] = useState<GameData | null>(null);

    const [bet_size_string, setBetSizeString] = useState<string>("0.05");

    const [show_new_game, setShowNewGame] = useState<boolean>(false);
    const [show_join_game, setShowJoinGame] = useState<boolean>(false);
    const join_index = useRef<number>(0);

    const check_arena = useRef<boolean>(true);

    const BetSizeRef = useRef<HTMLInputElement>(null);
    const game_interval = useRef<number | null>(null);
    const [time, setTime] = useState<number>(0);

    const my_games_map = useRef<GameMap[]>([]);
    const waiting_games_map = useRef<GameMap[]>([]);

    const use_websocket = useRef<boolean>(true);
    const ws_p1 = useRef<WebSocket | null>(null);
    const ws_p1_id = useRef<number | null>(null);

    const ws_p2 = useRef<WebSocket | null>(null);
    const ws_p2_id = useRef<number | null>(null);

    const [processing_transaction, setProcessingTransaction] = useState<boolean>(false);

    // refs for checking signatures
    const signature_interval = useRef<number | null>(null);
    const current_signature = useRef<string | null>(null);
    const signature_check_count = useRef<number>(0);
    const [transaction_failed, setTransactionFailed] = useState<boolean>(false);

    useEffect(() => {
        if (DEBUG) console.log("games have updated");
    }, [active_game, my_games, waiting_games]);

    const CheckArenaSignature = useCallback(async () => {
        if (current_signature.current === null) return;

        let signature_response = await check_signature(bearer_token, current_signature.current);

        if (signature_response === null) {
            return;
        }

        //console.log(signature_response);
        let confirmation = signature_response.result?.value[0];

        if (confirmation !== null) {
            if (confirmation?.err !== null) {
                console.log("error: ", confirmation?.err);
                setTransactionFailed(true);
            } else {
                setTransactionFailed(false);
            }

            current_signature.current = null;
            signature_check_count.current = 0;
            setProcessingTransaction(false);
        } else {
            signature_check_count.current += 1;
        }
        if (signature_check_count.current >= 10) {
            setTransactionFailed(true);
            setProcessingTransaction(false);
            current_signature.current = null;
            signature_check_count.current = 0;
        }
    }, [bearer_token]);

    // interval for checking signatures
    useEffect(() => {
        if (signature_interval.current === null) {
            signature_interval.current = window.setInterval(CheckArenaSignature, 1000);
        } else {
            window.clearInterval(signature_interval.current);
            signature_interval.current = null;
        }
        // here's the cleanup function
        return () => {
            if (signature_interval.current !== null) {
                window.clearInterval(signature_interval.current);
                signature_interval.current = null;
            }
        };
    }, [CheckArenaSignature]);

    function get_game_key(game: GameData): PublicKey {
        let seed_bytes = uInt32ToLEBytes(game.seed);
        let game_data_account = PublicKey.findProgramAddressSync(
            [game.player_one.toBytes(), seed_bytes, Buffer.from("Game")],
            ARENA_PROGRAM
        )[0];

        return game_data_account;
    }

    const remove_game_from_list = useCallback(
        async (key: PublicKey) => {
            if (DEBUG) console.log("in remove game");
            let game_entry = my_games_map.current.filter(function (entry) {
                return entry.key.equals(key);
            });

            if (DEBUG) console.log("remove list: ", game_entry);
            // if this is length 0 then we dont need to remove anything
            if (game_entry.length === 0) {
                console.log("game doesn't exist in games map");
                return;
            }

            // if this game was the active game then update that too
            if (active_game !== null && bignum_to_num(active_game.game_id) === bignum_to_num(my_games[game_entry[0].index].game_id)) {
                console.log("set active game to null");
                setActiveGame(null);
            }

            //make a copy of my_game and remove it from the list
            let copy = [...my_games];
            copy.splice(game_entry[0].index, 1);

            if (DEBUG) {
                console.log(my_games);
                console.log(copy);
            }
            setMyGames(copy);

            // we also need to update my_games_map so everything can be reindexed
            my_games_map.current = [];
            for (let i = 0; i < copy.length; i++) {
                let game_key = get_game_key(copy[i]);
                let new_entry: GameMap = { key: game_key, index: i };
                my_games_map.current.push(new_entry);
            }
        },
        [my_games, active_game]
    );

    const check_result = useCallback(
        async (result: any) => {
            // if we have a subscription field check against ws_id
            let key = new PublicKey(result["params"]["result"]["value"]["pubkey"]);

            let event_data = result["params"]["result"]["value"]["account"]["data"][0];

            if (DEBUG) console.log("have event data", event_data);
            let account_data = Buffer.from(event_data, "base64");

            const [game] = GameData.struct.deserialize(account_data);

            let game_entry = my_games_map.current.filter(function (entry) {
                return entry.key.equals(key);
            });

            if (DEBUG) console.log("update list: ", game_entry, game);
            let copy = [...my_games];
            // if this is length 0 then we just need to add it
            if (game_entry.length === 0) {
                copy.push(game);
                setMyGames(copy);
                setActiveGame(game);

                // we also need to add it to the games map
                let new_entry: GameMap = { key: key, index: my_games_map.current.length };
                my_games_map.current.push(new_entry);

                return;
            }

            // only update the copy if the recieved state is later
            if (game.num_interactions <= copy[game_entry[0].index].num_interactions) {
                console.log("message has older state than current version");
                return;
            }

            let updated_entry = { ...copy[game_entry[0].index] };
            //  otherwise just update the state of the game
            updated_entry = game;
            copy[game_entry[0].index] = updated_entry;
            setMyGames(copy);

            // if this game was the active game then update that too
            if (DEBUG) console.log("active game: ", active_game);

            if (active_game !== null && bignum_to_num(active_game.game_id) === bignum_to_num(game.game_id)) {
                setActiveGame(game);
            }
        },
        [my_games, active_game]
    );

    // ws_p1 subscription handler
    useEffect(() => {
        if (use_websocket.current === false || WSS_NODE === undefined || wallet === null) return;

        // if the gamelist has changed we will need to reregister
        if (ws_p1_id.current !== null && !(ws_p1.current?.CLOSING || ws_p1.current?.CLOSED)) {
            console.log("unsubscribe p1 from existing method");
            let message = `{"id":1,"jsonrpc":"2.0","method": "programUnsubscribe", "params": [` + ws_p1_id.current + `]}`;
            ws_p1.current?.send(message);
        }

        let pubkey_bytes = wallet.publicKey?.toString();

        let message =
            `{"id":1,"jsonrpc":"2.0","method": "programSubscribe","params":["` +
            ARENA_PROGRAM +
            `",{"encoding": "jsonParsed", "commitment": "confirmed", "filters": [{"dataSize": 205}, {"memcmp" : {"offset" : 28, "bytes" : "` +
            pubkey_bytes +
            `"}}]}]}`;

        if (ws_p1.current === null || ws_p1.current.CLOSED) {
            ws_p1.current = new WebSocket(WSS_NODE);
        }

        // when the websocket connects, send our request, and then in one second (hopefully long enough )
        ws_p1.current.onopen = () => {
            ws_p1.current?.send(message);
            console.log("ws opened");
        };
        ws_p1.current.onclose = () => {
            ws_p1_id.current = null;
            console.log("ws closed");
        };

        return () => {
            ws_p1.current?.close();
        };
    }, [wallet]);

    useEffect(() => {
        if (use_websocket.current === false || WSS_NODE === undefined) return;

        // if the gamelist has changed we will need to reregister
        if (ws_p2_id.current !== null && !(ws_p2.current?.CLOSING || ws_p2.current?.CLOSED)) {
            console.log("unsubscribe p2 from existing method");
            let message = `{"id":1,"jsonrpc":"2.0","method": "programUnsubscribe", "params": [` + ws_p2_id.current + `]}`;
            ws_p2.current?.send(message);
        }

        let pubkey_bytes = wallet.publicKey?.toString();

        let message =
            `{"id":1,"jsonrpc":"2.0","method": "programSubscribe","params":["` +
            ARENA_PROGRAM +
            `",{"encoding": "jsonParsed", "commitment": "confirmed", "filters": [{"dataSize": 205}, {"memcmp" : {"offset" : 60, "bytes" : "` +
            pubkey_bytes +
            `"}}]}]}`;

        if (ws_p2.current === null || ws_p2.current.CLOSED) {
            ws_p2.current = new WebSocket(WSS_NODE);
        }

        // when the websocket connects, send our request, and then in one second (hopefully long enough )
        ws_p2.current.onopen = () => {
            ws_p2.current?.send(message);
            console.log("ws opened");
        };
        ws_p2.current.onclose = () => {
            ws_p2_id.current = null;
            console.log("ws closed");
        };

        return () => {
            ws_p2.current?.close();
        };
    }, [wallet]);

    useEffect(() => {
        if (ws_p1.current === null) return;

        ws_p1.current.onmessage = (event) => {
            let result = JSON.parse(event.data);

            console.log(result);
            // the first message will be the subscription id, once we have that get the current state of the game as we will be tracking and updates from then on via the subscription
            if (result["id"] !== undefined && result["id"] === 1) {
                console.log("have new subscription id for p1", result["result"]);
                ws_p1_id.current = result["result"];

                return;
            }

            //console.log("got message", result);

            if (result["params"] === undefined) return;

            let event_sub = result["params"]["subscription"];
            if (event_sub !== ws_p1_id.current) {
                console.log("id of message doesn't equal current ws_id, skipping");
                return;
            }

            check_result(result);
        };
    }, [check_result]);

    useEffect(() => {
        if (ws_p2.current === null) return;

        ws_p2.current.onmessage = (event) => {
            let result = JSON.parse(event.data);

            // console.log(result)
            // the first message will be the subscription id, once we have that get the current state of the game as we will be tracking and updates from then on via the subscription
            if (result["id"] !== undefined && result["id"] === 1) {
                console.log("have new subscription id for p2", result["result"]);
                ws_p2_id.current = result["result"];

                return;
            }

            //console.log("got message", result);

            if (result["params"] === undefined) return;

            let event_sub = result["params"]["subscription"];
            if (event_sub !== ws_p2_id.current) {
                console.log("id of message doesn't equal current ws_id, skipping");
                return;
            }

            check_result(result);
        };
    }, [check_result]);

    const check_games = useCallback(async () => {
        // update the time here
        setTime(Date.now() / 1000);
        if (check_arena.current === false) {
            return;
        }

        let list = await run_arena_free_game_GPA(bearer_token);
        //console.log(list)

        let waiting_list = list.filter(function (game) {
            return (
                game.status === 0 &&
                wallet.publicKey !== null &&
                !game.player_one.equals(wallet.publicKey) &&
                !game.player_two.equals(wallet.publicKey)
            );
        });
        setWaitingGames(waiting_list);

        waiting_games_map.current = [];
        for (let i = 0; i < waiting_list.length; i++) {
            let game_key = get_game_key(waiting_list[i]);
            let new_entry: GameMap = { key: game_key, index: i };
            waiting_games_map.current.push(new_entry);
        }

        if (wallet.publicKey === null) return;

        let my_games = list.filter(function (game) {
            return wallet.publicKey !== null && (game.player_one.equals(wallet.publicKey) || game.player_two.equals(wallet.publicKey));
        });

        setMyGames(my_games);

        my_games_map.current = [];
        for (let i = 0; i < my_games.length; i++) {
            let game_key = get_game_key(my_games[i]);
            let new_entry: GameMap = { key: game_key, index: i };
            my_games_map.current.push(new_entry);
        }

        check_arena.current = false;
    }, [bearer_token, wallet]);

    // interval for checking state
    useEffect(() => {
        if (game_interval.current === null) {
            game_interval.current = window.setInterval(check_games, 5000);
        } else {
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

    useEffect(() => {
        if (!check_arena.current) return;

        check_games();
    }, [check_games]);

    const Listings = ({ game_list }: { game_list: GameData[] }) => {
        return (
            <>
                {game_list.map((item: GameData, index) => (
                    <ArenaGameCard key={index} game={item} index={index} />
                ))}
            </>
        );
    };

    const GameTable = () => {
        return (
            <Box width="100%">
                <div className="font-face-sfpb" style={{ color: "white", fontSize: ARENA_FONT_SIZE }}>
                    <Table className="custom-centered-table">
                        <thead>
                            <tr>
                                <th>Game</th>
                                <th>Bet</th>
                                <th>Speed</th>
                                <th>Match</th>
                                <th>Status</th>
                                <th>
                                    <Box
                                        as="button"
                                        onClick={() => {
                                            check_arena.current = true;
                                            check_games();
                                        }}
                                    >
                                        <FontAwesomeIcon color="white" icon={solid("arrows-rotate")} size="lg" />
                                    </Box>
                                </th>
                            </tr>
                        </thead>
                        <tbody
                            style={{
                                backgroundColor: "black",
                            }}
                        >
                            <Listings game_list={waiting_games} />
                        </tbody>
                    </Table>
                </div>
            </Box>
        );
    };

    const MyGameTable = () => {
        return (
            <Box width="100%">
                <div className="font-face-sfpb" style={{ color: "white", fontSize: ARENA_FONT_SIZE }}>
                    <Table className="custom-centered-table">
                        <thead>
                            <tr>
                                <th>Game</th>
                                <th>Bet</th>
                                <th>Speed</th>
                                <th>Match</th>
                                <th>Status</th>
                                <th>
                                    <Box
                                        as="button"
                                        onClick={() => {
                                            check_arena.current = true;
                                            check_games();
                                        }}
                                    >
                                        <FontAwesomeIcon color="white" icon={solid("arrows-rotate")} size="lg" />
                                    </Box>
                                </th>
                            </tr>
                        </thead>
                        <tbody
                            style={{
                                backgroundColor: "black",
                            }}
                        >
                            <Listings game_list={my_games} />
                        </tbody>
                    </Table>
                </div>
            </Box>
        );
    };

    const ArenaGameCard = ({ game, index }: { game: GameData; index: number }) => {
        let bet_size: number = bignum_to_num(game.bet_size) / LAMPORTS_PER_SOL;
        let time_limit: number = game.game_speed === GameSpeed.fast ? 2.05 : 1440.05;
        let time_passed: number = (time - bignum_to_num(game.last_interaction)) / 60;
        let forfeit: boolean =
            time_passed > time_limit &&
            game.status === GameStatus.in_progress &&
            JSON.stringify(game.player_one_encrypted_move) !== JSON.stringify(game.player_two_encrypted_move);

        return (
            <tr>
                <td>RPS</td>
                <td>{bet_size}</td>
                <td>{game.game_speed === GameSpeed.fast ? "Fast" : "Slow"}</td>
                <td>
                    <Center>
                        <HStack>
                            <img
                                src={player_emoji_map.get(game.player_one_character)}
                                width="auto"
                                alt={""}
                                style={{ maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE }}
                            />
                            <Text align="center" fontSize={ARENA_FONT_SIZE} color="white">
                                vs
                            </Text>
                            {game.status === GameStatus.waiting ? (
                                <img
                                    src={player_emoji_map.get(game.player_two_character)}
                                    width="auto"
                                    alt={""}
                                    style={{ maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE, visibility: "hidden" }}
                                />
                            ) : (
                                <img
                                    src={player_emoji_map.get(game.player_two_character)}
                                    width="auto"
                                    alt={""}
                                    style={{ maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE }}
                                />
                            )}
                        </HStack>
                    </Center>
                </td>
                <td>{!forfeit ? game_status[game.status] : "Forfeit"}</td>
                <td>
                    {wallet.publicKey === null ? (
                        <Box as="button" borderWidth="2px" borderColor="white" width="40px">
                            <Text align="center" fontSize={ARENA_FONT_SIZE} color="white">
                                Join
                            </Text>
                        </Box>
                    ) : game.player_one.equals(wallet.publicKey) || game.player_two.equals(wallet.publicKey) ? (
                        <Center>
                            <HStack>
                                <Box
                                    as="button"
                                    onClick={() => {
                                        setActiveGame(game);
                                    }}
                                    borderWidth="2px"
                                    borderColor="white"
                                    width="40px"
                                >
                                    <Text align="center" fontSize={ARENA_FONT_SIZE} color="white">
                                        View
                                    </Text>
                                </Box>
                                {game.status === GameStatus.waiting ? (
                                    <Box
                                        as="button"
                                        onClick={
                                            processing_transaction
                                                ? () => {
                                                      console.log("already clicked");
                                                  }
                                                : () => CancelGameOnArena(index)
                                        }
                                    >
                                        <FontAwesomeIcon icon={solid("trash")} style={{ color: "#ea1a1a" }} />
                                    </Box>
                                ) : (
                                    <Box as="button" visibility="hidden">
                                        <FontAwesomeIcon icon={solid("trash")} style={{ color: "#ea1a1a" }} />
                                    </Box>
                                )}
                            </HStack>
                        </Center>
                    ) : (
                        <JoinGamePopOver index={index} />
                    )}
                </td>
            </tr>
        );
    };

    const CancelGameOnArena = useCallback(
        async (index: number) => {
            if (wallet.publicKey === null || wallet.signTransaction === undefined) return;

            setProcessingTransaction(true);
            setTransactionFailed(false);
            let desired_game = my_games[index];
            let seed_bytes = uInt32ToLEBytes(desired_game.seed);
            let player_one = desired_game.player_one;

            let arena_account = PublicKey.findProgramAddressSync([Buffer.from("arena_account")], ARENA_PROGRAM)[0];
            let game_data_account = PublicKey.findProgramAddressSync(
                [player_one.toBytes(), seed_bytes, Buffer.from("Game")],
                ARENA_PROGRAM
            )[0];
            let game_sol_account = PublicKey.findProgramAddressSync([Buffer.from("sol_account")], ARENA_PROGRAM)[0];

            const instruction_data = serialise_basic_instruction(ArenaInstruction.cancel_game);

            var account_vector = [
                { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
                { pubkey: game_data_account, isSigner: false, isWritable: true },
                { pubkey: game_sol_account, isSigner: false, isWritable: true },

                { pubkey: arena_account, isSigner: false, isWritable: true },

                { pubkey: SYSTEM_KEY, isSigner: false, isWritable: false },
            ];

            const list_instruction = new TransactionInstruction({
                keys: account_vector,
                programId: ARENA_PROGRAM,
                data: instruction_data,
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
                    console.log(transaction_response);
                    setProcessingTransaction(false);
                    setTransactionFailed(true);
                    return;
                }

                let signature = transaction_response.result;

                if (DEBUG) {
                    console.log("cancelplay signature: ", signature);
                }

                current_signature.current = signature;
                signature_check_count.current = 0;
            } catch (error) {
                console.log(error);
                setProcessingTransaction(false);
                return;
            }

            await remove_game_from_list(game_data_account);
        },
        [wallet, my_games, bearer_token, remove_game_from_list]
    );

    const ForfeitGameOnArena = useCallback(async () => {
        if (wallet.publicKey === null || wallet.signTransaction === undefined || active_game === null) return;

        setProcessingTransaction(true);
        setTransactionFailed(false);

        let seed_bytes = uInt32ToLEBytes(active_game.seed);
        let player_one = active_game.player_one;

        let arena_account = PublicKey.findProgramAddressSync([Buffer.from("arena_account")], ARENA_PROGRAM)[0];
        let game_data_account = PublicKey.findProgramAddressSync([player_one.toBytes(), seed_bytes, Buffer.from("Game")], ARENA_PROGRAM)[0];
        let game_sol_account = PublicKey.findProgramAddressSync([Buffer.from("sol_account")], ARENA_PROGRAM)[0];

        const instruction_data = serialise_basic_instruction(ArenaInstruction.forfeit);

        var account_vector = [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: game_data_account, isSigner: false, isWritable: true },
            { pubkey: game_sol_account, isSigner: false, isWritable: true },

            { pubkey: arena_account, isSigner: false, isWritable: true },

            { pubkey: SYSTEM_KEY, isSigner: false, isWritable: false },
        ];

        const list_instruction = new TransactionInstruction({
            keys: account_vector,
            programId: ARENA_PROGRAM,
            data: instruction_data,
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
                console.log(transaction_response);
                setProcessingTransaction(false);
                setTransactionFailed(true);
                return;
            }

            let signature = transaction_response.result;

            if (DEBUG) {
                console.log("forfeit signature: ", signature);
            }

            current_signature.current = signature;
            signature_check_count.current = 0;
        } catch (error) {
            console.log(error);
            setProcessingTransaction(false);
            return;
        }
    }, [wallet, bearer_token, active_game]);

    const ClaimReward = useCallback(async () => {
        if (wallet.publicKey === null || wallet.signTransaction === undefined || active_game === null) return;

        setProcessingTransaction(true);
        setTransactionFailed(false);

        let seed_bytes = uInt32ToLEBytes(active_game.seed);
        let player_one = active_game.player_one;

        let arena_account = PublicKey.findProgramAddressSync([Buffer.from("arena_account")], ARENA_PROGRAM)[0];
        let game_data_account = PublicKey.findProgramAddressSync([player_one.toBytes(), seed_bytes, Buffer.from("Game")], ARENA_PROGRAM)[0];
        let game_sol_account = PublicKey.findProgramAddressSync([Buffer.from("sol_account")], ARENA_PROGRAM)[0];
        let fees_account = PublicKey.findProgramAddressSync([Buffer.from("data_account")], DM_PROGRAM)[0];

        const instruction_data = serialise_basic_instruction(ArenaInstruction.claim_reward);

        var account_vector = [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: game_data_account, isSigner: false, isWritable: true },
            { pubkey: game_sol_account, isSigner: false, isWritable: true },
            { pubkey: fees_account, isSigner: false, isWritable: true },

            { pubkey: arena_account, isSigner: false, isWritable: true },

            { pubkey: DM_PROGRAM, isSigner: false, isWritable: false },
            { pubkey: SYSTEM_KEY, isSigner: false, isWritable: false },
        ];

        const list_instruction = new TransactionInstruction({
            keys: account_vector,
            programId: ARENA_PROGRAM,
            data: instruction_data,
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
                console.log(transaction_response);
                setProcessingTransaction(false);
                setTransactionFailed(true);
                return;
            }

            let signature = transaction_response.result;

            if (DEBUG) {
                console.log("claim play signature: ", signature);
            }

            current_signature.current = signature;
            signature_check_count.current = 0;
        } catch (error) {
            console.log(error);
            setProcessingTransaction(false);
            return;
        }

        let player_emoji = ArenaCharacterEmoji[active_game.player_one_character];
        if (active_game.player_two.equals(wallet.publicKey)) {
            player_emoji = ArenaCharacterEmoji[active_game.player_two_character];
        }

        const message: NewDiscordMessage = {
            message_type: "arena",
            emoji_1: player_emoji,
            emoji_2: GoldEmoji,
            level: 0,
            sol_amount: (bignum_to_num(active_game.bet_size) * 2) / LAMPORTS_PER_SOL,
            achievement_name: "",
        };

        if (PROD) post_discord_message(message);

        setActiveGame(null);
        await remove_game_from_list(game_data_account);
    }, [wallet, active_game, bearer_token, remove_game_from_list]);

    const JoinGameOnArena = useCallback(
        async (index: number) => {
            if (wallet.publicKey === null || wallet.signTransaction === undefined) return;

            setProcessingTransaction(true);
            setTransactionFailed(false);

            let desired_game = waiting_games[index];
            let seed_bytes = uInt32ToLEBytes(desired_game.seed);
            let player_one = desired_game.player_one;

            let arena_account = PublicKey.findProgramAddressSync([Buffer.from("arena_account")], ARENA_PROGRAM)[0];
            let game_data_account = PublicKey.findProgramAddressSync(
                [player_one.toBytes(), seed_bytes, Buffer.from("Game")],
                ARENA_PROGRAM
            )[0];
            let game_sol_account = PublicKey.findProgramAddressSync([Buffer.from("sol_account")], ARENA_PROGRAM)[0];

            // check if the game is still free
            let game_data = await request_arena_game_data(bearer_token, game_data_account);

            // this game should definitely exist, so if it doesn't something has gone wrong
            if (game_data === null) {
                console.log("game already over");
                setProcessingTransaction(false);
                check_arena.current = true;
                check_games();
                return;
            }

            if (desired_game.status !== GameStatus.waiting) {
                console.log("Game is already full");
                check_arena.current = true;
                check_games();
                setProcessingTransaction(false);

                return;
            }

            const instruction_data = serialise_Arena_JoinGame_instruction(ArenaInstruction.join_game, chosen_character);

            var account_vector = [
                { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
                { pubkey: game_data_account, isSigner: false, isWritable: true },
                { pubkey: game_sol_account, isSigner: false, isWritable: true },

                { pubkey: arena_account, isSigner: false, isWritable: true },

                { pubkey: SYSTEM_KEY, isSigner: false, isWritable: false },
            ];

            const list_instruction = new TransactionInstruction({
                keys: account_vector,
                programId: ARENA_PROGRAM,
                data: instruction_data,
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
                    console.log(transaction_response);
                    setProcessingTransaction(false);
                    setTransactionFailed(true);
                    return;
                }

                let signature = transaction_response.result;

                if (DEBUG) {
                    console.log("join signature: ", signature);
                }

                current_signature.current = signature;
                signature_check_count.current = 0;
            } catch (error) {
                console.log(error);
                setProcessingTransaction(false);
                return;
            }

            // if we get this far just set the joined game to the active one
            setActiveGame(desired_game);
            setActiveTab("my_games");

            // and remove it from the waiting list
            let copy = [...waiting_games];
            copy.splice(index, 1);
            setWaitingGames(copy);
        },
        [wallet, waiting_games, bearer_token, chosen_character, check_games]
    );

    const ListGameOnArena = useCallback(async () => {
        if (wallet.publicKey === null || wallet.signTransaction === undefined) return;

        setProcessingTransaction(true);
        setTransactionFailed(false);

        let seed = Math.random() * 1e9;
        let seed_bytes = uInt32ToLEBytes(seed);
        let arena_account = PublicKey.findProgramAddressSync([Buffer.from("arena_account")], ARENA_PROGRAM)[0];
        let game_data_account = PublicKey.findProgramAddressSync(
            [wallet.publicKey.toBytes(), seed_bytes, Buffer.from("Game")],
            ARENA_PROGRAM
        )[0];
        let sol_data_account = PublicKey.findProgramAddressSync([Buffer.from("sol_account")], ARENA_PROGRAM)[0];

        if (DEBUG) {
            console.log("arena: ", arena_account.toString());
            console.log("game_data_account: ", game_data_account.toString());
            console.log("sol_data_account: ", sol_data_account.toString());
        }

        let bet_size = Number(bet_size_string);

        if (bet_size < 0.05) return;

        let bet_size_bn = new BN(bet_size * LAMPORTS_PER_SOL);
        const instruction_data = serialise_Arena_CreateGame_instruction(
            ArenaInstruction.create_game,
            bet_size_bn,
            seed,
            chosen_character,
            chosen_speed
        );

        var account_vector = [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: game_data_account, isSigner: false, isWritable: true },
            { pubkey: sol_data_account, isSigner: false, isWritable: true },

            { pubkey: arena_account, isSigner: false, isWritable: true },
            { pubkey: SYSTEM_KEY, isSigner: false, isWritable: false },
        ];

        const list_instruction = new TransactionInstruction({
            keys: account_vector,
            programId: ARENA_PROGRAM,
            data: instruction_data,
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
                console.log(transaction_response);
                setProcessingTransaction(false);
                setTransactionFailed(true);
                return;
            }

            let signature = transaction_response.result;

            if (DEBUG) {
                console.log("list signature: ", signature);
            }

            current_signature.current = signature;
            signature_check_count.current = 0;
        } catch (error) {
            console.log(error);
            setProcessingTransaction(false);
            return;
        }

        setShowNewGame(false);
    }, [wallet, bet_size_string, bearer_token, chosen_character, chosen_speed]);

    const RevealMoveInGame = useCallback(async () => {
        if (wallet.publicKey === null || wallet.signTransaction === undefined || active_game === null) return;

        setProcessingTransaction(true);
        setTransactionFailed(false);

        //console.log(active_game);
        let seed_bytes = uInt32ToLEBytes(active_game.seed);

        //console.log("sending reveal move to DB");
        const db_url = `/.netlify/functions/post_to_db?method=Reveal&game_id=` + active_game.game_id;
        const send_result = await fetch(db_url).then((res) => res.json());
        //console.log("Reveal send : ", send_result);

        if (send_result["statusCode"] !== 200) {
            console.log("Error getting moves from DB");
            setProcessingTransaction(false);
            return;
        }

        let message_body = JSON.parse(send_result["body"]);
        //console.log(message_body)

        let arena_account = PublicKey.findProgramAddressSync([Buffer.from("arena_account")], ARENA_PROGRAM)[0];
        let game_data_account = PublicKey.findProgramAddressSync(
            [active_game.player_one.toBytes(), seed_bytes, Buffer.from("Game")],
            ARENA_PROGRAM
        )[0];
        let sol_data_account = PublicKey.findProgramAddressSync([Buffer.from("sol_account")], ARENA_PROGRAM)[0];

        const instruction_data = serialise_Arena_Reveal_instruction(
            ArenaInstruction.reveal_move,
            message_body["move_0"],
            message_body["salt_0"],
            message_body["move_1"],
            message_body["salt_1"]
        );

        var account_vector = [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: game_data_account, isSigner: false, isWritable: true },
            { pubkey: sol_data_account, isSigner: false, isWritable: true },

            { pubkey: arena_account, isSigner: false, isWritable: true },

            { pubkey: SYSTEM_KEY, isSigner: false, isWritable: false },
        ];

        const list_instruction = new TransactionInstruction({
            keys: account_vector,
            programId: ARENA_PROGRAM,
            data: instruction_data,
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
                console.log(transaction_response);
                setProcessingTransaction(false);
                setTransactionFailed(true);
                return;
            }

            let signature = transaction_response.result;

            if (DEBUG) {
                console.log("reveal signature: ", signature);
            }

            current_signature.current = signature;
            signature_check_count.current = 0;
        } catch (error) {
            console.log(error);
            setProcessingTransaction(false);
            return;
        }
    }, [wallet, active_game, bearer_token]);

    const TakeMoveInGame = useCallback(
        async (move: number) => {
            if (wallet.publicKey === null || wallet.signTransaction === undefined || active_game === null) return;

            setProcessingTransaction(true);
            setTransactionFailed(false);

            // console.log(active_game);
            let seed_bytes = uInt32ToLEBytes(active_game.seed);

            let arena_account = PublicKey.findProgramAddressSync([Buffer.from("arena_account")], ARENA_PROGRAM)[0];
            let game_data_account = PublicKey.findProgramAddressSync(
                [active_game.player_one.toBytes(), seed_bytes, Buffer.from("Game")],
                ARENA_PROGRAM
            )[0];
            let sol_data_account = PublicKey.findProgramAddressSync([Buffer.from("sol_account")], ARENA_PROGRAM)[0];

            let player_id;
            if (active_game.player_one.equals(wallet.publicKey)) {
                player_id = 0;
            }
            if (active_game.player_two.equals(wallet.publicKey)) {
                player_id = 1;
            }

            // before sending the move to the DB just check this player doesn't have a move on chain.  This shouldn't happen but just in case...
            let game_data = await request_arena_game_data(bearer_token, game_data_account);

            // this game should definitely exist, so if it doesn't something has gone wrong
            if (game_data === null) {
                console.log("game data not accesible for valid game");
                setTransactionFailed(true);
                setProcessingTransaction(false);
                return;
            }

            // we check if an existing encrypted move is present for this player
            let sum_player_one_encrypted_move = 0;
            let sum_player_two_encrypted_move = 0;

            for (let i in active_game.player_one_encrypted_move) {
                sum_player_one_encrypted_move += active_game.player_one_encrypted_move[i];
            }

            for (let i in active_game.player_two_encrypted_move) {
                sum_player_two_encrypted_move += active_game.player_two_encrypted_move[i];
            }

            if ((player_id === 0 && sum_player_one_encrypted_move > 0) || (player_id === 1 && sum_player_two_encrypted_move > 0)) {
                console.log("player has already submitted a move for this game");
                return;
            }

            //console.log("sending move to DB as player", player_id);
            const db_url =
                `/.netlify/functions/post_to_db?method=Insert&game_id=` +
                active_game.game_id +
                "&player_id=" +
                player_id +
                "&move=" +
                move +
                "&round=" +
                active_game.num_round;
            const send_result = await fetch(db_url).then((res) => res.json());
            //console.log("Move send : ", send_result);

            if (send_result["statusCode"] !== 200) {
                console.log("Error sending move to DB");
                setProcessingTransaction(false);
                return;
            }

            let message_body = JSON.parse(send_result["body"]);
            //console.log(message_body)

            let hash_array = message_body["hash"];
            //console.log(hash_array)
            const instruction_data = serialise_Arena_Move_instruction(ArenaInstruction.take_move, hash_array);

            var account_vector = [
                { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
                { pubkey: game_data_account, isSigner: false, isWritable: true },
                { pubkey: sol_data_account, isSigner: false, isWritable: true },

                { pubkey: arena_account, isSigner: false, isWritable: true },

                { pubkey: SYSTEM_KEY, isSigner: false, isWritable: false },
            ];

            const list_instruction = new TransactionInstruction({
                keys: account_vector,
                programId: ARENA_PROGRAM,
                data: instruction_data,
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
                    console.log(transaction_response);
                    setProcessingTransaction(false);
                    setTransactionFailed(true);
                    return;
                }

                let signature = transaction_response.result;

                if (DEBUG) {
                    console.log("move signature: ", signature);
                }

                current_signature.current = signature;
                signature_check_count.current = 0;
            } catch (error) {
                console.log(error);
                setProcessingTransaction(false);
                return;
            }
        },
        [wallet, active_game, bearer_token]
    );

    function OneCharacter({ character, unlocked }: { character: PlayerCharacter; unlocked: boolean }) {
        if (!unlocked) {
            return (
                <Box>
                    <img
                        src={player_emoji_map.get(character)}
                        width="auto"
                        alt={""}
                        style={{ maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE, filter: "grayscale(1)" }}
                    />
                </Box>
            );
        }

        return (
            <Box
                as="button"
                onClick={() => setChosenCharacter(character)}
                borderWidth={chosen_character === character ? "1px" : "0px"}
                borderColor="white"
            >
                <img src={player_emoji_map.get(character)} width="auto" alt={""} style={{ maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE }} />
            </Box>
        );
    }

    function CharacterSelect() {
        return (
            <VStack align={"center"}>
                <HStack>
                    <OneCharacter character={PlayerCharacter.Knight} unlocked={true} />
                    <OneCharacter character={PlayerCharacter.Ranger} unlocked={true} />
                    <OneCharacter character={PlayerCharacter.Wizard} unlocked={true} />

                    <OneCharacter character={PlayerCharacter.GreenSlime} unlocked={false} />
                    <OneCharacter character={PlayerCharacter.GiantRat} unlocked={false} />
                    <OneCharacter character={PlayerCharacter.GiantSpider} unlocked={false} />
                </HStack>

                <HStack>
                    <OneCharacter character={PlayerCharacter.Goblins} unlocked={false} />
                    <OneCharacter character={PlayerCharacter.BoulderTrap} unlocked={false} />
                    <OneCharacter character={PlayerCharacter.Mimic} unlocked={false} />
                    <OneCharacter character={PlayerCharacter.Skeletons} unlocked={false} />
                    <OneCharacter character={PlayerCharacter.SpikeTrap} unlocked={false} />
                    <OneCharacter character={PlayerCharacter.Carnivine} unlocked={false} />
                    <OneCharacter character={PlayerCharacter.GiantGreenSlime} unlocked={false} />
                </HStack>
                <HStack>
                    <OneCharacter character={PlayerCharacter.Werewolf} unlocked={false} />
                    <OneCharacter character={PlayerCharacter.BlueSlime} unlocked={false} />
                    <OneCharacter character={PlayerCharacter.Elves} unlocked={false} />
                    <OneCharacter character={PlayerCharacter.GiantBlueSlime} unlocked={false} />
                    <OneCharacter character={PlayerCharacter.Orc} unlocked={false} />
                    <OneCharacter character={PlayerCharacter.SkeletonKnight} unlocked={false} />
                    <OneCharacter character={PlayerCharacter.SkeletonWizard} unlocked={false} />
                </HStack>
                <HStack>
                    <OneCharacter character={PlayerCharacter.Assassin} unlocked={false} />
                    <OneCharacter character={PlayerCharacter.DM} unlocked={false} />
                    <OneCharacter character={PlayerCharacter.Shade} unlocked={false} />
                </HStack>
            </VStack>
        );
    }

    function JoinGamePopOver({ index }: { index: number }) {
        return (
            <Box
                as="button"
                onClick={() => {
                    join_index.current = index;
                    setShowJoinGame(true);
                }}
                borderWidth="2px"
                borderColor="white"
                width="60px"
                visibility={!show_join_game || index !== join_index.current ? "visible" : "hidden"}
            >
                <div className="font-face-sfpb">
                    <Text align="center" fontSize={ARENA_FONT_SIZE} color="white">
                        Join
                    </Text>
                </div>
            </Box>
        );
    }

    function JoinGameModal() {
        const handleClose = () => {
            setShowJoinGame(false);
        };

        return (
            <>
                <Modal centered show={show_join_game} animation={false} onHide={handleClose}>
                    <div className="font-face-sfpb">
                        <Modal.Header style={{ backgroundColor: "black" }} closeButton>
                            <Modal.Title style={{ fontSize: DEFAULT_FONT_SIZE, color: "white", fontWeight: "semibold" }}>
                                Character Select
                            </Modal.Title>
                        </Modal.Header>
                    </div>
                    <div className="font-face-sfpb text-center">
                        <Modal.Body style={{ backgroundColor: "black", fontSize: ARENA_FONT_SIZE, color: "white", fontWeight: "semibold" }}>
                            <CharacterSelect />
                        </Modal.Body>
                    </div>

                    <Modal.Footer style={{ alignItems: "center", justifyContent: "center", backgroundColor: "black" }}>
                        <div className="font-face-sfpb">
                            <Box as="button" borderWidth="2px" borderColor="white" width="60px">
                                <Text
                                    align="center"
                                    onClick={
                                        processing_transaction
                                            ? () => {
                                                  console.log("already clicked");
                                              }
                                            : () => {
                                                  JoinGameOnArena(join_index.current);
                                                  setShowJoinGame(false);
                                              }
                                    }
                                    fontSize={ARENA_FONT_SIZE}
                                    color="white"
                                >
                                    Join
                                </Text>
                            </Box>
                        </div>
                    </Modal.Footer>
                </Modal>
            </>
        );
    }

    function NewGameModal() {
        const handleClose = () => {
            setShowNewGame(false);
        };

        return (
            <>
                <Modal centered show={show_new_game} animation={false} onHide={handleClose}>
                    <div className="font-face-sfpb">
                        <Modal.Header style={{ backgroundColor: "black" }} closeButton>
                            <Modal.Title style={{ fontSize: DEFAULT_FONT_SIZE, color: "white", fontWeight: "semibold" }}>
                                Enter Game Details
                            </Modal.Title>
                        </Modal.Header>
                    </div>
                    <div className="font-face-sfpb text-center">
                        <Modal.Body style={{ backgroundColor: "black", fontSize: ARENA_FONT_SIZE, color: "white", fontWeight: "semibold" }}>
                            <VStack align="center" spacing="10px">
                                <HStack width="80%" align={"center"}>
                                    <Box width="50%">
                                        <Text align={"left"} fontSize={ARENA_FONT_SIZE} color="white">
                                            Game:
                                        </Text>
                                    </Box>
                                    <Box width="50%">
                                        <Text align={"left"} fontSize={ARENA_FONT_SIZE} color="white">
                                            RPS
                                        </Text>
                                    </Box>
                                </HStack>
                                <HStack width="80%" align={"center"}>
                                    <Box width="50%">
                                        <Text align={"left"} fontSize={ARENA_FONT_SIZE} color="white">
                                            Bet Size:
                                        </Text>
                                    </Box>
                                    <Box width="50%">
                                        <NumberInput
                                            id="desired_betsize"
                                            ref={BetSizeRef}
                                            fontSize={ARENA_FONT_SIZE}
                                            color="white"
                                            size="lg"
                                            onChange={(valueString) => {
                                                setBetSizeString(valueString);
                                            }}
                                            value={bet_size_string}
                                            borderColor="white"
                                            min={0.05}
                                        >
                                            <NumberInputField
                                                height={ARENA_FONT_SIZE}
                                                paddingTop="1rem"
                                                paddingBottom="1rem"
                                                borderColor="white"
                                                autoFocus={true}
                                            />
                                        </NumberInput>
                                    </Box>
                                </HStack>
                                <HStack width="80%" align={"center"}>
                                    <Box width="50%">
                                        <Text align={"left"} fontSize={ARENA_FONT_SIZE} color="white">
                                            Speed:
                                        </Text>
                                    </Box>

                                    <VStack width="30%" align="left">
                                        <HStack width="100%">
                                            <Box
                                                as="button"
                                                borderWidth="2px"
                                                borderColor={chosen_speed === GameSpeed.slow ? "white" : "black"}
                                                width="50px"
                                                height={35}
                                                onClick={() => setChosenSpeed(GameSpeed.slow)}
                                            >
                                                <Text align="center" fontSize={ARENA_FONT_SIZE} color="white">
                                                    Slow
                                                </Text>
                                            </Box>

                                            <Box
                                                as="button"
                                                borderWidth="2px"
                                                borderColor={chosen_speed === GameSpeed.fast ? "white" : "black"}
                                                width="50px"
                                                height={35}
                                                onClick={() => setChosenSpeed(GameSpeed.fast)}
                                            >
                                                <Text align="center" fontSize={ARENA_FONT_SIZE} color="white">
                                                    Fast
                                                </Text>
                                            </Box>
                                        </HStack>
                                        <Box width="150%">
                                            {chosen_speed === GameSpeed.slow ? (
                                                <Text color="grey" fontSize="10px">
                                                    Players have one day to make a move
                                                </Text>
                                            ) : (
                                                <Text color="grey" fontSize="10px">
                                                    Players have two minutes to make a move
                                                </Text>
                                            )}
                                        </Box>
                                    </VStack>
                                </HStack>
                                <Box width="80%">
                                    <Text align={"left"} fontSize={ARENA_FONT_SIZE} color="white">
                                        Character Select:
                                    </Text>
                                </Box>
                                <CharacterSelect />
                            </VStack>
                        </Modal.Body>
                    </div>

                    <Modal.Footer style={{ alignItems: "center", justifyContent: "center", backgroundColor: "black" }}>
                        <div className="font-face-sfpb">
                            <VStack>
                                <Box as="button" borderWidth="2px" borderColor="white" width="120px">
                                    <Text
                                        align="center"
                                        onClick={
                                            processing_transaction
                                                ? () => {
                                                      console.log("already clicked");
                                                  }
                                                : ListGameOnArena
                                        }
                                        fontSize={ARENA_FONT_SIZE}
                                        color="white"
                                    >
                                        CREATE
                                    </Text>
                                </Box>
                                <Text color="grey" fontSize="10px">
                                    Game account costs will be returned at the end of the game
                                </Text>
                            </VStack>
                        </div>
                    </Modal.Footer>
                </Modal>
            </>
        );
    }

    function ListNewGame() {
        return (
            <>
                <div style={{ margin: 0 }}>
                    <Box
                        as="button"
                        onClick={() => setShowNewGame(true)}
                        borderWidth="2px"
                        borderColor="white"
                        width="200px"
                        visibility={!show_new_game ? "visible" : "hidden"}
                    >
                        <div className="font-face-sfpb">
                            <Text align="center" fontSize={ARENA_FONT_SIZE} color="white">
                                Create New Game
                            </Text>
                        </div>
                    </Box>
                </div>
            </>
        );
    }

    const DisplayPlayer = ({
        player_character,
        player_status,
        is_player_one,
    }: {
        player_character: PlayerCharacter;
        player_status: ArenaStatus;
        is_player_one: boolean;
    }) => {
        let transform;
        if (player_status === ArenaStatus.dead) {
            // for the traps we don't return anything
            if (player_character === PlayerCharacter.BoulderTrap) {
                return <></>;
            }
            if (player_character === PlayerCharacter.SpikeTrap) {
                return <></>;
            }

            if (player_character === PlayerCharacter.Mimic) {
                return <img style={{ imageRendering: "pixelated" }} src={open_chest} width="10000" alt={""} />;
            }

            if (player_character === PlayerCharacter.GreenSlime || player_character === PlayerCharacter.GiantGreenSlime) {
                return <img style={{ imageRendering: "pixelated" }} src={green_slime_corpse} width="10000" alt={""} />;
            }

            if (player_character === PlayerCharacter.BlueSlime || player_character === PlayerCharacter.GiantBlueSlime) {
                return <img style={{ imageRendering: "pixelated" }} src={blue_slime_corpse} width="10000" alt={""} />;
            }

            if (player_character === PlayerCharacter.Werewolf) {
                return <img style={{ imageRendering: "pixelated" }} src={werewolf_corpse} width="10000" alt={""} />;
            }

            if (player_character === PlayerCharacter.Carnivine) {
                return <img style={{ imageRendering: "pixelated" }} src={carnivine_corpse} width="10000" alt={""} />;
            }

            if (player_character === PlayerCharacter.Shade) {
                return <img style={{ imageRendering: "pixelated" }} src={shade_corpse} width="10000" alt={""} />;
            }

            if (player_character === PlayerCharacter.GiantSpider) {
                return <img style={{ imageRendering: "pixelated" }} src={spider_corpse} width="10000" alt={""} />;
            }

            if (player_character === PlayerCharacter.Skeletons) {
                return <img style={{ imageRendering: "pixelated" }} src={bones} width="10000" alt={""} />;
            }

            return <img style={{ imageRendering: "pixelated" }} src={corpse} width="10000" alt={""} />;
        }

        if (player_character === PlayerCharacter.Knight) {
            transform = !is_player_one ? "scaleX(-1)" : "scaleX(1)";
            return <img style={{ imageRendering: "pixelated", transform: transform }} src={knight} width="10000" alt={""} />;
        }
        if (player_character === PlayerCharacter.Ranger) {
            transform = !is_player_one ? "scaleX(-1)" : "scaleX(1)";
            return <img style={{ imageRendering: "pixelated", transform: transform }} src={ranger} width="10000" alt={""} />;
        }
        if (player_character === PlayerCharacter.Wizard) {
            transform = !is_player_one ? "scaleX(-1)" : "scaleX(1)";
            return <img style={{ imageRendering: "pixelated", transform: transform }} src={wizard} width="10000" alt={""} />;
        }
        if (player_character === PlayerCharacter.Assassin) {
            transform = is_player_one ? "scaleX(-1)" : "scaleX(1)";
            return <img style={{ imageRendering: "pixelated", transform: transform }} src={assassin} width="10000" alt={""} />;
        }
        if (player_character === PlayerCharacter.BlueSlime) {
            transform = is_player_one ? "scaleX(-1)" : "scaleX(1)";
            return <img style={{ imageRendering: "pixelated", transform: transform }} src={blue_slime} width="10000" alt={""} />;
        }
        if (player_character === PlayerCharacter.Carnivine) {
            transform = is_player_one ? "scaleX(-1)" : "scaleX(1)";
            return <img style={{ imageRendering: "pixelated", transform: transform }} src={carnivine} width="10000" alt={""} />;
        }
        if (player_character === PlayerCharacter.DM) {
            transform = is_player_one ? "scaleX(-1)" : "scaleX(1)";
            return <img style={{ imageRendering: "pixelated", transform: transform }} src={dungeon_master} width="10000" alt={""} />;
        }
        if (player_character === PlayerCharacter.Elves) {
            transform = is_player_one ? "scaleX(-1)" : "scaleX(1)";
            return <img style={{ imageRendering: "pixelated", transform: transform }} src={elves} width="10000" alt={""} />;
        }
        if (player_character === PlayerCharacter.GiantBlueSlime) {
            transform = is_player_one ? "scaleX(-1)" : "scaleX(1)";
            return <img style={{ imageRendering: "pixelated", transform: transform }} src={giant_blue_slime} width="10000" alt={""} />;
        }
        if (player_character === PlayerCharacter.GiantGreenSlime) {
            transform = is_player_one ? "scaleX(-1)" : "scaleX(1)";
            return <img style={{ imageRendering: "pixelated", transform: transform }} src={giant_green_slime} width="10000" alt={""} />;
        }
        if (player_character === PlayerCharacter.GiantRat) {
            transform = is_player_one ? "scaleX(-1)" : "scaleX(1)";
            return <img style={{ imageRendering: "pixelated", transform: transform }} src={giant_rat} width="10000" alt={""} />;
        }
        if (player_character === PlayerCharacter.GiantSpider) {
            transform = is_player_one ? "scaleX(-1)" : "scaleX(1)";
            return <img style={{ imageRendering: "pixelated", transform: transform }} src={giant_spider} width="10000" alt={""} />;
        }
        if (player_character === PlayerCharacter.Goblins) {
            transform = is_player_one ? "scaleX(-1)" : "scaleX(1)";
            return <img style={{ imageRendering: "pixelated", transform: transform }} src={goblins} width="10000" alt={""} />;
        }
        if (player_character === PlayerCharacter.GreenSlime) {
            transform = is_player_one ? "scaleX(-1)" : "scaleX(1)";
            return <img style={{ imageRendering: "pixelated", transform: transform }} src={green_slime} width="10000" alt={""} />;
        }
        if (player_character === PlayerCharacter.Mimic) {
            transform = is_player_one ? "scaleX(-1)" : "scaleX(1)";
            return <img style={{ imageRendering: "pixelated", transform: transform }} src={closed_chest} width="10000" alt={""} />;
        }
        if (player_character === PlayerCharacter.Orc) {
            transform = is_player_one ? "scaleX(-1)" : "scaleX(1)";
            return <img style={{ imageRendering: "pixelated", transform: transform }} src={orc} width="10000" alt={""} />;
        }
        if (player_character === PlayerCharacter.Shade) {
            transform = is_player_one ? "scaleX(-1)" : "scaleX(1)";
            return <img style={{ imageRendering: "pixelated", transform: transform }} src={shade} width="10000" alt={""} />;
        }
        if (player_character === PlayerCharacter.SkeletonKnight) {
            transform = is_player_one ? "scaleX(-1)" : "scaleX(1)";
            return <img style={{ imageRendering: "pixelated", transform: transform }} src={skeleton_knight} width="10000" alt={""} />;
        }
        if (player_character === PlayerCharacter.Skeletons) {
            transform = is_player_one ? "scaleX(-1)" : "scaleX(1)";
            return <img style={{ imageRendering: "pixelated", transform: transform }} src={skeletons} width="10000" alt={""} />;
        }
        if (player_character === PlayerCharacter.SkeletonWizard) {
            transform = is_player_one ? "scaleX(-1)" : "scaleX(1)";
            return <img style={{ imageRendering: "pixelated", transform: transform }} src={skeleton_wizard} width="10000" alt={""} />;
        }
        if (player_character === PlayerCharacter.Werewolf) {
            transform = is_player_one ? "scaleX(-1)" : "scaleX(1)";
            return <img style={{ imageRendering: "pixelated", transform: transform }} src={werewolf} width="10000" alt={""} />;
        }

        // for the traps we don't return anything
        if (player_character === PlayerCharacter.BoulderTrap) {
            return <></>;
        }
        if (player_character === PlayerCharacter.SpikeTrap) {
            return <></>;
        }

        return <></>;
    };

    function ArenaButtons({ character, forfeit }: { character: PlayerCharacter; forfeit: boolean }) {
        let button_size = "100";
        if (isMobile) {
            button_size = "50";
        }
        let rock_img;
        let paper_img;
        let scissors_img;
        let rock_name;
        let paper_name;
        let scissors_name;

        if (character === PlayerCharacter.Knight) {
            rock_img = shield_move;
            paper_img = voice_move;
            scissors_img = sword_move;

            rock_name = "Shield";
            paper_name = "Battle Cry";
            scissors_name = "Sword";
        }

        if (character === PlayerCharacter.Ranger) {
            rock_img = dodge_move;
            paper_img = arrow_move;
            scissors_img = dagger_move;

            rock_name = "Dodge";
            paper_name = "Arrow";
            scissors_name = "Dagger";
        }

        if (character === PlayerCharacter.Wizard) {
            rock_img = barrier_move;
            paper_img = lightning_move;
            scissors_img = firebolt_move;

            rock_name = "Barrier";
            paper_name = "Lightning Bolt";
            scissors_name = "Fire Bolt";
        }

        if (character === PlayerCharacter.GreenSlime) {
            rock_img = dodge_move;
            paper_img = slimejump_move;
            scissors_img = acid_move;
        }

        if (character === PlayerCharacter.GiantRat) {
            rock_img = ratswarm_move;
            paper_img = disease_move;
            scissors_img = claws_move;
        }

        if (character === PlayerCharacter.GiantSpider) {
            rock_img = web_move;
            paper_img = venom_move;
            scissors_img = bite_move;
        }

        if (forfeit) {
            return (
                <Box
                    as="button"
                    onClick={
                        processing_transaction
                            ? () => {
                                  console.log("already clicked");
                              }
                            : () => ForfeitGameOnArena()
                    }
                >
                    <img style={{ imageRendering: "pixelated" }} src={execute} width={button_size} alt={""} />
                </Box>
            );
        }

        return (
            <HStack spacing="1rem">
                <VStack align="center">
                    <Box
                        as="button"
                        onClick={
                            processing_transaction
                                ? () => {
                                      console.log("already clicked");
                                  }
                                : () => TakeMoveInGame(RPSMove.rock)
                        }
                    >
                        <img style={{ imageRendering: "pixelated" }} src={rock_img} width={button_size} alt={""} />
                    </Box>
                    <Text className="font-face-sfp" color="grey" fontSize="10px">
                        (R) {rock_name}
                    </Text>
                </VStack>

                <VStack align="center">
                    <Box
                        as="button"
                        onClick={
                            processing_transaction
                                ? () => {
                                      console.log("already clicked");
                                  }
                                : () => TakeMoveInGame(RPSMove.paper)
                        }
                    >
                        <img style={{ imageRendering: "pixelated" }} src={paper_img} width={button_size} alt={""} />
                    </Box>
                    <Text className="font-face-sfp" color="grey" fontSize="10px">
                        (P) {paper_name}
                    </Text>
                </VStack>

                <VStack align="center">
                    <Box
                        as="button"
                        onClick={
                            processing_transaction
                                ? () => {
                                      console.log("already clicked");
                                  }
                                : () => TakeMoveInGame(RPSMove.scissors)
                        }
                    >
                        <img style={{ imageRendering: "pixelated" }} src={scissors_img} width={button_size} alt={""} />
                    </Box>
                    <Text className="font-face-sfp" color="grey" fontSize="10px">
                        (S) {scissors_name}
                    </Text>
                </VStack>
            </HStack>
        );
    }

    function ActiveGame() {
        if (active_game === null || wallet.publicKey === null) {
            return (
                <Box width="100%" mb="3rem">
                    <VStack width="100%">
                        <HStack width="100%" mb="2%" mt="1%">
                            <Box width="10%"></Box>
                            <Box
                                style={{
                                    backgroundImage: `url(${hallway})`,
                                    backgroundPosition: "center",
                                    backgroundSize: "contain",
                                    backgroundRepeat: "no-repeat",
                                    imageRendering: "pixelated",
                                }}
                                width="80%"
                            >
                                <HStack>
                                    <Box width="30%"></Box>
                                    <Box width="15%" visibility="hidden">
                                        {" "}
                                        <DisplayPlayer player_character={0} player_status={0} is_player_one={true} />
                                    </Box>
                                    <Box width="10%"></Box>
                                    <Box width="15%" visibility="hidden">
                                        {" "}
                                        <DisplayPlayer player_character={0} player_status={0} is_player_one={false} />{" "}
                                    </Box>
                                    <Box width="30%"></Box>
                                </HStack>
                            </Box>
                            <Box width="10%"></Box>
                        </HStack>
                    </VStack>

                    <Center width="100%" height="150px"></Center>
                </Box>
            );
        }

        let time_limit: number = active_game.game_speed === GameSpeed.fast ? 2.05 : 1440.05;
        let time_passed: number = (time - bignum_to_num(active_game.last_interaction)) / 60;
        let forfeit: boolean = time_passed > time_limit && active_game.status === GameStatus.in_progress;

        //console.log("p1 ", active_game.player_one_status, " p2 ", active_game.player_two_status);
        // console.log("p1 ", active_game.player_one.toString(), " p2 ", active_game.player_two.toString());

        let is_player_one: boolean = true;
        if (active_game.player_two.equals(wallet.publicKey)) {
            is_player_one = false;
        }

        let is_winner = false;

        if (active_game.status === GameStatus.completed) {
            if (is_player_one && active_game.player_one_status === ArenaStatus.alive) {
                is_winner = true;
            }
            if (!is_player_one && active_game.player_two_status === ArenaStatus.alive) {
                is_winner = true;
            }
        }

        let player_sent_encrypted_move = false;
        let opponent_sent_encrypted_move = false;
        let sum_player_one_encrypted_move = 0;
        let sum_player_two_encrypted_move = 0;

        for (let i in active_game.player_one_encrypted_move) {
            sum_player_one_encrypted_move += active_game.player_one_encrypted_move[i];
        }

        for (let i in active_game.player_two_encrypted_move) {
            sum_player_two_encrypted_move += active_game.player_two_encrypted_move[i];
        }

        if (active_game.player_one.equals(wallet.publicKey)) {
            player_sent_encrypted_move = sum_player_one_encrypted_move > 0;
            opponent_sent_encrypted_move = sum_player_two_encrypted_move > 0;
        }
        if (active_game.player_two.equals(wallet.publicKey)) {
            player_sent_encrypted_move = sum_player_two_encrypted_move > 0;
            opponent_sent_encrypted_move = sum_player_one_encrypted_move > 0;
        }

        //console.log("sum of encrypted data:", sum_player_one_encrypted_move, sum_player_two_encrypted_move);

        return (
            <>
                <Box width="100%" mb="3rem">
                    <VStack width="100%">
                        <HStack width="100%" mb="2%" mt="1%">
                            <Box width="10%"></Box>
                            <Box
                                style={{
                                    backgroundImage: `url(${hallway})`,
                                    backgroundPosition: "center",
                                    backgroundSize: "contain",
                                    backgroundRepeat: "no-repeat",
                                    imageRendering: "pixelated",
                                }}
                                width="80%"
                            >
                                <HStack>
                                    <Box width="30%"></Box>
                                    <Box width="15%">
                                        {" "}
                                        <DisplayPlayer
                                            player_character={active_game.player_one_character}
                                            player_status={active_game.player_one_status}
                                            is_player_one={true}
                                        />
                                    </Box>
                                    <Box width="10%"></Box>
                                    <Box width="15%" visibility={active_game.status === 0 ? "hidden" : "visible"}>
                                        {" "}
                                        <DisplayPlayer
                                            player_character={active_game.player_two_character}
                                            player_status={active_game.player_two_status}
                                            is_player_one={false}
                                        />{" "}
                                    </Box>
                                    <Box width="30%"></Box>
                                </HStack>
                            </Box>
                            <Box width="10%"></Box>
                        </HStack>
                    </VStack>

                    <Center width="100%" height="150px">
                        {(active_game.status === GameStatus.in_progress || active_game.status === GameStatus.draw) && (
                            <VStack width="100%" alignItems="center">
                                {active_game.status === GameStatus.draw && (
                                    <DrawText
                                        character_one={active_game.player_one_character}
                                        character_two={active_game.player_two_character}
                                        move={active_game.player_one_move}
                                    />
                                )}
                                {player_sent_encrypted_move !== opponent_sent_encrypted_move && !forfeit && (
                                    <Text className="font-face-sfpb" align="center" fontSize={ARENA_FONT_SIZE} color="white">
                                        {" "}
                                        It looks like one of our fighters is ready to go, but the other needs a bit more time. The crowd is
                                        getting impatient so let's hope there's some action soon!
                                    </Text>
                                )}
                                {!player_sent_encrypted_move && (
                                    <Text className="font-face-sfpb" align="center" fontSize={ARENA_FONT_SIZE} color="white">
                                        {" "}
                                        Choose your move
                                    </Text>
                                )}
                                {!player_sent_encrypted_move && (
                                    <Center width="100%">
                                        <ArenaButtons
                                            character={is_player_one ? active_game.player_one_character : active_game.player_two_character}
                                            forfeit={false}
                                        />
                                    </Center>
                                )}
                                {player_sent_encrypted_move && forfeit && (
                                    <VStack width="80%">
                                        <Text className="font-face-sfpb" align="center" fontSize={ARENA_FONT_SIZE} color="white">
                                            {" "}
                                            Your opponent is playing the pacifist, take them down!{" "}
                                        </Text>

                                        <Center width="100%">
                                            <ArenaButtons
                                                character={
                                                    is_player_one ? active_game.player_one_character : active_game.player_two_character
                                                }
                                                forfeit={true}
                                            />
                                        </Center>
                                        <Text className="font-face-sfpb" color="grey" fontSize="10px">
                                            You will land a killing blow, winning the game immediately.
                                        </Text>
                                    </VStack>
                                )}
                            </VStack>
                        )}
                        {active_game.status === GameStatus.in_reveal && (
                            <VStack width="80%">
                                <Text className="font-face-sfpb" align="center" fontSize={ARENA_FONT_SIZE} color="white">
                                    {" "}
                                    It looks like both our combatants are ready to go, show us what you've got!{" "}
                                </Text>

                                <Box
                                    as="button"
                                    onClick={
                                        processing_transaction
                                            ? () => {
                                                  console.log("already clicked");
                                              }
                                            : () => RevealMoveInGame()
                                    }
                                    borderWidth="2px"
                                    borderColor="white"
                                    width="100px"
                                >
                                    <Text className="font-face-sfpb" align="center" fontSize={ARENA_FONT_SIZE} color="white">
                                        {" "}
                                        Fight{" "}
                                    </Text>
                                </Box>
                            </VStack>
                        )}
                        {active_game.status === GameStatus.completed && is_winner && (
                            <VStack>
                                <GameOverText
                                    character_one={active_game.player_one_character}
                                    character_two={active_game.player_two_character}
                                    move_one={active_game.player_one_move}
                                    move_two={active_game.player_two_move}
                                    player_one_wins={active_game.player_one_status === ArenaStatus.alive}
                                />
                                <Text className="font-face-sfpb" align="center" fontSize={ARENA_FONT_SIZE} color="white">
                                    {" "}
                                    You are victorious!
                                </Text>

                                <Box
                                    as="button"
                                    onClick={
                                        processing_transaction
                                            ? () => {
                                                  console.log("already clicked");
                                              }
                                            : () => ClaimReward()
                                    }
                                    borderWidth="2px"
                                    borderColor="white"
                                    width="110px"
                                >
                                    <Text className="font-face-sfpb" align="center" fontSize={ARENA_FONT_SIZE} color="white">
                                        {" "}
                                        Claim Reward{" "}
                                    </Text>
                                </Box>
                            </VStack>
                        )}

                        {active_game.status === GameStatus.completed && !is_winner && (
                            <VStack width="100%">
                                <GameOverText
                                    character_one={active_game.player_one_character}
                                    character_two={active_game.player_two_character}
                                    move_one={active_game.player_one_move}
                                    move_two={active_game.player_two_move}
                                    player_one_wins={active_game.player_one_status === ArenaStatus.alive}
                                />

                                <Text className="font-face-sfpb" align="center" fontSize={ARENA_FONT_SIZE} color="white">
                                    {" "}
                                    You have been defeated{" "}
                                </Text>
                            </VStack>
                        )}

                        {active_game.status === GameStatus.waiting && (
                            <VStack>
                                {!player_sent_encrypted_move && (
                                    <WaitingForPlayerText
                                        player_character={active_game.player_one_character}
                                        game_id={bignum_to_num(active_game.game_id)}
                                    />
                                )}

                                {is_player_one && !player_sent_encrypted_move && (
                                    <Text className="font-face-sfpb" align="center" fontSize={ARENA_FONT_SIZE} color="white">
                                        {" "}
                                        Choose your move
                                    </Text>
                                )}
                                {is_player_one && !player_sent_encrypted_move && (
                                    <ArenaButtons character={active_game.player_one_character} forfeit={false} />
                                )}
                                {is_player_one && player_sent_encrypted_move && (
                                    <Text className="font-face-sfpb" align="center" fontSize={ARENA_FONT_SIZE} color="white">
                                        {" "}
                                        It looks like our first combatant is ready to go. The crowd is getting impatient so let's hope their
                                        opponent shows up soon!
                                    </Text>
                                )}
                            </VStack>
                        )}
                    </Center>
                </Box>
            </>
        );
    }

    function HowToPlay() {
        return (
            <>
                <Box width="80%">
                    <div className="font-face-sfpb" style={{ color: "white", fontSize: ARENA_FONT_SIZE }}>
                        <h2 className="mt-1  font-face-sfpb" style={{ fontSize: DEFAULT_FONT_SIZE }}>
                            How to play the Arena
                        </h2>
                        <br />

                        <ul>
                            <li>Connect your Solana Wallet. A dedicated burner wallet is recommended</li>
                            <li>Browse and join Open "Lobbies" or create a new lobby in "My Games"</li>
                            <li>
                                Select and confirm your attack (Rock, Paper, Scissors) within the time allotment [Fast = 2 minutes ; Slow =
                                24 hours]
                            </li>
                            <li>Reveal to resolve the combat turn</li>
                            <li>In the event of a Draw, submit a new attack and repeat</li>
                            <li>If your opponent misses their time, Execute them and claim the rewards</li>
                        </ul>
                    </div>
                </Box>
            </>
        );
    }

    return (
        <>
            <NewGameModal />
            <JoinGameModal />
            <VStack width="100%" alignItems="center" mb="10rem">
                <ActiveGame />
                {transaction_failed && (
                    <Box width="100%">
                        <div className="font-face-sfpb">
                            <Text fontSize={ARENA_FONT_SIZE} textAlign="center" color="red">
                                Transaction Failed. <br />
                                Please Try Again.
                            </Text>
                        </div>
                    </Box>
                )}
                <Container className="centered">
                    <Tabs
                        className="custom-tab justify-content-center"
                        activeKey={activeTab}
                        onSelect={(eventKey) => setActiveTab(eventKey)}
                    >
                        <Tab eventKey="my_games" title="MY GAMES" tabClassName="custom-tab">
                            <Center width="100%" marginBottom="5rem">
                                <VStack width="100%" alignItems="left">
                                    <ListNewGame />
                                    <MyGameTable />
                                </VStack>
                            </Center>
                        </Tab>

                        <Tab eventKey="game_list" title="LOBBIES" tabClassName="custom-tab justify-content-center">
                            <Center width="100%" marginBottom="5rem">
                                <VStack width="100%" alignItems="left">
                                    <Box as="button" borderWidth="2px" borderColor="white" width="200px" visibility="hidden">
                                        <div className="font-face-sfpb">
                                            <Text align="center" fontSize={ARENA_FONT_SIZE} color="white">
                                                Create New Game
                                            </Text>
                                        </div>
                                    </Box>
                                    <GameTable />
                                </VStack>
                            </Center>
                        </Tab>

                        <Tab eventKey="how_to_play" title="INSTRUCTIONS" tabClassName="custom-tab">
                            <Center width="100%" marginBottom="5rem">
                                <VStack width="100%" alignItems="left">
                                    <HowToPlay />
                                </VStack>
                            </Center>
                        </Tab>
                    </Tabs>
                </Container>
            </VStack>
        </>
    );
}
