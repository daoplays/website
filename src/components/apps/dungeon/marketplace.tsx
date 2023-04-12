
import {
    Box,
    Center,
    Text,
    HStack,
    VStack,
    Divider
} from '@chakra-ui/react';
import { isMobile } from "react-device-detect";

import Card from 'react-bootstrap/Card';
import Container from 'react-bootstrap/Container';
import Col from 'react-bootstrap/Col';
import chicken from "./achievement_nfts/Chicken.gif"

import { DUNGEON_FONT_SIZE } from './constants';

export interface Listing {
    name: string;
    description: string;
    image: string;
    quantity: number;
    price: number;
}

export const ListingCard = () => {


    let image_size = !isMobile ? "100px" : "50px";
    let divider_size = !isMobile ? "100px" : "70px";
    return (
        <div className="font-face-sfp" style={{color: "white", fontSize: DUNGEON_FONT_SIZE, width:"100%", marginBottom:"1rem"}}>
        <Card style={{ flexDirection: "row", borderWidth:'2px', borderColor: 'white'}} bg="dark">

            
            <Card.Img style={{width: image_size, objectFit: "scale-down", "imageRendering":"pixelated",}} src={chicken} alt="banner" />
            <Center height={divider_size}>
            <Divider orientation='vertical' />
            </Center>
  
            <Card.Body style={{paddingTop: "0.5rem", paddingBottom: "0.1rem"}} color="white"> 
                   <VStack alignItems={"left"} spacing="0.1rem">
                    <Text marginTop="0" style={{fontWeight:"bold"}}>A Chicken</Text>
                        <HStack>
                            <Text>Rare Crafting item</Text>
                            
                            <Box as='button'  borderWidth='2px' borderColor="white"   width="60px">
                                <Text  align="center" fontSize={DUNGEON_FONT_SIZE} color="white">Buy</Text>
                            </Box>
                            
                        </HStack>

                    </VStack>
            </Card.Body>
            </Card>
        </div>
        
    );
  }

export function MarketplaceScreen()
{
    return(
    <>
    <Container fluid style={{width:"80%", justifyContent: "center", marginBottom:"10rem"}}>
        <Col>
            <ListingCard/>
        </Col>
    </Container>

    </>
    );
}