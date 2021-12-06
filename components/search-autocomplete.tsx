import * as React from "react";
import type { ComboBoxProps } from "@react-types/combobox";
import { useComboBoxState, useSearchFieldState } from "react-stately";
import { useComboBox, useFilter, useButton, useSearchField } from "react-aria";
import type { LoadingState } from "@react-types/shared";
import { CgSpinner } from "react-icons/cg";
import { GoX } from "react-icons/go";
import { useDebounce } from "use-debounce";

import { ListBox } from "components/list-box";
import { Popover } from "components/popover";
import { useUpdateEffect } from "@react-aria/utils";

export { Item } from "react-stately";

interface AutocompleteProps<T> extends ComboBoxProps<T> {
  loadingState?: LoadingState;
  onLoadMore?: () => void;
  className?: string;
  debounceMs?: number;
}

export function SearchAutocomplete<T extends object>(
  props: AutocompleteProps<T>
) {
  const [inputValue, setInputValue] = React.useState("");
  const { debounceMs = 0, onInputChange } = props;

  const [debouncedInputValue] = useDebounce(inputValue, debounceMs);

  useUpdateEffect(() => {
    onInputChange(debouncedInputValue);
  }, [debouncedInputValue]);

  let { contains } = useFilter({ sensitivity: "base" });
  let state = useComboBoxState({
    ...props,
    defaultFilter: contains,
    menuTrigger: "focus",
    inputValue,
    onInputChange: (value) => {
      setInputValue(value);
    },
  });

  let inputRef = React.useRef(null);
  let listBoxRef = React.useRef(null);
  let popoverRef = React.useRef(null);

  let { inputProps, listBoxProps, labelProps } = useComboBox(
    {
      ...props,
      inputRef,
      listBoxRef,
      popoverRef,
      // @ts-ignore
      "aria-label": props.label || "Search",
    },
    state
  );

  // Get props for the clear button from useSearchField
  let searchProps = {
    label: props.label || "Clear search",
    value: state.inputValue,
    onChange: (v: string) => state.setInputValue(v),
  };

  let searchState = useSearchFieldState(searchProps);
  let { clearButtonProps } = useSearchField(searchProps, searchState, inputRef);
  let clearButtonRef = React.useRef(null);
  let { buttonProps } = useButton(clearButtonProps, clearButtonRef);

  return (
    <div className={`flex flex-col relative w-full ${props.className}`}>
      {props.label && (
        <label
          {...labelProps}
          className="block text-sm font-medium text-gray-700 text-left"
        >
          {props.label}
        </label>
      )}
      <div
        className={`relative px-2 inline-flex items-center overflow-hidden shadow-sm border-2 combo-input-wrap ${
          state.isFocused ? "is-focused border-blue-600" : "border-gray-300"
        }`}
      >
        <input
          {...inputProps}
          ref={inputRef}
          className="outline-none pl-1 py-1 appearance-none pr-6 flex-1 combo-input"
        />
        <div className="absolute right-0 top-0 bottom-0 px-2 flex items-center justify-center">
          {props.loadingState === "loading" ||
          props.loadingState === "filtering" ? (
            <CgSpinner
              aria-hidden="true"
              className="combo-spinner text-blue-700 animate-spin pointer-events-none"
            />
          ) : (
            <button
              {...buttonProps}
              ref={clearButtonRef}
              style={{
                visibility: state.inputValue !== "" ? "visible" : "hidden",
              }}
              className="cursor-default text-gray-500 hover:text-gray-600"
            >
              <GoX aria-hidden="true" className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      {state.isOpen && (
        <Popover
          popoverRef={popoverRef}
          isOpen={state.isOpen}
          onClose={state.close}
        >
          <ListBox
            {...listBoxProps}
            listBoxRef={listBoxRef}
            state={state}
            loadingState={props.loadingState}
            onLoadMore={props.onLoadMore}
          />
        </Popover>
      )}
    </div>
  );
}
