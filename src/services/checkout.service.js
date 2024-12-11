"use strict";
const { BadRequestError, NotFoundError } = require("../core/error.response");
const { product } = require("../models/product.model");
const { findCartById } = require("../models/repositories/cart.repo");
const { checkProductByServer } = require("../models/repositories/product.repo");
const { getDiscountAmount } = require("./discount.service");
class CheckoutService {
  // login an without login
  /*
    {
    cartId,
    userId,
    shop_order_ids: string[
            {
                shopId,
                shop_discounts:[],
                item_products: [
                        {
                        price,
                        quantity,
                        productId
                        }
                    ]
            },
            {
                shopId,
                shop_discounts:[
                    {
                    "shopId",
                    "discountId",
                    codeId:
                    }
                ],
                item_products: [
                        {
                        price,
                        quantity,
                        productId
                        }
                    ]
            },
        ]
    }
    */
  static async checkoutReview({ cartId, userId, shop_order_ids = [] }) {
    //check_cartId ton tai khong
    const foundCart = await findCartById(cartId);
    if (!foundCart) throw new BadRequestError("Cart dose not exits!");

    const checkout_order = {
        totalPrice: 0, // tong tien hang
        feeShip: 0, // phi van chuyen
        totalDiscount: 0, // tong tien discout giam gia
        totalCheckout: 0, // tong thanh toan
      },
      shop_order_ids_new = [];

    //tinh tong tien bill
    for (let i = 0; i < shop_order_ids.length; i++) {
      const { shopId, shop_discounts = [], item_products } = shop_order_ids[i];
      // check product availabe
      const checkProductServer = await checkProductByServer(item_products);
      console.log(`checkProductServer::`, checkProductServer);
      if (!checkProductServer[0]) throw new BadRequestError("order wrong!!!");
      // tong tien donw hang
      const checkoutPrice = checkProductServer.reduce((acc, product) => {
        return acc + product.quantity * product.price;
      }, 0);
      // tong tien truoc khi su ly
      checkout_order.totalPrice += checkoutPrice;

      const itemCheckout = {
        shopId,
        shop_discounts,
        priceRaw: checkoutPrice, // tien truoc khi giam gia
        priceApplyDiscount: checkoutPrice, //
        item_products: checkProductServer,
      };

      //neu shop_discounts ton tai > 0 check xemm co hop lej hay ko
      if (shop_discounts.length > 0) {
        // gia su chi co mot discount
        //get amount discount
        const { totalPrice = 0, discount = 0 } = await getDiscountAmount({
          codeId: shop_discounts[0].codeId,
          userId,
          shopId,
          products: checkProductServer,
        });
        // tong discount giam gia
        checkout_order.totalDiscount += discount;
        // neu tien giam gia >0
        if (discount > 0) {
          itemCheckout.priceApplyDiscount = checkoutPrice - discount;
        }
      }
      // tong than toan cuoi cung
      checkout_order.totalCheckout += itemCheckout.priceApplyDiscount;
      shop_order_ids_new.push(itemCheckout);
    }
    return { shop_order_ids, shop_order_ids_new, checkout_order };
  }

  static async checkoutFinal() {
    //
  }
}
module.exports = CheckoutService;
