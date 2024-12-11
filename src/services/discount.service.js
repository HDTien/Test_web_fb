"use strict";
const { BadRequestError, NotFoundError } = require("../core/error.response");
const { convertToObjectIdMongodb } = require("../utils");
const  discount  = require("../models/discount.model");
const { findAllProducts } = require("./product.service.xxx");
const {
  findAllDiscountCodesSelect,
  findAllDiscountCodesUnSelect,
  checkDiscountExits,
} = require("../models/repositories/discount.repo");

/*
Discount Service
1- Generator Discount Code [Shop| Admin]
2- Get discount  amount [User]
3- Get all discount codes [User|Shop]
4- Verify discount code
5- Delete discount code[Admin|Shop]
6- Cancel discount code[user]
*/
class DiscountService {
  static async createDiscountCode(payload) {
    const {
      code,
      start_date,
      end_date,
      is_active,
      users_used,
      shopId,
      min_order_value,
      product_ids,
      applies_to,
      name,
      description,
      type,
      value,
      max_value,
      max_uses,
      uses_count,
      max_uses_per_user,
    } = payload;
    //kiem tra
    // if (new Date() < new Date(start_date) || new Date() > new Date(end_date)) {
    //   throw new BadRequestError("Discount code  has expired !");
    // }
    if (new Date(start_date) >= new Date(end_date)) {
      throw new BadRequestError(
        "Start_date must be before end_date code  has expired !"
      );
    }
    // crete index for discount code
    const foundDiscount = await discount
      .findOne({
        discount_code: code,
        discount_shopId: convertToObjectIdMongodb(shopId),
      })
      .lean();
    if (foundDiscount && foundDiscount.discount_is_active) {
      throw new BadRequestError(" Discount exists!");
    }
    const newDiscount = await discount.create({
      discount_name: name,
      discount_description: description,
      discount_type: type,
      discount_code: code,
      discount_value: value,
      discount_min_order_value: min_order_value || 0,
      discount_max_value: max_value || 0,
      discount_start_date: new Date(start_date),
      discount_end_date: new Date(end_date),
      discount_max_uses: max_uses,
      discount_uses_count: uses_count,
      discount_users_used: users_used,
      discount_shopId: shopId,
      discount_max_uses_per_user: max_uses_per_user,
      discount_is_active: is_active,
      discount_applies_to: applies_to,
      discount_product_ids: applies_to === "all" ? [] : product_ids,
    });
    return newDiscount;
  }

  static async updateDiscountCode(discountId, payload) {
    const {
      name,
      description,
      type,
      code,
      value,
      max_value,
      start_date,
      end_date,
      max_uses,
      uses_count,
      min_order_value,
      is_active,
      applies_to,
      product_ids,
      max_uses_per_user,
      shopId,
    } = payload;

    // Kiểm tra discount có tồn tại không
    const foundDiscount = await discount.findOne({
      _id: convertToObjectIdMongodb(discountId),
      discount_shopId: convertToObjectIdMongodb(shopId),
    });

    if (!foundDiscount) throw new NotFoundError("Discount not found!");

    // Kiểm tra ngày hợp lệ
    if (start_date && end_date && new Date(start_date) >= new Date(end_date)) {
      throw new BadRequestError("Start date must be before end date!");
    }

    // Kiểm tra code đã tồn tại chưa (nếu có thay đổi code)
    if (code) {
      const foundCode = await discount.findOne({
        discount_code: code,
        discount_shopId: convertToObjectIdMongodb(shopId),
        _id: { $ne: convertToObjectIdMongodb(discountId) },
      });
      if (foundCode) {
        throw new BadRequestError("Discount code already exists!");
      }
    }

    // Update discount
    const updatedDiscount = await discount.findByIdAndUpdate(
      discountId,
      {
        discount_name: name,
        discount_description: description,
        discount_type: type,
        discount_code: code,
        discount_value: value,
        discount_min_order_value: min_order_value,
        discount_max_value: max_value,
        discount_start_date: start_date,
        discount_end_date: end_date,
        discount_max_uses: max_uses,
        discount_uses_count: uses_count,
        discount_max_uses_per_user: max_uses_per_user,
        discount_is_active: is_active,
        discount_applies_to: applies_to,
        discount_product_ids: applies_to === "all" ? [] : product_ids,
      },
      { new: true }
    );

    return updatedDiscount;
  }

  // ... rest of the code ...

  static async getAllDiscountCodesWithProduct({
    code,
    shopId,
    userId,
    limit,
    page,
  }) {
    // create index for discount_code
    const foundDiscount = await discount
      .findOne({
        discount_code: code,
        discount_shopId: convertToObjectIdMongodb(shopId),
      })
      .lean();

    if (!foundDiscount || !foundDiscount.discount_is_active) {
      throw new BadRequestError("Discount  not exits!");
    }

    const { discount_applies_to, discount_product_ids } = foundDiscount;
    let products;
    if (discount_applies_to === "all") {
      // get all product
      products = await findAllProducts({
        filter: {
          product_shop: convertToObjectIdMongodb(shopId),
          isPublished: true,
        },
        limit: +limit,
        page: +page,
        sort: "ctime",
        select: ["product_name"],
      });
    }
    if (discount_applies_to === "specific") {
      // get all product ids
      products = await findAllProducts({
        filter: {
          _id: { $in: discount_product_ids },
          isPublished: true,
        },
        limit: +limit,
        page: +page,
        sort: "ctime",
        select: ["product_name"],
      });
    }
    return products;
  }
  /*
        get all discount code of Shop
         */
  static async getAllDiscountCodesByShop({ limit, page, shopId }) {
    const discounts = await findAllDiscountCodesUnSelect({
      limit: +limit,
      page: +page,
      filter: {
        discount_shopId: convertToObjectIdMongodb(shopId),
        discount_is_active: true,
      },
      unSelect: ["__v", "discount_shopId"],
      model: discount,
    });
    return discounts;
  }
  /*
        Apply Discount Code
        product= {
        {
        productId,
        shopId,
        quantity,
        name
        price,
         } 
         }  
         */
  static async getDiscountAmount({ codeId, userId, shopId, products }) {
    const foundDiscount = await checkDiscountExits({
      model: discount,
      filter: {
        discount_code: codeId,
        discount_shopId: convertToObjectIdMongodb(shopId),
      },
    });

    if (!foundDiscount) throw new NotFoundError("Discount doesn't exist");
    const {
      discount_is_active,
      discount_max_uses,
      discount_min_order_value,
      discount_users_used,
      discount_start_date,  // Thêm vào đây
        discount_end_date,    // Thêm vào đây
        discount_type,        // Thêm vào đây
        discount_value,       // Thêm vào đây
        discount_max_uses_per_user
    } = foundDiscount;
    if (!discount_is_active) throw new NotFoundError("Discount expired");
    if (!discount_max_uses) throw new NotFoundError("Discount are out ");

    if (
      new Date() < new Date(discount_start_date) ||
      new Date() > new Date(discount_end_date)
    ) {
      throw new NotFoundError("Discount code has expired  ");
    }
    // check có et gia tri toi thieu hay k
    let totalOrder = 0;
    if (discount_min_order_value > 0) {
      // get toal
      totalOrder = products.reduce((acc, product) => {
        return acc + product.quantity * product.price;
      }, 0);
      if (totalOrder < discount_min_order_value) {
        throw new NotFoundError(
          ` Discount Requires a minium Order value Of ${discount_min_order_value}!`
        );
      }
      if (discount_max_uses_per_user > 0) {
        const userUserDiscount = discount_users_used.find(
          (user) => user.userId === userId
        );
        if (
          userUserDiscount &&
          userUserDiscount.uses_count >= discount_max_uses_per_user
        ) {
          throw new NotFoundError(
            "You have reached the maximum number of uses for this discount code"
          );
        }
        //check xem discout nay la fixea_amount
        const amount =
          discount_type === "fixed_amount"
            ? discount_value
            : totalOrder * (discount_value / 100);
        return {
          totalOrder,
          discount: amount,
          totalPrice: totalOrder - amount,
        };
      }
    }
  }

// ... existing code ...

static async deleteDiscountCodeV2(shopId, bodyData) {
  const { discount_code } = bodyData;
  
  if (!discount_code) {
    throw new BadRequestError('Discount code is required!');
  }

  const foundDiscount = await discount.findOne({
    discount_code,
    discount_shopId: convertToObjectIdMongodb(shopId)
  });
  
  if (!foundDiscount) {
    throw new NotFoundError(`Discount not found with code ${discount_code}`);
  }

  const deleted = await discount.findByIdAndDelete(foundDiscount._id);
  return deleted;
}

// ... rest of the code ...

static async deleteDiscountCode(shopId, discountId) {
  const foundDiscount = await discount.findOne({
      _id: convertToObjectIdMongodb(discountId),
      discount_shopId: convertToObjectIdMongodb(shopId)
  });
  
  if (!foundDiscount) {
      throw new NotFoundError(`Discount not found with ID ${discountId}`);
  }

  const deleted = await discount.findByIdAndDelete(discountId);
  return deleted;
}


  /*
        Cancel Discount Code()
         */
  static async cancelDiscountCode(shopId, codeId, userId) {
    const foundDiscount = await checkDiscountExits({
      model: discount,
      filter: {
        discount_code: codeId,
        discount_shopId: convertToObjectIdMongodb(shopId),
      },
    });
    if (!foundDiscount) throw new NotFoundError("Discount doesn't exist");
    //
    const result = await discount.findByIdAndUpdate(foundDiscount._id, {
      $pull: {
        discount_users_used: userId,
      },
      $inc: {
        discount_max_uses: -1,
        discount_uses_count: -1,
      },
    });
    return result;
  }
}

module.exports = DiscountService;
