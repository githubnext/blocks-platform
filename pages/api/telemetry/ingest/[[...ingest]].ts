import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import type { Method } from "axios";

const appinsightsIngest = axios.create({
  baseURL: "https://eastus-8.in.applicationinsights.azure.com/",
})

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (!Array.isArray(req.query.ingest)) {
    res.status(500);
    res.send('Ingest path is not an array');
    return;
  }
  
  const airesponse = await appinsightsIngest.request({
    method: req.method as Method,
    url: `/${req.query.ingest.join('/')}`,
    data: req.body,
  })

  res.status(airesponse.status);
};
