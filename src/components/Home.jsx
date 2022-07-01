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
    sub_title:"June 28 2022",
    post_text:"For our next blog post we are discussing on-chain random number generation with Solana.  We won't be using oracles, but comparing a couple of different methods for performing RNG for those times when you just need a bit of random sauce in your DApp.  Depending on how you do it you could save yourself an order of magnitude in compute units!",
    image:"matrix.jpg",
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
