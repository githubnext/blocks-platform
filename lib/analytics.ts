interface TrackParams {
  url: string;
  event: string;
  payload?: object;
}

export function track(params: TrackParams) {
  const { url, event, payload } = params;

  if (process.env.NODE_ENV === "development") {
    console.info("Analytics Disabled in development", params);
    return;
  }

  return fetch({
    url: "https://octo-metrics.azurewebsites.net/api/CaptureEvent",
    method: "POST",
    // @ts-ignore
    body: JSON.stringify({
      container: "blocks.githubnext.com",
      event,
      payload: {
        url,
        referrer: document.referrer,
        source: "blocks.githubnext.com",
        dimensions: [screen.width, screen.height].join(","),
        userAgent: navigator.userAgent,
        language: navigator.language,
        ...payload,
      },
    }),
  });
}
