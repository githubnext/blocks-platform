import { SearchAutocomplete } from "components/search-autocomplete";
import { Item, Section, useAsyncList } from "react-stately";

export default function Sandbox() {
  let list = useAsyncList<any>({
    async load({ signal, cursor, filterText }) {
      if (cursor) {
        cursor = cursor.replace(/^http:\/\//i, "https://");
      }

      // If no cursor is available, then we're loading the first page,
      // filtering the results returned via a query string that
      // mirrors the input text.
      // Otherwise, the cursor is the next URL to load,
      // as returned from the previous page.
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
      <div className="w-[300px]">
        <SearchAutocomplete
          placeholder="Search for blocks"
          items={list.items}
          inputValue={list.filterText}
          onInputChange={list.setFilterText}
          loadingState={list.loadingState}
          onLoadMore={list.loadMore}
          onSelectionChange={(e) => {
            console.log("you pickedk", e);
          }}
        >
          {(item) => <Item key={item.name}>{item.name}</Item>}
        </SearchAutocomplete>
      </div>
      {/* <SearchAutocomplete
        placeholder="Search for blocks"
        items={[{ label: "foo" }]}
      >
        <Section title="Companies">
          <Item>Hello</Item>
          <Item>Tagchat</Item>
          <Item>Yambee</Item>
          <Item>Photobug</Item>
          <Item>Livepath</Item>
        </Section>
        <Section title="People">
          <Item>Theodor Dawber</Item>
          <Item>Dwight Stollenberg</Item>
          <Item>Maddalena Prettjohn</Item>
          <Item>Maureen Fassan</Item>
          <Item>Abbie Binyon</Item>
        </Section>
      </SearchAutocomplete> */}
    </div>
  );
}
