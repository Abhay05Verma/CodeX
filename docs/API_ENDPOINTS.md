# CodeX API – Data endpoints

Base URL: `http://localhost:3000` (or your backend URL)

All `/api/*` responses use envelope: `{ success, message?, data?, error? }`. Use `data` for the payload.

---

## Health & status (no auth)

| Method | Path           | Description        |
|--------|----------------|--------------------|
| GET    | /              | Backend running    |
| GET    | /api/status   | Status + timestamp |
| GET    | /health       | Health + uptime + memory |
| GET    | /test-mongo   | MongoDB connection check |

---

## Auth (`/api/auth`)

| Method | Path      | Auth | Description        |
|--------|-----------|------|--------------------|
| POST   | /register | No   | Register (body: name, email, password, role?, phone?, address?, businessName?, gstin?) |
| POST   | /login    | No   | Login (body: email, password) |
| GET    | /me       | Yes  | Current user       |
| POST   | /logout   | Yes  | Logout (client clears token) |

---

## Products (`/api/products`)

| Method | Path         | Auth              | Description                          |
|--------|--------------|-------------------|--------------------------------------|
| GET    | /            | No                | List products (query: q, category, status, supplier, minPrice, maxPrice, page, limit, sort) |
| GET    | /my-products | Supplier, Admin   | List current user’s products        |
| GET    | /:id         | No                | Get product by ID                   |
| POST   | /            | Supplier, Admin   | Create product (validateProduct)    |
| PUT    | /:id         | Supplier, Admin   | Update product (validateProduct)   |
| DELETE | /:id         | Supplier, Admin   | Delete product                      |

---

## Orders (`/api/orders`)

| Method | Path              | Auth           | Description                          |
|--------|-------------------|----------------|--------------------------------------|
| GET    | /my-orders        | Yes            | Buyer’s orders                      |
| GET    | /supplier-orders  | Supplier, Admin| Supplier’s orders                   |
| GET    | /:id              | Yes            | Get order by ID (buyer/supplier own) |
| POST   | /                 | Buyer, Admin   | Create order (body: supplierId, items[], notes?) |
| PATCH  | /:id/status       | Supplier, Admin| Update order status                 |
| POST   | /:id/review       | Buyer, Admin   | Add rating + review (delivered only)|

---

## Analytics (`/api/analytics`)

| Method | Path            | Auth   | Description        |
|--------|-----------------|--------|--------------------|
| GET    | /buyer-summary  | Yes    | Buyer analytics   |
| GET    | /supplier-summary | Yes  | Supplier analytics |

---

## Auth header

For protected routes send:

```
Authorization: Bearer <token>
```

Token is returned in `data.token` from `/api/auth/login` or `/api/auth/register`.
