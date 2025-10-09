import React from "react";
import {
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  useColorModeValue,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
export function SearchBar(props) {
  // Pass the computed styles into the `__css` prop
  const { variant, children, ...rest } = props;
  // Chakra Color Mode
  const searchIconColor = useColorModeValue("gray.700", "gray.200");
  const inputBg = useColorModeValue("white", "navy.800");
  return (
   <></>
  );
}
