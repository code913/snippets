/**
 * Boilerplate to make a request to discord api
 */
dapi = (path, token, method = "GET", body, parse = true) => fetch(`https://discord.com/api/v10/${path}`, {
    headers: {
        "Authorization": `Bot ${token}`,
        "Content-Type": body && "application/json"
    },
    body: body && JSON.stringify(body),
    method: method
}).then(r => parse ? r.json() : r);
