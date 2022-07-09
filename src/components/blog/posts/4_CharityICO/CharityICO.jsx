import React from "react";
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { ChakraProvider, theme, Box, HStack, VStack, Center, Image } from '@chakra-ui/react';
import { isMobile } from "react-device-detect";
import MathJax from 'react-mathjax';
import { CharityDapp } from '../../apps/charity';


function PostContent() {

    return (

    <div className="home">
        <div class="container">

            <h1 className="h1 text-center mb-0 pt-3 font-weight-bold text-body">Launching an ICO for a Solana Token While Charity Fundraising with The Giving Block</h1>
            <h1 className="h5 text-center mb-1 pt-0 font-weight-bold text-secondary">July 05 2022</h1>
            <br />
            <p>

            </p>
            <br/>
                <ul>
                    <li>Create a Solana Token and give it a name and icon</li>
                    <li>Use TCG to create wallets for charities</li>
                    <li>Create a ICO program that incorporates giving through TCG</li>
                    
                </ul>
            <br/>

            <h2 className="mt-5" style={{fontSize: "20px"}}>Create a Solana Token and give it a name and icon</h2><br />
            <p>

   

https://app.strataprotocol.com/launchpad/manual/new


            </p>
            https://thegivingblock.com/campaigns/ukraine-emergency-response-fund/
            https://thegivingblock.com/donate/water-org/
            https://thegivingblock.com/donate/one-tree-planted/
            https://thegivingblock.com/donate/evidence-action/
            https://thegivingblock.com/donate/girls-who-code/
            https://thegivingblock.com/donate/outright-action-international/
            https://thegivingblock.com/donate/the-life-you-can-save/

            <br/><br/>

            <CharityDapp/>
        </div>
    </div>

    );
}

function CharityICO() {
    return (
        <ChakraProvider theme={theme}>
                <PostContent />
        </ChakraProvider>
    );
    }

export default CharityICO;
