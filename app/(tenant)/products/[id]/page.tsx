"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ImagePlus, Images, Layers, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs-primitive";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { DataTable, type Column } from "@/components/app/data-table";
import { StatusPill } from "@/components/app/status-pill";
import { RowActions } from "@/components/app/row-actions";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { EmptyState, ErrorState } from "@/components/app/states";
import { Can } from "@/components/auth/can";
import { ProductFormDialog } from "@/features/catalog/product-form-dialog";
import { VariantFormDialog } from "@/features/catalog/variant-form-dialog";
import { productsApi } from "@/lib/api/modules/products";
import { variantsApi } from "@/lib/api/modules/variants";
import { inventoryApi } from "@/lib/api/modules/inventory";
import { productImagesApi, storageApi, type ProductImage } from "@/lib/api/modules/storage";
import type { ProductVariant } from "@/lib/api/types";
import { usePermission } from "@/lib/auth/permission-context";
import { formatDateTime, formatMoney, formatNumber } from "@/lib/format";
import { toastError } from "@/lib/api-errors";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();

  const product = useQuery({ queryKey: ["product", id], queryFn: () => productsApi.getById(id) });
  const variants = useQuery({ queryKey: ["product", id, "variants"], queryFn: () => variantsApi.listEnvelope(id, { limit: 100 }) });
  const stock = useQueries({
    queries: (variants.data?.data ?? []).map((v) => ({
      queryKey: ["inventory", "variant", v.id],
      queryFn: () => inventoryApi.getByVariant(v.id, { limit: 100 }),
      enabled: hasPermission("inventory:read"),
    })),
  });
  const onHand = new Map((variants.data?.data ?? []).map((v, i) => [v.id, stock[i]?.data?.reduce((sum, row) => sum + row.quantity - row.reservedQuantity, 0)]));
  const totalOnHand = [...onHand.values()].reduce<number>((sum, q) => sum + (q ?? 0), 0);

  const [editing, setEditing] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [variantDialog, setVariantDialog] = React.useState<{ open: boolean; variant?: ProductVariant }>({ open: false });
  const [deletingVariant, setDeletingVariant] = React.useState<ProductVariant | null>(null);

  const removeProduct = useMutation({
    mutationFn: () => productsApi.remove(id),
    onSuccess: () => {
      toast.success("Product deleted");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      router.push("/products" as never);
    },
    onError: (e) => toastError(e, "Couldn't delete product"),
  });
  const removeVariant = useMutation({
    mutationFn: (v: ProductVariant) => variantsApi.remove(id, v.id),
    onSuccess: (_, v) => {
      toast.success("Variant deleted", { description: v.sku });
      queryClient.invalidateQueries({ queryKey: ["product", id] });
    },
    onError: (e) => toastError(e, "Couldn't delete variant"),
  });

  if (product.error) {
    return (
      <Card>
        <ErrorState error={product.error} onRetry={() => product.refetch()} />
      </Card>
    );
  }

  const p = product.data;
  const variantColumns: Column<ProductVariant>[] = [
    { key: "sku", header: "SKU", cell: (v) => <span className="font-mono text-[13px] font-medium">{v.sku}</span> },
    { key: "barcode", header: "Barcode", cell: (v) => <span className="text-muted-foreground">{v.barcode || "—"}</span>, headerClassName: "hidden md:table-cell", className: "hidden md:table-cell" },
    { key: "price", header: "Price", cell: (v) => <span className="tabular">{formatMoney(v.price)}</span> },
    { key: "cost", header: "Cost", cell: (v) => <span className="tabular text-muted-foreground">{formatMoney(v.costPrice)}</span>, headerClassName: "hidden sm:table-cell", className: "hidden sm:table-cell" },
    {
      key: "stock",
      header: "Available",
      cell: (v) => {
        const q = onHand.get(v.id);
        return q === undefined ? <Skeleton className="h-4 w-8" /> : <span className={q <= 10 ? "tabular font-medium text-warning" : "tabular"}>{formatNumber(q)}</span>;
      },
    },
    { key: "status", header: "Status", cell: (v) => <StatusPill status={v.status} /> },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "w-12",
      cell: (v) => (
        <RowActions
          actions={[
            { label: "Edit", icon: Pencil, onSelect: () => setVariantDialog({ open: true, variant: v }), hidden: !hasPermission("product:update") },
            { label: "Delete", icon: Trash2, destructive: true, onSelect: () => setDeletingVariant(v), hidden: !hasPermission("product:delete") },
          ]}
        />
      ),
    },
  ];

  return (
    <PageBody>
      <Button variant="ghost" size="sm" className="-ml-2 w-fit text-muted-foreground" asChild>
        <Link href={"/products" as never}>
          <ArrowLeft /> Products
        </Link>
      </Button>
      <PageHeader
        title={p ? p.name : <Skeleton className="h-8 w-64" />}
        description={p ? <span className="flex flex-wrap items-center gap-2"><StatusPill status={p.status} />{p.brand ? <span>by {p.brand}</span> : null}</span> : null}
        actions={
          <>
            <Can permission="product:delete">
              <Button variant="outline" onClick={() => setDeleting(true)} disabled={!p}>
                <Trash2 /> Delete
              </Button>
            </Can>
            <Can permission="product:update">
              <Button onClick={() => setEditing(true)} disabled={!p}>
                <Pencil /> Edit product
              </Button>
            </Can>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Base price" value={p ? formatMoney(p.basePrice) : undefined} />
        <Stat label="Variants" value={variants.data ? formatNumber(variants.data.meta?.total ?? variants.data.data.length) : undefined} />
        <Stat label="Available units" value={variants.data && stock.every((s) => !s.isLoading) ? formatNumber(totalOnHand) : undefined} />
      </div>

      <Tabs defaultValue="variants" className="gap-4">
        <TabsList>
          <TabsTrigger value="variants">
            <Layers /> Variants
          </TabsTrigger>
          <TabsTrigger value="images">
            <Images /> Images
          </TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="variants">
          <Card className="gap-0 pb-0">
            <CardHeader className="border-b pb-4">
              <CardTitle>Variants</CardTitle>
              <CardDescription>Sellable SKUs. Available = on hand minus reserved, across all warehouses.</CardDescription>
              <CardAction>
                <Can permission="product:create">
                  <Button size="sm" onClick={() => setVariantDialog({ open: true })}>
                    <Plus /> Add variant
                  </Button>
                </Can>
              </CardAction>
            </CardHeader>
            <DataTable
              columns={variantColumns}
              rows={variants.data?.data}
              rowKey={(v) => v.id}
              loading={variants.isLoading}
              error={variants.error}
              onRetry={() => variants.refetch()}
              skeletonRows={3}
              empty={<EmptyState icon={Layers} title="No variants yet" description="Add at least one variant so this product can be stocked and ordered." />}
            />
          </Card>
        </TabsContent>

        <TabsContent value="images">
          <ProductImages productId={id} canUpload={hasPermission("product:create")} canDelete={hasPermission("product:delete")} canEdit={hasPermission("product:update")} />
        </TabsContent>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-x-8 gap-y-5 text-sm sm:grid-cols-2">
                <Detail label="Description" className="sm:col-span-2">{p?.description || "No description"}</Detail>
                <Detail label="Categories">{p?.categories?.length ? p.categories.map((c) => c.category.name + (c.isPrimary ? " (primary)" : "")).join(", ") : "Uncategorized"}</Detail>
                <Detail label="Brand">{p?.brand || "—"}</Detail>
                <Detail label="Created">{formatDateTime(p?.createdAt)}</Detail>
                <Detail label="Last updated">{formatDateTime(p?.updatedAt)}</Detail>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {p ? <ProductFormDialog open={editing} onOpenChange={setEditing} product={p} /> : null}
      <VariantFormDialog open={variantDialog.open} onOpenChange={(o) => setVariantDialog((s) => ({ ...s, open: o }))} productId={id} variant={variantDialog.variant} defaultPrice={p?.basePrice} />
      <ConfirmDialog open={deleting} onOpenChange={setDeleting} title={`Delete ${p?.name ?? "product"}?`} description="The product and its variants are removed from the catalog. Existing orders keep their snapshot." confirmLabel="Delete product" destructive onConfirm={() => removeProduct.mutateAsync()} />
      <ConfirmDialog
        open={Boolean(deletingVariant)}
        onOpenChange={(o) => !o && setDeletingVariant(null)}
        title={`Delete variant ${deletingVariant?.sku ?? ""}?`}
        description="It can no longer be stocked or ordered. Past orders are unaffected."
        confirmLabel="Delete variant"
        destructive
        onConfirm={() => removeVariant.mutateAsync(deletingVariant!)}
      />
    </PageBody>
  );
}

function Stat({ label, value }: { label: string; value?: string }) {
  return (
    <Card className="gap-1 px-5 py-4">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {value === undefined ? <Skeleton className="h-7 w-20" /> : <span className="tabular text-xl font-semibold">{value}</span>}
    </Card>
  );
}

function Detail({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1.5 leading-6">{children}</dd>
    </div>
  );
}

function ProductImages({ productId, canUpload, canDelete, canEdit }: { productId: string; canUpload: boolean; canDelete: boolean; canEdit: boolean }) {
  const queryClient = useQueryClient();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const images = useQuery({ queryKey: ["product", productId, "images"], queryFn: () => productImagesApi.list(productId) });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["product", productId, "images"] });

  const upload = useMutation({
    mutationFn: async (files: File[]) => {
      for (const file of files) {
        const fd = new FormData();
        fd.append("image", file);
        fd.append("altText", file.name.replace(/\.[^.]+$/, ""));
        await productImagesApi.upload(productId, fd);
      }
    },
    onSuccess: (_, files) => {
      toast.success(files.length === 1 ? "Image uploaded" : `${files.length} images uploaded`);
      invalidate();
    },
    onError: (e) => {
      toastError(e, "Upload failed");
      invalidate();
    },
  });
  const remove = useMutation({
    mutationFn: (img: ProductImage) => productImagesApi.remove(productId, img.id),
    onSuccess: () => {
      toast.success("Image removed");
      invalidate();
    },
    onError: (e) => toastError(e, "Couldn't remove image"),
  });
  const makePrimary = useMutation({
    mutationFn: (img: ProductImage) => productImagesApi.update(productId, img.id, { isPrimary: true }),
    onSuccess: invalidate,
    onError: (e) => toastError(e, "Couldn't update image"),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Images</CardTitle>
        <CardDescription>JPEG, PNG, WebP or GIF up to 10 MB. Files are private and served through short-lived signed links.</CardDescription>
        {canUpload ? (
          <CardAction>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                if (files.length) upload.mutate(files);
                e.target.value = "";
              }}
            />
            <Button size="sm" onClick={() => inputRef.current?.click()} loading={upload.isPending}>
              <ImagePlus /> Upload
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent>
        {images.isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}</div>
        ) : images.error ? (
          <ErrorState error={images.error} onRetry={() => images.refetch()} />
        ) : images.data?.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {images.data.map((img) => (
              <figure key={img.id} className="group relative overflow-hidden rounded-xl border bg-muted/40">
                <SignedImage productId={productId} image={img} />
                {img.isPrimary ? <span className="absolute left-2 top-2 rounded-full bg-background/90 px-2 py-0.5 text-[11px] font-medium shadow-sm">Primary</span> : null}
                <div className="absolute inset-x-2 bottom-2 flex justify-end gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                  {canEdit && !img.isPrimary ? (
                    <Button size="icon" variant="secondary" className="size-8 shadow-sm" aria-label="Make primary image" onClick={() => makePrimary.mutate(img)}>
                      <Star />
                    </Button>
                  ) : null}
                  {canDelete ? (
                    <Button size="icon" variant="secondary" className="size-8 text-destructive shadow-sm" aria-label="Delete image" onClick={() => remove.mutate(img)}>
                      <Trash2 />
                    </Button>
                  ) : null}
                </div>
              </figure>
            ))}
          </div>
        ) : (
          <EmptyState icon={Images} title="No images yet" description={canUpload ? "Upload product photos to use across your channels." : undefined} className="rounded-xl border border-dashed" />
        )}
      </CardContent>
    </Card>
  );
}

function SignedImage({ productId, image }: { productId: string; image: ProductImage }) {
  const signed = useQuery({
    queryKey: ["image-url", image.id],
    queryFn: () => storageApi.getSignedUrl(productId, image.id),
    staleTime: 10 * 60_000, // links live 15 minutes
  });
  if (!signed.data) return <Skeleton className="aspect-square w-full rounded-none" />;
  // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL from the API, not optimizable
  return <img src={signed.data.url} alt={image.altText ?? ""} className="aspect-square w-full object-cover" loading="lazy" />;
}
