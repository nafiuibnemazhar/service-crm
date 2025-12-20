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
  FileText,
  Download,
  Send,
  Search,
  Filter,
  Menu,
} from "lucide-react";
import emailjs from "@emailjs/browser";
import { supabase } from "./supabaseClient";
import AuthScreen from "./components/AuthScreen";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// --- CONFIG ---
const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!;
const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!;

// --- INTERFACES ---
interface Client {
  id: number;
  name: string;
  email: string;
  service: string;
  status: string;
  phone: string;
  price: number;
  address: string;
  invoice_date: string;
  due_date: string;
  notes: string;
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

interface AdminSettings {
  id?: number;
  full_name: string;
  company_name: string;
  avatar_url: string;
}

export default function Dashboard() {
  // --- STATE ---
  const [session, setSession] = useState<any>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Data State
  const [clients, setClients] = useState<Client[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [settings, setSettings] = useState<AdminSettings>({
    full_name: "Admin",
    company_name: "ServiceCRM",
    avatar_url: "",
  });

  // UI State
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Client>>({});

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  // Email State
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [emailData, setEmailData] = useState({
    to: "",
    name: "",
    subject: "",
    message: "",
  });
  const [isSending, setIsSending] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

  // --- FILTER LOGIC ---
  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      (client.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.service || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === "All" || client.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // --- EFFECT: AUTH CHECK ---
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

  // --- DATA FUNCTIONS ---
  const fetchAllData = async () => {
    setIsLoading(true);

    const clientsResult = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });
    if (clientsResult.error)
      alert("Error fetching clients: " + clientsResult.error.message);
    else if (clientsResult.data) setClients(clientsResult.data);

    const logsResult = await supabase
      .from("email_logs")
      .select("*")
      .order("created_at", { ascending: false });
    if (logsResult.data) setEmailLogs(logsResult.data);

    const settingsResult = await supabase.from("settings").select("*").single();
    if (settingsResult.data) setSettings(settingsResult.data);

    setIsLoading(false);
  };

  const handleLogout = async () => await supabase.auth.signOut();

  const saveSettings = async () => {
    setIsSaving(true);
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
      const { data } = await supabase
        .from("settings")
        .insert([settings])
        .select();
      if (data) setSettings(data[0]);
    }
    alert("Settings Saved!");
    setIsSaving(false);
  };

  const addFakeClient = async () => {
    setIsSaving(true);
    const newClientData = {
      name: "New Customer",
      email: "",
      service: "Service Name",
      status: "Pending",
      phone: "",
      price: 0,
      address: "",
      invoice_date: new Date().toISOString().split("T")[0],
      due_date: null,
      notes: "",
    };
    const { data, error } = await supabase
      .from("clients")
      .insert([newClientData])
      .select();
    if (error) {
      alert("Error adding client: " + error.message);
    } else if (data) {
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
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "In Progress":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Pending":
        return "bg-orange-100 text-orange-700 border-orange-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  // --- INVOICE GENERATOR ---
  const generateInvoice = (client: Client) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("INVOICE", 105, 20, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(settings.company_name || "My Company", 20, 40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`From: ${settings.full_name || "Admin"}`, 20, 46);

    doc.setFont("helvetica", "bold");
    doc.text("Bill To:", 140, 40);
    doc.setFont("helvetica", "normal");
    doc.text(client.name, 140, 46);
    const splitAddress = doc.splitTextToSize(
      client.address || "No Address Provided",
      50
    );
    doc.text(splitAddress, 140, 52);

    doc.text(`Invoice #: INV-${client.id}`, 20, 70);
    doc.text(
      `Date: ${client.invoice_date || new Date().toLocaleDateString()}`,
      20,
      76
    );
    doc.text(`Due Date: ${client.due_date || "-"}`, 20, 82);

    autoTable(doc, {
      startY: 90,
      head: [["Description", "Amount"]],
      body: [[client.service, `$${client.price}`]],
      foot: [["Total", `$${client.price}`]],
      theme: "grid",
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    if (client.notes) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Notes / Terms:", 20, finalY);
      doc.setFont("helvetica", "normal");
      doc.text(doc.splitTextToSize(client.notes, 170), 20, finalY + 6);
    }
    doc.save(`Invoice_${client.name.replace(/\s+/g, "_")}.pdf`);
  };

  // --- EMAIL LOGIC ---
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

  // --- STATS CALC ---
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

  // --- RENDER ---
  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 font-sans relative">
      {/* EMAIL MODAL */}
      {isEmailOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <h3 className="font-semibold text-lg">Send Email</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                value={emailData.subject}
                onChange={(e) =>
                  setEmailData({ ...emailData, subject: e.target.value })
                }
                className="w-full border p-2 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                className="w-full border p-2 rounded-lg text-sm"
                rows={5}
                value={emailData.message}
                onChange={(e) =>
                  setEmailData({ ...emailData, message: e.target.value })
                }
              />
            </div>
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

      {/* SIDEBAR (Mobile Responsive) */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 flex flex-col`}
      >
        <div className="p-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">
            {settings.company_name}
          </h1>
          <button
            className="md:hidden text-gray-500"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={24} />
          </button>
        </div>
        <nav className="px-4 space-y-2 flex-1">
          <button
            onClick={() => {
              setActiveTab("dashboard");
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${
              activeTab === "dashboard"
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button
            onClick={() => {
              setActiveTab("clients");
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${
              activeTab === "clients"
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Users size={20} /> Clients
          </button>
          <button
            onClick={() => {
              setActiveTab("history");
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${
              activeTab === "history"
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <History size={20} /> History
          </button>
          <button
            onClick={() => {
              setActiveTab("settings");
              setMobileMenuOpen(false);
            }}
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
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 text-gray-600 bg-white border rounded-lg"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div>
              <h2 className="text-2xl font-bold capitalize">
                {activeTab} Overview
              </h2>
              <p className="text-gray-500 text-sm hidden md:block">
                Welcome back, {settings.full_name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
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
              title="Refresh"
            >
              <RefreshCw
                size={20}
                className={`text-gray-600 ${isLoading ? "animate-spin" : ""}`}
              />
            </button>
            {activeTab === "clients" && (
              <button
                onClick={addFakeClient}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg flex gap-2 items-center text-sm md:text-base"
              >
                <Plus size={18} />{" "}
                <span className="hidden md:inline">Add Client</span>
              </button>
            )}
          </div>
        </div>

        {/* DASHBOARD TAB */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                <div>
                  <p className="text-gray-500 text-sm font-medium">
                    Total Revenue
                  </p>
                  <h3 className="text-2xl font-bold mt-1 text-gray-800">
                    ${totalRevenue.toLocaleString()}
                  </h3>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                  <DollarSign size={24} />
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                <div>
                  <p className="text-gray-500 text-sm font-medium">
                    Active Jobs
                  </p>
                  <h3 className="text-2xl font-bold mt-1 text-gray-800">
                    {activeJobs}
                  </h3>
                </div>
                <div className="p-3 bg-orange-50 text-orange-600 rounded-full">
                  <Briefcase size={24} />
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Completed</p>
                  <h3 className="text-2xl font-bold mt-1 text-gray-800">
                    {completedJobs}
                  </h3>
                </div>
                <div className="p-3 bg-green-50 text-green-600 rounded-full">
                  <CheckCircle size={24} />
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Avg. Deal</p>
                  <h3 className="text-2xl font-bold mt-1 text-gray-800">
                    $
                    {clients.length > 0
                      ? Math.round(totalRevenue / clients.length)
                      : 0}
                  </h3>
                </div>
                <div className="p-3 bg-purple-50 text-purple-600 rounded-full">
                  <TrendingUp size={24} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-96">
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

        {/* CLIENTS TAB */}
        {activeTab === "clients" && (
          <div className="space-y-4">
            {/* Search & Filter */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
              <div className="relative w-full md:w-96">
                <Search
                  className="absolute left-3 top-3 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search clients..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Filter className="text-gray-500" size={20} />
                <select
                  className="border p-2 rounded-lg bg-gray-50 text-sm w-full md:w-auto"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-xl border shadow-sm overflow-hidden overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[800px]">
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
                  {filteredClients.map((client) => (
                    <tr
                      key={client.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {editingId === client.id ? (
                        <>
                          <td className="px-6 py-4" colSpan={5}>
                            <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg shadow-inner">
                              <div className="space-y-2">
                                <input
                                  name="name"
                                  value={editFormData.name}
                                  onChange={handleInputChange}
                                  className="border p-2 w-full rounded text-sm"
                                  placeholder="Client Name"
                                />
                                <input
                                  name="email"
                                  value={editFormData.email}
                                  onChange={handleInputChange}
                                  className="border p-2 w-full rounded text-sm"
                                  placeholder="Email Address"
                                />
                                <input
                                  name="phone"
                                  value={editFormData.phone}
                                  onChange={handleInputChange}
                                  className="border p-2 w-full rounded text-sm"
                                  placeholder="Phone"
                                />
                                <textarea
                                  name="address"
                                  value={editFormData.address || ""}
                                  onChange={handleInputChange}
                                  className="border p-2 w-full rounded text-sm h-20"
                                  placeholder="Billing Address..."
                                />
                              </div>
                              <div className="space-y-2">
                                <input
                                  name="service"
                                  value={editFormData.service}
                                  onChange={handleInputChange}
                                  className="border p-2 w-full rounded text-sm font-semibold"
                                  placeholder="Service Name"
                                />
                                <div className="flex gap-2">
                                  <input
                                    type="number"
                                    name="price"
                                    value={editFormData.price}
                                    onChange={handleInputChange}
                                    className="border p-2 w-full rounded text-sm"
                                    placeholder="Price $"
                                  />
                                  <select
                                    name="status"
                                    value={editFormData.status}
                                    onChange={handleInputChange}
                                    className="border p-2 w-full rounded text-sm"
                                  >
                                    <option>Pending</option>
                                    <option>In Progress</option>
                                    <option>Completed</option>
                                  </select>
                                </div>
                                <div className="flex gap-2">
                                  <div className="w-full">
                                    <label className="text-xs text-gray-500">
                                      Invoice Date
                                    </label>
                                    <input
                                      type="date"
                                      name="invoice_date"
                                      value={editFormData.invoice_date || ""}
                                      onChange={handleInputChange}
                                      className="border p-2 w-full rounded text-sm"
                                    />
                                  </div>
                                  <div className="w-full">
                                    <label className="text-xs text-gray-500">
                                      Due Date
                                    </label>
                                    <input
                                      type="date"
                                      name="due_date"
                                      value={editFormData.due_date || ""}
                                      onChange={handleInputChange}
                                      className="border p-2 w-full rounded text-sm"
                                    />
                                  </div>
                                </div>
                                <textarea
                                  name="notes"
                                  value={editFormData.notes || ""}
                                  onChange={handleInputChange}
                                  className="border p-2 w-full rounded text-sm h-16"
                                  placeholder="Payment Terms / Notes..."
                                />
                              </div>
                              <div className="col-span-2 flex justify-end gap-3 mt-2 border-t pt-3 border-blue-200">
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="px-4 py-2 text-gray-600 hover:bg-white rounded"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleSave(client.id)}
                                  className="px-6 py-2 bg-blue-600 text-white rounded shadow-sm hover:bg-blue-700 flex items-center gap-2"
                                >
                                  <Save size={16} /> Save Changes
                                </button>
                              </div>
                            </div>
                          </td>
                          <td className="hidden"></td>
                          <td className="hidden"></td>
                          <td className="hidden"></td>
                          <td className="hidden"></td>
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
                              className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                client.status
                              )}`}
                            >
                              {client.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right flex justify-end gap-2">
                            <button
                              onClick={() => generateInvoice(client)}
                              className="text-purple-600 hover:bg-purple-50 p-2 rounded"
                              title="Invoice"
                            >
                              <Download size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(client.id);
                                setEditFormData(client);
                              }}
                              className="text-gray-500 hover:bg-gray-100 p-2 rounded"
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
                              className="text-green-600 hover:bg-green-50 p-2 rounded"
                              title="WhatsApp"
                            >
                              <MessageCircle size={16} />
                            </button>
                            <button
                              onClick={() => openEmailModal(client)}
                              className="text-blue-500 hover:bg-blue-50 p-2 rounded"
                              title="Email"
                            >
                              <Mail size={16} />
                            </button>
                            <button
                              onClick={() => deleteClient(client.id)}
                              className="text-red-500 hover:bg-red-50 p-2 rounded"
                              title="Delete"
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
          </div>
        )}

        {/* HISTORY TAB */}
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
                        <td
                          colSpan={4}
                          className="px-6 py-4 text-gray-600 font-mono text-xs p-4 bg-gray-50 whitespace-pre-wrap"
                        >
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

        {/* SETTINGS TAB */}
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
