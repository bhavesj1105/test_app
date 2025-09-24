Third-Party Extensions (Minimal Platform)

Server:
- Register app: POST /api/apps/register (requires user JWT)
- Approve app (admin): POST /api/apps/approve/:clientId
- Get app token: POST /api/apps/oauth/token { client_id, client_secret }
- Post rich card: POST /api/extensions/rich-card (Bearer app token)

Rich card payload:
{ chatId, title, url, image?, action? }

Client:
- App picker in composer invokes an extension and inserts returned card payload into the message UI.
- Messages render cardPayload via ExtensionCard.

Env:
- APP_JWT_SECRET, ADMIN_USER_IDS
