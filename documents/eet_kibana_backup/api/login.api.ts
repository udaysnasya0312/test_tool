import type { ApiTestCase, ApiTestEntry } from "../../../core/types.js";
const username = process.env.EET_USERNAME || "";
const password = process.env.EET_PASSWORD || "";
const login = "/login";
// Kibana rejects POSTs without this header (400).
const xsrf = { "kbn-xsrf": "true" };
// Opening the app page (without kbn-xsrf) gives the anonymous Kibana session cookie that every API call needs.
const openSession: ApiTestCase = {
  name: "open app page to get Kibana session",
  method: "GET",
  url: "/app/eetUi",
  auth: false,
  expectHttpStatus: 200,
};
export const loginRoutes: ApiTestEntry[] = [
  {
    name: "kibana status is available",
    method: "GET",
    url: "/api/status",
    auth: false,
    expectHttpStatus: 200,
    expectBody: { status: { overall: { level: "available" } } },
  },
  {
    name: "login - valid user",
    rows: [
      openSession,
      {
        name: "login - valid user",
        method: "POST",
        url: login,
        auth: false,
        headers: xsrf,
        payload: { email: username, password },
        expectHttpStatus: 200,
        expectBody: { status: 200, message: "User Login Successfully!" },
      },
    ],
  },
  {
    name: "login - wrong password",
    rows: [
      openSession,
      {
        name: "login - wrong password",
        method: "POST",
        url: login,
        auth: false,
        headers: xsrf,
        payload: { email: username, password: "wrong-password" },
        expectHttpStatus: 200,
        expectBody: { status: 400, message: "User Not Exists!" },
      },
    ],
  },
  {
    name: "login - unknown email",
    rows: [
      openSession,
      {
        name: "login - unknown email",
        method: "POST",
        url: login,
        auth: false,
        headers: xsrf,
        payload: {
          email: "no-such-user@example.com",
          password: "wrong-password",
        },
        expectHttpStatus: 200,
        expectBody: { status: 400, message: "User Not Exists!" },
      },
    ],
  },
  {
    name: "login - missing password",
    rows: [
      openSession,
      {
        name: "login - missing password",
        method: "POST",
        url: login,
        auth: false,
        headers: xsrf,
        payload: { email: username },
        expectHttpStatus: 400,
        expectBody: {
          message:
            "[request body.password]: expected value of type [string] but got [undefined]",
        },
      },
    ],
  },
  {
    name: "login - no Kibana session is rejected",
    method: "POST",
    url: login,
    auth: false,
    headers: xsrf,
    payload: { email: username, password },
    expectHttpStatus: 401,
    expectBody: { message: "Unauthorized" },
  },
  {
    name: "login - missing kbn-xsrf header is rejected",
    method: "POST",
    url: login,
    auth: false,
    payload: { email: username, password },
    expectHttpStatus: 400,
    expectBody: { message: "Request must contain a kbn-xsrf header." },
  },
];
