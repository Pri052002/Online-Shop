const inventoryURL = 'https://firestore.googleapis.com/v1/projects/online-shopping-658a7/databases/(default)/documents/Inventory';
let allProducts = [];
let currentPage = 1;
const productsPerPage = 9; // 9 products per page

$(document).ready(function () {
    fetchProducts();
    setupPagination();

    // Search functionality
    $('#searchButton').on('click', function () {
        const searchTerm = $('#searchInput').val().toLowerCase();
        const filteredProducts = allProducts.filter(product => {
            const title = product.fields.Title.stringValue.toLowerCase();
            return title.includes(searchTerm);
        });
        displayProducts(filteredProducts);
    });

    
    // Add to Cart functionality
    $(document).on('click', '.add-to-cart', function () {
        const productTitle = $(this).data('title');

        
        // Get cart from localStorage or initialize an empty array if no cart exists
        let cart = JSON.parse(localStorage.getItem('cart')) || [];

        // Find if product is already in cart
        const existingProduct = cart.find(item => item.title === productTitle);
        if (existingProduct) {
            existingProduct.quantity += 1; // Increase quantity if already in cart
        } else {
            // Find product details from allProducts
            const product = allProducts.find(product => product.fields.Title.stringValue === productTitle);
            const price = product.fields.Price.doubleValue;
            const image = product.fields.Image.stringValue;
            
            // Add new product to cart
            cart.push({
                title: productTitle,
                quantity: 1,
                price: price,
                image: image
            });
        }

        // Save updated cart to localStorage
        localStorage.setItem('cart', JSON.stringify(cart));

        // Redirect to cart.html
        window.location.href = 'cart.html';
    });
});

// Buy Now functionality
$(document).on('click', '.buy-now', function () {
    const productTitle = $(this).data('title');

    // Get cart from localStorage or initialize an empty array if no cart exists
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    // Find if product is already in cart
    const existingProduct = cart.find(item => item.title === productTitle);
    if (existingProduct) {
        existingProduct.quantity += 1; // Increase quantity if already in cart
    } else {
        // Find product details from allProducts
        const product = allProducts.find(product => product.fields.Title.stringValue === productTitle);
        const price = product.fields.Price.doubleValue;
        const imageUrl = product.fields.Image.stringValue; // Use the image URL directly

        // Add new product to cart
        cart.push({
            title: productTitle,
            quantity: 1,
            price: price,
            image: imageUrl
        });
    }

    // Save updated cart to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));

    // Redirect to cart.html after adding to cart
    window.location.href = 'cart.html';
});



// Fetch Products
async function fetchProducts() {
    try {
        const response = await fetch(inventoryURL);
        const data = await response.json();
        allProducts = data.documents || [];
        displayProducts(allProducts);
    } catch (error) {
        console.error('Error fetching products:', error);
        $('#responseMessage').text('Failed to load products. Please try again later.');
    }
}

// Display Products
function displayProducts(products) {
    const productList = $('#productList');
    productList.empty(); // Clear previous entries

    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = Math.min(startIndex + productsPerPage, products.length);
    const currentProducts = products.slice(startIndex, endIndex);

    currentProducts.forEach(product => {
        const fields = product.fields;
        const title = fields.Title.stringValue;
        const description = fields.Description.stringValue;
        const quantity = fields.Quantity.integerValue;
        const price = fields.Price.doubleValue;
        const image = fields.Image.stringValue;

        // Create a product card
        const productCard = `
            <div class="product-card">
                <img src="data:image/jpeg;base64,${image}" alt="${title}">
                <h2>${title}</h2>
                <p>${description}</p>
                
                <p>Price: $${price.toFixed(2)}</p>
                <div class="product-buttons">
                    <button class="add-to-cart" data-title="${title}">Add to Cart</button>
                    
                    <button class="buy-now" data-title="${title}">Buy Now</button>
                </div>
            </div>
        `;
        productList.append(productCard);
    });

    // Update pagination
    $('#currentPage').text(`Page ${currentPage}`);
    $('#prevPage').prop('disabled', currentPage === 1);
    $('#nextPage').prop('disabled', endIndex >= products.length);
}

// Pagination Setup
function setupPagination() {
    $('#prevPage').on('click', function () {
        if (currentPage > 1) {
            currentPage--;
            displayProducts(allProducts);
        }
    });

    $('#nextPage').on('click', function () {
        if ((currentPage * productsPerPage) < allProducts.length) {
            currentPage++;
            displayProducts(allProducts);
        }
    });
}
