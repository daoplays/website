import React from "react";
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { RandomExample } from '../../apps/Random_Example';
import {Card, Table} from 'react-bootstrap';
import { ChakraProvider, theme, Box, HStack, VStack, Center } from '@chakra-ui/react';
import { isMobile } from "react-device-detect";
import MathJax from 'react-mathjax';


import L_matrix_img from "./L_matrix.png"
import R_matrix_img from "./R_matrix.png"
import XR_matrix_img from "./XR_matrix.png"

function TableBlock() {
    return (
    <>
        <Table striped bordered hover>
            <thead>
                <tr>
                <th>Method</th>
                <th>Compute Units Per Value</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                <td>Xorshift</td>
                <td>140</td>
                </tr>
                <tr>
                <td>Murmur</td>
                <td>215</td>
                </tr>
                <tr>
                <td>SHA-2</td>
                <td>2080</td>
                </tr>
            </tbody>
        </Table>
        <Box>
        The main thing to note here is the amount of compute time required for each method (summarized in the table on the left).  With the Xorshift* and Murmur hash generators, we compute 256 random values on chain per call to the program, costing a total of approximately 60000 and 80000 compute units respectively.  With the SHA-256 hash method we compute only 60, however that already uses around 150000 compute units.  The 'None' option allows you to run the code without generating any random numbers in order to get a baseline compute cost of around 25000 units.
        <br/><br/>
        </Box>
    </>
    );
}


function MatrixBlock() {

    return  (
        <>
        <Box>
            <Card style={{ width: '20rem' }} >
                <Card.Img variant="top"  src={L_matrix_img} alt="banner" />
                <Card.Body>
                    <Card.Text
                    className="text-body mb-4"
                    style={{ fontSize: "1rem" }}
                    >
                    <br/>
                    
                    The left shift operation {`x << 1`} can be written as the n-bit by n-bit matrix  <i>L</i>, where the values along the subdiagonal are ones, and the remaining entries are all zeros.  More generally we can write the operation {`x << a`} as <i>L<sup>a</sup></i>.
                    </Card.Text>
                </Card.Body>
            </Card>
        </Box>
        <Box>
            <Card  style={{ width: '20rem' }}>
                <Card.Img variant="top" src={R_matrix_img} alt="banner" />
                <Card.Body>
                    <Card.Text
                    className="text-body mb-4"
                    style={{ fontSize: "1rem" }}
                    >
                        <br/>
                        Similarly the right shift operation {`x >> 1`} can be written as an n-bit by n-bit matrix <i>R</i> where the values along the superdiagonal are ones, and the remaining entries are all zeros. This is equivalent to <i>L<sup>T</sup></i>. More generally we can write the operation {`x >> a`} as <i>R<sup>a</sup></i>.
                    </Card.Text>
                </Card.Body>
            </Card>
        </Box>
        <Box>
            <Card  style={{ width: '20rem' }}>
                <Card.Img variant="top" src={XR_matrix_img} alt="xrshift" />
                <Card.Body>
                    <Card.Text
                    className="text-body mb-4"
                    style={{ fontSize: "1rem" }}
                    >
                        <br/>
                       Lastly we given an example of the right xorshift operation {`x ^= (x >> 1)`}.  This is equivalent to the sum of the identity matrix I, and the matrix R: <i>X<sub>r</sub> = I + R</i>.  This generalizes to the case {`x ^= (x >> a)`} as <i>X<sub>r</sub><sup>a</sup> = I + R<sup>a</sup></i>.  The equivalent left shift operation can be obtained simply by replacing <i>R</i> with  <i>L</i>.
                    </Card.Text>
                </Card.Body>
            </Card>
        </Box>
        </>     
    );
}

function PostContent() {

    const codeString = 
`// in processor.rs 
fn shift_seed(mut seed: u64) -> u64 {
    seed ^= seed >> 12;
    seed ^= seed << 25;
    seed ^= seed >> 27;
    seed *= 0x2545F4914F6CDD1D;
    return seed;
}`;

const codeString_2 = 
`// in processor.rs 
fn generate_random_f64(seed: u64) -> f64 {

    let tmp = 0x3FF0000000000000 | (seed & 0xFFFFFFFFFFFFF);
    let result: f64 = unsafe { mem::transmute(tmp) };
    
    return result - 1.0;
}`;

const hash_function = 
`
// in processor.rs
// create a sha256 hash from our initial seed and a nonce value to produce 4 64bit random numbers
fn get_sha256_hashed_randoms(seed: u64, nonce: u64) -> [u64; 4] {

    let hashstruct = HashStruct {nonce : nonce, initial_seed : seed};
    let vec_to_hash = unsafe{Self::any_as_u8_slice(&hashstruct)};
    let hash= &(Sha256::new()
    .chain_update(vec_to_hash)
    .finalize()[..32]);

    // hash is a vector of 32 8bit numbers.  We can take slices of this to generate our 4 random u64s
    let mut hashed_randoms : [u64; 4] = [0; 4];
    for i in 0..4 {
        let hash_slice = &hash[i*8..(i+1)*8];
        hashed_randoms[i] = u64::from_le_bytes(hash_slice.try_into().expect("slice with incorrect length"));
    }

    return hashed_randoms;   
}`

const mumur_function = 
`
// in processor.rs
// create a murmur3 hash from our initial seed and a nonce value to produce 2 64bit random numbers
fn get_murmur_hashed_randoms(seed: u64, nonce: u64) -> [u64; 2] {

        let hashstruct = HashStruct {nonce : nonce, initial_seed : seed};
        let mut vec_to_hash = unsafe{Self::any_as_u8_slice(&hashstruct)};
        let h = murmur3_x64_128(&mut vec_to_hash, 0).unwrap();

        // we can take our 128bit number and get two 64bit values
        let lower  = u64::try_from(h & 0xFFFFFFFFFFFFFFFF).unwrap();
        let upper  = u64::try_from((h >> 64) & 0xFFFFFFFFFFFFFFFF).unwrap();

        let mut hashed_randoms : [u64; 2] = [0; 2];
        
        hashed_randoms[0] = lower;
        hashed_randoms[1] = upper;
        
        return hashed_randoms;
}`
const u8_function = 
`// in processor.rs
unsafe fn any_as_u8_slice<T: Sized>(p: &T) -> &[u8] {
    ::std::slice::from_raw_parts(
        (p as *const T) as *const u8,
        ::std::mem::size_of::<T>(),
    )
}`

    return (

    <div className="home">
        <div className="container">

            <h1 className="h1 text-center mb-0 pt-3 font-weight-bold text-body">Random Numbers With Solana</h1>
            <h1 className="h5 text-center mb-1 pt-0 font-weight-bold text-secondary">July 03 2022</h1>
            <br />

            <p>
            In this post we are going to discuss ways of generating random numbers on the Solana blockchain, and by the end we will have done the following:
            </p>
            <br/>
                <ul>
                    <li>Implemented an on-chain Xorshift random number generator (RNG)</li>
                    <li>Implemented an on-chain Murmur3 Hash based RNG</li>
                    <li>Implemented an on-chain SHA-256 Hash based RNG</li>
                    <li>Compared the performance of these three methods in a simple DApp, the code for which can be found <a style={{textDecoration: "underline"}} href="https://github.com/daoplays/solana_examples/tree/master/random_numbers">here</a>. </li>
                </ul>
            <br/>

            <p>
                        
            Being able to generate high quality random numbers is one of those things that in most areas of data science we now really take for granted.  A quick call to random() in Python and you have access to a sequence of random values that will be sufficient for a huge range of applications.  Typically these standard implementations are not <i>cryptographically secure</i> (CS) random numbers.  These CS RNGs are a sub-class which satisfy certain <a style={{textDecoration: "underline"}} href="https://en.wikipedia.org/wiki/Cryptographically-secure_pseudorandom_number_generator"> properties</a>.  In particular, if you are given access to any chunk of the random sequence from a CS generator, you will have no feasible way of consistently predicting the subsequent or preceding values.  This means that if you are running an online casino and someone hacks the stream of random values being used to pick which cards are being drawn, they will still have no ability to determine the next value in the sequence (and therefore the next card) within any reasonable time frame.

            <br /><br />

            On the blockchain there are a few different ways of getting access to random numbers, and which you choose will likely depend on the requirements of your program.  Where the greatest level of security is required (for example in a gambling DApp where money is at stake) then you will likely want to use CS random numbers from Oracles such as <a style={{textDecoration: "underline"}} href="https://docs.chain.link/docs/chainlink-vrf/">ChainLink</a> for Ethereum, or <a style={{textDecoration: "underline"}} href="https://docs.switchboard.xyz/randomness">Switchboard</a> and <a style={{textDecoration: "underline"}} href="https://devpost.com/software/solrand">Solrand</a> for Solana.  
            
            <br/><br/>

            These have the advantage that the random values you get won't depend on quantities like the block time, or other global properties of the chain which can be manipulated by the block miner/validator in order to cheat the program.  The entire process is also trustless, so the program's users don't have to worry about a situation where you have chosen a seemingly random value that actually benefits the program in an undocumented way.  This could happen for example if you created your own Oracle, and simply send your program random values off chain whenever they are requested.
            <br/><br/>

            The disadvantage of these systems is that they can be quite costly if they need to be used repeatedly.  For example, generating 500 random values from ChainLink costs 0.25 LINK (about $2 at todays prices), which can add unwanted overhead to the running costs of your program. 
            
            <br/><br/>
            
            In this post we will focus on a different class of problems where the random numbers don't have any significant value attached to them, and so there is no reason for someone to spend transaction costs to game the system.  In this case all we need to do is maintain the state for an RNG on the block chain, and update it whenever we need a new value. While the program owner will still need to provide some initial seed, after that the program will generate new values independently as needed.  This means it can also be trustless, as the owner no longer has any way to influence what numbers are generated.  All we really care about in this case is getting a high quality stream of random values that are cheap to calculate.

            <br /> <br />

            A quick note on what we mean by the quality of a sequence of random numbers. Most simply, a high quality RNG will be fast, have a small memory footprint, will have a long 'period' (the number of values in the sequence before it repeats), and will produce values that imitate genuinely independent and identically distributed numbers. Several test suites exist for checking this final condition such as <a style={{textDecoration: "underline"}}  href="http://theurbanengine.com/blog//the-diehard-tests">DieHard</a> and <a style={{textDecoration: "underline"}}  href="http://simul.iro.umontreal.ca/testu01/tu01.html">TestU01</a>.  The latter of these two contain over 150 different tests, and the creators define a <i>good</i> RNG as one with long periods ({`>>`} 2<sup>32</sup>) that <i>fail only very complicated tests that are extremely hard to find or impractical to run</i>.

            </p>
            <h2 className="mt-5" style={{fontSize: "20px"}}>Xorshift Generators</h2><br />

           
            <p>
            First we will take a look at '<a style={{textDecoration: "underline"}} href="https://www.jstatsoft.org/article/view/v008i14">Xorshift</a>' RNGs, also called 'shift-register generators'.  Discovered by <a style={{textDecoration: "underline"}} href="https://en.wikipedia.org/wiki/George_Marsaglia">George Marsaglia</a> these are amongst the most computationally efficient RNGs, and generate the next number in the sequence by repeatedly taking the 'exclusive or' (XOR) of the current number with a bit-shifted version of itself (we will explain what that means shortly!).  In particular we are going to implement what is referred to as an Xorshift* generator, which improves on the original design by finishing the sequence by multiplication with a specially chosen value, which further improves the quality of the sequence.
            <br/> <br/>
            They also require only a very small amount of code, so we will take the opportunity to go through how they work in some detail. Below we show the rust implementation of an Xorshift* generator that produces a sequence of unsigned 64bit integers (u64s): 

            <br /><br /></p>   
            <SyntaxHighlighter language="rust" style={docco}>
            {codeString}
            </SyntaxHighlighter>
            <p><br />        
            That's it! Just half a dozen lines of code and you have a RNG that you can use in your on-chain Solana program. This RNG has a maximum period of 2<sup>64</sup>-1 and fails only the MatrixRank test from TestU01, which means that it is a very good non-CS RNG. What makes it non-CS, is that it is relatively straight forward for someone observing the stream of random numbers to determine the process by which they are being generated, and thus start predicting the next numbers in the sequence.  For our use case however this is true for all the methods we will discuss.  As the code will be open source, and the data on chain readable by anyone, it is straight forward to determine what the next set of random numbers will be given the current state.  It is therefore important that the values be used only in situations where there is no motivation to cheat the system.  
            <br/><br/>
            We will now take a bit of time to explain what this function is doing, and briefly how it works.  We will have to assume some knowledge of linear algebra to do this, so if you aren't  interested in the why or how, and just  want to know how to use this in a program, skip down to the section on converting these u64s into 64bit floating point numbers in the interval [0..1), which for most situations will be the much more useful product.
            
            <br /><br/>

            We'll start by looking at what bit-shifting actually means.  If we denote as <i>x</i> the 32bit number 1234567890, we can write <i>x</i> it's binary form as:
            </p>
            <br/>
            <SyntaxHighlighter language="text" style={docco}>
            {`x = 01001001100101100000001011010010`}
            </SyntaxHighlighter>
            <br/>
            <p>
            The left-shift operator (written {`x << y`}) will shift these bits to the left by y, adding zeros to the right-hand-side. For example:
            </p>
            <br/>
            <SyntaxHighlighter language="text" style={docco}>
            {
`x      = 01001001100101100000001011010010 = 1234567890
x << 1 = 10010011001011000000010110100100 = 2469135780`}
            </SyntaxHighlighter>
            <br/>
            <p>
            Similarly the right-shift operator (written {`x >> y`}) will shift these bits to the right by y.  In this case the rightmost bits are discarded, and zeros are added in from the left.  For example:
            </p>
            <br/>
            <SyntaxHighlighter language="text" style={docco}>
            {
`x      = 01001001100101100000001011010010 = 1234567890
x >> 1 = 00100100110010110000000101101001 = 617283945`}
            </SyntaxHighlighter>
            <br/>

            <p>
            The last of the three types of operation operation to check out is the bitwise XOR (written {`x^y`}). Here the <i>i</i>'th bit of the output is a 1 if the <i>i</i>'th input bits  of the two inputs are different, and is 0 otherwise. For example, combining a shift with an XOR (a combination referred to as an xorshift) we will get:

            </p>
            <br/>
            <SyntaxHighlighter language="text" style={docco}>
            {
`x               = 01001001100101100000001011010010 = 1234567890
x >> 1          = 00100100110010110000000101101001 = 617283945
x ^ (x >> 1)    = 01101101010111010000001110111011 = 1834812347
`}
            </SyntaxHighlighter>
            <br/>
            <p>

            At this stage you may be wondering how these operations could yield a random number generator, and the answer is: Linear Algebra!
            <br/><br/>

            It turns out that you can write both bit-shifts and the combined xorshift as matrices which act on a vector representing the binary number:



            <br /> <br/>
            </p>

            <Box marginBottom  = "10px">
                    <Center>
                    {!isMobile &&
                        <HStack spacing='24px'  alignItems="start">
                            <MatrixBlock/>
                        </HStack>
                    }
                    {isMobile &&
                        <VStack spacing='24px'  alignItems="start">
                            <MatrixBlock/>
                        </VStack>
                    }
                    </Center>
                </Box>
            <br/>
            <p>
            
            <MathJax.Provider>
            These xorshift matrices can then be chained together an arbitrary number of times to produce a final matrix that represents the entire chain. For example if we define the transformation  <MathJax.Node inline formula={'T = X^5_rX^3_lX^7_l'} />, then for our binary vector <MathJax.Node inline formula={'y'}/> the transformed binary vector is given simply by <MathJax.Node inline formula={'yT'}/>. If you would like to play with a practical example, you can find a python implementation of these matrix operations in the git repository for this post <a  style={{textDecoration: "underline"}} href="https://github.com/daoplays/solana_examples/blob/master/random_numbers/python/xorshift.py">here</a>.  
            </MathJax.Provider>

            <br/><br/>
            <MathJax.Provider>
            By representing the operations as a matrix, Marsaglia was able to leverage a generic result, that if an <MathJax.Node inline formula={'n \\times n'} /> matrix has a certain set of properties, it can be used to iteratively move through all possible <MathJax.Node inline formula={'2^n - 1'}></MathJax.Node> n-bit integers, excluding only the value zero, before it repeats.  This is a pretty neat result, and it turned out that you only need to chain together three xorshift operations to generate a matrix with the correct properties.  In fact, for 32 bit numbers there are 648 such triplets with different combinations of shift size and direction that produce the correct type of matrix, and 2200 triplets for 64 bit integers.
            </MathJax.Provider>
            <br/><br/>

            It was then simply a case of testing all possible valid combinations in order to find the ones that produce the most random-like sequence of integers.  The modified Xorshift* generator which finishes this series of operations by multiplying by a particular value similarly chose that value to improve the quality of the random series, without significantly increasing the computational requirements.
            </p>

            <h3 className="mt-5" style={{fontSize: "18px"}}>Converting the u64s to floating point values</h3><br />      

            <p>
            We now have a way of generating a random sequence of u64 integers, however this is only medium useful because what we often want is a sequence of random floating point numbers in some interval, so we also need a function to go from one to the other, which you can see below.
            <br /><br /></p>           
            <SyntaxHighlighter language="rust" style={docco}>
            {codeString_2}
            </SyntaxHighlighter>
            <p><br />
            Although this may look complicated, all we are doing here is exploiting the way a computer stores floating point numbers to get one from our integer.<br /><br/>

            The hex value 0xFFFFFFFFFFFFF represents a 64bit binary number where where the first 12 bits are zero and the last 52 bits are one. A 64bit floating point number uses the last 52 of those bits to store the significant digits of the number, and so by using the bitwise AND operation ({`x & y`}) between our u64 and this hex value we are zeroing out the first 12 bits, but leaving untouched the last 52 bits which will form the significant digits of our floating point number.<br/>
            The other hex value, 0x3FF0000000000000, is the binary number 001111111111 00000000000000000000, which is just the number 1. As you can see, the lower 52 bits are all zero, so the combination of the bitwise OR operation ({`x | y`}) with the previous AND, gives us the binary representation of a 64bit double with first digit 1, and decimal places given by the 52 bits taken from our seed. All that is left is to tell the computer that this is actually a double using transmute, and we can subtract 1 to get our random number in the range [0..1)!

            <br /><br />  

            You may ask why we bother to make a number in the range [1..2)  and subtract one, rather than directly producing a value in the range [0..1).  It seems as though if taking the OR between 1 and our value yields 1.something, then perhaps taking the OR between 0 and our value would just yield 0.something.  This however is not the case!  Because of the way the exponent is stored in floating point numbers, all values between 1 and 2 start with 0x3FF (you can try this out <a style={{textDecoration: "underline"}} href="https://www.binaryconvert.com/convert_double.html?decimal">here</a>), and so it is trivial to construct a random number in the range [1..2).  Values between 0 and 1 however will have different exponents, and so it would be much more difficult to try and do that directly.
            </p>

            <h2 className="mt-5" style={{fontSize: "20px"}}>Hash Generators</h2><br />

            <p>
            A hashing function is any function that takes an input of arbitrary size, and returns an output of fixed size.  There are many different  hash functions out there that span the space of speed, security, and collision rate (when different inputs give the same output).  For example, a very simple, fast hash function could just take the first bit of a value and hash based on that.  This would also be very secure in the sense that it would be impossible to work out what was hashed based on the hash, but clearly with only two possible values it would just lead to a huge number of collisions, and be pretty useless overall.  
            <br/><br/>
           
            In this section we are going to look at two different hashing functions, <a style={{textDecoration: "underline"}} href="https://sites.google.com/site/murmurhash/">murmur3</a> and <a style={{textDecoration: "underline"}} href = "https://en.wikipedia.org/wiki/SHA-2">SHA-256</a>.  The murmur3 hashing algorithm is considered one of the best non-cryptographic hash functions (see e.g. <a style={{textDecoration: "underline"}}  href="https://github.com/rurban/smhasher">here</a>).  It is non-cryptographic because it is not difficult to reverse the hashing process, but <a style={{textDecoration: "underline"}} href="https://softwareengineering.stackexchange.com/questions/49550/which-hashing-algorithm-is-best-for-uniqueness-and-speed">generates</a> good quality random numbers, and has been used to do so in videogames like <a style={{textDecoration: "underline"}}  href="https://blog.demofox.org/2013/07/06/the-incredible-time-traveling-random-number-generator/">Braid</a>.  The code is also relatively light weight, however it is still far too large to go through in detail here, though if you are interested you can look at a Rust implementation of the 32bit function <a style={{textDecoration: "underline"}} href="https://docs.rs/murmur3/latest/src/murmur3/murmur3_32.rs.html#26-58">here</a>.

            <br/><br/>
       
            At the other end of the security spectrum we have the SHA-256 hashing function.  This is cryptographically secure, as it is impossible (within any reasonable time frame) to undo the hashing process and reconstruct the initial data from the hash value, and changing even one bit from the initial data will result in a totally different hash value, meaning it is easy to detect if the data has been altered by a third party in any way.  SHA-256 is used in a large number of different applications, including SSH, encrypting passwords in Linux and Unix systems, and in cryptocurrencies such as Bitcoin to calculate proof of work or verify transactions. It has become so ubiquitous in computing in part due to the combination of this level of security, with the speed with which it can be computed.  This is definitely not a light weight piece of code, and so we will not go through how it works here, but there is an excellent break down of the function <a style={{textDecoration: "underline"}} href="https://blog.boot.dev/cryptography/how-sha-2-works-step-by-step-sha-256/">here</a>.

            <br /><br />

            For the purposes of generating random numbers we can interact with both functions in a similar way.  We first define the following struct:
                
            </p>
            <br/>
            <SyntaxHighlighter language="rust" style={docco}>
            {
`// in state.rs
pub struct HashStruct {
    pub nonce : u64,
    pub initial_seed : u64
}`
            }
            </SyntaxHighlighter>
            <br/>
            <p>
            Using this we can initialize the sequence however we like, and then simply increment the nonce value on chain in order to generate our sequence of random numbers.  In principle we don't even need this seed, but it makes it easier to have multiple states stored on chain if you should need them.
            <br /><br />
            Given an instance of this struct we first <a style={{textDecoration: "underline"}} href="https://stackoverflow.com/questions/28127165/how-to-convert-struct-to-u8">convert</a> it to an array of u8 integers, which is the required input type to both the hashing functions using the following function: 

            <br /><br /></p>           
            <SyntaxHighlighter language="rust" style={docco}>
            {u8_function}
            </SyntaxHighlighter>
            <p><br />

            This function is marked unsafe only because at compile time the program can't know that all the elements of the struct have been initialized, and passing uninitialized inputs can lead to undefined behavior. Below we show how this function is then used with the <a  style={{textDecoration: "underline"}} href = "https://docs.rs/crate/murmur3/latest">murmur3</a> hash function.  In this case the function returns an unsigned 128bit integer, which means that we can generate two random numbers per hash.  To do this we can make use of the same ideas that we used when converting the 64bit integer into a floating point number.  For the lower 64 bits we simply need to zero out the higher 64 bits, and to get the upper 64 bits we first shift them 64 bits lower, and then repeat the process as before.
            
            <br /><br /></p>           
            <SyntaxHighlighter language="rust" style={docco}>
            {mumur_function}
            </SyntaxHighlighter>
            <p><br />
            
            
            
            The use case for the SHA256 hash function is very similar.  In this instance the output of the function is a 256bit array, which means we can actually calculate four u64 values for each call.  The full code for generating this set of values is shown below.

            <br /><br /></p>           
            <SyntaxHighlighter language="rust" style={docco}>
            {hash_function}
            </SyntaxHighlighter>
            <p><br />

            We can then make use of the same generate_random_f64 function as before for each u64 in our array to end up with our set of random doubles.

            </p>
            <h2 className="mt-5" style={{fontSize: "20px"}}>Interactive Example</h2><br />

            <p>
            We have included a simple app below to allow you to interact with the on chain program to generate sequences of random numbers.  The chart below will histogram all the values generated in a very basic implementation of one of the tests included in TestU01.  We expect that the distribution of values generated should be uniform across the range [0..1), and so each bin should on average include one twentieth of all random values.  Each time you click Generate it will append to the current set of random numbers so that you can increase the sample size beyond that provided by a single transaction.
            <br /><br />

            
            </p>

            <RandomExample />
            <br/>

            <Box marginBottom  = "10px">
                <Center>
                    {!isMobile &&
                        <HStack spacing='24px'  alignItems="start">
                            <TableBlock/>
                        </HStack>
                    }
                    {isMobile &&
                        <VStack spacing='24px'  alignItems="start">                    
                             <TableBlock/>
                        </VStack>
                    }
                </Center>
            </Box>
            <p>
            <br/>
            This means that the Xorshift* method is about a factor of fifteen faster than the SHA-256 Hashing method per random number generated, and around 50% faster than the murmur hash method.  The other thing to note is that all three methods produce a sequence of random values that at the very least pass this test (and many others in the case of Xorshift and SHA-256).  The SHA-256 method will, however, produce the highest quality random numbers, though it should be stressed that the Xorshift* method is likely suitable for any application where deriving random values on chain in this way is viable to begin with.
            <br/><br/>
            On that note we will bring this post to a close.  Hopefully you've learnt something about different methods of generating random numbers, and some options for implementing these generators in a Solana Dapp.  If you did find this useful or informative feel free to follow us on <a style={{textDecoration: "underline"}} href="http://www.twitter.com/dao_plays">Twitter</a> to keep up to date with future posts, and the release of our first proper Solana DApp!


            </p>

        </div>
    </div>

    );
}

function RandomNumbers() {
    return (
        <ChakraProvider theme={theme}>
                <PostContent />
        </ChakraProvider>
    );
    }

export default RandomNumbers;
