$(document).ready(function () {
    const inventoryURL = 'https://firestore.googleapis.com/v1/projects/online-shopping-658a7/databases/(default)/documents/Inventory';
    const categoryURL = 'https://firestore.googleapis.com/v1/projects/online-shopping-658a7/databases/(default)/documents/Category';

    let allProducts = [];
    let allCategories = [];
    let currentPage = 1;
    const productsPerPage = 5;

    // Fetch Products from Firestore
    async function fetchProducts() {
        try {
            const response = await fetch(inventoryURL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            allProducts = data.documents || [];
            console.log('Fetched Products:', allProducts); // Debugging log
            if (allProducts.length > 0) {
                await fetchCategories(); // Fetch categories after fetching products
                displayProducts(allProducts); // Display all products initially
            } else {
                $('#responseMessage').text('No products found.');
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            $('#responseMessage').text('Error fetching products. Please try again later.');
        }
    }

    // Fetch Categories from Firestore
    async function fetchCategories() {
        try {
            const response = await fetch(categoryURL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            populateCategories(data.documents);
        } catch (error) {
            console.error('Error fetching categories:', error);
            $('#responseMessage').text('Error fetching categories. Please try again later.');
        }
    }

    // Populate Category Dropdown
    function populateCategories(categories) {
        allCategories = categories; // Store all categories for filtering
        const categorySelect = $('#categorySelect');
        categorySelect.empty(); // Clear existing options
        categorySelect.append('<option value="all">All Categories</option>'); // Add default option

        categories.forEach(category => {
            const name = category.fields?.categoryName?.stringValue; // Access categoryName
            const id = category.fields?.CategoryID?.integerValue; // Access categoryId as integer

            if (name && id !== undefined) { // Check if id is not undefined
                categorySelect.append(`<option value="${id}">${id}-${name}</option>`); // Use category ID as value
            } else {
                console.warn('Category is missing required fields:', category);
            }
        });
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

            // Create a table row for each product
            const productRow = `
                <tr>
                    <td>${title}</td>
                    <td>${description}</td>
                    <td>${quantity}</td>
                    <td>$${price.toFixed(2)}</td>
                    <td>${image ? `<img src="data:image/jpeg;base64,${image}" alt="${title}">` : 'No image'}</td>
                </tr>
            `;
            productList.append(productRow);
        });

        // Update pagination
        $('#currentPage').text(`Page ${currentPage}`);
        $('#prevPage').prop('disabled', currentPage === 1);
        $('#nextPage').prop('disabled', endIndex >= products.length);
    }

    // Pagination Handlers
    $('#prevPage').on('click', () => {
        if (currentPage > 1) {
            currentPage--;
            filterAndDisplayProductsByCategoryId($('#categorySelect').val()); // Pass selected category ID
        }
    });

    $('#nextPage').on('click', () => {
        if (currentPage * productsPerPage < allProducts.length) {
            currentPage++;
            filterAndDisplayProductsByCategoryId($('#categorySelect').val()); // Pass selected category ID
        }
    });

    // Handle Category Selection and Fetch Products Based on Category
    $('#categorySelect').on('change', async function () {
        const selectedCategoryId = $(this).val(); // Get selected category ID
        if (selectedCategoryId === 'all') {
            currentPage = 1; // Reset to first page for all products
            displayProducts(allProducts);  // Call function to display all products
        } else {
            // Fetch the selected category from the Category endpoint
            const categoryData = await fetchCategoryById(selectedCategoryId);
            if (categoryData) {
                // Once we have the category, fetch the inventory and filter products
                filterAndDisplayProductsByCategoryId(selectedCategoryId); // Use correct function
            }
        }
    });

    // Fetch a specific category by its ID
    async function fetchCategoryById(categoryId) {
        try {
            const response = await fetch(`${categoryURL}/${categoryId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const categoryData = await response.json();
            console.log('Fetched Category:', categoryData); // Debugging log
            return categoryData;
        } catch (error) {
            console.error(`Error fetching category ${categoryId}:`, error);
            $('#responseMessage').text(`Error fetching category. Please try again later.`);
            return null;
        }
    }

    // Filter and Display Products Based on Category ID
    async function filterAndDisplayProductsByCategoryId(selectedCategoryId) {
        console.log(selectedCategoryId);
        try {
            const filteredProducts = allProducts.filter(product => {
                const categoryId = product.fields.CategoryID?.integerValue; // Access CategoryID in uppercase
                console.log('Comparing:', categoryId, 'with selected:', selectedCategoryId); // Debugging log
                // return categoryId && categoryId === parseInt(selectedCategoryId); // Filter by selected category ID
                return categoryId && categoryId === selectedCategoryId; // Filter by selected category ID
            });
          

            if (filteredProducts.length === 0) {
                $('#responseMessage').text('No products found for this category.');
            } else {
                displayProducts(filteredProducts); // Display the filtered products
            }
        } catch (error) {
            console.error('Error filtering products:', error);
            $('#responseMessage').text('Error displaying products. Please try again later.');
        }
    }

    fetchProducts(); // Initial fetch on page load
});

















const inventoryURL = 'https://firestore.googleapis.com/v1/projects/online-shopping-658a7/databases/(default)/documents/Inventory';
const categoryURL = 'https://firestore.googleapis.com/v1/projects/online-shopping-658a7/databases/(default)/documents/Category';

let allProducts = [];
let currentPage = 1;
const productsPerPage = 9; // Display 9 products per page

$(document).ready(function () {
    fetchProducts();
    setupPagination();
    $('#searchButton').on('click', function () {
        const searchTerm = $('#searchInput').val().toLowerCase();
        const filteredProducts = allProducts.filter(product => {
            const title = product.fields.Title.stringValue.toLowerCase();
            return title.includes(searchTerm);
        });
        displayProducts(filteredProducts);
    });
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

        // Create a product card for each product
        const productCard = `
            <div class="product-card">
                <img src="data:image/jpeg;base64,${image}" alt="${title}">
                <h2>${title}</h2>
                <p>${description}</p>
                <p>Quantity: ${quantity}</p>
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
