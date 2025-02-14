const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const session = require('express-session');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB connection
const uri = "mongodb://127.0.0.1:27017";
const client = new MongoClient(uri);
const DATABASE_NAME = "logintest";
const LOGIN_COLLECTION = "test1";
const ADS_DATABASE = "book_ads";
const ADS_COLLECTION = "ads";

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads'));
// Explicitly serve assets from /checkout
app.use('/checkout', express.static(path.join(__dirname, 'public', 'checkout')));



// Configure session middleware
app.use(
  session({
    secret: 'your-secret-key', // Replace with a strong, unique key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set `secure: true` when using HTTPS
  })
);

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Function to connect to MongoDB
async function connectToDatabase() {
  await client.connect();
  return client;
}
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes for login/signup functionality
// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, 'index.html'));
// });
app.get('/', (req, res) => {
  if (req.session.userId) {
    // If user is logged in, serve index.html with session info
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    // Redirect to login.html if not logged in
    res.redirect('/login.html');
  }
});

app.get('/', (req, res) => {
  if (req.session.userId) {
    // User is logged in
    res.render('index', { loggedIn: true });
  } else {
    // User is not logged in
    res.render('index', { loggedIn: false });
  }
});


app.get('/get-session', (req, res) => {
  if (req.session.userId) {
    res.json({
      loggedIn: true,
      phone_email: req.session.phone_email,
    });
  } else {
    res.json({ loggedIn: false });
  }
});

app.get('/books', async (req, res) => {
  const { q } = req.query; // Get search query from URL
  const client = await connectToDatabase();
  
  try {
    const database = client.db(ADS_DATABASE);
    const collection = database.collection(ADS_COLLECTION);
    
    const query = q ? { title: { $regex: q, $options: 'i' } } : {}; // Case-insensitive search
    const books = await collection.find(query).toArray();
    
    res.json(books);
  } catch (error) {
    res.status(500).send('Error fetching book ads');
  } finally {
    await client.close();
  }
});
app.post('/login-signup/register', async (req, res) => {
  const { phone_email, password } = req.body;
  const client = await connectToDatabase();
  
  try {
    const database = client.db(DATABASE_NAME);
    const usersCollection = database.collection(LOGIN_COLLECTION);
    const profilesCollection = database.collection('profiles');

    // Check if the user already exists
    const existingUser = await usersCollection.findOne({ phone_email });
    if (existingUser) {
      return res.status(400).send('Email is already registered.');
    }

    // Create user in login collection
    const result = await usersCollection.insertOne({ phone_email, password });

    // Create a default profile in the profiles collection
    const userId = result.insertedId;
    await profilesCollection.insertOne({
      userId: userId,
      name: '',
      phone: '',
      address: '',
    });

    res.send('Signup successful!');
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).send('Server error during signup.');
  } finally {
    await client.close();
  }
});
app.post('/login-signup/login', async (req, res) => {
  const { phone_email, password } = req.body;
  const client = await connectToDatabase();

  try {
    const database = client.db(DATABASE_NAME);
    const collection = database.collection(LOGIN_COLLECTION);
    const user = await collection.findOne({ phone_email, password });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Store user ID in session
    req.session.userId = user._id;
    console.log('Session started for user:', req.session.userId);

    // ✅ Send a single response
    res.json({ success: true, userId: user._id });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error during login.' });
  } finally {
    await client.close();
  }
});

// Nodemailer configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'swayam721765@gmail.com',
    pass: 'bvkzbspaptcgmalg',
  },
});
app.post('/login-signup/forgotPassword', async (req, res) => {
  const { phone_email } = req.body;
  const client = await connectToDatabase();
  try {
    const database = client.db(DATABASE_NAME);
    const collection = database.collection(LOGIN_COLLECTION);

    const user = await collection.findOne({ phone_email });
    if (!user) {
      return res.status(404).send('Email not registered.');
    }

    const resetCode = crypto.randomBytes(3).toString('hex');
    const expiration = Date.now() + 15 * 60 * 1000;

    await collection.updateOne(
      { phone_email },
      { $set: { resetCode, resetExpiration: expiration } }
    );

    const mailOptions = {
      from: 'swayam721765@gmail.com',
      to: phone_email,
      subject: 'Password Reset Code',
      text: `Your password reset code is: ${resetCode}`,
    };
    await transporter.sendMail(mailOptions);
    res.send('Password reset code sent.');
  } catch (error) {
    res.status(500).send('Server error during forgot password.');
  } finally {
    await client.close();
  }
});

app.post('/login-signup/resetPassword', async (req, res) => {
  const { phone_email, resetCode, newPassword } = req.body;
  const client = await connectToDatabase();
  try {
    const database = client.db(DATABASE_NAME);
    const collection = database.collection(LOGIN_COLLECTION);

    const user = await collection.findOne({
      phone_email,
      resetCode,
      resetExpiration: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).send('Invalid or expired reset code.');
    }

    await collection.updateOne(
      { phone_email },
      { $set: { password: newPassword }, $unset: { resetCode: '', resetExpiration: '' } }
    );

    res.send('Password has been reset successfully!');
  } catch (error) {
    res.status(500).send('Server error during password reset.');
  } finally {
    await client.close();
  }
});

function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).send('You must log in to post an ad.');
  }
}

app.get('/profile', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).send('You must log in to view your profile.');
  }

  const client = await connectToDatabase();
  try {
    const database = client.db(DATABASE_NAME);
    const collection = database.collection('profiles');

    // Find the user's profile
    let userProfile = await collection.findOne({ userId: req.session.userId });

    // If no profile exists, create a default one
    if (!userProfile) {
      userProfile = {
        userId: req.session.userId,
        name: '',
        phone: '',
        address: '',
      };
      await collection.insertOne(userProfile);
    }

    res.json(userProfile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).send('Error fetching profile.');
  } finally {
    await client.close();
  }
});


// Add a route to update the user's profile
app.post('/profile/update', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).send('You must log in to update your profile.');
  }

  const { name, phone, address } = req.body;

  const client = await connectToDatabase();
  try {
    const database = client.db(DATABASE_NAME);
    const collection = database.collection('profiles');

    console.log("Session userId:", req.session.userId); // Log userId
    console.log("Data to update:", { name, phone, address }); // Log update data

    // Perform the update operation
    const result = await collection.updateOne(
      { userId: req.session.userId }, // Filter by userId
      { $set: { name, phone, address } }, // Update fields
      { upsert: true } // Insert if not found
    );

    console.log("Database update result:", result); // Log result

    if (result.modifiedCount === 0 && result.upsertedCount === 0) {
      throw new Error("No document was updated or created."); // Handle failure
    }

    res.send('Profile updated successfully!');
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).send('Server error while updating profile.');
  } finally {
    await client.close();
  }
});

app.get('/my-ads', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).send('You must log in to view your ads.');
  }

  const client = await connectToDatabase();
  try {
    const database = client.db(ADS_DATABASE);
    const collection = database.collection(ADS_COLLECTION);

    // Fetch ads by userId
    const userAds = await collection.find({ userId: req.session.userId }).toArray();

    res.json(userAds); // Send the ads as JSON response
  } catch (error) {
    console.error('Error fetching user ads:', error);
    res.status(500).send('Error fetching ads.');
  } finally {
    await client.close();
  }
});

// Serve post-ad.html
app.get('/post-ad.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'post-ad.html'));
});

// Protect the Post Ad route
app.post('/post-ad', isAuthenticated, upload.array('adimage[]', 5), async (req, res) => {
  const formData = req.body;
  const imagePaths = req.files.map((file) => file.path);
  const { ObjectId } = require('mongodb'); // Import ObjectId

const adData = { 
  ...formData, 
  images: imagePaths, 
  userId: new ObjectId(req.session.userId)  // Convert userId to ObjectId
};


  const client = await connectToDatabase();
  try {
    const database = client.db(ADS_DATABASE);
    const collection = database.collection(ADS_COLLECTION);
    await collection.insertOne(adData);

    res.send('<h1>Ad Submitted Successfully</h1>');
  } catch (error) {
    res.status(500).send('Error saving ad to database');
  } finally {
    await client.close();
  }
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

// Define the schema for books
const newBookSchema = new mongoose.Schema({
    isbn: { type: String, required: true, unique: true },
    title: String,
    author: String,
    publisher: String,
    year: Number,
    description: String,
});

const NewBook = require('./models/newBookModel');



mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected');
});

mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000, // 30 seconds timeout
});


// Endpoint to fetch book details by ISBN
app.get('/api/newBooks/:isbn', async (req, res) => {
    const { isbn } = req.params;
    console.log("Received ISBN:", isbn);

    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        await client.connect();
        const database = client.db("logintest");  // Use the correct database
        const collection = database.collection("newBooks");  // Use the correct collection

        const book = await collection.findOne({ isbn: isbn.trim() });

        console.log("Query result:", book);
        
        if (book) {
            res.json(book);
        } else {
            res.status(404).json({ message: `Book not found for ISBN: ${isbn}` });
        }
    } catch (error) {
        console.error("Error fetching book details:", error);
        res.status(500).json({ message: "Server error", error });
    } finally {
        await client.close();
    }
});



// Fetch all books to display as ads
app.get('/api/books', async (req, res) => {
  const client = await connectToDatabase();
  try {
    const database = client.db(ADS_DATABASE);
    const collection = database.collection(ADS_COLLECTION);
    const books = await collection.find({}).toArray();
    res.json(books);
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).send('Error fetching books');
  } finally {
    await client.close();
  }
});


// Fetch single book details
const { ObjectId } = require('mongodb');

app.get('/api/book/:id', async (req, res) => {
  const { id } = req.params;
  const client = await connectToDatabase();

  try {
      const database = client.db(ADS_DATABASE);
      const collection = database.collection(ADS_COLLECTION);

      let book = await collection.findOne({ _id: new ObjectId(id) });

      if (book) {
          res.json(book);
      } else {
          res.status(404).json({ error: "Book not found" });
      }
  } catch (error) {
      console.error("Error fetching book:", error);
      res.status(500).json({ error: "Internal Server Error" });
  } finally {
      await client.close();
  }
});


app.post('/api/cart/add', (req, res) => {
  const { userId } = req.session;
  if (!userId) return res.status(401).send('Unauthorized');

  const { title, price, image } = req.body;
  const cartKey = `cart_${userId}`;
  req.session[cartKey] = req.session[cartKey] || [];
  req.session[cartKey].push({ title, price, image });

  res.send('Item added to cart');
});

app.get('/api/cart', (req, res) => {
  const { userId } = req.session;
  if (!userId) return res.status(401).send('Unauthorized');

  const cartKey = `cart_${userId}`;
  res.json(req.session[cartKey] || []);
});


const messageSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  chatId: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

app.post('/chat/send', async (req, res) => {
  const { senderId, receiverId, message } = req.body;

  if (!senderId || !receiverId || !message) {
      return res.status(400).json({ error: "Missing senderId, receiverId, or message" });
  }

  try {
      if (!db) {
          await connectToDatabase(); // Ensure MongoDB is connected
      }

      const messagesCollection = db.collection("messages");
      const chatsCollection = db.collection("chats");

      const newMessage = {
          senderId,
          receiverId,
          message,
          createdAt: new Date()
      };

      await messagesCollection.insertOne(newMessage); // Store the message

      // Step 1: Check if a chat already exists
      const existingChat = await chatsCollection.findOne({
          participants: { $all: [senderId, receiverId] }
      });

      if (existingChat) {
          // Step 2: If the chat exists, update only lastMessage and updatedAt
          await chatsCollection.updateOne(
              { _id: existingChat._id },
              { $set: { lastMessage: message, updatedAt: new Date() } }
          );
      } else {
          // Step 3: If the chat does NOT exist, create a new chat entry
          await chatsCollection.insertOne({
              participants: [senderId, receiverId],
              lastMessage: message,
              updatedAt: new Date()
          });
      }

      res.status(200).json({ success: true });
  } catch (error) {
      console.error("❌ Error sending message:", error);
      res.status(500).json({ error: "Internal server error" });
  }
});


app.get('/chat/list', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "User ID required" });

  const chats = await db.collection('chats')
      .find({ participants: userId })
      .sort({ updatedAt: -1 }) // Most recent first
      .toArray();

  const chatList = await Promise.all(chats.map(async chat => {
      const otherUserId = chat.participants.find(id => id !== userId);
      const otherUser = await db.collection('users').findOne({ _id: otherUserId });

      return {
          otherUserId,
          otherUserName: otherUser ? otherUser.name : "Unknown User",
          lastMessage: chat.lastMessage
      };
  }));

  res.json(chatList);
});

app.get('/chat/messages', async (req, res) => {
  const { senderId, receiverId } = req.query;

  if (!senderId || !receiverId) {
      return res.status(400).json({ error: "Missing senderId or receiverId" });
  }

  try {
      if (!db) {
          await connectToDatabase(); // Ensure connection
      }

      const messagesCollection = db.collection("messages"); // Messages collection
      const chatsCollection = db.collection("chats"); // Chats collection

      // Find messages between sender and receiver
      const messages = await messagesCollection.find({
          $or: [
              { senderId, receiverId },
              { senderId: receiverId, receiverId: senderId }
          ]
      }).sort({ createdAt: 1 }).toArray();

      if (messages.length === 0) {
          console.log("🔹 No messages found. Checking if chat exists...");

          // Check if chat exists
          const existingChat = await chatsCollection.findOne({
              participants: { $all: [senderId, receiverId] }
          });

          if (!existingChat) {
              console.log("🆕 Creating a new chat entry...");
              await chatsCollection.insertOne({
                  participants: [senderId, receiverId],
                  lastMessage: "",
                  updatedAt: new Date()
              });
          }

          return res.json([]); // Return empty array (no messages yet)
      }

      res.json(messages); // Return found messages
  } catch (error) {
      console.error("❌ Error fetching messages:", error);
      res.status(500).json({ error: "Internal server error" });
  }
});



app.get('/chat/users', async (req, res) => {
  const { userId } = req.query;
  const users = await db.collection('chats')
      .find({ participants: userId })
      .toArray();
  res.json(users.map(chat => chat.otherUser));
});


app.get('/chat/conversations', async (req, res) => {
  const { sellerId } = req.query;
  if (!sellerId) return res.status(400).json({ error: "Missing seller ID" });

  try {
      // Find distinct buyers who have messaged the seller
      const conversations = await Message.aggregate([
          { $match: { receiverId: sellerId } },
          { $group: { _id: "$senderId" } },
          { $project: { buyerId: "$_id", _id: 0 } }
      ]);

      res.json(conversations);
  } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Internal server error" });
  }
});

app.post('/buy-book', async (req, res) => {
  const { bookId } = req.body;
  if (!req.session.userId) {
      return res.status(401).json({ success: false, message: "You must be logged in to buy a book." });
  }

  const client = await connectToDatabase();
  try {
      const database = client.db(ADS_DATABASE);
      const adsCollection = database.collection(ADS_COLLECTION);
      const notificationsCollection = database.collection("notifications"); // ✅ Fix here

      const book = await adsCollection.findOne({ _id: new ObjectId(bookId) });

      if (!book) {
          return res.status(404).json({ success: false, message: "Book not found." });
      }

      const sellerId = book.userId.toString();
      const buyerId = req.session.userId.toString();

      // Save notification in the database
      const notification = {
          sellerId,
          buyerId,
          message: `Your book "${book.title}" has been sold!`,
          timestamp: new Date(),
          seen: false
      };
      const mailOptions = {
        from: 'swayam721765@gmail.com',
        to: 'swayamanand2303@gmail.com',
        subject: 'New Book Purchase',
        text: `Book "${book.title}" (₹${book.price}) was purchased by user ${req.session.userId}.`
      };
      await transporter.sendMail(mailOptions);
      await notificationsCollection.insertOne(notification);

      res.json({ success: true, message: "✅ Book bought successfully! The seller has been notified." });

  } catch (error) {
      console.error("❌ Error processing book purchase:", error);
      res.status(500).json({ success: false, message: "Internal server error." });
  } finally {
      await client.close();
  }
});



// SSE: Real-time notifications for sellers

app.get('/notifications/stream', async (req, res) => {
  if (!req.session.userId) {
      return res.status(401).json({ success: false, message: "You must be logged in." });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const client = await connectToDatabase(); // ✅ Ensure connection
  const database = client.db(ADS_DATABASE);
  const notificationsCollection = database.collection("notifications"); // ✅ Define here

  const sellerId = req.session.userId.toString();

  try {
      // Watch for new notifications
      const changeStream = notificationsCollection.watch([
          { $match: { 'fullDocument.sellerId': sellerId } } // ✅ Ensure filtering by seller ID
      ]);

      changeStream.on('change', (change) => {
          if (change.operationType === "insert") {
              res.write(`data: ${JSON.stringify(change.fullDocument)}\n\n`);
          }
      });

      req.on('close', () => {
          console.log('SSE connection closed for seller:', sellerId);
          changeStream.close();
          client.close(); // ✅ Close connection when done
      });

  } catch (error) {
      console.error("Error in SSE notifications:", error);
      res.status(500).json({ success: false, message: "Internal server error." });
  }
});


  app.get('/seller/notifications', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ success: false, message: "You must be logged in." });
    }

    const client = await connectToDatabase();
    try {
        const database = client.db(ADS_DATABASE);
        const notificationsCollection = database.collection("notifications"); // ✅ Initialize correctly

        // Fetch unread notifications for the logged-in seller
        const notifications = await notificationsCollection.find({
            sellerId: req.session.userId,
            seen: false
        }).toArray();

        res.json({ success: true, notifications });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ success: false, message: "Server error." });
    } finally {
        await client.close();
    }
});

// Serve React app for /checkout route
app.get('/checkout*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'checkout', 'index.html'));
});



// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
