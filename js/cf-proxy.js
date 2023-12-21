/**
  * Redirect requests through cloudflare workers and try to rewrite response urls to also go through it
  * No guarantee as to whether it would work or get blocked
  * @see https://proxy.code913.workers.dev/https://code913.devpage.me/?&ignore[]=github.com&ignore[]=svelte.dev&ignore[]=codepen.io&ignore[]=discord.gg
  */
const workerUrl = "https://proxy.code913.workers.dev/";

function rewriteUrls(targetOrigin, text, ignore) {
  const modifiedUrl = workerUrl + encodeURI(targetOrigin);

  // Inject <base> tag into the <head>
  return text
    .replace(/(<head[^>]*?>)/i, `$1<base href="${modifiedUrl}/">`)
    .replace(/(href|src)=(['"]?)([^"'\s>]+)(['" >])/gi, (match, attribute, quote1, url, quote2) => {
      if (!ignore.some(i => url.includes(i))) {
        if (url.startsWith("//")) {
          // Protocol-relative URL: Join with worker's origin
          console.trace({ url });
          url = workerUrl + "https://" + url.slice(2);
        } else if (!url.startsWith("http")) {
          // Relative path: Join with worker's pathname
          url = modifiedUrl + url;
        } else if (!url.startsWith(modifiedUrl)) {
          // Absolute URL not pointing to the worker: Rewrite
          url = workerUrl + encodeURI(url);
        }
      }
      return `${attribute}=${quote1}${url}${quote2}`;
    });
}

export default {
  /**
   * @param {Request} request
   */
  async fetch(request) {
    const url = new URL(request.url);
    const ignore = url.searchParams.getAll("ignore[]");
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
      const modifiedText = rewriteUrls(targetOrigin, text, ignore);
      return new Response(modifiedText, response);
    }
    
    return response;
  },
};
