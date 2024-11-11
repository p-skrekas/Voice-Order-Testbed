import { ObjectId } from "mongodb";

export interface Product {
    _id?: ObjectId;
    id: number;
    sku: string;
    name: string;
    units_per_package: string;
    main_unit_desc: string;
    unit2_desc: string;
    category_name: string;
    brand_name: string;
    published: boolean;
    embeddings: number[];
}
