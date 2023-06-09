import React from "react";
import backButtonImage from "./dungeon/images/Back.png";
import { Button } from "@chakra-ui/react";
import { isMobile } from "react-device-detect";

interface BackButtonProps {
    goBack: () => void;
}

const BackButton: React.FC<BackButtonProps> = ({ goBack }) => {
    return (
        <Button
            variant="link"
            size="lg"
            style={{
                display: "inline",
                position: "fixed",
                marginTop: isMobile ? "5.3%" : "2.3%",
                marginLeft: isMobile ? "0.6rem" : "1.3rem",
            }}
            onClick={goBack}
        >
            <img src={backButtonImage} width={isMobile ? 25 : 50} height={isMobile ? 25 : 50} alt={""} />
        </Button>
    );
};

export default BackButton;
