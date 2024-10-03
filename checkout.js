const inventoryURL = 'https://firestore.googleapis.com/v1/projects/online-shopping-658a7/databases/(default)/documents/Inventory';

$(document).ready(function () {
    displayCartItems();

    // Function to display cart items
    async function displayCartItems() {
        const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
        const orderSummaryTable = $('#orderSummaryTable tbody');
        orderSummaryTable.empty(); // Clear existing entries

        let totalPrice = 0;

        for (const item of cartItems) {
            const { title, quantity, price, image } = item;

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

            // Add Base64 format prefix if not present
            const imageSrc = image.startsWith('data:image') ? image : `data:image/jpeg;base64,${image}`;

            // Create a table row for each item
            const row = `
                <tr>
                    <td>${title} ${stockMessage}</td>
                    <td><img src="${imageSrc}" alt="${title}" class="cart-image"></td>
                    <td>$${price.toFixed(2)}</td>
                    <td>
                        <button class="decrease-quantity" data-title="${title}">-</button>
                        <input type="number" class="quantity-input" data-title="${title}" value="${quantity}" min="1" max="${availableQuantity}">
                        <button class="increase-quantity" data-title="${title}">+</button>
                    </td>
                    <td>$${(price * quantity).toFixed(2)}</td>
                </tr>
            `;
            orderSummaryTable.append(row);

            totalPrice += price * quantity; // Calculate total price
        }

        // Display total price
        $('#orderTotal').text(totalPrice.toFixed(2));

        // Attach event listeners to quantity buttons and input fields
        attachQuantityChangeHandlers();
    }

    // Function to attach event listeners to the quantity buttons and input fields
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
            if (item.title === title) {
                item.quantity = newQuantity;
            }
            return item;
        });
        localStorage.setItem('cart', JSON.stringify(cartItems));
        displayCartItems(); // Refresh the cart display
    }

    // Function to handle placing the order
    $('#billingForm').on('submit', async function (e) {
        e.preventDefault(); // Prevent form submission

        // Validate form data
        const fullName = $('#fullName').val();
        const mobile = $('#mobile').val();
        const address = $('#address').val();
        const paymentMethod = $('input[name="paymentMethod"]:checked').val();

        if (!fullName || !mobile || !address || !paymentMethod) {
            alert('Please fill out all fields.');
            return;
        }

        // Proceed to final validation before placing the order
        const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
        const outOfStockItems = [];

        for (const item of cartItems) {
            const { title, quantity } = item;

            // Fetch product data from inventory
            const inventoryData = await fetchProductData(title);
            if (inventoryData) {
                const availableQuantity = inventoryData.fields.Quantity;
                if (quantity > availableQuantity) {
                    outOfStockItems.push(`${title} (Available: ${availableQuantity})`);
                }
            } else {
                alert(`Could not retrieve inventory information for ${title}.`);
                return; // Stop checkout if there's an error
            }
        }

        // Alert user if any items are out of stock
        if (outOfStockItems.length > 0) {
            alert(`The following items are out of stock or exceed available quantity:\n- ${outOfStockItems.join('\n- ')}`);
            return; // Stop the order process if any items are out of stock
        }

        // Simulate order processing
        alert(`Order placed successfully! Thank you, ${fullName}. Your order will be delivered to ${address}.`);

        // Clear the cart and navigate to the thank you page
        localStorage.removeItem('cart');
        window.location.href = 'thankyou.html';
    });

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
                        Image: product.fields.Image.stringValue // Base64 string for the image
                    }
                };
            } else {
                console.error(`Product ${title} not found in inventory.`);
                return null; // Return null if product not found
            }
        } catch (error) {
            console.error('Error fetching product data:', error);
            return null; // Return null if there's an error
        }
    }
});
