import { useCallback, useEffect, useState, useRef } from "react";
import { Box, Button, HStack, Center, Text, VStack } from "@chakra-ui/react";
import { isMobile } from "react-device-detect";

import { PublicKey, Keypair, Transaction, TransactionInstruction } from "@solana/web3.js";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";

import {
    DUNGEON_FONT_SIZE,
    PROD,
    PYTH_BTC_DEV,
    PYTH_BTC_PROD,
    PYTH_ETH_DEV,
    PYTH_ETH_PROD,
    PYTH_SOL_DEV,
    PYTH_SOL_PROD,
    METAPLEX_META,
    SHOP_PROGRAM,
    DUNGEON_PROGRAM,
    SYSTEM_KEY,
    LOOT_TOKEN_MINT,
} from "./constants";

import bs58 from "bs58";

import {
    request_raw_account_data,
    request_shop_data,
    request_shop_user_data,
    serialise_basic_instruction,
    get_current_blockhash,
    send_transaction,
    request_token_amount,
    serialise_mint_from_collection_instruction,
    ShopData,
} from "./utils";

import { Metadata } from "@metaplex-foundation/mpl-token-metadata";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

// shop items
import key from "./images/Key.png";
import keyring from "./images/Keyring.gif";
import musicbox_collection from "./images/MusicBoxCollection.gif";
import lorepage_collection from "./images/LorePages.png";
import paintings_collection from "./images/Paintings.png";
import loot from "./images/loot.png";

import shop from "./images/ShopInside.gif";

// music boxes
import enter_the_dungeon_play from "./shop_items/EnterTheDungeon_Play.gif";
import dungeon_crawling_play from "./shop_items/DungeonCrawling_Play.gif";
import hack_n_slash_play from "./shop_items/HackNSlash_Play.gif";
import delving_deeper_play from "./shop_items/DelvingDeeper_Play.gif";

import enter_the_dungeon_pause from "./shop_items/EnterTheDungeon_Pause.gif";
import dungeon_crawling_pause from "./shop_items/DungeonCrawling_Pause.gif";
import hack_n_slash_pause from "./shop_items/HackNSlash_Pause.gif";
import delving_deeper_pause from "./shop_items/DelvingDeeper_Pause.gif";

import enter_the_dungeon_audio from "./sounds/Enter_the_Dungeon.mp3";
import dungeon_crawling_audio from "./sounds/Dungeon_Crawling.mp3";
import hack_n_slash_audio from "./sounds/Hack_n_Slash.mp3";
import delving_deeper_audio from "./sounds/Delving_Deeper.mp3";

// paintings
import tower_of_dur from "./shop_items/TowerOfDur.png";

import "./css/style.css";
import "./css/fonts.css";
import "./css/wallet.css";

const XP_WHITELIST_TOKEN = new PublicKey("9dyKcWs1eUJZtJmAU81giNiLmyty4qBLZZduRwQaGw5T");
const PREPAID_WHITELIST_TOKEN = new PublicKey("EdxJtFgnmt6iVtfQdEfQgfpS2WfUkRUywYP5YjFyu4nR");

const KEY_COLLECTION_MASTER = new PublicKey("7hxHyqBGX2BN2cDePWn1kXCsf6ADmkgYqAFRvU54CAYJ");
const KEY_COLLECTION_META = new PublicKey("HYBWDQeHR5P44621PT52thJbwTQBDsMGy8NwRbbK4xut");
const KEY_COLLECTION_MINT = new PublicKey("9C7CUp5aXDcg5QbSFVJwPeXviyFD4YK6CdQzp1jg7Lcp");

const MUSICBOX_COLLECTION_MASTER = new PublicKey("BvJ4QqRgs6qRAKvCSWdeMpYtJZckiwhgFu4NsJVSNm2F");
const MUSICBOX_COLLECTION_META = new PublicKey("5BqLuUX3ujSZuRV1dmbtWDsStTg755woj9pRjpBLmtJk");
const MUSICBOX_COLLECTION_MINT = new PublicKey("9wNxsyK7N4c5EiXkT2FmgYkQopGmBBmQKibtpo4eKVkA");

const PAINTINGS_COLLECTION_MASTER = new PublicKey("2bKFgSg8XQvwEXXKr3t9eRBTEJduUa7zMNRL611dZztP");
const PAINTINGS_COLLECTION_META = new PublicKey("AdsBbgrdpQoN1jgUgymXjMpbKqKVA1SkbJu5PC2bKAGT");
const PAINTINGS_COLLECTION_MINT = new PublicKey("2Za8pAqW26N57fx2ie5PEnjSBCEFu44icL6LS9YaVHBb");

const MusixBoxPlayButtons: string[] = [enter_the_dungeon_play, dungeon_crawling_play, hack_n_slash_play, delving_deeper_play];

const MusixBoxPauseButtons: string[] = [enter_the_dungeon_pause, dungeon_crawling_pause, hack_n_slash_pause, delving_deeper_pause];

const MusixBoxAudio: HTMLAudioElement[] = [
    new Audio(enter_the_dungeon_audio),
    new Audio(dungeon_crawling_audio),
    new Audio(hack_n_slash_audio),
    new Audio(delving_deeper_audio),
];

const enum ShopInstruction {
    init = 0,
    create_token = 1,
    create_achievement = 2,
    create_collection = 3,
    mint_from_collection = 4,
}

const enum CustomerStatus {
    unknown = 0,
    prepaid = 1,
    xp_whitelist = 2,
    other = 3,
}

const enum Collection {
    DungeonKeys = 0,
    Achievements = 1,
    MusicBoxes = 2,
    Paintings = 3,
    LorePages = 4,
    None = 5,
}

export function ShopScreen({
    num_xp,
    bearer_token,
    check_sol_balance,
}: {
    num_xp: number;
    bearer_token: string;
    check_sol_balance: React.MutableRefObject<boolean>;
}) {
    const wallet = useWallet();

    // state for the purchased item
    const [bought_item_mint, setBoughtItemMint] = useState<PublicKey | null>(null);
    const [bought_item_name, setBoughtItemName] = useState<string | null>(null);
    const [bought_item_description, setBoughtItemDescription] = useState<string | null>(null);
    const [bought_item_image, setBoughtItemImage] = useState<string | null>(null);
    const bought_item_collection = useRef<Collection>(Collection.None);

    const [collection_page, setCollectionPage] = useState<Collection>(Collection.None);

    const [current_loot, setCurrentLoot] = useState<number>(0);
    const [xp_req, setXPReq] = useState<number | null>(null);
    const [customer_status, setCustomerStatus] = useState<CustomerStatus>(CustomerStatus.unknown);
    const [shop_data, setShopData] = useState<ShopData | null>(null);

    //button processing
    const [processing_transaction, setProcessingTransaction] = useState<boolean>(false);

    // state to handle playing the music boxes
    const [play_music_box, setPlayMusicBox] = useState<boolean>(false);
    const current_music_box = useRef<HTMLAudioElement | null>(null);

    //number of keys this user has bought
    const user_num_keys = useRef<number>(-1);

    // the most recent key bought
    const current_key = useRef<PublicKey | null>(null);
    // interval for checking the key
    const key_interval = useRef<number | null>(null);

    // interval for updating shop state
    const xp_interval = useRef<number | null>(null);
    const check_xp = useRef<boolean>(true);

    const valid_shop_text = [
        "I see you've noticed my magnificent chest of keys.. Rummage around for something you like, i'm sure whatever you find will come in handy in your travels!",
        "I'm glad someone in this bleak world still recognizes quality merchandise when they see it! If it's another key you're after, go right ahead.",
        "Back again eh Adventurer? Well go ahead and see what else you can find in my chest of keys, third times a charm!",
    ];

    const invalid_shop_text = [
        "Sadly for you I only trade with more seasoned adventurers.",
        "It looks like the dungeon's been putting you through your paces, but if you want to buy more keys you're going to have to stay ahead of the competition.",
        "Back for more eh Adventurer? I'm sure these keys are proving their worth to you, but if you want to buy a third one you're going to have to do the same for me!",
    ];

    const check_xp_reqs = useCallback(async () => {
        if (!wallet.publicKey) return;

        if (!check_xp.current) return;

        let program_data_key = PublicKey.findProgramAddressSync([Buffer.from("data_account")], SHOP_PROGRAM)[0];
        let shop_data = await request_shop_data(bearer_token, program_data_key);

        //console.log("have shop data", shop_data);
        setShopData(shop_data);

        // get loot balance
        let loot_token_account = await getAssociatedTokenAddress(
            LOOT_TOKEN_MINT, // mint
            wallet.publicKey, // owner
            true // allow owner off curve
        );

        let loot_amount = await request_token_amount(bearer_token, loot_token_account);

        if (loot_amount > 0) {
            setCurrentLoot(loot_amount / 1.0e6);
        }

        let dungeon_key_data_account = PublicKey.findProgramAddressSync([wallet.publicKey.toBuffer()], SHOP_PROGRAM)[0];

        let user_data = await request_shop_user_data(bearer_token, dungeon_key_data_account);

        let user_keys_bought = 0;

        if (user_data !== null) {
            user_keys_bought = user_data.num_keys;
        }

        if (user_keys_bought <= user_num_keys.current) {
            check_xp.current = false;
            return;
        }

        user_num_keys.current = user_keys_bought;

        if (user_keys_bought >= 3) {
            setXPReq(-1);
            check_xp.current = false;
            setCustomerStatus(CustomerStatus.other);
            return;
        }

        // if the shop hasn't been set up yet just return
        if (shop_data === null) {
            check_xp.current = false;
            setCustomerStatus(CustomerStatus.other);
            return;
        }

        let total_keys_bought = shop_data.keys_bought;

        // if we have sold out there is nothing to sell
        if (total_keys_bought >= 2000) {
            setXPReq(-2);
            check_xp.current = false;
            setCustomerStatus(CustomerStatus.other);
            return;
        }

        //console.log("total keys bought: ", total_keys_bought);
        //console.log("user keys bought: ", user_keys_bought);

        let n_levels = 10.0;
        let total_keys = 3000.0;
        let keys_per_level = total_keys / n_levels;
        let current_level = Math.floor(total_keys_bought / keys_per_level);

        let base_xp = 100;
        let xp_cap_per_key = 500;
        var base_xp_req = base_xp + current_level * 50;

        //console.log("xp calc: ", n_levels, keys_per_level, current_level, base_xp_req);
        var total_xp_req = base_xp_req + user_keys_bought * 50;

        if (total_xp_req > xp_cap_per_key) {
            total_xp_req = xp_cap_per_key;
        }

        //console.log("total xp req ", total_xp_req);

        // check if they have any prepaid tokens
        let prepaid_whitelist_account_key = await getAssociatedTokenAddress(
            PREPAID_WHITELIST_TOKEN, // mint
            wallet.publicKey, // owner
            true // allow owner off curve
        );

        let token_amount = await request_token_amount(bearer_token, prepaid_whitelist_account_key);

        if (token_amount > 0) {
            setCustomerStatus(CustomerStatus.prepaid);
            setXPReq(total_xp_req);
            check_xp.current = false;
            return;
        }

        // if they dont have prepaid status then check for xp whitelist
        let xp_whitelist_account_key = await getAssociatedTokenAddress(
            XP_WHITELIST_TOKEN, // mint
            wallet.publicKey, // owner
            true // allow owner off curve
        );

        let xp_token_amount = await request_token_amount(bearer_token, xp_whitelist_account_key);

        if (xp_token_amount > 0) {
            setCustomerStatus(CustomerStatus.xp_whitelist);
            setXPReq(total_xp_req);
            check_xp.current = false;

            return;
        }

        setCustomerStatus(CustomerStatus.other);
        setXPReq(total_xp_req);
        check_xp.current = false;
    }, [wallet, user_num_keys, bearer_token]);

    const check_bought_item = useCallback(async () => {
        if (current_key.current === null) return;

        try {
            //console.log("request meta data");
            let raw_meta_data = await request_raw_account_data(bearer_token, current_key.current, "bought item");

            if (raw_meta_data === null) {
                return;
            }

            //console.log("deserialize meta data");
            let meta_data = Metadata.deserialize(raw_meta_data);

            //console.log(meta_data);
            let uri_json = await fetch(meta_data[0].data.uri).then((res) => res.json());

            setBoughtItemName(meta_data[0].data.name);
            setBoughtItemDescription(uri_json["description"]);
            setBoughtItemImage(uri_json["image"]);
            setBoughtItemMint(meta_data[0].mint);
            setProcessingTransaction(false);

            current_key.current = null;
            check_xp.current = true;
        } catch (error) {
            console.log(error);
            return;
        }
    }, [bearer_token]);

    // interval for checking key
    useEffect(() => {
        if (key_interval.current === null) {
            key_interval.current = window.setInterval(check_bought_item, 1000);
        } else {
            window.clearInterval(key_interval.current);
            key_interval.current = null;
        }
        // here's the cleanup function
        return () => {
            if (key_interval.current !== null) {
                window.clearInterval(key_interval.current);
                key_interval.current = null;
            }
        };
    }, [check_bought_item]);

    // interval for checking xp
    useEffect(() => {
        if (xp_interval.current === null) {
            xp_interval.current = window.setInterval(check_xp_reqs, 1000);
        } else {
            window.clearInterval(xp_interval.current);
            xp_interval.current = null;
        }
        // here's the cleanup function
        return () => {
            if (xp_interval.current !== null) {
                window.clearInterval(xp_interval.current);
                xp_interval.current = null;
            }
        };
    }, [check_xp_reqs]);

    useEffect(() => {
        user_num_keys.current = -1;
        check_xp.current = true;
        setXPReq(null);
    }, [wallet]);

    useEffect(() => {
        check_xp.current = true;
    }, []);

    const MintFromCollection = useCallback(
        async (which_collection: number, which_from_collection: number) => {
            setBoughtItemName(null);
            setBoughtItemDescription(null);
            setBoughtItemImage(null);

            if (wallet.publicKey === null || wallet.signTransaction === undefined) return;

            const nft_mint_keypair = Keypair.generate();
            var nft_mint_pubkey = nft_mint_keypair.publicKey;

            let collection_data_key;
            if (which_collection === Collection.MusicBoxes) {
                collection_data_key = PublicKey.findProgramAddressSync([Buffer.from("music_boxes")], SHOP_PROGRAM)[0];
            } else if (which_collection === Collection.Paintings) {
                collection_data_key = PublicKey.findProgramAddressSync([Buffer.from("paintings")], SHOP_PROGRAM)[0];
            } else {
                return;
            }

            let shop_data_key = PublicKey.findProgramAddressSync([Buffer.from("data_account")], SHOP_PROGRAM)[0];

            let nft_meta_key = PublicKey.findProgramAddressSync(
                [Buffer.from("metadata"), METAPLEX_META.toBuffer(), nft_mint_pubkey.toBuffer()],
                METAPLEX_META
            )[0];

            let nft_master_key = PublicKey.findProgramAddressSync(
                [Buffer.from("metadata"), METAPLEX_META.toBuffer(), nft_mint_pubkey.toBuffer(), Buffer.from("edition")],
                METAPLEX_META
            )[0];

            let nft_account_key = await getAssociatedTokenAddress(
                nft_mint_pubkey, // mint
                wallet.publicKey, // owner
                true // allow owner off curve
            );

            let loot_token_account = await getAssociatedTokenAddress(
                LOOT_TOKEN_MINT, // mint
                wallet.publicKey, // owner
                true // allow owner off curve
            );

            let player_data_key = PublicKey.findProgramAddressSync([wallet.publicKey.toBytes()], DUNGEON_PROGRAM)[0];

            const create_token_data = serialise_mint_from_collection_instruction(
                ShopInstruction.mint_from_collection,
                which_collection,
                which_from_collection
            );
            const init_data = serialise_basic_instruction(ShopInstruction.init);

            var account_vector = [
                { pubkey: wallet.publicKey, isSigner: true, isWritable: true },

                { pubkey: nft_mint_pubkey, isSigner: true, isWritable: true },
                { pubkey: nft_account_key, isSigner: false, isWritable: true },
                { pubkey: nft_meta_key, isSigner: false, isWritable: true },
                { pubkey: nft_master_key, isSigner: false, isWritable: true },

                { pubkey: player_data_key, isSigner: false, isWritable: true },
                { pubkey: collection_data_key, isSigner: false, isWritable: true },
                { pubkey: shop_data_key, isSigner: false, isWritable: true },
            ];

            if (which_collection === Collection.MusicBoxes) {
                account_vector.push({ pubkey: MUSICBOX_COLLECTION_MINT, isSigner: false, isWritable: true });
                account_vector.push({ pubkey: MUSICBOX_COLLECTION_META, isSigner: false, isWritable: true });
                account_vector.push({ pubkey: MUSICBOX_COLLECTION_MASTER, isSigner: false, isWritable: true });
            }

            if (which_collection === Collection.Paintings) {
                account_vector.push({ pubkey: PAINTINGS_COLLECTION_MINT, isSigner: false, isWritable: true });
                account_vector.push({ pubkey: PAINTINGS_COLLECTION_META, isSigner: false, isWritable: true });
                account_vector.push({ pubkey: PAINTINGS_COLLECTION_MASTER, isSigner: false, isWritable: true });
            }

            account_vector.push({ pubkey: LOOT_TOKEN_MINT, isSigner: false, isWritable: true });
            account_vector.push({ pubkey: loot_token_account, isSigner: false, isWritable: true });

            account_vector.push({ pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false });
            account_vector.push({ pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false });
            account_vector.push({ pubkey: SYSTEM_KEY, isSigner: false, isWritable: true });
            account_vector.push({ pubkey: METAPLEX_META, isSigner: false, isWritable: false });

            const create_token_instruction = new TransactionInstruction({
                keys: account_vector,
                programId: SHOP_PROGRAM,
                data: create_token_data,
            });

            const init_instruction = new TransactionInstruction({
                keys: [
                    { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
                    { pubkey: shop_data_key, isSigner: false, isWritable: true },
                    { pubkey: SYSTEM_KEY, isSigner: false, isWritable: true },
                ],
                programId: SHOP_PROGRAM,
                data: init_data,
            });

            let txArgs = await get_current_blockhash(bearer_token);
            let transaction = new Transaction(txArgs);
            transaction.feePayer = wallet.publicKey;

            transaction.add(create_token_instruction);
            transaction.add(init_instruction);

            transaction.partialSign(nft_mint_keypair);

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

            bought_item_collection.current = which_collection;
            setProcessingTransaction(true);
            current_key.current = nft_meta_key;
            check_sol_balance.current = true;

            return;
        },
        [wallet, bearer_token, check_sol_balance]
    );

    const MintKey = useCallback(async () => {
        if (wallet.publicKey === null || wallet.signTransaction === undefined) return;

        setBoughtItemName(null);
        setBoughtItemDescription(null);
        setBoughtItemImage(null);

        const nft_mint_keypair = Keypair.generate();
        var nft_mint_pubkey = nft_mint_keypair.publicKey;

        let shop_data_key = PublicKey.findProgramAddressSync([Buffer.from("data_account")], SHOP_PROGRAM)[0];
        let dungeon_key_data_account = PublicKey.findProgramAddressSync([wallet.publicKey.toBuffer()], SHOP_PROGRAM)[0];
        let dungeon_key_meta_account = PublicKey.findProgramAddressSync(
            [Buffer.from("key_meta"), nft_mint_pubkey.toBuffer()],
            SHOP_PROGRAM
        )[0];

        let nft_meta_key = PublicKey.findProgramAddressSync(
            [Buffer.from("metadata"), METAPLEX_META.toBuffer(), nft_mint_pubkey.toBuffer()],
            METAPLEX_META
        )[0];

        let nft_master_key = PublicKey.findProgramAddressSync(
            [Buffer.from("metadata"), METAPLEX_META.toBuffer(), nft_mint_pubkey.toBuffer(), Buffer.from("edition")],
            METAPLEX_META
        )[0];

        let nft_account_key = await getAssociatedTokenAddress(
            nft_mint_pubkey, // mint
            wallet.publicKey, // owner
            true // allow owner off curve
        );

        let xp_whitelist_account_key = await getAssociatedTokenAddress(
            XP_WHITELIST_TOKEN, // mint
            wallet.publicKey, // owner
            true // allow owner off curve
        );

        let prepaid_whitelist_account_key = await getAssociatedTokenAddress(
            PREPAID_WHITELIST_TOKEN, // mint
            wallet.publicKey, // owner
            true // allow owner off curve
        );

        let player_data_key = PublicKey.findProgramAddressSync([wallet.publicKey.toBytes()], DUNGEON_PROGRAM)[0];

        const create_token_data = serialise_basic_instruction(ShopInstruction.create_token);
        const init_data = serialise_basic_instruction(ShopInstruction.init);

        var account_vector = [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },

            { pubkey: nft_mint_pubkey, isSigner: true, isWritable: true },
            { pubkey: nft_account_key, isSigner: false, isWritable: true },
            { pubkey: nft_meta_key, isSigner: false, isWritable: true },
            { pubkey: nft_master_key, isSigner: false, isWritable: true },

            { pubkey: player_data_key, isSigner: false, isWritable: true },
            { pubkey: dungeon_key_data_account, isSigner: false, isWritable: true },
            { pubkey: shop_data_key, isSigner: false, isWritable: true },
            { pubkey: dungeon_key_meta_account, isSigner: false, isWritable: true },
        ];

        account_vector.push({ pubkey: KEY_COLLECTION_MINT, isSigner: false, isWritable: true });
        account_vector.push({ pubkey: KEY_COLLECTION_META, isSigner: false, isWritable: true });
        account_vector.push({ pubkey: KEY_COLLECTION_MASTER, isSigner: false, isWritable: true });

        if (PROD) {
            account_vector.push({ pubkey: PYTH_BTC_PROD, isSigner: false, isWritable: false });
            account_vector.push({ pubkey: PYTH_ETH_PROD, isSigner: false, isWritable: false });
            account_vector.push({ pubkey: PYTH_SOL_PROD, isSigner: false, isWritable: false });
        } else {
            account_vector.push({ pubkey: PYTH_BTC_DEV, isSigner: false, isWritable: false });
            account_vector.push({ pubkey: PYTH_ETH_DEV, isSigner: false, isWritable: false });
            account_vector.push({ pubkey: PYTH_SOL_DEV, isSigner: false, isWritable: false });
        }

        account_vector.push({ pubkey: XP_WHITELIST_TOKEN, isSigner: false, isWritable: true });
        account_vector.push({ pubkey: xp_whitelist_account_key, isSigner: false, isWritable: true });

        account_vector.push({ pubkey: PREPAID_WHITELIST_TOKEN, isSigner: false, isWritable: true });
        account_vector.push({ pubkey: prepaid_whitelist_account_key, isSigner: false, isWritable: true });

        account_vector.push({ pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false });
        account_vector.push({ pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false });
        account_vector.push({ pubkey: SYSTEM_KEY, isSigner: false, isWritable: true });
        account_vector.push({ pubkey: METAPLEX_META, isSigner: false, isWritable: false });

        const create_token_instruction = new TransactionInstruction({
            keys: account_vector,
            programId: SHOP_PROGRAM,
            data: create_token_data,
        });

        const init_instruction = new TransactionInstruction({
            keys: [
                { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
                { pubkey: shop_data_key, isSigner: false, isWritable: true },
                { pubkey: SYSTEM_KEY, isSigner: false, isWritable: true },
            ],
            programId: SHOP_PROGRAM,
            data: init_data,
        });

        let txArgs = await get_current_blockhash(bearer_token);
        let transaction = new Transaction(txArgs);
        transaction.feePayer = wallet.publicKey;

        transaction.add(create_token_instruction);
        transaction.add(init_instruction);

        transaction.partialSign(nft_mint_keypair);

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

        current_key.current = nft_meta_key;
        check_xp.current = true;
        check_sol_balance.current = true;

        return;
    }, [wallet, bearer_token, check_sol_balance]);

    const KeyText = (): JSX.Element | null => {
        if (customer_status === CustomerStatus.prepaid) {
            return (
                <Center width="100%">
                    <VStack alignItems="center" width="100%">
                        <Box width="80%">
                            <div className="font-face-sfpb">
                                <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">
                                    That's a shiny little trinket you have there... Tell you what, how about I trade you for one of my
                                    Dungeon Keys?
                                </Text>
                            </div>
                        </Box>

                        <HStack alignItems="center">
                            <Box width="15%">
                                {" "}
                                <img style={{ imageRendering: "pixelated" }} src={key} width="100" alt={""} />
                            </Box>

                            <Button variant="link" size="lg" onClick={MintKey}>
                                <div className="font-face-sfpb">
                                    <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">
                                        {" "}
                                        Buy Key (1 Shiny Trinket){" "}
                                    </Text>
                                </div>
                            </Button>
                        </HStack>
                    </VStack>
                </Center>
            );
        }

        if (xp_req === -1) {
            return (
                <Center width="100%">
                    <Box width="80%">
                        <div className="font-face-sfpb">
                            <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">
                                I'm afraid you've had your fair share of keys from me. You'll need to find someone else to trade with if you
                                want more.
                            </Text>
                        </div>
                    </Box>
                </Center>
            );
        }

        if (customer_status === CustomerStatus.xp_whitelist || (xp_req !== null && num_xp !== null && xp_req > 0 && num_xp >= xp_req)) {
            return (
                <Center width="100%">
                    <VStack alignItems="center" width="100%">
                        <Box width="80%">
                            <div className="font-face-sfpb">
                                <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">
                                    {valid_shop_text[user_num_keys.current]}
                                </Text>
                            </div>
                        </Box>

                        <HStack alignItems="center">
                            <Box width="15%">
                                {" "}
                                <img style={{ imageRendering: "pixelated" }} src={key} width="100" alt={""} />
                            </Box>

                            <Button variant="link" size="lg" onClick={MintKey}>
                                <div className="font-face-sfpb">
                                    <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">
                                        {" "}
                                        Buy Key (1.5 SOL){" "}
                                    </Text>
                                </div>
                            </Button>
                        </HStack>
                    </VStack>
                </Center>
            );
        }

        return (
            <Center width="100%">
                <Box width="80%">
                    <div className="font-face-sfpb">
                        <>
                            {xp_req !== null && num_xp !== null && xp_req > 0 && num_xp < xp_req && (
                                <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">
                                    {" "}
                                    {invalid_shop_text[user_num_keys.current]} Come back when you have {xp_req} XP
                                </Text>
                            )}
                            {xp_req === -2 && (
                                <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">
                                    If you're here looking for keys i'm afraid you're a bit late! There's been a rush of adventurers like
                                    you over the past days and i'm all sold out.
                                </Text>
                            )}
                        </>
                    </div>
                </Box>
            </Center>
        );
    };

    const MusicTextButton = ({ which_box }: { which_box: number }): JSX.Element | null => {

        if (!MusixBoxAudio[which_box].paused) {
            return (
                <Box
                    as="button"
                    onClick={() => {
                        MusixBoxAudio[which_box].pause();
                        setPlayMusicBox(!play_music_box);
                        //current_music_box.current = null;
                    }}
                >
                    <img style={{ imageRendering: "pixelated" }} src={MusixBoxPauseButtons[which_box]} width="150" alt={""} />
                </Box>
            );
        }

        return (
            <Box
                as="button"
                onClick={() => {
                    MusixBoxAudio[which_box].pause();
                    current_music_box.current = MusixBoxAudio[which_box];
                    MusixBoxAudio[which_box].play();
                    setPlayMusicBox(!play_music_box);
                }}
            >
                <img style={{ imageRendering: "pixelated" }} src={MusixBoxPlayButtons[which_box]} width="150" alt={""} />
            </Box>
        );
    };

    const MusicText = (): JSX.Element | null => {
        return (
            <Center width="100%">
                <Box width="80%">
                    <Text className="font-face-sfpb" fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white" mb="1rem">
                        These are music boxes from across the land of Limare. Each one plays its own special tune.{" "}
                    </Text>
                    <Center>
                        <HStack>
                            <VStack>
                                <MusicTextButton which_box={0} />
                                <Box
                                    as="button"
                                    disabled={num_xp < 1100 || processing_transaction ? true : false}
                                    onClick={() => {
                                        MintFromCollection(Collection.MusicBoxes, 0);
                                    }}
                                >
                                    <Text className="font-face-sfpb" color="grey" fontSize="10px">
                                        01 - Enter The Dungeon
                                    </Text>
                                    <Text className="font-face-sfpb" color="grey" fontSize="10px">
                                        Remaining: {shop_data === null ? " " : 250 - shop_data.music_boxes_bought[0]}
                                    </Text>
                                    <Text className="font-face-sfpb" color="grey" fontSize="10px">
                                        {num_xp < 1100 ? "1100 XP required" : "1000 Gold"}{" "}
                                    </Text>
                                </Box>
                            </VStack>

                            <VStack>
                                <MusicTextButton which_box={1} />

                                <Box
                                    as="button"
                                    disabled={num_xp < 2500 || processing_transaction ? true : false}
                                    onClick={() => {
                                        MintFromCollection(Collection.MusicBoxes, 1);
                                    }}
                                >
                                    <Text className="font-face-sfpb" color="grey" fontSize="10px">
                                        02 - Dungeon Crawling
                                    </Text>
                                    <Text className="font-face-sfpb" color="grey" fontSize="10px">
                                        Remaining: {shop_data === null ? " " : 250 - shop_data.music_boxes_bought[1]}
                                    </Text>
                                    <Text className="font-face-sfpb" color="grey" fontSize="10px">
                                        {num_xp < 2500 ? "2500 XP required" : "1000 Gold"}{" "}
                                    </Text>
                                </Box>
                            </VStack>

                            <VStack>
                                <MusicTextButton which_box={2} />

                                <Box
                                    as="button"
                                    disabled={num_xp < 4500 || processing_transaction ? true : false}
                                    onClick={() => {
                                        MintFromCollection(Collection.MusicBoxes, 2);
                                    }}
                                >
                                    <Text className="font-face-sfpb" color="grey" fontSize="10px">
                                        03 - Hack n' Slash
                                    </Text>
                                    <Text className="font-face-sfpb" color="grey" fontSize="10px">
                                        Remaining: {shop_data === null ? " " : 250 - shop_data.music_boxes_bought[2]}
                                    </Text>
                                    <Text className="font-face-sfpb" color="grey" fontSize="10px">
                                        {num_xp < 4500 ? "4500 XP required" : "1000 Gold"}{" "}
                                    </Text>
                                </Box>
                            </VStack>

                            <VStack>
                                <MusicTextButton which_box={3} />

                                <Box
                                    as="button"
                                    disabled={num_xp < 7000 || processing_transaction ? true : false}
                                    onClick={() => {
                                        MintFromCollection(Collection.MusicBoxes, 3);
                                    }}
                                >
                                    <Text className="font-face-sfpb" color="grey" fontSize="10px">
                                        04 - Delving Deeper
                                    </Text>
                                    <Text className="font-face-sfpb" color="grey" fontSize="10px">
                                        Remaining: {shop_data === null ? " " : 250 - shop_data.music_boxes_bought[3]}
                                    </Text>
                                    <Text className="font-face-sfpb" color="grey" fontSize="10px">
                                        {num_xp < 7000 ? "7000 XP required" : "1000 Gold"}{" "}
                                    </Text>
                                </Box>
                            </VStack>
                        </HStack>
                    </Center>
                </Box>
            </Center>
        );
    };
    const LoreText = (): JSX.Element | null => {
        return (
            <Center width="100%">
                <Box width="80%">
                    <div className="font-face-sfpb">
                        <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">
                            Unfortunately my contact at the Great Library was attacked by bandits recently... Hopefully these will be back
                            in stock soon{" "}
                        </Text>
                    </div>
                </Box>
            </Center>
        );
    };
    const PaintingText = (): JSX.Element | null => {
        return (
            <Center width="100%">
                <Box width="80%">
                    <Text className="font-face-sfpb" fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white" mb="1rem">
                        Paintings drawn by a traveling artist I know well. Each displays a landmark vista or personality from the land of
                        Limare.
                    </Text>

                    <VStack>
                        <img style={{ imageRendering: "pixelated" }} src={tower_of_dur} width="150" alt={""} />
                        <Box
                            as="button"
                            disabled={num_xp < 2000 || processing_transaction ? true : false}
                            onClick={() => {
                                MintFromCollection(Collection.Paintings, 0);
                            }}
                        >
                            <Text className="font-face-sfpb" color="grey" fontSize="10px">
                                01 - Tower of Dur
                            </Text>
                            <Text className="font-face-sfpb" color="grey" fontSize="10px">
                                Remaining: {shop_data === null ? " " : 250 - shop_data.paintings_bought[0]}
                            </Text>
                            <Text className="font-face-sfpb" color="grey" fontSize="10px">
                                {num_xp < 2000 ? "2000 XP required" : "2000 Gold"}{" "}
                            </Text>
                        </Box>
                    </VStack>
                </Box>
            </Center>
        );
    };

    const ShopText = (): JSX.Element | null => {
        if (collection_page === Collection.None) {
            return (
                <Center width="100%">
                    <Box width="80%">
                        <div className="font-face-sfpb">
                            <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">
                                Welcome Adventurer! Take your time and look around, i'm sure you'll find something of interest in here
                            </Text>
                        </div>
                    </Box>
                </Center>
            );
        }

        if (collection_page === Collection.DungeonKeys) {
            return <KeyText />;
        }

        if (collection_page === Collection.MusicBoxes) {
            return <MusicText />;
        }

        if (collection_page === Collection.Paintings) {
            return <PaintingText />;
        }

        if (collection_page === Collection.LorePages) {
            return <LoreText />;
        }

        return null;
    };

    const DisplayBoughtItem = (): JSX.Element | null => {
        if (bought_item_collection.current === Collection.None || bought_item_collection.current !== collection_page) {
            return <></>;
        }

        if (bought_item_name === null || bought_item_image === null || bought_item_mint === null) {
            return <></>;
        }

        if (bought_item_collection.current === Collection.DungeonKeys) {
            return (
                <VStack spacing="3%" alignItems="center">
                    <HStack alignItems="center">
                        <Box width="15%">
                            <img style={{ imageRendering: "pixelated" }} src={bought_item_image} width="100" alt={""} />
                        </Box>

                        <div className="font-face-sfpb">
                            <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">
                                You have found {bought_item_name?.slice(0, 17)}!{" "}
                            </Text>
                        </div>
                    </HStack>
                    <Center>
                        <Box width="100%">
                            <div className="font-face-sfpb">
                                <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">
                                    {bought_item_description} View it{" "}
                                    <a
                                        className="one"
                                        target="_blank"
                                        rel="noreferrer"
                                        href={"https://explorer.solana.com/address/" + bought_item_mint.toString()}
                                    >
                                        here
                                    </a>
                                </Text>
                            </div>
                        </Box>
                    </Center>
                </VStack>
            );
        }

        return (
            <VStack spacing="3%" alignItems="center">
                <div className="font-face-sfpb">
                    <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">
                        Item Purchased!
                    </Text>
                </div>
                <Center>
                    <Box width="100%">
                        <div className="font-face-sfpb">
                            <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">
                                View it{" "}
                                <a
                                    className="one"
                                    target="_blank"
                                    rel="noreferrer"
                                    href={"https://explorer.solana.com/address/" + bought_item_mint.toString()}
                                >
                                    here
                                </a>
                            </Text>
                        </div>
                    </Box>
                </Center>
            </VStack>
        );
    };

    let item_image_size = isMobile ? "80" : "100";
    return (
        <VStack alignItems="center" mb="10rem" width="100%">
            <Box width="100%">
                <HStack>
                    <Box width="55%"></Box>
                    <Box width="25%">
                        <HStack alignItems="center" width="100%">
                            <Text className="font-face-sfpb" fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">
                                {current_loot.toFixed(2)}
                            </Text>
                            <img
                                src={loot}
                                width="auto"
                                alt={""}
                                style={{ marginBottom: "5px", maxHeight: DUNGEON_FONT_SIZE, maxWidth: DUNGEON_FONT_SIZE }}
                            />
                            <Text className="font-face-sfpb" fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">
                                XP {num_xp}
                            </Text>
                        </HStack>
                    </Box>
                    <Box width="20%"></Box>
                </HStack>
            </Box>

            <Box width="100%">
                <Center width="100%">
                    <VStack width="100%" alignItems="center" spacing="2%">
                        <img style={{ imageRendering: "pixelated" }} src={shop} width={isMobile ? "550" : "600"} alt={""} />

                        <HStack width="500" spacing="1rem" alignItems="center">
                            <VStack width="25%" alignItems="center">
                                <Box
                                    as="button"
                                    onClick={() => {
                                        setCollectionPage(Collection.DungeonKeys);
                                    }}
                                >
                                    <img style={{ imageRendering: "pixelated" }} src={keyring} width={item_image_size} alt={""} />
                                </Box>
                                <Text className="font-face-sfpb" color="grey" fontSize="10px">
                                    Keys
                                </Text>
                            </VStack>

                            <VStack width="25%" alignItems="center">
                                <Box
                                    as="button"
                                    onClick={() => {
                                        setCollectionPage(Collection.LorePages);
                                    }}
                                >
                                    <img
                                        style={{ imageRendering: "pixelated" }}
                                        src={lorepage_collection}
                                        width={item_image_size}
                                        alt={""}
                                    />
                                </Box>
                                <Text className="font-face-sfpb" color="grey" fontSize="10px">
                                    Lore Pages
                                </Text>
                            </VStack>

                            <VStack width="25%">
                                <Box
                                    as="button"
                                    onClick={() => {
                                        setCollectionPage(Collection.MusicBoxes);
                                    }}
                                >
                                    <img
                                        style={{ imageRendering: "pixelated" }}
                                        src={musicbox_collection}
                                        width={item_image_size}
                                        alt={""}
                                    />
                                </Box>
                                <Text className="font-face-sfpb" color="grey" fontSize="10px">
                                    Music Boxes
                                </Text>
                            </VStack>

                            <VStack width="25%">
                                <Box
                                    as="button"
                                    onClick={() => {
                                        setCollectionPage(Collection.Paintings);
                                    }}
                                >
                                    <img
                                        style={{ imageRendering: "pixelated" }}
                                        src={paintings_collection}
                                        width={item_image_size}
                                        alt={""}
                                    />
                                </Box>
                                <Text className="font-face-sfpb" color="grey" fontSize="10px">
                                    Paintings
                                </Text>
                            </VStack>
                        </HStack>

                        {!wallet.publicKey && (
                            <>
                                <div className="font-face-sfpb">
                                    <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">
                                        Welcome Stranger! Connect your wallet below so we can do business.
                                    </Text>
                                </div>

                                {!isMobile && (
                                    <div className="font-face-sfpb">
                                        <WalletMultiButton className="wallet-button">CONNECT WALLET</WalletMultiButton>
                                    </div>
                                )}
                                {isMobile && (
                                    <div className="font-face-sfpb">
                                        <WalletMultiButton className="mobile-wallet-button">CONNECT WALLET</WalletMultiButton>
                                    </div>
                                )}
                            </>
                        )}

                        {wallet.publicKey && (
                            <>
                                <ShopText />
                            </>
                        )}

                        <DisplayBoughtItem />
                    </VStack>
                </Center>
            </Box>
        </VStack>
    );
}
