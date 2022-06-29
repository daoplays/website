import React from "react";
import { AirDrop } from '../../apps/AirDrop';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import {Card, Image} from 'react-bootstrap';
import { Box, HStack, VStack, Center } from '@chakra-ui/react';
import { isMobile } from "react-device-detect";

import phantom_1 from "./phantom_1.png"
import phantom_2 from "./phantom_2.png"
import phantom_3 from "./phantom_3.png"
import sollet_img from "./sollet.png"


function PhantomBlock() {

    return  (
        <>
        <Box>
            <Card style={{ width: '20rem' }} >
                <Card.Img variant="top"  src={phantom_1} alt="banner" />
                <Card.Body>
                    <Card.Text
                    className="text-body mb-4"
                    style={{ fontSize: "1rem" }}
                    >
                    <br/>
                    
                    If you want to you can try and import the file system wallet you made previously to observe the futility of such action, as even if you didn't use the BIP39 passphrase this won't generate the right keys.  For now we would recommend creating a new wallet, it will be easy to import your file system wallet into Phantom later.
                    </Card.Text>
                </Card.Body>
            </Card>
        </Box>
        <Box>
            <Card  style={{ width: '20rem' }}>
                <Card.Img variant="top" src={phantom_2} alt="banner" />
                <Card.Body>
                    <Card.Text
                    className="text-body mb-4"
                    style={{ fontSize: "1rem" }}
                    >
                        <br/>
                        Note that this password is not the same thing as the BIP39 passphrase you used earlier for the file system wallet.  This password won't impact the key you get, but is  used to encrypt the key on your disk.  You will also need this to authorize any transactions.
                    </Card.Text>
                </Card.Body>
            </Card>
        </Box>
        <Box>
            <Card  style={{ width: '20rem' }}>
                <Card.Img variant="top" src={phantom_3} alt="phantom_1" />
                <Card.Body>
                    <Card.Text
                    className="text-body mb-4"
                    style={{ fontSize: "1rem" }}
                    >
                        <br/>
                        Normally you wouldn't show this to anyone, as this is your new seed phrase that will generate your private keys, but we will use this as an example sentence to try and dig into why the file system wallets and Phantom wallets give different public keys even if you don't use the BIP39 passphrase.
                    </Card.Text>
                </Card.Body>
            </Card>
        </Box>
        </>     
    );
}

function SolletBlock() {

    return (
        <>
        <Box >
            <Image src={sollet_img} />
        </Box>
        
        <Box>

            To visualize this you can head over to <a style={{textDecoration: "underline"}} href="https://www.sollet.io/">sollet.io</a>.  At the bottom of the page you can click "Restore existing wallet", and copy your phantom seed phrase into box.  You don't need to enter a password (this isn't referring to a BIPM39 passphrase anyway), so just click next.

            <br/><br/>

            You will be presented with a list of derivable accounts, starting with 0  (this should match your phantom pubkey) and incrementing the account index in the path by one for each subsequent line.

            <br/><br/>

            You should now be armed with everything you need to know to finally import one of your phantom accounts into a file system wallet!  On the command line you can enter:
            <br/><br/>

            <SyntaxHighlighter language="bash" style={docco}>
            {"solana-keygen recover \"prompt://?full-path=m/44'/501'/0'/0'\" -o phantom_0.json"}
            </SyntaxHighlighter>

            <br/>
            And at last the public keys will match.

        </Box>
        
        </>
    );

}

function SolanaIntro() {

const bip39 = 

`For added security, enter a BIP39 passphrase

NOTE! This passphrase improves security of the recovery seed phrase NOT the
keypair file itself, which is stored as insecure plain text

BIP39 Passphrase (empty for none):`

const install_cli =
`sh -c "$(curl -sSfL https://release.solana.com/stable/install)"`

const solana_keygen_system =
`# creates a new keypair in the file my-keypair.json
solana-keygen new --outfile my-keypair.json
# creates a new keypair in the file ~/.config/solana/id.json
solana-keygen new`

    return (
        <div className="home">
            <div class="container">

                <h1 className="h1 text-center mb-0 pt-3 font-weight-bold text-body">Getting Started With Solana</h1>
                <h1 className="h5 text-center mb-1 pt-0 font-weight-bold text-secondary">June 28 2022</h1>
                <br />
                <p>
                The purpose of this post is not to reproduce what is already out there in the official docs for <a style={{textDecoration: "underline"}} href="https://docs.solana.com/wallet-guide">Solana</a> and  <a style={{textDecoration: "underline"}} href="https://phantom.app/">phantom</a> but to fill in some of the blanks, and explain what causes some of the common pitfalls.  By the end of this post we will have gone through the following:
                
                <br/><br/>
                </p>
                <ul>
                    <li>Install the Solana CLI and create a file system wallet</li>
                    <li>Install the phantom wallet extension and create a browser wallet</li>
                    <li>Import the file system wallet into Phantom</li>
                    <li>Import a Phantom wallet as a file system wallet</li>
                </ul>
                <br/>
                <p>
                These last two are where most of the problems lie, and are a result of the many ways that you can derive a public key from a mnemonic seed phrase.  Phantom and the Solana CLI employ slightly different standards, and use language that can be easily conflated, which can lead to confusion when people first start getting involved with Solana.  Hopefully by the end of this post that confusion will be cleared up, and you'll be  ready to start interacting with your first dApps!  As a small check that everything is set up, there is a simple 'AirDrop' app at the bottom of the post which you can use to pay yourself fake SOL that can  be used on the development network.

                </p>

                <h2 className="mt-5" style={{fontSize: "20px"}}>Setting Up A File System Wallet</h2>
                <br/>
                <p>

                When working within a single ecosystem, getting set up with a wallet is (typically) quite straight forward.  The official <a style={{textDecoration: "underline"}} href="https://docs.solana.com/cli/install-solana-cli-tools">docs</a> will take you through installing the CLI, so we won't repeat that here. We will only add we recommend just going with the stable version of the tool, so for example on MacOS  and Linux that would mean running:


                <br /><br /></p>   

                <SyntaxHighlighter language="bash" style={docco}>
                    {install_cli}
                </SyntaxHighlighter>

                <p><br />      

                And then following the last steps as described in their guide.  With the tools installed you can then straight forwardly create a file system wallet with one of the following commands:

                <br /><br /></p>   

                <SyntaxHighlighter language="bash" style={docco}>
                    {solana_keygen_system}
                </SyntaxHighlighter>

                <p><br />   

                When you enter this you will then be presented with the following prompt, which will be one possible source of conflict between the CLI and Phantom:                

                <br /><br /></p>   

                <SyntaxHighlighter language="text" style={docco}>
                    {bip39}
                </SyntaxHighlighter>

                <p><br />          

                The official docs don't have much too say about the BIP39 passphrase, so this will be the first topic we dive into with a bit more detail.  The 39th <i>Bitcoin Improvement Proposal</i> (BIP), which you can read <a style={{textDecoration: "underline"}}  href="https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki">here</a> defined the process both for producing a mnemonic seed phrase, and converting it into a binary seed from which wallets could be generated (more on that last point later).  The advantage of having some standard protocol by which to generate these phrases and produce wallets means that in principle, if you want to change your wallet provider (say, from a file system wallet to a Phantom wallet) you should be able to do this simply by knowing your mnemonic seed phrase.

                <br/><br/>

                The BIP39 passphrase is an additional layer of security, as it means that even if your seed phrase is revealed it will still be very difficult for anyone to actually determine what your private key is as long as you have a good passphrase.  As the passphrase is defined by the user, this can be easier to remember than the random string of words, and likely doesn't need to be written down anywhere.  The problem with the passphrase is that not all wallets support it (at least at time of writing).  This means that if you use a passphrase now, you won't be able to import your file system wallet into something like Phantom using just your seed phrase. If you try you will just find that the public key Phantom derives is totally different from the one you were using in the file system case (though there can be more reasons for this which we will come to later).  
                
                <br/><br/>
                
                Make sure also to note in this message that the file system wallet is just stored in plain text.  This is one of the main disadvantages of such a wallet, and seems a bit of a strange choice.  If anyone gains control of the hardware on which the file is stored, they will have access to your private key, so in general file system wallets are only recommended for learning about Solana,  and not for keeping accounts with large amounts of value in them.

                <br/>      
  

                </p>


                <h2 className="mt-5" style={{fontSize: "20px"}}>Setting Up A Phantom Wallet</h2>
                <br/>

                <p>

                This is pretty straight forward. Just head over to the <a style={{textDecoration: "underline"}} href="https://phantom.app/">phantom</a> app website and install the extension, after that you will see the following screens, although this is mostly self explanatory there is one thing we want to point out. <br/><br/>

                </p>


                <Box marginBottom  = "10px">
                    <Center>
                    {!isMobile &&
                        <HStack spacing='24px'  alignItems="start">
                            <PhantomBlock/>
                        </HStack>
                    }
                    {isMobile &&
                        <VStack spacing='24px'  alignItems="start">
                            <PhantomBlock/>
                        </VStack>
                    }
                    </Center>
                </Box>

                <p>
                <br/>
                That is it for setting up the Phantom wallet.  If you want to you can skip ahead to the bottom of the page to try it out and Airdrop yourself some devnet SOL.  In the next two sections we will try and reconcile these two accounts, which especially in the final case (importing a Phantom wallet into the file system) is a bit of a rabbit hole.

                </p>

                <h2 className="mt-5" style={{fontSize: "20px"}}>Import File System Wallet into Phantom</h2>
                <br/>
                <p>

                This will be quick.  If you click the hamburger icon on the top left of the Phantom app you'll see there is the option to add or connect a wallet. From there click "import private key". 

                <br/><br/>

                Potentially because of the uncertainty around using seed phrases  between different wallet providers, Phantom asks for your private  key directly rather than the seed phrase.  You can find this in the file you generated previously using the Solana CLI, as an example one we created looks like the following:

                <br/><br/></p>
                <SyntaxHighlighter language="text" style={docco}>
                {`[192,96,164,99,23,119,105,230,160,29,141,157,1,161,139,60,198,151,120,93,147,69,183,204,1,97,217,252,78,64,227,152,255,8,57,146,150,179,49,61,5,4,57,95,119,98,146,110,7,233,148,224,53,12,88,223,192,44,227,128,43,4,245,220]`}
                </SyntaxHighlighter>
                <br/>
                <p>

                All you have to do is copy this, brackets included, into the box give it a name and you are done.  You can then easily swap between your two wallets  by clicking the hamburger icon and selecting the one you want.

                </p>

                <h2 className="mt-5" style={{fontSize: "20px"}}>Import Phantom Wallet into File System</h2>
                <br/>
                <p>

                This will not be quick.  The CLI provides a means of recovering a keypair from a seed phrase using the command:

                <br/><br/></p>
                <SyntaxHighlighter language="bash" style={docco}>
                {`solana-keygen recover -o test.json`}
                </SyntaxHighlighter>
                <br/>
                <p>

                Enter your "secret recovery phrase" that you got when setting up the Phantom wallet.  The CLI will then ask you to enter the associated passphrase.  As Phantom doesn't support this, just hit enter.  You will then be shown a public key and asked if you want to continue.  Comparing that public key to the one displayed on the phantom app though, they are not the same!  The reason they aren't the same is down to something called 'Hierarchical Derivation' of keypairs.  Here is what the official docs have to say on the subject:

               </p>

                
                <br/>
                
                <Box style={{paddingLeft:"5%", paddingRight:"10%"}}>
                The solana-cli supports BIP32 and BIP44 hierarchical derivation of private keys from your seed phrase and passphrase by adding either the <span style={{backgroundColor:"lightgrey"}}>?key=</span> query string or the <span style={{backgroundColor:"lightgrey"}}>?full-path=</span> query string.  By default, <span style={{backgroundColor:"lightgrey"}}>prompt:</span> will derive solana's base derivation path <span style={{backgroundColor:"lightgrey"}}>m/44'/501'</span>. To derive a child key, supply the <span style={{backgroundColor:"lightgrey"}}>{`?key=<ACCOUNT>/<CHANGE>`}</span> query string.<br/>
                To use a derivation path other than solana's standard BIP44, you can supply <span style={{backgroundColor:"lightgrey"}}>{`?full-path=m/<PURPOSE>/<COIN_TYPE>/<ACCOUNT>/<CHANGE>`}</span>.
                Because Solana uses Ed25519 keypairs, as per SLIP-0010 all derivation-path indexes will be promoted to hardened indexes -- eg. <span style={{backgroundColor:"lightgrey"}}>?key=0'/0'</span>, <span style={{backgroundColor:"lightgrey"}}>?full-path=m/44'/2017'/0'/1'</span> -- regardless of whether ticks are included in the query-string input. 
                </Box>        

                <br/>
                

                <p>

                I think even a seasoned crypto veteran might find this hard to parse without at least a few re-reads, so we will try and break it down and explain why it is relevant to the issue at hand.

                Both <a style={{textDecoration: "underline"}} href="https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki">BIP32</a> and <a style={{textDecoration: "underline"}} href="https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki">BIP44</a> describe a means of deriving many keypairs from a single seed phrase, without requiring that each requires it's own separate phrase.  This means you only need to remember a single seed phrase, but can manage many different accounts. 
                <br/>
                In order to derive different keypairs, you need to define the <i>derivation path</i> which has the form

                <br /><br /></p>   

                <SyntaxHighlighter language="text" style={docco}>
                    {'path=m/<PURPOSE>/<COIN_TYPE>/<ACCOUNT>/<CHANGE>'}
                </SyntaxHighlighter>

                <p><br /> 

                <i>PURPOSE</i> is always set to the value 44, which simply denotes that we are using the BIP44 standard for defining the path<br/>
                <i>COIN_TYPE</i> is always 501, which is the index of Solana in the SLIP-0044 <a style={{textDecoration: "underline"}} href="https://github.com/satoshilabs/slips/blob/master/slip-0044.md#registered-coin-types">register</a><br/>
                <i>ACCOUNT</i> is an integer from 0, and is incremented each time you want to derive a new account<br/>
                <i>CHANGE</i> should be 0 for any account that you want to be visible outside the wallet, and therefore be able to receive funds

                <br/><br/>

                By  default, the Solana CLI provides the derivation path m/44'/501' which actually generates the master keypair for your seed phrase.  The two BIPs suggest that in general you shouldn't actually use this one, because if someone gains control of your master key, they will gain access to all your derived accounts, whereas losing a derived keypair means losing only that account. 

                This is where the reference to the indices being <i>hardened</i> comes in. If you generate non-hardened derived keys, then knowledge of any descended keypair will allow you to determine the master key.  If the path is hardened then even with knowledge of any number of derived keypairs it is impractical on any reasonable time frame to determine that those derived keypairs came from the same master, and therefore impractical to determine what that master was. 
                <br/><br/>

                While the Solana CLI will generate the root keypair by default, wallets like Phantom will give you the first keypair along the derivation path, i.e they start with m/44'/501'/0'/1', and increment from there every time you add a new account from the same seed phrase.
                <br/><br/>

                </p>

                <Box marginBottom  = "10px">
                    {!isMobile && 
                        <HStack spacing='24px'  alignItems="start">
                            <SolletBlock/>
                        </HStack>
                    }
                    {isMobile && 
                        <VStack spacing='24px'  alignItems="start">
                            <SolletBlock/>
                        </VStack>
                    }
                </Box>



                <h2 className="mt-5" style={{fontSize: "20px"}}>Use Your Phantom Wallet In A Simple DApp</h2>
                <br/>

                <p>
                At this stage you should hopefully have your Phantom wallet set up, and at least one of your phantom wallets imported as a file system wallet, so as a last step let's actually make use of them! Firstly make sure that your wallet is connected to the devnet rather than the mainnet.  You can do this by going to the settings in the app, clicking "Change Network" and selecting devnet. 

                <br/><br/>

                Once you've done that, just click the big purple button below to connect to your Phantom wallet.

                </p>
                <br/>


                <AirDrop />

                <br/>
                <p>

                
                Once it has connected you should see the account pubkey to the right of the button, and the current balance below.  Clicking the Airdrop button will pay yourself 1 SOL on the devnet, which you can then spend on testing your own dApps, or interacting with other devnet programs.  If you want to swap between different Phantom accounts (via the hamburger icon in the app), just hit disconnect and then reconnect once you've switched.

                <br/><br/>

                As one last thing, if you have imported one of your phantom accounts into a file system wallet, you can confirm that they are all pointing to the same place.  First, as with Phantom you will need to point the Solana CLI to the devnet, which can be done  by entering the following on the command line:
                </p>
                <br/>
                <SyntaxHighlighter language="bash" style={docco}>
                    {"solana config set --url https://api.devnet.solana.com"}
                </SyntaxHighlighter>

                <br/>
                <p>

                You can then check the balance on your account with the following, replacing the json file with whatever you named your imported file system wallet:
               
                </p>
                <br/>
                <SyntaxHighlighter language="bash" style={docco}>
                    {"solana balance phantom_0.json"}
                </SyntaxHighlighter>

                <br/>

                <p>

                That should give the same balance, and confirm that everything has worked as expected.

                <br/><br/>

                On that note we will bring this post to a close.  Hopefully you have learnt something about the way your keypairs are generated, and if nothing else have paid yourself some fake SOL to spend on future projects.  If you did find this useful feel free to follow us on <a style={{textDecoration: "underline"}} href="http://www.twitter.com/dao_plays">Twitter</a> to keep up to date with future posts, and the release of our first proper Solana DApp!
               
                </p>
            </div>
        </div>
    );
}

export default SolanaIntro;
