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
  Mail,
  Loader2,
  History,
  CheckCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  LogIn,
  DollarSign,
  TrendingUp,
  Settings,
  User,
} from "lucide-react";
import emailjs from "@emailjs/browser";
import { supabase } from "./supabaseClient";
import AuthScreen from "./components/AuthScreen";
// CHARTS
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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
  price: number;
}

interface EmailLog {
  id: number;
  client_name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
  status: string;
}

// ✅ NEW INTERFACE FOR SETTINGS
interface AdminSettings {
  id?: number;
  full_name: string;
  company_name: string;
  avatar_url: string;
}

export default function Dashboard() {
  // --- AUTH ---
  const [session, setSession] = useState<any>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  // --- DATA ---
  const [activeTab, setActiveTab] = useState("dashboard");
  const [clients, setClients] = useState<Client[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  // ✅ NEW SETTINGS STATE
  const [settings, setSettings] = useState<AdminSettings>({
    full_name: "Admin",
    company_name: "ServiceCRM",
    avatar_url: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // --- EDITING / FORMS ---
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Client>>({});

  // --- EMAIL MODAL ---
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [emailData, setEmailData] = useState({
    to: "",
    name: "",
    subject: "",
    message: "",
  });
  const [isSending, setIsSending] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

  // --- INIT ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSessionLoading(false);
      if (session) fetchAllData();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchAllData();
      else {
        setClients([]);
        setEmailLogs([]);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

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
    // ✅ FETCH SETTINGS
    const settingsData = await supabase.from("settings").select("*").single();

    if (clientsData.data) setClients(clientsData.data);
    if (logsData.data) setEmailLogs(logsData.data);

    // If settings exist, load them. If not, the default state is used.
    if (settingsData.data) setSettings(settingsData.data);

    setIsLoading(false);
  };

  const handleLogout = async () => await supabase.auth.signOut();

  // --- SETTINGS ACTIONS ---
  const saveSettings = async () => {
    setIsSaving(true);
    // Check if we already have a row (id exists)
    if (settings.id) {
      await supabase
        .from("settings")
        .update({
          full_name: settings.full_name,
          company_name: settings.company_name,
          avatar_url: settings.avatar_url,
        })
        .eq("id", settings.id);
    } else {
      // Create first row
      const { data } = await supabase
        .from("settings")
        .insert([settings])
        .select();
      if (data) setSettings(data[0]);
    }
    alert("Settings Saved!");
    setIsSaving(false);
  };

  // --- CLIENT ACTIONS ---
  const addFakeClient = async () => {
    setIsSaving(true);
    const newClientData = {
      name: "New Customer",
      email: "",
      service: "Service Name",
      status: "Pending",
      phone: "8801",
      price: 0,
    };
    const { data } = await supabase
      .from("clients")
      .insert([newClientData])
      .select();
    if (data) {
      setClients([data[0], ...clients]);
      setActiveTab("clients");
      setEditingId(data[0].id);
      setEditFormData(data[0]);
    }
    setIsSaving(false);
  };

  const handleSave = async (id: number) => {
    setIsSaving(true);
    const { error } = await supabase
      .from("clients")
      .update(editFormData)
      .eq("id", id);
    if (!error) {
      setClients(
        clients.map((c) =>
          c.id === id ? ({ ...c, ...editFormData } as Client) : c
        )
      );
      setEditingId(null);
    }
    setIsSaving(false);
  };

  const deleteClient = async (id: number) => {
    if (!confirm("Delete this client?")) return;
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (!error) setClients(clients.filter((c) => c.id !== id));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  // --- EMAIL ACTIONS ---
  const openEmailModal = (client: Client) => {
    setEmailData({
      to: client.email,
      name: client.name,
      subject: "Service Update",
      message: `Hi ${client.name},\n\nUpdate regarding your ${client.service}.\n\nBest,\n${settings.company_name}`,
    });
    setIsEmailOpen(true);
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    emailjs
      .send(
        SERVICE_ID,
        TEMPLATE_ID,
        {
          to_email: emailData.to,
          to_name: emailData.name,
          subject: emailData.subject,
          message: emailData.message,
        },
        PUBLIC_KEY
      )
      .then(
        async () => {
          alert(`Sent to ${emailData.to}`);
          const { data } = await supabase
            .from("email_logs")
            .insert([
              {
                client_name: emailData.name,
                email: emailData.to,
                subject: emailData.subject,
                message: emailData.message,
                status: "Sent",
              },
            ])
            .select();
          if (data) setEmailLogs([data[0], ...emailLogs]);
          setIsEmailOpen(false);
          setIsSending(false);
        },
        () => {
          alert("Failed.");
          setIsSending(false);
        }
      );
  };

  // --- ANALYTICS ---
  const totalRevenue = clients.reduce(
    (sum, client) => sum + (Number(client.price) || 0),
    0
  );
  const activeJobs = clients.filter((c) => c.status === "In Progress").length;
  const completedJobs = clients.filter((c) => c.status === "Completed").length;

  const chartData = clients.reduce((acc: any[], client) => {
    const existing = acc.find((item) => item.name === client.service);
    if (existing) {
      existing.revenue += Number(client.price) || 0;
    } else {
      acc.push({
        name: client.service || "Other",
        revenue: Number(client.price) || 0,
      });
    }
    return acc;
  }, []);

  if (sessionLoading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" />
      </div>
    );
  if (!session) return <AuthScreen />;

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 font-sans relative">
      {/* EMAIL MODAL */}
      {isEmailOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <h3 className="font-semibold text-lg">Send Email</h3>
            <textarea
              className="w-full border p-2 rounded"
              rows={5}
              value={emailData.message}
              onChange={(e) =>
                setEmailData({ ...emailData, message: e.target.value })
              }
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsEmailOpen(false)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={isSending}
                className="px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2"
              >
                {isSending ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Send size={16} />
                )}{" "}
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        {/* ✅ DYNAMIC COMPANY NAME */}
        <div className="p-6">
          <h1 className="text-2xl font-bold text-blue-600">
            {settings.company_name}
          </h1>
        </div>
        <nav className="px-4 space-y-2 flex-1">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${
              activeTab === "dashboard"
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button
            onClick={() => setActiveTab("clients")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${
              activeTab === "clients"
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Users size={20} /> Clients
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${
              activeTab === "history"
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <History size={20} /> History
          </button>
          {/* ✅ SETTINGS TAB */}
          <button
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${
              activeTab === "settings"
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Settings size={20} /> Settings
          </button>
        </nav>
        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="flex gap-2 text-gray-500 hover:text-red-600"
          >
            <LogIn className="rotate-180" /> Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto p-6">
        {/* TOP HEADER */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold capitalize">
              {activeTab} Overview
            </h2>
            {/* ✅ DYNAMIC WELCOME MESSAGE */}
            <p className="text-gray-500 text-sm">
              Welcome back, {settings.full_name}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* ✅ AVATAR DISPLAY */}
            {settings.avatar_url ? (
              <img
                src={settings.avatar_url}
                alt="Profile"
                className="w-10 h-10 rounded-full border border-gray-200 object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <User size={20} />
              </div>
            )}
            <button
              onClick={fetchAllData}
              className="p-2 bg-white border rounded-lg hover:bg-gray-50"
            >
              <RefreshCw size={20} className="text-gray-600" />
            </button>
            {activeTab === "clients" && (
              <button
                onClick={addFakeClient}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg flex gap-2 items-center"
              >
                <Plus size={18} /> Add Client
              </button>
            )}
          </div>
        </div>

        {/* DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* TOP CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl border shadow-sm">
                <div>
                  <p className="text-gray-500 text-sm">Total Revenue</p>
                  <h3 className="text-2xl font-bold mt-1">
                    ${totalRevenue.toLocaleString()}
                  </h3>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl border shadow-sm">
                <div>
                  <p className="text-gray-500 text-sm">Active Jobs</p>
                  <h3 className="text-2xl font-bold mt-1">{activeJobs}</h3>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl border shadow-sm">
                <div>
                  <p className="text-gray-500 text-sm">Completed</p>
                  <h3 className="text-2xl font-bold mt-1">{completedJobs}</h3>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl border shadow-sm">
                <div>
                  <p className="text-gray-500 text-sm">Avg. Deal</p>
                  <h3 className="text-2xl font-bold mt-1">
                    $
                    {clients.length > 0
                      ? Math.round(totalRevenue / clients.length)
                      : 0}
                  </h3>
                </div>
              </div>
            </div>

            {/* CHARTS AREA */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-96">
              {/* MAIN REVENUE CHART */}
              <div className="bg-white p-6 rounded-xl border shadow-sm lg:col-span-2 flex flex-col">
                <h3 className="font-semibold mb-6">Revenue by Service</h3>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="name"
                        fontSize={12}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        fontSize={12}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `$${v}`}
                      />
                      <Tooltip />
                      <Bar
                        dataKey="revenue"
                        fill="#4F46E5"
                        radius={[4, 4, 0, 0]}
                        barSize={40}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ✅ FIXED: JOB STATUS PANEL RESTORED */}
              <div className="bg-white p-6 rounded-xl border shadow-sm">
                <h3 className="font-semibold mb-4">Job Status</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      <span className="text-sm font-medium">In Progress</span>
                    </div>
                    <span className="font-bold">{activeJobs}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-sm font-medium">Completed</span>
                    </div>
                    <span className="font-bold">{completedJobs}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                      <span className="text-sm font-medium">Pending</span>
                    </div>
                    <span className="font-bold">
                      {clients.length - activeJobs - completedJobs}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CLIENTS */}
        {activeTab === "clients" && (
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Service</th>
                  <th className="px-6 py-4">Price ($)</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    {editingId === client.id ? (
                      <>
                        <td className="px-6 py-4 space-y-2">
                          <input
                            name="name"
                            value={editFormData.name}
                            onChange={handleInputChange}
                            className="border p-1 w-full rounded"
                          />
                          <input
                            name="email"
                            value={editFormData.email}
                            onChange={handleInputChange}
                            className="border p-1 w-full rounded"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            name="service"
                            value={editFormData.service}
                            onChange={handleInputChange}
                            className="border p-1 w-full rounded"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            name="price"
                            value={editFormData.price}
                            onChange={handleInputChange}
                            className="border p-1 w-20 rounded"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <select
                            name="status"
                            value={editFormData.status}
                            onChange={handleInputChange}
                            className="border p-1 rounded"
                          >
                            <option>Pending</option>
                            <option>In Progress</option>
                            <option>Completed</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleSave(client.id)}
                            className="text-green-600 mr-2"
                          >
                            <Save size={18} />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-red-500"
                          >
                            <X size={18} />
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 font-medium">
                          {client.name}
                          <div className="text-gray-400 text-xs">
                            {client.email}
                          </div>
                        </td>
                        <td className="px-6 py-4">{client.service}</td>
                        <td className="px-6 py-4 font-bold text-gray-700">
                          ${client.price}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              client.status === "Completed"
                                ? "bg-green-100 text-green-700"
                                : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {client.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingId(client.id);
                              setEditFormData(client);
                            }}
                            className="text-gray-500 hover:bg-gray-100 p-2 rounded"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => openEmailModal(client)}
                            className="text-blue-500 hover:bg-blue-50 p-2 rounded"
                          >
                            <Mail size={16} />
                          </button>
                          <button
                            onClick={() => deleteClient(client.id)}
                            className="text-red-500 hover:bg-red-50 p-2 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* HISTORY */}
        {activeTab === "history" && (
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">To</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {emailLogs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr
                      onClick={() =>
                        setExpandedLogId(
                          expandedLogId === log.id ? null : log.id
                        )
                      }
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        {new Date(log.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">{log.client_name}</td>
                      <td className="px-6 py-4">{log.subject}</td>
                      <td className="px-6 py-4 text-gray-400">
                        {expandedLogId === log.id ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </td>
                    </tr>
                    {expandedLogId === log.id && (
                      <tr className="bg-gray-50">
                        <td colSpan={4} className="px-6 py-4 text-gray-600">
                          {log.message || "No content."}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ✅ SETTINGS TAB UI */}
        {activeTab === "settings" && (
          <div className="max-w-2xl bg-white p-8 rounded-xl border shadow-sm">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Settings size={20} /> Admin Settings
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={settings.full_name}
                  onChange={(e) =>
                    setSettings({ ...settings, full_name: e.target.value })
                  }
                  className="w-full border p-2 rounded-lg"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company / CRM Name
                </label>
                <input
                  type="text"
                  value={settings.company_name}
                  onChange={(e) =>
                    setSettings({ ...settings, company_name: e.target.value })
                  }
                  className="w-full border p-2 rounded-lg"
                  placeholder="e.g. Prime Service"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profile Picture URL
                </label>
                <input
                  type="text"
                  value={settings.avatar_url}
                  onChange={(e) =>
                    setSettings({ ...settings, avatar_url: e.target.value })
                  }
                  className="w-full border p-2 rounded-lg"
                  placeholder="https://..."
                />
                <p className="text-xs text-gray-400 mt-1">
                  Paste a direct link to an image (e.g. from Imgur or LinkedIn)
                </p>
              </div>

              <button
                onClick={saveSettings}
                disabled={isSaving}
                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2"
              >
                {isSaving ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Save size={18} />
                )}{" "}
                Save Changes
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
