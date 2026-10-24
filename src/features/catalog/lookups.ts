"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { productsApi } from "@/lib/api/modules/products";
import { warehousesApi } from "@/lib/api/modules/warehouses";
import type { Product, ProductVariant, Warehouse } from "@/lib/api/types";

export interface VariantOption {
  variant: ProductVariant;
  product: Product;
  label: string;
}

/**
 * Catalog variants with their product, for pickers and for labelling inventory rows (the inventory
 * API returns variant ids/SKUs only). The products list embeds variants, so one request covers it.
 */
export function useVariantLookup(enabled = true) {
  const query = useQuery({
    queryKey: ["products", "lookup"],
    queryFn: () => productsApi.listEnvelope({ limit: 100, sortBy: "name", sortOrder: "asc" }),
    enabled,
    staleTime: 60_000,
  });
  const { options, byId } = React.useMemo(() => {
    const options: VariantOption[] = [];
    for (const product of query.data?.data ?? []) {
      for (const variant of product.variants ?? []) {
        options.push({ variant, product, label: `${product.name} · ${variant.sku}` });
      }
    }
    return { options, byId: new Map(options.map((o) => [o.variant.id, o])) };
  }, [query.data]);
  return { options, byId, isLoading: query.isLoading };
}

export function useWarehouseOptions(enabled = true) {
  const query = useQuery({
    queryKey: ["warehouses", "options"],
    queryFn: () => warehousesApi.listEnvelope({ limit: 100 }),
    enabled,
    staleTime: 60_000,
  });
  const warehouses: Warehouse[] = query.data?.data ?? [];
  const active = warehouses.filter((w) => w.isActive);
  return {
    warehouses,
    options: active.map((w) => ({ value: w.id, label: `${w.name} (${w.code})` })),
    defaultId: (active.find((w) => w.isDefault) ?? active[0])?.id,
    isLoading: query.isLoading,
  };
}
