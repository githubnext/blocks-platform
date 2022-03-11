import { FormControl, Autocomplete } from "@primer/react";
import { useState } from "react";
import { useQuery } from "react-query";
import { useDebounce } from "use-debounce";
import { useRouter } from "next/router";

let searchRepos = async (filterText: string, token: string) => {
  const url = `https://api.github.com/search/repositories?q=${filterText}+in:name&sort=stars&order=desc&per_page=10`;
  const headers = token
    ? {
        Authorization: `token ${token}`,
      }
    : {};

  const res = await fetch(url, {
    headers,
  });
  const { items: searchItems } = await res.json();
  const data = (searchItems as RepoItem[]).map((item) => {
    return {
      text: item.full_name,
      id: item.full_name,
    };
  });
  return data;
};

interface RepoSearchProps {
  token: string;
}

export function RepoSearch(props: RepoSearchProps) {
  const { token } = props;
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  let [debouncedInputValue] = useDebounce(inputValue, 400);
  let emptyStateText = "Enter repo name to get started.";

  const { data: items = [], status } = useQuery(
    ["search", debouncedInputValue],
    () => searchRepos(debouncedInputValue, token),
    {
      enabled: Boolean(debouncedInputValue),
    }
  );

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
        <Autocomplete.Overlay overlayProps={{width: 'medium'}}>
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
