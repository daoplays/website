import React, { useRef, useCallback, useEffect, useState, useMemo } from "react";
import { SetStateAction } from "react";

import { ChakraProvider, Box, HStack, theme, Text, Center, VStack, NumberInput, NumberInputField, Divider } from "@chakra-ui/react";
import { isMobile } from "react-device-detect";

import { PublicKey, Keypair, clusterApiUrl, Transaction, TransactionInstruction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { ConnectionProvider, WalletProvider, useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter, SolflareWalletAdapter, BackpackWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletModalProvider, useWalletModal } from "@solana/wallet-adapter-react-ui";
import { BeetStruct, u8, u16, u64, i16, bignum } from "@metaplex-foundation/beet";
import {
    TOKEN_2022_PROGRAM_ID,
    getAssociatedTokenAddress,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    createAssociatedTokenAccountInstruction,
    createTransferCheckedInstruction,
    getTransferFeeAmount,
    unpackAccount,
    createWithdrawWithheldTokensFromAccountsInstruction,
    createAmountToUiAmountInstruction,
    createThawAccountInstruction,
    createMintToCheckedInstruction,
} from "@solana/spl-token";

import loading from "./loading-gif.gif";

require("@solana/wallet-adapter-react-ui/styles.css");

const button_width = "150px";

const PROGRAM = new PublicKey("8ZMLymiBfEWkZwaRebKhFXgUGbEdpnjij36i5PULFHSX");

const TokenInstruction = {
    create_token: 0,
};

const Extensions = {
    None: 0,
    TransferFee: 1,
    PermanentDelegate: 2,
    InterestBearing: 4,
    NonTransferable: 8,
    DefaultState: 16,
};

class Create_Token_Instruction {
    constructor(
        readonly instruction: number,
        readonly extensions: number,
        readonly transfer_fee_bp: number,
        readonly transfer_fee_max: bignum,
        readonly interest_rate: number,
    ) {}

    static readonly struct = new BeetStruct<Create_Token_Instruction>(
        [
            ["instruction", u8],
            ["extensions", u8],
            ["transfer_fee_bp", u16],
            ["transfer_fee_max", u64],
            ["interest_rate", i16],
        ],
        (args) =>
            new Create_Token_Instruction(
                args.instruction!,
                args.extensions!,
                args.transfer_fee_bp!,
                args.transfer_fee_max!,
                args.interest_rate!,
            ),
        "Create_Token_Instruction",
    );
}

function dec2bin(dec: number) {
    return (dec >>> 0).toString(2);
}

function NumberInputBox({
    setValue,
    display_value,
    key_string,
    current_ref,
}: {
    setValue: React.Dispatch<SetStateAction<number>>;
    display_value: string;
    key_string: string;
    current_ref: React.RefObject<HTMLInputElement>;
}) {
    return (
        <HStack alignItems="center">
            <Text mb="0">{key_string}</Text>
            <NumberInput
                key={key_string}
                id={key_string}
                color="black"
                size="lg"
                onChange={(valueString) => {
                    setValue(!isNaN(parseInt(valueString)) ? parseInt(valueString) : 0);
                }}
                value={display_value}
                borderColor="black"
                min={0}
                max={30000}
            >
                <NumberInputField
                    ref={current_ref}
                    key={key_string + "_field"}
                    autoFocus={current_ref?.current === document.activeElement}
                    height="20px"
                    width="80px"
                    paddingTop="1rem"
                    paddingBottom="1rem"
                    borderColor="black"
                />
            </NumberInput>
        </HStack>
    );
}

interface TransferAccount {
    pubkey: PublicKey;
    amount: number;
}

function Tokens2022App() {
    const { connection } = useConnection();
    const wallet = useWallet();

    const current_signature = useRef<string | null>(null);
    const [processing_transaction, setProcessingTransaction] = useState<boolean>(false);

    // keypair we will use to make transactions
    const [temp_keypair, setTempKeypair] = useState<Keypair | null>(null);

    // token states
    const [include_transfer, setIncludeTransfer] = useState<boolean>(false);
    const [include_delegate, setIncludeDelegate] = useState<boolean>(false);
    const [include_interest, setIncludeInterest] = useState<boolean>(false);
    const [include_soulbound, setIncludeSoulbound] = useState<boolean>(false);
    const [include_default, setIncludeDefault] = useState<boolean>(false);

    const [account_frozen, setAccountFrozen] = useState<boolean>(false);

    const [current_mint, setCurrentMint] = useState<PublicKey | null>(null);
    const [mint_created, setMintCreated] = useState<boolean>(false);

    const [transfer_fee_bp, setTransferFeeBP] = useState<number>(500);
    const [transfer_fee_max, setTransferFeeMax] = useState<number>(5000);
    const [interest_rate, setInterestRate] = useState<number>(10000);

    const transfer_fee_bp_ref = useRef<HTMLInputElement>(null);
    const transfer_fee_max_ref = useRef<HTMLInputElement>(null);
    const interest_rate_ref = useRef<HTMLInputElement>(null);

    const state_interval = useRef<number | null>(null);
    const check_keypair_interval = useRef<number | null>(null);
    const check_keypair = useRef<boolean>(true);

    //transfer fee state
    const [transfer_accounts, setTransferAccounts] = useState<TransferAccount[]>([]);

    // interest rate state
    const [token_balance, setTokenBalance] = useState<number>(0);
    const [tokenUIbalance, setTokenUIBalance] = useState<number>(0);

    function ConnectWalletButton() {
        const { setVisible } = useWalletModal();

        const handleConnectWallet = useCallback(async () => {
            setVisible(true);
        }, [setVisible]);

        return (
            <>
                <Box mb="1rem" as="button" onClick={handleConnectWallet}>
                    <div className="font-face-sfpb">
                        <Text
                            borderColor="black"
                            borderWidth="1px"
                            width="160px"
                            height="25px"
                            fontSize={"16px"}
                            textAlign="center"
                            color="black"
                            mb="0"
                        >
                            CONNECT WALLET
                        </Text>
                    </div>
                </Box>
            </>
        );
    }

    const DisconnectWallet = useCallback(async () => {
        console.log("call wallet disconnect");
        await wallet.disconnect();
    }, [wallet]);

    function DisconnectWalletButton() {
        return (
            <>
                <Box mb="1rem" as="button" onClick={() => DisconnectWallet()}>
                    <div className="font-face-sfpb">
                        <Text
                            borderColor="black"
                            borderWidth="1px"
                            width="200px"
                            height="25px"
                            fontSize={"16px"}
                            textAlign="center"
                            color="black"
                            mb="0"
                        >
                            DISCONNECT WALLET
                        </Text>
                    </div>
                </Box>
            </>
        );
    }

    const CheckTempKeypair = useCallback(async () => {
        if (temp_keypair === null || check_keypair.current === false) return;

        let balance = await connection.getBalance(temp_keypair.publicKey, "confirmed");

        if (balance === 0) return;

        console.log("account has been created");
        //await connection.requestAirdrop(temp_keypair.publicKey, LAMPORTS_PER_SOL);

        check_keypair.current = false;
    }, [temp_keypair, connection]);

    // interval for checking signatures
    useEffect(() => {
        if (check_keypair_interval.current === null) {
            check_keypair_interval.current = window.setInterval(CheckTempKeypair, 1000);
        } else {
            window.clearInterval(check_keypair_interval.current);
            check_keypair_interval.current = null;
        }
        // here's the cleanup function
        return () => {
            if (check_keypair_interval.current !== null) {
                window.clearInterval(check_keypair_interval.current);
                check_keypair_interval.current = null;
            }
        };
    }, [CheckTempKeypair]);

    useEffect(() => {
        console.log("wallet changed", wallet.connected, wallet.connecting, wallet.disconnecting, wallet.publicKey === null);
    }, [wallet]);

    const GetFeeAccounts = useCallback(async () => {
        if (current_mint === null) return;
        const allAccounts = await connection.getProgramAccounts(TOKEN_2022_PROGRAM_ID, {
            commitment: "confirmed",
            filters: [
                {
                    memcmp: {
                        offset: 0,
                        bytes: current_mint.toString(),
                    },
                },
            ],
        });

        const accountsToWithdrawFrom = [];
        for (const accountInfo of allAccounts) {
            const account = unpackAccount(accountInfo.pubkey, accountInfo.account, TOKEN_2022_PROGRAM_ID);
            const transferFeeAmount = getTransferFeeAmount(account);
            if (transferFeeAmount !== null && transferFeeAmount.withheldAmount > BigInt(0)) {
                let transfer_account: TransferAccount = {
                    pubkey: accountInfo.pubkey,
                    amount: parseInt(transferFeeAmount.withheldAmount.toString()) / 1000,
                };
                console.log(accountInfo.pubkey.toString(), (parseInt(transferFeeAmount.withheldAmount.toString()) / 1000).toString());
                accountsToWithdrawFrom.push(transfer_account);
            }
        }

        console.log(allAccounts);
        console.log(accountsToWithdrawFrom);
        setTransferAccounts(accountsToWithdrawFrom);
    }, [connection, current_mint]);

    const GetTokenAmounts = useCallback(async () => {
        if (wallet.publicKey === null || current_mint === null || temp_keypair === null) return;

        await GetFeeAccounts();

        let user_token_key = await getAssociatedTokenAddress(
            current_mint, // mint
            wallet.publicKey, // owner
            true, // allow owner off curve,
            TOKEN_2022_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID,
        );

        let accountInfo = await connection.getAccountInfo(user_token_key, "processed");
        if (accountInfo === null) return;

        setMintCreated(true);
        setProcessingTransaction(false);

        const account = unpackAccount(user_token_key, accountInfo, TOKEN_2022_PROGRAM_ID);

        console.log("frozen? ", account.isFrozen);
        setAccountFrozen(account.isFrozen);

        let current_balance = await connection.getTokenAccountBalance(user_token_key, "processed");
        console.log(current_balance, parseInt(current_balance.value.amount));
        const transaction = new Transaction().add(
            createAmountToUiAmountInstruction(current_mint, parseInt(current_balance.value.amount), TOKEN_2022_PROGRAM_ID),
        );
        const { returnData, err } = (await connection.simulateTransaction(transaction, [temp_keypair], false)).value;

        if (!returnData?.data) {
            console.log("no returnData", returnData);
            console.log(err);
            return;
        }
        let ui_amount = Buffer.from(returnData.data[0], returnData.data[1]).toString("utf-8");
        console.log(current_balance, Buffer.from(returnData.data[0], returnData.data[1]).toString("utf-8"));

        if (current_balance.value.uiAmount !== null) setTokenBalance(current_balance.value.uiAmount);
        setTokenUIBalance(parseFloat(ui_amount));
        return Buffer.from(returnData.data[0], returnData.data[1]).toString("utf-8");
    }, [wallet, connection, current_mint, temp_keypair, GetFeeAccounts]);

    useEffect(() => {
        if (state_interval.current === null) {
            state_interval.current = window.setInterval(GetTokenAmounts, 5000);
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
    }, [GetTokenAmounts]);

    const Transfer = useCallback(async () => {
        if (wallet.publicKey === null || current_mint === null) return;

        const accountKeypair = Keypair.generate();

        console.log("Create account for ", accountKeypair.publicKey.toString());

        const lamports = await connection.getMinimumBalanceForRentExemption(0);

        let create_account_idx = SystemProgram.createAccount({
            /** The account that will transfer lamports to the created account */
            fromPubkey: wallet.publicKey,
            /** Public key of the created account */
            newAccountPubkey: accountKeypair.publicKey,
            /** Amount of lamports to transfer to the created account */
            lamports: lamports,
            /** Amount of space in bytes to allocate to the created account */
            space: 0,
            /** Public key of the program to assign as the owner of the created account */
            programId: SystemProgram.programId,
        });

        let new_token_key = await getAssociatedTokenAddress(
            current_mint, // mint
            accountKeypair.publicKey, // owner
            true, // allow owner off curve,
            TOKEN_2022_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID,
        );

        console.log("Create token account at ", new_token_key.toString());

        let create_ata_idx = createAssociatedTokenAccountInstruction(
            wallet.publicKey,
            new_token_key,
            accountKeypair.publicKey,
            current_mint,
            TOKEN_2022_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID,
        );

        let user_token_key = await getAssociatedTokenAddress(
            current_mint, // mint
            wallet.publicKey, // owner
            true, // allow owner off curve,
            TOKEN_2022_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID,
        );

        let transfer_idx = createTransferCheckedInstruction(
            user_token_key,
            current_mint,
            new_token_key,
            wallet.publicKey,
            1000,
            3,
            undefined,
            TOKEN_2022_PROGRAM_ID,
        );

        let blockhash_result = await connection.getLatestBlockhash();
        let txArgs = { blockhash: blockhash_result.blockhash, lastValidBlockHeight: blockhash_result.lastValidBlockHeight };

        let transaction = new Transaction(txArgs);
        transaction.feePayer = wallet.publicKey;

        transaction.add(create_account_idx);
        transaction.add(create_ata_idx);

        if (include_default) {
            let thaw_idx = createThawAccountInstruction(new_token_key, current_mint, wallet.publicKey, undefined, TOKEN_2022_PROGRAM_ID);
            transaction.add(thaw_idx);
        }

        transaction.add(transfer_idx);

        transaction.partialSign(accountKeypair);

        try {
            await wallet.sendTransaction(transaction, connection);
        } catch (error) {
            console.log(error);
        }

        setProcessingTransaction(true);
    }, [wallet, connection, current_mint, include_default]);

    const GetFees = useCallback(async () => {
        if (wallet.publicKey === null || current_mint === null || transfer_accounts.length === 0) return;

        let user_token_key = await getAssociatedTokenAddress(
            current_mint, // mint
            wallet.publicKey, // owner
            true, // allow owner off curve,
            TOKEN_2022_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID,
        );

        let accountsToWithdrawFrom = [];
        for (let i = 0; i < transfer_accounts.length; i++) {
            accountsToWithdrawFrom.push(transfer_accounts[i].pubkey);
        }

        let withdraw_idx = createWithdrawWithheldTokensFromAccountsInstruction(
            current_mint,
            user_token_key,
            wallet.publicKey,
            [],
            accountsToWithdrawFrom,
            TOKEN_2022_PROGRAM_ID,
        );

        let blockhash_result = await connection.getLatestBlockhash();
        let txArgs = { blockhash: blockhash_result.blockhash, lastValidBlockHeight: blockhash_result.lastValidBlockHeight };

        let transaction = new Transaction(txArgs);
        transaction.feePayer = wallet.publicKey;

        transaction.add(withdraw_idx);

        try {
            await wallet.sendTransaction(transaction, connection);
        } catch (error) {
            console.log(error);
        }

        setProcessingTransaction(true);
    }, [wallet, connection, current_mint, transfer_accounts]);

    const Create = useCallback(async () => {
        if (wallet.publicKey === null) return;

        const accountKeypair = Keypair.generate();

        let space = 100;
        const lamports = await connection.getMinimumBalanceForRentExemption(space);
        console.log("Create account for ", accountKeypair.publicKey.toString(), lamports / LAMPORTS_PER_SOL);

        let create_account_idx = SystemProgram.createAccount({
            /** The account that will transfer lamports to the created account */
            fromPubkey: wallet.publicKey,
            /** Public key of the created account */
            newAccountPubkey: accountKeypair.publicKey,
            /** Amount of lamports to transfer to the created account */
            lamports: lamports,
            /** Amount of space in bytes to allocate to the created account */
            space: 0,
            /** Public key of the program to assign as the owner of the created account */
            programId: SystemProgram.programId,
        });

        const mint_keypair = Keypair.generate();
        var mint_pubkey = mint_keypair.publicKey;

        let user_token_key = await getAssociatedTokenAddress(
            mint_pubkey, // mint
            wallet.publicKey, // owner
            true, // allow owner off curve,
            TOKEN_2022_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID,
        );

        let extensions =
            (Extensions.TransferFee * Number(include_transfer)) |
            (Extensions.PermanentDelegate * Number(include_delegate)) |
            (Extensions.InterestBearing * Number(include_interest)) |
            (Extensions.NonTransferable * Number(include_soulbound)) |
            (Extensions.DefaultState * Number(include_default));

        console.log(dec2bin(Extensions.TransferFee));
        console.log(dec2bin(Extensions.PermanentDelegate));
        console.log(dec2bin(Extensions.InterestBearing));
        console.log(dec2bin(Extensions.NonTransferable));
        console.log(dec2bin(Extensions.DefaultState));
        console.log(dec2bin(extensions));

        const idx_data = new Create_Token_Instruction(
            TokenInstruction.create_token,
            extensions,
            transfer_fee_bp,
            transfer_fee_max,
            interest_rate,
        );
        const [idx_buffer] = Create_Token_Instruction.struct.serialize(idx_data);

        const create_token_instruction = new TransactionInstruction({
            keys: [
                { pubkey: wallet.publicKey, isSigner: true, isWritable: true },

                { pubkey: mint_pubkey, isSigner: true, isWritable: true },
                { pubkey: user_token_key, isSigner: false, isWritable: true },

                { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
                { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                { pubkey: SystemProgram.programId, isSigner: false, isWritable: true },
            ],
            programId: PROGRAM,
            data: idx_buffer,
        });

        let blockhash_result = await connection.getLatestBlockhash();
        let txArgs = { blockhash: blockhash_result.blockhash, lastValidBlockHeight: blockhash_result.lastValidBlockHeight };

        let transaction = new Transaction(txArgs);
        transaction.feePayer = wallet.publicKey;

        transaction.add(create_account_idx);
        transaction.add(create_token_instruction);

        //console.log("signing with ", team_token_mint_keypair.publicKey.toString());
        transaction.partialSign(accountKeypair);
        transaction.partialSign(mint_keypair);

        let signature = null;
        try {
            signature = await wallet.sendTransaction(transaction, connection);
        } catch (error) {
            console.log(error);
            return;
        }

        setCurrentMint(mint_keypair.publicKey);
        setTempKeypair(accountKeypair);
        setMintCreated(false);

        setProcessingTransaction(true);
        current_signature.current = signature;
    }, [
        wallet,
        connection,
        include_transfer,
        include_delegate,
        include_interest,
        include_soulbound,
        include_default,
        transfer_fee_bp,
        transfer_fee_max,
        interest_rate,
    ]);

    const ThawAccount = useCallback(async () => {
        if (wallet.publicKey === null || current_mint === null) return;

        let user_token_key = await getAssociatedTokenAddress(
            current_mint, // mint
            wallet.publicKey, // owner
            true, // allow owner off curve,
            TOKEN_2022_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID,
        );

        let thaw_idx = createThawAccountInstruction(user_token_key, current_mint, wallet.publicKey, undefined, TOKEN_2022_PROGRAM_ID);

        let mint_idx = createMintToCheckedInstruction(
            current_mint,
            user_token_key,
            wallet.publicKey,
            1000 * 1000,
            3,
            undefined,
            TOKEN_2022_PROGRAM_ID,
        );

        let blockhash_result = await connection.getLatestBlockhash();
        let txArgs = { blockhash: blockhash_result.blockhash, lastValidBlockHeight: blockhash_result.lastValidBlockHeight };

        let transaction = new Transaction(txArgs);
        transaction.feePayer = wallet.publicKey;

        transaction.add(thaw_idx);
        transaction.add(mint_idx);

        try {
            await wallet.sendTransaction(transaction, connection);
        } catch (error) {
            console.log(error);
        }
    }, [wallet, connection, current_mint]);

    function TokenFunctions() {
        if (current_mint === null || mint_created === false) {
            return <></>;
        }
        // if the account is frozen then there isn't much to do but unfreeze
        if (include_default && account_frozen) {
            return (
                <>
                    <Divider color={"black"} borderBottomWidth="2px" opacity={1} />
                    <Box width={button_width} as="button" onClick={() => ThawAccount()} borderWidth="1px" borderColor="black">
                        Unfreeze
                    </Box>
                </>
            );
        }

        if (include_transfer) {
            return (
                <>
                    <Divider color={"black"} borderBottomWidth="2px" opacity={1} />
                    <Box width={button_width} as="button" onClick={() => Transfer()} borderWidth="1px" borderColor="black">
                        Transfer 1
                    </Box>
                    {transfer_accounts.length > 0 && (
                        <>
                            <VStack>
                                {transfer_accounts.map((item: TransferAccount, index) => (
                                    <Text key={index} mb="0">
                                        {item.pubkey.toString().slice(0, 5) + "..."} withheld {item.amount}
                                    </Text>
                                ))}
                            </VStack>
                            <Box width={button_width} as="button" onClick={() => GetFees()} borderWidth="1px" borderColor="black">
                                Claim Fees
                            </Box>
                        </>
                    )}
                </>
            );
        }

        return <></>;
    }

    function IncludeTransfer() {
        return (
            <Box
                width={button_width}
                as="button"
                onClick={() => setIncludeTransfer(!include_transfer)}
                borderWidth="1px"
                borderColor={include_transfer ? "black" : "white"}
            >
                Transfer Fee
            </Box>
        );
    }

    function IncludeDelegate() {
        return (
            <Box
                width={button_width}
                as="button"
                onClick={() => setIncludeDelegate(!include_delegate)}
                borderWidth="1px"
                borderColor={include_delegate ? "black" : "white"}
            >
                Delegate
            </Box>
        );
    }

    function IncludeNonTransferable() {
        return (
            <Box
                width={button_width}
                as="button"
                onClick={() => setIncludeSoulbound(!include_soulbound)}
                borderWidth="1px"
                borderColor={include_soulbound ? "black" : "white"}
            >
                Non-Transferable
            </Box>
        );
    }

    function IncludeInterest() {
        return (
            <Box
                width={button_width}
                as="button"
                onClick={() => setIncludeInterest(!include_interest)}
                borderWidth="1px"
                borderColor={include_interest ? "black" : "white"}
            >
                Interest
            </Box>
        );
    }

    function IncludeDefaultState() {
        return (
            <Box
                width={button_width}
                as="button"
                onClick={() => setIncludeDefault(!include_default)}
                borderWidth="1px"
                borderColor={include_default ? "black" : "white"}
            >
                Default State
            </Box>
        );
    }

    function SetTokenOptions() {
        return (
            <Center mb="5rem" width="100%">
                <VStack>
                    {!isMobile && (
                        <HStack>
                            <IncludeTransfer />
                            <IncludeDelegate />
                            <IncludeInterest />
                            <IncludeNonTransferable />
                            <IncludeDefaultState />
                        </HStack>
                    )}
                    {isMobile && (
                        <HStack>
                            <IncludeTransfer />
                            <IncludeDelegate />
                        </HStack>
                    )}
                    {isMobile && (
                        <HStack>
                            <IncludeInterest />
                            <IncludeNonTransferable />
                        </HStack>
                    )}
                    {isMobile && (
                        <HStack>
                            <IncludeDefaultState />
                        </HStack>
                    )}
                    {include_transfer && (
                        <>
                            <Divider color={"black"} borderBottomWidth="2px" opacity={1} />
                            <Text width="100%" textAlign={"left"}>
                                Transfer Fee Options
                            </Text>
                            <HStack width="100%">
                                <NumberInputBox
                                    setValue={setTransferFeeBP}
                                    display_value={transfer_fee_bp.toFixed(0)}
                                    key_string="Transfer fee basis points"
                                    current_ref={transfer_fee_bp_ref}
                                />

                                <NumberInputBox
                                    setValue={setTransferFeeMax}
                                    display_value={transfer_fee_max.toFixed(0)}
                                    key_string="Transfer fee maximum"
                                    current_ref={transfer_fee_max_ref}
                                />
                            </HStack>
                        </>
                    )}
                    {include_interest && (
                        <>
                            <Divider color={"black"} borderBottomWidth="2px" opacity={1} />
                            <Text width="100%" textAlign={"left"}>
                                Interest Rate Options
                            </Text>
                            <Box width="100%">
                                <NumberInputBox
                                    setValue={setInterestRate}
                                    display_value={interest_rate.toFixed(0)}
                                    key_string="Interest rate"
                                    current_ref={interest_rate_ref}
                                />
                            </Box>
                        </>
                    )}
                    <>
                        <Divider color={"black"} borderBottomWidth="2px" opacity={1} />
                        <Text width="100%" textAlign={"left"}>
                            Click to create your token:
                        </Text>
                        <Box width={button_width} as="button" onClick={() => Create()} borderWidth="1px" borderColor="black">
                            Create
                        </Box>

                        {current_mint !== null && (
                            <VStack>
                                <Text mb="0" textAlign={"center"}>
                                    Token Mint: {current_mint.toString().slice(0, 5) + "..."}
                                </Text>{" "}
                                <Text mb="0" textAlign="center" color="black">
                                    View it{" "}
                                    <a
                                        className="one"
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{ textDecoration: "underline" }}
                                        href={"https://explorer.solana.com/address/" + current_mint.toString() + "?cluster=devnet"}
                                    >
                                        here
                                    </a>
                                </Text>
                            </VStack>
                        )}
                    </>
                    <TokenFunctions />

                    {current_mint !== null && !account_frozen && mint_created && (
                        <>
                            <Divider color={"black"} borderBottomWidth="2px" opacity={1} />

                            <Text>Actual Token Balance: {token_balance}</Text>
                            <Text>UI Token Balance (with interest): {tokenUIbalance}</Text>
                        </>
                    )}

                    {processing_transaction && <img src={loading} width="50px" alt={""} />}
                </VStack>
            </Center>
        );
    }

    return (
        <>
            {wallet.publicKey && <DisconnectWalletButton />}
            {!wallet.publicKey && <ConnectWalletButton />}

            <Box textAlign="center" fontSize="l">
                {wallet.publicKey && <SetTokenOptions />}
            </Box>
        </>
    );
}

export function Tokens2022() {
    const network = "devnet";
    const endpoint = clusterApiUrl(network);
    const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter(), new BackpackWalletAdapter()], []);

    return (
        <ChakraProvider theme={theme}>
            <ConnectionProvider endpoint={endpoint}>
                <WalletProvider wallets={wallets} autoConnect>
                    <WalletModalProvider>
                        <Tokens2022App />
                    </WalletModalProvider>
                </WalletProvider>
            </ConnectionProvider>
        </ChakraProvider>
    );
}
