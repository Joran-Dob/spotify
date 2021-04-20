/**
 * Simplified way to get auth tokens for the purpose of development.
 */
import { Application, encode, Router } from "./deps.ts";

/**
 * CLIENT ID and CLIENT SECRET can be found at
 * https://developer.spotify.com/dashboard/applications
 * 
 * 1. Create your app
 * 2. Get "client ID" and "client secret" tokens
 * 3. Export them to your env as "spotify_client_id" and "spotify_client_secret"
 */
const clientId = Deno.env.get("spotify_client_id") ?? "";
const clientSecret = Deno.env.get("spotify_client_secret") ?? "";
const redirectUri = "http://localhost:8080/callback";

const app = new Application();
const router = new Router();

/**
 * full list of scopes can be found at
 * https://developer.spotify.com/documentation/general/guides/scopes/
 */
const scopes = [
  "ugc-image-upload",
  "user-read-recently-played",
  "user-top-read",
  "user-read-playback-position",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "app-remote-control",
  "playlist-modify-public",
  "playlist-modify-private",
  "playlist-read-private",
  "playlist-read-collaborative",
  "user-follow-modify",
  "user-library-modify",
  "user-library-read",
  "user-read-email",
  "user-read-private",
].join(" ");

router
  .get("/login", (ctx) => {
    const url = "https://accounts.spotify.com/authorize?response_type=code" +
      `&client_id=${clientId}` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}`;
    ctx.response.redirect(url);
  })
  .get("/callback", async (ctx) => {
    const code: string | null = ctx.request.url.searchParams.get("code");
    if (!code) {
      console.log(`No code provided`);
      ctx.response.body = `${ctx.request.body}`;
      return;
    }
    const value = encode(`${clientId}:${clientSecret}`);
    const data = await fetch(
      "https://accounts.spotify.com/api/token" +
        "?grant_type=authorization_code" +
        `&code=${encodeURIComponent(code)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Basic ${value}`,
        },
      },
    );
    const json = await data.json();
    console.log(
      `ACCESS TOKEN: ${json["access_token"]}\n\nREFRESH TOKEN: ${
        json["refresh_token"]
      }`,
    );
    console.log({
      accessToken: json["access_token"],
      refreshToken: json["refresh_token"],
    });
    ctx.response.type = "application/json";
    ctx.response.body = json;
    return;
  });

app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 8080 });