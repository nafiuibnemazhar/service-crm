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
  ClipboardList,
  CheckSquare,
  Square,
  ArrowRight,
  Calendar,
  Clock,
  Moon,
  Sun,
  MapPin,
  StickyNote,
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

interface Task {
  id: number;
  client_id: number;
  title: string;
  description: string;
  due_date: string;
  is_completed: boolean;
  created_at: string;
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
  const [darkMode, setDarkMode] = useState(false);

  // Data State
  const [clients, setClients] = useState<Client[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  // ✅ UPDATED DEFAULT NAME TO NAFTA24
  const [settings, setSettings] = useState<AdminSettings>({
    full_name: "Admin",
    company_name: "Nafta24",
    avatar_url: "",
  });
  const [globalTasks, setGlobalTasks] = useState<Task[]>([]);

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

  // Task Manager State
  const [isTaskDrawerOpen, setIsTaskDrawerOpen] = useState(false);
  const [activeTaskClient, setActiveTaskClient] = useState<Client | null>(null);
  const [clientTasks, setClientTasks] = useState<Task[]>([]);
  const [newTaskInput, setNewTaskInput] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskDate, setNewTaskDate] = useState("");

  // --- DARK MODE LOGIC ---
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (
      savedTheme === "dark" ||
      (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

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
    if (clientsResult.data) setClients(clientsResult.data);

    const logsResult = await supabase
      .from("email_logs")
      .select("*")
      .order("created_at", { ascending: false });
    if (logsResult.data) setEmailLogs(logsResult.data);

    const settingsResult = await supabase.from("settings").select("*").single();
    if (settingsResult.data) setSettings(settingsResult.data);

    const tasksResult = await supabase
      .from("tasks")
      .select("*")
      .eq("is_completed", false)
      .order("due_date", { ascending: true })
      .limit(20);
    if (tasksResult.data) setGlobalTasks(tasksResult.data);

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
    if (error) alert("Error adding client: " + error.message);
    else if (data) {
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
    if (!confirm("Delete this client and ALL their tasks?")) return;
    await supabase.from("tasks").delete().eq("client_id", id);
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
        return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
      case "In Progress":
        return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800";
      case "Pending":
        return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
    }
  };

  // --- TASK MANAGER LOGIC ---
  const openTaskDrawer = async (client: Client) => {
    setActiveTaskClient(client);
    setIsTaskDrawerOpen(true);
    setClientTasks([]);
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("client_id", client.id)
      .order("is_completed", { ascending: true })
      .order("due_date", { ascending: true });
    if (data) setClientTasks(data);
  };

  const addTask = async () => {
    if (!newTaskInput.trim() || !activeTaskClient) return;
    const { data } = await supabase
      .from("tasks")
      .insert([
        {
          client_id: activeTaskClient.id,
          title: newTaskInput,
          description: newTaskDesc,
          due_date: newTaskDate || null,
          is_completed: false,
        },
      ])
      .select();

    if (data) {
      const newTask = data[0];
      setClientTasks([...clientTasks, newTask]);
      if (newTask.due_date)
        setGlobalTasks(
          [...globalTasks, newTask].sort(
            (a, b) =>
              new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
          )
        );
      setNewTaskInput("");
      setNewTaskDesc("");
      setNewTaskDate("");
    }
  };

  const toggleTask = async (task: Task) => {
    const newStatus = !task.is_completed;
    setClientTasks(
      clientTasks.map((t) =>
        t.id === task.id ? { ...t, is_completed: newStatus } : t
      )
    );
    if (newStatus === true) {
      setGlobalTasks(globalTasks.filter((t) => t.id !== task.id));
    }
    await supabase
      .from("tasks")
      .update({ is_completed: newStatus })
      .eq("id", task.id);
  };

  const deleteTask = async (taskId: number) => {
    setClientTasks(clientTasks.filter((t) => t.id !== taskId));
    setGlobalTasks(globalTasks.filter((t) => t.id !== taskId));
    await supabase.from("tasks").delete().eq("id", taskId);
  };

  // --- INVOICE & EMAIL ---
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
    });
    doc.save(`Invoice_${client.name.replace(/\s+/g, "_")}.pdf`);
  };

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
      <div className="h-screen flex items-center justify-center bg-[var(--bg-main)]">
        <Loader2 className="animate-spin text-blue-600" />
      </div>
    );
  if (!session) return <AuthScreen />;

  // --- RENDER ---
  return (
    <div className="flex h-screen overflow-hidden font-sans relative transition-colors duration-300 bg-[var(--bg-main)] text-[var(--text-main)]">
      {/* TASK DRAWER */}
      {isTaskDrawerOpen && activeTaskClient && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsTaskDrawerOpen(false)}
          ></div>
          <div className="relative w-full max-w-md h-full shadow-2xl p-6 flex flex-col animate-in slide-in-from-right duration-300 card-base border-l">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold">{activeTaskClient.name}</h2>
                <p className="text-sub text-sm">Task Manager</p>
              </div>
              <button
                onClick={() => setIsTaskDrawerOpen(false)}
                className="p-2 hover:opacity-80 rounded-full transition-colors"
              >
                <X size={20} className="text-sub" />
              </button>
            </div>
            <div className="mb-2 flex justify-between text-xs font-semibold text-sub">
              <span>
                {clientTasks.filter((t) => t.is_completed).length} /{" "}
                {clientTasks.length} Completed
              </span>
            </div>
            <div className="mb-6 bg-gray-200 dark:bg-slate-700 rounded-full h-2.5 w-full overflow-hidden">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                style={{
                  width: `${
                    clientTasks.length > 0
                      ? (clientTasks.filter((t) => t.is_completed).length /
                          clientTasks.length) *
                        100
                      : 0
                  }%`,
                }}
              ></div>
            </div>

            <div className="mb-6 space-y-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-main)]">
              <input
                type="text"
                placeholder="Task Title..."
                className="w-full p-2 rounded-lg text-sm input-base focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                value={newTaskInput}
                onChange={(e) => setNewTaskInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTask()}
              />
              <textarea
                placeholder="Details (Optional)"
                className="w-full p-2 rounded-lg text-sm input-base h-16 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newTaskDesc}
                onChange={(e) => setNewTaskDesc(e.target.value)}
              ></textarea>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="date"
                    className="w-full p-2 pl-8 rounded-lg text-sm input-base focus:outline-none focus:ring-2 focus:ring-blue-500 text-sub"
                    value={newTaskDate}
                    onChange={(e) => setNewTaskDate(e.target.value)}
                  />
                  <Calendar
                    className="absolute left-2 top-2.5 text-sub"
                    size={16}
                  />
                </div>
                <button
                  onClick={addTask}
                  className="bg-blue-600 text-white px-4 rounded-lg hover:bg-blue-700 font-bold text-sm shadow-sm"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {clientTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-3 rounded-lg border group transition-all ${
                    task.is_completed
                      ? "bg-[var(--bg-main)] opacity-70"
                      : "card-base hover:border-blue-500 shadow-sm"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleTask(task)}
                      className="mt-1 flex-shrink-0 text-sub hover:text-blue-500"
                    >
                      {task.is_completed ? (
                        <CheckSquare size={20} className="text-green-500" />
                      ) : (
                        <Square size={20} />
                      )}
                    </button>
                    <div className="flex-1">
                      <p
                        className={`text-sm font-medium ${
                          task.is_completed ? "line-through text-sub" : ""
                        }`}
                      >
                        {task.title}
                      </p>
                      {task.due_date && (
                        <span className="text-xs text-sub flex items-center gap-1 mt-1">
                          <Clock size={12} />{" "}
                          {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-sub hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* EMAIL MODAL */}
      {isEmailOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="card-base rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <h3 className="font-semibold text-lg">Send Email</h3>
            <div>
              <label className="block text-sm font-medium text-sub mb-1">
                Subject
              </label>
              <input
                type="text"
                value={emailData.subject}
                onChange={(e) =>
                  setEmailData({ ...emailData, subject: e.target.value })
                }
                className="w-full p-2 rounded-lg text-sm input-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-sub mb-1">
                Message
              </label>
              <textarea
                className="w-full p-2 rounded-lg text-sm input-base focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="px-4 py-2 bg-[var(--bg-main)] rounded text-sub hover:opacity-80"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={isSending}
                className="px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2 hover:bg-blue-700"
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
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 card-base border-r border-[var(--border)] transform transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 flex flex-col`}
      >
        <div className="p-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">
            {settings.company_name}
          </h1>
          <button
            className="md:hidden text-sub"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={24} />
          </button>
        </div>
        <nav className="px-4 space-y-2 flex-1">
          {["dashboard", "clients", "history", "settings"].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors capitalize ${
                activeTab === tab
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                  : "text-sub hover:bg-[var(--bg-main)]"
              }`}
            >
              <LayoutDashboard size={20} /> {tab}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-[var(--border)] space-y-2">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg font-medium text-sub hover:bg-[var(--bg-main)] transition-colors"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}{" "}
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg font-medium text-sub hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogIn className="rotate-180" size={20} /> Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 transition-colors duration-200">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 text-sub card-base rounded-lg"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div>
              <h2 className="text-2xl font-bold capitalize">
                {activeTab} Overview
              </h2>
              <p className="text-sub text-sm hidden md:block">
                Welcome back, {settings.full_name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            {settings.avatar_url ? (
              <img
                src={settings.avatar_url}
                alt="Profile"
                className="w-10 h-10 rounded-full border border-[var(--border)] object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                <User size={20} />
              </div>
            )}
            <button
              onClick={fetchAllData}
              className="p-2 card-base rounded-lg hover:opacity-80 transition-colors"
              title="Refresh"
            >
              <RefreshCw
                size={20}
                className={`text-sub ${isLoading ? "animate-spin" : ""}`}
              />
            </button>
            {activeTab === "clients" && (
              <button
                onClick={addFakeClient}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg flex gap-2 items-center text-sm md:text-base hover:bg-blue-700 transition-colors shadow-sm"
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
              <div className="card-base p-6 rounded-xl shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                <div>
                  <p className="text-sub text-sm font-medium">Total Revenue</p>
                  <h3 className="text-2xl font-bold mt-1">
                    ${totalRevenue.toLocaleString()}
                  </h3>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-full">
                  <DollarSign size={24} />
                </div>
              </div>
              <div className="card-base p-6 rounded-xl shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                <div>
                  <p className="text-sub text-sm font-medium">Active Jobs</p>
                  <h3 className="text-2xl font-bold mt-1">{activeJobs}</h3>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-900/30 text-orange-600 rounded-full">
                  <Briefcase size={24} />
                </div>
              </div>
              <div className="card-base p-6 rounded-xl shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                <div>
                  <p className="text-sub text-sm font-medium">Completed</p>
                  <h3 className="text-2xl font-bold mt-1">{completedJobs}</h3>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-600 rounded-full">
                  <CheckCircle size={24} />
                </div>
              </div>
              <div className="card-base p-6 rounded-xl shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                <div>
                  <p className="text-sub text-sm font-medium">Avg. Deal</p>
                  <h3 className="text-2xl font-bold mt-1">
                    $
                    {clients.length > 0
                      ? Math.round(totalRevenue / clients.length)
                      : 0}
                  </h3>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-full">
                  <TrendingUp size={24} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
              {/* Chart */}
              <div className="card-base p-6 rounded-xl shadow-sm lg:col-span-4 flex flex-col h-[600px]">
                <h3 className="font-semibold mb-6">Revenue by Service</h3>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke={darkMode ? "#334155" : "#e2e8f0"}
                      />
                      <XAxis
                        dataKey="name"
                        fontSize={12}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: darkMode ? "#94a3b8" : "#64748b" }}
                      />
                      <YAxis
                        fontSize={12}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `$${v}`}
                        tick={{ fill: darkMode ? "#94a3b8" : "#64748b" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: darkMode ? "#1e293b" : "#fff",
                          borderColor: darkMode ? "#334155" : "#e2e8f0",
                          color: darkMode ? "#fff" : "#000",
                        }}
                      />
                      <Bar
                        dataKey="revenue"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                        barSize={40}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Status & Tasks */}
              <div className="lg:col-span-3 flex flex-col h-[600px] card-base rounded-xl shadow-sm overflow-hidden">
                <div className="flex border-b border-[var(--border)] divide-x divide-[var(--border)] bg-[var(--bg-main)]">
                  <div className="flex-1 p-3 text-center">
                    <span className="block text-xs text-sub uppercase font-bold tracking-wider">
                      Active
                    </span>
                    <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                      {activeJobs}
                    </span>
                  </div>
                  <div className="flex-1 p-3 text-center">
                    <span className="block text-xs text-sub uppercase font-bold tracking-wider">
                      Done
                    </span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      {completedJobs}
                    </span>
                  </div>
                  <div className="flex-1 p-3 text-center">
                    <span className="block text-xs text-sub uppercase font-bold tracking-wider">
                      Pending
                    </span>
                    <span className="text-lg font-bold text-sub">
                      {clients.length - activeJobs - completedJobs}
                    </span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col p-6 min-h-0">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <ClipboardList size={18} className="text-blue-500" />{" "}
                      Priority Tasks
                    </h3>
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-full">
                      {globalTasks.length} Pending
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {globalTasks.length > 0 ? (
                      globalTasks.map((task) => {
                        const clientName =
                          clients.find((c) => c.id === task.client_id)?.name ||
                          "Unknown";
                        return (
                          <div
                            key={task.id}
                            className="p-3 bg-[var(--bg-main)] rounded-lg border border-[var(--border)] hover:border-blue-500 transition-colors cursor-pointer group"
                            onClick={() => {
                              const client = clients.find(
                                (c) => c.id === task.client_id
                              );
                              if (client) openTaskDrawer(client);
                            }}
                          >
                            <div className="flex justify-between items-start">
                              <p className="text-sm font-semibold line-clamp-1 group-hover:text-blue-500">
                                {task.title}
                              </p>
                              {task.due_date && (
                                <span
                                  className={`text-[10px] whitespace-nowrap ml-2 ${
                                    new Date(task.due_date) < new Date()
                                      ? "text-red-500 font-bold"
                                      : "text-sub"
                                  }`}
                                >
                                  {new Date(task.due_date).toLocaleDateString(
                                    undefined,
                                    { month: "short", day: "numeric" }
                                  )}
                                </span>
                              )}
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <p className="text-xs text-sub font-medium">
                                {clientName}
                              </p>
                              <ArrowRight
                                size={14}
                                className="text-sub group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all"
                              />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-sub text-center">
                        <CheckCircle
                          size={32}
                          className="mb-2 text-green-500"
                        />
                        <p>All caught up!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CLIENTS TAB */}
        {activeTab === "clients" && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center card-base p-4 rounded-xl shadow-sm">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-3 text-sub" size={20} />
                <input
                  type="text"
                  placeholder="Search clients..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg input-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Filter className="text-sub" size={20} />
                <select
                  className="p-2 rounded-lg input-base text-sm w-full md:w-auto focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <div className="card-base rounded-xl shadow-sm overflow-hidden overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[1000px]">
                <thead className="bg-[var(--bg-main)] text-sub">
                  <tr>
                    <th className="px-6 py-4">Client</th>
                    <th className="px-6 py-4">Service</th>
                    <th className="px-6 py-4">Billing & Info</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredClients.map((client) => (
                    <tr
                      key={client.id}
                      className="hover:bg-[var(--bg-main)] transition-colors"
                    >
                      {editingId === client.id ? (
                        <td className="px-6 py-4" colSpan={5}>
                          <div className="grid grid-cols-2 gap-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg shadow-inner">
                            <div className="space-y-2">
                              <input
                                name="name"
                                value={editFormData.name}
                                onChange={handleInputChange}
                                className="input-base p-2 w-full rounded text-sm"
                                placeholder="Client Name"
                              />
                              <input
                                name="email"
                                value={editFormData.email}
                                onChange={handleInputChange}
                                className="input-base p-2 w-full rounded text-sm"
                                placeholder="Email Address"
                              />
                              <input
                                name="phone"
                                value={editFormData.phone}
                                onChange={handleInputChange}
                                className="input-base p-2 w-full rounded text-sm"
                                placeholder="Phone"
                              />
                              <textarea
                                name="address"
                                value={editFormData.address || ""}
                                onChange={handleInputChange}
                                className="input-base p-2 w-full rounded text-sm h-20"
                                placeholder="Billing Address..."
                              />
                            </div>
                            <div className="space-y-2">
                              <input
                                name="service"
                                value={editFormData.service}
                                onChange={handleInputChange}
                                className="input-base p-2 w-full rounded text-sm font-semibold"
                                placeholder="Service Name"
                              />
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  name="price"
                                  value={editFormData.price}
                                  onChange={handleInputChange}
                                  className="input-base p-2 w-full rounded text-sm"
                                  placeholder="Price $"
                                />
                                <select
                                  name="status"
                                  value={editFormData.status}
                                  onChange={handleInputChange}
                                  className="input-base p-2 w-full rounded text-sm"
                                >
                                  <option>Pending</option>
                                  <option>In Progress</option>
                                  <option>Completed</option>
                                </select>
                              </div>
                              <div className="flex gap-2">
                                <div className="w-full">
                                  <label className="text-xs text-sub">
                                    Invoice
                                  </label>
                                  <input
                                    type="date"
                                    name="invoice_date"
                                    value={editFormData.invoice_date || ""}
                                    onChange={handleInputChange}
                                    className="input-base p-2 w-full rounded text-sm"
                                  />
                                </div>
                                <div className="w-full">
                                  <label className="text-xs text-sub">
                                    Due
                                  </label>
                                  <input
                                    type="date"
                                    name="due_date"
                                    value={editFormData.due_date || ""}
                                    onChange={handleInputChange}
                                    className="input-base p-2 w-full rounded text-sm"
                                  />
                                </div>
                              </div>
                              <textarea
                                name="notes"
                                value={editFormData.notes || ""}
                                onChange={handleInputChange}
                                className="input-base p-2 w-full rounded text-sm h-16"
                                placeholder="Payment Terms / Notes..."
                              />
                            </div>
                            <div className="col-span-2 flex justify-end gap-3 mt-2">
                              <button
                                onClick={() => setEditingId(null)}
                                className="px-4 py-2 text-sub hover:opacity-80 rounded"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSave(client.id)}
                                className="px-6 py-2 bg-blue-600 text-white rounded shadow-sm hover:bg-blue-700 flex items-center gap-2"
                              >
                                <Save size={16} /> Save
                              </button>
                            </div>
                          </div>
                        </td>
                      ) : (
                        <>
                          <td className="px-6 py-4 font-medium">
                            {client.name}
                            <div className="text-sub text-xs">
                              {client.email}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {client.service}
                            <div className="text-sub text-xs font-bold mt-1">
                              ${client.price}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs flex flex-col gap-1">
                              <span className="flex items-center gap-1 text-sub">
                                <Calendar size={12} /> Inv:{" "}
                                {client.invoice_date || "-"}
                              </span>
                              {client.due_date && (
                                <span
                                  className={`flex items-center gap-1 font-medium ${
                                    new Date(client.due_date) < new Date() &&
                                    client.status !== "Completed"
                                      ? "text-red-500"
                                      : "text-sub"
                                  }`}
                                >
                                  <Clock size={12} /> Due: {client.due_date}
                                </span>
                              )}
                              {client.notes && (
                                <span
                                  className="flex items-center gap-1 text-sub mt-1 max-w-[150px] truncate"
                                  title={client.notes}
                                >
                                  <StickyNote size={12} /> {client.notes}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium border ${
                                client.status === "Completed"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : client.status === "In Progress"
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                  : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                              }`}
                            >
                              {client.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right flex justify-end gap-2">
                            {/* ✅ RESTORED BUTTONS */}
                            <button
                              onClick={() => openTaskDrawer(client)}
                              className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded"
                              title="Tasks"
                            >
                              <ClipboardList size={16} />
                            </button>
                            <button
                              onClick={() => generateInvoice(client)}
                              className="text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 p-2 rounded"
                              title="Invoice"
                            >
                              <Download size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(client.id);
                                setEditFormData(client);
                              }}
                              className="text-sub hover:bg-[var(--bg-main)] p-2 rounded"
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
                              className="text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 p-2 rounded"
                              title="WhatsApp"
                            >
                              <MessageCircle size={16} />
                            </button>
                            <button
                              onClick={() => openEmailModal(client)}
                              className="text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded"
                              title="Email"
                            >
                              <Mail size={16} />
                            </button>
                            <button
                              onClick={() => deleteClient(client.id)}
                              className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded"
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

        {/* ✅ RESTORED HISTORY TAB */}
        {activeTab === "history" && (
          <div className="card-base rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--bg-main)] text-sub">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">To</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {emailLogs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr
                      onClick={() =>
                        setExpandedLogId(
                          expandedLogId === log.id ? null : log.id
                        )
                      }
                      className="hover:bg-[var(--bg-main)] transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        {new Date(log.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">{log.client_name}</td>
                      <td className="px-6 py-4">{log.subject}</td>
                      <td className="px-6 py-4 text-sub">
                        {expandedLogId === log.id ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </td>
                    </tr>
                    {expandedLogId === log.id && (
                      <tr className="bg-[var(--bg-main)]">
                        <td
                          colSpan={4}
                          className="px-6 py-4 text-sub font-mono text-xs p-4 whitespace-pre-wrap"
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

        {/* ✅ RESTORED SETTINGS TAB */}
        {activeTab === "settings" && (
          <div className="max-w-2xl card-base p-8 rounded-xl shadow-sm">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Settings size={20} /> Admin Settings
            </h3>
            {/* Image Preview Block */}
            <div className="mb-6 flex items-center gap-4">
              {settings.avatar_url ? (
                <img
                  src={settings.avatar_url}
                  alt="Profile"
                  className="w-20 h-20 rounded-full border border-[var(--border)] object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <User size={32} />
                </div>
              )}
              <div>
                <p className="font-medium">Profile Photo</p>
                <p className="text-xs text-sub">Enter a URL below to update.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-sub mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={settings.full_name}
                  onChange={(e) =>
                    setSettings({ ...settings, full_name: e.target.value })
                  }
                  className="w-full input-base p-2 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-sub mb-1">
                  Company / CRM Name
                </label>
                <input
                  type="text"
                  value={settings.company_name}
                  onChange={(e) =>
                    setSettings({ ...settings, company_name: e.target.value })
                  }
                  className="w-full input-base p-2 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-sub mb-1">
                  Profile Picture URL
                </label>
                <input
                  type="text"
                  value={settings.avatar_url}
                  onChange={(e) =>
                    setSettings({ ...settings, avatar_url: e.target.value })
                  }
                  className="w-full input-base p-2 rounded-lg"
                />
              </div>
              <button
                onClick={saveSettings}
                disabled={isSaving}
                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
