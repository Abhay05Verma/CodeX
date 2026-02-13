import type { Product } from "@/lib/api";

export function getSupplierId(product: Product): string | null {
  const supplier = product.supplier;
  if (!supplier) return null;
  return typeof supplier === "string" ? supplier : supplier._id;
}

export function getSupplierName(product: Product): string {
  const supplier = product.supplier;
  if (!supplier) return "Unknown Supplier";
  if (typeof supplier === "string") return `Supplier ${supplier.slice(-4)}`;
  return supplier.name || supplier.email || "Supplier";
}
