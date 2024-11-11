import mongoose, { Model, Schema } from "mongoose";
import { Product  } from "./product.interface";

const ProductSchema = new Schema({
    _id: {
        type: Schema.Types.ObjectId,
    },
    id: {
        type: Number,
        required: true,
    },
    sku: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    units_per_package: {
        type: String,
        required: true,
    },
    main_unit_desc: {
        type: String,
        required: true,
    },
    unit2_desc: {
        type: String,
        required: true,
    },
    category_name: {
        type: String,
        required: true,
    },
    brand_name: {
        type: String,
        required: true,
    },
    published: {
        type: Boolean,
        required: true,
    },
    embeddings: {
        type: [Number],
    },
})

const ProductModel = mongoose.model<Product>("Product", ProductSchema);

export default ProductModel;

