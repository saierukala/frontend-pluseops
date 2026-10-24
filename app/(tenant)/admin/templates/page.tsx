"use client";

import * as React from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, MessageSquareText, Pencil, Plus, Power, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { DialogRoot, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { DataTable, FilterSelect, SearchInput, TableToolbar, ALL, type Column } from "@/components/app/data-table";
import { FormDialog, Field } from "@/components/app/form-dialog";
import { RowActions } from "@/components/app/row-actions";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { StatusPill } from "@/components/app/status-pill";
import { EmptyState } from "@/components/app/states";
import { templatesApi, KNOWN_TEMPLATES, placeholdersIn, type NotificationTemplate, type TemplateChannel, type TemplatePreview } from "@/lib/api/modules/templates";
import { usePermission } from "@/lib/auth/permission-context";
import { useUrlState } from "@/hooks/use-url-state";
import { applyApiFieldErrors, toastError } from "@/lib/api-errors";
import { formatRelative, humanize } from "@/lib/format";

const CHANNELS: TemplateChannel[] = ["EMAIL", "IN_APP", "SMS", "PUSH"];
const CUSTOM = "__custom";

function TemplateDialog({ open, onOpenChange, template }: { open: boolean; onOpenChange: (o: boolean) => void; template?: NotificationTemplate }) {
  const queryClient = useQueryClient();
  const [known, setKnown] = React.useState(CUSTOM);
  const [name, setName] = React.useState("");
  const [channel, setChannel] = React.useState<TemplateChannel>("EMAIL");
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(template?.name ?? "");
    setChannel(template?.channel ?? "EMAIL");
    setSubject(template?.subject ?? "");
    setBody(template?.body ?? "");
    setIsActive(template?.isActive ?? true);
    setKnown(KNOWN_TEMPLATES.find((k) => k.name === template?.name)?.name ?? CUSTOM);
    setErrors({});
  }, [open, template]);

  const preset = KNOWN_TEMPLATES.find((k) => k.name === known);
  // Every {{placeholder}} used must be declared; declare exactly the ones used
  const variables = [...new Set([...placeholdersIn(subject), ...placeholdersIn(body)])];
  const unknown = preset ? variables.filter((v) => !preset.variables.includes(v)) : [];

  const save = useMutation({
    mutationFn: () => {
      const payload = { name: name.trim(), channel, subject: channel === "SMS" ? (subject.trim() || null) : subject.trim(), body: body.trim(), variables, isActive };
      return template ? templatesApi.update(template.id, payload) : templatesApi.create(payload);
    },
    onSuccess: (t) => {
      toast.success(template ? "Template saved" : "Template created", { description: t.name });
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      onOpenChange(false);
    },
    onError: (e) => {
      const fields: Record<string, string> = {};
      if (!applyApiFieldErrors(e, (f, err) => (fields[String(f)] = err.message ?? "Invalid"), ["name", "channel", "subject", "body", "variables"])) toastError(e, "Couldn't save the template");
      setErrors(fields);
    },
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      className="sm:max-w-2xl"
      title={template ? `Edit ${template.name}` : "New message template"}
      description="An active template with a message's name and channel replaces PulseOps' built-in wording."
      submitLabel={template ? "Save changes" : "Create template"}
      pending={save.isPending}
      onSubmit={(e) => {
        e.preventDefault();
        const next: Record<string, string> = {};
        if (!name.trim()) next.name = "Name is required";
        if (channel !== "SMS" && !subject.trim()) next.subject = `${humanize(channel)} templates need a subject`;
        if (!body.trim()) next.body = "Body is required";
        setErrors(next);
        if (!Object.keys(next).length) save.mutate();
      }}
    >
      {!template ? (
        <Field label="Message" hint={preset ? `Available: ${preset.variables.map((v) => `{{${v}}}`).join(" ")}` : "Pick a message PulseOps sends, or use your own name"}>
          <Select
            value={known}
            onValueChange={(v) => {
              setKnown(v);
              const k = KNOWN_TEMPLATES.find((x) => x.name === v);
              if (k) { setName(k.name); setChannel(k.channel); }
            }}
            options={[...KNOWN_TEMPLATES.map((k) => ({ value: k.name, label: k.label })), { value: CUSTOM, label: "Custom name" }]}
          />
        </Field>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="tpl-name" error={errors.name} hint="Key like order.created">
          <Input id="tpl-name" value={name} disabled={!!preset && !template} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Channel" error={errors.channel}>
          <Select value={channel} disabled={!!preset && !template} onValueChange={(v) => setChannel(v as TemplateChannel)} options={CHANNELS.map((c) => ({ value: c, label: humanize(c) }))} />
        </Field>
      </div>
      <Field label={channel === "EMAIL" ? "Subject" : channel === "SMS" ? "Subject (not sent)" : "Title"} htmlFor="tpl-subject" error={errors.subject}>
        <Input id="tpl-subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Your order {{orderId}} is confirmed" maxLength={255} />
      </Field>
      <Field label="Body" htmlFor="tpl-body" error={errors.body} hint="Use {{name}} to insert a value. Plain text, up to 5000 characters.">
        <Textarea id="tpl-body" rows={7} value={body} onChange={(e) => setBody(e.target.value)} maxLength={5000} className="font-mono text-sm" />
      </Field>
      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        Variables used: {variables.length ? variables.map((v) => <Badge key={v} variant={unknown.includes(v) ? "destructive" : "outline"} className="font-mono">{v}</Badge>) : "none"}
      </div>
      {unknown.length ? <p className="text-xs text-destructive">This message doesn&apos;t provide {unknown.map((v) => `{{${v}}}`).join(", ")}; they will be empty.</p> : null}
      <label className="flex items-center justify-between gap-4 rounded-lg border p-3 text-sm">
        <span>
          <span className="font-medium">Active</span>
          <span className="block text-xs text-muted-foreground">Inactive templates are kept but not used.</span>
        </span>
        <Switch checked={isActive} onCheckedChange={setIsActive} />
      </label>
    </FormDialog>
  );
}

function PreviewDialog({ template, onOpenChange }: { template: NotificationTemplate | null; onOpenChange: (o: boolean) => void }) {
  const [values, setValues] = React.useState<Record<string, string>>({});
  const [result, setResult] = React.useState<TemplatePreview | null>(null);
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValues(Object.fromEntries((template?.variables ?? []).map((v) => [v, ""])));
    setResult(null);
  }, [template]);
  const preview = useMutation({
    mutationFn: () => templatesApi.preview(template!.id, Object.fromEntries(Object.entries(values).filter(([, v]) => v !== ""))),
    onSuccess: setResult,
    onError: (e) => toastError(e, "Couldn't render the preview"),
  });
  return (
    <DialogRoot open={!!template} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Preview {template?.name}</DialogTitle>
          <DialogDescription>Rendered by the server exactly as it will be sent.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.keys(values).map((v) => (
            <Field key={v} label={v} htmlFor={`pv-${v}`}>
              <Input id={`pv-${v}`} value={values[v]} onChange={(e) => setValues((x) => ({ ...x, [v]: e.target.value }))} />
            </Field>
          ))}
        </div>
        <Button onClick={() => preview.mutate()} loading={preview.isPending} className="self-start"><Eye /> Render</Button>
        {result ? (
          <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-4 text-sm">
            {result.subject ? <p className="font-medium">{result.subject}</p> : null}
            <p className="whitespace-pre-wrap">{result.body}</p>
            {result.missingVariables.length ? <p className="text-xs text-amber-600">Left empty: {result.missingVariables.join(", ")}</p> : null}
          </div>
        ) : null}
      </DialogContent>
    </DialogRoot>
  );
}

/** Message templates (GET/POST/PATCH/DELETE /notification-templates, POST /:id/preview). */
export default function TemplatesPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const { get, set, page } = useUrlState();
  const search = get("q");
  const channel = get("channel", ALL);
  const [dialog, setDialog] = React.useState<{ open: boolean; template?: NotificationTemplate }>({ open: false });
  const [previewing, setPreviewing] = React.useState<NotificationTemplate | null>(null);
  const [deleting, setDeleting] = React.useState<NotificationTemplate | null>(null);
  const query = useQuery({
    queryKey: ["templates", { page, search, channel }],
    queryFn: () => templatesApi.listEnvelope({ page, limit: 20, search: search || undefined, channel: channel === ALL ? undefined : (channel as TemplateChannel) }),
    placeholderData: keepPreviousData,
  });
  const toggle = useMutation({
    mutationFn: (t: NotificationTemplate) => templatesApi.update(t.id, { isActive: !t.isActive }),
    onSuccess: (t) => { toast.success(t.isActive ? "Template active" : "Template turned off", { description: t.name }); queryClient.invalidateQueries({ queryKey: ["templates"] }); },
    onError: (e) => toastError(e, "Couldn't update the template"),
  });
  const remove = useMutation({
    mutationFn: (t: NotificationTemplate) => templatesApi.remove(t.id),
    onSuccess: () => { toast.success("Template deleted"); queryClient.invalidateQueries({ queryKey: ["templates"] }); },
    onError: (e) => toastError(e, "Couldn't delete the template"),
  });

  const columns: Column<NotificationTemplate>[] = [
    { key: "name", header: "Template", cell: (t) => <div className="min-w-0"><p className="font-mono text-[13px] font-medium">{t.name}</p><p className="truncate text-xs text-muted-foreground">{t.subject ?? t.body.slice(0, 80)}</p></div> },
    { key: "channel", header: "Channel", cell: (t) => <Badge variant="outline">{humanize(t.channel)}</Badge> },
    { key: "vars", header: "Variables", cell: (t) => <span className="font-mono text-xs text-muted-foreground">{t.variables.join(", ") || "—"}</span>, headerClassName: "hidden lg:table-cell", className: "hidden lg:table-cell" },
    { key: "status", header: "Status", cell: (t) => <StatusPill status={t.isActive ? "ACTIVE" : "INACTIVE"} label={t.isActive ? "Active" : "Off"} /> },
    { key: "updated", header: "Updated", cell: (t) => <span className="text-muted-foreground">{formatRelative(t.updatedAt)}</span>, headerClassName: "hidden md:table-cell", className: "hidden md:table-cell" },
    {
      key: "actions",
      header: "",
      cell: (t) => (
        <RowActions
          actions={[
            { label: "Preview", icon: Eye, onSelect: () => setPreviewing(t) },
            { label: "Edit", icon: Pencil, hidden: !hasPermission("notification_template:update"), onSelect: () => setDialog({ open: true, template: t }) },
            { label: t.isActive ? "Turn off" : "Turn on", icon: Power, hidden: !hasPermission("notification_template:update"), onSelect: () => toggle.mutate(t) },
            { label: "Delete", icon: Trash2, destructive: true, hidden: !hasPermission("notification_template:delete"), onSelect: () => setDeleting(t) },
          ]}
        />
      ),
    },
  ];

  return (
    <PageBody>
      <PageHeader
        title="Message templates"
        description="Reword the emails and notifications PulseOps sends for your workspace. Without a template, the built-in text is used."
        actions={hasPermission("notification_template:create") ? <Button onClick={() => setDialog({ open: true })}><Plus /> New template</Button> : null}
      />
      <Card className="gap-0 py-0">
        <TableToolbar>
          <SearchInput value={search} onChange={(v) => set({ q: v })} placeholder="Search name or text" className="sm:max-w-xs" />
          <FilterSelect value={channel} onChange={(v) => set({ channel: v })} allLabel="All channels" options={CHANNELS.map((c) => ({ value: c, label: humanize(c) }))} />
        </TableToolbar>
        <DataTable
          columns={columns}
          rows={query.data?.data}
          rowKey={(t) => t.id}
          loading={query.isFetching && !query.data}
          error={query.error}
          onRetry={() => query.refetch()}
          meta={query.data?.meta}
          onPageChange={(p) => set({ page: p })}
          onRowClick={(t) => setPreviewing(t)}
          empty={<EmptyState icon={MessageSquareText} title="No templates" description="Start with the password-reset or order emails to match your brand's voice." />}
        />
      </Card>
      <TemplateDialog open={dialog.open} onOpenChange={(open) => setDialog((d) => ({ ...d, open }))} template={dialog.template} />
      <PreviewDialog template={previewing} onOpenChange={(o) => !o && setPreviewing(null)} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this template?"
        description={`${deleting?.name} goes back to PulseOps' built-in wording.`}
        confirmLabel="Delete template"
        destructive
        onConfirm={() => (deleting ? remove.mutateAsync(deleting) : undefined)}
      />
    </PageBody>
  );
}
