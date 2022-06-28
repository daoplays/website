import React from "react";
import {Button, Card, Col, Container} from 'react-bootstrap';
import { Link } from "react-router-dom";


function RowCard() 
{
    return (
    <Card style={{flexDirection: "row"}}>
      <Card.Img style={{width: "25%",objectFit: "cover"}} src="logo_no_text.png" alt="banner" />
      <Card.Body>
        <div>
        <Card.Title className="h3 text-center mb-2 pt-2 font-weight-bold text-secondary"
        style={{ fontSize: "3rem" }}>
          DaoPlays is Live!
        </Card.Title>

        <Card.Subtitle
          className="text-center text-secondary mb-3 font-weight-light text-uppercase"
          style={{ fontSize: "0.8rem" }}
        >
          June 28 2022
        </Card.Subtitle>

        <Card.Text
          className="text-secondary mb-4"
          style={{ fontSize: "1rem" }}
        >
        <br/>
        At DaoPlays we are planning on using blockchain technology to build apps that bring people together and raise money for good causes. At the moment there isn't much to see, but for now you can check out our blog as we continue to bring our first Solana app into it's public beta on devnet in just a few weeks!  
        </Card.Text>
        </div>
        <div className="text-center">
        <Link to="/blog">
            <Button variant="outline-dark" className="font-weight-bold">
            View Blog
            </Button>
        </Link>
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
                <RowCard />
              </Col>
    
          </Container>
          </>
    );
}

export default Home;
