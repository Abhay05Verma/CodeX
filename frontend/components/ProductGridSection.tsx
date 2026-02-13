"use client";

import Image from "next/image";
import {
  ArrowUpDown,
  Heart,
  Package,
  Plus,
  Search,
  SlidersHorizontal,
  Star,
  Truck,
  X,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { getSupplierName } from "@/lib/productUtils";
import type { Product } from "@/lib/api";

type Language = "en" | "hi";
type CategoryOption = { id: string; name: string };

type ProductGridSectionProps = {
  products: Product[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (id: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  categories: CategoryOption[];
  language: Language;
  onAddToCart: (product: Product) => void;
  wishlist?: Set<string>;
  onWishlistToggle?: (productId: string) => void;
  showFilters?: boolean;
  onToggleFilters?: () => void;
};

export default function ProductGridSection({
  products,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  categories,
  language,
  onAddToCart,
  wishlist = new Set(),
  onWishlistToggle,
  showFilters = false,
  onToggleFilters,
}: ProductGridSectionProps) {
  return (
    <>
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={
              language === "hi"
                ? "उत्पाद, सप्लायर या विवरण खोजें..."
                : "Search products, suppliers, or descriptions..."
            }
            className="w-full rounded-xl border border-zinc-300 py-3 pl-12 pr-10 text-sm outline-none focus:border-green-500"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {onToggleFilters ? (
            <button
              type="button"
              onClick={onToggleFilters}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                showFilters ? "bg-green-500 text-white" : "border border-zinc-300 bg-white"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {language === "hi" ? "फ़िल्टर" : "Filters"}
            </button>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onCategoryChange(c.id)}
                className={`rounded-lg px-3 py-2 text-sm ${
                  selectedCategory === c.id
                    ? "bg-green-500 text-white"
                    : "border border-zinc-300 bg-white text-zinc-700"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-zinc-500" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="rounded-md border border-zinc-300 px-2 py-1 text-sm"
            >
              <option value="recent">{language === "hi" ? "नया पहले" : "Recent"}</option>
              <option value="price-low">{language === "hi" ? "कम कीमत" : "Price Low"}</option>
              <option value="price-high">{language === "hi" ? "उच्च कीमत" : "Price High"}</option>
              <option value="name">{language === "hi" ? "नाम" : "Name"}</option>
            </select>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.length === 0 ? (
          <div className="col-span-full rounded-xl border border-gray-200 bg-white/80 py-12 text-center shadow-sm">
            <Package className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900">
              {language === "hi" ? "कोई उत्पाद नहीं मिला" : "No products found"}
            </h3>
            <p className="mt-2 text-gray-600">
              {language === "hi"
                ? "अपनी खोज मापदंड बदलने का प्रयास करें"
                : "Try changing your search criteria"}
            </p>
          </div>
        ) : null}
        {products.map((product) => (
          <article
            key={product._id}
            className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm"
          >
            <div className="relative">
              <Image
                src={product.image || "https://placehold.co/600x400?text=Product"}
                alt={product.name}
                width={600}
                height={400}
                className="h-44 w-full object-cover"
              />
              {onWishlistToggle ? (
                <button
                  type="button"
                  onClick={() => onWishlistToggle(product._id)}
                  className="absolute right-3 top-3 rounded-full bg-white/90 p-2"
                >
                  <Heart
                    className={`h-4 w-4 ${
                      wishlist.has(product._id) ? "fill-red-500 text-red-500" : "text-zinc-500"
                    }`}
                  />
                </button>
              ) : null}
            </div>
            <div className="space-y-2 p-4">
              <h3 className="font-semibold">{product.name}</h3>
              <p className="text-sm text-zinc-600">{product.description}</p>
              <p className="text-xs text-zinc-500">{getSupplierName(product)}</p>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Star className="h-4 w-4 text-yellow-500" />
                4.5
                <Truck className="ml-2 h-4 w-4" />
                20-30 min
              </div>
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold text-green-700">{formatCurrency(product.price)}</p>
                <button
                  type="button"
                  onClick={() => onAddToCart(product)}
                  className="inline-flex items-center gap-1 rounded-md bg-green-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-600"
                >
                  <Plus className="h-4 w-4" />
                  {language === "hi" ? "कार्ट" : "Add"}
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
