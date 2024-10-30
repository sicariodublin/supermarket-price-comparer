import React, { useEffect, useState } from 'react';

function EditProductForm({ product }) {
    const [updatedProduct, setUpdatedProduct] = useState(product);

    useEffect(() => {
        setUpdatedProduct(product);
    }, [product]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        await fetch(`/api/products/${updatedProduct.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedProduct)
        });
    };

    return (
        <form onSubmit={handleUpdate}>
            <h3>Edit Product</h3>
            <input
                type="text"
                value={updatedProduct.name}
                onChange={(e) => setUpdatedProduct({ ...updatedProduct, name: e.target.value })}
            />
            {/* Add other input fields similarly */}
            <button type="submit">Update Product</button>
        </form>
    );
}

export default EditProductForm;
