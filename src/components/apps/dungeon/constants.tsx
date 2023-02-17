import { isMobile } from "react-device-detect";
import { PublicKey} from '@solana/web3.js';

//pyth oracles
export const PYTH_BTC_DEV = new PublicKey('HovQMDrbAgAYPCmHVSrezcSmkMtXSSUsLDFANExrZh2J');   
export const PYTH_ETH_DEV = new PublicKey('EdVCmQ9FSPcVe5YySXDPCRmc8aDQLKJ9xvYBMZPie1Vw');   
export const PYTH_SOL_DEV = new PublicKey('J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix');  

export const PYTH_BTC_PROD = new PublicKey('GVXRSBjFk6e6J3NbVPXohDJetcTjaeeuykUpbQF8UoMU');   
export const PYTH_ETH_PROD = new PublicKey('JBu1AL4obBcCMqKBBxhpWCNUt136ijcuMZLFvTP7iWdB');   
export const PYTH_SOL_PROD = new PublicKey('H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG');

export const METAPLEX_META = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
export const SHOP_PROGRAM = new PublicKey("61Lmx2t4g2JDf8n1xmjF94H6Q9Vm2bqYj39ELKMjaST5");
export const DUNGEON_PROGRAM = new PublicKey('FUjAo5wevsyS2jpe2XnkYN3SyQVbxAjoy8fuWrw3wjUk');
export const SYSTEM_KEY = new PublicKey("11111111111111111111111111111111");


// set font size
export var DEFAULT_FONT_SIZE = "30px"
export var DUNGEON_FONT_SIZE = "20px"

if (isMobile) {
    DEFAULT_FONT_SIZE = "15px"
    DUNGEON_FONT_SIZE = "10px"
}

export const PROD = true;
export const DEBUG = true;

export var network_string = "devnet";
if (PROD) {
    network_string = "mainnet"
}

export const enum Screen {
    HOME_SCREEN = 0,
    DUNGEON_SCREEN = 1,
    DEATH_SCREEN = 2,
    FAQ_SCREEN = 3,
    ODDS_SCREEN = 4,
    HELP_SCREEN = 5,
    SHOP_SCREEN = 6
}

export const BET_SIZE = 0.05;

