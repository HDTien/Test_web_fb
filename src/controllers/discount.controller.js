"use strict";
const DiscountService = require("../services/discount.service");
const { SuccessResponse } = require("../core/success.response");

class DiscountController {
    createDiscountCode = async(req, res, next) => {
        new SuccessResponse({
            message: "Successful Code  Generations",
            metadata: await DiscountService.createDiscountCode({
                ...req.body,
                shopId: req.user.userId,
            }),
        }).send(res);
    };

    // ... existing code ...

    updateDiscountCode = async(req, res, next) => {
        new SuccessResponse({
            message: 'Update discount code success!',
            metadata: await DiscountService.updateDiscountCode(
                req.params.discountId, {
                    ...req.body,
                    shopId: req.user.userId
                }
            )
        }).send(res);
    };


    getAllDiscountCodes = async(req, res, next) => {
        new SuccessResponse({
            message: "Successful Code Found",
            metadata: await DiscountService.getAllDiscountCodesByShop({
                ...req.query,
                shopId: req.user.userId,
            }),
        }).send(res);
    };

    getDiscountAmount = async(req, res, next) => {
        new SuccessResponse({
            message: "Successful Code  Found",
            metadata: await DiscountService.getDiscountAmount({
                ...req.body,
            }),
        }).send(res);
    };

    getAllDiscountCodesWithProducts = async(req, res, next) => {
        new SuccessResponse({
            message: "Successful Code  Found",
            metadata: await DiscountService.getAllDiscountCodesWithProduct({
                ...req.query,
            }),
        }).send(res);
    };


// ... existing code ...

deleteDiscountCodeV2 = async(req, res, next) => {
    new SuccessResponse({
        message: 'Delete discount code success!',
        metadata: await DiscountService.deleteDiscountCodeV2(
            req.user.userId,
            req.body
        )
    }).send(res);
};

// ... rest of the code ...

    deleteDiscountCode = async(req, res, next) => {
        console.log('DiscountId:', req.params.discountId);
        console.log('ShopId:', req.user.userId);
        
        if (!req.params.discountId) {
            throw new BadRequestError('Discount ID is required');
        }
    
        new SuccessResponse({
            message: 'Delete discount code success!',
            metadata: await DiscountService.deleteDiscountCode(
                req.user.userId,
                req.params.discountId
            )
        }).send(res);
    };

  

}
module.exports = new DiscountController();
