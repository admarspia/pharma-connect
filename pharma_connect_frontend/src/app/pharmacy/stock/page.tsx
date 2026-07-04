"use client";

import { useEffect, useState, FormEvent } from "react";
import { inventoryApi, medicineApi } from "@/lib/domains";
import { Stock, Medicine } from "@/lib/types";
import { RequireRole } from "@/components/RequireRole";
import { Banner } from "@/components/Banner";
import { EmptyState } from "@/components/EmptyState";
import { ApiClientError } from "@/lib/api-client";

function StockInner() {
  const [stock, setStock] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [medicineQuery, setMedicineQuery] = useState("");
  const [medicineResults, setMedicineResults] = useState<Medicine[]>([]);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [quantity, setQuantity] = useState(10);
  const [price, setPrice] = useState(0);
  const [adding, setAdding] = useState(false);

  function load() {
    setLoading(true);
    inventoryApi
      .list()
      .then(setStock)
      .catch(() => setError("Couldn\u2019t load your stock."))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleMedicineSearch(e: FormEvent) {
    e.preventDefault();
    if (!medicineQuery.trim()) return;
    const results = await medicineApi.search(medicineQuery.trim());
    setMedicineResults(results);
  }

  async function handleAdd() {
    if (!selectedMedicine) return;
    setAdding(true);
    setError(null);
    try {
      await inventoryApi.add({ medicineId: selectedMedicine.id, quantity, price });
      setSelectedMedicine(null);
      setMedicineQuery("");
      setMedicineResults([]);
      load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Couldn\u2019t add this medicine to stock.");
    } finally {
      setAdding(false);
    }
  }

  async function handleQuantityChange(stockId: string, next: number) {
    setStock((prev) => prev.map((s) => (s.id === stockId ? { ...s, quantity: next } : s)));
    try {
      await inventoryApi.update(stockId, { quantity: next });
    } catch {
      load(); // revert on failure
    }
  }

  async function handleRemove(stockId: string) {
    try {
      await inventoryApi.remove(stockId);
      setStock((prev) => prev.filter((s) => s.id !== stockId));
    } catch {
      setError("Couldn\u2019t remove this item. Please try again.");
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Stock</h1>

      <div className="card mt-6">
        <h2 className="font-semibold text-teal-900">Add a medicine to stock</h2>
        <form onSubmit={handleMedicineSearch} className="mt-3 flex gap-2">
          <input
            value={medicineQuery}
            onChange={(e) => setMedicineQuery(e.target.value)}
            placeholder="Search catalog by name"
            className="input flex-1"
          />
          <button type="submit" className="btn-ghost">
            Search
          </button>
        </form>

        {medicineResults.length > 0 && !selectedMedicine && (
          <ul className="mt-3 divide-y divide-teal-900/8 rounded-lg border border-teal-900/10">
            {medicineResults.map((m) => (
              <li
                key={m.id}
                onClick={() => setSelectedMedicine(m)}
                className="cursor-pointer px-3 py-2 text-sm hover:bg-teal-50"
              >
                {m.name} {m.genericName && <span className="text-ink/40">({m.genericName})</span>}
              </li>
            ))}
          </ul>
        )}

        {selectedMedicine && (
          <div className="mt-4 flex flex-wrap items-end gap-3 rounded-lg bg-teal-50 p-3">
            <div>
              <p className="text-sm font-medium text-teal-900">{selectedMedicine.name}</p>
              <button onClick={() => setSelectedMedicine(null)} className="text-xs text-clay-600">
                Change
              </button>
            </div>
            <div>
              <label className="label !mb-1 !text-xs">Quantity</label>
              <input
                type="number"
                min={0}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                className="input w-24"
              />
            </div>
            <div>
              <label className="label !mb-1 !text-xs">Price</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                className="input w-28"
              />
            </div>
            <button onClick={handleAdd} disabled={adding} className="btn-accent">
              {adding ? "Adding\u2026" : "Add to stock"}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-6">
          <Banner tone="error">{error}</Banner>
        </div>
      )}

      {loading && <p className="mt-8 text-sm text-ink/50">Loading&hellip;</p>}

      {!loading && stock.length === 0 && (
        <div className="mt-8">
          <EmptyState title="No stock yet" description="Search the catalog above to add your first medicine." />
        </div>
      )}

      <div className="mt-8 overflow-hidden rounded-card border border-teal-900/8">
        {stock.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between gap-4 border-b border-teal-900/8 bg-white px-4 py-3 last:border-b-0"
          >
            <div>
              <p className="font-medium text-ink">{s.medicine.name}</p>
              {s.quantity <= s.lowStockThreshold && (
                <span className="text-xs font-semibold text-clay-600">Low stock</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                value={s.quantity}
                onChange={(e) => handleQuantityChange(s.id, parseInt(e.target.value) || 0)}
                className="input w-20 !py-1.5"
              />
              <button onClick={() => handleRemove(s.id)} className="text-xs text-clay-600 hover:underline">
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StockPage() {
  return (
    <RequireRole role="PHARMACY">
      <StockInner />
    </RequireRole>
  );
}
