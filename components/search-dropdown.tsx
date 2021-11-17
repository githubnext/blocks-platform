import React, { useEffect, useState } from "react";
import Downshift from "downshift";
import Router from "next/router";
import { useSearchRepos } from "hooks";

const items = [
  "githubnext/composable-github-example-viewers",
  "githubnext/composable-github-example-files",
];

interface SearchDropdownProps {
  session: Session;
}

export default function SearchDropdown(props: SearchDropdownProps) {
  const { session } = props;
  const [value, setValue] = useState("");
  const [filteredItems, setFilteredItems] = useState([]);

  const handleStateChange = (changes) => {
    if (changes.hasOwnProperty("selectedItem")) {
      // setValue(changes.selectedItem);
      Router.push(`/${changes.selectedItem}`);
      setValue("");
    } else if (changes.hasOwnProperty("inputValue")) {
      setValue(changes.inputValue);
    }
  };

  const {
    data: searchQuery,
    status: searchQueryStatus,
    error: searchQueryError,
  } = useSearchRepos({
    query: value,
    token: session.token as string,
  });

  useEffect(() => {
    if (searchQuery) {
      setFilteredItems(searchQuery);
    }
  }, [searchQuery]);

  return (
    <Downshift selectedItem={value} onStateChange={handleStateChange}>
      {({
        getInputProps,
        getItemProps,
        getMenuProps,
        getLabelProps,
        getToggleButtonProps,
        inputValue,
        highlightedIndex,
        selectedItem,
        isOpen,
      }) => (
        <div className="inline-block w-80">
          <div className="relative">
            <input
              className="pl-2 text-black rounded w-full h-8"
              {...getInputProps({
                // isOpen: isOpen,
                placeholder: "Search repos",
              })}
            />
          </div>
          <div style={{ position: "absolute" }}>
            <ul
              {...getMenuProps({
                open: isOpen,
              })}
              className="rounded-b w-80 text-black"
            >
              {isOpen &&
                filteredItems.map((item: any, index) => (
                  <li
                    className={`w-full h-10 px-2 py-2 flex align-middle items-center cursor-pointer
                      border-b border-l  border-r border-solid border-gray-300 
                      ${highlightedIndex === index ? "bg-blue-600" : "bg-white"}
                      ${
                        highlightedIndex === index ? "text-white" : "text-black"
                      }
                      ${selectedItem === item ? "font-bold" : "font-normal"}
                      ${index === filteredItems.length - 1 ? "rounded-b" : null}
                      `}
                    {...getItemProps({
                      key: `${item.value}${index}`,
                      item,
                      index,
                    })}
                  >
                    {item}
                  </li>
                ))}
            </ul>
          </div>
        </div>
      )}
    </Downshift>
  );
}
