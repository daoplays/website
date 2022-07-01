import React from "react";
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { RandomExample } from '../../apps/Random_Example';
import {Card, Image} from 'react-bootstrap';
import { Box, HStack, VStack, Center } from '@chakra-ui/react';
import { isMobile } from "react-device-detect";
import MathJax from 'react-mathjax';


import L_matrix_img from "./L_matrix.png"
import R_matrix_img from "./R_matrix.png"
import XR_matrix_img from "./XR_matrix.png"


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

function RandomNumbers() {

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
fn get_hashed_randoms(seed: u64, nonce: u64) -> [u64; 4] {

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
        <div class="container">

            <h1 className="h1 text-center mb-0 pt-3 font-weight-bold text-body">Random Numbers With Solana</h1>
            <h1 className="h5 text-center mb-1 pt-0 font-weight-bold text-secondary">June 28 2022</h1>
            <br />

            <p>
            In this post we are going to discuss ways of generating random numbers on the Solana blockchain, and by the end of it we will have gone through the following:
            </p>
            <br/>
                <ul>
                    <li>Implemented an on-chain Xorshift random number generator (RNG)</li>
                    <li>Implemented an on-chain SHA-256 Hash based RNG</li>
                    <li>Compared the performance of these two methods in a simple DApp, the code for which can be found <a style={{textDecoration: "underline"}} href="https://github.com/daoplays/solana_examples/tree/master/random_numbers">here</a>. </li>
                </ul>
            <br/>

            <p>
                        
            Being able to generate high quality random numbers is one of those things that in most areas of data science we now really take for granted.  A quick call to random() in Python and you have access to a sequence of random values that will be sufficient for a huge range of applications.  Typically these standard implementations are not <i>cryptographically secure</i> (CS) random numbers.  These CS random number generators are a sub-class which satisfy certain <a style={{textDecoration: "underline"}} href="https://en.wikipedia.org/wiki/Cryptographically-secure_pseudorandom_number_generator"> properties</a>.  In particular, if you are given access to any chunk of the random sequence from a CS generator, you will have no feasible way of consistently predicting the subsequent or preceding values.  This means that if you are running an online casino and someone hacks the stream of random values being used to pick which cards are being drawn, they will have no ability to determine the next value in the sequence (and therefore the next card) within any reasonable time frame.

            <br /><br />

            On the blockchain getting access to CS random numbers can be solved through the use of Oracles such as <a style={{textDecoration: "underline"}} href="https://docs.chain.link/docs/chainlink-vrf/">ChainLink</a> for Ethereum, or <a style={{textDecoration: "underline"}} href="https://docs.switchboard.xyz/randomness">Switchboard</a> for Solana.  Unfortunately these can be quite costly if they need to be used repeatedly, 0.25 LINK (about $2 at todays prices) for 500 random values from ChainLink, or 0.1 SOL (about $4 today) on Switchboard.  Other options such as <a style={{textDecoration: "underline"}} href="https://devpost.com/software/solrand">Solrand</a> on the Solana blockchain require waiting several seconds before your random number becomes available.  If your application requires this level of fidelity there may not be many other options, but if it doesn't, and you just need a bit of randomness injected into your Solana program, there are a few different ways that you can generate high quality (though not CS) random values on chain at practically no cost.

            <br /> <br />

            A quick note on what we mean by the quality of a sequence of random numbers. Most simply, a high quality RNG will be fast, have a small memory footprint, will have a long 'period' (the number of values in the sequence before it repeats), and will produce values that imitate genuinely independent and identically distributed numbers. Several test suites exist for checking this final condition such as <a style={{textDecoration: "underline"}}  href="http://theurbanengine.com/blog//the-diehard-tests">DieHard</a> and <a style={{textDecoration: "underline"}}  href="http://simul.iro.umontreal.ca/testu01/tu01.html">TestU01</a>.  The latter of these two contain over 150 different tests, and the creators define a <i>good</i> RNG as one with long periods ({`>>`} 2<sup>32</sup>) that <i>fail only very complicated tests that are extremely hard to find or impractical to run</i>.

            </p>
            <h2 className="mt-5" style={{fontSize: "20px"}}>Xorshift Generators</h2><br />

           
            <p>
            First we will take a look at '<a style={{textDecoration: "underline"}} href="https://www.jstatsoft.org/article/view/v008i14">Xorshift</a>' RNGs, also called 'shift-register generators'.  Discovered by <a style={{textDecoration: "underline"}} href="https://en.wikipedia.org/wiki/George_Marsaglia">George Marsaglia</a> these are amongst the most computationally efficient RNGs, and work primarily by repeatedly taking the 'exclusive or' (XOR) of a number with a bit-shifted version of itself (we will explain what that means shortly!) in order to generate the next number in their sequence.  In particular we are going to implement what is referred to as an Xorshift* generator, which improves on the original design by finishing the sequence by multiplication with a specially chosen value, which further improves the quality of the sequence.
            <br/> <br/>
            Below we show the rust implementation of an Xorshift* generator that produces a sequence of unsigned 64bit integers (u64s): 

            <br /><br /></p>   
            <SyntaxHighlighter language="rust" style={docco}>
            {codeString}
            </SyntaxHighlighter>
            <p><br />        
            That's it! Just half a dozen lines of code and you have a RNG that you can use in your on-chain Solana program. This RNG has a maximum period of 2<sup>64</sup>-1 and fails only the MatrixRank test from TestU01, which means that it is a very good non-CS RNG. What makes it non-CS, is that it is relatively straight forward for someone observing the stream of random numbers to determine the process by which they are being generated, and thus start predicting the next numbers in the sequence.
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
            Similarly the right-shift operator (written {`x >> y`}) will shift these bits to the right by y.  In this case the rightmost bits are discarded, and copies of the leftmost bit are shifted in from the left.  For example:
            </p>
            <br/>
            <SyntaxHighlighter language="text" style={docco}>
            {
`x      = 01001001100101100000001011010010 = 1234567890
x >> 1 = 00100100110010110000000101101001 = 617283945`}
            </SyntaxHighlighter>
            <br/>

            <p>
            The last of the three types of operation operation to check out is the bitwise XOR (written {`x^y`}). Here the <i>i</i>th bit of the output is a 1 if the two <i>i</i>th input bits are different, and is 0 otherwise. For example, combining a shift with an XOR (a combination referred to as an xorshift) we will get:

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

            It turns out that you can write both bit-shifts and the combined xorshift as matrices which act on vectors representing the binary number.



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
            By representing the operations as a matrix, Marsaglia was able to leverage a generic result, that if an <MathJax.Node inline formula={'n \\times n'} /> matrix has a certain set of properties, it can be used to iteratively move through all possible <MathJax.Node inline formula={'2^n - 1'}></MathJax.Node> n-bit integers, excluding only the value zero, before it repeats.  This is a pretty neat result, and it turned out that you only need to chain together 3 xorshift operations to generate a matrix with the correct properties.  In fact, for 32 bit numbers there are 648 triple xorshift operations with different combinations of shift size and direction that produce the correct type of matrix, and 2200 choices for 64 bit integers.
            </MathJax.Provider>
            <br/><br/>

            It was then simply a case of testing all possible valid combinations in order to find the ones that produce the most random-like sequence of integers.  In our program we will implement the modified Xorshift* generator which finishes this series of operations by multiplying by a particular value, once again chosen to improve the quality of the random series, without significantly increasing the computational requirements.
            </p>

            <h3 className="mt-5" style={{fontSize: "18px"}}>Converting the u64s to floating point values</h3><br />      

            <p>
            We now have a way of generating a random sequence of u64 integers, however this is only medium useful because what we often want is a sequence of random floating point numbers in some interval, so we also need a function to go from one to the other, which you can see below.
            <br /><br /></p>           
            <SyntaxHighlighter language="rust" style={docco}>
            {codeString_2}
            </SyntaxHighlighter>
            <p><br />
            At this point you may be regretting coming into this blog post, but I promise, it isn't that complicated! All we are doing here is exploiting the way a computer stores floating point numbers to get one from our integer.<br /><br/>

            The hex value 0xFFFFFFFFFFFFF represents a 64bit binary number where where the first 12 bits are zero and the last 52 bits are one. A 64bit floating point number uses the last 52 of those bits to store the significant digits of the number, and so by using the bitwise AND operation ({`x & y`}) between our random u64 and this hex value we are zeroing out the first 12 bits, but leaving untouched the last 52 bits which will form the significant digits of our floating point number.<br/>
            The other hex value, 0x3FF0000000000000, is the binary number 001111111111 00000000000000000000, which is just the number 1. As you can see, the lower 52 bits are all zero, so the combination of the bitwise OR operation ({`x | y`}) with the previous AND, gives us the binary representation of a 64bit double with first digit 1, and decimal places given by the 52 bits taken from our seed. All that is left is to tell the computer that this is actually a double using transmute, and we can subtract 1 to get our random number in the range [0..1)!

            <br /><br />  

            You may ask why we bother to make a number in the range [1..2)  and subtract one, rather than directly producing a value in the range [0..1).  It seems as though if taking the OR between 1 and our value yields 1.something, then perhaps taking the OR between 0 and our value would just yield 0.something.  This however is not the case!  Because of the way the exponent is stored in floating point numbers, all values between 1 and 2 start with 0x3FF (you can try this out <a style={{textDecoration: "underline"}} href="https://www.binaryconvert.com/convert_double.html?decimal">here</a>), and so it is trivial to construct a random number in the range [1..2).  Values between 0 and 1 however will have different exponents, and so it would be much more difficult to try and do that directly.
            </p>

            <h2 className="mt-5" style={{fontSize: "20px"}}>Hash Generators</h2><br />

            <p>
            A hashing function is any function that takes an input of arbitrary size, and returns an output of fixed size.  The <a style={{textDecoration: "underline"}} href = "https://en.wikipedia.org/wiki/SHA-2">SHA-2</a> family of hash functions, and in particular the SHA-256 function, are used in a large number of different applications, including SSH, encrypting passwords in Linux and Unix systems, and in cryptocurrencies such as Bitcoin to calculate proof of work or verify transactions.
            <br />
            The Sha-256 function has become so ubiquitous in computing in part due to the speed with which it can be computed, and the security it provides.  It is practically impossible to undo the hashing process and reconstruct the initial data from the hash value, and changing even one bit from the initial data will result in a totally different hash value, meaning it is easy to detect if the data has been altered by a third party in any way.

            <br /><br />

            For the purposes of generating random numbers it is this last property that we are particularly interested in.  We first define the following struct:

            </p>
            <SyntaxHighlighter language="rust" style={docco}>
            {
`// in state.rs
pub struct HashStruct {
    pub nonce : u64,
    pub initial_seed : u64
}`
            }
            </SyntaxHighlighter>

            <p>
            Using this we can pass some initial seed from off chain, and then simply increment the nonce value on chain in order to generate our sequence of random numbers.  While in principle the SHA-256 function can construct a CS sequence of random numbers, this is only possible if the initial seed is unknown.  In the context of our application clearly this will not be the case, however the sequence of random numbers generated on chain should be extremely high quality.
            <br /><br />
            Given an instance of this struct we first <a style={{textDecoration: "underline"}} href="https://stackoverflow.com/questions/28127165/how-to-convert-struct-to-u8">convert</a> it to an array of u8 integers, which is the required input type to the hashing function in the <a style={{textDecoration: "underline"}} href="https://docs.rs/sha2/latest/sha2/">sha2</a> rust crate, using the following function: 

            <br /><br /></p>           
            <SyntaxHighlighter language="rust" style={docco}>
            {u8_function}
            </SyntaxHighlighter>
            <p><br />

            This function is marked unsafe only because at compile time the program can't know that all the elements of the struct have been initialized, and passing uninitialized inputs can lead to undefined behavior. The output of the hashing function is a 256bit array, which means we can actually calculate four u64 values for each call to this hashing function.  The full code for generating this set of values is shown below.

            <br /><br /></p>           
            <SyntaxHighlighter language="rust" style={docco}>
            {hash_function}
            </SyntaxHighlighter>
            <p><br />

            We can then make use of the same generate_random_f64 function as before for each u64 in our array to end up with our set of random doubles.

            </p>
            <h2 className="mt-5" style={{fontSize: "20px"}}>Interactive Example</h2><br />

            <p>
            We have included a simple app below to allow you to interact with the on chain program to generate sequences of random numbers.  The chart below will histogram all the values generated in a very basic implementation of one of the tests included in TestU01.  We expect that the distribution of values generated should be uniform across the range [0..1), and so each bin should on average include one twentieth of all random values, with an expected error in each bin of the sqrt of the number of values in the bin.
            <br /><br />

            There are a couple of things worth noting from this.  Firstly is the amount of compute time required for each method.  In the case of the Xorshift* generator, we compute 256 random values on chain per call to the program, costing a total of around 60000 compute units.  With the hash method we compute only 60, however that already uses around 150000 compute units.  The 'None' option allows you to run the code without generating any random numbers in order to get a baseline compute cost of around 20000 units.<br/><br/>

            This means that the Xorshift* method is around a factor of fifteen less costly than the Hashing method per random number generated.  The hashing method will, however, produce higher quality random numbers, though it should be stressed that the Xorshift* method is likely suitable for any application where deriving random values on chain in this way is viable to begin with.
            <br/><br/></p>

            <RandomExample />
            <br/>
            <p>
            If you did find this useful or informative feel free to follow us on <a style={{textDecoration: "underline"}} href="http://www.twitter.com/dao_plays">Twitter</a> to keep up to date with future posts, and the release of our first proper Solana DApp!


            </p>

        </div>
    </div>

    );
}

export default RandomNumbers;
