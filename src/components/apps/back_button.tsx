import React from "react";
import backButtonImage from "./dungeon/images/Back.png";
import { Button } from "@chakra-ui/react";

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
                marginTop: "2.3%",
                marginLeft: "1.3rem",
            }}
            onClick={goBack}
        >
            <img src={backButtonImage} width={50} height={50} alt={""} />
        </Button>
    );
};

export default BackButton;
