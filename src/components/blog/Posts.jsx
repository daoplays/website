import { Box } from "@chakra-ui/react";
import React from "react";
import { Link } from "react-router-dom";
import { RowCard } from "../Cards"
import { isMobile } from "react-device-detect";

function Posts() {
    const getting_started = {
        title:"Getting Started With Solana",
        sub_title:"June 28 2022",
        post_text:"Starting with the basics! This post goes through how to set up both a file-system wallet using the Solana command line interface, and a browser wallet using Phantom. We'll then import one into the other, and will go through why this is not as trivial as it may sound...",
        image:"solana.jpg",
        display_image: !isMobile
    
    };

    const random_numbers = {
        title:"Random Numbers With Solana",
        sub_title:"June 25 2022",
        post_text:"In this post we implement a simple on-chain program that has a couple of random number generators that takes a seed off-chain, and then generates uniform doubles on chain",
        image:"matrix.jpg",
        display_image: !isMobile
    
    };

    return (
        <div className="home">
            <div class="container">

                <Box marginBottom={"20px"} />

                <Link to="/blog/random_numbers">
                    <RowCard {...random_numbers}/>
                </Link>

                <br />
                
                <Link to="/blog/solana_getting_started">
                    <RowCard {...getting_started}/>
                </Link>               
            </div>
        </div>
    );
}

export default Posts;
