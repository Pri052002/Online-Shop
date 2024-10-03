

let cart = []; 

// Function to fetch inventory data from Firestore
async function fetchInventory(isAdmin = false) {
    try {
        const response = await fetch('https://firestore.googleapis.com/v1/projects/online-shopping-658a7/databases/(default)/documents/Inventory');
        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${data.error.message}`);
        }

        if (!data.documents || data.documents.length === 0) {
            document.getElementById('inventoryList').innerText = 'No items found.';
            return;
        }

        displayInventory(data.documents, isAdmin);
    } catch (error) {
        console.error('Error fetching inventory:', error);
        document.getElementById('inventoryList').innerText = 'Error fetching inventory: ' + error.message;
    }
}



function displayInventory(items, isAdmin = false) {
    const inventoryList = document.getElementById('inventoryList');
    inventoryList.innerHTML = ''; // Clear existing items

    items.forEach(item => {
        const id = item.name.split('/').pop(); // Get the document ID
        const fields = item.fields;

        // Check if each field exists, and provide fallback values
        const cat_id = fields.CategoryID ? fields.CategoryID.stringValue : 'Unknown'; // Updated field name
        const title = fields.Title ? fields.Title.stringValue : 'No Title';
        const description = fields.Description ? fields.Description.stringValue : 'No Description';
        const quantity = fields.Quantity ? fields.Quantity.integerValue : 0;
        const price = fields.Price ? fields.Price.doubleValue : 0.0;
        const imageUrl = fields.Image ? fields.Image.stringValue : 'placeholder.jpg'; // Default placeholder image
        const isActive = fields.IsActive ? fields.IsActive.booleanValue : true; // Default to active

        // Create a row for each item
        const row = document.createElement('tr');
        row.classList.add('item');

        row.innerHTML = `
            <td>${id}</td>
            <td>${cat_id}</td> <!-- Display correct cat_id -->
            <td>${title}</td>
            <td>${description}</td>
            <td>${quantity}</td>
            <td>$${price.toFixed(2)}</td>
            <td><img src="${imageUrl}" alt="${title}" width="100"></td>
            <td>
                <button class="${isActive ? 'deactivate' : 'activate'}" onclick="toggleItemStatus('${id}', ${isActive})">
                    ${isActive ? 'Deactivate' : 'Activate'}
                </button>
            </td>
        `;

        // Display items based on whether the user is an admin or customer
        if (isAdmin || isActive) {
            inventoryList.appendChild(row);
        }
    });
}


// Function to toggle item status (activate or deactivate)
async function toggleItemStatus(itemId, isActive) {
    const newStatus = !isActive; // Toggle the active status
    const updateUrl = ` https://firestore.googleapis.com/v1/projects/online-shopping-658a7/databases/(default)/documents/Inventory/${itemId}?updateMask.fieldPaths=IsActive`;

    try {
        const response = await fetch(updateUrl, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fields: { IsActive: { booleanValue: newStatus } } })
        });

        if (response.ok) {
            // Re-fetch and update the inventory list after toggling the status
            fetchInventory(true); // Pass `true` to display both active and deactivated items for the admin
        } else {
            const errorData = await response.json();
            throw new Error(`Error ${response.status}: ${errorData.error.message}`);
        }
    } catch (error) {
        console.error('Error toggling item status:', error);
        alert('Failed to update item status.');
    }
}

// Function to add an item to the cart
function addToCart(itemId) {
    const item = cart.find(i => i.id === itemId);
    if (item) {
        item.quantity += 1; // Increment quantity if item already in cart
    } else {
        cart.push({ id: itemId, quantity: 1 }); // Add new item to cart
    }
    updateCartDisplay();
}

// Function to update the cart display
function updateCartDisplay() {
    const cartContainer = document.getElementById('cart');
    cartContainer.innerHTML = ''; // Clear existing cart

    cart.forEach(item => {
        const cartItemDiv = document.createElement('div');
        cartItemDiv.innerText = `Item ID: ${item.id}, Quantity: ${item.quantity}`;
        cartContainer.appendChild(cartItemDiv);
    });
}

// Call fetchInventory when the page loads for the customer (only active items)
fetchInventory(false); // 