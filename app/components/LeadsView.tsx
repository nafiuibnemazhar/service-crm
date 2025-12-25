"use client";
import React, { useState } from "react";
import {
  Search,
  Plus,
  Filter,
  UserPlus,
  Trash2,
  ArrowRight,
  Calendar,
  Globe,
  Linkedin,
  MessageCircle,
  Link as LinkIcon,
} from "lucide-react";
import { supabase } from "../supabaseClient";

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  type: string;
  source: string; // ✅ CHANGED
  next_follow_up: string; // ✅ CHANGED
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
    source: "Website",
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
      .insert([{ ...newLead, type: "lead", pipeline_stage: "New" }]);
    if (!error) {
      refreshData();
      setIsAdding(false);
      setNewLead({ name: "", email: "", phone: "", source: "Website" });
    }
  };

  // Update Fields
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

  const deleteLead = async (id: number) => {
    if (!confirm("Delete this lead?")) return;
    await supabase.from("clients").delete().eq("id", id);
    refreshData();
  };

  // Helper to get Source Icon
  const getSourceIcon = (source: string) => {
    switch (source) {
      case "LinkedIn":
        return <Linkedin size={14} className="text-blue-700" />;
      case "Referral":
        return <MessageCircle size={14} className="text-green-600" />;
      case "Upwork":
        return (
          <div className="text-[10px] font-bold text-green-600 border border-green-600 rounded px-1">
            UP
          </div>
        );
      default:
        return <Globe size={14} className="text-sub" />;
    }
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
        <div className="card-base p-4 rounded-xl shadow-inner bg-blue-50 dark:bg-blue-900/10 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
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
          <div className="space-y-1">
            <label className="text-xs text-sub">Source</label>
            <select
              className="w-full input-base p-2 rounded"
              value={newLead.source}
              onChange={(e) =>
                setNewLead({ ...newLead, source: e.target.value })
              }
            >
              <option>Website</option>
              <option>LinkedIn</option>
              <option>Referral</option>
              <option>Upwork</option>
              <option>Cold Call</option>
            </select>
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
        <table className="w-full text-left text-sm min-w-225">
          <thead className="bg-(--bg-main) text-sub">
            <tr>
              <th className="px-6 py-4">Lead Name</th>
              <th className="px-6 py-4">Source & Follow Up</th>
              <th className="px-6 py-4">Stage</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-(--border)">
            {filteredLeads.map((lead) => (
              <tr
                key={lead.id}
                className="hover:bg-(--bg-main) transition-colors"
              >
                <td className="px-6 py-4 font-medium">
                  {lead.name}
                  <div className="text-xs text-sub flex gap-2 mt-1">
                    {lead.email} {lead.phone && `• ${lead.phone}`}
                  </div>
                </td>

                {/* ✅ NEW SOURCE & FOLLOW UP COLUMN */}
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-(--bg-main) border border-(--border)">
                        {getSourceIcon(lead.source)}
                      </div>
                      <select
                        className="bg-transparent text-xs font-medium outline-none cursor-pointer hover:text-blue-500"
                        value={lead.source || "Website"}
                        onChange={(e) =>
                          updateLead(lead.id, "source", e.target.value)
                        }
                      >
                        <option>Website</option>
                        <option>LinkedIn</option>
                        <option>Referral</option>
                        <option>Upwork</option>
                        <option>Cold Call</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-sub">
                      <Calendar size={12} />
                      <input
                        type="date"
                        className="bg-transparent outline-none w-24 hover:text-blue-500 cursor-pointer"
                        value={lead.next_follow_up || ""}
                        onChange={(e) =>
                          updateLead(lead.id, "next_follow_up", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <select
                    className={`input-base px-2 py-1 rounded text-xs font-medium border ${
                      lead.pipeline_stage === "Negotiation"
                        ? "border-blue-500 text-blue-500"
                        : "border-(--border)"
                    }`}
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
