import React, { useCallback, useEffect, useState, useMemo } from "react";
import {
    ChakraProvider,
    theme,
    Box,
    HStack,
    Flex,
    Button,
    Text,
    VStack,
    Center,
    NumberInput,
    Slider,
    NumberInputField,
    SliderTrack,
    SliderFilledTrack,
    SliderThumb,
    Tooltip,
    Select,
    Stat,
    StatLabel,
    StatNumber,
} from "@chakra-ui/react";
import { PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";
import { publicKey } from "@metaplex-foundation/beet-solana";
import { BeetStruct, uniformFixedSizeArray, u8, u64, u16, bignum, i64 } from "@metaplex-foundation/beet";
import PlotlyChart from "react-plotlyjs-ts";
import { Divider, Alert, AlertIcon } from "@chakra-ui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { solid } from "@fortawesome/fontawesome-svg-core/import.macro"; // <-- import styles to be used
import { MdFiberManualRecord } from "react-icons/md";

import * as web3 from "@solana/web3.js";

import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";

import { ConnectionProvider, WalletProvider, useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter, SolflareWalletAdapter, BackpackWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";

import { CharityInfoBlock, useSolanaAccount, WalletConnected, WalletNotConnected, CharityData, bignum_to_num } from "./charity";

require("@solana/wallet-adapter-react-ui/styles.css");

const AuctionInstruction = {
    create_data_account: 0,
    place_bid: 1,
    select_winners: 2,
    send_tokens: 3,
};

const Charity = {
    UkraineERF: 0,
    WaterOrg: 1,
    OneTreePlanted: 2,
    EvidenceAction: 3,
    GirlsWhoCode: 4,
    OutrightActionInt: 5,
    TheLifeYouCanSave: 6,
};

class Basic_Instruction {
    constructor(readonly instruction: number) {}

    static readonly struct = new BeetStruct<Basic_Instruction>(
        [["instruction", u8]],
        (args) => new Basic_Instruction(args.instruction!),
        "Basic_Instruction",
    );
}

class Place_Bid_Instruction {
    constructor(
        readonly instruction: number,
        readonly amount_charity: bignum,
        readonly amount_daoplays: bignum,
        readonly charity: number,
    ) {}

    static readonly struct = new BeetStruct<Place_Bid_Instruction>(
        [
            ["instruction", u8],
            ["amount_charity", u64],
            ["amount_daoplays", u64],
            ["charity", u8],
        ],
        (args) => new Place_Bid_Instruction(args.instruction!, args.amount_charity!, args.amount_daoplays!, args.charity!),
        "Place_Bid_Instruction",
    );
}

export class BidderData {
    constructor(readonly index: number) {}

    static readonly struct = new BeetStruct<BidderData>([["index", u16]], (args) => new BidderData(args.index!), "BidderData");
}

export class AuctionData {
    constructor(
        readonly prev_choose_winners_time: bignum,
        readonly n_bidders: number,
        readonly total_bid_amount: bignum,
        readonly bid_keys: PublicKey[],
        readonly bid_amounts: bignum[],
        readonly bid_times: bignum[],
        readonly n_winners: number,
        readonly winners: PublicKey[],
        readonly charity_data: CharityData,
    ) {}

    static readonly struct = new BeetStruct<AuctionData>(
        [
            ["prev_choose_winners_time", i64],
            ["n_bidders", u16],
            ["total_bid_amount", u64],
            ["bid_keys", uniformFixedSizeArray(publicKey, 1024)],
            ["bid_amounts", uniformFixedSizeArray(u64, 1024)],
            ["bid_times", uniformFixedSizeArray(i64, 1024)],
            ["n_winners", u8],
            ["winners", uniformFixedSizeArray(publicKey, 4)],
            ["charity_data", CharityData.struct],
        ],
        (args) =>
            new AuctionData(
                args.prev_choose_winners_time!,
                args.n_bidders!,
                args.total_bid_amount!,
                args.bid_keys!,
                args.bid_amounts!,
                args.bid_times!,
                args.n_winners!,
                args.winners!,
                args.charity_data!,
            ),
        "AuctionData",
    );
}

function GetBidderStats() {
    const [current_bid, setCurrentBid] = useState<number>(0);
    const [n_bidders, setNBidders] = useState<number>(0);
    const [bid_index, setBidIndex] = useState<number>(0);
    const [total_bid, setTotalBid] = useState<number>(0);
    const [is_winner, setIsWinner] = useState<boolean>(false);
    const [tokens_remaining, setTokensRemaining] = useState<number>(0);
    const [time_selected, setTimeSelected] = useState<number>(0);

    const wallet = useWallet();
    const { connection } = useConnection();

    const init = useCallback(async () => {
        const program_key = new PublicKey("EzigyiBDJy7Srq8xn6SK6Nx7BpenbSE3YbBSaBpPSN1q");
        const daoplays_key = new web3.PublicKey("2BLkynLAWGwW58SLDAnhwsoiAuVtzqyfHKA3W3MJFwEF");
        const token_mint_key = new web3.PublicKey("CisHceikLeKxYiUqgDVduw2py2GEK71FTRykXGdwf22h");

        try {
            if (wallet.publicKey) {
                let program_data_key = await PublicKey.createWithSeed(daoplays_key, "data_account", program_key);
                let program_data_account = await connection.getAccountInfo(program_data_key);
                let program_pda_key = (await PublicKey.findProgramAddressSync([Buffer.from("token_account")], program_key))[0];

                let bidder_pda_key = (await PublicKey.findProgramAddressSync([wallet.publicKey.toBytes()], program_key))[0];
                let bidder_data_account = await connection.getAccountInfo(bidder_pda_key);

                let bidder_token_key = await getAssociatedTokenAddress(
                    token_mint_key, // mint
                    wallet.publicKey, // owner
                    false, // allow owner off curve
                );

                let program_token_key = await getAssociatedTokenAddress(
                    token_mint_key, // mint
                    program_pda_key, // owner
                    true, // allow owner off curve
                );

                let aWalletMyTokenBalance = await connection.getTokenAccountBalance(program_token_key);

                if (program_data_account === null) return;

                const [auction_data] = AuctionData.struct.deserialize(program_data_account.data);

                setTokensRemaining(parseInt(aWalletMyTokenBalance.value.amount));
                setTotalBid(bignum_to_num(auction_data.total_bid_amount) / web3.LAMPORTS_PER_SOL);
                setNBidders(auction_data.n_bidders);
                setTimeSelected(bignum_to_num(auction_data.prev_choose_winners_time));

                if (bidder_data_account !== null) {
                    const [bidder_data] = BidderData.struct.deserialize(bidder_data_account.data);

                    const bid_key = auction_data.bid_keys[bidder_data.index];
                    const bid_amount = bignum_to_num(auction_data.bid_amounts[bidder_data.index]);
                    const bid_time = bignum_to_num(auction_data.bid_times[bidder_data.index]);

                    if (bid_key.toString() === bidder_token_key.toString()) {
                        setCurrentBid(bid_amount / web3.LAMPORTS_PER_SOL);
                        //console.log("bidder position", bidder_data_struct.value, "bid amount", bid_amount.value.toNumber() / web3.LAMPORTS_PER_SOL);

                        let age_count = 0;
                        for (let i = 0; i < 1024; i++) {
                            const one_time = bignum_to_num(auction_data.bid_times[i]);
                            //console.log(i, one_time, bid_time, age_count);
                            if (one_time < bid_time) {
                                age_count += 1;
                            }
                        }

                        setBidIndex(age_count);
                    } else {
                        setCurrentBid(0);
                        //console.log("no bid ", bid_amount.value.toNumber() / web3.LAMPORTS_PER_SOL);
                    }

                    let is_winner = false;
                    for (let i = 0; i < auction_data.n_winners; i++) {
                        const winner_key = auction_data.winners[i];

                        if (winner_key.toString() === bidder_token_key.toString()) {
                            is_winner = true;
                            break;
                        }
                    }
                    setIsWinner(is_winner);
                } else {
                    setCurrentBid(0);
                }
            }
        } catch (error) {
            console.log(error);
        }
    }, [connection, wallet]);

    useEffect(() => {
        setInterval(init, 1000);
    }, [init]);

    return { current_bid, n_bidders, bid_index, total_bid, is_winner, tokens_remaining, time_selected };
}

function GetCharityStats() {
    const [total_donated, setTotalDonated] = useState<number>(0);
    const [average_price, setAveragePrice] = useState<number>(0);
    const [donation_array, setDonationArray] = useState<number[]>([]);
    const [n_donations, setNDonations] = useState<number>(0);

    const { connection } = useConnection();

    const init = useCallback(async () => {
        const launch_program_key = new PublicKey("BHJ8pK9WFHad1dEds631tFE6qWQgX48VbwWTSqiwR54Y");
        const auction_program_key = new PublicKey("EzigyiBDJy7Srq8xn6SK6Nx7BpenbSE3YbBSaBpPSN1q");
        const daoplays_key = new web3.PublicKey("2BLkynLAWGwW58SLDAnhwsoiAuVtzqyfHKA3W3MJFwEF");

        try {
            let auction_data_key = await PublicKey.createWithSeed(daoplays_key, "data_account", auction_program_key);
            let auction_data_account = await connection.getAccountInfo(auction_data_key);

            let launch_program_data_key = await PublicKey.findProgramAddressSync([Buffer.from("token_account")], launch_program_key);
            let launch_program_data_account = await connection.getAccountInfo(launch_program_data_key[0]);

            if (auction_data_account === null || launch_program_data_account === null) return;

            const [launch_data] = CharityData.struct.deserialize(launch_program_data_account.data);
            const [auction_data] = CharityData.struct.deserialize(auction_data_account.data.slice(49299, 49379));

            let total_donated =
                (bignum_to_num(launch_data.donated_total) + bignum_to_num(auction_data.donated_total)) / web3.LAMPORTS_PER_SOL;

            setTotalDonated(total_donated);

            let n_donations = bignum_to_num(launch_data.n_donations) + bignum_to_num(auction_data.n_donations);

            setNDonations(n_donations);

            setAveragePrice(total_donated / n_donations);

            let donation_array = [
                (bignum_to_num(launch_data.charity_totals[0]) + bignum_to_num(auction_data.charity_totals[0])) / web3.LAMPORTS_PER_SOL,
                (bignum_to_num(launch_data.charity_totals[1]) + bignum_to_num(auction_data.charity_totals[1])) / web3.LAMPORTS_PER_SOL,
                (bignum_to_num(launch_data.charity_totals[2]) + bignum_to_num(auction_data.charity_totals[2])) / web3.LAMPORTS_PER_SOL,
                (bignum_to_num(launch_data.charity_totals[3]) + bignum_to_num(auction_data.charity_totals[3])) / web3.LAMPORTS_PER_SOL,
                (bignum_to_num(launch_data.charity_totals[4]) + bignum_to_num(auction_data.charity_totals[4])) / web3.LAMPORTS_PER_SOL,
                (bignum_to_num(launch_data.charity_totals[5]) + bignum_to_num(auction_data.charity_totals[5])) / web3.LAMPORTS_PER_SOL,
                (bignum_to_num(launch_data.charity_totals[6]) + bignum_to_num(auction_data.charity_totals[6])) / web3.LAMPORTS_PER_SOL,
            ];

            setDonationArray(donation_array);
        } catch (error) {
            console.log(error);
        }
    }, [connection]);

    useEffect(() => {
        setInterval(init, 1000);
    }, [init]);

    return { total_donated, donation_array, average_price, n_donations };
}

function StatsBlock({ total_donated, n_donations, average_price }: { total_donated: number; n_donations: number; average_price: number }) {
    return (
        <Flex flexDirection="row">
            <Box mt="1rem" mb="1rem" mr="1rem">
                <HStack>
                    <Box borderWidth="5px" borderColor="darkblue">
                        <FontAwesomeIcon icon={solid("hand-holding-heart")} size="4x" />
                    </Box>
                    <Box flex="1" pl="1rem" pr="1rem" maxW="sm" mt="1rem" mb="1rem" borderWidth="1px" borderRadius="lg" overflow="hidden">
                        <Stat>
                            <StatLabel style={{ fontSize: 25 }}>Total Donated</StatLabel>
                            <StatNumber style={{ fontSize: 25 }}>
                                {total_donated ? total_donated.toFixed(4) + " SOL" : "Loading.."}
                            </StatNumber>
                        </Stat>
                    </Box>
                </HStack>
            </Box>
            <Box mt="1rem" mb="1rem">
                <HStack>
                    <Box borderWidth="5px" borderColor="darkblue">
                        <FontAwesomeIcon icon={solid("people-group")} size="4x" />
                    </Box>
                    <Box flex="1" pl="1rem" pr="1rem" maxW="sm" mt="1rem" mb="1rem" borderWidth="1px" borderRadius="lg" overflow="hidden">
                        <Stat>
                            <StatLabel style={{ fontSize: 25 }}>Number Donations</StatLabel>
                            <StatNumber style={{ fontSize: 25 }}>{n_donations ? n_donations : "Loading.."}</StatNumber>
                        </Stat>
                    </Box>
                </HStack>
            </Box>
        </Flex>
    );
}

export function AirDropApp() {
    const wallet = useWallet();
    const { connection } = useConnection();
    const { total_donated, donation_array, average_price, n_donations } = GetCharityStats();
    const { current_bid, n_bidders, bid_index, total_bid, is_winner, tokens_remaining, time_selected } = GetBidderStats();

    const { balance, token_pubkey, token_amount, supporter_pubkey, supporter_amount } = useSolanaAccount();
    const [slide_value, setSlideValue] = useState<number>(90);
    const [which_charity, setWhichCharity] = useState("");

    const handleWhichCharity = (event: any) => {
        setWhichCharity(event.target.value);
    };

    const format = (sol_value: string) => sol_value + ` SOL`;
    const parse = (sol_value: string) => sol_value.replace(/^ SOL/, "");
    const [sol_value, setSOLValue] = useState<number>(0.1);

    const handleSlideChange = (slide_value: number) => setSlideValue(slide_value);

    const join_ico = useCallback(async () => {
        if (wallet.publicKey === null) return;

        console.log("Sol value:", sol_value);
        console.log("Slide value:", slide_value);

        const token_mint_key = new web3.PublicKey("CisHceikLeKxYiUqgDVduw2py2GEK71FTRykXGdwf22h");
        const daoplays_key = new web3.PublicKey("2BLkynLAWGwW58SLDAnhwsoiAuVtzqyfHKA3W3MJFwEF");
        const pyth_btc = new web3.PublicKey("HovQMDrbAgAYPCmHVSrezcSmkMtXSSUsLDFANExrZh2J");
        const pyth_eth = new web3.PublicKey("EdVCmQ9FSPcVe5YySXDPCRmc8aDQLKJ9xvYBMZPie1Vw");
        const pyth_sol = new web3.PublicKey("J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix");
        const program_key = new PublicKey("EzigyiBDJy7Srq8xn6SK6Nx7BpenbSE3YbBSaBpPSN1q");
        const SYSTEM_PROGRAM_ID = new PublicKey("11111111111111111111111111111111");

        let program_data_key = await PublicKey.createWithSeed(daoplays_key, "data_account", program_key);
        let program_data_account = await connection.getAccountInfo(program_data_key);
        let program_pda_key = (await PublicKey.findProgramAddressSync([Buffer.from("token_account")], program_key))[0];

        if (program_data_account === null) return;

        let program_token_key = await getAssociatedTokenAddress(
            token_mint_key, // mint
            program_pda_key, // owner
            true, // allow owner off curve
        );

        let joiner_token_key = await getAssociatedTokenAddress(
            token_mint_key, // mint
            wallet.publicKey, // owner
            false, // allow owner off curve
        );

        let bidder_pda_key = (await PublicKey.findProgramAddressSync([wallet.publicKey.toBytes()], program_key))[0];

        let charity_key = new PublicKey("8bmmLYH2fJTUcLSz99Q1tP4xte9K41v3CeFJ6Qouogig");
        let chosen_charity = Charity.UkraineERF;
        if (which_charity === "UkraineERF") {
            chosen_charity = Charity.UkraineERF;
            charity_key = new PublicKey("8bmmLYH2fJTUcLSz99Q1tP4xte9K41v3CeFJ6Qouogig");
        } else if (which_charity === "WaterOrg") {
            chosen_charity = Charity.WaterOrg;
            charity_key = new PublicKey("3aNSq2fKBypiiuPy4SgrBeU7dDCvDrSqRmq3VBeYY56H");
        } else if (which_charity === "OneTreePlanted") {
            chosen_charity = Charity.OneTreePlanted;
            charity_key = new PublicKey("Eq3eFm5ixRL73WDVw13AU6mzA9bkRHGyhwqBmRMJ6DZT");
        } else if (which_charity === "EvidenceAction") {
            chosen_charity = Charity.EvidenceAction;
            charity_key = new PublicKey("HSpwMSrQKq8Zn3vJ6weNTuPtgNyEucTPpb8CtLXBZ6pQ");
        } else if (which_charity === "GirlsWhoCode") {
            chosen_charity = Charity.GirlsWhoCode;
            charity_key = new PublicKey("GfhUjLFe6hewxqeV3SabB6jEARJw52gK8xuXecKCHA8U");
        } else if (which_charity === "OutrightActionInt") {
            chosen_charity = Charity.OutrightActionInt;
            charity_key = new PublicKey("4BMqPdMjtiCPGJ8G2ysKaU9zk55P7ANJNJ7T6XqzW6ns");
        } else if (which_charity === "TheLifeYouCanSave") {
            chosen_charity = Charity.TheLifeYouCanSave;
            charity_key = new PublicKey("7LjZQ1UTgnsGUSnqBeiz3E4EofGA4e861wTBEixXFB6G");
        }

        let charity_amount = parseFloat((slide_value * sol_value * 0.01).toFixed(4));
        let dao_amount = parseFloat(((100 - slide_value) * sol_value * 0.01).toFixed(4));

        let ch_bn = new BN(charity_amount * web3.LAMPORTS_PER_SOL, 10);
        let dao_bn = new BN(dao_amount * web3.LAMPORTS_PER_SOL, 10);

        const bid_instruction_data = new Place_Bid_Instruction(AuctionInstruction.place_bid, ch_bn, dao_bn, chosen_charity);
        const [bid_buffer] = Place_Bid_Instruction.struct.serialize(bid_instruction_data);

        console.log("charity : ", charity_amount, charity_amount * web3.LAMPORTS_PER_SOL, ch_bn.toNumber());
        console.log("dao : ", dao_amount, dao_amount * web3.LAMPORTS_PER_SOL, dao_bn.toNumber());

        console.log("wallet: ", wallet.publicKey.toString());
        console.log("joiner token: ", joiner_token_key.toString());
        console.log("bidder pda: ", bidder_pda_key.toString());
        console.log("daoplays: ", daoplays_key.toString());
        console.log("charity: ", charity_key.toString());
        console.log("program data: ", program_data_key.toString());
        console.log("program token: ", program_token_key.toString());
        console.log("token mint: ", token_mint_key.toString());

        const bid_instruction = new TransactionInstruction({
            keys: [
                { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
                { pubkey: joiner_token_key, isSigner: false, isWritable: true },
                { pubkey: bidder_pda_key, isSigner: false, isWritable: true },

                { pubkey: daoplays_key, isSigner: false, isWritable: true },
                { pubkey: charity_key, isSigner: false, isWritable: true },

                { pubkey: program_data_key, isSigner: false, isWritable: true },
                { pubkey: program_token_key, isSigner: false, isWritable: true },

                { pubkey: token_mint_key, isSigner: false, isWritable: false },

                { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                { pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false },
            ],
            programId: program_key,
            data: bid_buffer,
        });

        const select_data = new Basic_Instruction(AuctionInstruction.select_winners);
        const [buf] = Basic_Instruction.struct.serialize(select_data);

        const select_instruction = new TransactionInstruction({
            keys: [
                { pubkey: wallet.publicKey, isSigner: true, isWritable: true },

                { pubkey: pyth_btc, isSigner: false, isWritable: true },
                { pubkey: pyth_eth, isSigner: false, isWritable: true },
                { pubkey: pyth_sol, isSigner: false, isWritable: true },

                { pubkey: program_data_key, isSigner: false, isWritable: true },
                { pubkey: program_token_key, isSigner: false, isWritable: true },
            ],
            programId: program_key,
            data: buf,
        });

        let transaction = new Transaction();

        // check if we should add a send_tokens instruction
        // this may not end up doing anything if they have already been sent
        const [auction_data] = AuctionData.struct.deserialize(program_data_account.data);

        let n_winners = auction_data.n_winners;
        console.log("have ", n_winners, " winners");
        if (n_winners > 0) {
            const send_data = new Basic_Instruction(AuctionInstruction.send_tokens);
            const [buf] = Basic_Instruction.struct.serialize(send_data);

            var key_vector = [
                { pubkey: wallet.publicKey, isSigner: true, isWritable: true },

                { pubkey: program_pda_key, isSigner: false, isWritable: true },
                { pubkey: program_token_key, isSigner: false, isWritable: true },
                { pubkey: program_data_key, isSigner: false, isWritable: true },

                { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            ];

            console.log("wallet ", wallet.publicKey.toString());
            console.log("program_pda_key ", program_pda_key.toString());
            console.log("program_token_key ", program_token_key.toString());
            console.log("program_data_key ", program_data_key.toString());
            console.log("TOKEN_PROGRAM_ID ", TOKEN_PROGRAM_ID.toString());

            for (let i = 0; i < n_winners; i++) {
                const key = auction_data.winners[i];
                key_vector.push({ pubkey: key, isSigner: false, isWritable: true });
                console.log("winner ", key.toString());
            }

            const send_instruction = new TransactionInstruction({
                keys: key_vector,
                programId: program_key,
                data: buf,
            });

            transaction.add(send_instruction);
        }

        transaction.add(bid_instruction);
        transaction.add(select_instruction);

        try {
            let signature = await wallet.sendTransaction(transaction, connection);

            await connection.confirmTransaction(signature, "processed");

            var response = null;
            while (response == null) {
                response = await connection.getTransaction(signature);
            }

            console.log("result: ", response);
        } catch (error) {
            console.log(error);
        }
    }, [connection, wallet, sol_value, slide_value, which_charity]);

    const select_winners = useCallback(async () => {
        if (wallet.publicKey === null) return;

        const token_mint_key = new web3.PublicKey("CisHceikLeKxYiUqgDVduw2py2GEK71FTRykXGdwf22h");
        const daoplays_key = new web3.PublicKey("2BLkynLAWGwW58SLDAnhwsoiAuVtzqyfHKA3W3MJFwEF");
        const pyth_btc = new web3.PublicKey("HovQMDrbAgAYPCmHVSrezcSmkMtXSSUsLDFANExrZh2J");
        const pyth_eth = new web3.PublicKey("EdVCmQ9FSPcVe5YySXDPCRmc8aDQLKJ9xvYBMZPie1Vw");
        const pyth_sol = new web3.PublicKey("J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix");
        const program_key = new PublicKey("EzigyiBDJy7Srq8xn6SK6Nx7BpenbSE3YbBSaBpPSN1q");

        let program_data_key = await PublicKey.createWithSeed(daoplays_key, "data_account", program_key);
        let program_data_account = await connection.getAccountInfo(program_data_key);
        let program_pda_key = (await PublicKey.findProgramAddressSync([Buffer.from("token_account")], program_key))[0];

        if (program_data_account === null) return;

        let program_token_key = await getAssociatedTokenAddress(
            token_mint_key, // mint
            program_pda_key, // owner
            true, // allow owner off curve
        );

        let transaction = new Transaction();

        const [auction_data] = AuctionData.struct.deserialize(program_data_account.data);

        // just check the winners struct to see if we have already select winners, as we can skip
        // the first step if so
        let n_winners = auction_data.n_winners;

        if (n_winners > 0) {
            const send_data = new Basic_Instruction(AuctionInstruction.send_tokens);
            const [buf] = Basic_Instruction.struct.serialize(send_data);

            var key_vector = [
                { pubkey: wallet.publicKey, isSigner: true, isWritable: true },

                { pubkey: program_pda_key, isSigner: false, isWritable: true },
                { pubkey: program_token_key, isSigner: false, isWritable: true },
                { pubkey: program_data_key, isSigner: false, isWritable: true },

                { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            ];

            console.log("wallet ", wallet.publicKey.toString());
            console.log("program_pda_key ", program_pda_key.toString());
            console.log("program_token_key ", program_token_key.toString());
            console.log("program_data_key ", program_data_key.toString());
            console.log("TOKEN_PROGRAM_ID ", TOKEN_PROGRAM_ID.toString());

            for (let i = 0; i < n_winners; i++) {
                const key = auction_data.winners[i];
                key_vector.push({ pubkey: key, isSigner: false, isWritable: true });
                console.log("winner ", key.toString());
            }

            const send_instruction = new TransactionInstruction({
                keys: key_vector,
                programId: program_key,
                data: buf,
            });

            transaction.add(send_instruction);
        }

        const select_data = new Basic_Instruction(AuctionInstruction.select_winners);
        const [select_buf] = Basic_Instruction.struct.serialize(select_data);

        const select_instruction = new TransactionInstruction({
            keys: [
                { pubkey: wallet.publicKey, isSigner: true, isWritable: true },

                { pubkey: pyth_btc, isSigner: false, isWritable: true },
                { pubkey: pyth_eth, isSigner: false, isWritable: true },
                { pubkey: pyth_sol, isSigner: false, isWritable: true },

                { pubkey: program_data_key, isSigner: false, isWritable: true },
                { pubkey: program_token_key, isSigner: false, isWritable: true },
            ],
            programId: program_key,
            data: select_buf,
        });

        transaction.add(select_instruction);

        try {
            let signature = await wallet.sendTransaction(transaction, connection);

            await connection.confirmTransaction(signature, "processed");

            var response = null;
            while (response == null) {
                response = await connection.getTransaction(signature);
            }

            console.log("result: ", response);
        } catch (error) {
            console.log(error);
        }
    }, [connection, wallet]);

    var data = [
        {
            type: "bar",
            x: ["UkraineERF", "Water.Org", "OneTreePlanted", "EvidenceAction", "GirlsWhoCode", "OutrightAction", "TheLifeYouCanSave"],
            y: donation_array,
        },
    ];
    var layout = {
        title: "Charity Breakdown",
        xaxis: {
            tickangle: -45,
            automargin: true,
        },
        yaxis: {
            title: {
                text: "SOL",
            },
        },
        autosize: true,

        font: {
            size: 20,
        },
    };

    return (
        <Box textAlign="center" fontSize="l">
            <Divider mt="2rem" mb="2rem" />

            <Center mb="4rem">
                <Text fontSize="2rem">Overview</Text>
            </Center>
            <VStack>
                <StatsBlock total_donated={total_donated} n_donations={n_donations} average_price={average_price} />

                <Box width="100%">
                    <PlotlyChart data={data} layout={layout} />;
                </Box>
            </VStack>
            <Divider mt="2rem" mb="2rem" />

            {wallet.publicKey && (
                <WalletConnected
                    publicKey={wallet.publicKey.toString()}
                    tokenKey={token_pubkey !== null ? token_pubkey.toString() : ""}
                    balance={balance}
                    token_amount={token_amount}
                    supporter_key={supporter_pubkey !== null ? supporter_pubkey.toString() : ""}
                    supporter_amount={supporter_amount}
                />
            )}

            {wallet.publicKey && (
                <Box>
                    <Divider mt="2rem" mb="2rem" />

                    <Center mb="3rem">
                        <Text fontSize="2rem">Get Tokens!</Text>
                    </Center>
                    <Center>
                        <Flex flexDirection="row">
                            <VStack alignItems="start">
                                <Box mt="1rem" mb="1rem" mr="1rem">
                                    <HStack>
                                        <Box borderWidth="5px" borderColor="darkblue">
                                            <FontAwesomeIcon icon={solid("users")} size="4x" />
                                        </Box>
                                        <Box
                                            flex="1"
                                            pl="1rem"
                                            pr="1rem"
                                            maxW="sm"
                                            mt="1rem"
                                            mb="1rem"
                                            borderWidth="1px"
                                            borderRadius="lg"
                                            overflow="hidden"
                                        >
                                            <Text style={{ fontSize: 25 }}>Auction Stats</Text>
                                        </Box>
                                    </HStack>
                                </Box>
                                <HStack>
                                    <VStack width="100%" alignItems="start">
                                        <HStack width="100%">
                                            <Tooltip hasArrow label="The auction supports a maximum of 1024 concurrent bids">
                                                <Text width="180px" textAlign={"left"}>
                                                    Number Active Bids:
                                                </Text>
                                            </Tooltip>
                                            <Text> {n_bidders != null ? n_bidders : "Loading.."} </Text>
                                        </HStack>

                                        <HStack width="100%">
                                            <Text width="180px" textAlign={"left"}>
                                                Current Average Bid:
                                            </Text>
                                            <Text>
                                                {total_bid !== null && n_bidders !== null
                                                    ? total_bid === 0
                                                        ? 0
                                                        : (total_bid / n_bidders).toFixed(4)
                                                    : "Loading.."}
                                            </Text>
                                        </HStack>
                                        <HStack width="100%">
                                            <Tooltip
                                                hasArrow
                                                label="Play tokens remaining in the auction pool. Spending the tokens in the game replenishes the pool."
                                            >
                                                <Text width="180px" textAlign={"left"}>
                                                    Tokens Available:
                                                </Text>
                                            </Tooltip>
                                            <Text> {tokens_remaining ? tokens_remaining : "Loading.."} </Text>
                                        </HStack>
                                    </VStack>
                                </HStack>
                            </VStack>

                            <VStack alignItems="center" ml="2rem">
                                <Box mt="1rem" mb="1rem" mr="1rem">
                                    <HStack>
                                        <Box borderWidth="5px" borderColor="darkblue">
                                            <FontAwesomeIcon icon={solid("user")} size="4x" />
                                        </Box>
                                        <Box
                                            flex="1"
                                            pl="1rem"
                                            pr="1rem"
                                            maxW="sm"
                                            mt="1rem"
                                            mb="1rem"
                                            borderWidth="1px"
                                            borderRadius="lg"
                                            overflow="hidden"
                                        >
                                            <Text style={{ fontSize: 25 }}>Your Stats</Text>
                                        </Box>
                                    </HStack>
                                </Box>
                                <HStack>
                                    <VStack alignItems="start">
                                        <HStack>
                                            <Tooltip
                                                hasArrow
                                                label="Bidding multiple times will cause your total bid to accumulate, until you win."
                                            >
                                                <Text width="180px" textAlign={"left"}>
                                                    Your Active Bid:
                                                </Text>
                                            </Tooltip>
                                            <Text> {current_bid != null ? current_bid.toFixed(4) : "Loading.."} </Text>
                                        </HStack>
                                        <HStack>
                                            <Text width="180px" textAlign={"left"}>
                                                Your Chance of Winning:
                                            </Text>
                                            <Text> {total_bid && current_bid ? (current_bid / total_bid).toFixed(4) : 0} </Text>
                                        </HStack>
                                        <HStack>
                                            <Tooltip
                                                hasArrow
                                                label="When all the bid slots are in use, new bids will remove the oldest ones in the auction.  When this counter reaches zero, you will have the oldest bid in the auction, and will be in danger of losing your bid.  Bid again to refresh this value to the maximum, or select winners to free up slots."
                                            >
                                                <Text width="180px" textAlign={"left"}>
                                                    Bids till removal:
                                                </Text>
                                            </Tooltip>
                                            <Text> {current_bid && bid_index != null ? bid_index : 0} </Text>
                                        </HStack>
                                    </VStack>
                                </HStack>
                            </VStack>
                        </Flex>
                    </Center>

                    <VStack alignItems="center" mt="2rem" mb="2rem">
                        {tokens_remaining != null && tokens_remaining < 100 ? (
                            <>
                                <Alert status="error" mb="1rem">
                                    <AlertIcon />
                                    {<Text>Less than one hundred tokens remaining. Cannot select winners until more are available</Text>}
                                </Alert>

                                <Button width="150px" colorScheme="red" variant="solid">
                                    Send Tokens!
                                </Button>
                            </>
                        ) : n_bidders != null && n_bidders === 0 ? (
                            <>
                                <Alert status="error" mb="1rem">
                                    <AlertIcon />
                                    {<Text>No bids found in the system. Cannot select winners until a bid has been made</Text>}
                                </Alert>

                                <Button width="150px" colorScheme="red" variant="solid">
                                    Send Tokens!
                                </Button>
                            </>
                        ) : is_winner ? (
                            <>
                                <Alert status="success" mb="1rem">
                                    <AlertIcon />
                                    {<Text>You have been selected! Click the button to get your tokens</Text>}
                                </Alert>

                                <Button onClick={select_winners} width="150px" colorScheme="green" variant="solid">
                                    Send Tokens!
                                </Button>
                            </>
                        ) : Math.max(300.0 / n_bidders + 2 - (Math.floor(Date.now() / 1000) - time_selected), 0) > 0 ? (
                            <>
                                <Alert status="info" mb="1rem">
                                    <AlertIcon />
                                    {
                                        <Text>
                                            Approximate time until next winners can be chosen:
                                            {Math.max(300.0 / n_bidders + 2 - (Math.floor(Date.now() / 1000) - time_selected), 0)}
                                        </Text>
                                    }
                                </Alert>

                                <Button width="150px" colorScheme="red" variant="solid">
                                    Send Tokens!
                                </Button>
                            </>
                        ) : (
                            <>
                                <Alert status="info" mb="1rem">
                                    <AlertIcon />
                                    {
                                        <Text>
                                            The program will send tokens and select new winners whenever anyone bids or plays the game. If
                                            there aren't many people playing right now you can click the button below to do this yourself.
                                        </Text>
                                    }
                                </Alert>
                                <Button onClick={select_winners} width="150px" colorScheme="green" variant="solid">
                                    Send Tokens!
                                </Button>
                            </>
                        )}
                    </VStack>

                    <Divider mt="2rem" mb="2rem" />

                    <Text mt="2rem" mb="1rem" textAlign="left" fontSize="1.5rem">
                        Step 1: Decide what you want to bid for 100 tokens
                    </Text>

                    <VStack alignItems="start" mt="2rem" mb="2rem">
                        <Alert status="info" mb="1rem">
                            <AlertIcon />
                            {total_bid != null && (
                                <Text>
                                    Your chance of winning is proportional to the amount you bid. If you bid the current average of
                                    {total_bid === 0 ? 0 : (total_bid / n_bidders).toFixed(4)} SOL you will have a one in
                                    {current_bid ? n_bidders : n_bidders + 1} chance of winning in the next draw
                                </Text>
                            )}
                        </Alert>

                        <HStack>
                            <Text mb="0">Amount to Bid:</Text>
                            <NumberInput
                                onChange={(valueString) =>
                                    setSOLValue(!isNaN(parseFloat(parse(valueString))) ? parseFloat(parse(valueString)) : 0)
                                }
                                value={format(sol_value.toString())}
                                defaultValue={average_price}
                                precision={4}
                                maxW="200px"
                                mr="2rem"
                                ml="2rem"
                            >
                                <NumberInputField height={"24px"} />
                            </NumberInput>
                        </HStack>
                    </VStack>

                    <Text mt="2rem" mb="1rem" textAlign="left" fontSize="1.5rem">
                        Step 2: Decide how we should split your bid
                    </Text>
                    <HStack width="100%">
                        <Text width="10%" mb="0" textAlign="left" fontSize="1rem">
                            Charity
                        </Text>

                        <Slider
                            width="70%"
                            aria-label="slider-ex-1"
                            focusThumbOnChange={false}
                            value={slide_value}
                            onChange={handleSlideChange}
                        >
                            <SliderTrack bg="black" height="10px">
                                <SliderFilledTrack height="10px" bg="tomato" />
                            </SliderTrack>
                            <SliderThumb boxSize={18}>
                                <Box color="blue" as={MdFiberManualRecord} />
                            </SliderThumb>
                        </Slider>
                        <Text width="15%" mb="0" borderWidth={"1px"} borderColor={"black"}>
                            {(slide_value * sol_value * 0.01).toFixed(4)}
                        </Text>
                    </HStack>

                    <HStack width="100%">
                        <Text width="10%" mb="0" textAlign="left" fontSize="1rem">
                            DaoPlays
                        </Text>

                        <Slider
                            width="70%"
                            aria-label="slider-ex-2"
                            focusThumbOnChange={false}
                            value={100 - slide_value}
                            onChange={handleSlideChange}
                        >
                            <SliderTrack bg="black" height="10px">
                                <SliderFilledTrack height="10px" bg="tomato" />
                            </SliderTrack>
                            <SliderThumb boxSize={18}>
                                <Box color="blue" as={MdFiberManualRecord} />
                            </SliderThumb>
                        </Slider>

                        <Text width="15%" mb="0" borderWidth={"1px"} borderColor={"black"}>
                            {((100 - slide_value) * sol_value * 0.01).toFixed(4)}
                        </Text>
                    </HStack>

                    <Text mt="2rem" mb="1rem" textAlign="left" fontSize="1.5rem">
                        Step 3: Select which charity
                    </Text>

                    <Select height={"24px"} placeholder="Select Charity" onChange={handleWhichCharity}>
                        <option value="UkraineERF">Ukraine Emergency Response Fund</option>
                        <option value="WaterOrg">Water.Org</option>
                        <option value="OneTreePlanted">One Tree Planted</option>
                        <option value="EvidenceAction">Evidence Action</option>
                        <option value="GirlsWhoCode">Girls Who Code</option>
                        <option value="OutrightActionInt">Outright Action International</option>
                        <option value="TheLifeYouCanSave">The Life You Can Save</option>
                    </Select>

                    <CharityInfoBlock which_charity={which_charity} />

                    <Box mt="2rem">
                        {sol_value >= 0.0001 && (
                            <Box as="button" borderWidth={"1px"} borderColor="green" backgroundColor={"lightgreen"} onClick={join_ico}>
                                Place Bid!
                            </Box>
                        )}
                        {sol_value < 0.0001 && (
                            <Tooltip hasArrow label="Minimum is 0.0001 SOL" bg="red.600">
                                <Box as="button" borderWidth={"1px"} borderColor="darkred" backgroundColor={"red"}>
                                    Place Bid!
                                </Box>
                            </Tooltip>
                        )}
                    </Box>
                </Box>
            )}
            {!wallet.publicKey && <WalletNotConnected />}
            <br />
            <br />
            <Divider mt="2rem" mb="2rem" />
        </Box>
    );
}

export function CharityAuctionDapp() {
    const network = "devnet";
    const endpoint = web3.clusterApiUrl(network);
    const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter(), new BackpackWalletAdapter()], []);

    return (
        <ChakraProvider theme={theme}>
            <ConnectionProvider endpoint={endpoint}>
                <WalletProvider wallets={wallets} autoConnect>
                    <WalletModalProvider>
                        <AirDropApp />
                    </WalletModalProvider>
                </WalletProvider>
            </ConnectionProvider>
        </ChakraProvider>
    );
}
