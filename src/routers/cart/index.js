"use strict";

const express = require("express");
const router = express.Router();
const CartController = require("../../controllers/cart.controller");
const { asyncHandler } = require("../../auth/checkAuth");
const { authenticationV2 } = require("../../auth/authUtils");

router.post("", asyncHandler(CartController.addToCart));
router.delete("", asyncHandler(CartController.delete));
router.post("/update", asyncHandler(CartController.update));
router.get("", asyncHandler(CartController.listToCart));
router.delete("/delete", asyncHandler(CartController.deleteCart));

module.exports = router;
