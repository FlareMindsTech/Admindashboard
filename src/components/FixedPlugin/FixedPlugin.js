// Chakra Imports
import { Button, useColorModeValue } from "@chakra-ui/react";
// Custom Icons
import { SettingsIcon } from "components/Icons/Icons";
import React from "react";

export default function FixedPlugin(props) {
  const { secondary, onChange, onSwitch, fixed, ...rest } = props;
  // Chakra Color Mode
  let navbarIcon = useColorModeValue("gray.500", "gray.200");
  let bgButton = useColorModeValue("white", "gray.600");
  let fixedDisplay = "flex";
  if (props.secondary) {
    fixedDisplay = "none";
  }

  const settingsRef = React.useRef();
  return (
    <>
     
    </>
  );
}
