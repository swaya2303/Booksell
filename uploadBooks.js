

// Define the schema for books



const mongoose = require('mongoose');

const newBookSchema = new mongoose.Schema({
    isbn: { type: String, required: true, unique: true },
    title: String,
    author: String,
    publisher: String,
    year: Number,
    description: String,
});

const NewBook = mongoose.model('newBooks', newBookSchema);

module.exports = NewBook;



// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/logintest', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});


const seedBooks = async () => {
    const books = [
  {
    isbn: "1111111111111",
    title: "Book Title 1",
    author: "Author 1",
    publisher: "Publisher 1",
    year: 2021,
    description: "Description of Book 1",
  },
  {
    isbn: "2222222222222",
    title: "Book Title 2",
    author: "Author 2",
    publisher: "Publisher 2",
    year: 2022,
    description: "Description of Book 2",
  },
  {
    isbn: "3333333333333",
    title: "Book Title 3",
    author: "Author 3",
    publisher: "Publisher 3",
    year: 2023,
    description: "Description of Book 3",
  },
];

// Upload books in bulk
try {
    await NewBook.insertMany(books);
    console.log("Books added to the new collection!");
} catch (err) {
    console.error("Error inserting books:", err);
}
};

seedBooks();