import React from "react";
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { ChakraProvider, theme, Code } from '@chakra-ui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { solid } from '@fortawesome/fontawesome-svg-core/import.macro' // <-- import styles to be used
import { CharityAuctionDapp } from '../../apps/charity_auction';

const state_1 =
`// in state.rs
pub struct State {

    // The last time we chose winners, used to compute how soon we can choose again
    pub prev_selection_time: i64,

    // the number of active bids in the system up to MAX_BIDDERS
    pub n_bidders: u16,
    // the sum of all the current bids
    pub total_bid_amount : u64,

    // for each bid we track the key, amount and time
    pub bid_keys : [Pubkey; MAX_BIDDERS],
    pub bid_amounts: [u64; MAX_BIDDERS],
    pub bid_times: [i64; MAX_BIDDERS],

    // the number of winners to be chosen, up to MAX_WINNERS, and their keys
    pub n_winners : u8,
    pub winners: [Pubkey; MAX_WINNERS],

    // summary of the charity stats for the auction
    pub charity_data : CharityData
}`


const state_2 = 
`// in state.rs
// we can't unpack  the whole state in one go due to stack limits on chain.
// we create an enum to make it easier to access elements  within the state
pub enum StateEnum {

    PrevSelectionTime,

    NBidders,
    TotalBidAmount,

    BidKeys{
        index: usize
    },
    BidAmounts{
        index: usize
    },
    BidTimes{
        index: usize
    },

    NWinners,
    Winners{
        index: usize
    },

    CharityData  
}`

const state_3 =
`// in state.rs
pub fn get_state_index(element: StateEnum) -> (usize, usize) {

    match element {

        // the unix timestamp that winners were last selected, 8 bytes
        StateEnum::PrevSelectionTime => {(0, 8)}
    
        // the number of bidders, 2 bytes
        StateEnum::NBidders => {(8, 10)}
        // the total amount bid currently in the ladder, 8 bytes
        StateEnum::TotalBidAmount => {(10, 18)},

        // the list of bidder pubkeys, each is 32 bytes
        StateEnum::BidKeys{index} => {(18 + index * 32, 18 + (index + 1) * 32)},
        // the list of corresponding bid amounts, each is 8 bytes
        StateEnum::BidAmounts{index} => {(32786 + index * 8, 32786 + (index + 1) * 8)},
        // the list of corresponding bid amounts, each is 8 bytes
        StateEnum::BidTimes{index} => {(40978 + index * 8, 40978 + (index + 1) * 8)},

        // the number of winners selected, 1 byte
        StateEnum::NWinners => {(49170, 49171)},
        // pubkeys of the selected winners, each is 32 bytes
        StateEnum::Winners{index} => {(49171 + index * 32, 49171 + (index + 1) * 32)},
        
        // the Charity data is 80 bytes
        StateEnum::CharityData => {(49299, 49379)}
    }
}`

const state_4 =
`pub struct BidValues {
    pub bid_amounts: [u64; BID_BLOCK],
}

pub struct BidTimes {
    pub bid_times: [i64; BID_BLOCK],
}

pub struct WinnersKeys {
    pub keys: [Pubkey; MAX_WINNERS],
}`

const init_1 =
`let program_data_account = Pubkey::create_with_seed(
    &daoplays,
    "data_account",
    &program,
)?;`


const init_2 =
`let data_size: usize = 49381;
let space : u64 = data_size.try_into().unwrap();
let lamports = rent::Rent::default().minimum_balance(data_size);

let instruction = solana_sdk::system_instruction::create_account_with_seed(
    &wallet.pubkey(),
    &data_account,
    &wallet.pubkey(),
    "data_account",
    lamports,
    space,
    &program,
);`

const bid_1 = 
`...

// get the bid index from the bidders account
let bidder_data = BidderData::try_from_slice(&bidder_data_account_info.data.borrow()[..])?;


// when adding the bid to the program state we have three possibilities:
// i) there is already a bid and we just accumulate
// ii) there is no bid but there is an empty spot
// iii) there is no bid and no empty spot, so we replace the oldest bid

// start by checking if a bid exists
let mut bidders_index = bidder_data.index as usize;

// check the public key that is present in the data account at bid_index
let key_idx = get_state_index(StateEnum::BidKeys{index: bidders_index});
let key = Pubkey::try_from_slice(&program_data_account_info.data.borrow()[key_idx.0..key_idx.1])?;

...`


const bid_1_2 = 
`...

// if the keys match then we accumulate the bid
// otherwise it must be a new bid
if key == *bidder_token_account_info.key {

    // get the old bid
    let old_bid_idx = get_state_index(StateEnum::BidAmounts{index: bidders_index});
    let old_bid =  u64::try_from_slice(&program_data_account_info.data.borrow()[old_bid_idx.0..old_bid_idx.1])?;
                    
    new_bid += old_bid;
}

...`

const bid_2 =
`...

// if they were a new bidder add their bid to the ladder, first just try and find the first open spot
let mut found_space = false;
 
// if there isn't a space we will want to replace the oldest bid
// so we find  that in the same loop
let mut oldest_bid_index : usize = 0;
let mut oldest_time = i64::MAX;
for i in 0..N_BID_BLOCKS {


    let time_idx = get_state_index(StateEnum::BidTimes {index: i * BID_BLOCK});
    let times = BidTimes::try_from_slice(&program_data_account_info.data.borrow()[time_idx.0..time_idx.0 + BID_BLOCK * 8])?; 

    for j in 0..BID_BLOCK {

        let total_index = i * BID_BLOCK + j;

        // if the bid time is zero that indicates we have found an empty slot, so break out of the loop
        if times.bid_times[j] == 0 {
            bidders_index = total_index;
            found_space = true;
            break
        }

        // otherwise check if this is older than the oldest known bid so far
        if times.bid_times[j] < oldest_time {
            oldest_bid_index = total_index;
            oldest_time = times.bid_times[j];
        }
    }

    if found_space {
        break;
    }
}

...`

const bid_3 =
`...

// if there was no open spot we overwrite the oldest bid
if !found_space {

    bidders_index = oldest_bid_index;

    // if we are overwriting we need to subtract bid_amount and reduce n_bidders by one
    let existing_bid_idx = get_state_index(StateEnum::BidAmounts{index: bidders_index});
    let existing_bid = u64::try_from_slice(&program_data_account_info.data.borrow()[existing_bid_idx.0..existing_bid_idx.1])?;
    total_bid -= existing_bid;
    n_bidders -=1;
}

...
`

const bid_4 = 
`...

// update their bid data
let new_bidder_data = BidderData {index: bidders_index as u16};
new_bidder_data.serialize(&mut &mut bidder_data_account_info.data.borrow_mut()[..])?;

...
`

const bid_5 =
`...

msg!("update bid details for position {}", bidders_index);

// insert the new bid, key and time into the program data
let new_bid_idx = get_state_index(StateEnum::BidAmounts{index: bidders_index});
let new_key_idx = get_state_index(StateEnum::BidKeys{index: bidders_index});
let new_time_idx = get_state_index(StateEnum::BidTimes{index: bidders_index});

let bidder_token_pubkey = *bidder_token_account_info.key;

// serialize the new data
new_bid.serialize(&mut &mut program_data_account_info.data.borrow_mut()[new_bid_idx.0..new_bid_idx.1])?; 
bidder_token_pubkey.serialize(&mut &mut program_data_account_info.data.borrow_mut()[new_key_idx.0..new_key_idx.1])?; 
current_time.serialize(&mut &mut program_data_account_info.data.borrow_mut()[new_time_idx.0..new_time_idx.1])?;  

// update total bid
total_bid.serialize(&mut &mut program_data_account_info.data.borrow_mut()[total_bid_idx.0..total_bid_idx.1])?; 

//  update n_bidders
n_bidders += 1;
n_bidders.serialize(&mut &mut program_data_account_info.data.borrow_mut()[n_bidders_idx.0..n_bidders_idx.1])?; 
`
const win_1 = 
`pub fn get_bid_state(max_time : i64, program_data_account_info : &AccountInfo) ->  Result<(u16, u64), ProgramError> {


    // calculate the total bid amount and number of bidders at this time
    let mut total_bid : u64 = 0;
    let mut n_bidders : u16 = 0;
    for idx in 0..N_BID_BLOCKS {
        let bid_idx = get_state_index(StateEnum::BidAmounts {index: idx*BID_BLOCK});
        let time_idx = get_state_index(StateEnum::BidTimes {index: idx*BID_BLOCK});

        let bids = BidValues::try_from_slice(&program_data_account_info.data.borrow()[bid_idx.0..bid_idx.0 + BID_BLOCK*8])?; 
        let times = BidTimes::try_from_slice(&program_data_account_info.data.borrow()[time_idx.0..time_idx.0 + BID_BLOCK*8])?; 

        for jdx in 0..BID_BLOCK {
            if times.bid_times[jdx] < max_time && bids.bid_amounts[jdx] > 0 {
                total_bid += bids.bid_amounts[jdx];
                n_bidders += 1;
            }

        }
    }

    Ok((n_bidders, total_bid))
    
}
`


const win_2_1 =
`
pub fn check_winners_state<'a>(
    n_bidders : u16, 
    program_data_account_info : &AccountInfo<'a>,
    program_token_account_info : &AccountInfo<'a>
) ->  Result<u8, ProgramError> {

    // if there are no bidders then we have no-one to choose
    if n_bidders == 0 {
        msg!("no bidders to be able to select winners");
        return Ok(0);
    }

...`


const win_2_2 =
`...

    // if there aren't enough tokens available then we can't choose winners
    let min_tokens: u64 = TOKENS_WON;
    let program_token_account = spl_token::state::Account::unpack_unchecked(&program_token_account_info.try_borrow_data()?)?;

    let token_balance = program_token_account.amount;
    if token_balance < min_tokens {
        msg!("insufficient tokens in program account to select new winners: {} < {}", token_balance, min_tokens);
        return Ok(0);
    }

...`


const win_2_3 =
`...

    let max_token_blocks = token_balance / TOKENS_WON;

    // set the number of winners to the max and check if we should decrease from there
    let mut n_winners = MAX_WINNERS as u8;

    // check if we have enough token blocks for this many
    if n_winners as u64 > max_token_blocks {
        n_winners = max_token_blocks as u8;
    }

    // finally check if we have enough bidders for this
    let max_winners_from_bidders = n_bidders / 64 + 1;
    if n_winners as u16 > max_winners_from_bidders {
        n_winners = max_winners_from_bidders as u8;
    }

 ...`


const win_2_4 =
`...

    let prev_time_idx = get_state_index(StateEnum::PrevSelectionTime);
    let prev_time_selected = i64::try_from_slice(&program_data_account_info.data.borrow()[prev_time_idx.0..prev_time_idx.1])?;

    let clock = Clock::get()?;
    let current_time = clock.unix_timestamp;
    let time_passed = (current_time - prev_time_selected) as f64;

    // on average we expect a single bidder to wait 5 minutes before being selected
    // we therefore calculate time_per_bidder based on the number of bidders, and number of winners being selected
    // if this is below 10 seconds we just allow new winners to be selected so that there is less friction with large
    // numbers of bidders

    let time_per_bidder = (5.0 * 60.0) / ((n_bidders as f64) / (n_winners as f64));
    
    msg!("time_per_bidder {} time_passed: {} n_bidders {} token_balance {} max_blocks {}", time_per_bidder, time_passed, n_bidders, token_balance, max_token_blocks);

    if time_per_bidder > 3.0 && time_passed < time_per_bidder {
        return Ok(0);
    }

    msg!("Selecting {} new winners! ({} {})", n_winners, max_token_blocks, max_winners_from_bidders);

    Ok(n_winners)
}`

const win_3 =
`...

// generate the seed for selecting winners
let mut pyth_random = randoms::generate_seed(
    btc_account_info,
    eth_account_info,
    sol_account_info
);

let mut ran_vec : Vec<f64> = Vec::new();
for _winner in 0..n_winners {
    pyth_random = randoms::shift_seed(pyth_random);
    let random_f64 = randoms::generate_random(pyth_random);

    ran_vec.push(random_f64);
}

ran_vec.sort_by(|a, b| a.partial_cmp(b).unwrap());

...`


const win_4 =
`...

// initialize the starting state
let mut cumulative_total : u64 = 0;
let mut winners_found : [bool; MAX_WINNERS] = [false; MAX_WINNERS];

for idx in 0..N_BID_BLOCKS {

    let bid_idx = get_state_index(StateEnum::BidAmounts {index: idx*BID_BLOCK});
    let mut bids = BidValues::try_from_slice(&program_data_account_info.data.borrow()[bid_idx.0..bid_idx.0 + BID_BLOCK*8])?; 

    let time_idx = get_state_index(StateEnum::BidTimes {index: idx*BID_BLOCK});
    let times = BidTimes::try_from_slice(&program_data_account_info.data.borrow()[time_idx.0..time_idx.0 + BID_BLOCK*8])?; 

    for current_winner in 0..n_winners {

        if winners_found[current_winner as usize] {
            continue;
        }

        // update the threshold
        let random_f64 = ran_vec[current_winner as usize];
        let threshold = ((valid_total_bid as f64) * random_f64) as u64;

...`

const win_4_2 =
`...
        let mut sub_total : u64 = cumulative_total;
        for bid_index in 0..BID_BLOCK {

            // check if this is within the time threshold
            if times.bid_times[bid_index] >= threshold_time {
                continue;
            }
            
            let current_bid =  bids.bid_amounts[bid_index];
            sub_total += current_bid;

            if sub_total > threshold {

                winners_found[current_winner as usize] = true;

...`

const win_4_3 =

`...

                let winner_index = idx * BID_BLOCK + bid_index;

                // get the winners key from the program data account
                let key_idx = get_state_index(StateEnum::BidKeys{index: winner_index});
                let winners_key = Pubkey::try_from_slice(&program_data_account_info.data.borrow()[key_idx.0..key_idx.1])?; 

                // and insert it into the winners array
                let winner_idx = get_state_index(StateEnum::Winners{index: current_winner as usize});
                winners_key.serialize(&mut &mut program_data_account_info.data.borrow_mut()[winner_idx.0..winner_idx.1])?; 

                // now clear the winners data in the program data account
                // start by zero'ing their bid
                let win_bid_idx = get_state_index(StateEnum::BidAmounts {index: winner_index});
                0u64.serialize(&mut &mut program_data_account_info.data.borrow_mut()[win_bid_idx.0..win_bid_idx.1])?;  

                // then the bid time
                let win_time_idx = get_state_index(StateEnum::BidTimes{index: winner_index});
                0i64.serialize(&mut &mut program_data_account_info.data.borrow_mut()[win_time_idx.0..win_time_idx.1])?;  

                // and then clear their key
                solana_program::system_program::id().serialize(&mut &mut program_data_account_info.data.borrow_mut()[key_idx.0..key_idx.1])?;

...`

const win_4_4 =
`...

                // finally decrement the number of bidders, and the total bid amount
                valid_n_bidders -= 1;
                valid_total_bid -= current_bid;

                n_bidders -= 1;
                total_bid -= current_bid;

                bids.bid_amounts[bid_index] = 0;

                break;

            }
        }

        // if this winner wasn't found in this block, move onto the next block
        if winners_found[current_winner as usize] == false {

            cumulative_total = sub_total;

            break;
        }
    }
}

...`

const win_5 =
`...
        
// update number of bidders
let n_bidders_idx = get_state_index(StateEnum::NBidders);
n_bidders.serialize(&mut &mut program_data_account_info.data.borrow_mut()[n_bidders_idx.0..n_bidders_idx.1])?;

// update total_bid_amount
let total_bid_idx = get_state_index(StateEnum::TotalBidAmount);
total_bid.serialize(&mut &mut program_data_account_info.data.borrow_mut()[total_bid_idx.0..total_bid_idx.1])?;

let prev_time_idx = get_state_index(StateEnum::PrevSelectionTime);
current_time.serialize(&mut &mut program_data_account_info.data.borrow_mut()[prev_time_idx.0..prev_time_idx.1])?;  
`

const send_tokens_1 =
`
 // now check how many winners we expect and make sure the keys match the program data
 let n_winners_idx = get_state_index(StateEnum::NWinners);
 let n_winners = u8::try_from_slice(&program_data_account_info.data.borrow()[n_winners_idx.0..n_winners_idx.1])?;

 if n_winners == 0 {
     msg!("No winners selected, exiting send_tokens");
     return Ok(());
 }

 msg!("have {} winners to send tokens to", n_winners);`

 const send_tokens_2_1 =
 `...

 // get the winner's account info
 let mut winners_account_info : Vec<&AccountInfo> = Vec::new();
 for _w_idx in 0..n_winners {

     if account_info_iter.peek().is_some() {
         winners_account_info.push(next_account_info(account_info_iter)?);
     }
     else {
         msg!("n_winners {} exceeds the number of accounts passed", n_winners);
         return Ok(());
     }
 }

 // check that was the last account
 if account_info_iter.peek().is_some() {
     msg!("n_winners {} is less than the number of accounts passed", n_winners);
     return Ok(());
 }

 ...`


 const send_tokens_2_2 =
 `...

 let winners_key_idx = get_state_index(StateEnum::Winners { index: 0 });
 let expected_winners = WinnersKeys::try_from_slice(&program_data_account_info.data.borrow()[winners_key_idx.0..winners_key_idx.0 + 32 * MAX_WINNERS])?;

 // check the winners sent are what we expect
 for w_idx in 0..(n_winners as usize) {
     msg!("winner {} : {}", w_idx, expected_winners.keys[w_idx].to_string());

     if expected_winners.keys[w_idx as usize] != *winners_account_info[w_idx].key {
         msg!("expected winner {} to have key {}", w_idx, winners_account_info[w_idx].key);
         return Err(ProgramError::InvalidAccountData);
     }

     // also check none of the winners are the system program which would indicate we have arrived here too early
     if *winners_account_info[w_idx].key == solana_program::system_program::id() {
         msg!("winner {} has system program key {}", w_idx, winners_account_info[w_idx].key);
         return Err(ProgramError::InvalidAccountData);
     }
 }
...`


 const send_tokens_2_3 =
 `...

 // finally check that the remaining entries in the winners data vec are the system program id
 for w_idx in (n_winners as usize)..MAX_WINNERS {
     msg!("winner {} : {}", w_idx, expected_winners.keys[w_idx as usize].to_string());

     if expected_winners.keys[w_idx] != solana_program::system_program::id() {
         msg!("expected winner {} to have key {}", w_idx, solana_program::system_program::id());
         return Err(ProgramError::InvalidAccountData);
     }
 }
 ...`


 const send_tokens_3 =
 `
 // now we can transfer the tokens

 for w_idx in 0..(n_winners as usize) {

     utils::transfer_tokens(
         TOKENS_WON,
         program_token_account_info,
         winners_account_info[w_idx],
         program_derived_account_info,
         token_program_account_info,
         bump_seed
 
     )?;
 }`

 const send_tokens_4 =
`
 // finally just reset the n_winners value to zero so we can select new winners again
 // and reset all the winners keys to their default
 for current_winner in 0..MAX_WINNERS {

     let winner_idx = get_state_index(StateEnum::Winners{index: current_winner});
     solana_program::system_program::id().serialize(&mut &mut program_data_account_info.data.borrow_mut()[winner_idx.0..winner_idx.1])?; 

 }

 0u8.serialize(&mut &mut program_data_account_info.data.borrow_mut()[n_winners_idx.0..n_winners_idx.1])?;`
function PostContent() {


    return (

        <div className="container">
            <main>

            <h1 className="h1 text-center mb-0 pt-3 font-weight-bold text-body">Running A Charity Token Auction</h1>
            <h1 className="h5 text-center mb-1 pt-0 font-weight-bold text-secondary">August 16 2022</h1>
            <br />

            <h2 id="intro-header" className="mt-5" style={{fontSize: "22px"}}>Introduction</h2><br />
            

            In this post we are going to be building a token auction program for the Solana blockchain.  Participants will be bidding on a block of one hundred tokens, where their chance of being the next winner is proportional to the size of their bid.  They will also be able to decide how much of their bid we keep, and how much we donate to charity, as well as selecting which charity we donate to from a set of provided options.
            
            <br/><br/>

            The more people that take part in the auction the faster new winners will be selected, with new rounds initially spaced out on minute timescales, but reducing to seconds as the number of participants increases.  More people also means more winners will be selected in each round, starting with a single winner and increasing up to four.  A participant's bid will roll over into subsequent rounds and can be added to at any point in order to improve their chances of being chosen as the next winner.

            <br/><br/>
            
            In describing the program we will reference a couple of our previous articles; Firstly we will be using <a  style={{textDecoration: "underline"}}  href="https://pyth.network/">Pyth</a> to seed the random number generators used in the auction using the same process we described <a style={{textDecoration: "underline"}} href="https://www.daoplays.org/blog/pyth_seeds">here</a>, and secondly all the donations will be handled via  <a  style={{textDecoration: "underline"}}  href="https://thegivingblock.com/">The Giving Block</a> as in our charity token launch post <a style={{textDecoration: "underline"}} href="https://www.daoplays.org/blog/charity_token_launch">here</a>.

            <br/><br/>

            We decided to make the chance of winning proportional to the size of the bid in order to make the auction as fair as possible to all participants, and avoid the situation where a small number of high-bidders end up receiving all the tokens.  In order to do this, however, we need to store and process all the prevailing bids in order to produce a cumulative distribution whenever new winners are chosen. Given the limitations on how much computation can be done within a single transaction, we  therefore impose a maximum number of bids that can be tracked at any point in time, which we set to 1024 in this example.  If a new bidder enters the auction when this buffer is full, the oldest bid  at that point in time is lost, and replaced with the new bid.  Participants will however be able to 'refresh' the time of their bid by adding to it, and whenever new winners are selected this naturally frees up space in the buffer.

            <br/><br/>

            In addition to needing to save the size of each bid, we also keep a record of the time each bid is placed.   This is to stop users from placing their bid in the same block that winners are being chosen, which could let them pre-determine the random numbers that will be generated and only bid if they knew they were going to win.   By tracking the times of each bid we can ensure that for each round in the auction, we only include bids that were made a short interval before that round ends.

            <br/><br/>

            The program has four main functions, which we will go through in detail below:

            <br/><br/>
            <ul>
                <li>Create and initialize the program data and derived accounts <a href="#init-header"><FontAwesomeIcon icon={solid('arrow-right')}  /></a></li>
                <li>Place a bid <a href="#bid-header"><FontAwesomeIcon icon={solid('arrow-right')}  /></a></li>
                <li>Choose the set of winners <a  href="#win-header"><FontAwesomeIcon icon={solid('arrow-right')}  /></a></li>
                <li>Send tokens to the winners <a href="#token-header"><FontAwesomeIcon icon={solid('arrow-right')}  /></a></li>
            </ul>

            <br/>

            At the end of the post you will also find a simple front end application that interacts with the token auction program currently running on the Solana devnet. You can skip to it <a href="#token-header" style={{textDecoration: "underline"}} >here</a> if you are interested in trying the final product before working through the code.

            <br/><br/>

            Before going through the program functions themselves, however, we will just have a quick aside on managing large data accounts on the Solana blockchain.

            <h3 id="init-header" className="mt-5" style={{fontSize: "20px"}}>Managing Lots Of Data On Chain</h3><br />

            One issue that we ran up against a lot with this program was the 4kb <a  style={{textDecoration: "underline"}}  href="https://docs.solana.com/developing/on-chain-programs/overview#stack">stack frame</a> that all programs running on the Solana blockchain must limit themselves to.  This means that you need to ensure that you don't use more than 4kb of data within a given scope (for example, within a function).  There are many posts online outlining the issue (for example, <a  style={{textDecoration: "underline"}} href="https://github.com/solana-labs/solana/issues/13391">here</a>), and while there are improvements in the pipeline, for example just increasing this to 8kb, for now programs that have lots of data stored on chain need to be careful how that data is accessed in the program.

            <br/><br/>

            In our case the data on chain is about 50kb, most of which is taken up with the vectors that contain the bid amounts, public keys, and bid times of the auction participant:

            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {state_1}
            </SyntaxHighlighter>
            <br/>

            Note that although we define this in <Code>state.rs</Code> at no point do we ever try and access the whole state on chain, it is there primarily as a reference.  The final entry <Code>charity_data</Code> is the same struct that we used in our charity token launch <a style={{textDecoration: "underline"}} href="https://www.daoplays.org/blog/charity_token_launch">post</a> to store the summary statistics of the donations made and the breakdown per charity.

            <br/><br/>

            In order to try and make it easier to grab different bits of data from this struct we first define the following <Code>enum</Code>, which includes an entry for each item in <Code>State</Code>.  For the vectors the entries take an additional <Code>index</Code> argument,  which is used to specify which element of the vector we want to access:


            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {state_2}
            </SyntaxHighlighter>
            <br/>

            Given this <Code>enum</Code> we then define the following function, <Code>get_state_index</Code>, which takes an entry from <Code>StateEnum</Code> and returns a tuple that provides the start and end bytes for that element of the state.  

            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {state_3}
            </SyntaxHighlighter>
            <br/>

            While this is not the prettiest function, it means that wherever we access an element of <Code>State</Code> in the code we can simply ask for the byte range of that item by doing something like:

            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {`let key_idx = get_state_index(StateEnum::BidKeys{index: 0});`}
            </SyntaxHighlighter>
            <br />
            
            and can then get the start and end bytes by accessing <Code>key_idx.0</Code> and <Code>key_idx.1</Code> without having to repeatedly hard code the values.  If we change the contents of <Code>State</Code> we just update <Code>StateEnum</Code> and <Code>get_state_index</Code> and the rest of the code will work without change.

            <br/><br/>

            While the above would allow us to iterate through the vectors and to grab the elements individually, this is not very computationally cost effective.  We therefore also define a few helped structs to allow  us to access chunks of these vectors in sizes that won't violate the stack frame size.


            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {state_4}
            </SyntaxHighlighter>
            <br/>

            In <Code>state.rs</Code> we define <Code>BID_BLOCK</Code> to be 64, so <Code>BidValues</Code> and <Code>BidTimes</Code> are each 512 bytes.  Although this is well inside the 4kb limit, due to how these structures are accessed within the code trying to make them any larger led to the program violating the stack size limit.


            <h3 id="init-header" className="mt-5" style={{fontSize: "20px"}}>Initializing The Program</h3><br />

            When first initializing the auction program there are four steps that need to be taken:

            <br/><br/>
            <ul>
                <li>Check that the accounts passed are those that are expected</li>
                <li>Create the program's derived account so it can own and transfer tokens</li>
                <li>Create the program's associated token account </li>
                <li>Transfer tokens to the program</li>
                <li>Create a data account to hold all the state for the auction and charity statistics </li>
            </ul>

            <br/>
            
            
           The first three of these tasks are described in detail in our charity token launch post, which you can see <a style={{textDecoration: "underline"}} href="https://www.daoplays.org/blog/charity_token_launch">here</a>.  In this program we just call the <Code>create_program_account</Code>, <Code>create_token_account</Code> and <Code>transfer_tokens</Code> functions described in that post. 

            <br/><br/>

            Unfortunately the final task of creating the program's data account needs to be handled off chain.  This is because there are limitations to the size of the account that can be created on chain of about 10Kb, and we exceed that by some margin.  You can find the code for the rust client that implements this functionality <a style={{textDecoration: "underline"}} href="https://www.daoplays.org/blog/charity_token_launch">here</a>.

            <br/><br/>

            Much like when finding a program derived address, Solana provides the <Code><a style={{textDecoration: "underline"}}  href="https://docs.rs/solana-program/latest/solana_program/pubkey/struct.Pubkey.html#method.create_with_seed">create_with_seed</a></Code> function to determine the address of a data account using a seed phrase and a <Code>base_key</Code>.  These are passed as arguments along with the public key of the owner (the program in this case): 

            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {init_1}
            </SyntaxHighlighter>

            <br/>

            The public key generated by this function can then be passed to the <Code><a style={{textDecoration: "underline"}}  href="https://docs.rs/solana-sdk/latest/solana_sdk/system_instruction/fn.create_account_with_seed.html">create_account_with_seed</a></Code> function, along with the size of the account and the balance that needs to be transferred to ensure it is rent exempt:

            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {init_2}
            </SyntaxHighlighter>

            <br/>

            With that we have everything set up that the program will need, and we can move on to actually placing bids in the auction!


            <h3 id="bid-header" className="mt-5" style={{fontSize: "20px"}}>Placing A Bid</h3><br />

            The <Code>process_place_bid</Code> function, which handles new bids from the auction's participants, has the following overall flow:

            <br/><br/>
            <ul>
                <li>Check all the accounts passed are as expected</li>
                <li>Create the bidder's associated token account if required</li>
                <li>Check the bid, and transfer the SOL</li>
                <li>Update the <Code>charity_data</Code> in the program's <Code>State</Code></li>
                <li>Create a program derived account for the bidder if required</li>
                <li>Update the bid data in the program's <Code>State</Code> with the new bid</li>

            </ul>

            <br/>

            The first four of these tasks follow exactly the same format as when joining the charity token launch <a style={{textDecoration: "underline"}} href="https://www.daoplays.org/blog/charity_token_launch">here</a>, so we will skip over those in this post.  The first new task is to create a new PDA for the program which will use the bidder's public key as the seed to find the address:

            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {`Pubkey::find_program_address(&[&bidder_account_info.key.to_bytes()], &program_id);`}
            </SyntaxHighlighter>
            <br />

            This account needs to hold a single instance of the <Code>BidderData</Code> struct, defined below:

            <br/><br/>
            <SyntaxHighlighter language="rust" style={docco}>
{`// in state.rs
pub struct BidderData {
    pub index : u16
}`} 
            </SyntaxHighlighter>
            <br />

            This will store the index into the three bid data arrays contained in the program's <Code>State</Code> (<Code>bid_keys</Code>, <Code>bid_amounts</Code>, and <Code>bid_times</Code>) that are associated with this participant's most recent bid.  Whenever a new bid is made we can check if the participant has an existing bid by just checking the public key in the program's <Code>bid_keys</Code> array at position <Code>index</Code>, rather than searching through all the keys in the array, which is extremely inefficient.

            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {bid_1}
            </SyntaxHighlighter>
            <br/>

          

            What we do next depends on whether the public key at that position matches the bidder.  If it does then the bidder has a valid bid already in the system, and we just have to increment the value of the bid by the new amount:


            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {bid_1_2}
            </SyntaxHighlighter>
            <br/>


            If the keys don't match we know we have a new bid, and so we will either insert the bid into an empty slot in the program's <Code>State</Code>, or if there are no empty slots then we are going to need to replace the oldest bid. 

            <br/><br/>
            
            Given we might need the oldest bid, we iterate through the <Code>bid_times</Code> array to find the first element that is zero, which indicates an empty slot. As we iterate through we also track <Code>oldest_bid_index</Code>, which if we make it all the way through the loop without finding an empty slot will point to the entry in the data that contains the oldest bid.  Note in the below we are making use of our <Code>BidTimes</Code> helper struct, so that we can deserialize in chunks of  <Code>BID_BLOCK</Code> entries and still remain in the 4kb stack frame limit.

            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {bid_2}
            </SyntaxHighlighter>
            <br/>

            If we didn't find a slot then we are going to need to replace the bid at position <Code>oldest_bid_index</Code>.  We therefore first have to check what bid was present at that position and subtract its value from <Code>bid_total</Code> which tracks the total quantity currently in the program's <Code>State</Code>, and also reduce <Code>n_bidders</Code>, which tracks the number of active bids in the <Code>State</Code>, by one.

            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {bid_3}
            </SyntaxHighlighter>
            <br/>

            With the new index found we can update the participants <Code>BidderData</Code>:

            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {bid_4}
            </SyntaxHighlighter>
            <br/>

            and finally serialize the new bid, public key and the current time, before updating the <Code>total_bid</Code> and <Code>n_bidders</Code> data as well.

            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {bid_5}
            </SyntaxHighlighter>


            <br/>


            <h3 id="win-header" className="mt-5" style={{fontSize: "20px"}}>Choosing Winners</h3><br />

            When selecting new winners the program needs to perform the following sequence of tasks:

            <br/><br/>
            <ul>
                <li>Check that the accounts passed are those that are expected</li>
                <li>Filter out the bids that occurred within the last few seconds</li>
                <li>Check if, given the number of bids available, now is a valid time to select winners</li>
                <li>Use Pyth to seed the random number generator, and produce <Code>n_winner</Code> random numbers</li>
                <li>Iterate through the valid bids, calculating the cumulative distribution and selecting the winners</li>
                <li>Update the program's <Code>State</Code> with the new winners, and other relevant data</li>

            </ul>

            <br/>
            
            As we discussed in the introduction to this post, we need to make sure that bids can't be included within a round of the auction if they are made within the same block that the winners are selected.  This is to stop someone checking the value of the Pyth streams we are using, and determining what the random numbers we generate will be before placing their bid with full knowledge of whether their's will be selected or not.  More generally, the longer the time between the last bid and the selection of winners, the more secure the random number seed will be, because the range of possible values that will be passed by the Pyth streams will increase.
            
            
            <br/><br/>
            
            We therefore need to be able to find the subset of bids that occurred more than some threshold time before we enter the <Code>select_winners</Code> function, which in this example we have set to two seconds.  We therefore define the following function, <Code>get_bid_state</Code>, which takes as an argument <Code>max_time</Code>, which is the latest time for a bid that we will consider in order to include it in this round of the auction.  At this stage all we are interested in doing is finding both the total amount bid prior to that time, and the number of valid bids, so we simply iterate through the data, checking that the time of the bid is prior to <Code>max_time</Code> and returning these quantities at the end:

            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {win_1}
            </SyntaxHighlighter>
            <br/>

            Now that we know the number of valid bids, we can check whether or not we are in a position to select new winners at all.  The logic for this is contained in the following function, <Code>check_winners_state</Code>, which starts by just checking whether there are any valid bids at all:

            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {win_2_1}
            </SyntaxHighlighter>
            <br/>

            If there are bids, we next check whether the program has enough tokens to be able to select any winners.  Each participant is bidding on a block of one hundred tokens, so there need to be at least that many in the program's token account.  Note that for our example, the tokens have no decimal places, so we simply need to query the <Code>amount</Code> field of the token account:

            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {win_2_2}
            </SyntaxHighlighter>
            <br/>

            Assuming we have tokens in the bank, we next work out how many winners we are able to select this round, up to a maximum of four.  We allow multiple winners each round because it means we are less likely to run into a situation where a single large bidder dominates the draw.  Each time a winner is selected their bid is removed from the pool, and we recalculate the cumulative distribution of the remaining bids.  This will give participants with lower bids a higher probability of being selected, and hopefully keep them more engaged in the auction process.

            <br/><br/>

            We also want the pool of bids to have the opportunity to grow, and selecting too many winners each round will make this difficult, so in this example we have settled on selecting one winner per 64 bids, up to the maximum of four.  The number of winners selected in each round also needs to be limited by the number of tokens in the bank, and the following code makes these various checks to arrive at the final value of <Code>n_winners</Code> for this round:

            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {win_2_3}
            </SyntaxHighlighter>
            <br/>

            The final check we make is how long it has been since the last winners were selected.  As with the number of winners, we want to strike a balance between allowing the pool of bids to build up, while still having winners being selected on a relatively short timescale.  We chose five minutes as a reasonable time that the average bidder would have to wait to be selected as a winner.  This means if there is only a single bidder in the auction  they will have to wait five minutes until they can call <Code>select_winners</Code>, but already by the time there are ten bidders, new winners can be selected every 30 seconds.  We also remove this limitation entirely once the expected time is below a few seconds, so that if more than one hundred bidders are in the pool new winners can be drawn immediately one after the other:

            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {win_2_4}
            </SyntaxHighlighter>
            <br/>

            To generate the seed for our random number generator we use data feeds from the <a style={{textDecoration: "underline"}} href="https://pyth.network/">Pyth</a> oracle, and follow the same procedure that we outlined in our previous post <a style={{textDecoration: "underline"}} href="https://www.daoplays.org/blog/pyth_seeds">here</a>.  As in that post we then use the xorshift random number generator with that seed to obtain the <Code>n_winner</Code> values we need.  As a final step we then <a style={{textDecoration: "underline"}} href="https://rust-lang-nursery.github.io/rust-cookbook/algorithms/sorting.html">sort</a> the vector of random numbers in order to increase the efficiency with which we can then search through the bid data and actually find the winning keys:
            
            
            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {win_3}
            </SyntaxHighlighter>
            <br/>

            We now reach the main loop in this function, which is going to actually select the winners.  When we reach this point <Code>valid_total_bid</Code> has been initialized to the value returned by <Code>get_bid_state</Code>, and so represents the sum of the bids that occurred more than two seconds prior to the time we entered this function.  As before when iterating through all the bids, they will be split up into <Code>N_BID_BLOCK</Code> chunks each of size <Code>BID_BLOCK</Code>.  
            
            <br/><br/>
            
            Each random number generated earlier is in the interval [0..1].  By multiplying <Code>valid_total_bid</Code> by these numbers we get the point in the cumulative distribution at which a winner will be chosen, which we define as the <Code>threshold</Code> in the code snippet below.  As we iterate through the bids we will be tracking the cumulative bid amount, and comparing this to the <Code>threshold</Code>. The bid that causes the cumulative total to exceed the threshold will then be chosen as the next winner.   As these random values were sorted into numerical order we can just iterate through <Code>N_BID_BLOCK</Code> in the outer loop, and only deserialize each block once in order to increase the computational efficiency of selecting winners.


            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {win_4}
            </SyntaxHighlighter>
            <br/>

            Although previously we calculated the total bid amount and number of bidders that we will accept in this round of the auction, we didn't explicitly save the valid indices.  As we loop through the bids we therefore check if the time of the bid was before the required threshold, and ignore it if it was not.  If it was made long enough ago it contributes to the running bid total, which we compare against the threshold.  If this bid exceeds the threshold then we have found our next winner:

            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {win_4_2}
            </SyntaxHighlighter>
            <br/>

            Now that we have found a winner we need to serialize their key into the <Code>winners</Code> array of the program's <Code>State</Code>, and then clear their entries in the <Code>bid_amounts</Code>, <Code>bid_times</Code>, and <Code>bid_keys</Code> arrays:

            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {win_4_3}
            </SyntaxHighlighter>
            <br/>

            We then decrement the current known valid bid total, so that when we re-enter the loop for the next winner and recalculate the threshold with the next random value it will be for the new smaller amount.  We also need to reduce the actual total bid amount as we will update that at the very end of the function, and zero out the bid in this blocks <Code>bid_amounts</Code> array, so that it won't get included as we continue to loop through for the next winner.  If we finish the loop through the current block without having found a winner we update the cumulative total bid with the sum from this block, and move on to the next.

            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {win_4_4}
            </SyntaxHighlighter>
            <br/>

            Finally at the end of the function the last thing we need to do is to serialize the updated values of <Code>total_bid</Code> and <Code>n_bidders</Code>, and to set the last time winners were selected to the current time:

            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {win_5}
            </SyntaxHighlighter>
            <br/>



            <h3 id="token-header" className="mt-5" style={{fontSize: "20px"}}>Sending Tokens</h3><br />

            This is by far the simplest of the four main functions that are used in the token auction.  As usual we start off by checking the main accounts that are passed, however in this case we also have to pass the function the associated token addresses of the winners, so this process is slightly more involved than normal, so we will just quickly go through that aspect below.

            <br/><br/>

            In order to know how many winners we have we deserialize the <Code>n_winners</Code> value from the program data account.  We do this rather than passing the value as an argument to the program to ensure that users can't pass erroneous values.  As this function can be called at any time, at this stage we also simply check that this value is greater than zero.  If there are no winners we can exit immediately.


            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {send_tokens_1}
            </SyntaxHighlighter>


            <br/>

            Given the expected number of winners, we now create a vector of references to <Code>AccountInfo</Code> objects, and push the winners onto that from the account iterator.  We make use of the <Code><a style={{textDecoration: "underline"}} href="https://doc.rust-lang.org/std/iter/struct.Peekable.html">peekable</a></Code> functionality of iterators in order to check whether the correct number of accounts have been passed to the function:


            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {send_tokens_2_1}
            </SyntaxHighlighter>


            <br/>

            We now need to make several different checks.  Firstly we deserialize the public keys of the winning token accounts from the program's data account, and check that all the keys passed to the program match those that are stored in the data account.  Secondly, we check none of the keys match the system program key, which is the value we store in our data structures to represent an empty slot.

            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {send_tokens_2_2}
            </SyntaxHighlighter>


            <br/>

            Finally we then iterate over the remaining keys in the data account up to the maximum number of winners to make sure that these are equal to the system program key.  If they are not then somehow the <Code>n_winners</Code> variable must not have been set to the right value.  Although this shouldn't ever happen, we check anyway:

            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {send_tokens_2_3}
            </SyntaxHighlighter>


            <br/>

            With the winning token accounts in hand we can then make use of our <Code>transfer_tokens</Code> function to send the winning amount to each of the accounts in turn.  Here that amount is defined as the constant <Code>TOKENS_WON</Code>, which in this example we have set to one hundred:

            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {send_tokens_3}
            </SyntaxHighlighter>


            <br/>

            As a final step we then reset all the winning keys in the program's data account to the system program key, and set <Code>n_winners</Code> back to zero, so that the program can start selecting new winners again.

            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {send_tokens_4}
            </SyntaxHighlighter>


            <br/>

            <h3 id="token-header" className="mt-5" style={{fontSize: "20px"}}>Live Example</h3><br />

            Below we have a simple front end to the token auction program running on the Solana devnet blockchain.  At the top we show a summary of the donations that have been made, both as a total value and as a breakdown per charity.  Below that you can see the current state of the auction, with the number of active bids, and the average bid price.  

            <br/><br/>

            Whenever you make a bid it will automatically take care of sending out tokens to any winners that are currently waiting, and the program will also attempt to select new winners if the criteria for doing so are met.  You can also see what your current chances are of being the next winner selected given the size of your bid, and the total amount bid by all users.

            <br/><br/>

            Finally, it will also show you how many bids by other users need to be made before your bid is removed as the oldest bid. You can opt to either increase your bid, which will refresh its lifetime, or select new winners which will free up space in the auction.
            <br/><br/>
            <CharityAuctionDapp/>
            


            <br/><br/>

            We will be making use of this system in our own apps going forward, and hope that you might be motivated to try and launch your own charitable token auction in the future!  If you are interested to see how we use it feel free to follow us on <a style={{textDecoration: "underline"}} href="http://www.twitter.com/dao_plays">Twitter</a> to keep up to date with future posts!

           
            </main>
        </div>
    

    );
}

function CharityAuction() {
    return (
        <ChakraProvider theme={theme}>
                <PostContent />
                
        </ChakraProvider>
        
    );
    }

export default CharityAuction;
