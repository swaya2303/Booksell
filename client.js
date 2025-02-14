// Fetch session data
fetch('/get-session')
  .then((response) => response.json())
  .then((data) => {
    if (data.loggedIn) {
      document.getElementById('welcomeMessage').textContent = `Welcome, ${data.phone_email}`;
      document.getElementById('postAdButton').style.display = 'block';
    } else {
      document.getElementById('welcomeMessage').textContent = 'Welcome, Guest';
      document.getElementById('postAdButton').style.display = 'none';
    }
  });

// Fetch books
  async function fetchBooks(query = "") {
    try {
      let response = await fetch(`/books?q=${query}`);
      let books = await response.json();
      let bookContainer = document.getElementById("book-list");
      bookContainer.innerHTML = ""; // Clear previous results

      books.forEach(book => {
        let bookCard = `
          <div class="col-md-3">
            <div class="card">
              <img src="${book.images[0] || 'default-book.jpg'}" class="card-img-top" alt="${book.title}">
              <div class="card-body">
                <h5 class="card-title">${book.title}</h5>
                <p class="card-text">₹${book.price}</p>
                <a href="/books/${book._id}" class="btn btn-primary">View</a>
              </div>
            </div>
          </div>
        `;
        bookContainer.innerHTML += bookCard;
      });
    } catch (error) {
      console.error("Error loading books:", error);
    }
  }

  // Fetch books on page load
  document.addEventListener("DOMContentLoaded", () => fetchBooks());

  // Search functionality
  document.getElementById("search-form").addEventListener("submit", function (e) {
    e.preventDefault();
    let query = document.getElementById("search-input").value;
    fetchBooks(query);
  });
