# Pizza Delivery API

RESTful API built in NodeJS for a pizza-delivery company.

## Requirements

NodeJS 8.12.0 and later

## Dependencies

It does not use external libraries (NPM) to integrate with **Stripe** or **Mailgun**, all API calls have been built from scratch.

## Specs

Here's the spec used: 

1. New users can be created, their information can be edited, and they can be deleted. We should store their name, email address, and street address.

2. Users can log in and log out by creating or destroying a token.

3. When a user is logged in, they should be able to GET all the possible menu items (these items were hardcoded into the system). 

4. A logged-in user should be able to fill a shopping cart with menu items

5. A logged-in user should be able to create an order. It is integrated with the Sandbox of [Stripe](https://www.stripe.com) to accept their payment.

6. When an order is placed, the system should email the user a receipt. It is integrated with the sandbox of [Mailgun](https://www.mailgun.com/) for this.
