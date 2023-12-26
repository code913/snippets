/**
  * Redirect requests through cloudflare workers and try to rewrite response urls to also go through it
  * No guarantee as to whether it would work or get blocked
  * @param {string[]} [proxy_ignore[]] - Array of strings to match against urls that shouldn't be proxied; they will be served as redirects instead by ?onlyRedirect
  * @param {boolean} [onlyRedirect] - Boolean to only redirect the request instead of proxying
  * @see https://proxy.code913.workers.dev/https://code913.devpage.me/?proxy_ignore[]=github.com&proxy_ignore[]=svelte.dev&proxy_ignore[]=codepen.io&proxy_ignore[]=discord.gg
  */
const workerUrl = "https://proxy.code913.workers.dev/";

function rewriteUrls(targetOrigin, text, ignore) {
  const modifiedUrl = workerUrl + encodeURI(targetOrigin);

  // Inject <base> tag into the <head>
  return text
    .replace(/(<head[^>]*?>)/i, `$1<base href="${modifiedUrl}/">`)
    .replace(/(href|src(?:set|doc)?|(?:form)?action|cite|formtarget|longdesc|manifest|poster|profile|background|data|dynsrc|ping|usemap)=(['"]?)([^"'\s>]+)(['" >])/gi, (match, attribute, quote1, url, quote2) => {
      if (ignore.some(i => url.includes(i))) {
        url = new URL(workerUrl + encodeURI(url));
        url.searchParams.append("proxy_onlyRedirect", true);
        url = url.href;
      } else {
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
    const ignore = url.searchParams.getAll("proxy_ignore[]");
    const onlyRedirect = url.searchParams.get("proxy_onlyRedirect");
    console.dir({ onlyRedirect });
    const targetOrigin = new URL(url.pathname !== "/" ? url.pathname.slice(1) : url.searchParams.get("url")).href; // Handle both pathname and ?url cases

    const completeTarget = new URL(targetOrigin);
    completeTarget.search = url.search;
    completeTarget.searchParams.delete("proxy_ignore[]");
    completeTarget.searchParams.delete("proxy_onlyRedirect");
    if (onlyRedirect !== null) return new Response(null, {
      status: 307,
      headers: {
        Location: completeTarget.href
      }
    });

    const payload = {
      method: request.method,
      headers: request.headers,
    };
    if (!["GET", "HEAD"].includes(payload.method)) {
      payload.body = await request.arrayBuffer();
    }

    const response = await fetch(completeTarget, payload);

    if (response.headers.get("Content-Type").startsWith("text/")) {
      const text = await response.text();
      const modifiedText = rewriteUrls(targetOrigin, text, ignore);
      return new Response(modifiedText, response);
    }
    
    return response;
  },
};
