"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  LayoutDashboard,
  Briefcase,
  MessageCircle,
  Trash2,
  Plus,
  Pencil,
  Save,
  X,
  Phone,
  Mail,
  Send,
  Loader2,
  History,
  CheckCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import emailjs from "@emailjs/browser";
import { supabase } from "./supabaseClient";

// 🔴 EMAIL KEYS (Keep these)
const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!;
const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!;

interface Client {
  id: number;
  name: string;
  email: string;
  service: string;
  status: string;
  phone: string;
}

// ✅ UPDATED: Added 'message'
interface EmailLog {
  id: number;
  client_name: string;
  email: string;
  subject: string;
  message: string; // New field
  created_at: string;
  status: string;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const [clients, setClients] = useState<Client[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Client>>({});

  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [emailData, setEmailData] = useState({
    to: "",
    name: "",
    subject: "",
    message: "",
  });
  const [isSending, setIsSending] = useState(false);

  // ✅ NEW: Track which history row is expanded
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

  // --- 1. LOAD DATA ---
  const fetchAllData = async () => {
    setIsLoading(true);

    const clientsData = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });
    const logsData = await supabase
      .from("email_logs")
      .select("*")
      .order("created_at", { ascending: false });

    if (clientsData.error || logsData.error) {
      console.error("Error fetching data");
    } else {
      setClients(clientsData.data || []);
      setEmailLogs(logsData.data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // --- 2. ADD CLIENT ---
  const addFakeClient = async () => {
    setIsSaving(true);
    const newClientData = {
      name: "New Customer",
      email: "",
      service: "New Service",
      status: "Pending",
      phone: "8801",
    };
    const { data, error } = await supabase
      .from("clients")
      .insert([newClientData])
      .select();
    if (data) {
      const createdClient = data[0];
      setClients([createdClient, ...clients]);
      setActiveTab("clients");
      setEditingId(createdClient.id);
      setEditFormData(createdClient);
    }
    setIsSaving(false);
  };

  // --- 3. SAVE EDITS ---
  const handleSave = async (id: number) => {
    setIsSaving(true);
    const { error } = await supabase
      .from("clients")
      .update(editFormData)
      .eq("id", id);
    if (!error) {
      const updatedClients = clients.map((client) =>
        client.id === id ? ({ ...client, ...editFormData } as Client) : client
      );
      setClients(updatedClients);
      setEditingId(null);
    }
    setIsSaving(false);
  };

  // --- 4. DELETE CLIENT ---
  const deleteClient = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (!error) setClients(clients.filter((c) => c.id !== id));
  };

  // --- HELPERS ---
  const handleEditClick = (client: Client) => {
    setEditingId(client.id);
    setEditFormData(client);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const openEmailModal = (client: Client) => {
    setEmailData({
      to: client.email,
      name: client.name,
      subject: "Update regarding your service",
      message: `Hi ${client.name},\n\nWe wanted to update you about your service request for ${client.service}.\n\nBest,\nServiceCRM Team`,
    });
    setIsEmailOpen(true);
  };

  const toggleLogExpansion = (id: number) => {
    if (expandedLogId === id) setExpandedLogId(null); // Close if already open
    else setExpandedLogId(id); // Open this one
  };

  // --- 5. SEND EMAIL & SAVE MESSAGE TO DB ---
  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);

    const templateParams = {
      to_email: emailData.to,
      to_name: emailData.name,
      subject: emailData.subject,
      message: emailData.message,
    };

    emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY).then(
      async (response) => {
        alert(`Email Sent Successfully to ${emailData.to}`);

        // ✅ NOW SAVING 'message' TO DB
        const newLogData = {
          client_name: emailData.name,
          email: emailData.to,
          subject: emailData.subject,
          message: emailData.message, // Saving body
          status: "Sent",
        };

        const { data } = await supabase
          .from("email_logs")
          .insert([newLogData])
          .select();
        if (data) setEmailLogs([data[0], ...emailLogs]);

        setIsEmailOpen(false);
        setIsSending(false);
      },
      (err) => {
        alert("Failed to send email.");
        setIsSending(false);
      }
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 font-sans relative">
      {/* EMAIL MODAL */}
      {isEmailOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
              <h3 className="font-semibold flex items-center gap-2">
                <Mail size={20} /> Compose Email
              </h3>
              <button
                onClick={() => setIsEmailOpen(false)}
                className="hover:bg-blue-700 p-1 rounded"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To
                </label>
                <input
                  disabled
                  value={`${emailData.name} <${emailData.to}>`}
                  className="w-full bg-gray-100 border border-gray-300 rounded-lg p-2 text-sm text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  value={emailData.subject}
                  onChange={(e) =>
                    setEmailData({ ...emailData, subject: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  rows={6}
                  value={emailData.message}
                  onChange={(e) =>
                    setEmailData({ ...emailData, message: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t flex justify-end gap-2">
              <button
                onClick={() => setIsEmailOpen(false)}
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={isSending}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <Send size={16} /> Send
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-blue-600">ServiceCRM</h1>
        </div>
        <nav className="px-4 space-y-2">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium cursor-pointer ${
              activeTab === "dashboard"
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button
            onClick={() => setActiveTab("clients")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium cursor-pointer ${
              activeTab === "clients"
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Users size={20} /> Clients
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium cursor-pointer ${
              activeTab === "history"
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <History size={20} /> Email History
          </button>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-gray-200 p-6 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold capitalize">
              {activeTab} Overview
            </h2>
            {isLoading && (
              <Loader2 size={16} className="animate-spin text-gray-400" />
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchAllData}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Refresh Data"
            >
              <RefreshCw size={18} />
            </button>
            {activeTab === "clients" && (
              <button
                onClick={addFakeClient}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 cursor-pointer transition-transform active:scale-95 disabled:opacity-50"
              >
                {isSaving ? (
                  "Saving..."
                ) : (
                  <>
                    <Plus size={16} /> New Client
                  </>
                )}
              </button>
            )}
          </div>
        </header>

        <div className="p-6 space-y-6">
          {activeTab === "dashboard" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Clients</p>
                  <h3 className="text-2xl font-bold">
                    {isLoading ? "..." : clients.length}
                  </h3>
                </div>
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <Users size={20} />
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Emails Sent</p>
                  <h3 className="text-2xl font-bold">{emailLogs.length}</h3>
                </div>
                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                  <Mail size={20} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "clients" && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="px-6 py-4 font-medium">Client Info</th>
                      <th className="px-6 py-4 font-medium">Service</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {clients.length === 0 && !isLoading ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="p-8 text-center text-gray-400"
                        >
                          No clients found in Database.
                        </td>
                      </tr>
                    ) : (
                      clients.map((client) => (
                        <tr
                          key={client.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          {editingId === client.id ? (
                            <>
                              <td className="px-6 py-4 space-y-2">
                                <input
                                  type="text"
                                  name="name"
                                  value={editFormData.name || ""}
                                  onChange={handleInputChange}
                                  className="border p-2 rounded w-full"
                                  placeholder="Name"
                                />
                                <input
                                  type="text"
                                  name="email"
                                  value={editFormData.email || ""}
                                  onChange={handleInputChange}
                                  className="border p-2 rounded w-full"
                                  placeholder="Email"
                                />
                                <input
                                  type="text"
                                  name="phone"
                                  value={editFormData.phone || ""}
                                  onChange={handleInputChange}
                                  className="border p-2 rounded w-full"
                                  placeholder="Phone"
                                />
                              </td>
                              <td className="px-6 py-4">
                                <input
                                  type="text"
                                  name="service"
                                  value={editFormData.service || ""}
                                  onChange={handleInputChange}
                                  className="border p-2 rounded w-full"
                                />
                              </td>
                              <td className="px-6 py-4">
                                <select
                                  name="status"
                                  value={editFormData.status || "Pending"}
                                  onChange={handleInputChange}
                                  className="border p-2 rounded w-full"
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="In Progress">
                                    In Progress
                                  </option>
                                  <option value="Completed">Completed</option>
                                </select>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button
                                  onClick={() => handleSave(client.id)}
                                  disabled={isSaving}
                                  className="mr-2 p-2 bg-green-100 text-green-600 rounded hover:bg-green-200 cursor-pointer"
                                >
                                  <Save size={16} />
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 cursor-pointer"
                                >
                                  <X size={16} />
                                </button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-6 py-4">
                                <div className="font-medium text-gray-900">
                                  {client.name}
                                </div>
                                <div className="text-gray-500 text-xs">
                                  {client.email}
                                </div>
                                <div className="text-gray-500 text-xs">
                                  {client.phone}
                                </div>
                              </td>
                              <td className="px-6 py-4">{client.service}</td>
                              <td className="px-6 py-4">
                                <span
                                  className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    client.status === "Completed"
                                      ? "bg-green-100 text-green-800"
                                      : client.status === "Pending"
                                      ? "bg-orange-100 text-orange-800"
                                      : "bg-blue-100 text-blue-800"
                                  }`}
                                >
                                  {client.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => handleEditClick(client)}
                                    className="p-2 hover:bg-gray-100 rounded text-gray-500 cursor-pointer"
                                    title="Edit"
                                  >
                                    <Pencil size={16} />
                                  </button>
                                  <button
                                    onClick={() =>
                                      window.open(
                                        `https://wa.me/${client.phone}`,
                                        "_blank"
                                      )
                                    }
                                    className="p-2 hover:bg-green-50 rounded text-green-600 cursor-pointer"
                                    title="WhatsApp"
                                  >
                                    <MessageCircle size={16} />
                                  </button>
                                  <button
                                    onClick={() => openEmailModal(client)}
                                    className="p-2 hover:bg-blue-50 rounded text-blue-600 cursor-pointer"
                                    title="Compose Email"
                                  >
                                    <Mail size={16} />
                                  </button>
                                  <button
                                    onClick={() => deleteClient(client.id)}
                                    className="p-2 hover:bg-red-50 rounded text-red-500 cursor-pointer"
                                    title="Delete"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* HISTORY TAB */}
          {activeTab === "history" && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="px-6 py-4 font-medium">Date</th>
                      <th className="px-6 py-4 font-medium">To</th>
                      <th className="px-6 py-4 font-medium">Subject</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {emailLogs.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-8 text-center text-gray-500"
                        >
                          No emails sent yet.
                        </td>
                      </tr>
                    ) : (
                      emailLogs.map((log) => {
                        const dateObj = new Date(log.created_at);
                        const dateStr = dateObj.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        });
                        const timeStr = dateObj.toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        });

                        return (
                          <React.Fragment key={log.id}>
                            {/* MAIN ROW (Clickable) */}
                            <tr
                              onClick={() => toggleLogExpansion(log.id)}
                              className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                                expandedLogId === log.id ? "bg-blue-50" : ""
                              }`}
                            >
                              <td className="px-6 py-4">
                                <div className="font-medium text-gray-700">
                                  {dateStr}
                                </div>
                                <div className="text-gray-400 text-xs font-mono">
                                  {timeStr}
                                </div>
                              </td>
                              <td className="px-6 py-4 font-medium">
                                {log.client_name}
                                <div className="text-gray-400 text-xs">
                                  {log.email}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-gray-600">
                                {log.subject}
                              </td>
                              <td className="px-6 py-4">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <CheckCircle size={12} /> {log.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-gray-400">
                                {expandedLogId === log.id ? (
                                  <ChevronUp size={16} />
                                ) : (
                                  <ChevronDown size={16} />
                                )}
                              </td>
                            </tr>

                            {/* EXPANDED ROW (Message Body) */}
                            {expandedLogId === log.id && (
                              <tr className="bg-gray-50 animate-in slide-in-from-top-2 duration-200">
                                <td colSpan={5} className="px-6 py-4">
                                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                      Message Content
                                    </h4>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                      {log.message ||
                                        "No message content saved."}
                                    </p>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
