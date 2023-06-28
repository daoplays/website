import { Keypair, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import bs58 from "bs58";

//  dungeon constants
import {
    PROD,
    PYTH_BTC_DEV,
    PYTH_BTC_PROD,
    PYTH_ETH_DEV,
    PYTH_ETH_PROD,
    PYTH_SOL_DEV,
    PYTH_SOL_PROD,
    DUNGEON_PROGRAM,
    SYSTEM_KEY,
    DM_PROGRAM,
    MAIN_ACCOUNT_SEED,
    DATA_ACCOUNT_SEED,
    LOOT_TOKEN_MINT,
} from "../constants";

// dungeon utils
import { serialise_play_instruction, get_current_blockhash, send_transaction, serialise_quit_instruction } from "../utils";

import { DungeonInstruction } from "../dungeon_state";

// free play mint
const FREE_PLAY_MINT = new PublicKey("4JxGUVRp6CRffKpbtnSCZ4Z5dHqUWMZSxMuvFd7fG3nC");

const ACHIEVEMENT_SEED = "achievements_s1";

export async function Play(bearer_token: string, keypair: Keypair, instruction_json: any) {
    let program_data_key = PublicKey.findProgramAddressSync([Buffer.from(MAIN_ACCOUNT_SEED)], DUNGEON_PROGRAM)[0];
    let player_data_key = PublicKey.findProgramAddressSync([keypair.publicKey.toBytes()], DUNGEON_PROGRAM)[0];
    let player_achievement_key = PublicKey.findProgramAddressSync(
        [keypair.publicKey.toBytes(), Buffer.from(ACHIEVEMENT_SEED)],
        DUNGEON_PROGRAM,
    )[0];

    let loot_token_account = await getAssociatedTokenAddress(
        LOOT_TOKEN_MINT, // mint
        keypair.publicKey, // owner
        true, // allow owner off curve
    );

    let dm_data_key = PublicKey.findProgramAddressSync([Buffer.from("data_account")], DM_PROGRAM)[0];

    const instruction_data = serialise_play_instruction(DungeonInstruction.play, instruction_json["character"], 0);

    var account_vector = [
        { pubkey: keypair.publicKey, isSigner: true, isWritable: true },
        { pubkey: player_data_key, isSigner: false, isWritable: true },
        { pubkey: player_achievement_key, isSigner: false, isWritable: true },
        { pubkey: LOOT_TOKEN_MINT, isSigner: false, isWritable: true },
        { pubkey: loot_token_account, isSigner: false, isWritable: true },
    ];

    if (PROD) {
        account_vector.push({ pubkey: PYTH_BTC_PROD, isSigner: false, isWritable: false });
        account_vector.push({ pubkey: PYTH_ETH_PROD, isSigner: false, isWritable: false });
        account_vector.push({ pubkey: PYTH_SOL_PROD, isSigner: false, isWritable: false });
    } else {
        account_vector.push({ pubkey: PYTH_BTC_DEV, isSigner: false, isWritable: false });
        account_vector.push({ pubkey: PYTH_ETH_DEV, isSigner: false, isWritable: false });
        account_vector.push({ pubkey: PYTH_SOL_DEV, isSigner: false, isWritable: false });
    }

    account_vector.push({ pubkey: program_data_key, isSigner: false, isWritable: true });
    account_vector.push({ pubkey: SYSTEM_KEY, isSigner: false, isWritable: false });

    // next 3 accounts are for the free play tokens
    account_vector.push({ pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false });
    account_vector.push({ pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false });

    account_vector.push({ pubkey: FREE_PLAY_MINT, isSigner: false, isWritable: true });

    let free_play_token_account = await getAssociatedTokenAddress(
        FREE_PLAY_MINT, // mint
        keypair.publicKey, // owner
        true, // allow owner off curve
    );

    account_vector.push({ pubkey: free_play_token_account, isSigner: false, isWritable: true });

    account_vector.push({ pubkey: DM_PROGRAM, isSigner: false, isWritable: false });
    account_vector.push({ pubkey: dm_data_key, isSigner: false, isWritable: true });

    const play_instruction = new TransactionInstruction({
        keys: account_vector,
        programId: DUNGEON_PROGRAM,
        data: instruction_data,
    });

    let txArgs = await get_current_blockhash(bearer_token);

    console.log("make transaction:", txArgs);

    let transaction = new Transaction(txArgs);
    transaction.feePayer = keypair.publicKey;

    transaction.add(play_instruction);

    transaction.sign(keypair);

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
}

export async function Quit(bearer_token: string, keypair: Keypair, instruction_json: any) {
    let player_data_key = PublicKey.findProgramAddressSync([keypair.publicKey.toBytes()], DUNGEON_PROGRAM)[0];
    let player_achievement_key = PublicKey.findProgramAddressSync(
        [keypair.publicKey.toBytes(), Buffer.from(ACHIEVEMENT_SEED)],
        DUNGEON_PROGRAM,
    )[0];

    let program_account_key = PublicKey.findProgramAddressSync([Buffer.from(MAIN_ACCOUNT_SEED)], DUNGEON_PROGRAM)[0];
    let program_data_key = PublicKey.findProgramAddressSync([Buffer.from(DATA_ACCOUNT_SEED)], DUNGEON_PROGRAM)[0];

    let loot_token_account = await getAssociatedTokenAddress(
        LOOT_TOKEN_MINT, // mint
        keypair.publicKey, // owner
        true, // allow owner off curve
    );

    let dm_data_key = PublicKey.findProgramAddressSync([Buffer.from("data_account")], DM_PROGRAM)[0];

    const instruction_data = serialise_quit_instruction(DungeonInstruction.quit, instruction_json["ref_code"]);

    var account_vector = [
        { pubkey: keypair.publicKey, isSigner: true, isWritable: true },
        { pubkey: player_data_key, isSigner: false, isWritable: true },
        { pubkey: player_achievement_key, isSigner: false, isWritable: true },
        { pubkey: program_account_key, isSigner: false, isWritable: true },
        { pubkey: program_data_key, isSigner: false, isWritable: true },

        { pubkey: LOOT_TOKEN_MINT, isSigner: false, isWritable: true },
        { pubkey: loot_token_account, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SYSTEM_KEY, isSigner: false, isWritable: false },
    ];

    let free_play_token_account = await getAssociatedTokenAddress(
        FREE_PLAY_MINT, // mint
        keypair.publicKey, // owner
        true, // allow owner off curve
    );

    account_vector.push({ pubkey: free_play_token_account, isSigner: false, isWritable: true });

    account_vector.push({ pubkey: DM_PROGRAM, isSigner: false, isWritable: false });
    account_vector.push({ pubkey: dm_data_key, isSigner: false, isWritable: true });

    const quit_instruction = new TransactionInstruction({
        keys: account_vector,
        programId: DUNGEON_PROGRAM,
        data: instruction_data,
    });

    let txArgs = await get_current_blockhash(bearer_token);

    let transaction = new Transaction(txArgs);
    transaction.feePayer = keypair.publicKey;

    transaction.add(quit_instruction);

    transaction.sign(keypair);

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
}
