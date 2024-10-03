let cart = JSON.parse(sessionStorage.getItem('cart')) || []; // Retrieve cart from session storage
let currentPage = 1;
const itemsPerPage = 10; // Number of items to display per page
let allItems = []; // Store all items fetched from Firestore

// Function to fetch inventory data from Firestore
async function fetchInventory(isAdmin = false) {
    try {
        const response = await fetch(` https://firestore.googleapis.com/v1/projects/online-shopping-658a7/databases/(default)/documents/Inventory`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${data.error.message}`);
        }

        if (!data.documents || data.documents.length === 0) {
            document.getElementById('inventoryList').innerText = 'No items found.';
            return;
        }

        allItems = data.documents; // Store all items for pagination
        displayInventory(allItems, isAdmin);
    } catch (error) {
        console.error('Error fetching inventory:', error);
        document.getElementById('inventoryList').innerText = 'Error fetching inventory: ' + error.message;
    }
}

// Function to display inventory items
function displayInventory(items, isAdmin = false) {
    const inventoryList = document.getElementById('inventoryList');
    inventoryList.innerHTML = ''; // Clear existing items

    // Arrays to hold limited stock and regular stock items
    const limitedStockItems = [];
    const regularStockItems = [];

    items.forEach(item => {
        const id = item.name.split('/').pop(); // Get the document ID
        const fields = item.fields;

        // Check if the item is active
        const isActive = fields.IsActive ? fields.IsActive.booleanValue : true; // Default to active

        // If not an admin and the item is inactive, skip rendering it
        if (!isAdmin && !isActive) {
            return;
        }

        // Get the quantity of the item
        const quantity = fields.Quantity ? fields.Quantity.integerValue : 0;

        // Check if the item has limited stock (quantity < 20)
        if (quantity > 0 && quantity < 20) {
            limitedStockItems.push(item);
        } else {
            regularStockItems.push(item);
        }
    });

    // Display limited stock items first
    if (limitedStockItems.length > 0) {
        const limitedStockHeader = document.createElement('h2');
        limitedStockHeader.innerText = 'Limited Stock: Apply Soon!';
        limitedStockHeader.classList.add('limited-stock-header'); // Add a class for styling
        inventoryList.appendChild(limitedStockHeader);

        limitedStockItems.forEach(item => {
            const itemCard = createItemCard(item);
            inventoryList.appendChild(itemCard);
        });
    }

    // Add a horizontal line to separate limited stock from other items
    if (limitedStockItems.length > 0 && regularStockItems.length > 0) {
        const separator = document.createElement('hr');
        inventoryList.appendChild(separator); // Add the line
    }

    // Display other items
    if (regularStockItems.length > 0) {
        const regularStockHeader = document.createElement('h2');
        regularStockHeader.innerText = 'All Products';
        inventoryList.appendChild(regularStockHeader);

        regularStockItems.forEach(item => {
            const itemCard = createItemCard(item);
            inventoryList.appendChild(itemCard);
        });
    }

    // Update pagination button visibility
    updatePaginationButtons(items.length);
}

// Function to create item cards
const createItemCard = (item) => {
    const id = item.name.split('/').pop(); // Get the document ID
    const fields = item.fields;

    const quantity = fields.Quantity ? fields.Quantity.integerValue : 0;

    // Create an item card
    const itemDiv = document.createElement('div');
    itemDiv.classList.add('item-container'); // Add class for container styling

    // Create image element if exists
    const img = document.createElement('img');
    img.src = fields.ImageUrl ? fields.ImageUrl.stringValue : 'placeholder.jpg'; // Default placeholder image
    img.alt = fields.Title ? fields.Title.stringValue : 'No Title';
    itemDiv.appendChild(img);

    // Create other item details
    itemDiv.innerHTML += `<h3>${fields.Title ? fields.Title.stringValue : 'No Title'}</h3>`;
    itemDiv.innerHTML += `<p>${fields.Description ? fields.Description.stringValue : 'No Description'}</p>`;
    itemDiv.innerHTML += `<p>Price: $${fields.Price ? fields.Price.doubleValue.toFixed(2) : '0.00'}</p>`;

    // Check quantity and display accordingly
    if (quantity > 0) {
        // Create "Add to Cart" button if the item is in stock
        const addToCartButton = document.createElement('button');
        addToCartButton.classList.add('add-to-cart');
        addToCartButton.innerText = 'Add to Cart';
        addToCartButton.onclick = () => {
            addToCart(id, fields.Title.stringValue, fields.Price.doubleValue, fields.ImageUrl ? fields.ImageUrl.stringValue : 'placeholder.jpg'); // Pass document ID and other details to add to cart
        };
        itemDiv.appendChild(addToCartButton);

        // Create "Buy Now" button
        const buyNowButton = document.createElement('button');
        buyNowButton.classList.add('buy-now');
        buyNowButton.innerText = 'Buy Now';
        buyNowButton.onclick = () => {
            buyNow(id, fields.Title.stringValue, fields.Price.doubleValue, fields.ImageUrl ? fields.ImageUrl.stringValue : 'placeholder.jpg'); // Pass document ID and other details to buy
        };
        itemDiv.appendChild(buyNowButton);
    } else {
        // Display "Out of Stock" message if the item is not in stock
        const outOfStockMessage = document.createElement('p');
        outOfStockMessage.innerText = 'Out of Stock';
        outOfStockMessage.classList.add('out-of-stock');
        itemDiv.appendChild(outOfStockMessage);
    }

    return itemDiv;
};

// Update pagination button visibility based on the total number of items
const updatePaginationButtons = (totalItems) => {
    document.getElementById('prevPageBtn').style.display = currentPage === 1 ? 'none' : 'inline-block';
    document.getElementById('nextPageBtn').style.display = (currentPage * itemsPerPage >= totalItems) ? 'none' : 'inline-block';
};

// Add event listeners for pagination buttons
document.getElementById('prevPageBtn').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        displayInventory(allItems); // Pass all items to display
    }
});

document.getElementById('nextPageBtn').addEventListener('click', () => {
    if (currentPage * itemsPerPage < allItems.length) {
        currentPage++;
        displayInventory(allItems); // Pass all items to display
    }
});

// Function to add items to the cart
async function addToCart(itemId, title, price, imageUrl) {
    // Check if the cart is already in session storage
    let cart = JSON.parse(sessionStorage.getItem('cart')) || []; // Retrieve existing cart from session storage

    const item = cart.find(i => i.id === itemId);
    if (item) {
        item.quantity += 1; // Increment quantity if item already in cart
    } else {
        cart.push({ id: itemId, title: title, price: price, quantity: 1, imageUrl: imageUrl }); // Add new item to cart
    }

    // Save updated cart to session storage
    sessionStorage.setItem('cart', JSON.stringify(cart));

    // Optionally notify the user
    alert(`${title} has been added to your cart!`); // Notify user about adding to cart
}

// Function to handle buying the item
async function buyNow(itemId, title, price, imageUrl) {
    // Check if the cart is already in session storage
    let cart = JSON.parse(sessionStorage.getItem('cart')) || []; // Retrieve existing cart from session storage

    const item = cart.find(i => i.id === itemId);
    if (item) {
        item.quantity += 1; // Increment quantity if item already in cart
    } else {
        cart.push({ id: itemId, title: title, price: price, quantity: 1, imageUrl: imageUrl }); // Add new item to cart
    }

    // Save updated cart to session storage
    sessionStorage.setItem('cart', JSON.stringify(cart));

    // Redirect to checkout.html
    window.location.href = 'cart.html'; // Redirect to the checkout page
}

// Call fetchInventory when the page loads for the customer (only active items)
fetchInventory(false); 