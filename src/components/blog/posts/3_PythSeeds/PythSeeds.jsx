import React from "react";
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { RandomExample } from '../../apps/Random_Example';
import {Card, Table} from 'react-bootstrap';
import { ChakraProvider, theme, Box, HStack, VStack, Center, Flex, Image } from '@chakra-ui/react';
import { isMobile } from "react-device-detect";
import MathJax from 'react-mathjax';
import { SeedExample } from '../../apps/Seed_Example';

import entropy from "./entropy.png"
import entropy_diffs from "./diffs_entropy.png"

function PostContent() {

const BTC_example = 
`// in processor.rs 
let account_info_iter = &mut accounts.iter();
let BTC_key =   Pubkey::from_str("HovQMDrbAgAYPCmHVSrezcSmkMtXSSUsLDFANExrZh2J").unwrap();

// first accounts are the Pyth oracles
let BTC_account_info = next_account_info(account_info_iter)?;

// check the accounts match what we expect
if  BTC_account_info.key != &BTC_key
{
    return Err(ProgramError::InvalidAccountData);
}

// get the price and confidence interval from Pyth
let btc_price_feed = load_price_feed_from_account_info( &BTC_account_info ).unwrap();
let btc_price_struct = btc_price_feed.get_current_price().unwrap();

// the value is an i64, so first convert to a u64
// for currencies this should be fine, but if you want a derivitives time series bear in mind that can go negative
let btc_price_value = u64::try_from(btc_price_struct.price).unwrap();
let btc_price_error = btc_price_struct.conf;`

const BTC_shifted = 
`// in processor.rs 
let mut seed_values = SeedStruct { seed_prices : [0; 9] };
seed_values.seed_prices[0] = Self::shift_seed(Self::shift_seed(btc_price_value + btc_price_error));
seed_values.seed_prices[1] = Self::shift_seed(Self::shift_seed(btc_price_value));
seed_values.seed_prices[2] = Self::shift_seed(Self::shift_seed(btc_price_value - btc_price_error));`

const seed_result = 
`// in processor.rs 
let mut vec_to_hash = unsafe{Self::any_as_u8_slice(&seed_values)};
let h = murmur3_x64_128(&mut vec_to_hash, 0).unwrap();

// we can take our 128bit number and get two 64bit values
let lower  = u64::try_from(h & 0xFFFFFFFFFFFFFFFF).unwrap();
let upper  = u64::try_from((h >> 64) & 0xFFFFFFFFFFFFFFFF).unwrap();

let seed = lower ^ upper;
let seed_double = Self::generate_random_f64(seed);`

    return (

    <div className="home">
        <div class="container">

            <h1 className="h1 text-center mb-0 pt-3 font-weight-bold text-body">Using Pyth To Seed A Random Number Generator</h1>
            <h1 className="h5 text-center mb-1 pt-0 font-weight-bold text-secondary">July 03 2022</h1>
            <br />
            <p>

                In our previous post on random numbers we tested out a few different methods of generating random numbers on chain. In this instance everything about the RNG sequence is transparent, which is great for being trustless, but without any input from off-chain it means the functionality is limited to scenarios where the value that can be derived from the random numbers must be less than any transaction costs required to cheat the system.
                <br/><br/>

                In this post we are going to extend the functionality by  using  off-chain information in the form of the oracle Pyth. Pyth allows you to get  price time series  information for a wide range of crypto and non-crypto assets, and at least currently it is free to use and has very low computational cost to access the price stream.

                <br/><br/>

                By using Pyth as an oracle we can generate a seed on-chain whenever we want, and then make use of the generators we described previously to make our sequence of random values.  I still wouldn't recommend using this within the same block as a bidder for a gambling app, but if you have an app like a raffle where winners are selected some time after entries have closed then this should work.  The longer you leave it before selecting the better it will be as the less certain anyone can be about the price at the point in time the winners are selected.

                <br/><br/>

                In our example we will use price series from three streams, BTC, ETH and SOL.  You could use more if you wanted.  

                <br /><br /></p>   
                <SyntaxHighlighter language="rust" style={docco}>
                {BTC_example}
                </SyntaxHighlighter>
                <p><br />

                For each stream we first check the the public key passed to the program is the one that we expected, to make sure that noone is able to pass their own key and start sending the program fake data.

                The current price can then be accessed using the load_price_feed_from_account_info, and get_current_price functions.  This returns a struct containing the price as a 64bit integer, a confidence interval as an unsigned 64bit interval, and also the number of decimal places, which we aren't interested in here.    

                For our purposes we are only including the prices of crypto currencies, so we can safely convert from the interger price to an unsigned integer, but note that if you are taking a derivitive price that can go negative you may want to be more careful here.

                <br /><br /></p>   
                <SyntaxHighlighter language="rust" style={docco}>
                {BTC_shifted}
                </SyntaxHighlighter>
                <p><br />  

                We then start to fill up our array of seed prices.  For each stream we construct three prices, the current price plus the confidence interval, the current price, and the current price minus the confidence interval.  For each of these we use the Xorshift* random number generator to shift the value twice, so that we magnify any small differences in these values to cover the whole of the space of u64 values. 

                <br /><br /></p>   
                <SyntaxHighlighter language="rust" style={docco}>
                {seed_result}
                </SyntaxHighlighter>
                <p><br />  

                Once we have our 9 prices (3 per stream) we then use the murmur3 hash function described previously to hash our struct into a 128 bit unsigned integer.  As a final step we take the upper and lower 64 bits of that number and XOR them together to get our final 64bit unsigned int seed.  For the purposes of this post we then also convert that to a floating point value in the range[0..1) so that we can more easily compute some statistics on it to compare to the expected uniform distribution.

                <br/><br/>

                Although this may seem like a lot of work just to get the seed, we can see that it has paid off from the statistical properties of the seeds we generate.  We computed 10000 seeds in a row on the solana devnet and compared the entropy of the histogram of those values to the distribution of entropies calculated from a series of 10000 random values from numpys uniform random distribution.  Both the entropy of the seeds, and the entropy of the absolute deltas between successive seeds was consistent with the numpy random numbers.

                <br/><br/>

                We can also see how much changing any digit of any of the prices or confidence intervals changes the value.
            

            </p>
            <br/><br/>
            <SeedExample/>

            <br/><br/>

            <Flex maxWidth="100%" >
                <Image src={entropy}/>
                <Image src={entropy_diffs}/>
            </Flex>

            Thanks to Zantetsu | Shinobi Systems on the Solana Tech discord for the discussion that led to this post!

            


        </div>
    </div>

    );
}

function PythSeeds() {
    return (
        <ChakraProvider theme={theme}>
                <PostContent />
        </ChakraProvider>
    );
    }

export default PythSeeds;
