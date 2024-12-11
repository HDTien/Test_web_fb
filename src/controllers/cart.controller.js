"use strict";
const CartService = require("../services/cart.service");
const { SuccessResponse } = require("../core/success.response");

class CartController {
  // new
  addToCart = async (req, res, next) => {
    new SuccessResponse({
      message: "Create to Cart success",
      metadata: await CartService.addToCart(req.body),
    }).send(res);
  };
  // update
  update = async (req, res, next) => {
    new SuccessResponse({
      message: "Add to Cart success",
      metadata: await CartService.addToCartV2(req.body),
    }).send(res);
  };
  // delete
  delete = async (req, res, next) => {
    new SuccessResponse({
      message: "delete to Cart success",
      metadata: await CartService.deleteUserCart(req.body),
    }).send(res);
  };
  //query
  listToCart = async (req, res, next) => {
    new SuccessResponse({
      message: "List Cart success",
      metadata: await CartService.getListUsersCart(req.query),
    }).send(res);
  };


    deleteCart = async (req, res, next) => {
      new SuccessResponse({
          message: "Xóa giỏ hàng thành công",
          metadata: await CartService.deleteCart(req.body),
      }).send(res);
  };

}
module.exports = new CartController();
