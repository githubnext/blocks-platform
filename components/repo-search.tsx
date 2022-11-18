import { FormControl, Autocomplete } from "@primer/react";
import { useState } from "react";
import { useDebounce } from "use-debounce";
import { useRouter } from "next/router";
import { useSearchRepos } from "hooks";
import { RepoIcon, SearchIcon } from "@primer/octicons-react";

const defaultItems = [
  "githubnext/blocks",
  "primer/primitives",
  "d3/d3-geo",
  "actions/toolkit",
  "the-pudding/data",
  "preactjs/preact",
].map((d) => ({ id: d, text: d }));
export function RepoSearch() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  let [debouncedInputValue] = useDebounce(inputValue, 400);
  let emptyStateText = "Enter repo name to get started.";

  const { data: items = [], status } = useSearchRepos(debouncedInputValue, {
    enabled: Boolean(debouncedInputValue),
  });

  const itemsList = (
    items.length || debouncedInputValue ? items : defaultItems
  ).map((item) => ({
    ...item,
    leadingVisual: RepoIcon,
  }));

  return (
    <FormControl>
      <FormControl.Label visuallyHidden>Repo Search</FormControl.Label>
      <Autocomplete>
        <Autocomplete.Input
          leadingVisual={SearchIcon}
          className="w-full !bg-gray-900 !border-gray-600 !shadow-none !text-white"
          placeholder="Search for a repository..."
          onChange={(e) => {
            setInputValue(e.target.value);
          }}
        />
        <Autocomplete.Overlay overlayProps={{ width: "medium" }} left={70}>
          <Autocomplete.Menu
            loading={status === "loading"}
            emptyStateText={emptyStateText}
            items={itemsList}
            selectedItemIds={[]}
            selectionVariant="single"
            onSelectedChange={(items) => {
              if (!items) return;
              let match = items[0];
              if (!match) return;
              router.push(`/${match.id}`);
            }}
          />
        </Autocomplete.Overlay>
      </Autocomplete>
    </FormControl>
  );
}
