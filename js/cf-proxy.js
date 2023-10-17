// Extremely simple redirect through cloudflare workers
export default {
  async fetch(request, env, ctx) {
    const url = new URL(new URL(request.url).searchParams.get("url"));
    console.log(url);
    return await fetch(url.href, {
      body: await request.arrayBuffer(),
      method: request.method,
      headers: request.headers
    });
  },
};
