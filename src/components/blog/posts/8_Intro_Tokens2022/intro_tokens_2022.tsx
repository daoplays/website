import React from "react";
import { Tokens2022 } from "../../apps/Token2022";
import SyntaxHighlighter from "react-syntax-highlighter";
import { docco } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { ChakraProvider, theme, Code } from "@chakra-ui/react";

import "../../../css/code.css";

function PostContent() {
    const extension_size = `let mut extension_types: Vec<spl_token_2022::extension::ExtensionType> = Vec::new();
if include_transfer {
    extension_types.push(spl_token_2022::extension::ExtensionType::TransferFeeConfig);
}
if include_delegate {
    extension_types.push(spl_token_2022::extension::ExtensionType::PermanentDelegate);
}
if include_interest {
    extension_types.push(spl_token_2022::extension::ExtensionType::InterestBearingConfig);
}
if include_non_transferable {
    extension_types.push(spl_token_2022::extension::ExtensionType::NonTransferable);
}
if include_default_state {
    extension_types.push(spl_token_2022::extension::ExtensionType::DefaultAccountState);
}

// calculate the total space required for the token including extensions
let space = spl_token_2022::extension::ExtensionType::get_account_len::<spl_token_2022::state::Mint>(&extension_types);
// then calculate the rent required for our token
let mint_rent = rent::Rent::default().minimum_balance(space);`;

    const create_account = `let create_idx = solana_program::system_instruction::create_account(
        &funding_account_info.key,
        &token_mint_account_info.key,
        mint_rent,
        space as u64,
        &spl_token_2022::id(),
    );

    invoke(
        &create_idx,
        &[
            funding_account_info.clone(),
            token_mint_account_info.clone(),
        ],
    )?;`;

    const transfer_config = `let config_init_idx =
spl_token_2022::extension::transfer_fee::instruction::initialize_transfer_fee_config(
    // token program id
    &spl_token_2022::ID,
    // token mint
    &token_mint_account_info.key,
    // transfer fee config authority
    Some(&funding_account_info.key),
    // transfer fee withdraw authority
    Some(&funding_account_info.key),
    // transfer fee basis points
    metadata.transfer_fee_bp,
    // maximum transfer fee
    metadata.transfer_fee_max,
)
.unwrap();

invoke(
    &config_init_idx,
    &[
        token_program_account_info.clone(),
        token_mint_account_info.clone(),
        funding_account_info.clone(),
    ],
)?;`;

    const delegate_config = `let config_init_idx = spl_token_2022::instruction::initialize_permanent_delegate(
    // token program id
    &token_program_account_info.key,
    // token mint
    &token_mint_account_info.key,
    // delegate account
    &funding_account_info.key,
)
.unwrap();

invoke(
    &config_init_idx,
    &[
        token_program_account_info.clone(),
        token_mint_account_info.clone(),
        funding_account_info.clone(),
    ],
)?;`;

    const interest_config = `let config_init_idx =
spl_token_2022::extension::interest_bearing_mint::instruction::initialize(
    // token program id
    &spl_token_2022::ID,
    // token mint
    &token_mint_account_info.key,
    // rate authority
    Some(*funding_account_info.key),
    // initial interest rate
    metadata.interest_rate,
)
.unwrap();

invoke(
&config_init_idx,
&[
    token_program_account_info.clone(),
    token_mint_account_info.clone(),
    funding_account_info.clone(),
],
)?;`;

    const non_transferable_config = `let config_init_idx = spl_token_2022::instruction::initialize_non_transferable_mint(
    //  token program id
    &spl_token_2022::id(),
    // token mint
    &token_mint_account_info.key,
)
.unwrap();

invoke(
    &config_init_idx,
    &[
        token_program_account_info.clone(),
        token_mint_account_info.clone(),
    ],
)?;`;

    const default_state_config = `let config_init_idx =
spl_token_2022::extension::default_account_state::instruction::initialize_default_account_state(
    // token program id
    &spl_token_2022::ID,
    // token mint
    &token_mint_account_info.key,
    // default state
    &spl_token_2022::state::AccountState::Frozen
)
.unwrap();

invoke(
    &config_init_idx,
    &[
        token_program_account_info.clone(),
        token_mint_account_info.clone(),
        funding_account_info.clone(),
    ],
)?;`;

    return (
        <div className="home" style={{ fontSize: 18 }}>
            <div className="container">
                <h1 className="h1 text-center mb-0 pt-3 font-weight-bold text-body">
                    An Overview of the Solana SPL Token 2022 program (part 1)
                </h1>
                <h1 className="h5 text-center mb-1 pt-0 font-weight-bold text-secondary">Jun 13 2023</h1>
                <br />
                The original Token-Program has provided the foundation for creating and trading both fungible and non-fungible tokens on the
                Solana blockchain since its launch in 2020. The program allows developers to define and customize basic token attributes
                such as supply, and decimal places, and provides mechanisms for token minting, burning, and transferring between addresses.
                Additionally, the Solana Token Program supports features like token freezing, which allows token issuers to restrict certain
                accounts from transferring or receiving tokens.
                <br />
                <br />
                Since its launch however, the complexity of programs being built on the blockchain has increased, and the need for a more
                sophisticated token program has become evident. The Token-2022 Program aims to serve that purpose, and is specifically
                designed to meet the demands of modern programs running on the blockchain. This updated program uses a collection of
                "extensions", each of which provides some added functionality beyond the standard program, and allows for new extensions to
                be added down the line without the need to migrate to an entirely new program.
                <br />
                <br />
                Although the Token-2022 program is still under audit, it is due to be recommended for mainnet use in Fall 2023. As such we
                thought this was a good time to write a series of posts that introduce it, and explains some of the additional functionality
                by building test programs that make use of the new extensions. This first post will go through the simplest of the new
                extensions, such as an automatic transfer fee, and how to make use of them on chain. In particular we are going to consider
                five of the possible extensions:
                <br />
                <br />
                <ul>
                    <li>Transfer Fee - Applies an automatic fee to every transfer of tokens from the mint </li>
                    <li>Permanent Delegate - Gives an account the authority to burn or transfer any amount of tokens from any account.</li>
                    <li>
                        Interest Rate - A cosmetic feature that provides a visual indication of the total tokens owned plus interest (but
                        doesn't actually create new tokens).
                    </li>
                    <li>Non-Transferable - Soulbound tokens that can't be transferred but can still be burnt.</li>
                    <li>Default Account State - Forces all new token accounts to be frozen on creation.</li>
                </ul>
                At the end of the post we also have a simple app that lets you create Token-2022 tokens with any mix of the above features,
                and to test some of the functionality, including the transfer fee and comparing the token amounts with or without interest.
                The on chain code from this example is available{" "}
                <a
                    style={{ textDecoration: "underline" }}
                    href="https://github.com/daoplays/solana_examples/tree/master/token_2022/program"
                >
                    here
                </a>
                , and the front end code is also available{" "}
                <a style={{ textDecoration: "underline" }} href="https://github.com/daoplays/website">
                    here
                </a>
                .
                <br />
                <br />
                For the most part creating a token with the new program works in the same way as with the original, so we will just skim
                over those parts as they are the same as in our earlier posts. For each extension you want to include in the token you just
                need to calculate the size of the token including extensions, call the associated initialize functions. The standard also
                allows for the user to add extensions after creating the token, however we will not cover that in this post, though you can
                read about it here.
                <h2 id="tokens-header" className="mt-5" style={{ fontSize: "22px" }}>
                    Overview
                </h2>
                In order to set up a token mint on-chain, either with the original Token Program, or with Token-2022, we need to follow the
                following process:
                <ul>
                    <li>Determine the account size </li>
                    <li>
                        Create the account with the{" "}
                        <Code className="mycode">
                            <a
                                style={{ textDecoration: "underline" }}
                                href="https://docs.rs/solana-program/latest/solana_program/system_instruction/fn.create_account.html"
                            >
                                create_account
                            </a>
                        </Code>{" "}
                        function
                    </li>
                    <li>For Token-2022 we then initialize any desired extensions</li>
                    <li>
                        Initialize the mint account with the{" "}
                        <Code className="mycode">
                            <a
                                style={{ textDecoration: "underline" }}
                                href="https://docs.rs/spl-token/latest/spl_token/instruction/fn.initialize_mint2.html"
                            >
                                initialize_mint2
                            </a>
                        </Code>{" "}
                        function
                    </li>
                    <li>Create a token account for the mint</li>
                    <li>Mint tokens into the token account</li>
                </ul>
                <h3 id="tokens-header" className="mt-5" style={{ fontSize: "20px" }}>
                    Determining the Account Size
                </h3>
                The first thing we need to do is to calculate the size of the mint account, including any extensions that we want to enable.
                To do this we use the function{" "}
                <Code className="mycode">
                    <a
                        style={{ textDecoration: "underline" }}
                        href="https://docs.rs/spl-token-2022/latest/spl_token_2022/extension/enum.ExtensionType.html#method.get_account_len"
                    >
                        get_account_len
                    </a>
                </Code>{" "}
                which takes as an argument a vector of the extensions we want to include.
                <br />
                <br />
                The extension types are given in the{" "}
                <Code className="mycode">
                    <a
                        style={{ textDecoration: "underline" }}
                        href="https://docs.rs/spl-token-2022/latest/spl_token_2022/extension/enum.ExtensionType.htmlExtensionType"
                    >
                        ExtensionType
                    </a>
                </Code>{" "}
                enum in the token library. Note that the naming conventions here are not particularly consistent, and so when determining
                the size of the account we will include <Code className="mycode">TransferFeeConfig</Code> and{" "}
                <Code className="mycode">InterestBearingConfig</Code> , which both have the Config suffix, whereas others are simply called,
                for example, <Code className="mycode">DefaultAccountState</Code>
                .
                <br />
                <br />
                <SyntaxHighlighter language="rust" style={docco}>
                    {extension_size}
                </SyntaxHighlighter>
                With the size of the mint account calculate, we can now use the <Code className="mycode">create_account</Code> function to
                actually create the account, making sure to pass the token_2022 program id rather than the standard token program.
                <br />
                <br />
                <SyntaxHighlighter language="rust" style={docco}>
                    {create_account}
                </SyntaxHighlighter>
                With the account created we can now start to call the appropriate functions to initialize the extensions. Unfortunately as
                with the names in the enum these are not particularly consistent, with some instructions being located in their extensions
                module, and others being located in the base token instruction module. We will go through each of the give extensions in
                turn below.
                <h3 id="tokens-header" className="mt-5" style={{ fontSize: "20px" }}>
                    Transfer Fee
                </h3>
                With the standard token program there is no way to enforce a fee on every transfer. The best one can do is to freeze a token
                holders account when they interact with your program for the first time, and then force all transfers to go through that
                program. In doing so you can unfreeze, transfer and then refreeze the accounts in a single transaction, taking some fee in
                the process. With Token-2022 fees can be incorporated within the transfer function itself, so that they are always included.
                When initializing the config one just specifies the fee in basis points (e.g. a fee of 500 basis points would yield 5 tokens
                on a transfer of 100 tokens) and a maximum fee that caps the amount that will be taken, which in principle can be
                sufficiently large that it will never be hit. In addition the fee extension config requires two authorities to be specified:
                i) the "Transfer Fee Authority" - the user that can update the value of the transfer fee, and ii) the "Withdraw Withheld
                Authority" - the user that can retrieve the fees.
                <br />
                <br />
                When a transfer occurs the fees are actually held in the destination account of the transfer. So, if person A transfers 100
                tokens to person B with a 500 b.p fee, then in person B's token account they will see 95 tokens available to them, and 5
                tokens that are 'withheld'. It is up to the "Withdraw Withheld Authority" of the token to then actually transfer those
                withheld tokens elsewhere. Solana implemented the fee transfer in this way to maximise the parallelization of transactions
                across the network. If there was a single 'fee account' then that account would be write-locked between parallel transfers,
                decreasing the throughput of the transfer protocol. This is fair enough, but for the fee collector that may mean having to
                hoover up small quantities of fees from thousands of accounts, and paying the network fees to do so.
                <br />
                <br />
                If a user interacts with your program regularly though it should be simple enough to insert instructions that transfer over
                any withheld tokens as they are found. ALternatively if you wanted to you could simply not set a Withdraw authority, in
                which case the fee acts more as a token burn, where the fees are just permanently taken out of the ecosystem.
                <br />
                <br />
                The config is created by invoking the{" "}
                <Code className="mycode">
                    <a
                        style={{ textDecoration: "underline" }}
                        href="https://docs.rs/spl-token-2022/latest/spl_token_2022/extension/transfer_fee/instruction/fn.initialize_transfer_fee_config.html"
                    >
                        initialize_transfer_fee_config
                    </a>
                </Code>{" "}
                function
                <br />
                <br />
                <SyntaxHighlighter language="rust" style={docco}>
                    {transfer_config}
                </SyntaxHighlighter>
                In the app at the bottom of this post you will be able to test out the Transfer fee by sending tokens to randomly generated
                accounts. The fees accrued will be displayed, and can then be gathered up using the
                <Code className="mycode">
                    <a
                        style={{ textDecoration: "underline" }}
                        href="https://docs.rs/spl-token-2022/latest/spl_token_2022/extension/transfer_fee/instruction/fn.withdraw_withheld_tokens_from_accounts.html"
                    >
                        withdraw_withheld_tokens_from_accounts
                    </a>
                </Code>{" "}
                instruction.
                <h3 id="tokens-header" className="mt-5" style={{ fontSize: "20px" }}>
                    Permanent Delegate
                </h3>
                The permanent delegate of a mint has the ability to transfer or burn tokens from that mint whoever they are owned by. This
                may sound like a somewhat dangerous option to enable, however there are definitely some really interesting use cases. In
                particular a program that has delegate authority over tokens it produces that represent land, or other assets, could
                implement a{" "}
                <a
                    style={{ textDecoration: "underline" }}
                    href="https://en.wikipedia.org/wiki/Harberger_Tax#:~:text=Harberger%20Tax'%2C%20also%20known%20as,allocative%20efficiency%20of%20private%20property."
                >
                    Harberger Tax
                </a>
                , and thus enforce sales or reclamations of those assets. This is definitely something that we will explore more in a future
                post! The config is created by invoking the{" "}
                <Code className="mycode">
                    <a
                        style={{ textDecoration: "underline" }}
                        href="https://docs.rs/spl-token-2022/latest/spl_token_2022/instruction/fn.initialize_permanent_delegate.html"
                    >
                        initialize_permanent_delegate
                    </a>
                </Code>{" "}
                function:
                <br />
                <br />
                <SyntaxHighlighter language="rust" style={docco}>
                    {delegate_config}
                </SyntaxHighlighter>
                <h3 id="tokens-header" className="mt-5" style={{ fontSize: "20px" }}>
                    Interest Rate
                </h3>
                One of the most desirable features for any tokenomics program is the ability for staked tokens to earn some interest over
                time. Although the InterestBearingMint extension doesn't really solve this problem, it does provide a means of easily
                calculating the number of tokens a user should own after some period of time given some interest rate, and then display that
                on screen. The config is created by invoking the{" "}
                <Code className="mycode">
                    <a
                        style={{ textDecoration: "underline" }}
                        href="https://docs.rs/spl-token-2022/latest/spl_token_2022/extension/interest_bearing_mint/instruction/fn.initialize.html"
                    >
                        initialize_non_transferable_mint
                    </a>
                </Code>{" "}
                function, which takes an optional rate_authority (the account that can update the interest rate) and an initial value for
                the rate. In the app below we have set quite a large interest rate as the default so that you can see the amount with
                interest included tick up in real time.
                <br />
                <br />
                <SyntaxHighlighter language="rust" style={docco}>
                    {interest_config}
                </SyntaxHighlighter>
                <h3 id="tokens-header" className="mt-5" style={{ fontSize: "20px" }}>
                    Non-Transferable Tokens
                </h3>
                With the current token system so-called 'soul bound' tokens can be created by freezing the owners token account (We did this
                for achievements in{" "}
                <a style={{ textDecoration: "underline" }} href="https://sol-dungeon">
                    Dungeons & Degens
                </a>
                ). However the user is unable to burn those tokens unless they go through a proprietry program that first unfreezes the
                account and then burns the token. With Token-2022 tokens can be created with the NonTransferable extension, which still
                enables the user to burn the token or close the account, but still disables the ability to transfer them from one account to
                another. The config is created by invoking the{" "}
                <Code className="mycode">
                    <a
                        style={{ textDecoration: "underline" }}
                        href="https://docs.rs/spl-token-2022/latest/spl_token_2022/instruction/fn.initialize_non_transferable_mint.html"
                    >
                        initialize_non_transferable_mint
                    </a>
                </Code>{" "}
                function:
                <br />
                <br />
                <SyntaxHighlighter language="rust" style={docco}>
                    {non_transferable_config}
                </SyntaxHighlighter>
                <h3 id="tokens-header" className="mt-5" style={{ fontSize: "20px" }}>
                    Default Account State
                </h3>
                The last extension we will cover in this post is the DefaultAccountState extension, which enables the creator of a mint to
                ensure that all token accounts are initialised in a frozen state, and need to be thawed by some application before they can
                be used. The config is created by invoking the{" "}
                <Code className="mycode">
                    <a
                        style={{ textDecoration: "underline" }}
                        href="https://docs.rs/spl-token-2022/latest/spl_token_2022/extension/default_account_state/instruction/fn.initialize_default_account_state.html"
                    >
                        initialize_default_account_state
                    </a>
                </Code>{" "}
                function:
                <br />
                <br />
                <SyntaxHighlighter language="rust" style={docco}>
                    {default_state_config}
                </SyntaxHighlighter>
                If you include this in the app below note that you will first have to thaw your mint account before you can do much else!
                <h3 id="tokens-header" className="mt-5" style={{ fontSize: "20px" }}>
                    Minting the tokens
                </h3>
                From this point on there is only really one difference from the standard token program, which is that we use the new{" "}
                <Code className="mycode">
                    <a
                        style={{ textDecoration: "underline" }}
                        href="https://docs.rs/spl-token-2022/latest/spl_token_2022/instruction/fn.mint_to_checked.html"
                    >
                        mint_to_checked
                    </a>
                </Code>{" "}
                instruction to actually mint the tokens, rather than the original <Code className="mycode">mint_to</Code>. This is because
                when including the Fee Transfer extension mint_to will simply fail to transfer the tokens, whereas mint_to_checked is
                backwards compatible and so will transfer with or without the Transfer Fee extension enabled.
                <br />
                <br />
                <h3 id="tokens-header" className="mt-5" style={{ fontSize: "20px" }}>
                    Test Application
                </h3>
                The application below lets you select any combination of the 5 extensions we have discussed and to mint some tokens using
                the Token-2022 program. Some combinations won't really do much (for example don't bother mixing the Transfer Fee and
                Non-Transferable tokens...) however the transfer fee and interest rate extensions are quite nice to see in practice.
                <br />
                <br />
                <Tokens2022 />
                <br />
                Hopefully you have learnt something new about the Token-2022 program in this post. We'll be following it up with a deep dive
                into one of the most interesting extensions, the Transfer Hook, which enables user code to be called whenever a transfer
                takes place. If you don't to miss that then feel free to follow us on{" "}
                <a style={{ textDecoration: "underline" }} href="http://www.twitter.com/dao_plays">
                    Twitter
                </a>{" "}
                to keep up to date with future posts!
            </div>
        </div>
    );
}

function IntroToken2022() {
    return (
        <ChakraProvider theme={theme}>
            <PostContent />
        </ChakraProvider>
    );
}

export default IntroToken2022;
