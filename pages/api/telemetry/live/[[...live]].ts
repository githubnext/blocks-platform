import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import type { Method } from "axios";

const appinsightsLive = axios.create({
  baseURL: "https://eastus.livediagnostics.monitor.azure.com/",
})

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (!Array.isArray(req.query.live)) {
    res.status(500);
    res.send('Live path is not an array');
    return;
  }
  
  const airesponse = await appinsightsLive.request({
    method: req.method as Method,
    url: `/${req.query.live.join('/')}`,
    data: req.body,
  })

  res.status(airesponse.status);
};
