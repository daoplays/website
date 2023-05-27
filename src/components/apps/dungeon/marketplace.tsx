import { useCallback, useEffect, useState, useRef } from "react";

import { Box, Center, Text, HStack, VStack } from "@chakra-ui/react";

import { NumberInput, NumberInputField } from "@chakra-ui/react";

import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import bs58 from "bs58";
import BN from "bn.js";

import { Popover, PopoverTrigger, PopoverContent, PopoverHeader, PopoverBody, PopoverArrow, PopoverCloseButton } from "@chakra-ui/react";
import FocusLock from "react-focus-lock";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { solid } from "@fortawesome/fontawesome-svg-core/import.macro"; // <-- import styles to be used

import chicken from "./achievement_nfts/Chicken.gif";

import { DUNGEON_FONT_SIZE, MARKETPLACE_PROGRAM, SYSTEM_KEY } from "./constants";

import {
    run_marketplace_GPA,
    ListingData,
    bignum_to_num,
    get_current_blockhash,
    send_transaction,
    uInt32ToLEBytes,
    serialise_Marketplace_list_instruction,
    serialise_Marketplace_buy_instruction,
} from "./utils";

import Table from "react-bootstrap/Table";
import "./css/table.css";

const enum MarketplaceInstruction {
    init = 0,
    list_item = 1,
    update_item = 2,
    buy_item = 3,
}

var EMOJI_SIZE = 32;

export function MarketplaceScreen({ bearer_token }: { bearer_token: string }) {
    const wallet = useWallet();

    const [listings, setListings] = useState<ListingData[]>([]);
    const [list_price, setListPrice] = useState<number>(0);
    const [list_quantity, setListQuantity] = useState<number>(0);
    const [show_new_listing, setShowNewListing] = useState<boolean>(false);
    const check_marketplace = useRef<boolean>(true);

    const priceRef = useRef<HTMLInputElement>(null);
    const quantityRef = useRef<HTMLInputElement>(null);

    const [desired_quantities, setDesiredQuantities] = useState<number[]>([]);

    const setDesiredQuantity = (index: number, value: string) => {
        console.log("update Q", index, value, desired_quantities);
        let items: number[] = [...desired_quantities];
        let new_value = parseInt(value);
        if (isNaN(new_value)) new_value = 0;
        items[index] = new_value;
        setDesiredQuantities(items);
    };

    function checkParseInt(value_string: string): number {
        let parsed = parseInt(value_string);
        if (isNaN(parsed)) return -1;

        return parsed;
    }

    const check_listings = useCallback(async () => {
        let list = await run_marketplace_GPA(bearer_token);

        console.log(list);
        setListings(list);

        if (desired_quantities.length !== list.length) {
            let initial_desired: number[] = [];
            for (let i = 0; i < list.length; i++) {
                initial_desired.push(list[i].quantity);
            }
            console.log("set initial desired", initial_desired);
            setDesiredQuantities(initial_desired);
        }

        check_marketplace.current = false;
    }, [desired_quantities, bearer_token]);

    useEffect(() => {
        if (!check_marketplace.current) return;

        check_listings();
    }, [check_listings]);

    const Listings = () => {
        return (
            <>
                {listings.map((item: ListingData, index) => (
                    <ListingCard key={index} listing={item} index={index} />
                ))}
            </>
        );
    };

    const ListingCard = ({ listing, index }: { listing: ListingData; index: number }) => {
        console.log(index, listing);
        let unit_price: number = bignum_to_num(listing.price);
        console.log("index", index, "price", unit_price, "desired Q", desired_quantities[index]);
        let total_price: number = 0;
        if (desired_quantities[index] !== undefined) {
            total_price = desired_quantities[index] * unit_price;
        }

        return (
            <tr>
                <td>
                    <img src={chicken} width="auto" alt={""} style={{ maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE }} />
                </td>
                <td>Test Item</td>
                <td>{listing.quantity}</td>
                <td>{unit_price}</td>
                <td>
                    <NumberInput
                        defaultValue={listing.quantity}
                        min={0}
                        max={listing.quantity}
                        fontSize={DUNGEON_FONT_SIZE}
                        color="white"
                        size="lg"
                        onChange={(valueString) => setDesiredQuantity(index, valueString)}
                        value={desired_quantities[index].toString()}
                        precision={0}
                        borderColor="white"
                    >
                        <NumberInputField
                            height={DUNGEON_FONT_SIZE}
                            width="100px"
                            paddingTop="1rem"
                            paddingBottom="1rem"
                            borderColor="white"
                            autoFocus
                        />
                    </NumberInput>
                </td>
                <td>{total_price}</td>
                <td>
                    <Box as="button" onClick={() => BuyItemOnMarketplace(index)} borderWidth="2px" borderColor="white" width="60px">
                        <Text align="center" fontSize={DUNGEON_FONT_SIZE} color="white">
                            Buy
                        </Text>
                    </Box>
                </td>
            </tr>
        );
    };

    const BuyItemOnMarketplace = useCallback(
        async (index: number) => {
            if (wallet.publicKey === null || wallet.signTransaction === undefined) return;

            let desired_listing = listings[index];
            let seed_bytes = uInt32ToLEBytes(desired_listing.seed);
            let seller_account = desired_listing.seller_account;

            let marketplace_account = PublicKey.findProgramAddressSync([Buffer.from("marketplace_account")], MARKETPLACE_PROGRAM)[0];
            let listing_data_account = PublicKey.findProgramAddressSync([seller_account.toBytes(), seed_bytes], MARKETPLACE_PROGRAM)[0];
            let item_mint_account = new PublicKey("8EkVPhtDGpAaqqdtVAsCQG9E3LWcbaWz4JNFVdvLrbcb");

            let item_buyer_account = await getAssociatedTokenAddress(
                item_mint_account, // mint
                wallet.publicKey, // owner
                true // allow owner off curve
            );

            let item_marketplace_account = await getAssociatedTokenAddress(
                item_mint_account, // mint
                marketplace_account, // owner
                true // allow owner off curve
            );

            const instruction_data = serialise_Marketplace_buy_instruction(MarketplaceInstruction.buy_item, desired_quantities[index]);

            var account_vector = [
                { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
                { pubkey: seller_account, isSigner: false, isWritable: true },

                { pubkey: listing_data_account, isSigner: false, isWritable: true },
                { pubkey: marketplace_account, isSigner: false, isWritable: true },

                { pubkey: item_buyer_account, isSigner: false, isWritable: true },
                { pubkey: item_marketplace_account, isSigner: false, isWritable: true },

                { pubkey: item_mint_account, isSigner: false, isWritable: true },

                { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                { pubkey: SYSTEM_KEY, isSigner: false, isWritable: false },
            ];

            const list_instruction = new TransactionInstruction({
                keys: account_vector,
                programId: MARKETPLACE_PROGRAM,
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
                    return;
                }
            } catch (error) {
                console.log(error);
                return;
            }
        },
        [wallet, listings, desired_quantities, bearer_token]
    );

    const ListItemOnMarketplace = useCallback(async () => {
        if (wallet.publicKey === null || wallet.signTransaction === undefined) return;

        let seed = Math.random() * 1e9;
        console.log("seed", seed);
        let seed_bytes = uInt32ToLEBytes(seed);
        let marketplace_account = PublicKey.findProgramAddressSync([Buffer.from("marketplace_account")], MARKETPLACE_PROGRAM)[0];
        let listing_data_account = PublicKey.findProgramAddressSync([wallet.publicKey.toBytes(), seed_bytes], MARKETPLACE_PROGRAM)[0];
        let item_mint_account = new PublicKey("8EkVPhtDGpAaqqdtVAsCQG9E3LWcbaWz4JNFVdvLrbcb");

        let item_seller_account = await getAssociatedTokenAddress(
            item_mint_account, // mint
            wallet.publicKey, // owner
            true // allow owner off curve
        );

        let item_marketplace_account = await getAssociatedTokenAddress(
            item_mint_account, // mint
            marketplace_account, // owner
            true // allow owner off curve
        );

        let price_bn = new BN(list_price);
        const instruction_data = serialise_Marketplace_list_instruction(MarketplaceInstruction.list_item, 0, list_quantity, price_bn, seed);

        var account_vector = [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: listing_data_account, isSigner: false, isWritable: true },
            { pubkey: marketplace_account, isSigner: false, isWritable: true },

            { pubkey: item_seller_account, isSigner: false, isWritable: true },
            { pubkey: item_marketplace_account, isSigner: false, isWritable: true },

            { pubkey: item_mint_account, isSigner: false, isWritable: true },

            { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: SYSTEM_KEY, isSigner: false, isWritable: false },
        ];

        const list_instruction = new TransactionInstruction({
            keys: account_vector,
            programId: MARKETPLACE_PROGRAM,
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
                return;
            }
        } catch (error) {
            console.log(error);
            return;
        }
    }, [wallet, list_price, list_quantity, bearer_token]);

    /*
    const UpdateItemOnMarketplace = useCallback( async (index : number) => 
    {
       
        if (wallet.publicKey === null || wallet.signTransaction === undefined)
            return;

        
        let desired_listing = listings[index];
        let seed_bytes = uInt32ToLEBytes(desired_listing.seed);

        let marketplace_account = (PublicKey.findProgramAddressSync([Buffer.from("marketplace_account")], MARKETPLACE_PROGRAM))[0];
        let listing_data_account = (PublicKey.findProgramAddressSync([wallet.publicKey.toBytes(), seed_bytes], MARKETPLACE_PROGRAM))[0];
        let item_mint_account = new PublicKey('8EkVPhtDGpAaqqdtVAsCQG9E3LWcbaWz4JNFVdvLrbcb');


        let item_seller_account = await getAssociatedTokenAddress(
            item_mint_account, // mint
            wallet.publicKey, // owner
            true // allow owner off curve
        );


        let item_marketplace_account = await getAssociatedTokenAddress(
            item_mint_account, // mint
            marketplace_account, // owner
            true // allow owner off curve
        );

        let price_bn = new BN(list_price);
        const instruction_data = serialise_Marketplace_update_instruction(MarketplaceInstruction.update_item, list_quantity, price_bn);

        var account_vector  = [
            {pubkey: wallet.publicKey, isSigner: true, isWritable: true},
            {pubkey: listing_data_account, isSigner: false, isWritable: true},
            {pubkey: marketplace_account, isSigner: false, isWritable: true},

            {pubkey: item_seller_account, isSigner: false, isWritable: true},
            {pubkey: item_marketplace_account, isSigner: false, isWritable: true},

            {pubkey: item_mint_account, isSigner: false, isWritable: true},

            {pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
            {pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
            {pubkey: SYSTEM_KEY, isSigner: false, isWritable: false}
        ];


        const list_instruction = new TransactionInstruction({
            keys: account_vector,
            programId: MARKETPLACE_PROGRAM,
            data: instruction_data
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
                console.log(transaction_response)
                return;
            }

        } catch(error) {
            console.log(error);
            return;
        }

 

    },[wallet, listings, list_price, list_quantity, bearer_token]);
*/

    return (
        <Center width="80%" marginBottom="5rem">
            <VStack width="100%" alignItems="left">
                <div style={{ marginTop: "1rem" }}></div>
                <div style={{ margin: 0 }}>
                    <Popover
                        returnFocusOnClose={false}
                        isOpen={show_new_listing}
                        onClose={() => setShowNewListing(false)}
                        placement="bottom"
                        closeOnBlur={false}
                    >
                        <PopoverTrigger>
                            <Box as="button" onClick={() => setShowNewListing(true)} borderWidth="2px" borderColor="white" width="180px">
                                <div className="font-face-sfpb">
                                    <Text align="center" fontSize={DUNGEON_FONT_SIZE} color="white">
                                        List New Item
                                    </Text>
                                </div>
                            </Box>
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
                                    Enter Listing Details
                                </PopoverHeader>
                            </div>
                            <PopoverArrow />
                            <PopoverCloseButton ml="1rem" color="white" />
                            <PopoverBody>
                                <FocusLock returnFocus persistentFocus={false}>
                                    <div className="font-face-sfpb">
                                        <VStack align="center">
                                            <HStack width="80%" align={"left"}>
                                                <Box width="50%">
                                                    <Text align={"left"} fontSize={DUNGEON_FONT_SIZE} color="white">
                                                        Item:
                                                    </Text>
                                                </Box>
                                                <Box width="50%">
                                                    <Text align={"left"} fontSize={DUNGEON_FONT_SIZE} color="white">
                                                        Test Item
                                                    </Text>
                                                </Box>
                                            </HStack>
                                            <HStack width="80%" align={"left"}>
                                                <Box width="50%">
                                                    <Text align={"left"} fontSize={DUNGEON_FONT_SIZE} color="white">
                                                        Price:
                                                    </Text>
                                                </Box>
                                                <Box width="50%">
                                                    <NumberInput
                                                        id="desired_price"
                                                        ref={priceRef}
                                                        fontSize={DUNGEON_FONT_SIZE}
                                                        color="white"
                                                        size="lg"
                                                        onChange={(valueString) => {
                                                            setListPrice(checkParseInt(valueString));
                                                            console.log(valueString);
                                                            console.log(priceRef.current);
                                                        }}
                                                        value={list_price >= 0 ? list_price.toString() : ""}
                                                        precision={3}
                                                        borderColor="white"
                                                        min={0}
                                                    >
                                                        <NumberInputField
                                                            height={DUNGEON_FONT_SIZE}
                                                            paddingTop="1rem"
                                                            paddingBottom="1rem"
                                                            borderColor="white"
                                                            autoFocus={false}
                                                        />
                                                    </NumberInput>
                                                </Box>
                                            </HStack>
                                            <HStack width="80%" align={"left"}>
                                                <Box width="50%">
                                                    <Text align={"left"} fontSize={DUNGEON_FONT_SIZE} color="white">
                                                        Quantity:
                                                    </Text>
                                                </Box>
                                                <Box width="50%">
                                                    <NumberInput
                                                        id="desired_quantity"
                                                        ref={quantityRef}
                                                        fontSize={DUNGEON_FONT_SIZE}
                                                        color="white"
                                                        size="lg"
                                                        onChange={(valueString) => {
                                                            setListQuantity(checkParseInt(valueString));
                                                            console.log(quantityRef.current);
                                                        }}
                                                        value={list_quantity >= 0 ? list_quantity.toString() : ""}
                                                        precision={0}
                                                        borderColor="white"
                                                        min={0}
                                                    >
                                                        <NumberInputField
                                                            height={DUNGEON_FONT_SIZE}
                                                            paddingTop="1rem"
                                                            paddingBottom="1rem"
                                                            borderColor="white"
                                                            autoFocus={false}
                                                        />
                                                    </NumberInput>
                                                </Box>
                                            </HStack>

                                            <Box as="button" borderWidth="2px" borderColor="white" width="60px">
                                                <Text
                                                    align="center"
                                                    onClick={ListItemOnMarketplace}
                                                    fontSize={DUNGEON_FONT_SIZE}
                                                    color="white"
                                                >
                                                    LIST
                                                </Text>
                                            </Box>
                                        </VStack>
                                    </div>
                                </FocusLock>
                            </PopoverBody>
                        </PopoverContent>
                    </Popover>
                </div>
                <Box width="100%">
                    <div className="font-face-sfpb" style={{ color: "white", fontSize: DUNGEON_FONT_SIZE }}>
                        <Table className="custom-centered-table">
                            <thead>
                                <tr>
                                    <th></th>
                                    <th>Item</th>
                                    <th>Quantity</th>
                                    <th>Price Per Item (SOL)</th>
                                    <th>Desired Quantity</th>
                                    <th>Total Price</th>
                                    <th>
                                        <Box as="button" onClick={() => check_listings()}>
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
                                <Listings />
                            </tbody>
                        </Table>
                    </div>
                </Box>
            </VStack>
        </Center>
    );
}
