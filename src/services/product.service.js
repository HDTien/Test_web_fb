"use strict";
const { product, clothing, electronic } = require("../models/product.model");
const { BadRequestError } = require("../core/error.response");
// define Factory class to create product

class ProductFactory {
  static async createProduct(type, payload) {
    switch (type) {
      case "Clothing":
        return await new Clothing(payload).createProduct(); // Thêm await và gọi createProduct
      case "Electronics":
        return await new Electronics(payload).createProduct(); // Thêm await và gọi createProduct
      default:
        throw new BadRequestError(`Invalid product type: ${type}`);
    }
  }
}

// define  base product class

class Product {
  constructor({
    product_name,
    product_thumb,
    product_description,
    product_price,
    product_type,
    product_shop,
    product_attributes,
    product_quantity,
  }) {
    this.product_name = product_name;
    this.product_thumb = product_thumb;
    this.product_description = product_description;
    this.product_price = product_price;
    this.product_type = product_type;
    this.product_shop = product_shop;
    this.product_attributes = product_attributes;
    this.product_quantity = product_quantity;
  }

  // create  new  product
  async createProduct(product_id) {
    return await product.create({ ...this, _id: product_id });
  }
}

// Define sub-class for different product types clothing'

class Clothing extends Product {
  async createProduct() {
    const newColothing = await clothing.create({
      ...this.product_attributes,
      product_shop: this.product_shop,
    });
    if (!newColothing) throw new BadRequestError("create new Clothing error");

    const newProduct = await super.createProduct(newColothing._id);
    if (!newProduct) throw new BadRequestError("create new Product error");

    return newProduct;
  }
}

class Electronics extends Product {
  async createProduct() {
    const newElectronic = await electronic.create({
      ...this.product_attributes,
      product_shop: this.product_shop,
    });
    if (!newElectronic)
      throw new BadRequestError("create new Electronic error");

    const newProduct = await super.createProduct(newElectronic._id);
    if (!newProduct) throw new BadRequestError("create new Product error");

    return newProduct;
  }
}

module.exports = ProductFactory;
