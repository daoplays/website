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
        sub_title:"July 03 2022",
        post_text:"In this post we implement a simple on-chain program in order to compare a few different random number generators. Their state can be easily maintained on-chain, and used in programs where an oracle is just overkill.",
        image:"matrix.jpg",
        display_image: !isMobile
    
    };


    const pyth_seeds = {
        title:"Using Pyth To Seed A Random Number Generator",
        sub_title:"July 05 2022",
        post_text:"Continuing our random numbers theme,  we extend the previous post by looking at seeding your on-chain random number generator using a combination of Pyth (a price oracle) with the Xorshift and Murmur based methods from the previous post.",
        image:"pyth.jpg",
        display_image: !isMobile
    
    };

    const charity_ico = {
        title:"A Charitable Solana Token Launch with The Giving Block",
        sub_title:"July 16 2022",
        post_text:"We go through the process of setting up a 'pay what you want' token launch where participants get to choose how much of the payment goes to charity, and get a bonus if they pay more than the current average",
        image:"givingblock.jpg",
        display_image: !isMobile
    
    };

    const streamer = {
        title:"Monitoring the Solana BlockChain in Real Time",
        sub_title:"July 27 2022",
        post_text:"Here we describe our process for monitoring the Solana blockchain for interactions with an on-chain program, and then storing those interactions in a database so that we can update the state of an app in real time as each new block is produced.",
        image:"quicknode.png",
        display_image: !isMobile
    
    };

    return (
        <div className="home">
            <div className="container">

                <Box marginBottom={"20px"} />

                <Link to="/blog/solana_streamer">
                    <RowCard {...streamer}/>
                </Link>
                <br />

                <Link to="/blog/charity_token_launch">
                    <RowCard {...charity_ico}/>
                </Link>
                <br />
                <Link to="/blog/pyth_seeds">
                    <RowCard {...pyth_seeds}/>
                </Link>

                <br />
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
