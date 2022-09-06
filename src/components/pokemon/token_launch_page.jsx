import React from "react";
import { ChakraProvider, theme} from '@chakra-ui/react';
import { PokeTokenLaunch } from './token_launch';
import { Link } from "react-router-dom";

function PostContent() {


    return (

        <div className="container">
            <main>

            <h1 className="h1 text-center mb-0 pt-3 font-weight-bold text-body">Take Part In The DaoPlays Pokemon Token Launch!</h1>
            <h1 className="h5 text-center mb-1 pt-0 font-weight-bold text-secondary">September 04 2022</h1>
            <br />

            Earlier this year we decided that we wanted to teach ourselves about blockchain technology, and the first result of that is DaoPlays Pokemon: inspired by the 2016 event 'Twitch Plays Pokemon', it allows users to play through the original Pokemon Red as a decentralized gaming community. Players vote for which move they want to take using 'Play Tokens', and the votes contained within every new block produced on the Solana blockchain will determine the next move taken, resulting in a new move roughly once per second.

            <br/><br/>

            On this page you can pay what you want above a small minimum price of 0.0001 SOL (about 0.3 US cents at time of writing) for a block of 1000 Play Tokens for use in DaoPlays Pokemon.   You can also choose to pay more than the current average to instead receive 2000 Play Tokens and a DaoPlays Supporter Token.   Right now this is the only way to receive Supporter Tokens, which will be used in the future to allow owners to take part in governance votes, and potentially to unlock cosmetic features or other benefits in future apps. 

            <br/><br/>

            While our main motivation was to learn, we also wanted to take the opportunity to raise money for charity, and as such every aspect of the app allows users to decide how much of what they pay goes to charity via <a  style={{textDecoration: "underline"}}  href="https://thegivingblock.com/">The Giving Block</a>, and which charity it goes to from a curated list. At present the way The Giving Block verifies that donation accounts are genuine is to have the owner tweet the transactions associated with an initial donation to the accounts in question, which they then confirm manually.  You can find the tweets announcing our initial donations <a style={{textDecoration: "underline"}} href="https://twitter.com/dao_plays/status/1560632420960849921">here</a>, and The Giving Block's verification of those accounts <a style={{textDecoration: "underline"}} href="https://twitter.com/TheGivingBlock/status/1560643494556958720">here</a>.   
            
            <br/><br/>
            
            For a more detailed description of how the token launch program works please see  <Link style={{textDecoration: "underline"}} to="/blog/charity_token_launch">this</Link> blog post.  The only difference between the version described in that post and the version here is that the Play Tokens have had their mint authority retained.  This is simply to ensure that in the unlikely event that users simply hold onto their tokens, rather than returning them to the pool by using them to vote for moves, more can be released for legitimate players.

            <br/><br/>

            This token launch has been funded with 50 million Play Tokens, which is enough for between 25 and 50 thousand participants, and will shut down when those tokens have been exhausted.  From that point on the only way to receive Play Tokens from DaoPlays directly will be by taking part in the token auction with other users (for more details please see our blog post on the token auction system <Link style={{textDecoration: "underline"}} to="/blog/charity_auction">here</Link>).

            <br/><br/>

            Thank you in advance for taking part in DaoPlays Pokemon, and for raising money for these great causes.  If you'd like to stay up to date with our future apps then go ahead and follow us on <a style={{textDecoration: "underline"}} href="http://www.twitter.com/dao_plays">Twitter</a>.

            <br/><br/>

            <PokeTokenLaunch/>
            
            </main>
        </div>
    

    );
}

function PokeTokenLaunchPage() {
    return (
        <ChakraProvider theme={theme}>
                <PostContent />
                
        </ChakraProvider>
        
    );
    }

export default PokeTokenLaunchPage;
