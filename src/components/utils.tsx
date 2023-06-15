import React, { useRef, useCallback, useEffect, useState } from "react";

import { Text, Center } from "@chakra-ui/react";

function CheckTransactionSignature({ current_signature }: { current_signature: React.MutableRefObject<string | null> }) {
    const signature_interval = useRef<number | null>(null);
    const signature_check_count = useRef<number>(0);

    const [transaction_failed, setTransactionFailed] = useState<boolean>(false);
    const [processing_transaction, setProcessingTransaction] = useState<boolean>(false);

    interface SignatureResponseData {
        id: number;
        jsonrpc: string;
        result: {
            context: {
                apiVersion: string;
                slot: number;
            };
            value: [
                {
                    confirmationStatus: string;
                    confirmations: number;
                    err: string | null;
                    slot: number;
                },
            ];
        } | null;
    }

    async function postData(url = "", bearer = "", data = {}) {
        // Default options are marked with *
        const response = await fetch(url, {
            method: "POST", // *GET, POST, PUT, DELETE, etc.
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${bearer}`,
            },
            body: JSON.stringify(data), // body data type must match "Content-Type" header
        });
        return response.json(); // parses JSON response into native JavaScript objects
    }

    const CheckSignature = useCallback(async () => {
        if (current_signature.current === null) return;

        var body = {
            id: 1,
            jsonrpc: "2.0",
            method: "getSignatureStatuses",
            params: [[current_signature.current], { searchTransactionHistory: true }],
        };

        var response_json = await postData("https://api.devnet.solana.com", "", body);
        let signature_response: SignatureResponseData = response_json;

        if (response_json.result === undefined) {
            if (response_json.error !== undefined) {
                console.log(response_json.error);
            }
            return false;
        }

        if (response_json.result === null) return;

        if (signature_response === null) {
            return;
        }

        console.log(signature_response);
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
    }, [current_signature]);

    // interval for checking signatures
    useEffect(() => {
        if (signature_interval.current === null) {
            signature_interval.current = window.setInterval(CheckSignature, 1000);
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
    }, [CheckSignature]);

    if (transaction_failed) {
        return (
            <Center>
                <Text textAlign="center" color="red">
                    Transaction Failed.
                </Text>
            </Center>
        );
    }

    if (processing_transaction) {
        return (
            <Center>
                <Text textAlign="center" color="black">
                    Processing Transaction
                </Text>
            </Center>
        );
    }

    return <></>;
}
