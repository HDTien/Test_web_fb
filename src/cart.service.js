"use strict";
const { cart } = require("../models/cart.model");

const { BadRequestError, NotFoundError } = require("../core/error.response");
const { getProductById } = require("../models/repositories/product.repo");

/*
Key features : Cart Service
-add product to cart [user]
-reduce product quantity by onne[User]
-increase product quantity by One [User]
-get cart [User]
-Delete cart [User]
-Delete cart  item [User]
 */

class CartService {
    ///START REPO CART
    static async createUserCart({ userId, product }) {
        const query = { cart_userId: userId, cart_state: "active" },
            updateOrInsert = {
                $addToSet: {
                    cart_products: product,
                }
            },
            options = { upsert: true, new: true };

        return await cart.findOneAndUpdate(query, updateOrInsert, options);
    }

    //update
    static async updateUserCartQuantity({ userId, product }) {
        const { productId, quantity } = product;
        const query = {
                cart_userId: userId,
                "cart_products.productId": productId,
                cart_state: "active",
            },
            updateSet = {
                $inc: {
                    "cart_product.$.quantity": quantity,
                },
            },
            options = { upsert: true, new: true };
        return await cart.findOneAndUpdate(query, updateSet, options);
    }

    //EMD REPO CART
    static async addToCart({ userId, product = {} } = {}) {
            // check cart ton tai hay khong
            const userCart = await cart.findOne({ cart_userId: userId });
            if (!userCart) {
                //create cart for user
                return await CartService.createUserCart({ userId, product });
            }
            //  nee co gio hang roi nhung chua co san pham
            if (userCart.cart_products.length) {
                userCart.cart_products = [product];
                return await userCart.save();
            }

            // gio hang ton tai va co san pham nay thi update quantity
            return await CartService.updateUserCartQuantity({ userId, product });
        }
        // update cart
        /*
                             shop_oder_ids: [
                             {
                               shopId,      
                               item_product: [
                                 {  quantity,price,shopId old_quantity,productId, }
                               ],
                               version 
                             }]
                          */
    static async addToCartV2({ userId, product = {} }) {
        const { productId, quantity, old_quantity } =
        shop_order_ids[0] ? .item_product[0];

        // check product
        const foundProduct = await getProductById(productId);
        if (!foundProduct) throw new NotFoundError("Product not found");
        // compare
        if (foundProduct.product_shop.toString() !== shop_order_ids[0] ? .shopid)
            throw new NotFoundError("Product do not belong to the shop");

        if (quantity === 0) {
            //delete
        }

        return await CartService.updateUserCartQuantity({
            userId,
            product: {
                productId,
                quantity: quantity - old_quantity,
            },
        });
    }
    static async deleteUserCart({ userId, productId }) {
        const query = { cart_userId: userId, cart_state: "active" },
            updateSet = {
                $pull: {
                    cart_products: {
                        productId,
                    },
                },
            };
        const deleteCart = await cart.updateOne(query, updateSet);
        return deleteCart;
    }
    static async getListUsersCart({ userId }) {
        return await cart
            .findOne({
                cart_userId: userId,
            })
            .lean();
    }
}
module.exports = CartService;