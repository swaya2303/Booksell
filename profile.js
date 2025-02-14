document.addEventListener("DOMContentLoaded", () => {
    const profileSection = document.getElementById("profile-section");
    const updateProfileForm = document.getElementById("update-profile-form");
  
    // Fetch and display profile details
    fetch("/profile", { credentials: "include" }) // Include cookies for session
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch profile data.");
        }
        return response.json();
      })
      .then((data) => {
        if (data) {
          document.getElementById("name").value = data.name || "";
          document.getElementById("phone").value = data.phone || "";
          document.getElementById("address").value = data.address || "";
        }
      })
      .catch((error) => {
        console.error(error);
        profileSection.innerHTML = `<p class="text-danger">Error loading profile data.</p>`;
      });
  
    // Handle profile update
    updateProfileForm.addEventListener("submit", (e) => {
      e.preventDefault();
  
      const formData = {
        name: document.getElementById("name").value,
        phone: document.getElementById("phone").value,
        address: document.getElementById("address").value,
      };
  
      fetch("/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to update profile.");
          }
          return response.text();
        })
        .then((message) => {
          alert(message); // Show success message
        })
        .catch((error) => {
          console.error(error);
          alert("An error occurred while updating your profile.");
        });
    });
  });
  