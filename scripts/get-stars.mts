import axios from "axios";
import fs from "fs";
import path from "path";

type Star = {
  id: string;
  username: string;
  status: string;
};

type StarsResponse = {
  data: {
    starsPublicData: Star[];
  };
};

// NB: I'm assuming that you're invoking this script from the root of the project!
async function run() {
  let payload = {
    operationName: null,
    variables: {},
    query: `query {
  starsPublicData {
    id
    username
  }
}    
`,
  };

  try {
    const res = await axios.post<StarsResponse>(
      "https://api-stars.github.com/",
      payload
    );

    let stars = res.data.data.starsPublicData;

    const starsPath = path.join(process.cwd(), "lib", "stars.json");
    fs.writeFileSync(starsPath, JSON.stringify(stars, null, 2) + "\n");

    console.log("✅ Wrote stars.json");
  } catch (e) {
    console.log("💥 Failed to write stars.json", e);
  }
}

run();
