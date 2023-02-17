import React, { useCallback, useState, useEffect, useRef} from 'react';
import { SetStateAction } from 'react';


import {
    Box,
    Button,
    HStack,
    Text,
    VStack
} from '@chakra-ui/react';

import {
    useDisclosure,
    Drawer,
    DrawerBody,
    DrawerOverlay,
    DrawerContent,
    DrawerCloseButton,
} from '@chakra-ui/react'

import {
    useWallet,
} from '@solana/wallet-adapter-react';

import { isMobile } from "react-device-detect";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { brands, solid } from '@fortawesome/fontawesome-svg-core/import.macro' // <-- import styles to be used
import {Screen} from './constants';



// dungeon utils
import { WalletConnected, request_current_balance} from './utils';

import './style.css';
import './fonts.css';
import './wallet.css';
require('@solana/wallet-adapter-react-ui/styles.css');


export function Navigation(
    {setScreen, check_sol_balance} : {setScreen: React.Dispatch<SetStateAction<number>>, check_sol_balance : React.MutableRefObject<boolean>}
) {

    const wallet = useWallet();

    const [balance, setBalance] = useState(0);

    // Ref
  // This will be used to store the interval
  const intervalref = useRef<number | null>(null);

  const checkBalance = useCallback(async () => 
    {  

        
        //console.log("in increase", balance, check_sol_balance.current);

        if (wallet.publicKey === null)
            return;

        if (check_sol_balance.current === false)
            return;

        let current_balance = await request_current_balance(wallet.publicKey);

        //console.log("balance ", current_balance);
        if (current_balance !== balance) {
            check_sol_balance.current = false;
        }

        setBalance(current_balance);

    },[wallet, balance, check_sol_balance]);


  // Use the useEffect hook to cleanup the interval when the component unmounts
  useEffect(() => {

    if (intervalref.current === null) {
        intervalref.current = window.setInterval(checkBalance, 1000);
    }
    else{
        window.clearInterval(intervalref.current);
        intervalref.current = null;
        
    }
    // here's the cleanup function
    return () => {
      if (intervalref.current !== null) {
        window.clearInterval(intervalref.current);
        intervalref.current = null;
      }
    };
  }, [checkBalance]);

    const ShowFAQ = useCallback( async () => 
    {
            setScreen(Screen.FAQ_SCREEN);
            return;
        
    },[setScreen]);

    const ShowOdds = useCallback( async () => 
    {
            setScreen(Screen.ODDS_SCREEN);
            return;
        
    },[setScreen]);

    const ShowHelp = useCallback( async () => 
    {
            setScreen(Screen.HELP_SCREEN);
            return;
        
    },[setScreen]);

    const ShowHome = useCallback( async () => 
    {     
            setScreen(Screen.HOME_SCREEN);
            return;
        
    },[setScreen]);

    const ShowShop = useCallback( async () => 
    {
            setScreen(Screen.SHOP_SCREEN);
            return;
        
    },[setScreen]);

    function DesktopNavigation() {

        return (
        <Box width="100%" ml="1%" mt="1%" mb="1%" mr="1%">
            <HStack>
                {wallet.publicKey !== null &&
                        <Box width="70%">
                            <HStack>
                                <WalletConnected />
                                <div className="font-face-sfpb">
                                    <Text fontSize='16px'  color="white">
                                        {
                                            balance
                                            ? "Balance: " + balance.toFixed(3) + ' SOL'
                                            : '                                 '
                                        }
                                    </Text>
                                </div>
                            </HStack>
                        </Box>
                        
                    }
                {wallet.publicKey === null &&
                    <Box width="70%"></Box>
                }
                <Box width="30%">
                    <HStack spacing="5%">
                        <Button variant='link' size='md' onClick={ShowHome}>
                            <div className="font-face-sfpb">
                                <Text fontSize='16px'  color="white"> Home </Text>      
                            </div> 
                        </Button>
                        <Button variant='link' size='md' onClick={ShowShop}>
                            <div className="font-face-sfpb">
                                <Text fontSize='16px'  color="white"> Shop </Text>      
                            </div> 
                        </Button>
                        <Button variant='link' size='md' onClick={ShowOdds}>
                            <div className="font-face-sfpb">
                                <Text fontSize='16px'  color="white"> Odds </Text>      
                            </div> 
                        </Button>
                        <Button variant='link' size='md' onClick={ShowFAQ}>
                            <div className="font-face-sfpb">
                                <Text fontSize='16px'  color="white"> FAQ </Text>      
                            </div> 
                        </Button>
                        
                        <Button variant='link' size='md' onClick={ShowHelp}>
                            <div className="font-face-sfpb">
                                <Text fontSize='16px'  color="white"> Help </Text>      
                            </div> 
                        </Button>
                        <a href="https://twitter.com/sol_dungeon">
                            <FontAwesomeIcon color="white" icon={brands('twitter')} size="lg"/>
                        </a>

                        <a href="https://discord.gg/HeKJZZEaPn">
                            <FontAwesomeIcon color="white" icon={brands('discord')} size="lg"/>
                        </a>
                    </HStack>
                </Box>
                </HStack>
            </Box>
        )
    }

    function MobileNavigation()  {
        const { isOpen, onOpen, onClose } = useDisclosure()
        //const btnRef = React.useRef()

        return (
            <Box width="100%" ml="1%" mt="1%" mb="1%" mr="1%">
              <HStack>
                {wallet.publicKey &&
                      <Box width="70%">
                          <HStack>
                              <WalletConnected />
                          </HStack>
                      </Box>
                      
                  }
                  {!wallet.publicKey &&
                      <Box width="75%"></Box>
                  }
                  <Box width="25%">
                    <HStack spacing="10%">
                        <a href="https://twitter.com/sol_dungeon">
                            <FontAwesomeIcon color="white" icon={brands('twitter')} size="lg"/>
                        </a>

                        <a href="https://discord.gg/HeKJZZEaPn">
                            <FontAwesomeIcon color="white" icon={brands('discord')} size="lg"/>
                        </a>

                        <FontAwesomeIcon  color="white" icon={solid('bars')} size="lg" onClick={onOpen}/>

                        
                        <Drawer
                            isOpen={isOpen}
                            placement='right'
                            onClose={onClose}
                        >
                            <DrawerOverlay />
                            <DrawerContent>
                            <DrawerCloseButton color="white"/>

                            <DrawerBody bg='black'>
                                <VStack spacing='24px'>
                                    <Button variant='link' size='md' onClick={ShowHome}>
                                    <div className="font-face-sfpb">
                                        <Text fontSize='16px'  color="white"> Home </Text>      
                                    </div> 
                                    </Button>
                                    <Button variant='link' size='md' onClick={ShowShop}>
                                        <div className="font-face-sfpb">
                                            <Text fontSize='16px'  color="white"> Shop </Text>      
                                        </div> 
                                    </Button>
                                    <Button variant='link' size='md' onClick={ShowOdds}>
                                        <div className="font-face-sfpb">
                                            <Text fontSize='16px'  color="white"> Odds </Text>      
                                        </div> 
                                    </Button>
                                    <Button variant='link' size='md' onClick={ShowFAQ}>
                                        <div className="font-face-sfpb">
                                            <Text fontSize='16px'  color="white"> FAQ </Text>      
                                        </div> 
                                    </Button>
                                    
                                    <Button variant='link' size='md' onClick={ShowHelp}>
                                        <div className="font-face-sfpb">
                                            <Text fontSize='16px'  color="white"> Help </Text>      
                                        </div> 
                                    </Button>
                                </VStack>
                            </DrawerBody>

                            
                            </DrawerContent>
                        </Drawer>
                    </HStack>
                  </Box>
                  </HStack>
              </Box>
          );
    }

    return(
        <>
            {!isMobile &&
                <DesktopNavigation/>
            }

            {isMobile &&
                <MobileNavigation/>
            }
        </>
    )


  }
