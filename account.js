// Firebase API URLs
const customerAPI = 'https://firestore.googleapis.com/v1/projects/online-shopping-658a7/databases/(default)/documents/customer';
const customerDetailsAPI = 'https://firestore.googleapis.com/v1/projects/online-shopping-658a7/databases/(default)/documents/Customerdetails';
const customerIdTrackerAPI = 'https://firestore.googleapis.com/v1/projects/online-shopping-658a7/databases/(default)/documents/meta/customerIdTracker';

// Function to fetch the last customer ID
async function fetchLastCustomerId() {
    const response = await fetch(customerIdTrackerAPI);
    const data = await response.json();
    return data.fields.lastCustomerId.integerValue;
}

// Function to update the customer ID tracker
async function updateCustomerIdTracker(newId) {
    const trackerDoc = {
        fields: {
            lastCustomerId: { integerValue: newId }
        }
    };
    
    await fetch(customerIdTrackerAPI, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(trackerDoc)
    });
}

// Function to handle login
document.getElementById("login-form").addEventListener("submit", async function (event) {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // Check login credentials
    fetch(customerAPI)
        .then(response => response.json())
        .then(data => {
            const users = data.documents;
            let userFound = false;
            let validUser = false;

            users.forEach(user => {
                const userEmail = user.fields.email.stringValue;
                const userPassword = user.fields.password.stringValue; // Password stored securely

                if (userEmail === email) {
                    userFound = true;
                    if (userPassword === password) {
                        validUser = true;
                    }
                }
            });

            if (email === 'priyapde05@gmail.com' && password === 'priya123') {
                window.location.href = "adminhome.html"; // Admin home page
            } else if (validUser) {
                window.location.href = "userhome.html"; // User home page
            } else if (userFound) {
                alert('Incorrect password. Please try again.');
            } else {
                alert('User not found. Please sign up.');
            }
            document.getElementById("login-form").reset();
        })
        .catch(error => console.error('Error fetching data:', error));
});  

// Function to handle signup
document.getElementById("signup-form").addEventListener("submit", async function (event) {
    event.preventDefault();
    const name = document.getElementById("name").value;
    const email = document.getElementById("signup-email").value;
    const mobile = document.getElementById("mobile").value;
    const password = document.getElementById("signup-password").value;

    // Fetch the last customer ID and increment it
    const lastCustomerId = await fetchLastCustomerId();
    const newCustomerId = lastCustomerId + 1;

    // Store email and password in the Customer API
    const newUser = {
        fields: {
            email: { stringValue: email },
            password: { stringValue: password }  // Store password securely
        }
    };

    // Add the new customer to the Customer collection
    fetch(customerAPI, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(newUser)
    })
    .then(response => {
        if (response.ok) {
            // Store user details in Customerdetails API
            const newCustomerDetails = {
                fields: {
                    id: { integerValue: newCustomerId },
                    name: { stringValue: name },
                    email: { stringValue: email },
                    mobile: { stringValue: mobile },
                    creditLimit: { integerValue: 0 }, // Default credit limit
                    password: { stringValue: password } // Also store password here (for some reason)
                }
            };

            fetch(customerDetailsAPI, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newCustomerDetails)
            })
            .then(response => {
                if (response.ok) {
                    // Update the customer ID tracker after successful signup
                    updateCustomerIdTracker(newCustomerId);
                    alert('Sign-up successful! You can now log in.');
                    document.getElementById("signup-form").reset();
                    document.getElementById("signup-form-container").classList.add("hidden");
                    document.getElementById("login-form").classList.remove("hidden");
                } else {
                    alert('Failed to save customer details. Please try again.');
                }
            })
            .catch(error => console.error('Error saving customer details:', error));
        } else {
            alert('Sign-up failed. Please try again.');
        }
    })
    .catch(error => console.error('Error saving new user:', error));
});

// Toggle between login and signup forms
document.getElementById("show-signup").addEventListener("click", function () {
    document.getElementById("login-form").classList.add("hidden");
    document.getElementById("signup-form-container").classList.remove("hidden");
});

document.getElementById("show-login").addEventListener("click", function () {
    document.getElementById("signup-form-container").classList.add("hidden");
    document.getElementById("login-form").classList.remove("hidden");
});

// Handle forgot password link
document.getElementById("forgot-password-link").addEventListener("click", function () {
    alert('Please contact support to reset your password.');
});
