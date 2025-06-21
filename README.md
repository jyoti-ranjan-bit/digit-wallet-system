# Digital Wallet Backend Service

## Overview

This project is a backend service simulating a digital wallet system. It allows users to register, fund their wallet, pay other users, view transaction history, and purchase products using their wallet balance. The service is built using Node.js, Express, and PostgreSQL.

## Features

- User registration with password hashing (bcrypt)
- Basic Authentication for protected endpoints
- Fund account (deposit money)
- Pay another user
- Check wallet balance with optional currency conversion
- View transaction history
- Add products to a global catalog
- List all products
- Buy products using wallet balance

## Technology Stack

- Node.js with Express framework
- PostgreSQL for persistent data storage
- bcrypt for password hashing
- Basic Auth for authentication
- axios for external API calls (currency conversion)
- dotenv for environment variable management

## Database Workflow

The PostgreSQL database stores the following tables:

- **users**: Stores user information including username, hashed password, and wallet balance.
- **transactions**: Records all wallet transactions (credits and debits) with timestamps.
- **products**: Stores product catalog details including name, price (in INR), and description.

All wallet operations update the `users` table balance and insert corresponding records in the `transactions` table to maintain a history.

## API Workflow

1. **User Registration** (`POST /register`): Creates a new user with hashed password.
2. **Fund Account** (`POST /fund`): Adds money to the logged-in user's wallet and records a credit transaction.
3. **Pay Another User** (`POST /pay`): Transfers money from the logged-in user to another user, updating balances and recording debit and credit transactions.
4. **Check Balance** (`GET /bal`): Retrieves the user's wallet balance. Optionally converts the balance to another currency using the external currencyapi.com service.
5. **View Transaction History** (`GET /stmt`): Returns a list of all transactions for the logged-in user in reverse chronological order.
6. **Add Product** (`POST /product`): Adds a new product to the global catalog.
7. **List All Products** (`GET /product`): Lists all products in the catalog.
8. **Buy a Product** (`POST /buy`): Deducts the product price from the user's wallet balance and records a debit transaction.

## Environment Variables

The project uses a `.env` file with the following variables:

```
DATABASE_URL=postgres://postgres:1234@localhost:5432/pratica_mywallet_b6490e3a
JWT_SECRET=your_jwt_secret
PORT=4000
CURRENCY_API_KEY=your_currencyapi_key
```

- `DATABASE_URL`: PostgreSQL connection string.
- `JWT_SECRET`: Secret key for JWT (not used currently but reserved).
- `PORT`: Port on which the server runs.
- `CURRENCY_API_KEY`: API key for currencyapi.com to enable currency conversion.

## Setup and Execution

1. **Install dependencies**

```bash
npm install
```

2. **Set up PostgreSQL database**

- Create a PostgreSQL database as per `DATABASE_URL`.
- Run the provided `schema.sql` file to create necessary tables.

3. **Configure environment variables**

- Create a `.env` file with the variables above.
- Obtain a free API key from [currencyapi.com](https://currencyapi.com) and set `CURRENCY_API_KEY`.

4. **Start the server**

```bash
npm start
```

The server will start on the specified port (default 4000).

## Testing the API

Use tools like Postman or Curl to test the API endpoints. For protected endpoints, use Basic Authentication with your username and password.

Example: To check balance in USD

```
GET http://localhost:4000/bal?currency=USD
Authorization: Basic <base64(username:password)>
```

## Notes

- Passwords are securely hashed using bcrypt.
- All wallet transactions are recorded for audit and history.
- Currency conversion requires a valid API key.
- The project focuses on backend API functionality without a frontend UI.

## License

This project is open source and free to use.
