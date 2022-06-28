import React from "react";
import {Card} from 'react-bootstrap';



export function RowCard({title, sub_title, post_text, image}) {
    return (
        <Card style={{flexDirection: "row"}}>
            <Card.Img style={{width: "25%",objectFit: "cover"}} src={image} alt="banner" />

            <Card.Body>
                <Card.Title className="h3 text-center mb-2 pt-2 font-weight-bold text-secondary"
                style={{ fontSize: "3rem" }}>
                {title}
                </Card.Title>

                <Card.Subtitle
                className="text-center text-secondary mb-3 font-weight-light text-uppercase"
                style={{ fontSize: "1rem" }}
                >
                {sub_title}
                </Card.Subtitle>

                <Card.Text
                className="text-secondary mb-4"
                style={{ fontSize: "1.2rem" }}
                >
                <br/>
                {post_text}
                </Card.Text>
            </Card.Body>
        </Card>
    );
}

export function ColCard({title, sub_title, post_text, image}) {
    return (

        <Card >
            <Card.Img src={image} alt="banner" />

            <Card.Body>
                <Card.Title className="h3 text-center mb-2 pt-2 font-weight-bold text-secondary"
                style={{ fontSize: "3rem" }}>
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
                {post_text}
                </Card.Text>
            </Card.Body>
        </Card>
    );
}
