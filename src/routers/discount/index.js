"use strict";
const express = require("express");
const router = express.Router();
const discountController = require("../../controllers/discount.controller");
const { asyncHandler } = require("../../auth/checkAuth");
const { authenticationV2 } = require("../../auth/authUtils");

// get amount a discount
router.post("/amount", asyncHandler(discountController.getDiscountAmount));
router.get(
    "/list_product_code",
    asyncHandler(discountController.getAllDiscountCodesWithProducts)
);
// Authentication middleware
router.use(authenticationV2);

router.patch("/:discountId", asyncHandler(discountController.updateDiscountCode));

router.post("", asyncHandler(discountController.createDiscountCode));
router.get(
    "",
    asyncHandler(discountController.getAllDiscountCodes)
);

router.delete("/:discountId", asyncHandler(discountController.deleteDiscountCode));
router.delete("", asyncHandler(discountController.deleteDiscountCodeV2));
module.exports = router;