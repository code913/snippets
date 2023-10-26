/**
 * Boilerplate to make a request to discord api
 * Note: this does not handle file uploads; check interaction.ts for an example on how to handle files
 */
dapi = (path, token, method = "GET", body, parse = true) => fetch(`https://discord.com/api/v10/${path}`, {
    headers: {
        "Authorization": `Bot ${token}`,
        "Content-Type": body && "application/json"
    },
    body: body && JSON.stringify(body),
    method: method
}).then(r => parse ? r.json() : r);
