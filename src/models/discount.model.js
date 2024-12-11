"use strict";
const { model, Schema } = require("mongoose");

const DOCUMENT_NAME = "Discount";
const COLLECTION_NAME = "discounts";

const discountSchema = new Schema({
    discount_name: { type: String, required: true },
    discount_description: { type: String, required: true },
    discount_type: { type: String, default: "fixed_amount" }, // precentage
    discount_value: { type: Number, required: true }, // 10.000 ,10
    discount_code: { type: String, required: true }, // discont_code
    discount_start_date: { type: Date, required: true }, // ngay bat dau
    discount_end_date: { type: Date, required: true }, // ngay ket thuc
    discount_max_uses: { type: Number, required: true }, // so luong discouunt
    discount_uses_count: { type: Number, required: true }, // so luong discount duoc ap dung
    discount_users_used: { type: Array, default: [] }, // ai da dung
    discount_max_uses_per_user: { type: Number, required: true }, // số lượng cho phép tối đa được sử dụng mỗi user
    discount_min_order_value: { type: Number, required: true }, //
    discount_shopId: { type: Schema.Types.ObjectId, ref: "Shop" },
    discount_is_active: { type: Boolean, default: true },
    discount_applies_to: {
        type: String,
        required: true,
        emun: ["all", "specific"],
    },
    discount_product_ids: { type: Array, default: [] }, // so sam pham duoc app dung
}, {
    timestamps: true,
    collection: COLLECTION_NAME,
});
module.exports = model(DOCUMENT_NAME, discountSchema);