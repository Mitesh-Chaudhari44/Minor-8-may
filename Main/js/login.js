document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
        const response = await fetch("http://localhost:5000/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Store token
            localStorage.setItem("token", data.token);
            
            // Fetch user's saved articles
            const savedArticlesResponse = await fetch("http://localhost:5000/api/user/bookmarks", {
                headers: {
                    "Authorization": `Bearer ${data.token}`
                }
            });
            
            let savedArticles = [];
            if (savedArticlesResponse.ok) {
                const savedData = await savedArticlesResponse.json();
                savedArticles = savedData.bookmarks || [];
            }

            // Store user data with saved articles
            localStorage.setItem("userData", JSON.stringify({
                name: data.user.name,
                email: data.user.email,
                profileImage: data.user.profileImage,
                lastViewedArticles: [],
                savedArticles: savedArticles,
                preferences: data.user.preferences || {
                    categories: [],
                    sources: []
                }
            }));
            
            // Redirect to main page
            window.location.href = 'index.html';
        } else {
            alert(data.error || "Login failed. Please check your credentials.");
        }
    } catch (error) {
        console.error("Login Error:", error);
        alert("An error occurred during login. Please try again.");
    }
});


