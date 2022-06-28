import { Box } from "@chakra-ui/react";
import React from "react";
import { Link } from "react-router-dom";
import { RowCard } from "../Cards"

function Posts() {
    const getting_started = {
        title:"Getting Started With Solana",
        sub_title:"June 28 2022",
        post_text:"Starting with the basics! This post goes through how to set up both a file-system wallet using the Solana command line interface, and a browser wallet using Phantom. We'll then import one into the other, and will go through why this is not as trivial as it may sound...",
        image:"solana.jpg"
    
    };

    return (
        <div className="home">
            <div class="container">

                <Box marginBottom={"20px"} />
                
                <Link to="/blog/solana_getting_started">
                    <RowCard {...getting_started}/>
                </Link>

                <Box marginBottom={"20px"} />
                
            </div>
        </div>
    );
}

export default Posts;
