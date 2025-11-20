# nft_mint_server

Support service for ticketing + settlement demos. Copy `.env.template` to `.env` and populate these Stripe-specific values before running:

- `STRIPE_SECRET_KEY`: your Stripe **test** secret key (`sk_test_…`).
- `STRIPE_WEBHOOK_SECRET`: the webhook secret emitted by `stripe listen --forward-to http://localhost:3001/api/stripe/webhook` (or the value shown in the Stripe Dashboard for your deployed webhook).

Optional helpers:

- `FRONTEND_BASE_URL`: defaults to `http://localhost:5173` and is used to build redirect URLs when the frontend does not pass custom `successUrl`/`cancelUrl` values.
- `CHECKOUT_SUCCESS_URL` / `CHECKOUT_CANCEL_URL`: override redirect URLs outright if you would rather not derive them from `FRONTEND_BASE_URL`.

These keys allow the `/api/stripe/checkout-session` route to create Checkout Sessions (Milestone A) and the webhook handler (Milestone B) to trust Stripe events. Keep them out of version control.
