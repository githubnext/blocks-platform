import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import type { Method } from "axios";

const appinsightsLive = axios.create({
  baseURL: process.env.APPINSIGHTS_LIVE_URL,
})

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (!Array.isArray(req.query.live)) {
    res.status(500);
    res.send('Live path is not an array');
    return;
  }
  
  await appinsightsLive.request({
    method: req.method as Method,
    url: `/${req.query.live.join('/')}`,
    data: req.body,
  })

  res.status(200);
};
