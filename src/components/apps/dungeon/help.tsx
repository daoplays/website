import {
    Box,
    Center
} from '@chakra-ui/react';

import { DEFAULT_FONT_SIZE, DUNGEON_FONT_SIZE } from './constants';


export function HelpScreen()
{
    return(
        <>
        <Center>
        <Box width = "80%">
        <div className="font-face-sfpb" style={{color: "white", fontSize: DUNGEON_FONT_SIZE}}>
        <h2 className="mt-5" style={{fontSize: DEFAULT_FONT_SIZE}}>Help!</h2><br />

        If you have any questions that aren't covered in the FAQ, or find any technical issues with the site, please head over to our Discord channel and make a support ticket to let us know.

        </div>
        </Box>
        </Center>
        </>
    );
}