import { Router } from "express";
import { searchProducts, createFakeOrder } from "../controllers/products.controller";

const router = Router();

router.post("/vector_search", searchProducts);
router.post("/generate-order", createFakeOrder);

export default router;