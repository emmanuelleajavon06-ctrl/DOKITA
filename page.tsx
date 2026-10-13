"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { api, refresh, signOut } from "@/lib/api";
import type { User } from "@/lib/types";

type Val = string | number | boolean | null;
type Row = { id: string } & Record<string, Val>;
interface Field { key: string; label: string; kind?: "text" | "textarea" | "number" | "bool" | "select"; options?: string[]; required?: boolean }
interface Entity { path: string; title: string; fields: Field[]; name: (r: Row) => string }

const PUB: Field = { key: "isPublished", label: "Publié", kind: "bool" };
const ORDER: Field = { key: "sortOrder", label: "Ordre d'affichage", kind: "number" };
const ENTITIES: Entity[] = [
  { path: "partners", title: "Partenaires", name: (r) => String(r.name), fields: [{ key: "name", label: "Nom", required: true }, { key: "logoUrl", label: "URL du logo (https://...)" }, { key: "websiteUrl", label: "Site web (https://...)" }, ORDER, PUB] },
  { path: "faqs", title: "FAQ", name: (r) => String(r.question), fields: [{ key: "question", label: "Question", required: true }, { key: "answer", label: "Réponse", kind: "textarea", required: true }, ORDER, PUB] },
  { path: "socials", title: "Réseaux sociaux", name: (r) => `${r.platform} - ${r.url}`, fields: [{ key: "platform", label: "Réseau", kind: "select", options: ["TIKTOK", "FACEBOOK", "INSTAGRAM", "YOUTUBE", "X", "LINKEDIN", "WHATSAPP"], required: true }, { key: "url", label: "Lien (https://...)", required: true }, ORDER, PUB] },
  { path: "pages", title: "Pages", name: (r) => `${r.title} (/pages/${r.slug})`, fields: [{ key: "slug", label: "Adresse (ex: a-propos)", required: true }, { key: "title", label: "Titre", required: true }, { key: "content", label: "Contenu (texte)", kind: "textarea", required: true }, PUB] },
];

function Manager({ e }: { e: Entity }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [form, setForm] = useState<Record<string, Val>>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const load = useCallback(() => api<Row[]>(`/admin/${e.path}`).then(setRows).catch((x: Error) => setMsg({ ok: false, t: x.message })), [e.path]);
  useEffect(() => { setForm({}); setEditId(null); setMsg(null); void load(); }, [e.path, load]);

  async function save(ev: FormEvent) {
    ev.preventDefault();
    const body: Record<string, Val> = {};
    for (const f of e.fields) {
      const v = form[f.key];
      if (f.kind === "bool") body[f.key] = v === undefined ? true : Boolean(v);
      else if (f.kind === "number") { if (v !== undefined && v !== "") body[f.key] = Number(v); }
      else if (typeof v === "string" && v.trim() !== "") body[f.key] = v.trim();
    }
    try {
      await api(editId ? `/admin/${e.path}/${editId}` : `/admin/${e.path}`, { method: editId ? "PATCH" : "POST", body: JSON.stringify(body) });
      setForm({}); setEditId(null); setMsg({ ok: true, t: "Enregistré." }); await load();
    } catch (x) { setMsg({ ok: false, t: x instanceof Error ? x.message : "Erreur" }); }
  }
  async function patch(r: Row, data: Record<string, Val>) { await api(`/admin/${e.path}/${r.id}`, { method: "PATCH", body: JSON.stringify(data) }); await load(); }
  async function del(r: Row) { if (confirm("Supprimer définitivement ?")) { await api(`/admin/${e.path}/${r.id}`, { method: "DELETE" }); await load(); } }

  return (
    <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", alignItems: "start" }}>
      <form className="card" onSubmit={save}>
        <h3 style={{ marginTop: 0 }}>{editId ? "Modifier" : "Ajouter"}</h3>
        {e.fields.map((f) => (
          <div key={f.key}>
            <label htmlFor={f.key}>{f.label}</label>
            {f.kind === "textarea" ? <textarea id={f.key} rows={5} required={f.required} value={String(form[f.key] ?? "")} onChange={(ev) => setForm({ ...form, [f.key]: ev.target.value })} />
              : f.kind === "select" ? <select id={f.key} required value={String(form[f.key] ?? "")} onChange={(ev) => setForm({ ...form, [f.key]: ev.target.value })}><option value="" disabled>Choisir</option>{f.options?.map((o) => <option key={o}>{o}</option>)}</select>
              : f.kind === "bool" ? <input id={f.key} type="checkbox" style={{ width: 20, height: 20 }} checked={form[f.key] === undefined ? true : Boolean(form[f.key])} onChange={(ev) => setForm({ ...form, [f.key]: ev.target.checked })} />
              : <input id={f.key} type={f.kind === "number" ? "number" : "text"} required={f.required} value={String(form[f.key] ?? "")} onChange={(ev) => setForm({ ...form, [f.key]: ev.target.value })} />}
          </div>
        ))}
        {msg && <div className={msg.ok ? "ok" : "err"}>{msg.t}</div>}
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button className="btn btn-p">{editId ? "Mettre à jour" : "Ajouter"}</button>
          {editId && <button type="button" className="btn btn-o" onClick={() => { setEditId(null); setForm({}); }}>Annuler</button>}
        </div>
      </form>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>{e.title} ({rows.length})</h3>
        {rows.length === 0 && <p className="muted">Aucun élément.</p>}
        {rows.map((r) => (
          <div className="row2" key={r.id}>
            <div style={{ minWidth: 0 }}><div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis" }}>{e.name(r)}</div><div className="muted">{r.isPublished ? "Publié" : "Masqué"}</div></div>
            <div style={{ display: "flex", gap: 6, flex: "none" }}>
              <button className="btn btn-o sm" onClick={() => void patch(r, { isPublished: !r.isPublished })}>{r.isPublished ? "Masquer" : "Publier"}</button>
              <button className="btn btn-o sm" onClick={() => { setEditId(r.id); setForm(r); }}>Modifier</button>
              <button className="btn btn-o sm" onClick={() => void del(r)}>Supprimer</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Photos() {
  const [items, setItems] = useState<Array<{ id: string; url: string; kind: string; alt: string | null }>>([]);
  const [kind, setKind] = useState("HERO");
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const load = useCallback(() => api<typeof items>("/admin/media").then(setItems).catch((x: Error) => setMsg({ ok: false, t: x.message })), []);
  useEffect(() => { void load(); }, [load]);
  async function upload(ev: ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file); fd.append("kind", kind);
    try { await api("/admin/media", { method: "POST", body: fd }); setMsg({ ok: true, t: "Photo ajoutée." }); await load(); } catch (x) { setMsg({ ok: false, t: x instanceof Error ? x.message : "Erreur" }); }
    ev.target.value = "";
  }
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Photos du site</h3>
      <p className="muted">JPEG, PNG ou WebP, 5 Mo maximum. « Bannière » s'affiche en haut de l'accueil, « Galerie » dans la section images.</p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <select style={{ width: 180 }} value={kind} onChange={(ev) => setKind(ev.target.value)}><option value="HERO">Bannière</option><option value="GALLERY">Galerie</option><option value="LOGO">Logo</option></select>
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(ev) => void upload(ev)} style={{ width: "auto" }} />
      </div>
      {msg && <div className={msg.ok ? "ok" : "err"}>{msg.t}</div>}
      <div className="gal" style={{ marginTop: 16 }}>
        {items.map((m) => (
          <div key={m.id}><img src={m.url} alt={m.alt ?? ""} style={{ borderRadius: 12, aspectRatio: "4/3", objectFit: "cover", width: "100%" }} />
            <div className="row2"><span className="muted">{m.kind}</span><button className="btn btn-o sm" onClick={() => void api(`/admin/media/${m.id}`, { method: "DELETE" }).then(load)}>Supprimer</button></div></div>
        ))}
      </div>
    </div>
  );
}

export default function Admin() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState("partners");
  useEffect(() => { void refresh().then((u) => (u ? setUser(u) : router.replace("/login"))); }, [router]);
  if (!user) return <div className="center">Chargement...</div>;
  if (user.role !== "SUPER_ADMIN") return <div className="center"><div className="box">Accès réservé à l'administrateur de la plateforme.</div></div>;
  const ent = ENTITIES.find((x) => x.path === tab);
  return (
    <main className="wrap" style={{ padding: "32px 20px 80px" }}>
      <div className="top">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}><img src="/logo.png" alt="SamaDokita" style={{ height: 44 }} /><div><strong>Espace administrateur</strong><div className="muted">{user.email}</div></div></div>
        <div style={{ display: "flex", gap: 8 }}><a className="btn btn-o" href="/" target="_blank">Voir le site</a><button className="btn btn-n" onClick={() => void signOut().then(() => router.replace("/login"))}>Déconnexion</button></div>
      </div>
      <div className="tabs">
        {[...ENTITIES.map((x) => [x.path, x.title]), ["photos", "Photos"]].map(([k, t]) => <button key={k} className={`tab ${tab === k ? "on" : ""}`} onClick={() => setTab(k as string)}>{t}</button>)}
      </div>
      {ent ? <Manager key={ent.path} e={ent} /> : <Photos />}
    </main>
  );
}
