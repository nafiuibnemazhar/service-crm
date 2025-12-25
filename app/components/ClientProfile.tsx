"use client";
import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  Phone,
  Paperclip,
  Send,
  Loader2,
  MessageCircle,
  Trash2,
  Plus,
  CheckSquare,
  Square,
  Copy,
  Key,
  ExternalLink,
  Globe,
  Briefcase,
  Calendar,
  Clock,
  ChevronDown,
  Flag,
  Target,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import InvoiceGenerator from "./InvoiceGenerator";
import emailjs from "@emailjs/browser";

const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!;
const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!;

export default function ClientProfile({
  client,
  settings,
  onClose,
  onUpdate,
  onDelete,
}: any) {
  const [activeTab, setActiveTab] = useState("overview");
  const [formData, setFormData] = useState(client);
  const [loading, setLoading] = useState(false);

  // Work Data
  const [tasks, setTasks] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [newTask, setNewTask] = useState("");
  const [newTaskDate, setNewTaskDate] = useState("");
  const [newAsset, setNewAsset] = useState({
    title: "",
    url: "",
    credentials: "",
  });

  // Email
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailFile, setEmailFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchWorkData();
  }, [client]);

  const fetchWorkData = async () => {
    const t = await supabase
      .from("tasks")
      .select("*")
      .eq("client_id", client.id)
      .order("is_completed", { ascending: true })
      .order("due_date", { ascending: true });
    if (t.data) setTasks(t.data);
    const a = await supabase
      .from("client_assets")
      .select("*")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false });
    if (a.data) setAssets(a.data);
  };

  const saveChanges = async () => {
    setLoading(true);
    await supabase.from("clients").update(formData).eq("id", client.id);
    onUpdate();
    setLoading(false);
    alert("Profile Updated");
  };

  const updateStatus = async (newStatus: string) => {
    setFormData({ ...formData, status: newStatus });
    await supabase
      .from("clients")
      .update({ status: newStatus })
      .eq("id", client.id);
    onUpdate();
  };

  const deleteClient = async () => {
    if (!confirm("Delete this client permanently?")) return;
    await supabase.from("tasks").delete().eq("client_id", client.id);
    await supabase.from("client_assets").delete().eq("client_id", client.id);
    await supabase.from("clients").delete().eq("id", client.id);
    onDelete();
  };

  // Work Logic
  const addTask = async () => {
    if (!newTask) return;
    const { data } = await supabase
      .from("tasks")
      .insert([
        {
          client_id: client.id,
          title: newTask,
          due_date: newTaskDate || null,
          is_completed: false,
        },
      ])
      .select();
    if (data) {
      setTasks([...tasks, data[0]]);
      setNewTask("");
      setNewTaskDate("");
    }
  };
  const toggleTask = async (task: any) => {
    const newStatus = !task.is_completed;
    setTasks(
      tasks.map((t) =>
        t.id === task.id ? { ...t, is_completed: newStatus } : t
      )
    );
    await supabase
      .from("tasks")
      .update({ is_completed: newStatus })
      .eq("id", task.id);
  };
  const deleteTask = async (id: number) => {
    setTasks(tasks.filter((t) => t.id !== id));
    await supabase.from("tasks").delete().eq("id", id);
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
  const sendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    const templateParams: any = {
      to_email: formData.email,
      to_name: formData.name,
      subject: emailSubject,
      message: emailBody,
    };
    emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY).then(
      () => {
        alert("Email Sent!");
        setSending(false);
      },
      (err) => {
        alert("Failed: " + JSON.stringify(err));
        setSending(false);
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>
      <div className="relative w-full max-w-5xl h-full bg-[var(--bg-main)] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-[var(--border)]">
        {/* HEADER */}
        <div className="px-8 py-6 border-b border-[var(--border)] flex justify-between items-start bg-white dark:bg-slate-900 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-xl">
              {formData.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[var(--text-main)]">
                {formData.name}
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <div className="relative group">
                  <select
                    value={formData.status}
                    onChange={(e) => updateStatus(e.target.value)}
                    className={`appearance-none cursor-pointer pl-3 pr-8 py-1 rounded-full text-xs font-bold uppercase tracking-wide outline-none border transition-all ${
                      formData.status === "Completed"
                        ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                        : formData.status === "In Progress"
                        ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
                        : "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800"
                    }`}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                  <ChevronDown
                    size={12}
                    className="absolute right-2 top-1.5 opacity-50 pointer-events-none"
                  />
                </div>
                <span className="text-sm text-sub border-l border-[var(--border)] pl-3">
                  {formData.service}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="text-sub" />
          </button>
        </div>

        {/* TABS */}
        <div className="flex px-8 border-b border-[var(--border)] bg-gray-50 dark:bg-slate-900/50">
          {["overview", "work", "financials", "communicate"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-6 text-sm font-bold capitalize border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-sub hover:text-[var(--text-main)]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto bg-[var(--bg-main)] custom-scrollbar">
          <div className="max-w-5xl mx-auto p-8">
            {/* OVERVIEW TAB (UPDATED WITH FOLLOW UP) */}
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  {/* Strategy Box (NEW) */}
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-[var(--border)] shadow-sm">
                    <h3 className="font-bold text-sm text-sub uppercase mb-4 tracking-wider flex items-center gap-2">
                      <Target size={16} /> Strategy & Source
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-sub font-semibold mb-1 block">
                          Next Follow-Up
                        </label>
                        <div className="relative">
                          <input
                            type="date"
                            className="w-full input-base p-2.5 rounded-lg"
                            value={formData.next_follow_up || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                next_follow_up: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-sub font-semibold mb-1 block">
                          Lead Source
                        </label>
                        <select
                          className="w-full input-base p-2.5 rounded-lg"
                          value={formData.source || "Website"}
                          onChange={(e) =>
                            setFormData({ ...formData, source: e.target.value })
                          }
                        >
                          <option>Website</option>
                          <option>LinkedIn</option>
                          <option>Referral</option>
                          <option>Upwork</option>
                          <option>Cold Call</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Contact Box */}
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-[var(--border)] shadow-sm">
                    <h3 className="font-bold text-sm text-sub uppercase mb-4 tracking-wider">
                      Contact Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs text-sub font-semibold">
                          Email Address
                        </label>
                        <input
                          className="w-full input-base p-2.5 rounded-lg mt-1"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="text-xs text-sub font-semibold">
                          Phone Number
                        </label>
                        <div className="flex gap-2 mt-1">
                          <input
                            className="w-full input-base p-2.5 rounded-lg"
                            value={formData.phone}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                phone: e.target.value,
                              })
                            }
                          />
                          <button
                            onClick={() =>
                              window.open(
                                `https://wa.me/${formData.phone}`,
                                "_blank"
                              )
                            }
                            className="px-3 bg-green-500 text-white rounded-lg hover:bg-green-600 shadow-sm transition-colors"
                            title="Open WhatsApp"
                          >
                            <MessageCircle size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={deleteClient}
                      className="text-red-500 hover:text-red-700 text-sm flex items-center gap-2 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 size={16} /> Delete Client Profile
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-[var(--border)] shadow-sm">
                    <h3 className="font-bold text-sm text-sub uppercase mb-4 tracking-wider">
                      Billing Address
                    </h3>
                    <textarea
                      className="w-full input-base p-2.5 rounded-lg h-24 resize-none mb-4"
                      value={formData.address || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      placeholder="Street Address..."
                    />
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-sub mb-1 block">
                          City
                        </label>
                        <input
                          className="w-full input-base p-2 rounded-lg"
                          value={formData.city || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, city: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="text-xs text-sub mb-1 block">
                          State
                        </label>
                        <input
                          className="w-full input-base p-2 rounded-lg"
                          value={formData.state || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, state: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="text-xs text-sub mb-1 block">
                          Zip
                        </label>
                        <input
                          className="w-full input-base p-2 rounded-lg"
                          value={formData.zip || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, zip: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={saveChanges}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 font-bold flex justify-center items-center gap-2 transition-all transform active:scale-95"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Save size={18} />
                    )}{" "}
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {/* WORK TAB (Assets & Tasks) */}
            {activeTab === "work" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
                <div className="flex flex-col h-[500px] bg-white dark:bg-slate-800 rounded-xl border border-[var(--border)] shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-[var(--border)] bg-gray-50 dark:bg-slate-900/50 flex justify-between items-center">
                    <h3 className="font-bold flex items-center gap-2">
                      <Key size={18} className="text-orange-500" /> Asset Vault
                    </h3>
                    <span className="text-xs text-sub bg-white dark:bg-slate-800 px-2 py-1 rounded border border-[var(--border)]">
                      {assets.length} items
                    </span>
                  </div>
                  <div className="p-4 border-b border-[var(--border)] space-y-2 bg-[var(--bg-main)]">
                    <input
                      className="w-full input-base p-2 rounded text-sm"
                      placeholder="Title (e.g. WP Admin)"
                      value={newAsset.title}
                      onChange={(e) =>
                        setNewAsset({ ...newAsset, title: e.target.value })
                      }
                    />
                    <div className="flex gap-2">
                      <input
                        className="w-1/2 input-base p-2 rounded text-sm"
                        placeholder="URL..."
                        value={newAsset.url}
                        onChange={(e) =>
                          setNewAsset({ ...newAsset, url: e.target.value })
                        }
                      />
                      <input
                        className="w-1/2 input-base p-2 rounded text-sm"
                        placeholder="Login/Pass..."
                        value={newAsset.credentials}
                        onChange={(e) =>
                          setNewAsset({
                            ...newAsset,
                            credentials: e.target.value,
                          })
                        }
                      />
                    </div>
                    <button
                      onClick={addAsset}
                      className="w-full py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Add Asset
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                    {assets.map((a) => (
                      <div
                        key={a.id}
                        className="p-3 bg-[var(--bg-main)] rounded-lg border border-[var(--border)] text-sm group hover:border-blue-400 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex items-center gap-2 font-semibold">
                            <Globe size={14} className="text-sub" /> {a.title}
                          </div>
                          {a.url && (
                            <a
                              href={a.url}
                              target="_blank"
                              className="text-blue-500 hover:text-blue-600"
                            >
                              <ExternalLink size={14} />
                            </a>
                          )}
                        </div>
                        {a.credentials && (
                          <div className="mt-2 flex items-center justify-between bg-gray-100 dark:bg-slate-700/50 p-2 rounded text-xs font-mono">
                            <span className="truncate max-w-[150px]">
                              {a.credentials}
                            </span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(a.credentials);
                                alert("Copied!");
                              }}
                              className="text-sub hover:text-blue-500"
                            >
                              <Copy size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col h-[500px] bg-white dark:bg-slate-800 rounded-xl border border-[var(--border)] shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-[var(--border)] bg-gray-50 dark:bg-slate-900/50 flex justify-between items-center">
                    <h3 className="font-bold flex items-center gap-2">
                      <Briefcase size={18} className="text-blue-500" /> Tasks
                    </h3>
                    <span className="text-xs text-sub bg-white dark:bg-slate-800 px-2 py-1 rounded border border-[var(--border)]">
                      {tasks.filter((t) => !t.is_completed).length} pending
                    </span>
                  </div>
                  <div className="p-4 border-b border-[var(--border)] space-y-2 bg-[var(--bg-main)]">
                    <input
                      className="w-full input-base p-2 rounded text-sm"
                      placeholder="What needs to be done?"
                      value={newTask}
                      onChange={(e) => setNewTask(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addTask()}
                    />
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="date"
                          className="w-full input-base p-1.5 pl-8 rounded text-sm text-sub"
                          value={newTaskDate}
                          onChange={(e) => setNewTaskDate(e.target.value)}
                        />
                        <Calendar
                          className="absolute left-2 top-2 text-sub"
                          size={14}
                        />
                      </div>
                      <button
                        onClick={addTask}
                        className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                    {tasks.map((t) => (
                      <div
                        key={t.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border border-[var(--border)] transition-all group ${
                          t.is_completed
                            ? "bg-gray-50 dark:bg-slate-900/50 opacity-60"
                            : "bg-[var(--bg-main)] hover:border-blue-400"
                        }`}
                      >
                        <button
                          onClick={() => toggleTask(t)}
                          className={`mt-0.5 ${
                            t.is_completed
                              ? "text-green-500"
                              : "text-sub hover:text-blue-500"
                          }`}
                        >
                          {t.is_completed ? (
                            <CheckSquare size={18} />
                          ) : (
                            <Square size={18} />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium truncate ${
                              t.is_completed
                                ? "line-through text-sub"
                                : "text-[var(--text-main)]"
                            }`}
                          >
                            {t.title}
                          </p>
                          {t.due_date && (
                            <p
                              className={`text-xs mt-1 flex items-center gap-1 ${
                                new Date(t.due_date) < new Date() &&
                                !t.is_completed
                                  ? "text-red-500 font-bold"
                                  : "text-sub"
                              }`}
                            >
                              <Clock size={12} />{" "}
                              {new Date(t.due_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => deleteTask(t.id)}
                          className="opacity-0 group-hover:opacity-100 text-sub hover:text-red-500 transition-opacity"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* FINANCIALS & COMMUNICATE TABS */}
            {activeTab === "financials" && (
              <div className="max-w-4xl mx-auto">
                <InvoiceGenerator
                  client={formData}
                  settings={settings}
                  onClose={() => {}}
                />
              </div>
            )}
            {activeTab === "communicate" && (
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-[var(--border)] shadow-sm">
                  <h3 className="font-bold text-lg mb-4">Compose Email</h3>
                  <div className="space-y-4">
                    <input
                      className="w-full input-base p-3 rounded-lg font-medium"
                      placeholder="Subject Line"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                    />
                    <textarea
                      className="w-full input-base p-3 rounded-lg h-40 resize-none"
                      placeholder="Write your message here..."
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                    />
                    <div className="flex items-center justify-between pt-2">
                      <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
                        <Paperclip size={16} />{" "}
                        {emailFile ? emailFile.name : "Attach PDF/Image"}
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.png,.jpg"
                          onChange={(e) =>
                            setEmailFile(
                              e.target.files ? e.target.files[0] : null
                            )
                          }
                        />
                      </label>
                      {emailFile && (
                        <button
                          onClick={() => setEmailFile(null)}
                          className="text-red-500 text-sm hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <button
                      onClick={sendEmail}
                      disabled={sending}
                      className="w-full bg-green-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-green-700 shadow-lg shadow-green-500/20 font-bold transition-all transform active:scale-95 mt-4"
                    >
                      {sending ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <Send size={18} />
                      )}{" "}
                      Send Email
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
