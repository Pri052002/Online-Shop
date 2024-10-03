document.addEventListener('DOMContentLoaded', function() {
    // Handle Login and Signup on the account.html page
    if (window.location.pathname.includes('account.html')) {
        // Handle login
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async function(event) {
                event.preventDefault();

                // Get email and password from form
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;

                // Firestore REST API endpoint
                const apiUrl = 'https://firestore.googleapis.com/v1/projects/online-shopping-658a7/databases/(default)/documents/Customer';

                // Prepare customer data for login
                const customerData = {
                    fields: {
                        email: { stringValue: email },
                        password: { stringValue: password }
                    }
                };

                try {
                    // Send POST request to Firestore using Fetch API
                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(customerData)
                    });

                    // Handle response
                    if (response.ok) {
                        document.getElementById('responseMessage').textContent = 'Login successful!';
                        document.getElementById('loginForm').reset();

                        // Redirect based on email
                        if (email === "priyapde05@gmail.com") {
                            window.location.href = "admin.html"; // Redirect to admin page
                        } else {
                            window.location.href = "customer.html"; // Redirect to customer page
                        }
                    } else {
                        document.getElementById('responseMessage').textContent = 'Error logging in. Please try again.';
                    }
                } catch (error) {
                    document.getElementById('responseMessage').textContent = 'Network error. Please try again later.';
                }
            });
        }

        // Handle signup
        const signupForm = document.getElementById('signupForm');
        if (signupForm) {
            signupForm.addEventListener('submit', async function(event) {
                event.preventDefault();

                // Get email and password from signup form
                const email = document.getElementById('signupEmail').value;
                const password = document.getElementById('signupPassword').value;

                const checkApiUrl = 'https://firestore.googleapis.com/v1/projects/online-shopping-658a7/databases/(default)/documents/Customer';

                try {
                    // Fetch existing users
                    const response = await fetch(checkApiUrl);
                    const data = await response.json();

                    // Check if the email already exists
                    const existingAccount = data.documents && data.documents.some(doc => {
                        return doc.fields.email.stringValue === email;
                    });

                    if (existingAccount) {
                        document.getElementById('responseMessage').textContent = 'Email already exists. Please log in or use a different email.';
                        return;
                    }

                    // Prepare customer data for signup
                    const customerData = {
                        fields: {
                            email: { stringValue: email },
                            password: { stringValue: password }
                        }
                    };

                    // Send POST request to Firestore for signup
                    const signupResponse = await fetch(checkApiUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(customerData)
                    });

                    if (signupResponse.ok) {
                        document.getElementById('responseMessage').textContent = 'Signup successful! You can now log in.';
                        document.getElementById('signupForm').reset();
                    } else {
                        document.getElementById('responseMessage').textContent = 'Error signing up. Please try again.';
                    }
                } catch (error) {
                    document.getElementById('responseMessage').textContent = 'Network error. Please try again later.';
                }
            });
        }
    }

});




// URL of your Firebase inventory endpoint
const inventoryURL = 'https://firestore.googleapis.com/v1/projects/online-shopping-658a7/databases/(default)/documents/Inventory';

// Convert image to Base64 for uploading
function convertToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]); // Return Base64 without metadata
        reader.onerror = () => reject("Error converting file to Base64");
        reader.readAsDataURL(file);
    });
}


// Handle form submission for adding a product
$('#addProductForm').submit(function(event) {
    event.preventDefault();

    const title = $('#title').val();
    const description = $('#description').val();
    const quantity = parseInt($('#quantity').val());
    const price = parseFloat($('#price').val());
    const CategoryID = $('#categoryDropdown').val();
    const imageFile = $('#productImage')[0].files[0];
    const isActive = true; // Set isActive to true by default

    if (!CategoryID) {
        $('#responseMessage').text('Please select a category.');
        return;
    }

    // Fetch existing products to calculate the next ProductID
    $.ajax({
        url: inventoryURL,
        type: 'GET',
        success: function(response) {
            const products = response.documents || [];
            const nextProductId = products.length + 1;

            // Convert image to Base64
            convertToBase64(imageFile).then(base64Image => {
                // Prepare the new product data
                const newProductData = {
                    fields: {
                        ProductID: { integerValue: nextProductId },
                        CategoryID: { integerValue: parseInt(CategoryID) },
                        Title: { stringValue: title },
                        Description: { stringValue: description },
                        Quantity: { integerValue: quantity },
                        Price: { doubleValue: price },
                        Image: { stringValue: base64Image }, // Store Base64 encoded image
                        IsActive: { booleanValue: isActive } // Add isActive field
                    }
                };

                // Add the new product with auto-incremented ProductID
                const addProductURL = `${inventoryURL}/${nextProductId}`;
                $.ajax({
                    url: addProductURL,
                    type: 'PATCH',
                    contentType: 'application/json',
                    data: JSON.stringify(newProductData),
                    success: function(response) {
                        $('#responseMessage').text('Product added successfully!');
                        $('#addProductForm')[0].reset(); // Reset the form
                    },
                    error: function(xhr, status, error) {
                        $('#responseMessage').text('Error adding product: ' + xhr.responseText);
                    }
                });
            }).catch(err => {
                $('#responseMessage').text(err);
            });
        },
        error: function(xhr, status, error) {
            $('#responseMessage').text('Error fetching inventory: ' + xhr.responseText);
        }
    });
});




$(document).ready(function() {
    // Fetch categories from Firestore to populate the dropdown
    const categoryDropdownUrl = 'https://firestore.googleapis.com/v1/projects/online-shopping-658a7/databases/(default)/documents/Category';

    // Fetch categories from Firestore
    $.ajax({
        url: categoryDropdownUrl,
        type: 'GET',
        success: function(response) {
            const categories = response.documents || [];

            // Populate the dropdown with the retrieved categories
            const categoryDropdown = $('#categoryDropdown');
            categoryDropdown.empty(); // Clear any existing options
            categoryDropdown.append('<option value="">Select Category</option>'); // Default option

            categories.forEach(category => {
                const CategoryID = category.fields.CategoryID.integerValue;
                const categoryName = category.fields.categoryName.stringValue;
                categoryDropdown.append(`<option value="${CategoryID}">${categoryName}</option>`);
            });
        },
        error: function(xhr, status, error) {
            console.error('Error fetching categories:', xhr.responseText);
            $('#responseMessage').text('Error fetching categories. Please try again later.');
        }
    });

    // Existing code for handling category form submission
    $('#categoryForm').on('submit', function(event) {
        event.preventDefault(); // Prevent the form from submitting normally

        // Get the category name from the form
        var categoryName = $('#categoryName').val().trim();

        // Ensure the category name is not empty
        if (!categoryName) {
            $('#categoryResponseMessage').text('Please provide a category name.');
            return;
        }

        // Fetch the last used Category ID from Firestore
        var trackerUrl = `https://firestore.googleapis.com/v1/projects/online-shopping-658a7/databases/(default)/documents/meta/categoryIdTracker`;

        $.get(trackerUrl)
            .done(function(data) {
                var lastCategoryId = data.fields.lastCategoryId.integerValue; // Get the last used ID
                var newCategoryID = parseInt(lastCategoryId) + 1; // Increment the ID for the new category

                // Prepare the new category data
                var categoryData = {
                    fields: {
                        CategoryID: { integerValue: newCategoryID},
                        categoryName: { stringValue: categoryName }
                    }
                };

                // Firestore URL to store the new category
                var categoryUrl = `https://firestore.googleapis.com/v1/projects/online-shopping-658a7/databases/(default)/documents/Category/${newCategoryID}`;

                // Add the new category to Firestore
                $.ajax({
                    url: categoryUrl,
                    type: 'PATCH',
                    contentType: 'application/json',
                    data: JSON.stringify(categoryData),
                    success: function() {
                        // Update the lastCategoryId in Firestore after adding the category
                        var updateIdTrackerUrl = `https://firestore.googleapis.com/v1/projects/online-shopping-658a7/databases/(default)/documents/meta/categoryIdTracker?updateMask.fieldPaths=lastCategoryId`;
                        var updatedIdData = {
                            fields: {
                                lastCategoryId: { integerValue: newCategoryID }
                            }
                        };

                        $.ajax({
                            url: updateIdTrackerUrl,
                            type: 'PATCH',
                            contentType: 'application/json',
                            data: JSON.stringify(updatedIdData),
                            success: function() {
                                $('#categoryResponseMessage').text('Category added successfully!');
                                $('#categoryForm')[0].reset(); // Reset the form

                                // Update the category dropdown with the new category
                                $('#categoryDropdown').append(`<option value="${newCategoryID}">${categoryName}</option>`);
                            },
                            error: function(xhr) {
                                $('#categoryResponseMessage').text('Error updating Category ID tracker.');
                                console.error('Error updating ID tracker:', xhr.responseText);
                            }
                        });
                    },
                    error: function(xhr) {
                        $('#categoryResponseMessage').text('Failed to add category.');
                        console.error('Error adding category:', xhr.responseText);
                    }
                });
            })
            .fail(function(xhr) {
                $('#categoryResponseMessage').text('Failed to fetch category ID.');
                console.error('Error fetching last category ID:', xhr.responseText);
            });
    });
});









$(document).ready(function() {
    $('#categoryForm').on('submit', function(event) {
        event.preventDefault(); // Prevent the form from submitting normally

        // Get the category name from the form
        var categoryName = $('#categoryName').val().trim();

        // Ensure the category name is not empty
        if (!categoryName) {
            $('#categoryResponseMessage').text('Please provide a category name.');
            return;
        }

        // Fetch the last used Category ID from Firestore
        var trackerUrl = `https://firestore.googleapis.com/v1/projects/online-shopping-658a7/databases/(default)/documents/meta/categoryIdTracker`;

        $.get(trackerUrl)
            .done(function(data) {
                var lastCategoryId = data.fields.lastCategoryId.integerValue; // Get the last used ID
                var newCategoryId = parseInt(lastCategoryId) + 1; // Increment the ID for the new category

                // Prepare the new category data
                var categoryData = {
                    fields: {
                        CategoryID: { integerValue: newCategoryId },
                        categoryName: { stringValue: categoryName }
                    }
                };

                // Firestore URL to store the new category
                var categoryUrl = `https://firestore.googleapis.com/v1/projects/online-shopping-658a7/databases/(default)/documents/Category/${newCategoryId}`;

                // Add the new category to Firestore
                $.ajax({
                    url: categoryUrl,
                    type: 'PATCH',
                    contentType: 'application/json',
                    data: JSON.stringify(categoryData),
                    success: function() {
                        // Update the lastCategoryId in Firestore after adding the category
                        var updateIdTrackerUrl = `https://firestore.googleapis.com/v1/projects/online-shopping-658a7/databases/(default)/documents/meta/categoryIdTracker?updateMask.fieldPaths=lastCategoryId`;
                        var updatedIdData = {
                            fields: {
                                lastCategoryId: { integerValue: newCategoryId }
                            }
                        };

                        $.ajax({
                            url: updateIdTrackerUrl,
                            type: 'PATCH',
                            contentType: 'application/json',
                            data: JSON.stringify(updatedIdData),
                            success: function() {
                                $('#categoryResponseMessage').text('Category added successfully!');
                                $('#categoryForm')[0].reset(); // Reset the form
                            },
                            error: function(xhr) {
                                $('#categoryResponseMessage').text('Error updating Category ID tracker.');
                                console.error('Error updating ID tracker:', xhr.responseText);
                            }
                        });
                    },
                    error: function(xhr) {
                        $('#categoryResponseMessage').text('Failed to add category.');
                        console.error('Error adding category:', xhr.responseText);
                    }
                });
            })
            .fail(function(xhr) {
                $('#categoryResponseMessage').text('Failed to fetch category ID.');
                console.error('Error fetching last category ID:', xhr.responseText);
            });
    });
});












