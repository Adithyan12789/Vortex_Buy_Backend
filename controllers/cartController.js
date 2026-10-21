const Cart = require('../models/Cart');

// Helper to find or merge cart for user/guest
const resolveCart = async (userId, guestId) => {
    let cart = null;
    if (userId) {
        cart = await Cart.findOne({ user: userId });
        // If guest cart exists, merge it into the user cart
        if (guestId) {
            const guestCart = await Cart.findOne({ guestId });
            if (guestCart && guestCart.lineItems && guestCart.lineItems.length > 0) {
                if (!cart) {
                    cart = guestCart;
                    cart.user = userId;
                    cart.guestId = null;
                    await cart.save();
                } else {
                    for (const gItem of guestCart.lineItems) {
                        if (!gItem.productId) continue;
                        const existing = cart.lineItems.find(
                            p => p.productId && p.productId.toString() === gItem.productId.toString()
                        );
                        if (existing) {
                            existing.quantity += gItem.quantity;
                        } else {
                            cart.lineItems.push(gItem);
                        }
                    }
                    await cart.save();
                    await Cart.deleteOne({ _id: guestCart._id });
                }
            }
        }
    } else if (guestId) {
        cart = await Cart.findOne({ guestId });
    }
    return cart;
};

// Clean orphaned/deleted products from cart line items
const sanitizeCart = async (cart) => {
    if (!cart) return null;
    const populated = await Cart.findById(cart._id).populate('lineItems.productId');
    if (!populated) return null;

    const validItems = populated.lineItems.filter(item => item.productId != null);
    if (validItems.length !== populated.lineItems.length) {
        cart.lineItems = cart.lineItems.filter(item => {
            return validItems.some(v => v._id.toString() === item._id.toString());
        });
        await cart.save();
        return await Cart.findById(cart._id).populate('lineItems.productId');
    }
    return populated;
};

exports.getCart = async (req, res) => {
    try {
        const guestId = req.query.guestId;
        const userId = req.user ? req.user.id : null;

        const cart = await resolveCart(userId, guestId);
        if (!cart) {
            return res.json({ lineItems: [], subtotal: { amount: 0 } });
        }

        const sanitized = await sanitizeCart(cart);
        res.json(sanitized || { lineItems: [], subtotal: { amount: 0 } });
    } catch (err) {
        console.error('getCart error:', err);
        res.status(500).send('Server error');
    }
};

exports.addToCart = async (req, res) => {
    try {
        const { productId, quantity, guestId } = req.body;
        const userId = req.user ? req.user.id : null;

        if (!userId && !guestId) {
            return res.status(400).json({ msg: "Identifier required to create a cart" });
        }

        let cart = await resolveCart(userId, guestId);
        if (!cart) {
            cart = new Cart({ user: userId, guestId: userId ? null : guestId, lineItems: [] });
        }

        const qty = Number(quantity) || 1;
        const itemIndex = cart.lineItems.findIndex(
            p => p.productId && p.productId.toString() === productId.toString()
        );

        if (itemIndex > -1) {
            cart.lineItems[itemIndex].quantity += qty;
        } else {
            cart.lineItems.push({ productId, quantity: qty });
        }

        await cart.save();
        const sanitized = await sanitizeCart(cart);
        res.json({ cart: sanitized });
    } catch (err) {
        console.error('addToCart error:', err);
        res.status(500).send('Server error');
    }
};

exports.removeFromCart = async (req, res) => {
    try {
        const { itemId, productId, guestId } = req.body;
        const userId = req.user ? req.user.id : null;
        const targetId = (itemId || productId || '').toString().trim();

        if (!userId && !guestId) {
            return res.status(400).json({ msg: "Identifier required" });
        }

        let cart = await resolveCart(userId, guestId);

        if (cart) {
            // Remove items matching either the line item ID or product ID, or with null product
            cart.lineItems = cart.lineItems.filter(item => {
                if (!item.productId) return false; // purge dead references
                if (!targetId) return true;

                const prodIdStr = item.productId.toString();
                const lineIdStr = item._id ? item._id.toString() : '';

                // If targetId matches either the product ID or the lineItem ID, drop it
                return prodIdStr !== targetId && lineIdStr !== targetId;
            });

            await cart.save();
        }

        const sanitized = cart ? await sanitizeCart(cart) : { lineItems: [], subtotal: { amount: 0 } };
        res.json({ cart: sanitized || { lineItems: [], subtotal: { amount: 0 } } });
    } catch (err) {
        console.error('removeFromCart error:', err);
        res.status(500).send('Server error');
    }
};

exports.updateQuantity = async (req, res) => {
    try {
        const { productId, itemId, quantity, guestId } = req.body;
        const userId = req.user ? req.user.id : null;
        const targetId = (productId || itemId || '').toString().trim();
        const newQty = Number(quantity);

        let cart = await resolveCart(userId, guestId);

        if (cart) {
            const itemIndex = cart.lineItems.findIndex(
                p => (p.productId && p.productId.toString() === targetId) ||
                     (p._id && p._id.toString() === targetId)
            );

            if (itemIndex > -1) {
                if (newQty <= 0) {
                    cart.lineItems.splice(itemIndex, 1);
                } else {
                    cart.lineItems[itemIndex].quantity = newQty;
                }
            }

            // Purge any dead references
            cart.lineItems = cart.lineItems.filter(item => item.productId != null);
            await cart.save();
        }

        const sanitized = cart ? await sanitizeCart(cart) : { lineItems: [], subtotal: { amount: 0 } };
        res.json({ cart: sanitized || { lineItems: [], subtotal: { amount: 0 } } });
    } catch (err) {
        console.error('updateQuantity error:', err);
        res.status(500).send('Server error');
    }
};