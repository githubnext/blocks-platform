import React from "react";
import Router from "next/router";
import { Item, useAsyncList } from "react-stately";
import { SearchAutocomplete } from "./search-autocomplete";

const items = ["githubnext/blocks-examples", "githubnext/blocks-tutorial"];

interface SearchDropdownProps {
  session: Session;
}

export default function SearchDropdown(props: SearchDropdownProps) {
  const { session } = props;
  let list = useAsyncList<{ repo: string }>({
    async load({ signal, cursor, filterText }) {
      if (!filterText)
        return {
          items: items.map((i) => ({ repo: i })),
          cursor,
        };
      const url = `https://api.github.com/search/repositories?q=${filterText}+in:name&sort=stars&order=desc&per_page=10`;
      const res = await fetch(cursor || url, {
        headers: {
          Authorization: `token ${session.token}`,
        },
        signal,
      });

      const { items: searchItems } = await res.json();
      const data = (searchItems as RepoItem[]).map((item) => {
        return {
          repo: item.full_name,
        };
      });

      return {
        items: data,
        cursor: null,
      };
    },
  });

  return (
    <div className="w-full lg:w-[280px]">
      <SearchAutocomplete
        className="combo-dark"
        placeholder="Search GitHub repositories"
        items={list.items}
        inputValue={list.filterText}
        onInputChange={list.setFilterText}
        loadingState={list.loadingState}
        onLoadMore={list.loadMore}
        onSelectionChange={(repo) => {
          if (!repo) return;
          Router.push(`/${repo}`);
        }}
      >
        {(item) => <Item key={item.repo}>{item.repo}</Item>}
      </SearchAutocomplete>
    </div>
  );
}