import { FormControl, Autocomplete } from "@primer/react";
import { useState } from "react";
import { useDebounce } from "use-debounce";
import { useRouter } from "next/router";
import { useSearchRepos } from "hooks";

export function RepoSearch() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  let [debouncedInputValue] = useDebounce(inputValue, 400);
  let emptyStateText = "Enter repo name to get started.";

  const { data: items = [], status } = useSearchRepos(debouncedInputValue, {
    enabled: Boolean(debouncedInputValue),
  });

  return (
    <FormControl>
      <FormControl.Label visuallyHidden>Repo Search</FormControl.Label>
      <Autocomplete>
        <Autocomplete.Input
          placeholder="Search by repo name"
          onChange={(e) => {
            setInputValue(e.target.value);
          }}
        />
        <Autocomplete.Overlay overlayProps={{ width: "medium" }}>
          <Autocomplete.Menu
            loading={status === "loading"}
            emptyStateText={emptyStateText}
            filterFn={() => {
              // We let the GitHub API do all of the filtering.
              return true;
            }}
            items={items}
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
