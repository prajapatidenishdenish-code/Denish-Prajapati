import React, { useState } from 'react';
import { Mail, MessageSquare, Send, CheckCircle2, AlertCircle } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setSubmitted(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Contact Support</h1>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Need help with an offer verification, withdrawal status, or account inquiry? Our dedicated team is here to assist.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Info Column */}
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <Mail className="w-5 h-5 text-amber-400" />
            <h4 className="font-bold text-white text-sm">Direct Email</h4>
            <p className="text-xs text-slate-400">support@adearnpro.com</p>
            <p className="text-[11px] text-slate-500">Average response: &lt; 12 hours</p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            <h4 className="font-bold text-white text-sm">Advertiser Queries</h4>
            <p className="text-xs text-slate-400">partnerships@adearnpro.com</p>
            <p className="text-[11px] text-slate-500">Direct CPA network integration</p>
          </div>
        </div>

        {/* Contact Form Column */}
        <div className="md:col-span-2 p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
          {submitted ? (
            <div className="py-12 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-xl font-bold text-white">Message Received!</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Thank you, {name}. A support ticket (#TKT-{Math.floor(100000 + Math.random() * 900000)}) has been logged.
                We will reply directly to {email}.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-4 px-6 py-2 bg-slate-800 text-slate-200 text-xs rounded-xl hover:bg-slate-700"
              >
                Send Another Inquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Inquiry Topic</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Question about offer conversion or withdrawal"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Detailed Message</label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your question or issue with as much detail as possible..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-400 to-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
              >
                <Send className="w-4 h-4" />
                <span>Submit Support Ticket</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
