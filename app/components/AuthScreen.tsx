"use client";

import React, { useState } from "react";
import { Lock, Loader2, LogIn } from "lucide-react";
import { supabase } from "../supabaseClient"; // Adjust path if needed

export default function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) alert(error.message);
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) alert(error.message);
    else alert("Account created! You are logged in.");
    setLoading(false);
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100 font-sans">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-100 p-3 rounded-full">
            <Lock className="text-blue-600" size={32} />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
          Nafta24
        </h2>
        <p className="text-center text-gray-500 mb-8">
          {isSignUp
            ? "Create your admin account"
            : "Log in to access dashboard"}
        </p>

        <form
          onSubmit={isSignUp ? handleSignUp : handleLogin}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="admin@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition flex justify-center items-center gap-2 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <LogIn size={20} />
            )}
            {isSignUp ? "Sign Up" : "Log In"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          {isSignUp ? "Already have an account?" : "No account yet?"}{" "}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-blue-600 font-medium hover:underline cursor-pointer"
          >
            {isSignUp ? "Log In" : "Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}
