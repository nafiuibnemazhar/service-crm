"use client";
import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  ExternalLink,
  Copy,
  Trash2,
  Shield,
  Globe,
  Key,
} from "lucide-react";
import { supabase } from "../supabaseClient";

interface Asset {
  id: number;
  title: string;
  url: string;
  credentials: string;
}

interface Props {
  client: { id: number; name: string };
  onClose: () => void;
}

export default function AssetsManager({ client, onClose }: Props) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAsset, setNewAsset] = useState({
    title: "",
    url: "",
    credentials: "",
  });
  const [showPass, setShowPass] = useState<number | null>(null);

  useEffect(() => {
    fetchAssets();
  }, [client]);

  const fetchAssets = async () => {
    const { data } = await supabase
      .from("client_assets")
      .select("*")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false });
    if (data) setAssets(data);
    setLoading(false);
  };

  const addAsset = async () => {
    if (!newAsset.title) return;
    const { data } = await supabase
      .from("client_assets")
      .insert([{ ...newAsset, client_id: client.id }])
      .select();
    if (data) {
      setAssets([data[0], ...assets]);
      setNewAsset({ title: "", url: "", credentials: "" });
    }
  };

  const deleteAsset = async (id: number) => {
    if (!confirm("Remove this asset?")) return;
    setAssets(assets.filter((a) => a.id !== id));
    await supabase.from("client_assets").delete().eq("id", id);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied!");
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Drawer */}
      <div className="relative w-full max-w-md h-full shadow-2xl p-6 flex flex-col animate-in slide-in-from-right duration-300 card-base border-l">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Shield size={24} className="text-blue-600" /> Asset Vault
            </h2>
            <p className="text-sub text-sm">
              Managing assets for{" "}
              <span className="font-semibold text-[var(--text-main)]">
                {client.name}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:opacity-80 rounded-full transition-colors"
          >
            <X size={20} className="text-sub" />
          </button>
        </div>

        {/* Add New Asset Form */}
        <div className="mb-6 space-y-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-main)] shadow-sm">
          <h3 className="text-xs font-bold text-sub uppercase tracking-wider mb-2">
            Add New Asset
          </h3>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Title (e.g. GMB Link, WP Admin)"
              className="w-full p-2 rounded-lg text-sm input-base focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              value={newAsset.title}
              onChange={(e) =>
                setNewAsset({ ...newAsset, title: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="URL (https://...)"
              className="w-full p-2 rounded-lg text-sm input-base focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
              value={newAsset.url}
              onChange={(e) =>
                setNewAsset({ ...newAsset, url: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Login / Notes (Optional)"
              className="w-full p-2 rounded-lg text-sm input-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={newAsset.credentials}
              onChange={(e) =>
                setNewAsset({ ...newAsset, credentials: e.target.value })
              }
            />
          </div>
          <button
            onClick={addAsset}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-bold text-sm shadow-sm flex justify-center gap-2 items-center"
          >
            <Plus size={16} /> Save to Vault
          </button>
        </div>

        {/* Asset List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="p-4 rounded-xl border border-[var(--border)] card-base hover:border-blue-500 transition-all group shadow-sm"
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-sm flex items-center gap-2">
                  {asset.url ? (
                    <Globe size={14} className="text-blue-500" />
                  ) : (
                    <Key size={14} className="text-orange-500" />
                  )}
                  {asset.title}
                </h4>
                <button
                  onClick={() => deleteAsset(asset.id)}
                  className="text-sub hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {asset.url && (
                <div className="flex items-center gap-2 mb-2 p-2 bg-[var(--bg-main)] rounded border border-[var(--border)]">
                  <p className="text-xs text-sub truncate flex-1 font-mono">
                    {asset.url}
                  </p>
                  <button
                    onClick={() => copyToClipboard(asset.url)}
                    title="Copy"
                    className="text-sub hover:text-blue-500"
                  >
                    <Copy size={12} />
                  </button>
                  <a
                    href={asset.url}
                    target="_blank"
                    rel="noreferrer"
                    title="Open"
                    className="text-sub hover:text-blue-500"
                  >
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}

              {asset.credentials && (
                <div className="relative mt-2">
                  <div
                    className={`text-xs p-2 rounded font-mono cursor-pointer transition-colors ${
                      showPass === asset.id
                        ? "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300"
                        : "bg-[var(--bg-main)] text-sub blur-sm hover:blur-none"
                    }`}
                    onClick={() =>
                      setShowPass(showPass === asset.id ? null : asset.id)
                    }
                  >
                    {asset.credentials}
                  </div>
                  <span className="absolute top-0 right-0 text-[10px] text-sub pointer-events-none p-2">
                    {showPass === asset.id
                      ? "Click to hide"
                      : "Hover/Click to reveal"}
                  </span>
                </div>
              )}
            </div>
          ))}
          {!loading && assets.length === 0 && (
            <div className="text-center text-sub text-sm py-10">
              Vault is empty.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
