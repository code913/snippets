// Extremely simple redirect through cloudflare workers
export default {
  async fetch(request, env, ctx) {
    const url = new URL(new URL(request.url).searchParams.get("url"));
    console.log(url);
    const payload = {
      method: request.method,
      headers: request.headers
    };
    if (!["GET", "HEAD"].includes(payload.method)) payload.body = await request.arrayBuffer();
    return await fetch(url, payload);
  },
};
