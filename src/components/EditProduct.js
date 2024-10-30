import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

function EditProduct() {
    const { id } = useParams();
    const [productData, setProductData] = useState({
        name: '',
        quantity: '',
        unit: 'un',
        price: '',
        supermarket_id: '',
        product_date: ''
    });

    useEffect(() => {
        fetch(`/api/products/${id}`)
            .then((response) => response.json())
            .then((data) => setProductData(data));
    }, [id]);

    const handleChange = (e) => {
        setProductData({ ...productData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        fetch(`/api/products/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(productData),
        })
        .then((response) => response.json())
        .then((data) => {
            alert('Product updated successfully');
        });
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2>Edit Product</h2>
            <input name="name" placeholder="Product Name" value={productData.name} onChange={handleChange} />
            <input name="quantity" placeholder="Quantity" value={productData.quantity} onChange={handleChange} />
            <select name="unit" value={productData.unit} onChange={handleChange}>
                <option value="un">un</option>
                <option value="kg">kg</option>
                <option value="lt">lt</option>
                <option value="mm">mm</option>
            </select>
            <input name="price" placeholder="Price" value={productData.price} onChange={handleChange} />
            <input name="supermarket_id" placeholder="Supermarket ID" value={productData.supermarket_id} onChange={handleChange} />
            <input type="date" name="product_date" value={productData.product_date} onChange={handleChange} />
            <button type="submit">Update Product</button>
        </form>
    );
}

export default EditProduct;
