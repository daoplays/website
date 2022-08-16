import React from "react";
import {Button, Card, Col, Container} from 'react-bootstrap';
import { Link } from "react-router-dom";
import { isMobile } from "react-device-detect";

const higherOrderComponent = WrappedComponent => {
    class HOC extends React.Component {
      render() {
        return <WrappedComponent />
      }
    }
    return HOC
}

function NoDiv()
{
    return (
       <></>
    );
}

function BlogButton()
{
    return (
        <Button variant="outline-dark" className="font-weight-bold">
        View Blog
        </Button>
    );
}

const blog_post = {
    title:"DaoPlays is Live!",
    sub_title:"June 28 2022",
    post_text:"At DaoPlays we are planning on using blockchain technology to build apps that bring people together and raise money for good causes. At the moment there isn't much to see, but for now you can check out our blog as we continue to bring our first Solana app into it's public beta on devnet in just a few weeks!",
    image:"logo_no_text.png",
    second_div: BlogButton,
    display_image: !isMobile

};

const blog_post_two = {
    title:"Generating Random Numbers On The Solana Blockchain",
    sub_title:"July 03 2022",
    post_text:"For our next blog post we are discussing on-chain random number generation with Solana.  In particular we'll be benchmarking a few different methods for performing RNG for those times when you just need a bit of random sauce in your DApp.  Depending on how you do it you could save yourself an order of magnitude in compute time!",
    image:"matrix.jpg",
    second_div: NoDiv,
    display_image: !isMobile

};

const blog_post_three = {
    title:"Using Pyth To Seed A Random Number Generator",
    sub_title:"July 05 2022",
    post_text:"Continuing our random numbers theme,  we extend the previous post by looking at seeding your on-chain random number generator using a combination of Pyth (a price oracle) with the Xorshift and Murmur based methods from the previous post",
    image:"pyth.jpg",
    second_div: NoDiv,
    display_image: !isMobile

};

const blog_post_four = {
    title:"A Charitable Solana Token Launch with The Giving Block",
    sub_title:"July 16 2022",
    post_text:"We go through the process of setting up a 'pay what you want' token launch where participants get to choose how much of the payment goes to charity, and get a bonus if they pay more than the current average",
    image:"givingblock.jpg",
    second_div: NoDiv,
    display_image: !isMobile

};


const blog_post_five = {
    title:"Monitoring the Solana BlockChain in Real Time",
    sub_title:"July 27 2022",
    post_text:"Here we describe our process for monitoring the Solana blockchain for interactions with an on-chain program, and then storing those interactions in a database so that we can update the state of an app in real time as each new block is produced.",
    image:"quicknode.png",
    second_div: NoDiv,
    display_image: !isMobile

};

const blog_post_six = {
    title:"Running A Charitable Token Auction",
    sub_title:"August 16 2022",
    post_text:"In this post we are going to build on our previous posts to build a charitable token auction program, where a users chance of winning is proportional to the size of their bid. They will also be able to decide how much of their bid we keep, and how much we donate to charity, as well as selecting which charity we donate to from a set of provided options.",
    image:"givingblock.jpg",
    second_div: NoDiv,
    display_image: !isMobile

};


function RowCard({title, sub_title, post_text, image, second_div, display_image}) 
{
    const SecondDivComponent = higherOrderComponent(second_div);

    return (
        <Card style={{flexDirection: "row"}}>

            
            {display_image &&  <Card.Img style={{width: "25%",objectFit: "cover"}} src={image} alt="banner" />}
            <Card.Body>
                <div>
                    <Card.Title 
                        className="h3 text-center mb-2 pt-2 font-weight-bold text-secondary"
                        style={{ fontSize: "3rem" }}    
                    >
                        {title}
                    </Card.Title>

                    <Card.Subtitle
                        className="text-center text-secondary mb-3 font-weight-light text-uppercase"
                        style={{ fontSize: "0.8rem" }}
                    >
                        {sub_title}
                    </Card.Subtitle>

                    <Card.Text
                    className="text-secondary mb-4"
                    style={{ fontSize: "1rem" }}
                    >
                        <br/>
                        {post_text}
                    </Card.Text>
                </div>
                <div className="text-center">
                    <SecondDivComponent/>
                </div>
            </Card.Body>
        </Card>
    );
}


function Home() {
    return (
        <>
        <br/><br/><br/>
        <Container  >

            <Col>
                <Link to="/blog/charity_auction">
                    <RowCard {...blog_post_six}/>
                </Link>

                <br />
                <Link to="/blog/solana_streamer">
                    <RowCard {...blog_post_five}/>
                </Link>

                <br />
                <Link to="/blog/charity_token_launch">
                    <RowCard {...blog_post_four}/>
                </Link>

                <br />
                <Link to="/blog/pyth_seeds">
                    <RowCard {...blog_post_three}/>
                </Link>

                <br />
                <Link to="/blog/random_numbers">
                    <RowCard {...blog_post_two}/>
                </Link>

                <br />

                <Link to="/blog">
                    <RowCard {...blog_post}/>
                </Link>
            </Col>

        </Container>
        </>
    );
}

export default Home;
