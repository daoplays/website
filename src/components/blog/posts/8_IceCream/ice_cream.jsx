import React from "react";
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { ChakraProvider, theme, Code, HStack } from '@chakra-ui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { solid } from '@fortawesome/fontawesome-svg-core/import.macro' // <-- import styles to be used

import { IceCream } from '../../apps/ice_cream';
import {Donate} from '../../../apps/donate'
const create_account = 
`// in create_program_account
let space : u64 = data_size.try_into().unwrap();
let lamports = rent::Rent::default().minimum_balance(data_size);

let ix = solana_program::system_instruction::create_account(
    funding_account.key,
    pda.key,
    lamports,
    space,
    program_id,
);

// Sign and submit transaction
invoke_signed(
    &ix,
    &[funding_account.clone(), pda.clone()],
    &[&[seed, &[bump_seed]]]
)?;`

const create_mint_1 = 
`// in processor.rs
// if the program has been passed an existing token mint, it must satisfy some conditions which we check below
if **token_mint_account_info.try_borrow_lamports()? > 0 {

    // first get the mint account data
    let mint_account_state = spl_token::state::Mint::unpack_unchecked(&token_mint_account_info.try_borrow_data()?)?;
    
    // if the mint account has not been initialised return an error
    if !mint_account_state.is_initialized {
        msg!("mint account {} has not been initialized", token_mint_account_info.key.to_string());
        return Err(ProgramError::from(NewError::InvalidTokenMint));
    }

    // if the supply is 0 then this isn't a valid token
    if !mint_account_state.supply == 0 {
        msg!("mint account {} has zero supply", token_mint_account_info.key.to_string());
        return Err(ProgramError::from(NewError::InvalidTokenMint));
    }

    // if decimals isn't zero this isn't a valid token
    if mint_account_state.decimals != 0 {
        msg!("mint account {} has invalid decimal places ({} != 0)", token_mint_account_info.key.to_string(), mint_account_state.decimals);
        return Err(ProgramError::from(NewError::InvalidTokenMint));
    }

    // finally if the mint authority is not Some, and if it doesn't match the funding account, it isn't a valid choice
    if mint_account_state.mint_authority.is_none() {
        msg!("mint account {} has no mint authority", token_mint_account_info.key.to_string());
        return Err(ProgramError::from(NewError::InvalidTokenMint));
    }

    let mint_authority = mint_account_state.mint_authority.unwrap();
    if mint_authority != *funding_account_info.key {
        msg!("mint account {} authority {} is not the funding account {}", token_mint_account_info.key.to_string(), mint_authority.to_string(), funding_account_info.key.to_string());
        return Err(ProgramError::from(NewError::InvalidTokenMint));
    }
}`

const eat_1 = 
`
   // get the expected mint address for this team from the data account
   let mut team_data = state::TeamMeta::try_from_slice(&team_data_account.data.borrow())?;
   let expected_team_mint_key = team_data.mint_address;

   // the second account is the team's token mint
   if token_mint_account.key != &expected_team_mint_key
   {
       msg!("expected second account to be the team mint account {}", expected_team_account);
       return Err(ProgramError::InvalidAccountData);
   }`

const eat_2 = 
`let expected_token_pubkey = get_associated_token_address(
       &funding_account_info.key, 
       &token_mint_account.key
   );

   // the third account is the user's token account
   if player_token_account.key != &expected_token_pubkey
   {
       msg!("expected third account to be the user token account {}", expected_token_pubkey);
       return Err(ProgramError::InvalidAccountData);
   }`

const eat_3 = 
`// this user's token account must have been created already
   if **player_token_account.try_borrow_lamports()? <= 0 {
       msg!("User token account has not been created yet");
       return Err(ProgramError::InvalidAccountData);
   }

   let user_token_account_state = spl_token::state::Account::unpack_unchecked(&player_token_account.try_borrow_data()?)?;

   // check the user has tokens from the team mint
   if user_token_account_state.amount <= 0 {
       msg!("User has no team tokens");
       return Err(ProgramError::from(NewError::NoTeamTokens));
   }`

const eat_4 =
`let mut score_data = state::ScoreMeta::try_from_slice(&program_data_account.data.borrow())?;

// increment the team's score
team_data.score += 1;
team_data.serialize(&mut &mut team_data_account.data.borrow_mut()[..])?;`

const eat_5 =
`// check if the new score is higher than the lowest of the top 10
let mut min: u64 = u64::MAX;
let mut min_index : usize = 0;
let mut present : bool = false;
for i in 0..10 {
    if team_data.index == score_data.top_ten_teams[i] {
        present = true;
        min_index = i;
        break;
    }
    if score_data.top_ten_scores[i] < min {
        min = score_data.top_ten_scores[i];
        min_index = i;
    }
}`

const eat_6 =
`if present {
    msg!("Team already present in the top 10! {} for team {}", team_data.score, team_data.index);

    score_data.top_ten_scores[min_index] = team_data.score;
    score_data.top_ten_teams[min_index] = team_data.index;

    score_data.serialize(&mut &mut program_data_account.data.borrow_mut()[..])?;
}`

const eat_7 =
`if !present && team_data.score > min {

    msg!("New entry in top 10! {} > {} for team {}", team_data.score, min, team_data.index);

    score_data.top_ten_scores[min_index] = team_data.score;
    score_data.top_ten_teams[min_index] = team_data.index;
    
    score_data.serialize(&mut &mut program_data_account.data.borrow_mut()[..])?;

}`

function IceCreamPost() {

    return (
        <div className="home">
            <div className="container">

                <h1 className="h1 text-center mb-0 pt-3 font-weight-bold text-body">
                    Using tokens for team play</h1>
                <h1 className="h5 text-center mb-1 pt-0 font-weight-bold text-secondary">Dec 01 2022</h1>
                <br />
               
               In this post we are going to make a simple game in which users can create teams and collectively compete to eat the most dessert.  Each team will be associated with a token on the Solana blockchain,  and anyone who owns one of those tokens will be able to log in to the game for that team and start eating. Teams can either use pre-existing tokens that are already in use within their community, or can simply have the app create a new token for them.  As a little bonus, the game will also track the top ten teams so that we can easily display this in the game's front end.   This same mechanism can be used for any type of gating within an app, such as automatically unlocking special features or content based on token ownership.

               <br/><br/>

               

                You can find all the code for this example on our github page here, and a working instance of the game at the bottom of the page here, so get eating!

                <h3 id="init-header" className="mt-5" style={{fontSize: "20px"}}>Overview</h3><br />

                The game program consists of 4 main functions, each of which we will describe in detail later in the post:

               <br/><br/>
                <ul>
                    <li>Create and initialize the main program data account <a href="#init-header"><FontAwesomeIcon icon={solid('arrow-right')}  /></a></li>
                    <li>Create a new team account <a href="#team-header"><FontAwesomeIcon icon={solid('arrow-right')}  /></a></li>
                    <li>Create a new team lookup account <a  href="#lookup-header"><FontAwesomeIcon icon={solid('arrow-right')}  /></a></li>
                    <li>Eat a dessert <a href="#eat-header"><FontAwesomeIcon icon={solid('arrow-right')}  /></a></li>
                </ul>
                <br/>

                The first three of these are responsible for creating each of the three kinds of data account that the program uses to manage the different teams.  The main data account stores summary data - the number of teams so far registered, and arrays that keep track of the current top ten teams and their scores, so that we can easily make a leader board on the front end web app. Note that we are referring to teams here as 64bit integers rather than using names or public keys.  The program will use these integers to map to specific teams using their lookup accounts which we will get to shortly.

                <br/> <br/>
                <SyntaxHighlighter language="rust" style={docco}>
{`pub struct MainData {
    // the total number of teams registered
    pub num_teams : u64,
    // the indices of the top ten teams
    pub top_ten_teams : [u64; 10],
    // the scores of the top ten teams
    pub top_ten_scores : [u64; 10],
}`} 
                </SyntaxHighlighter>
                <br /> 

                Secondly, each team has it's own team account, which records their score, unique team name, the mint address of their team's token, and their team index (the number that we can use to look this team up mentioned previously).  As we store the team name as an array of bytes of fixed size, we also store the length of the team name so that we can display it correctly on the front end.
                <br/><br/>
                <SyntaxHighlighter language="rust" style={docco}>
{`pub struct TeamData {
    // team name, stored as byte array
    pub team_name : [u8 ; 256],
    // length of actual name for display purposes
    pub name_len : u64,
    // the mint address of this team
    pub mint_address : Pubkey,
    // the teams score
    pub score : u64,
    // the teams index
    pub index : u64
}
`} 
                </SyntaxHighlighter>
                <br /> 

                Finally each team has a lookup account which allows us to map from the team index to the address of the team's data account:

                <br/> <br/>
                <SyntaxHighlighter language="rust" style={docco}>
{`pub struct TeamLookup {
    // the address of the team's data account
    pub team_account : Pubkey
}
`} 
                </SyntaxHighlighter>
                <br /> 

                
                <h3 id="init-header" className="mt-5" style={{fontSize: "20px"}}>Create and initialize the main program data account</h3><br />

                This function is responsible for creating the main data account for the program, which will store the number of teams so far registered, and arrays that keep track of the current top ten teams and their scores.  It is a very simple function, and only needs to make a call to our <Code>create_program_account</Code> helper function:

                <br/><br/>
                <SyntaxHighlighter language="rust" style={docco}>
{`// in processor.rs
pub fn create_program_account<'a>(
        funding_account: &AccountInfo<'a>,
        pda : &AccountInfo<'a>,
        program_id :  &Pubkey,
        bump_seed : u8,
        extra_seed : &[u8],
        data_size : usize
    ) -> ProgramResult`} 

                </SyntaxHighlighter>
                <br /> 

                This function is passed three accounts; i) <Code>funding_account</Code> is the account paying for the new account to be created (in this case us), ii) <Code>pda</Code> is the program derived address that will store the main data account, and iii) <Code>program_id</Code> is the program's public key.  The  PDA is initially determined off chain using the <Code>find_program_address</Code> function (for more information on program derived addresses you can check out our previous blog post here), which also provides the <Code>bump_seed</Code> used to determine the address.  In deriving the address we can also use extra seeds in order to create multiple unique accounts that the program can own, and in this case we use the string <Code>data_account</Code> as this additional seed.  Finally data_size is provided by the function <Code>get_main_data_size</Code>, which returns the size of the main data account by instantiating a default instance of it:

                <br/><br/>
                <SyntaxHighlighter language="rust" style={docco}>
{`// in state.rs
pub fn get_main_data_size() -> usize {
    let encoded = MainData {num_teams: 0, top_ten_teams : [0; 10], top_ten_scores : [0; 10]}
        .try_to_vec().unwrap();

    encoded.len()
}`} 
                </SyntaxHighlighter>
                <br /> 

                We instantiate a <Code>create_account</Code> system program instruction, passing <Code>lamports</Code>, the cost of creating the account such that we are not charged rent on an ongoing basis, and then perform a cross-program invocation using the <Code>invoke_signed</Code> function to actually create the account, passing the funding account and the program as the signers of that transaction.

                <br /><br />
                <SyntaxHighlighter language="rust" style={docco}>
                {create_account}
                </SyntaxHighlighter>
                <br/>

                <h3 id="team-header" className="mt-5" style={{fontSize: "20px"}}>Create a new team account</h3><br />

                When creating a new team a user has the option of passing an existing token that will used by players to compete for that team, or have the program simply create a new token, and assign the mint authority to that user.  These two scenarios are handled by the front end, which simply calls <Code>Keypair.generate()</Code> to determine the address of the new mint account, and passes that to the program's <Code>create_team</Code> instruction.

                <br/>

                Within create team we therefore need to distinguish between the two cases (an existing token mint, or one that must be created), and in the former case the token must satisfy a series of conditions:

                <br/><br/>
                <ul>
                    <li>It must have been initialized</li>
                    <li>It must have  supply of more than zero</li>
                    <li>It must have zero decimal places</li>
                    <li>The mint authority must be the user creating the new team</li>
                </ul>
                <br/>
                
                <br /><br />
                <SyntaxHighlighter language="rust" style={docco}>
                {create_mint_1}
                </SyntaxHighlighter>
                <br/>

                If the token mint account has not been created yet, then instead we call out <Code>create_mint_account</Code> function.  This function is responsible for creating the mint account, initializing it, and then mints the user a single token so that they can test out the functionality of the game.  As the user is made the mint authority they are then free to mint further tokens and distribute them to team members.

                <br/>

                Firstly, we create the account using the solana_program instruction <Code>create_account</Code>, which will be of size <Code>Mint::LEN</Code>.

                <br/><br/>
                <SyntaxHighlighter language="rust" style={docco}>
{`let mint_rent = rent::Rent::default().minimum_balance(Mint::LEN);

let ix = solana_program::system_instruction::create_account(
    funding_account.key,
    mint_account.key,
    mint_rent,
    Mint::LEN as u64,
    token_program.key,
);

// Sign and submit transaction
invoke(
    &ix,
    &[funding_account.clone(), mint_account.clone()]
)?;`} 

                </SyntaxHighlighter>
                <br />

                We then use the spl_token instruction <Code>initialize_mint2</Code>.  The first edition of this function <Code>initialize_mint</Code> required the user to pass the rent sysvar account to the program and use it to sign this transaction, whereas the second does not.  

                <br/><br/>
                <SyntaxHighlighter language="rust" style={docco}>
{`let mint_idx = instruction::initialize_mint2(
    token_program.key,
    mint_account.key,
    funding_account.key,
    None,
    0
).unwrap();

// Sign and submit transaction
invoke(
    &mint_idx,
    &[token_program.clone(), mint_account.clone(), funding_account.clone()]
)?;`} 

                </SyntaxHighlighter>
                <br />

                Finally we create the users associated token account for this new mint, and mint a single token using the spl_token instruction <Code>mint_to</Code>:


                <br/><br/>
                <SyntaxHighlighter language="rust" style={docco}>
{`// create the ATA
let create_ata_idx = create_associated_token_account(&funding_account.key, &funding_account.key,&mint_account.key);

invoke(
    &create_ata_idx,
    &[funding_account.clone(), new_token_account.clone(), funding_account.clone(), mint_account.clone(), token_program.clone()],
)?;

// and finally mint the user one token on their behalf so they can access the game right away
let mint_to_idx = instruction::mint_to(
    token_program.key,
    mint_account.key,
    new_token_account.key,
    funding_account.key,
    &[funding_account.key],
    1
).unwrap();

invoke(
    &mint_to_idx,
    &[token_program.clone(), mint_account.clone(), new_token_account.clone(), funding_account.clone()]
)?;`} 

                </SyntaxHighlighter>
                <br />

                With the token mint account either verified, or created, we then increment the number of teams that the program knows about.  This new value will be the index that this new team will be known as internally to the program, so the first team created will have index 1, rather than zero which makes checking for initizlied teams more straight forward.

                <br/><br/>
                <SyntaxHighlighter language="rust" style={docco}>
{`// increment the total number of teams the program knows about, this value will be used to index this team in it's lookup account
let mut score_data = state::ScoreMeta::try_from_slice(&program_data_account.data.borrow())?;
score_data.num_teams += 1;
score_data.serialize(&mut &mut program_data_account.data.borrow_mut()[..])?;`} 

                </SyntaxHighlighter>
                <br />

                We then call our <Code>create_program_account</Code> function as we did when creating the main data account.  In this case though the we use the team name as a seed so that we can easily access this data when provided the team name either on or off chain.  The size of the account is determined using a small helper function:

                <br/><br/>
                <SyntaxHighlighter language="rust" style={docco}>
{`// in state.rs
// Determines and reports the size of the team data account.
pub fn get_team_meta_size() -> usize {
    let encoded = TeamMeta {team_name : [0; 256], 
                            name_len : 0, 
                            mint_address : solana_program::system_program::id(), 
                            score : 0, 
                            index : 0
                    }.try_to_vec().unwrap();

    encoded.len()
}`} 

                </SyntaxHighlighter>
                <br />

                Finally with the team account created we initialize the meta data, setting the team name to the one requested, the mint address of the team's token, and setting the index as the <Code>num_teams</Code> variable set earlier.

                <br/><br/>
                <SyntaxHighlighter language="rust" style={docco}>
{`// copy the team name to a byte array
let mut meta_bytes = [0 as u8 ; 256];
for i in 0..name_len {
    meta_bytes[i] = team_name_bytes[i];
}

let team_meta = state::TeamMeta{team_name : meta_bytes, name_len : name_len as u64, mint_address : *token_mint_account_info.key, score : 0, index : score_data.num_teams};

team_meta.serialize(&mut &mut team_data_account.data.borrow_mut()[..])?;`} 

                </SyntaxHighlighter>
                <br />

                <h3 id="lookup-header" className="mt-5" style={{fontSize: "20px"}}>Create a new team lookup account </h3><br />

                This function is very similar to the first, and is only responsible for creating a team's lookup account.  Unfortunately this can't be done within the same transaction as creating the team's data account, because we need to know which index has been assigned to the team in order to derive the address of the lookup account.

                All we do here then is call <Code>create_program_account</Code> using the team's index as the seed for <Code>derive_program_address</Code>, and then initialize the TeamLookup data structure, setting the key to be the team's data account.  This means we can now easily scan through either the teams in the top ten (saved in the main data account), or through all the teams in turn, by first accessing the content of the teams lookup account, and then using that to access the team's data account.

                <br/><br/>
                <SyntaxHighlighter language="rust" style={docco}>
{`// the lookup just stores the address of this teams data account
let team_account_meta = state::TeamLookup{team_account : *team_data_account.key};

team_account_meta.serialize(&mut &mut team_lookup_account.data.borrow_mut()[..])?;`} 

</SyntaxHighlighter>
<br />

                <h3 id="eat-header" className="mt-5" style={{fontSize: "20px"}}>Eat a dessert</h3><br />

                This function is responsible for checking that the player has the token that is associated with the team they are playing for, incrementing the teams score and updating the overall top ten rankings.  The instruction is passed the same <Code>CreateMeta</Code> structure as the previous functions which contains the team name this player is playing for, and expects to be passed six accounts:

                <br/><br/>
                <SyntaxHighlighter language="rust" style={docco}>
{`// in processor.rs
// the first account is the player's account info, which should also have signed the transaction
let player_account_info = next_account_info(account_info_iter)?;

// the second account is the mint account for the token registered with the team they are playing for
let token_mint_account = next_account_info(account_info_iter)?;

// the third account is the player's token account for their team's token
let player_token_account = next_account_info(account_info_iter)?;

// the fourth account is the program's main data account
let program_data_account = next_account_info(account_info_iter)?;

// the fifth account is the team's data account
let team_data_account = next_account_info(account_info_iter)?;

// and finally we also pass the associated token program
let associated_token_account_info = next_account_info(account_info_iter)?;`} 

            </SyntaxHighlighter>
            <br />

            Before incrementing the score for the team we have to perform some checks on the accounts that have been passed. We first retrieve the meta data for this team and check that the token mint address passed to the instruction matches the one saved in the meta data:
            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {eat_1}
            </SyntaxHighlighter>
            <br/>

            Similarly we then check that the token account for the player matches the expected associated token account for this token:

            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {eat_2}
            </SyntaxHighlighter>
            <br/>
                            
            and finally we check that this token account has been created, and contains at least one token.

            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {eat_3}
            </SyntaxHighlighter>
            <br/>

            Assuming we have made it this far we can now update the teams score:
            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {eat_4}
            </SyntaxHighlighter>
            <br/>

            We also check if this new score changes the top ten teams that the program keeps a record of.  Although we could use a clever method of doing this, with only ten teams we simply loop through all the scores and check both whether this team is already in the top ten, and otherwise simply find the lowest score of the teams currently in the top ten.

            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {eat_5}
            </SyntaxHighlighter>
            <br/>

            If the team was already present all we have to do is update their score with the new value

            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {eat_6}
            </SyntaxHighlighter>
            <br/>

            and otherwise if they were not in the top ten, but their score is higher than the lowest teams score, we replace the lowest team with this team.

            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {eat_7}
            </SyntaxHighlighter>
            <br/>

                <br/>





                <h3 id="game-header" className="mt-5" style={{fontSize: "20px"}}>Play the Game!</h3><br />

                <IceCream />

                <br/>


                If you enjoyed this post please feel free to follow us on Twitter to stay up to date with new things here at daoplays.
               
            </div>
        </div>
    );
}

export default IceCreamPost;
