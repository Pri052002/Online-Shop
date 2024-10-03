const cartURL = 'https://firestore.googleapis.com/v1/projects/online-shopping-658a7/databases/(default)/documents/Cart';
const inventoryURL = 'https://firestore.googleapis.com/v1/projects/online-shopping-658a7/databases/(default)/documents/Inventory';

$(document).ready(function () {
    displayCart();

    // Function to display cart items
    function displayCart() {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const cartTableBody = $('#cartTable tbody');
        let cartTotal = 0;

        // Clear existing cart data
        cartTableBody.empty();

        // Check if the cart is empty and display "Your cart is empty" message
        if (cart.length === 0) {
            cartTableBody.append('<tr><td colspan="6">Your cart is empty</td></tr>');
            $('#cartTotal').text('0.00');
            return; // Exit the function if the cart is empty
        }

        // Display each product in the cart if not empty
        cart.forEach((item, index) => {
            const subtotal = item.price * item.quantity;
            cartTotal += subtotal;

            const cartRow = `
                <tr>
                    <td>${item.title}</td>
                    <td><img src="data:image/jpeg;base64,${item.image}" alt="${item.title}" class="cart-image"></td>
                    <td>$${item.price.toFixed(2)}</td>
                    <td>
                        <input type="number" min="1" value="${item.quantity}" class="cart-quantity" data-index="${index}">
                    </td>
                    <td>$${subtotal.toFixed(2)}</td>
                    <td><button class="remove-item" data-index="${index}">Remove</button></td>
                </tr>
            `;
            cartTableBody.append(cartRow);
        });

        // Update total
        $('#cartTotal').text(cartTotal.toFixed(2));

        // Event listener for quantity change
        $('.cart-quantity').on('change', function () {
            const index = $(this).data('index');
            const newQuantity = parseInt($(this).val());

            if (newQuantity > 0) {
                updateQuantity(index, newQuantity);
            }
        });

        // Event listener for removing item
        $('.remove-item').on('click', function () {
            const index = $(this).data('index');
            removeItem(index);
        });
    }

    // Function to update quantity in the cart
    function updateQuantity(index, newQuantity) {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        cart[index].quantity = newQuantity;

        localStorage.setItem('cart', JSON.stringify(cart));
        displayCart();
    }

    // Function to remove an item from the cart
    function removeItem(index) {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        cart.splice(index, 1);

        localStorage.setItem('cart', JSON.stringify(cart));
        displayCart();
    }

    $('#checkoutButton').on('click', function () {
        window.location.href = 'checkout.html'; // Navigate to the checkout page
    });

    // Buy button click event
    $('#buyButton').on('click', function () {
        window.location.href = 'cart.html'; // Redirect to the cart page when Buy button is clicked
    });
});

// Second part: Fetching cart items from Firestore

$(document).ready(function () {
    fetchCartItems();

    // Function to fetch cart items from Firestore
    async function fetchCartItems() {
        try {
            const response = await fetch(cartURL);
            const data = await response.json();
            const cartItems = data.documents || [];
            displayCartItems(cartItems);
        } catch (error) {
            console.error('Error fetching cart items:', error);
            $('#cartItems').text('Failed to load cart items. Please try again later.');
        }
    }

    // Function to display cart items with quantity controls and stock validation
    async function displayCartItems(cartItems) {
        const cartItemsContainer = $('#cartItems');
        cartItemsContainer.empty(); // Clear any existing items

        // Check if Firestore cart is empty
        if (cartItems.length === 0) {
            cartItemsContainer.append('<p>Your cart is empty</p>');
            $('#totalQuantity').text('0');
            $('#totalPrice').text('0.00');
            return; // Exit if no items
        }

        let totalQuantity = 0;
        let totalPrice = 0;

        for (const item of cartItems) {
            const fields = item.fields;
            const title = fields.Title.stringValue;
            const price = fields.Price.doubleValue;
            const quantity = fields.Quantity.integerValue;
            totalQuantity += quantity;
            totalPrice += price * quantity;

            // Fetch inventory data to compare quantities
            const inventoryData = await fetchProductData(title);
            let stockMessage = '';
            let availableQuantity = 0;

            if (inventoryData) {
                availableQuantity = inventoryData.fields.Quantity;
                if (quantity > availableQuantity) {
                    stockMessage = `<span class="out-of-stock">Out of stock (Only ${availableQuantity} available)</span>`;
                }
            } else {
                stockMessage = `<span class="out-of-stock">Inventory data not available</span>`;
            }

            // Create the cart item card with quantity controls
            const cartItemCard = `
                <div class="cart-item">
                    <h3>${title} ${stockMessage}</h3>
                    <p>Price: $${price.toFixed(2)}</p>
                    <p>
                        <button class="decrease-quantity" data-title="${title}">-</button>
                        <input type="number" class="quantity-input" data-title="${title}" value="${quantity}" min="1" max="${availableQuantity}">
                        <button class="increase-quantity" data-title="${title}">+</button>
                    </p>
                    <p>Total: $${(price * quantity).toFixed(2)}</p>
                </div>
            `;
            cartItemsContainer.append(cartItemCard);
        }

        // Update the cart summary
        $('#totalQuantity').text(totalQuantity);
        $('#totalPrice').text(totalPrice.toFixed(2));

        // Attach event listeners for quantity controls
        attachQuantityChangeHandlers();
    }

    // Function to attach event listeners to quantity buttons and input fields
    function attachQuantityChangeHandlers() {
        // Handle quantity increase
        $('.increase-quantity').on('click', async function () {
            const title = $(this).data('title');
            const inputField = $(`input[data-title="${title}"]`);
            let currentQuantity = parseInt(inputField.val());

            const inventoryData = await fetchProductData(title);
            if (inventoryData) {
                const availableQuantity = inventoryData.fields.Quantity;
                if (currentQuantity < availableQuantity) {
                    currentQuantity++;
                    inputField.val(currentQuantity);
                    updateCartItem(title, currentQuantity);
                } else {
                    alert(`Cannot add more than ${availableQuantity} units of ${title}.`);
                }
            }
        });

        // Handle quantity decrease
        $('.decrease-quantity').on('click', function () {
            const title = $(this).data('title');
            const inputField = $(`input[data-title="${title}"]`);
            let currentQuantity = parseInt(inputField.val());

            if (currentQuantity > 1) {
                currentQuantity--;
                inputField.val(currentQuantity);
                updateCartItem(title, currentQuantity);
            }
        });

        // Handle manual quantity input changes
        $('.quantity-input').on('change', async function () {
            const title = $(this).data('title');
            let currentQuantity = parseInt($(this).val());

            const inventoryData = await fetchProductData(title);
            if (inventoryData) {
                const availableQuantity = inventoryData.fields.Quantity;
                if (currentQuantity > availableQuantity) {
                    alert(`Only ${availableQuantity} units of ${title} are available.`);
                    $(this).val(availableQuantity); // Set to the maximum available quantity
                } else if (currentQuantity < 1) {
                    $(this).val(1); // Minimum quantity is 1
                }
                updateCartItem(title, currentQuantity);
            }
        });
    }

    // Function to update the cart with new quantity
    function updateCartItem(title, newQuantity) {
        let cartItems = JSON.parse(localStorage.getItem('cart')) || [];
        cartItems = cartItems.map(item => {
            if (item.fields.Title.stringValue === title) {
                item.fields.Quantity.integerValue = newQuantity;
            }
            return item;
        });
        localStorage.setItem('cart', JSON.stringify(cartItems));
        fetchCartItems(); // Refresh the cart display
    }

    // Function to fetch product data from the inventory
    async function fetchProductData(title) {
        try {
            const response = await fetch(inventoryURL);
            const data = await response.json();

            // Find the product by title
            const product = data.documents.find(doc => doc.fields.Title.stringValue === title);
            if (product) {
                return {
                    fields: {
                        Title: product.fields.Title.stringValue,
                        Quantity: parseInt(product.fields.Quantity.integerValue),
                        Price: parseFloat(product.fields.Price.doubleValue),
                    }
                };
            }
        } catch (error) {
            console.error('Error fetching product data:', error);
            return null;
        }
    }
});
