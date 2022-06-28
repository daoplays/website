import React, { useEffect } from "react";
import { useParams } from "react-router";
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { Random_Example } from '../../apps/Random_Example';

import { Text } from 'react-native';


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

            <p><br />
            In this post we are going to look at a couple of ways of generating random numbers on the Solana blockchain.  Code for both the Solana program and a rust client to interact with it can be found <a style={{textDecoration: "underline"}} href="https://github.com/daoplays/solana_examples/tree/master/random_numbers">here</a>.  Being able to generate high quality random numbers is one of those things that in most areas of data science we now really take for granted.  A quick call to random() in Python and you have access to a sequence of random values that will serve you well for a large range of applications.  Typically these standard implementations are not <i>cryptographically secure</i> (CS) random numbers.  These CS random number generators are a sub-class which satisfy certain <a style={{textDecoration: "underline"}} href="https://en.wikipedia.org/wiki/Cryptographically-secure_pseudorandom_number_generator"> properties</a>.  In particular, if you are given access to any chunk of the random sequence from a CS generator, you will have no feasible way of consistently predicting the subsequent or preceding values.  This means that if you are running an online casino and someone hacks the stream of random values being used to pick which cards are being drawn, they will have no ability to determine the next card within any reasonable time frame.

            <br /><br />

            On the blockchain getting access to CS random numbers can be solved through the use of Oracles such as <a style={{textDecoration: "underline"}} href="https://docs.chain.link/docs/chainlink-vrf/">ChainLink</a> for Ethereum, or <a style={{textDecoration: "underline"}} href="https://docs.switchboard.xyz/randomness">Switchboard</a> for Solana.  Unfortunately these can be quite costly if they need to be used repeatedly, 0.25 LINK (about $2 at todays prices) for 500 random values from ChainLink, or 0.1 SOL (about $4 today) on Switchboard.  If your application requires this level of fidelity there may not be many other options, but if it doesn't, and you just need a bit of randomness injected into your Solana program, there are a few different ways that you can generate high quality (though not CS) random values on chain at practically no cost.

            <br /> <br />

            A quick note on what we mean by the quality of a sequence of random numbers. Most simply a high quality RNG will be fast, have a small memory footprint, will have a long 'period' (the number of values in the sequence before it repeats), and will produce values that imitate genuinely independent and identically distributed numbers. Several test suites exist for checking this final condition such as <a style={{textDecoration: "underline"}}  href="http://theurbanengine.com/blog//the-diehard-tests">DieHard</a> and <a style={{textDecoration: "underline"}}  href="http://simul.iro.umontreal.ca/testu01/tu01.html">TestU01</a>.  The latter of these two contain 160 tests, and the creators define a <i>good</i> RNG as one with long periods ({`>>`} 2<sup>32</sup>) that <i>fail only very complicated tests that are extremely hard to find or impractical to run</i>.

            </p>
            <h2 className="mt-5" style={{fontSize: "20px"}}>Xorshift Generators</h2><br />

            
            <p>
            First we will take a look at 'Xorshift' random number generators, also called 'shift-register generators'.  Discovered by <a style={{textDecoration: "underline"}} href="https://www.jstatsoft.org/article/view/v008i14">George Marsaglia</a> these are amongst the most computationally efficient random number generators, and work primarily by repeatedly taking the 'exclusive or' (XOR) of a number with a bit-shifted version of itself (we will explain what that means below!) in order to generate the next number in their sequence.

            <br /><br/>

            If we take an example 32bit seed, the number 12345678, we can write this as the binary number:
            </p>
            <SyntaxHighlighter language="rust" style={docco}>
            {`seed = 00000000101111000110000101001110`}
            </SyntaxHighlighter>
            <p>
            The left-shift operator (written {`seed << y`}) will shift these bits to the left by y, adding zeros to the right-hand-side. This is the same as multiplying the number by 2<sup>y</sup>, for example:
            </p>
            <SyntaxHighlighter language="rust" style={docco}>
            {
`seed      = 00000000101111000110000101001110 = 12345678
seed << 1 = 00000001011110001100001010011100 = 24691356`}
            </SyntaxHighlighter>
            <p>
            Similarly the right-shift operator (written {`seed >> y`}) will shift these bits to the right by y.  In this case the rightmost bits are discarded, and copies of the leftmost bit are shifted in from the left.  This is the same as performing an integer division by 2<sup>y</sup>, for example:
            </p>
            <SyntaxHighlighter language="rust" style={docco}>
            {
`seed      = 00000000101111000110000101001110 = 12345678
seed >> 1 = 00000000010111100011000010100111 = 6172839`}
            </SyntaxHighlighter>
            <p>
            The last operation to check out is the bitwise XOR (written {`x^y`}). Here each bit of the output is a 1 if the bits of the input are different for the corresponding position (i.e. one is 1 and one is 0) or 0 if they are the same. This has no straightforward mathematical equivalent as with the shifts. For example, combining a shift with an XOR:

            </p>

            <SyntaxHighlighter language="rust" style={docco}>
            {
`seed               = 00000000101111000110000101001110 = 12345678
seed >> 1          = 00000000010111100011000010100111 = 6172839
seed ^ (seed >> 1) = 00000000111000100101000111101001 = 14832105
`}
            </SyntaxHighlighter>

            <p>

            The Xorshift generator chains together several of these operations, where the exact values of the shifts are carefully chosen in order to maximise the quality of the random number sequence.  In our program we will implement the modified Xorshift* generator which finishes this series of operations by multiplying by a particular value, once again chosen to improve the quality of the random series.  

            <br /> <br />

            Below we show the rust implementation of an Xorshift* generator that produces a sequence of u64 integers. This RNG has a maximum period of 2<sup>64</sup>-1 and fails only the MatrixRank test from TestU01, which means that it is a very good non-CS RNG, however it is clearly not cryptographically secure, as anyone with knowledge of the program and the current position of the sequence can perfectly predict the subsequent values.
            <br /><br /></p>   
            <SyntaxHighlighter language="rust" style={docco}>
            {codeString}
            </SyntaxHighlighter>
            <p><br />        
            That's it! Just a few lines of code and you have a RNG that you can use in your on-chain Solana program.  This is only medium useful though because often we will actually want a floating point random number, rather than an integer, so we also need a function to go from one to the other, which you can see below.
            <br /><br /></p>           
            <SyntaxHighlighter language="rust" style={docco}>
            {codeString_2}
            </SyntaxHighlighter>
            <p><br />
            If you arn't used to low level operations, this function can look like magic, but we will go through what it is doing so you can see it is just exploiting the way a computer stores floating point numbers to get one from our integer.<br />
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

            <Random_Example />

            <p>
            We hope you have found something of use from this post


            There are a couple of things worth noting from this.  Firstly is the amount of compute time required for each method.  In the case of the Xorshift* generator, we compute 256 random values on chain per call to the program, costing a total of around 60000 compute units.  With the hash method we compute only 60, however that already uses around 150000 compute units.  The 'None' option allows you to run the code without generating any random numbers in order to get a baseline compute cost of around 20000 units.<br/><br/>

This means that the Xorshift* method is around a factor of fifteen less costly than the Hashing method per random number generated.  The hashing method will, however, produce higher quality random numbers, though it should be stressed that the Xorshift* method is likely suitable for any application where deriving random values on chain in this way is viable to begin with.
            </p>

  
            <Text style={{ padding: 150 }}>
            <p></p>
            </Text>
        </div>
    </div>

    );
}

export default RandomNumbers;
