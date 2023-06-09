import React from "react";
import backButtonImage from "./dungeon/images/Back.png";
import { Button } from "@chakra-ui/react";

interface BackButtonProps {
    goBack: () => void;
}

const BackButton: React.FC<BackButtonProps> = ({ goBack }) => {
    return (
        <Button variant="link" size="lg" onClick={goBack}>
            <img src={backButtonImage} alt={""} />
        </Button>
    );
};

export default BackButton;
