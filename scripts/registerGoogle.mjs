import { createServer } from "node:http";
import { appendFileSync } from "node:fs";
import { execFile } from "node:child_process";

process.loadEnvFile(".env");

const ENV_GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const ENV_GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!ENV_GOOGLE_CLIENT_ID || !ENV_GOOGLE_CLIENT_SECRET) {
    throw new Error(
        "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET 가 .env 에 없습니다. GCP 에서 발급해주세요",
    );
}
if (process.env.GOOGLE_REFRESH_TOKEN) {
    throw new Error("GOOGLE_REFRESH_TOKEN 가 이미 존재합니다");
}

const SCOPES = [
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/drive.readonly",
];

const server = createServer(async (request, response) => {
    const url = new URL(request.url, "http://127.0.0.1");

    if (url.pathname !== "/callback") {
        return response.writeHead(404).end();
    }

    const code = url.searchParams.get("code");

    if (!code) {
        return response
            .writeHead(400)
            .end(`인증에 실패했습니다 : ${url.searchParams.get("error")}`);
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            code,
            client_id: ENV_GOOGLE_CLIENT_ID,
            client_secret: ENV_GOOGLE_CLIENT_SECRET,
            redirect_uri: REDIRECT_URL,
            grant_type: "authorization_code",
        }),
    });

    const token = await tokenResponse.json();

    if (!token.refresh_token) {
        response.writeHead(500).end("refresh_token 이 응답에 없습니다");
        console.error("응답 키:", Object.keys(token).join(", "), token.error);
        process.exit(1);
    }

    appendFileSync(".env", `\nGOOGLE_REFRESH_TOKEN=${token.refresh_token}\n`);

    response
        .writeHead(200, { "content-type": "text/plain; charset=utf-8" })
        .end("인증토큰 발급완료. 이 탭 닫아도 됨.");

    console.log(".env 에 GOOGLE_REFRESH_TOKEN 저장되었습니다");
    console.log("scope : ", token.scope);

    server.close();
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

const REDIRECT_URL = `http://127.0.0.1:${server.address().port}/callback`;
const AUTH_URL = new URL("https://accounts.google.com/o/oauth2/v2/auth");

AUTH_URL.search = new URLSearchParams({
    client_id: ENV_GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URL,
    scope: SCOPES.join(" "),
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
}).toString();

console.log("브라우저에서 로그인하세요 : ", AUTH_URL.toString());
execFile("open", [AUTH_URL.toString()]);
