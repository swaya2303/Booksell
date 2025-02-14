# Booksell
Second-Hand Book Marketplace
Welcome to the Second-Hand Book Marketplace, a platform where sellers can list their used books and buyers can browse, purchase, and interact with sellers. This application is designed to provide a seamless experience for both buyers and sellers, with features like user authentication, book browsing, order management, real-time chat, and more.

Features
1. User Authentication
Login: Users can log in using their credentials.

Signup: New users can create an account.

Forgot Password: Users can reset their password via email.

Reset Password: Users can set a new password after receiving a reset link.

2. Browse Books
Buyers can browse through a list of available books.

Books can be filtered and sorted by price, condition, and other criteria.

3. Profile Page
Users can view and edit their personal information.

Sellers can switch to "Seller Mode" to manage their books and orders.

4. My Books (Seller)
Sellers can view all the books they have posted.

Each book listing includes Edit, View, and Delete buttons for easy management.

5. My Orders (Buyer)
Buyers can view their order history, including the status of each order (e.g., pending, accepted, rejected).

6. My Selling Orders (Seller)
Sellers can view orders received for their books.

Sellers can Accept or Reject orders.

7. Real-Time Chat
Buyers and sellers can communicate in real-time regarding book conditions, pricing, and other details.

Chat history is saved for future reference.

8. Wishlist
Buyers can add books to their wishlist by clicking the wishlist icon.

Users can view and manage their wishlist on a dedicated page.

9. Post Book (Seller)
Sellers can post new books by providing details such as:

Title

Book Condition (e.g., New, Like New, Good, Acceptable)

Photo

MRP (Maximum Retail Price)

Selling Price

Shipping Charges

10. Book Details Page
Each book has a dedicated page with all relevant details.

Buyers can:

Add the book to their wishlist.

Click Buy Now to proceed to checkout (payment integration to be added later).

11. Database
All data (users, books, orders, wishlists, messages) is stored in a MongoDB database.

Relationships between collections (e.g., users, books, orders) are maintained using references.

Technologies Used
Frontend
React.js: For building the user interface.

Axios: For making API calls.

React Router: For navigation between pages.

Tailwind CSS/Bootstrap: For responsive and modern UI design.

Backend
Node.js: For server-side logic.

Express.js: For building RESTful APIs.

MongoDB: For database management.

Mongoose: For schema modeling and database interactions.

Socket.IO: For real-time chat functionality.

JWT (JSON Web Tokens): For user authentication and authorization.

Bcrypt: For password hashing and security.

Additional Tools
Cloudinary: For image uploads and storage.

Multer: For handling file uploads.

Nodemailer: For sending password reset emails.

Database Schema
Collections
Users

_id: ObjectId

username: String

email: String

passwordHash: String

profilePic: String (URL)

createdAt: Date

resetToken: String (for password reset)

resetExpiry: Date

Books

_id: ObjectId

title: String

author: String

condition: String (enum: New, Like New, Good, Acceptable)

photoURL: String

mrp: Number

price: Number

shipping: Number

sellerId: ObjectId (ref: Users)

status: String (enum: Available, Sold)

Orders

_id: ObjectId

bookId: ObjectId (ref: Books)

buyerId: ObjectId (ref: Users)

sellerId: ObjectId (ref: Users)

orderDate: Date

status: String (enum: Pending, Accepted, Rejected, Shipped)

paymentIntent: String (placeholder for payment integration)

Wishlists

_id: ObjectId

userId: ObjectId (ref: Users)

bookIds: Array of ObjectId (ref: Books)

Messages

_id: ObjectId

senderId: ObjectId (ref: Users)

receiverId: ObjectId (ref: Users)

bookId: ObjectId (ref: Books)

message: String

timestamp: Date

API Endpoints
Authentication
POST /api/signup: User registration.

POST /api/login: User login (returns JWT token).

POST /api/forgot-password: Send password reset email.

POST /api/reset-password: Reset password using token.

Books
GET /api/books: Fetch all books (with filters and sorting).

GET /api/books/:id: Fetch details of a specific book.

POST /api/books: Add a new book (seller only).

PUT /api/books/:id: Update a book (seller only).

DELETE /api/books/:id: Delete a book (seller only).

Orders
GET /api/orders: Fetch orders for a buyer.

GET /api/selling-orders: Fetch orders for a seller.

POST /api/orders: Create a new order (buyer only).

PUT /api/orders/:id: Update order status (seller only).

Wishlist
POST /api/wishlist: Add/remove a book from wishlist.

GET /api/wishlist: Fetch user's wishlist.

Chat
GET /api/messages/:bookId: Fetch chat history for a book.

POST /api/messages: Send a new message.
