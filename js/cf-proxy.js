/**
  * Redirect requests through cloudflare workers and try to rewrite response urls to also go through it
  * @see https://proxy.code913.workers.dev/https://code913.devpage.me
  */
function rewriteUrls(targetOrigin, text) {
  const workerUrl = "https://proxy.code913.workers.dev/";
  const modifiedUrl = workerUrl + encodeURI(targetOrigin.origin);

  // Inject <base> tag into the <head>
  return text
    .replace(/(<head>)/i, `$1<base href="${modifiedUrl}/">`)
    .replace(/(href|src)=(['"]?)([^"'\s>]+)(['" >])/gi, (match, attribute, quote1, url, quote2) => {
      if (url.startsWith("//")) {
        // Protocol-relative URL: Join with worker's origin
        url = modifiedUrl + url.slice(2);
      } else if (!url.startsWith("http")) {
        // Relative path: Join with worker's pathname
        url = modifiedUrl + url;
      } else if (!url.startsWith(modifiedUrl)) {
        // Absolute URL not pointing to the worker: Rewrite
        url = workerUrl + encodeURI(url);
      }
      return `${attribute}=${quote1}${url}${quote2}`;
    });
}

export default {
  /**
   * @param {Request} request
   */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const targetOrigin = new URL(url.pathname !== "/" ? url.pathname.slice(1) : url.searchParams.get("url")).href; // Handle both pathname and ?url cases

    const payload = {
      method: request.method,
      headers: request.headers,
    };
    if (!["GET", "HEAD"].includes(payload.method)) {
      payload.body = await request.arrayBuffer();
    }

    const completeTarget = new URL(targetOrigin);
    completeTarget.search = url.search;
    const response = await fetch(completeTarget, payload);

    if (response.headers.get("Content-Type").startsWith("text/")) {
      const text = await response.text();
      const modifiedText = rewriteUrls(targetOrigin, text);
      return new Response(modifiedText, response);
    } else {
      return response;
    }
  },
};
