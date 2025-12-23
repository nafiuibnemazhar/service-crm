"use client";
import React, { useState } from "react";
import {
  Search,
  Plus,
  Filter,
  UserPlus,
  Trash2,
  Flame,
  ArrowRight,
} from "lucide-react";
import { supabase } from "../supabaseClient";

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  type: string;
  lead_score: number;
  pipeline_stage: string;
  notes: string;
}

interface Props {
  leads: Client[];
  refreshData: () => void;
}

export default function LeadsView({ leads, refreshData }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newLead, setNewLead] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });

  // Filter Logic
  const filteredLeads = leads.filter((l) =>
    l.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Add Lead
  const handleAddLead = async () => {
    if (!newLead.name) return;
    const { error } = await supabase
      .from("clients")
      .insert([
        { ...newLead, type: "lead", lead_score: 10, pipeline_stage: "New" },
      ]);
    if (!error) {
      refreshData();
      setIsAdding(false);
      setNewLead({ name: "", email: "", phone: "", notes: "" });
    }
  };

  // Update Score/Stage
  const updateLead = async (id: number, field: string, value: any) => {
    await supabase
      .from("clients")
      .update({ [field]: value })
      .eq("id", id);
    refreshData();
  };

  // Convert to Client
  const convertToClient = async (id: number) => {
    if (!confirm("Convert this Lead to a paying Client?")) return;
    await supabase
      .from("clients")
      .update({ type: "client", status: "Pending" })
      .eq("id", id);
    refreshData();
  };

  // Delete
  const deleteLead = async (id: number) => {
    if (!confirm("Delete this lead?")) return;
    await supabase.from("clients").delete().eq("id", id);
    refreshData();
  };

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center card-base p-4 rounded-xl shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-3 text-sub" size={20} />
          <input
            type="text"
            placeholder="Search leads..."
            className="w-full pl-10 pr-4 py-2 rounded-lg input-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg flex gap-2 items-center text-sm md:text-base hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={18} /> Add Lead
        </button>
      </div>

      {/* Quick Add Form */}
      {isAdding && (
        <div className="card-base p-4 rounded-xl shadow-inner bg-blue-50 dark:bg-blue-900/10 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-1">
            <label className="text-xs text-sub">Name</label>
            <input
              className="w-full input-base p-2 rounded"
              value={newLead.name}
              onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-sub">Email</label>
            <input
              className="w-full input-base p-2 rounded"
              value={newLead.email}
              onChange={(e) =>
                setNewLead({ ...newLead, email: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-sub">Phone</label>
            <input
              className="w-full input-base p-2 rounded"
              value={newLead.phone}
              onChange={(e) =>
                setNewLead({ ...newLead, phone: e.target.value })
              }
            />
          </div>
          <button
            onClick={handleAddLead}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Save Lead
          </button>
        </div>
      )}

      {/* Leads Table */}
      <div className="card-base rounded-xl shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[900px]">
          <thead className="bg-[var(--bg-main)] text-sub">
            <tr>
              <th className="px-6 py-4">Lead Name</th>
              <th className="px-6 py-4">Score (0-100)</th>
              <th className="px-6 py-4">Stage</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {filteredLeads.map((lead) => (
              <tr
                key={lead.id}
                className="hover:bg-[var(--bg-main)] transition-colors"
              >
                <td className="px-6 py-4 font-medium">
                  {lead.name}
                  <div className="text-xs text-sub flex gap-2 mt-1">
                    {lead.email} {lead.phone && `• ${lead.phone}`}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      className="w-16 input-base p-1 rounded text-center"
                      value={lead.lead_score || 0}
                      onChange={(e) =>
                        updateLead(lead.id, "lead_score", e.target.value)
                      }
                    />
                    {(lead.lead_score || 0) > 70 && (
                      <Flame
                        size={16}
                        className="text-orange-500 animate-pulse"
                      />
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <select
                    className="input-base p-1 rounded text-xs"
                    value={lead.pipeline_stage || "New"}
                    onChange={(e) =>
                      updateLead(lead.id, "pipeline_stage", e.target.value)
                    }
                  >
                    <option>New</option>
                    <option>Contacted</option>
                    <option>Qualified</option>
                    <option>Proposal</option>
                    <option>Negotiation</option>
                  </select>
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <button
                    onClick={() => convertToClient(lead.id)}
                    className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-lg text-xs font-medium flex items-center gap-1 hover:bg-green-200"
                  >
                    Convert <ArrowRight size={12} />
                  </button>
                  <button
                    onClick={() => deleteLead(lead.id)}
                    className="p-2 text-sub hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {filteredLeads.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-sub">
                  No leads found. Add one above!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
