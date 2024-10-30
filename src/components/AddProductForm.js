import React, { useState } from 'react';

function AddProductForm() {
    const [product, setProduct] = useState({
        name: '',
        quantity: '',
        unit: '',
        price: '',
        supermarket_id: '',
        product_date: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        // API call to add product
        await fetch('/api/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(product)
        });
    };

    return (
        <form onSubmit={handleSubmit}>
            <h3>Add New Product</h3>
            <input type="text" placeholder="Product Name" onChange={(e) => setProduct({ ...product, name: e.target.value })} />
            {/* Add other input fields similarly */}
            <button type="submit">Save Product</button>
        </form>
    );
}

export default AddProductForm;
