# Demo dashboard on Ubuntu

This is a static UI with simulated execution and browser-local history. It does
not run Playwright, access Docker, or serve real reports. No credentials belong
in the frontend. The existing test runner image and Compose file are separate.

Copy frontend/ and docker-compose.ui.yml into ~/test_tool/ on the server.

```sh
cd ~/test_tool
sudo docker compose -f docker-compose.ui.yml up -d --build
```

Allow inbound TCP port 8080 from your IP in the EC2 security group. Open
http://<server-public-ip>:8080. If port 8080 is occupied, change the mapping to
8081:80 and use port 8081 instead. This demo has no authentication.

After updating UI files, run the same build command again. To stop:

```sh
sudo docker compose -f docker-compose.ui.yml down
```
