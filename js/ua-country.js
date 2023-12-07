/**
 * Cloudflare worker that returns the country of the IP making the request
 */
export default {
  async fetch(request, env, ctx) {
    const code = request.cf.country;

    return new Response(JSON.stringify({ country: { code, name: new Intl.DisplayNames(["en"], { type: "region" }).of(code) } }));
  },
};
