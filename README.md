# Notion-gitlab-sync

Service that syncs notion board to gitlab issues.

## Deploy
The service runs on vercel edge functions. Sadly vercel does not offer to run function on a CRON schedule or similar,
So [UptimeRobot](https://uptimerobot.com/) is used to ping the endpoint every 5 minutes or so
