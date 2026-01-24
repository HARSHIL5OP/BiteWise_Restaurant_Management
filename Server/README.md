# Payment Server

This directory contains the backend server for handling Razorpay payments.

## Setup

The dependencies are already installed if you ran `npm install` inside this directory.

## Running the Server

To start the payment server, you can run the following command from the project root:

```bash
npm run server
```

Or from this directory:

```bash
npm start
```

The server runs on **port 8080**.

## Endpoints

-   `GET /order?amount={amount}`: Creates a new order ID with Razorpay for the specified amount (in INR).

## Configuration

The server code is in `index.js`. It uses the Razorpay Test Key ID and Secret.
