import { isMobile } from "react-device-detect";
import { PublicKey } from "@solana/web3.js";

const DEV_RPC_NODE = "https://black-damp-river.solana-devnet.quiknode.pro/c5447e06dd58dec2f4568518d8fb2fd8625b1d95";
export const DEV_WSS_NODE = process.env.REACT_APP_DEVNET_WSS_URL;

const PROD_RPC_NODE = "https://practical-fragrant-wind.solana-mainnet.quiknode.pro/99ae430d9ebfdeba7c6dc64be19e93e2a5210e7a";
const PROD_WSS_NODE = "wss://practical-fragrant-wind.solana-mainnet.quiknode.pro/99ae430d9ebfdeba7c6dc64be19e93e2a5210e7a";

const PROD_TEST_WSS_NODE = process.env.REACT_APP_PROD_WSS_URL;
const PROD_TEST_RPC_NODE = process.env.REACT_APP_PROD_RPC_URL;

//pyth oracles
export const PYTH_BTC_DEV = new PublicKey("HovQMDrbAgAYPCmHVSrezcSmkMtXSSUsLDFANExrZh2J");
export const PYTH_ETH_DEV = new PublicKey("EdVCmQ9FSPcVe5YySXDPCRmc8aDQLKJ9xvYBMZPie1Vw");
export const PYTH_SOL_DEV = new PublicKey("J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix");

export const PYTH_BTC_PROD = new PublicKey("GVXRSBjFk6e6J3NbVPXohDJetcTjaeeuykUpbQF8UoMU");
export const PYTH_ETH_PROD = new PublicKey("JBu1AL4obBcCMqKBBxhpWCNUt136ijcuMZLFvTP7iWdB");
export const PYTH_SOL_PROD = new PublicKey("H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG");

export const METAPLEX_META = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
export const SHOP_PROGRAM = new PublicKey("9K7t9ssZvrRw7BHFDQoCoZcnP3QWhR8BcCfrgzE9Hrc3");
export const DUNGEON_PROGRAM = new PublicKey("FUjAo5wevsyS2jpe2XnkYN3SyQVbxAjoy8fuWrw3wjUk");
export const SYSTEM_KEY = new PublicKey("11111111111111111111111111111111");

export const FOUNDER_1_KEY = new PublicKey("2BLkynLAWGwW58SLDAnhwsoiAuVtzqyfHKA3W3MJFwEF");
export const FOUNDER_2_KEY = new PublicKey("7oAfRLy81EwMJAXNKbZFaMTayBFoBpkua4ukWiCZBZz5");

export const DM_PROGRAM = new PublicKey("A4uKsKkxnXfvMr7939uekGk52GiiepwGxi9qQHyWXxPJ");

export const MARKETPLACE_PROGRAM = new PublicKey("EQwTJXUcpLmY2zLe4vbgKEHhGJuhoFTNUYkjjAi2mgVx");
export const ARENA_PROGRAM = new PublicKey("3VhncqPFsFqfg5wPskJn1UsM9fYTcXJV2x7vDBQiVJc3");

export const LOOT_TOKEN_MINT = new PublicKey("FGXnWVQuc35M8XLG4egciVhZXqhy3XawbY2V8TpfHHag");

// account seeds
export const MAIN_ACCOUNT_SEED = "house_account";
export const DATA_ACCOUNT_SEED = "data_account";

// set font size
export var DEFAULT_FONT_SIZE = "30px";
export var DUNGEON_FONT_SIZE = "20px";
export var EMOJI_SIZE = 24;

if (isMobile) {
    DEFAULT_FONT_SIZE = "15px";
    DUNGEON_FONT_SIZE = "10px";
    EMOJI_SIZE = 20;
}

export const PROD = false;
export const TEST = true;
export const DEBUG = false;

export var network_string = "devnet";
export var RPC_NODE = DEV_RPC_NODE;
export var WSS_NODE = DEV_WSS_NODE;
if (PROD) {
    network_string = "mainnet";
    RPC_NODE = PROD_RPC_NODE;
    WSS_NODE = PROD_WSS_NODE;
}

if (TEST && PROD_TEST_WSS_NODE !== undefined && PROD_TEST_RPC_NODE !== undefined) {
    RPC_NODE = PROD_TEST_RPC_NODE;
    WSS_NODE = PROD_TEST_WSS_NODE;
}

export const enum Screen {
    HOME_SCREEN = 0,
    DUNGEON_SCREEN = 1,
    DEATH_SCREEN = 2,
    FAQ_SCREEN = 3,
    ODDS_SCREEN = 4,
    HELP_SCREEN = 5,
    SHOP_SCREEN = 6,
    DM_SCREEN = 7,
    ACHIEVEMENT_SCREEN = 8,
    STATS_SCREEN = 9,
    MARKETPLACE_SCREEN = 10,
    ARENA_SCREEN = 11,
}

export const enum KeyType {
    Bronze = 0,
    Silver = 1,
    Gold = 2,
    Unknown = 3,
}

export const levels: number[] = [
    0,
    100,
    220,
    364,
    537,
    745,
    996,
    1297,
    1660,
    2096,
    2620,
    3250,
    4008,
    4920,
    6016,
    7334,
    8918,
    10823,
    13113,
    15867,
    19178,
    23159,
    27945,
    33699,
    40617,
    48934,
    58934,
    70956,
    85410,
    102788
];
