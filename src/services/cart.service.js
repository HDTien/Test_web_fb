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
  // static async createUserCart({ userId, product }) {
  //   const query = { cart_userId: userId, cart_state: "active" },
  //     updateOrInsert = {
  //       $addToSet: {
  //         cart_products: product,
  //       },
  //     },
  //     options = { upsert: true, new: true };

  //   return await cart.findOneAndUpdate(query, updateOrInsert, options);
  // }
  //EMD REPO CART
  // static async addToCart({ userId, product = {} } = {}) {
  //   // check cart ton tai hay khong
  //   const userCart = await cart.findOne({ cart_userId: userId });
  //   if (!userCart) {
  //     //create cart for user
  //     return await CartService.createUserCart({ userId, product });
  //   }
  //   //  nee co gio hang roi nhung chua co san pham
  //   if (userCart.cart_products.length) {
  //     userCart.cart_products = [product];
  //     return await userCart.save();
  //   }

  //   // gio hang ton tai va co san pham nay thi update quantity
  //   return await CartService.updateUserCartQuantity({ userId, product });
  // }

  static async createUserCart({ userId, product }) {
    // Lấy thông tin sản phẩm từ database
    const foundProduct = await getProductById(product.productId);
    if (!foundProduct) throw new NotFoundError("Không tìm thấy sản phẩm");

    // Tạo đối tượng sản phẩm với thông tin đầy đủ
    const cartProduct = {
      productId: product.productId,
      shopId: foundProduct.product_shop,
      quantity: parseInt(product.quantity),
      name: foundProduct.product_name, // Lấy tên từ sản phẩm
      price: foundProduct.product_price, // Lấy giá từ sản phẩm
    };

    const newCart = {
      cart_userId: userId,
      cart_state: "active",
      cart_products: [cartProduct],
      cart_count_product: 1,
    };

    return await cart.create(newCart);
  }

  // Cập nhật lại hàm addToCart để xử lý trường hợp tạo mới
  static async addToCart({ userId, product = {} } = {}) {
    // check cart tồn tại hay không
    const userCart = await cart.findOne({
      cart_userId: userId,
      cart_state: "active",
    });

    if (!userCart) {
      // create cart for user
      return await CartService.createUserCart({ userId, product });
    }

    // Nếu giỏ hàng không có sản phẩm
    if (!userCart.cart_products.length) {
      // Lấy thông tin sản phẩm
      const foundProduct = await getProductById(product.productId);
      if (!foundProduct) throw new NotFoundError("Không tìm thấy sản phẩm");

      userCart.cart_products = [
        {
          productId: product.productId,
          shopId: foundProduct.product_shop,
          quantity: parseInt(product.quantity),
          name: foundProduct.product_name,
          price: foundProduct.product_price,
        },
      ];
      return await userCart.save();
    }

    // Nếu giỏ hàng đã có sản phẩm, cập nhật quantity
    return await CartService.updateUserCartQuantity({ userId, product });
  }

  // update
  static async updateUserCartQuantity({ userId, product }) {
    const { productId, quantity } = product;
    const query = {
        cart_userId: userId,
        "cart_products.productId": productId,
        cart_state: "active",
      },
      updateSet = {
        $inc: {
          "cart_products.$.quantity": quantity,
        },
      },
      options = { upsert: true, new: true };
    return await cart.findOneAndUpdate(query, updateSet, options);
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
  static async addToCartV2({ userId, shop_order_ids }) {
    const { productId, quantity, old_quantity } =
      shop_order_ids[0]?.item_products[0];

    // check product
    const foundProduct = await getProductById(productId);
    if (!foundProduct) throw new NotFoundError("Product not found");
    // compare
    if (foundProduct.product_shop.toString() !== shop_order_ids[0]?.shopId)
      throw new NotFoundError("Product do not belong to the shop");

    // Nếu quantity = 0, xóa sản phẩm khỏi giỏ hàng
  if (quantity === 0) {
    // Xóa sản phẩm khỏi giỏ hàng
    const query = { 
      cart_userId: userId,
      cart_state: "active"
    };
    
    const updateSet = {
      $pull: {
        cart_products: {
          productId
        }
      }
    };

    const result = await cart.findOneAndUpdate(query, updateSet, { new: true });

    // Nếu giỏ hàng trống sau khi xóa sản phẩm, xóa luôn giỏ hàng
    if (result && result.cart_products.length === 0) {
      await cart.findOneAndDelete({
        cart_userId: userId,
        cart_state: "active"
      });
      return {
        message: "Đã xóa sản phẩm và giỏ hàng trống"
      };
    }

    return result;
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

  static async deleteCart({ userId, shopId }) {
    // Kiểm tra giỏ hàng tồn tại
    const userCart = await cart.findOne({
      cart_userId: userId,
      cart_state: "active",
    });

    if (!userCart) {
      throw new NotFoundError("Không tìm thấy giỏ hàng");
    }

    // Nếu có shopId, chỉ xóa sản phẩm của shop đó
    if (shopId) {
      const query = {
        cart_userId: userId,
        cart_state: "active",
      };

      const updateSet = {
        $pull: {
          cart_products: {
            shopId: shopId,
          },
        },
      };

      const result = await cart.findOneAndUpdate(query, updateSet, {
        new: true,
      });

      // Nếu không còn sản phẩm nào, xóa luôn giỏ hàng
      if (result.cart_products.length === 0) {
        await cart.findOneAndDelete({
          cart_userId: userId,
          cart_state: "active",
        });
        return {
          message: "Đã xóa giỏ hàng",
        };
      }

      return result;
    }

    // Nếu không có shopId, xóa toàn bộ giỏ hàng
    const result = await cart.findOneAndDelete({
      cart_userId: userId,
      cart_state: "active",
    });

    return {
      message: "Đã xóa giỏ hàng",
    };
  }

  // ... existing code ...
}
module.exports = CartService;
