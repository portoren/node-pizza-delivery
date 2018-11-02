# Pizza Delivery API

RESTful API built in NodeJS for a pizza-delivery company.

## Requirements

NodeJS 8.12.0 and later

## Dependencies

It does not use external libraries (NPM) to integrate with **Stripe** or **Mailgun**, all API calls have been built from scratch.

## Specs

Here's the spec used: 

1. New users can be created, their information can be edited, and they can be deleted. Users information is a name, an email address, and a street address.

2. Users can log in and log out by creating or destroying an API token.

3. When a user is logged in, they should be able to GET all the possible menu items (these items were hardcoded into the system). 

4. A logged-in user should be able to fill a shopping cart with menu items.

5. A logged-in user should be able to create an order. It should be integrated with the Sandbox of [Stripe](https://www.stripe.com) to accept their payment. Credit card information won't be collected. It assumes that a Payment Token has been previously created with Stripe.

6. When an order is placed, the system should email the user a receipt. It should be integrated with the sandbox of [Mailgun](https://www.mailgun.com/) and should use an HTML receipt template.

7. Abandoned carts and expired API tokens should be purged hourly by a background process.

8. Background processes and all backend events after payment should be logged to a file. Log files should be rotated at startup and every 24 hours into compressed files. 

## Usage

Clone the repo or download the source code.

Create a .env.local file in the root directory of your project. Add environment-specific variables on new lines in the form of NAME=VALUE as follows:

```
HASH_SECRET=[yourSecret]
STRIPE_URL=https://api.stripe.com/v1/charges
STRIPE_API_KEY=[yourStripeApiKey]
MAILGUN_URL=https://api.mailgun.net/v3/
MAILGUN_API_KEY=[yourMailgunApiKey]
MAILGUN_DOMAIN=[yourMailgunDomain]
```

That's it.


