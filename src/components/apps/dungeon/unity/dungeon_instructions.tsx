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
import {
    serialise_play_instruction,
    get_current_blockhash,
    send_transaction,
    serialise_quit_instruction,
    serialise_buy_potion_instruction,
    serialise_rest_instruction,
    serialise_drink_potion_instruction,
} from "../utils";

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

    const instruction_data = serialise_play_instruction(
        DungeonInstruction.play,
        instruction_json["character"],
        instruction_json["selected_items"],
    );

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

export async function BuyItem(bearer_token: string, keypair: Keypair, instruction_json: any) {
    console.log("in buy item");
    let player_data_key = PublicKey.findProgramAddressSync([keypair.publicKey.toBytes()], DUNGEON_PROGRAM)[0];

    let loot_token_account = await getAssociatedTokenAddress(
        LOOT_TOKEN_MINT, // mint
        keypair.publicKey, // owner
        true, // allow owner off curve
    );

    const instruction_data = serialise_buy_potion_instruction(
        DungeonInstruction.buy_potion,
        instruction_json["which_item"],
        instruction_json["quantity"],
    );

    var account_vector = [
        { pubkey: keypair.publicKey, isSigner: true, isWritable: true },
        { pubkey: player_data_key, isSigner: false, isWritable: true },

        { pubkey: LOOT_TOKEN_MINT, isSigner: false, isWritable: true },
        { pubkey: loot_token_account, isSigner: false, isWritable: true },

        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SYSTEM_KEY, isSigner: false, isWritable: false },
    ];

    const buyItem_instruction = new TransactionInstruction({
        keys: account_vector,
        programId: DUNGEON_PROGRAM,
        data: instruction_data,
    });

    let txArgs = await get_current_blockhash(bearer_token);

    let transaction = new Transaction(txArgs);
    transaction.feePayer = keypair.publicKey;

    transaction.add(buyItem_instruction);

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

export async function UseItem(bearer_token: string, keypair: Keypair, instruction_json: any) {
    let player_data_key = PublicKey.findProgramAddressSync([keypair.publicKey.toBytes()], DUNGEON_PROGRAM)[0];

    const instruction_data = serialise_drink_potion_instruction(DungeonInstruction.drink_potion, instruction_json["which_item"]);

    var account_vector = [
        { pubkey: keypair.publicKey, isSigner: true, isWritable: true },
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

export async function Rest(bearer_token: string, keypair: Keypair, instruction_json: any) {
    let player_data_key = PublicKey.findProgramAddressSync([keypair.publicKey.toBytes()], DUNGEON_PROGRAM)[0];

    let loot_token_account = await getAssociatedTokenAddress(
        LOOT_TOKEN_MINT, // mint
        keypair.publicKey, // owner
        true, // allow owner off curve
    );
    const instruction_data = serialise_rest_instruction(
        DungeonInstruction.rest,
        instruction_json["which_character"],
        instruction_json["rest_state"],
        instruction_json["rest_time"],
    );

    var account_vector = [
        { pubkey: keypair.publicKey, isSigner: true, isWritable: true },
        { pubkey: player_data_key, isSigner: false, isWritable: true },
        { pubkey: LOOT_TOKEN_MINT, isSigner: false, isWritable: true },
        { pubkey: loot_token_account, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SYSTEM_KEY, isSigner: false, isWritable: false },
    ];

    const play_instruction = new TransactionInstruction({
        keys: account_vector,
        programId: DUNGEON_PROGRAM,
        data: instruction_data,
    });

    let txArgs = await get_current_blockhash(bearer_token);

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

/*
export async function ClaimAchievement(bearer_token: string, keypair: Keypair, instruction_json: any) {
    let program_account_key = PublicKey.findProgramAddressSync([Buffer.from(MAIN_ACCOUNT_SEED)], DUNGEON_PROGRAM)[0];
    let program_data_key = PublicKey.findProgramAddressSync([Buffer.from(DATA_ACCOUNT_SEED)], DUNGEON_PROGRAM)[0];

    let player_data_key = PublicKey.findProgramAddressSync([wallet.publicKey.toBytes()], DUNGEON_PROGRAM)[0];
    let player_achievement_key = PublicKey.findProgramAddressSync(
        [wallet.publicKey.toBytes(), Buffer.from(ACHIEVEMENT_SEED)],
        DUNGEON_PROGRAM,
    )[0];

    let shop_program_data_key = PublicKey.findProgramAddressSync([Buffer.from("data_account")], SHOP_PROGRAM)[0];

    const nft_mint_keypair = Keypair.generate();
    var nft_mint_pubkey = nft_mint_keypair.publicKey;

    let nft_meta_key = PublicKey.findProgramAddressSync(
        [Buffer.from("metadata"), METAPLEX_META.toBuffer(), nft_mint_pubkey.toBuffer()],
        METAPLEX_META,
    )[0];

    let nft_master_key = PublicKey.findProgramAddressSync(
        [Buffer.from("metadata"), METAPLEX_META.toBuffer(), nft_mint_pubkey.toBuffer(), Buffer.from("edition")],
        METAPLEX_META,
    )[0];

    let nft_account_key = await getAssociatedTokenAddress(
        nft_mint_pubkey, // mint
        wallet.publicKey, // owner
        true, // allow owner off curve
    );

    const instruction_data = serialise_claim_achievement_instruction(DungeonInstruction.claim_achievement, which);
    const init_data = serialise_basic_instruction(DungeonInstruction.add_funds);

    var account_vector = [
        { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
        { pubkey: player_data_key, isSigner: false, isWritable: true },
        { pubkey: player_achievement_key, isSigner: false, isWritable: true },

        { pubkey: ACHIEVEMENTS_COLLECTION_MINT, isSigner: false, isWritable: true },
        { pubkey: ACHIEVEMENTS_COLLECTION_META, isSigner: false, isWritable: true },
        { pubkey: ACHIEVEMENTS_COLLECTION_MASTER, isSigner: false, isWritable: true },

        { pubkey: nft_mint_pubkey, isSigner: true, isWritable: true },
        { pubkey: nft_account_key, isSigner: false, isWritable: true },
        { pubkey: nft_meta_key, isSigner: false, isWritable: true },
        { pubkey: nft_master_key, isSigner: false, isWritable: true },

        { pubkey: program_account_key, isSigner: false, isWritable: true },
        { pubkey: shop_program_data_key, isSigner: false, isWritable: true },

        { pubkey: SHOP_PROGRAM, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SYSTEM_KEY, isSigner: false, isWritable: false },
        { pubkey: METAPLEX_META, isSigner: false, isWritable: false },
    ];

    const play_instruction = new TransactionInstruction({
        keys: account_vector,
        programId: DUNGEON_PROGRAM,
        data: instruction_data,
    });

    const init_instruction = new TransactionInstruction({
        keys: [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: program_account_key, isSigner: false, isWritable: true },
            { pubkey: program_data_key, isSigner: false, isWritable: true },
            { pubkey: SYSTEM_KEY, isSigner: false, isWritable: true },
        ],
        programId: DUNGEON_PROGRAM,
        data: init_data,
    });

    let txArgs = await get_current_blockhash(bearer_token);

    let transaction = new Transaction(txArgs);
    transaction.feePayer = wallet.publicKey;

    transaction.add(play_instruction);
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

        let signature = transaction_response.result;

        if (DEBUG) {
            console.log("play signature: ", signature);
        }

        current_signature.current = signature;
        signature_check_count.current = 0;
    } catch (error) {
        console.log(error);
        return;
    }

    check_achievements.current = true;
    setShowAchievement(false);

    const message: NewDiscordMessage = {
        message_type: "achievement",
        emoji_1: DungeonCharacterEmoji[player_character],
        emoji_2: "",
        level: 0,
        sol_amount: 0,
        achievement_name: AchievementMetaData[which].name,
    };

    if (PROD) post_discord_message(message);
}
*/
