import { SearchAutocomplete } from "components/search-autocomplete";
import { Item, useAsyncList } from "react-stately";

export default function Sandbox() {
  let list = useAsyncList<any>({
    async load({ signal, cursor, filterText }) {
      if (cursor) {
        cursor = cursor.replace(/^http:\/\//i, "https://");
      }

      let res = await fetch(
        cursor || `https://swapi.dev/api/people/?search=${filterText}`,
        { signal }
      );
      let json = await res.json();

      return {
        items: json.results,
        cursor: json.next,
      };
    },
  });
  return (
    <div className="p-4">
      <div className="w-full">
        <SearchAutocomplete
          placeholder="Search GitHub repositories"
          items={list.items}
          inputValue={list.filterText}
          onInputChange={list.setFilterText}
          loadingState={list.loadingState}
          onLoadMore={list.loadMore}
        >
          {(item) => <Item key={item.name}>{item.name}</Item>}
        </SearchAutocomplete>
      </div>
    </div>
  );
}
