"use client";

import React, { useState, useEffect } from "react";
import {
  RefreshCw,
  DollarSign,
  TrendingUp,
  Search,
  Filter,
  Menu,
  ClipboardList,
  CheckCircle,
  Clock,
  Briefcase,
  Plus,
  User,
  ChevronDown,
  ChevronUp,
  Settings,
  Mail,
  ArrowRight,
  Activity,
} from "lucide-react";
import { supabase } from "./supabaseClient";
import AuthScreen from "./components/AuthScreen";
import Sidebar from "./components/Sidebar";
import LeadsView from "./components/LeadsView";
import ClientProfile from "./components/ClientProfile";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface Client {
  id: number;
  name: string;
  email: string;
  service: string;
  status: string;
  phone: string;
  price: number;
  address: string;
  city: string;
  state: string;
  zip: string;
  invoice_date: string;
  due_date: string;
  notes: string;
  type: string;
  source: string;
  next_follow_up: string;
  pipeline_stage: string;
}

interface AdminSettings {
  id?: number;
  full_name: string;
  company_name: string;
  avatar_url: string;
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

export default function Dashboard() {
  const [session, setSession] = useState<any>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(false);

  // Data State
  const [clients, setClients] = useState<Client[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [settings, setSettings] = useState<AdminSettings>({
    full_name: "Admin",
    company_name: "Nafta24",
    avatar_url: "",
  });
  const [globalTasks, setGlobalTasks] = useState<any[]>([]);

  // UI State
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // --- DARK MODE ---
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

  // --- DATA FETCHING ---
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
    const clientsResult = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });
    if (clientsResult.data) setClients(clientsResult.data);
    const settingsResult = await supabase.from("settings").select("*").single();
    if (settingsResult.data) setSettings(settingsResult.data);
    const tasksResult = await supabase
      .from("tasks")
      .select("*")
      .eq("is_completed", false)
      .order("due_date", { ascending: true })
      .limit(10);
    if (tasksResult.data) setGlobalTasks(tasksResult.data);
    const logsResult = await supabase
      .from("email_logs")
      .select("*")
      .order("created_at", { ascending: false });
    if (logsResult.data) setEmailLogs(logsResult.data);
    setIsLoading(false);
  };

  const handleLogout = async () => await supabase.auth.signOut();

  const addFakeClient = async () => {
    setIsSaving(true);
    const newClientData = {
      name: "New Client",
      email: "",
      service: "Service Name",
      status: "Pending",
      phone: "",
      price: 0,
      address: "",
      type: "client",
      source: "Website",
    };
    const { data } = await supabase
      .from("clients")
      .insert([newClientData])
      .select();
    if (data) {
      setClients([data[0], ...clients]);
      setSelectedClient(data[0]);
    }
    setIsSaving(false);
  };

  const saveSettings = async () => {
    setIsSaving(true);
    if (settings.id)
      await supabase
        .from("settings")
        .update({
          full_name: settings.full_name,
          company_name: settings.company_name,
          avatar_url: settings.avatar_url,
        })
        .eq("id", settings.id);
    else {
      const { data } = await supabase
        .from("settings")
        .insert([settings])
        .select();
      if (data) setSettings(data[0]);
    }
    alert("Settings Saved!");
    setIsSaving(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800";
      case "In Progress":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800";
      default:
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800";
    }
  };

  // --- STATS CALC ---
  const totalRevenue = clients
    .filter((c) => c.type === "client")
    .reduce((sum, client) => sum + (Number(client.price) || 0), 0);
  const activeJobs = clients.filter(
    (c) => c.status === "In Progress" && c.type === "client"
  ).length;
  const completedJobs = clients.filter(
    (c) => c.status === "Completed" && c.type === "client"
  ).length;

  // Chart Data: Revenue by Service
  const revenueData = clients
    .filter((c) => c.type === "client")
    .reduce((acc: any[], client) => {
      const existing = acc.find((item) => item.name === client.service);
      if (existing) existing.revenue += Number(client.price) || 0;
      else
        acc.push({
          name: client.service || "Other",
          revenue: Number(client.price) || 0,
        });
      return acc;
    }, []);

  // Chart Data: Status Pie
  const statusData = [
    {
      name: "Pending",
      value: clients.filter((c) => c.status === "Pending").length,
      color: "#f97316",
    },
    {
      name: "Active",
      value: clients.filter((c) => c.status === "In Progress").length,
      color: "#3b82f6",
    },
    {
      name: "Completed",
      value: clients.filter((c) => c.status === "Completed").length,
      color: "#22c55e",
    },
  ].filter((d) => d.value > 0);

  // Chart Data: Sources
  const sourceData = clients.reduce((acc: any[], client) => {
    const existing = acc.find(
      (item) => item.name === (client.source || "Direct")
    );
    if (existing) existing.value += 1;
    else acc.push({ name: client.source || "Direct", value: 1 });
    return acc;
  }, []);
  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#00C49F"];

  if (sessionLoading)
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--bg-main)]">
        <RefreshCw className="animate-spin text-blue-600" />
      </div>
    );
  if (!session) return <AuthScreen />;

  const displayedClients = clients.filter(
    (c) =>
      c.type !== "lead" &&
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen overflow-hidden font-sans relative transition-colors duration-300 bg-[var(--bg-main)] text-[var(--text-main)]">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        handleLogout={handleLogout}
        companyName={settings.company_name}
      />

      {selectedClient && (
        <ClientProfile
          client={selectedClient}
          settings={settings}
          onClose={() => setSelectedClient(null)}
          onUpdate={() => {
            fetchAllData();
            setSelectedClient(null);
          }}
          onDelete={() => {
            fetchAllData();
            setSelectedClient(null);
          }}
        />
      )}

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

        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* 1. KPIs */}
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
                      ? Math.round(
                          totalRevenue /
                            clients.filter((c) => c.type === "client").length
                        )
                      : 0}
                  </h3>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-full">
                  <TrendingUp size={24} />
                </div>
              </div>
            </div>

            {/* 2. Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="card-base p-6 rounded-xl shadow-sm lg:col-span-2 h-[400px]">
                <h3 className="font-semibold mb-6 flex items-center gap-2">
                  <TrendingUp size={18} /> Revenue by Service
                </h3>
                <ResponsiveContainer width="100%" height="85%">
                  <BarChart data={revenueData}>
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
              <div className="card-base p-6 rounded-xl shadow-sm h-[400px]">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Activity size={18} /> Job Status
                </h3>
                <ResponsiveContainer width="100%" height="85%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: darkMode ? "#1e293b" : "#fff",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 3. Charts Row 2 & Tasks */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="card-base p-6 rounded-xl shadow-sm h-[400px]">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Filter size={18} /> Lead Sources
                </h3>
                <ResponsiveContainer width="100%" height="85%">
                  <PieChart>
                    <Pie
                      data={sourceData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {sourceData.map((entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: darkMode ? "#1e293b" : "#fff",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="lg:col-span-2 flex flex-col h-[400px] card-base rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-[var(--border)]">
                  <h3 className="font-semibold flex items-center gap-2">
                    <ClipboardList size={18} className="text-blue-500" />{" "}
                    Priority Tasks
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 p-4 custom-scrollbar">
                  {globalTasks.length > 0 ? (
                    globalTasks.map((task) => {
                      const c = clients.find((c) => c.id === task.client_id);
                      return (
                        <div
                          key={task.id}
                          className="p-3 bg-[var(--bg-main)] rounded-lg border border-[var(--border)] hover:border-blue-500 transition-colors cursor-pointer group"
                          onClick={() => {
                            if (c) setSelectedClient(c);
                          }}
                        >
                          {" "}
                          <div className="flex justify-between items-start">
                            {" "}
                            <p className="text-sm font-semibold line-clamp-1 group-hover:text-blue-500">
                              {task.title}
                            </p>{" "}
                            {task.due_date && (
                              <span
                                className={`text-[10px] ml-2 ${
                                  new Date(task.due_date) < new Date()
                                    ? "text-red-500 font-bold"
                                    : "text-sub"
                                }`}
                              >
                                {new Date(task.due_date).toLocaleDateString()}
                              </span>
                            )}{" "}
                          </div>{" "}
                          <div className="flex justify-between items-center mt-1">
                            {" "}
                            <p className="text-xs text-sub font-medium">
                              {c?.name || "Unknown"}
                            </p>{" "}
                            <ArrowRight
                              size={14}
                              className="text-sub group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all"
                            />{" "}
                          </div>{" "}
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-sub text-center">
                      <CheckCircle size={32} className="mb-2 text-green-500" />
                      <p>All caught up!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LISTS (Clients, Leads, History, Settings) - Remainder of file unchanged except for Layout */}
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
              <table className="w-full text-left text-sm min-w-[800px]">
                <thead className="bg-[var(--bg-main)] text-sub">
                  <tr>
                    <th className="px-6 py-4">Client Name</th>
                    <th className="px-6 py-4">Service & Status</th>
                    <th className="px-6 py-4">Next Follow Up</th>
                    <th className="px-6 py-4 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {displayedClients.map((client) => (
                    <tr
                      key={client.id}
                      onClick={() => setSelectedClient(client)}
                      className="hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4 font-medium">
                        <div className="text-base font-bold text-[var(--text-main)] group-hover:text-blue-600 transition-colors">
                          {client.name}
                        </div>
                        <div className="text-xs text-sub">{client.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">{client.service}</div>
                        <span
                          className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusColor(
                            client.status
                          )}`}
                        >
                          {client.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sub flex items-center gap-2">
                        <Clock
                          size={14}
                          className={
                            client.next_follow_up &&
                            new Date(client.next_follow_up) <= new Date()
                              ? "text-red-500"
                              : "text-sub"
                          }
                        />{" "}
                        {client.next_follow_up
                          ? new Date(client.next_follow_up).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-base">
                        ${client.price?.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeTab === "leads" && (
          <LeadsView
            leads={clients.filter((c) => c.type === "lead")}
            refreshData={fetchAllData}
          />
        )}
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
        {activeTab === "settings" && (
          <div className="max-w-2xl card-base p-8 rounded-xl shadow-sm">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Settings size={20} /> Admin Settings
            </h3>
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
