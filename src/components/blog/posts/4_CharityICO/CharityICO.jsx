import React from "react";
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { ChakraProvider, Link, theme, Box, HStack, Code, Tooltip } from '@chakra-ui/react';
import { CharityDapp } from '../../apps/charity';
import {Image} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { solid } from '@fortawesome/fontawesome-svg-core/import.macro' // <-- import styles to be used


import token_img from "./test_token.png"
import supporter_token_img from "./supporter_token.png"

import UkraineERF_img from "./ukraine_logo.jpg"
import WaterOrg_img from "./waterorg_logo.jpeg"
import OneTreePlanted_img from "./onetreeplanted_logo.jpg"
import EvidenceAction_img from "./evidenceaction_logo.jpeg"
import GWC_img from "./girlswhocode_logo.jpeg"
import Outright_img from "./outrightaction_logo.jpg"
import LifeYouCanSave_img from "./thelifeyoucansave_logo.jpeg"


const rent_0 =
`$solana rent 0
Rent per byte-year: 0.00000348 SOL
Rent per epoch: 0.000002439 SOL
Rent-exempt minimum: 0.00089088 SOL
`

const create_account =
`pub fn create_account(
    from_pubkey: &Pubkey, 
    to_pubkey: &Pubkey, 
    lamports: u64, 
    space: u64, 
    owner: &Pubkey
) -> Instruction`
const ico_state = 
`// in state.rs
pub struct ICOData {
    pub charity_totals : [u64 ; 7],
    pub donated_total : u64,
    pub paid_total : u64,
    pub n_donations : u64
}`

const ico_size = 
`pub fn get_state_size() -> usize 
{
    let encoded = ICOData 
    {
        charity_totals: [0; 7], 
        donated_total : 0, 
        paid_total : 0, 
        n_donations : 0
    }.try_to_vec().unwrap();

    encoded.len()
}`

const find_token_address = 
`// in spl_associated_token_account
pub fn get_associated_token_address(
    wallet_address: &Pubkey, 
    spl_token_mint_address: &Pubkey
) -> Pubkey`

const create_token_address = 
`// in spl_associated_token_account
pub fn create_associated_token_account(
    funding_address: &Pubkey, 
    wallet_address: &Pubkey, 
    spl_token_mint_address: &Pubkey
) -> Instruction`


const pda_address = 
`let (expected_pda, bump_seed) = Pubkey::find_program_address(
                                    &[b"token_account"], 
                                    program_id
                                );
`
const create_pda = 
`// in processor.rs
// create the program's data account
fn create_program_account<'a>(
    // the wallet that will be paying to create the token account
    funding_account: &AccountInfo<'a>,
    // the program account that we want to create
    pda : &AccountInfo<'a>,
    // the address of the program
    program_id :  &Pubkey,
    bump_seed : u8

) -> ProgramResult
{
    let data_size = get_state_size();
    let space : u64 = data_size.try_into().unwrap();
    let lamports = rent::Rent::default().minimum_balance(data_size);

    msg!("Require {} lamports for {} size data", lamports, data_size);
    let ix = solana_program::system_instruction::create_account(
        funding_account.key,
        pda.key,
        lamports,
        space,
        program_id,
    );
...
`

const create_pda_2 = 
`...
    // Sign and submit transaction
    invoke_signed(
        &ix,
        &[funding_account.clone(), pda.clone()],
        &[&[b"token_account", &[bump_seed]]]
    )?;

    Ok(())
}`

const create_token_account = 
`fn create_token_account<'a>(
    // the wallet that will be paying to create the token account
    funding_account : &AccountInfo<'a>,
    // the account that will own the new token account
    wallet_account : &AccountInfo<'a>,
    // the mint of the token account
    token_mint_account : &AccountInfo<'a>,
    // the address of the token account, found through get_associated_token_account
    new_token_account : &AccountInfo<'a>,
    // the spl_token program account
    token_program_account : &AccountInfo<'a>

) -> ProgramResult
{
    let create_ATA_idx = create_associated_token_account(
                            &funding_account.key, 
                            &wallet_account.key,
                            &token_mint_account.key
                        );

    invoke(
        &create_ATA_idx,
        &[
            funding_account.clone(), 
            new_token_account.clone(), 
            wallet_account.clone(), 
            token_mint_account.clone(), 
            token_program_account.clone()
        ],
    )?;

    Ok(())
}`

const transfer_function =
`// in spl_token::instruction
pub fn transfer(
    token_program_id: &Pubkey, 
    source_pubkey: &Pubkey, 
    destination_pubkey: &Pubkey, 
    authority_pubkey: &Pubkey, 
    signer_pubkeys: &[&Pubkey], 
    amount: u64
) -> Result<Instruction, ProgramError>`

const transfer_tokens = 
`// in processor.rs
fn transfer_tokens<'a>(
    // the amount in tokens that will be transferred
    amount : u64,
    // the token account that will act as the source
    token_source_account : &AccountInfo<'a>,
    // the token account to send to
    token_dest_account : &AccountInfo<'a>,
    // the account that will sign the transaction
    authority_account : &AccountInfo<'a>,
    // the spl_token account
    token_program_account : &AccountInfo<'a>,
    // the bump_seed from our PDA
    bump_seed : u8

) -> ProgramResult
{
    let ix = spl_token::instruction::transfer(
        token_program_account.key,
        token_source_account.key,
        token_dest_account.key,
        authority_account.key,
        &[],
        amount,
    )?;

    invoke_signed(
        &ix,
        &[
            token_source_account.clone(), 
            token_dest_account.clone(), 
            authority_account.clone(), 
            token_program_account.clone()
        ],
        &[&[b"token_account", &[bump_seed]]]
    )?;

    Ok(())
}`

const close_account_one =
`// in processor.rs
fn close_program_token_account<'a>(
    // the program's account info
    program_account_info : &AccountInfo<'a>,
    // the account info of the token account we want to close
    program_token_account_info : &AccountInfo<'a>,
    // the destination account for the lamports being retrieved
    destination_account_info : &AccountInfo<'a>,
    // the destination account for tokens being retrieved
    destination_token_account_info : &AccountInfo<'a>,
    // the token program
    token_program_account_info : &AccountInfo<'a>,
    // the bump seed for our program derived address
    bump_seed : u8
) -> ProgramResult
...`
const close_account_two =
`...
{
    // Check the destination token account exists, which it should do if we are the ones that set it up
    if **destination_token_account_info.try_borrow_lamports()? > 0 {
        msg!("Confirmed destination token account is already initialised.");
    }
    else {

        msg!("destination token account should already exist");
        return Err(ProgramError::InvalidAccountData);
    }

    // And check that we haven't already closed out the program token account
    let program_token_account_lamports = **program_token_account_info.try_borrow_lamports()?;
    if program_token_account_lamports > 0 {
        msg!("Confirmed program token account is still initialised.");
    }
    else {

        msg!("program's token account already closed");
        return Ok(());
    }
...`

const close_account_three = 
`...    
    let program_token_account = spl_token::state::Account::unpack_unchecked(&program_token_account_info.try_borrow_data()?)?;

    msg!("transfer token balance: {}", program_token_account.amount);

    if program_token_account.amount > 0 {
        Self::transfer_tokens(
            program_token_account.amount,
            program_token_account_info,
            destination_token_account_info,
            program_account_info,
            token_program_account_info,
            bump_seed
        )?;
    }
...` 

const close_account_four =
`...   
    msg!("close account and transfer SOL balance: {}", program_token_account_lamports);

    let close_token_account_idx = spl_token::instruction::close_account(
        token_program_account_info.key,
        program_token_account_info.key, 
        destination_account_info.key, 
        program_account_info.key, 
        &[]
    )?;

    invoke_signed(
        &close_token_account_idx,
        &[program_token_account_info.clone(), destination_account_info.clone(), program_account_info.clone()],
        &[&[b"token_account", &[bump_seed]]]
    )?;

    Ok(())
}`

const join_meta = 
`// in state.rs
pub struct JoinMeta {
    pub amount_charity : u64,
    pub amount_dao : u64,
    pub charity : Charity
}`
const charity_enum =
`// in state.rs
pub enum Charity {

    UkraineERF,
    WaterOrg,
    OneTreePlanted,
    EvidenceAction,
    GirlsWhoCode,
    OutrightActionInt,
    TheLifeYouCanSave

}`

const join_0 =
`...
// check that this transaction is valid:
// i) total amount should exceed the minimum
// ii) joiner should not already have tokens
// iii) program should have enough spare tokens


msg!("Transfer {} {}", meta.amount_charity, meta.amount_dao);
msg!("Balance {}", joiner_account_info.try_borrow_lamports()?);

// minimum amount is 0.0001 SOL, or 100000 lamports
let min_amount : u64 = 100000;
if meta.amount_charity + meta.amount_dao < min_amount {
    msg!("Amount paid is less than the minimum of 0.0001 SOL");
    return Err(ProgramError::InvalidArgument);
}
...`

const join_1 = 
`...
// check if we need to create the joiners token account
if **joiner_token_account_info.try_borrow_lamports()? > 0 {
    msg!("Users token account is already initialised.");
}
else {

    msg!("creating user's token account");

    Self::create_token_account(
        joiner_account_info,
        joiner_account_info,
        token_mint_account_info,
        joiner_token_account_info,
        token_program_account_info
    )?;
}
...`

const join_2 =
`...
let program_token_account = spl_token::state::Account::unpack_unchecked(&program_token_account_info.try_borrow_data()?)?;
let program_supporters_token_account = spl_token::state::Account::unpack_unchecked(&program_supporters_token_account_info.try_borrow_data()?)?;
let joiner_token_account = spl_token::state::Account::unpack_unchecked(&joiner_token_account_info.try_borrow_data()?)?;

msg!("token balances: {} {} {}", program_token_account.amount, program_supporters_token_account.amount, joiner_token_account.amount);

if joiner_token_account.amount > 0 {
    msg!("Tokens already present in joiners account, thank you for taking part!");
    return Err(ProgramError::InvalidAccountData);
}
...`

const join_3 =
`...
// get the data stored in the program account to access current state
let mut current_state = ICOData::try_from_slice(&program_data_account_info.data.borrow()[..])?;

// calculate the current average to see if this individual has paid more
let current_average = current_state.paid_total / current_state.n_donations;
let total_paid = meta.amount_charity + meta.amount_dao;
let mut ico_token_amount : u64 = 1000;

let mut supporter = false;
// if they have then they get double!
if total_paid > current_average {
    msg!("Thank you for paying over the average price!");

    ico_token_amount = 2000;
    supporter =  true;
}

// check if there are the required number of tokens remaining
if program_token_account.amount < ico_token_amount {
    msg!("Insufficient tokens remaining in token launch");
    return Err(ProgramError::InvalidArgument);
}
...`

const join_4 =
`...
// if we have made it this far the transaction we can try transferring the SOL
invoke(
    &system_instruction::transfer(joiner_account_info.key, charity_account_info.key, meta.amount_charity),
    &[joiner_account_info.clone(), charity_account_info.clone()],
)?;

invoke(
    &system_instruction::transfer(joiner_account_info.key, daoplays_account_info.key, meta.amount_dao),
    &[joiner_account_info.clone(), daoplays_account_info.clone()],
)?;
...`

const join_5 =
`...
// and finally transfer the tokens
Self::transfer_tokens(
    ico_token_amount,
    program_token_account_info,
    joiner_token_account_info,
    program_data_account_info,
    token_program_account_info,
    bump_seed
)?;

if supporter && program_supporters_token_account.amount >= 1 {

    // check if we need to create the joiners supporter token account
    if **joiner_supporters_token_account_info.try_borrow_lamports()? > 0 {
        msg!("Users supporter token account is already initialised.");

    }

    else {

        msg!("creating user's supporter token account");

        Self::create_token_account(
            joiner_account_info,
            joiner_account_info,
            supporters_token_mint_account_info,
            joiner_supporters_token_account_info,
            token_program_account_info
        )?;
    }


    Self::transfer_tokens(
        1,
        program_supporters_token_account_info,
        joiner_supporters_token_account_info,
        program_data_account_info,
        token_program_account_info,
        bump_seed
    )?;

}
...`

const join_6 =
`...
// update the data

let charity_index = charity_index_map[meta.charity];

current_state.charity_totals[charity_index] += meta.amount_charity;
current_state.donated_total += meta.amount_charity;
current_state.paid_total += total_paid;
current_state.n_donations += 1;

msg!("Updating current state: {} {} {} {}", current_state.charity_totals[charity_index], current_state.donated_total, current_state.paid_total,  current_state.n_donations);

current_state.serialize(&mut &mut program_data_account_info.data.borrow_mut()[..])?;
...`


const close_account = 
`pub fn close_account(
    token_program_id: &Pubkey, 
    account_pubkey: &Pubkey, 
    destination_pubkey: &Pubkey, 
    owner_pubkey: &Pubkey, 
    signer_pubkeys: &[&Pubkey]
) -> Result<Instruction, ProgramError>`

function PostContent() {


    return (

        <div className="container">
            <main>

            <h1 className="h1 text-center mb-0 pt-3 font-weight-bold text-body">A Charitable Solana Token Launch with The Giving Block</h1>
            <h1 className="h5 text-center mb-1 pt-0 font-weight-bold text-secondary">July 05 2022</h1>
            <br />

            <h2 id="intro-header" className="mt-5" style={{fontSize: "22px"}}>Introduction</h2><br />

            
            <p>
            In this post we are going to create a launch Dapp for a pair of custom tokens on the Solana blockchain, which incorporates charitable giving as a core part of the payment process.
            
            <br/><br/>
            
            We will be using a 'pay what you want' model similar to something like <a  style={{textDecoration: "underline"}} href="https://humblebundle.com"> Humble Bundle</a>,  in which participants will be able to pay whatever they want for a block of 1000 tokens above some small minimum price.  In our implementation we have set that minimum to 0.0001 SOL which is about 0.35 US cents at time of writing.  They will also be able to choose how much of that payment we donate to their choice of charity, and how much stays with us, the app's developers.  

            <br/><br/>

            Additionally, if a user pays more than the current average they will not only get double the tokens, but they will also receive a special supporters token, which might be used as a governance token for your project, or to unlock special features in your applications.

            <br/><br/>

            You can find the complete source code for the on-chain program and a rust based client <a style={{textDecoration: "underline"}} href="https://github.com/daoplays/solana_examples/tree/master/charity_token_launch">here</a>, and for a simple javascript front-end interface <a style={{textDecoration: "underline"}} href="https://github.com/daoplays/website">here</a>.  The front-end application can be tested at the <a style={{textDecoration: "underline"}}  href="#app-header">bottom</a> of this post, where it displays the current headline stats, and will allow you to join the token launch.  Note this is running on the Solana devnet network so there are no real donations being made!
            
            <br/><br/>

            In order to make the charitable components of the launch as transparent and streamlined as possible, we will be using <a  style={{textDecoration: "underline"}} href="https://thegivingblock.com/">The Giving Block</a> (TGB) to handle all the donations.  TGB are partnered with over a thousand non-profit organizations spread across a huge range of different sectors, and from those we have selected a short list of seven that can be chosen by participants of our token launch.  
            
            <br/><br/>


            To summarize, by the end of the post we will have completed the following:

            </p>
            <br/>
            <ul>
                <li>Create two different Solana tokens and give them names and icons <a href="#tokens-header"><FontAwesomeIcon icon={solid('arrow-right')}  /></a>
</li>
                <li>Use TGB to create wallets for our chosen charities <a href="#charity-header"><FontAwesomeIcon icon={solid('arrow-right')}  /></a></li>
                <li>Create the token launch Dapp that incorporates giving through TGB, and rewards users who pay more than the average <a href="#program-header"><FontAwesomeIcon icon={solid('arrow-right')}  /></a></li>
                <li>Test out the launch Dapp with a simple front-end interface <a href="#app-header"><FontAwesomeIcon icon={solid('arrow-right')}  /></a></li>
                
            </ul>

 


            <h2 id="tokens-header"  className="mt-5" style={{fontSize: "22px"}}>Creating Solana Tokens</h2><br />
            <p>

            To create our tokens on the Solana blockchain we will be making use of the Strata Protocol <a style={{textDecoration: "underline"}}  href="https://app.strataprotocol.com/launchpad/manual/new">launchpad</a>.  Strata makes creating new tokens extremely straight forward, with the whole process taking only a matter of minutes. They also charge zero additional fees to use their platform, which means creating your token only costs about 0.01 SOL, or 30 US cents at time of writing.   
            
            <br/><br/>
            
            You can specify which network you want to launch your token on from the drop down menu on the top right. For this post we will be creating two tokens on the devnet network.  The first will be the primary token for our application, which we will imaginatively call the 'Dao Plays Test Token', with symbol DPTT.  We want this to <i>feel</i> like the sort of token you would get in an old fashioned fairground or arcade, so we will set decimals to zero.  Our launch Dapp will be selling blocks of 1000 or 2000 tokens so we set a supply of 100 million for an optimistic cap of about fifty to one hundred thousand participants. 
            
            <br/><br/>

            The launchpad then provides two final options: i) whether to keep the mint authority, which will allow you to mint more of this sort of token in the future, and ii) whether to keep the freeze authority, which will allow you to freeze token accounts associated with this token.  Neither of our tokens will keep their freeze authority, and for this first token type we will also not keep the mint authority, so our supply of 100 million tokens will  be all that is ever created.  When you click the Create Token button you will be prompted to authorize a couple of transactions related to setting up the accounts that will hold your tokens and the token meta data, and then you are done!   

            <br/><br/>

            We then repeat this process for our second token, which we call the Dao Plays Supporter Test Token.  In this case we keep decimals as zero, but as we will initially only need a much smaller quantity we set the supply to be one hundred thousand.   Given we anticipate that this token will be used over many applications going forward, rather than just one as with the primary token type, we also retain mint authority so that we can produce more if that becomes necessary.

            <br/><br/>

            You can view your newly created tokens on <a style={{textDecoration: "underline"}}  href="https://explorer.solana.com/">explorer.solana</a> by entering the mint address that was reported at the end of the creation process.  For example, our two tokens can be seen <a style={{textDecoration: "underline"}}  href="https://explorer.solana.com/address/CisHceikLeKxYiUqgDVduw2py2GEK71FTRykXGdwf22h?cluster=devnet">here</a> and <a style={{textDecoration: "underline"}}  href="https://explorer.solana.com/address/6tnMgdJsWobrWYfPTa1j8pniYL9YR5M6UVbWrxGcvhkK?cluster=devnet">here</a> (also pictured below).
            </p>
            <br/><br/>
            <Box maxWidth="100%">
                <HStack>
                    <Box>
                        <Image  fluid="true" src={token_img}/>
                    </Box>
                    <Box>
                        <Image fluid="true" src={supporter_token_img}/>
                    </Box>      
                </HStack>
            </Box>

 

            <h2 id="charity-header"  className="mt-5" style={{fontSize: "22px"}}>Creating Donation Wallets With The Giving Block</h2><br />

            <p>     


            Now that we have our tokens it is time to set up our charity wallets.  The Giving Block allow you to donate either to individual organizations, or what they refer to as index funds, which makes it easy to contribute to a collection of similarly themed organizations, where the donation is split evenly between all the members of the index.

            <br/><br/>

            In our example we will be including one index fund (the Ukraine Emergency Response Fund),  and six individual charities, which we list below.   These cover a range of different sectors  such as the environment, accessibility to water, education, human rights, health & medicine, and  effective giving.  You can see a short description of each of these charities in their own words by hovering over the logos below, and can find out more by following the links to their TGB page. We also include a description of each in our front end  application at the end of the post.
            </p>
            <br/><br/>
            <Box maxWidth="100%">
                <HStack>
                    <Box>
                        <Tooltip hasArrow label="Humanitarian Relief Organizations and International Nonprofits participating in this emergency response fund will receive an equal distribution of the fund. These organizations' missions include providing urgent medical care and humanitarian aid to children, individuals, families, and animals.">
                        <Link to="https://thegivingblock.com/campaigns/ukraine-emergency-response-fund/">
                            <Image fluid="true" src={UkraineERF_img}/>
                        </Link>
                        </Tooltip>
                    </Box>
                    <Box>
                    <Tooltip hasArrow label="Water.org is an international nonprofit organization that has positively transformed millions of lives around the world with access to safe water and sanitation through affordable financing. Founded by Gary White and Matt Damon, Water.org pioneers market-driven financial solutions to the global water crisis. For 30 years, we've been providing women hope, children health, and families a future.">
                        <Link to="https://thegivingblock.com/donate/water-org/">
                            <Image  fluid="true" src={WaterOrg_img}/>
                        </Link>
                        </Tooltip>
                    </Box>      
                    <Box>
                    <Tooltip hasArrow label="One Tree Planted is a 501(c)(3) nonprofit on a mission to make it simple for anyone to help the environment by planting trees. Their projects span the globe and are done in partnership with local communities and knowledgeable experts to create an impact for nature, people, and wildlife. Reforestation helps to rebuild forests after fires and floods, provide jobs for social impact, and restore biodiversity. Many projects have overlapping objectives, creating a combination of benefits that contribute to the UN's Sustainable Development Goals.">
                        <Link to="https://thegivingblock.com/donate/one-tree-planted/">
                            <Image  fluid="true" src={OneTreePlanted_img}/>
                        </Link>
                        </Tooltip>
                    </Box>    
                   
                    <Box>
                    <Tooltip hasArrow label="Evidence Action is a global nonprofit organization with an approach distinctive in international development - we exclusively scale interventions that are backed by strong evidence and can be delivered with exceptional cost-effectiveness. Our programs have grown since our founding in 2013 to reach over 280 million people annually. We take a data-driven approach to identifying, scaling, and continuously improving programs which deliver immense impact, ensuring these solutions measurably improve the lives of millions.">
                        <Link to="https://thegivingblock.com/donate/evidence-action/">
                            <Image  fluid="true" src={EvidenceAction_img}/>
                        </Link>
                        </Tooltip>
                    </Box>
                    <Box>
                    <Tooltip hasArrow label=" Girls Who Code is on a mission to close the gender gap in technology and to change the image of what a programmer looks like and does. Girls Who Code equips girls with the skills they need to pursue careers in technology, and the confidence they need to break barriers and thrive in a male-dominated industry.">
                        <Link to="https://thegivingblock.com/donate/girls-who-code/">
                            <Image  fluid="true" src={GWC_img}/>
                        </Link>
                        </Tooltip>
                    </Box>      
                    <Box>
                    <Tooltip hasArrow label="OutRight Action International fights for human rights and equality for lesbian, gay, bisexual, transgender, intersex and queer (LGBTIQ) people everywhere and to eliminate the systemic violence, persecution and discrimination LGBTIQ people face around the world. OutRight conducts vital and original research, advocates with governments at the United Nations and beyond, and supports grassroots LGBTIQ activists and organizations in dozens of countries each year.">
                        <Link to="https://thegivingblock.com/donate/outright-action-international/">
                            <Image fluid="true" src={Outright_img}/>
                        </Link>
                        </Tooltip>
                    </Box>    
                    <Box>
                    <Tooltip hasArrow label="The Life You Can Save is an advocacy nonprofit that makes “smart giving simple” by identifying and recommending some of the world's most effective charities. We currently recommend over 20 outstanding charities whose evidence-based, cost-effective interventions have been proven to save and transform the lives of people living in extreme global poverty (defined as less than US$1.90 per day).

                    We provide free tools and resources that make it easy to learn about and support these wonderful organizations so that you can give where it matters most and ensure that you get the most “bang for your buck.”">
                        <Link to="https://thegivingblock.com/donate/the-life-you-can-save/">
                            <Image  fluid="true" src={LifeYouCanSave_img}/>
                        </Link>
                        </Tooltip>
                    </Box>   
                    </HStack> 
                
            </Box>

            <br/><br/>
            <p>
            

            When you visit an organization's  page on TGB you can use the widget to select the cryptocurrency you want your wallet to be in, and can then choose to either enter your personal details, or donate anonymously.  At this point you are given a unique public key that is tied to that organization, and any donations made to that account will be tied to you (if you entered your details).  This widget makes use of <a style={{textDecoration: "underline"}} href="https://docs.thegivingblock.com/faq/frequently-asked-questions/why-is-the-wallet-address-different-every-time#:~:text=The%20Giving%20Block-,Why%20is%20the%20wallet%20address%20different%20every%20time%3F,that%20you%20are%20donating%20to.">dynamic</a> wallet addresses, so that every time you go back to the page and repeat this process you will be presented with a new address.  This means that if privacy is a concern you can donate from different  personal wallets, to different TGB wallets, in order to obfuscate your donations from third parties. 

            <br/><br/>

            The only drawback with this process currently is that there is no way to cryptographically verify that one of  these dynamic addresses really is related to The Giving Block, or therefore, to verify which cause it is for.  This is a shortcoming that they are currently working to resolve, but until then when developing a trustless DApp, we have to rely on a non-cryptographic solution to  publicly verify the accounts.  In particular, after getting your wallets it is necessary for you to donate a small amount to each one, publicly display the transactions to these (for example by tweeting the transaction ids), and then TGB will verify via their twitter account that these donations were for genuine accounts, and which causes they are linked to.

            <br/> <br/>

            While this allows potential users of your program to be confident that the wallets they are sending their crypto to are genuine, it unfortunately doesn't solve the reverse problem.  It would be great to have the option for a user of our token sale to simply provide us with the account of a charity they would like to support, rather than having to choose one from a list.  However currently there is no way for us to verify on chain in an automated way that the account really is a TGB account, hence why we must provide a list of authenticated accounts.  We will be sure to post an updated version of this guide when the cryptographic solutions are available.
            </p>

            <h2 id="program-header" className="mt-5" style={{fontSize: "22px"}}>Creating The Launch Program</h2><br />

            <p>
            Now that we have both our tokens and our charity wallets we can start putting together the program that is going to actually handle the token launch.  Our program will have 3 main functions:

            </p>
            <br/>
            <ul>
                <li><Code>init_token_launch</Code>: Initialises the token launch, creates the program's data account and transfers tokens over to the program</li>
                <li><Code>join_token_launch</Code>: Allows users to participate in the token launch</li>
                <li><Code>end_token_launch</Code>: Ends the token launch, and transfers any remaining tokens back from the program</li>
                
            </ul>
            <br/>

            You can find the full code for this program at our Github repo, <a style={{textDecoration: "underline"}} href="https://github.com/daoplays/solana_examples/tree/master/charity_token_launch">here</a>.

            <h3 id="init-header" className="mt-5" style={{fontSize: "20px"}}>Initialising The Token Launch</h3><br />

            <p>

            The first of the three functions introduces almost all of the key Solana concepts that will be at play within the program as a whole, namely  'program derived addresses', 'associated token accounts', and 'cross program invocation'. We will go through each of these in turn below as we implement the three main tasks that this function must perform:
            
            <br/><br/> 
            <ul>
                <li>Creating the program's data account <a href="#pda-header"><FontAwesomeIcon icon={solid('arrow-right')}  /></a></li>
                <li>Creating the program's token accounts for each of our tokens <a href="#ata-header"><FontAwesomeIcon icon={solid('arrow-right')}  /></a></li>
                <li>Transferring our tokens from our personal wallet to the program to manage  during the token launch <a href="#transfer-header"><FontAwesomeIcon icon={solid('arrow-right')}  /></a></li>
            </ul>
 

            <br/>

            </p>

            <h4 id="pda-header" className="mt-5" style={{fontSize: "18px"}}>Creating The Program's Data Account</h4><br />

            <p>
            The most straight forward way to handle a token launch is to have our program be responsible for sending out tokens to participants.  Right now, however, the tokens are sitting in our own accounts, and the program doesn't have any authority to take the tokens from there, and send them on as needed.  We therefore need to give the program control over the tokens, and to do that we first create (or more accurately, find) what is referred to as a 'Program derived address' (PDA).

            <br/><br/>

            There are many in depth discussions of exactly what PDAs are already available online (for example <a style={{textDecoration: "underline"}} href="https://solanacookbook.com/core-concepts/pdas.html">here</a> or <a style={{textDecoration: "underline"}} href="https://www.brianfriel.xyz/understanding-program-derived-addresses/">here</a>) so we won't spend much time discussing the technical details of how they differ from a standard wallet address.  For our purposes it is enough to say that a PDA is nothing more than the public key for an account that is owned by a program rather than by a person.  Having a PDA will allow the program to have it's own token accounts, and critically will allow it to sign transactions that involve sending tokens from those accounts.  Only the program that owns the PDA will be able to sign such transactions, and so in this regard the PDA provides the same functionality to the program as a keypair provides to a human.  

            <br/><br/>

            The Solana  API  provides the <Code><a style={{textDecoration: "underline"}} href="https://docs.rs/solana-program/latest/solana_program/pubkey/struct.Pubkey.html#method.find_program_address">find_program_address</a></Code> function to find a PDA for your program which can  be used on or off chain to easily obtain the right public key, without having to actually store it anywhere.  This function takes as arguments an array of bytes that will be used as a seed (in our case just the string "token_account", where the lower case "b" converts that to a byte array), and the program's own public key. 
            </p>

            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {pda_address}
            </SyntaxHighlighter>
            <br />  

            If you look at the <a style={{textDecoration: "underline"}} href="https://docs.rs/solana-program/latest/src/solana_program/pubkey.rs.html#456-459">source</a> for this function, you can see that all it is doing is calling the <Code>create_program_address</Code> function using  both the provided seed, and a separate bump seed which starts at a value of 255  and decreases by one until the function finds a valid PDA. Once it has been found it is recommended to directly call <Code>create_program_address</Code> on chain and simply pass the correct bump_seed, rather than reusing <Code>find_program_address</Code> as the former can be significantly less costly.

            <br/><br/>

            Now that we know where the program's account is going to live we need to actually create it, and for this we make use of Solana's <Code><a style={{textDecoration: "underline"}} href="https://docs.rs/solana-program/1.4.18/solana_program/system_instruction/fn.create_account.html">create_account</a></Code> function:

            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {create_account}
            </SyntaxHighlighter>
            <br /> 

            The <Code>from_pubkey</Code> refers to the wallet address that will fund the creation of the account, and the <Code>to_pubkey</Code> is simply the address where we want to create our new account which will be the PDA.  The third pubkey that is passed as the last argument, <Code>owner</Code>, is the address of our program.   In english then, this will create a new account for which our program will be the owner, at the location of our newly found PDA, and we will fund it's creation with our own wallet.
            
            <br/><br/>
            
            The other two arguments, lamports and space are related.  In order to have an account and to store data in that account you need to pay what is referred to as <a style={{textDecoration: "underline"}}   href="https://docs.solana.com/implemented-proposals/rent">rent</a>.     There are two supported methods of paying rent, but we will only be interested in the <i>rent-exempt</i> method, where we deposit enough lamports into the account to ensure it survives indefinitely without being deleted.

            <br/><br/>

            As you might expect, the more data you want to store the more rent you need to pay. If you have the solana CLI installed you can use this to check the current rent-exempt cost for any amount of data.  For example, if you ask for the rent required for 0 bytes, you will be shown the cost to have a basic account that stores no additional data:

            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
                {rent_0}
            </SyntaxHighlighter>
            <br /> 

            In order to achieve this rent exempt state we will therefore have to know what we want to store, and what the rent-exemption cost will be to store it.  We define the following struct in our program which is going to save a summary of the totals donated to each charity, the total paid, and the number of accounts that have participated in the launch.

            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {ico_state}
            </SyntaxHighlighter>
            <br />  

            As this is quite a simple struct we could quite easily work out the size by hand, and then check the rent-exempt cost. The borsh library however provides a straight forward way to do this for us using the <Code><a style={{textDecoration: "underline"}} href="https://docs.rs/borsh/latest/borsh/ser/trait.BorshSerialize.html#method.try_to_vec">try_to_vec</a></Code> function.
            
             <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {ico_size}
            </SyntaxHighlighter>
            <br />  

            The <Code><a style={{textDecoration: "underline"}} href="https://docs.rs/solana-program/latest/solana_program/rent/struct.Rent.html#method.minimum_balance">minimum_balance</a> </Code> function provided by Solana  then takes this size and returns the current balance in lamports required for us to keep the account rent free.

            Our function to create the program's data account that combines these elements is shown below:
            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {create_pda}
            </SyntaxHighlighter>
            <br />       
            
            In order to actually execute the instruction we need to make use of cross program invocation (see <a  style={{textDecoration: "underline"}}  href="https://docs.solana.com/developing/programming-model/calling-between-programs">here</a> for more details) which simply means that we are going to call a different program from within our program.  In this case we are going to be calling the system program which is responsible for creating new accounts, and we do so with the <Code><a  style={{textDecoration: "underline"}}  href="https://docs.rs/solana-program/latest/solana_program/program/fn.invoke_signed.html">invoke_signed</a></Code> function below.

            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {create_pda_2}
            </SyntaxHighlighter>
            <br />  

            The seeds that are passed are the same as those that we used to find our derived program address initially, along with the bump seed returned by that program. In this way the program is able to sign the transaction that will create it's own account.

            <br/><br/>

            <h4 id="ata-header" className="mt-5" style={{fontSize: "18px"}}>Creating The Token Accounts</h4><br />


            The next piece of functionality we need to add is the ability to create the token accounts for our program.  On the Solana blockchain each user can only store tokens of a particular type in a token account that corresponds to that type of token.  As discussed in the Solana <a style={{textDecoration: "underline"}} href="https://spl.solana.com/associated-token-account">docs</a> it is perfectly possible for a user to have multiple token accounts for the same token, which can make it difficult for a program to know which account tokens should be sent to.  The Associated Token Program was thus introduced as a way to deterministically derive a token account address from the combination of a user's wallet address and the token's mint address.  As both the user and the program will arrive at the same token account address when using this method it also makes it easy for the program to create the account when required and overall reduces friction during token launches. 
            
            <br/><br/>
            
            These accounts are called Associated Token Accounts, and in order to create one we first need to get the address using the <Code><a style={{textDecoration: "underline"}} href="https://docs.rs/spl-associated-token-account/latest/spl_associated_token_account/fn.get_associated_token_address.html">get_associated_token_address</a></Code> function.  This takes either the wallet address of a user, or in this case, the address of our program's account, and the mint address of our token:
            
            
            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {find_token_address}
            </SyntaxHighlighter>
            <br /> 

            Once we have this address we can then simply call <Code><a style={{textDecoration: "underline"}} href="https://docs.rs/spl-associated-token-account/latest/spl_associated_token_account/instruction/fn.create_associated_token_account.html">create_associated_token_address</a></Code> to actually create the account:

            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {create_token_address}
            </SyntaxHighlighter>
            <br /> 
            With these functions in mind we then have everything we need to implement the creation of our token accounts.  We show below out  complete function which we will simply call twice when initialising the token launch, once for the main token account, and once for the supporters token account.  Note in this case we need only call <Code>invoke</Code> rather than <Code>invoke_signed</Code> because it is the funding wallet that will be signing the transaction, rather than our program.

            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {create_token_account}
            </SyntaxHighlighter>
            <br /> 

            <h4 id="transfer-header" className="mt-5" style={{fontSize: "18px"}}>Transferring The Tokens</h4><br />


            The final task we must perform in this function is to transfer our tokens to the programs newly created token accounts.
            To do this we will be making use of the spl_token function <Code><a  style={{textDecoration: "underline"}}  href="https://docs.rs/spl-token/latest/spl_token/instruction/fn.transfer.html">transfer</a></Code>:

            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {transfer_function}
            </SyntaxHighlighter>
            <br />

            The arguments here are relatively self explanatory, the <Code>authority_pubkey</Code> in this case will be our wallet, however when the program is transferring tokens to other users that will be the PDA.  In our use cases we will be leaving the signers vector empty.  Our complete function to handle transferring the tokens is shown below, and it's structure should by now by quite familiar!  We simply create the instruction, and then call <Code>invoke_signed</Code> to handle the cross program invocation and actually enact the transaction.  Note that in this case we could have used <Code>invoke</Code>, as our PDA doesn't need to sign this transaction, however when the program is sending out tokens then we do need to use <Code>invoke_signed</Code> and it is simpler to just use it generically for both cases.

            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {transfer_tokens}
            </SyntaxHighlighter>
            <br /> 
            
            <h3 className="mt-5" style={{fontSize: "20px"}}>Joining The Token Launch</h3><br />

            <p>
            The second of our main functions will allow users to participate in the token launch, and will be responsible for handling the SOL payments and sending out the different token types to the participants.  The overall flow of the code is as follows:
            </p>

            <br/>
            <ul>
                <li>Load and check all of the accounts passed to the function</li>
                <li>Check that the minimum payment has been exceeded</li>
                <li>Create the  users main token account if required</li>
                <li>Check that the user doesn't already have tokens, and that there are enough tokens left to send</li>
                <li>Check if the  user paid over the average</li>
                <li>Transfer SOL to the charity and developers</li>
                <li>Transfer tokens to the user</li>
                <li>Update the statistics stored in the program's account</li>
            </ul>
           <br/>
            
            This function expects to be passed thirteen accounts, and as before we will skip over the loading and checking of all of these in this post.  The first real check we make is to ensure that the minimum amount to be paid has been exceeded.  We do this before creating any accounts or going further into the function.

            <br/><br/>

            When calling the join_ico function from off chain we pass a JoinMeta struct, which has the following fields:
            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {join_meta}
            </SyntaxHighlighter>
            <br />     

            Here <Code>amount_charity</Code> and <Code>amount_dao</Code> are the amounts in lamports to be paid to the chosen charity, and to the developers respectively.  The <Code>Charity</Code> type of the final member of this struct refers to an enum we have defined in <Code>state.rs</Code>:

            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {charity_enum}
            </SyntaxHighlighter>
            <br />  

            In order to check that the minimum amount has been exceeded, we therefore need only sum amount_charity and amount_dao and compare that to the minimum, which in this example we have set to 0.0001 SOL, or about 0.35 US cents at time of writing:   

            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {join_0}
            </SyntaxHighlighter>
            <br />    

            We next check if the joiners associated token account already exists by using <Code><a style={{textDecoration: "underline"}}  href="https://docs.rs/solana-program/latest/solana_program/account_info/struct.AccountInfo.html#method.try_borrow_lamports">try_borrow_lamports</a></Code>, which will return a positive value if it has been previously initialised and there are lamports present in it. If it doesn't exist we create it using our <Code>create_token_account</Code> function:

            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {join_1}
            </SyntaxHighlighter>
            <br /> 

            The next step is to check whether the user's token account already has Dao Plays Test Tokens in it.  In an ideal world we would be able to limit a person to participating only once in the token launch, so that we could maximise the number of unique users taking part. Unfortunately this is impossible, as a single user can just create multiple accounts in order to participate as many times as they would like. We at least want to make our intentions clear though, and so stop someone from participating if they already have tokens in their account so that they at least need to spend transaction costs to either move them elsewhere, or to create a new token account with a different wallet.  In order to do this we need to get the account's <a style={{textDecoration: "underline"}}   href="https://docs.rs/spl-token/latest/spl_token/state/struct.Account.html">data</a> from the token account, which we do with the provided <Code><a style={{textDecoration: "underline"}} href ="https://docs.rs/solana-program/latest/solana_program/program_pack/trait.Pack.html#method.unpack_unchecked">unpack_unchecked</a></Code> function:

            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {join_2}
            </SyntaxHighlighter>
            <br /> 

            Next we want to check whether the participant has paid more than the current average, in which case they are awarded supporter status, and so will receive double the number of DPTTs, and an additional supporters token.  The current average price is stored in the program's data account, so we first have to retrieve that using the <Code><a style={{textDecoration: "underline"}} href="https://docs.rs/borsh/latest/borsh/de/trait.BorshDeserialize.html#method.try_from_slice">try_from_slice</a></Code> function from the <Code><a style={{textDecoration: "underline"}} href="https://docs.rs/crate/borsh/latest">borsh</a></Code> crate.  As a last check before proceeding we simply make sure there are enough DPTTs remaining.  We don't need to do this for the supporters tokens as we have made sure there is a sufficient supply even if every participant is a supporter.

            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {join_3}
            </SyntaxHighlighter>
            <br /> 

            In order to transfer SOL from one account to another on chain we once again make use of the <Code>invoke</Code> function, this time executing the <Code><a style={{textDecoration: "underline"}} href="https://docs.rs/solana-sdk/latest/solana_sdk/system_instruction/fn.transfer.html">transfer</a></Code> instruction, first to send the charity's amount, and then the developer's:


            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {join_4}
            </SyntaxHighlighter>
            <br /> 

            The next section introduces nothing new.  We first transfer the DPTTs to the participant, and then check to see whether they have supporters status in order to create the associated token account for the supporter token (if required) and then send that as well:

            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {join_5}
            </SyntaxHighlighter>
            <br /> 

            The last step in this function is to update all the launch statistics with the new participants payment and donation.  We once again use the <Code>borsh</Code> library to send the current state to the program's data account using the <Code><a style={{textDecoration: "underline"}} href="https://docs.rs/borsh/latest/borsh/ser/trait.BorshSerialize.html#tymethod.serialize">serialize</a></Code> function:

            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {join_6}
            </SyntaxHighlighter>
            <br /> 



            <h3 id="ending-header" className="mt-5" style={{fontSize: "20px"}}>Ending the Token Launch</h3><br />

            In order to end the token launch we are simply going to transfer any remaining tokens that are in the programs two token accounts back into our own accounts, and then close those token accounts in order to retrieve the lamports being used to maintain their rent exempt status.  We will leave the program and data account up and running so that we can continue to access the donation statistics, though in principle this could also be transferred elsewhere if you so wished.

            The only new function we will make use of here is the spl_token instruction <Code><a style={{textDecoration: "underline"}}    href="https://docs.rs/spl-token/latest/spl_token/instruction/fn.close_account.html">close_account</a></Code>:
            
            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {close_account}
            </SyntaxHighlighter>
            <br /> 
            
            
            This can only be called on a token account that has no tokens remaining, and will take care of transferring the lamports to the <Code>destination_pubkey</Code> account.  The reason that we can't simply do this ourselves with a transfer instruction is that neither we nor the program actually own the token account, the token program does, and so the token program must be the one that sends us the lamports.

            <br/><br/>

            We define our <Code>close_program_token_account</Code> function below, which takes the our program account and it's token account, our wallet and the destination token account and the token program itself:


            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {close_account_one}
            </SyntaxHighlighter>
            <br /> 

            We first perform a couple of sanity checks.  Firstly the destination token account should already exist in our use case as we are simply returning the tokens to their original home, and secondly the program's tokens account should also still be initialised and have it's lamports.  If the latter  isn't true we must have already closed the account and so we can simply return out of this function as there is nothing left to do.

            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {close_account_two}
            </SyntaxHighlighter>
            <br /> 

            As in our <Code>join_token_launch</Code> function we make use of the <Code>unpack_unchecked</Code> spl_token function to grab the token account's data so that we can retrieve the remaining token balance.  If there are any tokens left we then make use of our <Code>transfer_token</Code> function to send them to the <Code>destination_token_account</Code>:

            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {close_account_three}
            </SyntaxHighlighter>
            <br /> 

            As the last step we now make use of the spl_token <Code>close_account</Code> function, and call <Code>invoke_signed</Code> to allow our program to sign the transaction:

            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {close_account_four}
            </SyntaxHighlighter>
            <br /> 


            Our <Code>end_token_launch</Code> function then simply has to call this function for both the main token account, and the supporters token account after parsing and checking the account details as usual.

            <h3 id="app-header"  className="mt-5" style={{fontSize: "22px"}}>A Working Token Launch DApp</h3><br />

            Below we have an example interface to our token launch program, the code for which can be found <a  style={{textDecoration: "underline"}}  href="https://github.com/daoplays/website">here</a>.   It is running on the devnet network so feel free to be generous with your donations as there is no real money involved!  We will be using this same approach in the token launch for our first real DApp, so if you have any comments or suggestions, please let us know.

            <CharityDapp/>
          

            <p>

            We hope that you have found this post useful, and might be motivated to try and launch your own charitable token launch in the future.  If so feel free to follow us on <a style={{textDecoration: "underline"}} href="http://www.twitter.com/dao_plays">Twitter</a> to keep up to date with future posts!

            </p>
            </main>
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
