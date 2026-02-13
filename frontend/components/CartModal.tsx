"use client";

import { Minus, Plus, X } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { Product } from "@/lib/api";

type CartItem = Product & { quantity: number };
type Language = "en" | "hi";

type CartModalProps = {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onPlaceOrder: () => void;
  language: Language;
};

export default function CartModal({
  open,
  onClose,
  items,
  onUpdateQuantity,
  onPlaceOrder,
  language,
}: CartModalProps) {
  if (!open) return null;

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 p-4 md:items-center">
      <div className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{language === "hi" ? "आपका कार्ट" : "Your Cart"}</h2>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        {items.length === 0 ? (
          <p className="text-sm text-zinc-500">
            {language === "hi" ? "कार्ट खाली है" : "Cart is empty"}
          </p>
        ) : (
          <>
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item._id} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-zinc-600">{formatCurrency(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item._id, item.quantity - 1)}
                        className="rounded border border-zinc-300 p-1 hover:bg-zinc-100"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-sm">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item._id, item.quantity + 1)}
                        className="rounded border border-zinc-300 p-1 hover:bg-zinc-100"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-lg bg-zinc-100 p-3">
              <p className="text-sm text-zinc-600">{language === "hi" ? "कुल" : "Total"}</p>
              <p className="text-xl font-bold">{formatCurrency(total)}</p>
            </div>
            <button
              type="button"
              onClick={onPlaceOrder}
              className="mt-4 w-full rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              {language === "hi" ? "ऑर्डर करें" : "Place Order"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
