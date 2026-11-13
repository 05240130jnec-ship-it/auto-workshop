# AutoConnection – Backend

REST API for the AutoConnection auto workshop management system.
Built with Node.js, Express, MySQL, JWT and bcrypt.

## Requirements
- Node.js
- XAMPP (MySQL)

## Setup
1. Start **MySQL** in XAMPP.
2. In phpMyAdmin, create a database called `autoconnection`, open its **Import** tab and import `database.sql`.
3. Copy `.env.example`, rename the copy to `.env` and set your own `JWT_SECRET`.
4. In this folder, run:
   ```
   npm install
   node seed.js
   npm run dev
   ```
5. Open http://localhost:3000/api/db-test. It should show `"connected": true`.

## Test accounts (from seed.js)
| Role | Email | Password |
|---|---|---|
| Admin | admin@autocare.bt | admin123 |
| Mechanic | ugyen@autocare.bt | mech123 |
| Customer | karma@gmail.com | user123 |

## How to call the API
1. `POST /api/auth/login` with `{ "email": "...", "password": "..." }` returns a `token`.
2. Send that token on every other request as the header:
   `Authorization: Bearer <token>`
3. Errors always come back as JSON: `{ "error": "message" }`.

## Endpoints

### Auth – `/api/auth`
| Method | URL | What it does |
|---|---|---|
| POST | /login | Log in (all roles) |
| POST | /signup | Customer sign up |
| GET | /me | Who am I |

### Customer – `/api/repairs` and `/api/shop`
| Method | URL | What it does |
|---|---|---|
| GET | /api/repairs | My repairs |
| GET | /api/repairs/slots?date=YYYY-MM-DD | Free time slots |
| GET | /api/repairs/:id | One repair with parts and services |
| POST | /api/repairs | Book a repair |
| PATCH | /api/repairs/:id | Cancel (`{"status":"cancelled"}`) |
| GET | /api/shop/parts | Parts in stock |
| GET / POST | /api/shop/reservations | My reservations / reserve a part |
| PATCH | /api/shop/reservations/:id | Cancel a reservation |
| GET / POST | /api/shop/listings | My listings / list a part for sale |

### Mechanic – `/api/mechanic`
| Method | URL | What it does |
|---|---|---|
| GET | /repairs | My assigned jobs |
| GET | /repairs/:id | One job with parts, services and total |
| PATCH | /repairs/:id | Start / complete a job, add notes |
| GET | /parts | Parts list |
| POST | /repairs/:id/parts | Log a part used (stock goes down) |
| DELETE | /repairs/:id/parts/:rowId | Remove a wrong part entry |
| POST | /repairs/:id/services | Add a service or labour |
| GET | /reports | My work summary |
| GET / PATCH | /profile | View / edit my profile |
| PATCH | /profile/password | Change my password |

### Admin – `/api/admin`
| Method | URL | What it does |
|---|---|---|
| GET | /dashboard | Summary numbers |
| GET / PATCH | /repairs, /repairs/:id | All repairs / assign mechanic, change status |
| GET / POST / PATCH / DELETE | /mechanics | Manage mechanics |
| GET / PATCH | /customers | View customers / edit or deactivate |
| GET / POST / PATCH / DELETE | /inventory | Manage parts (`?low=1` for low stock) |
| GET / POST / PATCH / DELETE | /suppliers | Manage suppliers |
| GET / POST / PATCH | /orders | Purchase orders (pending → approved → received) |
| GET / PATCH | /shop/listings | Approve or reject customer listings |
| GET / PATCH | /shop/reservations | Mark reservations collected or cancelled |

## Team
Kuenzang Lhamo, Chungku Wangmo, Uygen Dorji – Diploma in Computer System and Network, JNEC