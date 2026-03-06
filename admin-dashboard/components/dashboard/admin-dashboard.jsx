"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  ChartColumn,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileBox,
  Files,
  LayoutDashboard,
  LifeBuoy,
  Menu,
  MessageCircle,
  MessageSquare,
  Moon,
  Package,
  Printer,
  RefreshCw,
  Radio,
  Search,
  Settings,
  Star,
  Sun,
  Upload,
  Users
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

const API_BASE = "http://localhost:5000";
const COLORS = ["#4f46e5", "#0284c7", "#16a34a", "#f59e0b"];
const LIVE_REFRESH_MS = 10000;

const sidebarItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Orders", icon: Package },
  { label: "Upload Models", icon: Upload },
  { label: "Customers", icon: Users },
  { label: "Quotes", icon: FileBox },
  { label: "Payments", icon: CreditCard },
  { label: "Printers", icon: Printer },
  { label: "Materials", icon: Files },
  { label: "Analytics", icon: ChartColumn },
  { label: "Reviews", icon: Star },
  { label: "Support Tickets", icon: LifeBuoy },
  { label: "Contact Inbox", icon: MessageCircle },
  { label: "Settings", icon: Settings }
];

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(data.message || "API error");
  return data;
}

export function AdminDashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("Dashboard");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isDark, setIsDark] = useState(false);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    kpis: {},
    monthlyAnalytics: [],
    orders: [],
    printers: [],
    materials: [],
    topCustomers: [],
    popularMaterials: [],
    customers: [],
    notifications: [],
    tickets: [],
    reviews: [],
    quotes: [],
    contacts: [],
    uploads: [],
    pricing: {}
  });
  const [newPrinter, setNewPrinter] = useState({ name: "", type: "FDM", location: "" });
  const [newMaterial, setNewMaterial] = useState({ name: "", pricePerGram: 0, stockGrams: 0 });
  const [pricingDraft, setPricingDraft] = useState({ pricePerGram: 0, machineCost: 0, shippingCost: 0 });
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerDetails, setCustomerDetails] = useState(null);
  const [customerDetailsLoading, setCustomerDetailsLoading] = useState(false);
  const [customerDetailsError, setCustomerDetailsError] = useState("");
  const [selectedContactId, setSelectedContactId] = useState("");
  const [selectedContact, setSelectedContact] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [contactFilter, setContactFilter] = useState("All");
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [playSound, setPlaySound] = useState(true);
  const [lastAlertMessage, setLastAlertMessage] = useState("");
  const previousSnapshotRef = useRef(null);

  const notifyEvent = useCallback((title, body) => {
    setLastAlertMessage(`${title}: ${body}`);
    if (playSound && typeof window !== "undefined") {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          const context = new AudioContextClass();
          const oscillator = context.createOscillator();
          const gain = context.createGain();
          oscillator.type = "sine";
          oscillator.frequency.value = 880;
          gain.gain.value = 0.06;
          oscillator.connect(gain);
          gain.connect(context.destination);
          oscillator.start();
          oscillator.stop(context.currentTime + 0.15);
        }
      } catch {
        // Ignore audio context errors silently.
      }
    }

    if (alertsEnabled && typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, { body });
      } catch {
        // Ignore notification errors silently.
      }
    }
  }, [alertsEnabled, playSound]);

  const enableDesktopAlerts = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "granted") {
      setAlertsEnabled(true);
      return;
    }
    const permission = await Notification.requestPermission();
    setAlertsEnabled(permission === "granted");
  }, []);

  const loadSummary = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await api("/api/admin/summary");
      const uploads = await api("/api/admin/uploads");
      const contacts = await api("/api/contact/admin");
      const nextSummary = { ...data, uploads, contacts };

      const prev = previousSnapshotRef.current;
      if (prev) {
        const prevOrdersMap = new Map((prev.orders || []).map((o) => [o._id, o]));
        const nextOrders = nextSummary.orders || [];

        for (const order of nextOrders) {
          const oldOrder = prevOrdersMap.get(order._id);
          if (!oldOrder) {
            notifyEvent("New Order", `${order.orderId} from ${order.customerName}`);
            continue;
          }
          if (oldOrder.status !== order.status) {
            notifyEvent("Order Status Updated", `${order.orderId}: ${oldOrder.status} -> ${order.status}`);
          }
          if (oldOrder.paymentStatus !== order.paymentStatus) {
            notifyEvent("Payment Status Updated", `${order.orderId}: ${order.paymentStatus}`);
          }
        }

        const prevContactIds = new Set((prev.contacts || []).map((c) => c._id));
        for (const contact of nextSummary.contacts || []) {
          if (!prevContactIds.has(contact._id)) {
            notifyEvent("New Chat", `${contact.name}: ${contact.subject}`);
          }
        }
      }

      previousSnapshotRef.current = nextSummary;
      setSummary(nextSummary);
      setPricingDraft({
        pricePerGram: data.pricing?.pricePerGram || 0,
        machineCost: data.pricing?.machineCost || 0,
        shippingCost: data.pricing?.shippingCost || 0
      });
      setLastUpdatedAt(new Date());
    } finally {
      setRefreshing(false);
    }
  }, [notifyEvent]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await api("/api/admin/bootstrap");
        await loadSummary();
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    const poll = setInterval(() => {
      if (!autoRefresh) return;
      loadSummary().catch(() => {});
    }, LIVE_REFRESH_MS);
    return () => {
      mounted = false;
      clearInterval(poll);
    };
  }, [loadSummary, autoRefresh]);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    setAlertsEnabled(Notification.permission === "granted");
  }, []);

  const filteredOrders = useMemo(() => {
    return (summary.orders || []).filter((order) => {
      const byStatus = statusFilter === "All" || order.status === statusFilter;
      const key = `${order.orderId} ${order.customerName} ${order.modelName}`.toLowerCase();
      return byStatus && key.includes(query.toLowerCase());
    });
  }, [summary.orders, query, statusFilter]);

  const unreadNotifications = (summary.notifications || []).filter((n) => !n.read).length;
  const livePrinting = (summary.orders || []).filter((o) => o.status === "Printing").length;
  const livePending = (summary.orders || []).filter((o) => o.status === "Pending").length;
  const liveCodDue = (summary.orders || []).filter((o) => o.paymentStatus === "Partially Paid").length;

  function formatRelativeTime(dateInput) {
    if (!dateInput) return "n/a";
    const diffSeconds = Math.max(0, Math.floor((Date.now() - new Date(dateInput).getTime()) / 1000));
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    const mins = Math.floor(diffSeconds / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  function formatPostProcessing(postProcessing = {}) {
    const selected = [];
    if (postProcessing.sanding) selected.push("Sanding");
    if (postProcessing.primerPainting) selected.push("Primer/Paint");
    if (postProcessing.supportRemoval) selected.push("Support Removal");
    return selected.length ? selected.join(", ") : "None";
  }

  function formatShipping(shipping = {}) {
    const method = shipping.method === "express" ? "Express" : "Standard";
    const address = [shipping.streetAddress, shipping.city, shipping.postalCode].filter(Boolean).join(", ");
    return address ? `${method} - ${address}` : method;
  }

  function inr(value) {
    return `INR ${Number(value || 0).toFixed(2)}`;
  }

  async function updateOrder(orderId, payload) {
    await api(`/api/admin/orders/${orderId}`, { method: "PATCH", body: JSON.stringify(payload) });
    await loadSummary();
  }

  async function addPrinter() {
    if (!newPrinter.name.trim()) return;
    await api("/api/admin/printers", { method: "POST", body: JSON.stringify(newPrinter) });
    setNewPrinter({ name: "", type: "FDM", location: "" });
    await loadSummary();
  }

  async function addMaterial() {
    if (!newMaterial.name.trim()) return;
    await api("/api/admin/materials", {
      method: "POST",
      body: JSON.stringify({
        ...newMaterial,
        pricePerGram: Number(newMaterial.pricePerGram),
        stockGrams: Number(newMaterial.stockGrams)
      })
    });
    setNewMaterial({ name: "", pricePerGram: 0, stockGrams: 0 });
    await loadSummary();
  }

  async function savePricing() {
    await api("/api/admin/pricing", {
      method: "PUT",
      body: JSON.stringify({
        pricePerGram: Number(pricingDraft.pricePerGram),
        machineCost: Number(pricingDraft.machineCost),
        shippingCost: Number(pricingDraft.shippingCost)
      })
    });
    await loadSummary();
  }

  async function loadCustomerDetails(customerId) {
    if (!customerId) return;
    setCustomerDetailsLoading(true);
    setCustomerDetailsError("");
    try {
      const details = await api(`/api/admin/customers/${customerId}/details`);
      setSelectedCustomerId(customerId);
      setCustomerDetails(details);
    } catch (error) {
      setCustomerDetailsError(error.message || "Failed to load customer details");
    } finally {
      setCustomerDetailsLoading(false);
    }
  }

  async function openContact(contactId) {
    const contact = await api(`/api/contact/admin/${contactId}`);
    setSelectedContactId(contactId);
    setSelectedContact(contact);
  }

  async function sendContactReply() {
    if (!selectedContactId || !replyText.trim()) return;
    setSendingReply(true);
    try {
      const payload = {
        message: replyText.trim(),
        adminName: "Nexus3D Admin",
        sendEmail: true,
        sendWhatsApp: true
      };
      const result = await api(`/api/contact/admin/${selectedContactId}/reply`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setSelectedContact(result.contact);
      setReplyText("");
      await loadSummary();
    } finally {
      setSendingReply(false);
    }
  }

  async function updateContactStatus(contactId, status) {
    await api(`/api/contact/admin/${contactId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });
    if (selectedContactId === contactId) {
      await openContact(contactId);
    }
    await loadSummary();
  }

  function renderDashboard() {
    return (
      <>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card><CardHeader><CardDescription>Total Orders</CardDescription><CardTitle className="mt-1 text-2xl">{summary.kpis.totalOrders || 0}</CardTitle></CardHeader><CardContent><Progress value={Math.min(100, (summary.kpis.totalOrders || 0) / 100)} /></CardContent></Card>
          <Card><CardHeader><CardDescription>Revenue</CardDescription><CardTitle className="mt-1 text-2xl">${(summary.kpis.totalRevenue || 0).toFixed(2)}</CardTitle></CardHeader><CardContent><Progress value={Math.min(100, (summary.kpis.totalRevenue || 0) / 1000)} /></CardContent></Card>
          <Card><CardHeader><CardDescription>Active Printers</CardDescription><CardTitle className="mt-1 text-2xl">{summary.kpis.activePrinters || 0}</CardTitle></CardHeader><CardContent><Progress value={Math.min(100, ((summary.kpis.activePrinters || 0) / Math.max(summary.printers.length, 1)) * 100)} /></CardContent></Card>
          <Card><CardHeader><CardDescription>Conversion Rate</CardDescription><CardTitle className="mt-1 text-2xl">{summary.kpis.conversionRate || 0}%</CardTitle></CardHeader><CardContent><Progress value={summary.kpis.conversionRate || 0} /></CardContent></Card>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader>
              <CardDescription>Live Production</CardDescription>
              <CardTitle className="mt-1 text-2xl">{livePrinting}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-sky-500 animate-pulse" />
                currently printing
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Pending Queue</CardDescription>
              <CardTitle className="mt-1 text-2xl">{livePending}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-[var(--muted)]">orders waiting for production</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>COD Due Orders</CardDescription>
              <CardTitle className="mt-1 text-2xl">{liveCodDue}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-[var(--muted)]">partially paid orders</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Last Sync</CardDescription>
              <CardTitle className="mt-1 text-2xl">{lastUpdatedAt ? formatRelativeTime(lastUpdatedAt) : "n/a"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                <Radio size={12} className={cn(autoRefresh && "text-emerald-500")} />
                auto refresh {autoRefresh ? "on" : "off"} ({LIVE_REFRESH_MS / 1000}s)
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-5">
          <Card className="xl:col-span-3">
            <CardHeader><CardTitle>Order Analytics</CardTitle><CardDescription>Monthly orders and revenue</CardDescription></CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.monthlyAnalytics || []}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.25} />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="orders" />
                  <YAxis yAxisId="revenue" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="orders" dataKey="orders" fill="#4f46e5" />
                  <Bar yAxisId="revenue" dataKey="revenue" fill="#0ea5e9" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="xl:col-span-2">
            <CardHeader><CardTitle>Revenue Trend</CardTitle><CardDescription>Growth curve</CardDescription></CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={summary.monthlyAnalytics || []}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.25} />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="revenue" stroke="#4f46e5" fill="#4f46e533" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </section>
      </>
    );
  }

  function renderOrders() {
    return (
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><CardTitle>Orders Management</CardTitle><CardDescription>Update status and assign printers</CardDescription></div>
          <div className="flex gap-2">
            {["All", "Pending", "Printing", "Completed", "Cancelled"].map((status) => (
              <Button key={status} variant={statusFilter === status ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(status)}>{status}</Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Order</TableHead><TableHead>Customer Code</TableHead><TableHead>Customer Name</TableHead><TableHead>Model</TableHead><TableHead>Material</TableHead><TableHead>Qty</TableHead><TableHead>Price</TableHead><TableHead>Live Status</TableHead><TableHead>Payment</TableHead><TableHead>Updated</TableHead><TableHead>Assign</TableHead><TableHead>Details</TableHead></TableRow></TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order._id}>
                  <TableCell className="font-semibold">{order.orderId}</TableCell>
                  <TableCell className="font-mono text-xs">{order.customerCode || "CUS-NA"}</TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell>{order.modelName}</TableCell>
                  <TableCell>{order.material}</TableCell>
                  <TableCell>{order.quantity || 1}</TableCell>
                  <TableCell>${Number(order.price || 0).toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex h-2.5 w-2.5 rounded-full",
                          order.status === "Printing" ? "bg-sky-500 animate-pulse" : "",
                          order.status === "Pending" ? "bg-amber-500" : "",
                          order.status === "Completed" ? "bg-emerald-500" : "",
                          order.status === "Cancelled" ? "bg-rose-500" : ""
                        )}
                      />
                      <select className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs" value={order.status} onChange={(e) => updateOrder(order._id, { status: e.target.value })}>
                        {["Pending", "Printing", "Completed", "Cancelled"].map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge status={order.paymentStatus || "Unpaid"}>{order.paymentStatus || "Unpaid"}</Badge>
                    {order?.pricingBreakdown?.paymentOption === "cod" && (
                      <p className="mt-1 text-[10px] text-[var(--muted)]">
                        due INR {Number(order?.pricingBreakdown?.dueOnDelivery || 0).toFixed(2)}
                      </p>
                    )}
                    <p className="mt-1 text-[10px] text-[var(--muted)]">
                      PP: {formatPostProcessing(order?.pricingBreakdown?.postProcessing)}
                    </p>
                    <p className="text-[10px] text-[var(--muted)]">
                      {formatShipping(order?.pricingBreakdown?.shipping)}
                    </p>
                  </TableCell>
                  <TableCell className="text-xs text-[var(--muted)]">
                    {formatRelativeTime(order.updatedAt || order.createdAt)}
                  </TableCell>
                  <TableCell>
                    <select className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs" value={order.assignedPrinter || ""} onChange={(e) => updateOrder(order._id, { assignedPrinter: e.target.value })}>
                      <option value="">Unassigned</option>
                      {summary.printers.map((p) => <option key={p._id} value={p.name}>{p.name}</option>)}
                    </select>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => setSelectedOrderDetails(order)}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  function renderUploads() {
    return (
      <Card>
        <CardHeader><CardTitle>Upload Models</CardTitle><CardDescription>STL previews, size checks, and status management</CardDescription></CardHeader>
        <CardContent className="space-y-3 text-sm">
          {summary.uploads.map((u) => (
            <div key={u._id} className="rounded-xl border border-[var(--border)] p-3">
              <p className="font-medium">{u.modelName}</p>
              <p className="text-xs text-[var(--muted)]">{u.fileName} · {(u.fileSize / 1024).toFixed(1)} KB</p>
              <div className="mt-2 flex gap-2">
                <a className="rounded-lg border border-[var(--border)] px-2 py-1 text-xs" href={`${API_BASE}/uploads/${u.fileName}`} target="_blank">Download</a>
                <select className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs" value={u.status} onChange={async (e) => { await api(`/api/admin/uploads/${u._id}`, { method: "PATCH", body: JSON.stringify({ status: e.target.value }) }); await loadSummary(); }}>
                  {["Uploaded", "Validated", "Rejected"].map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  function renderCustomers() {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Customers</CardTitle><CardDescription>Customer accounts with quick access to full work details</CardDescription></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Customer Code</TableHead><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Orders</TableHead><TableHead>Spend</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
              <TableBody>
                {summary.customers.map((c) => (
                  <TableRow key={c.id} className={selectedCustomerId === c.id ? "bg-indigo-50/50 dark:bg-indigo-900/20" : ""}>
                    <TableCell className="font-mono text-xs">{c.customerCode}</TableCell>
                    <TableCell>{c.name}</TableCell>
                    <TableCell>{c.email}</TableCell>
                    <TableCell>{c.orders}</TableCell>
                    <TableCell>${Number(c.spend || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => loadCustomerDetails(c.id)}>
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Full Work Details</CardTitle>
            <CardDescription>
              {selectedCustomerId ? "Complete history of orders, uploads, quotes, tickets and reviews" : "Select a customer above to load details"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {customerDetailsLoading && <p className="text-sm text-[var(--muted)]">Loading customer details...</p>}
            {!customerDetailsLoading && customerDetailsError && (
              <p className="text-sm text-red-600">{customerDetailsError}</p>
            )}
            {!customerDetailsLoading && !customerDetails && (
              <p className="text-sm text-[var(--muted)]">No customer selected.</p>
            )}
            {!customerDetailsLoading && customerDetails && (
              <>
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="rounded-xl border border-[var(--border)] p-3"><p className="text-xs text-[var(--muted)]">Customer</p><p className="font-semibold">{customerDetails.customer.name}</p><p className="text-xs">{customerDetails.customer.customerCode}</p></div>
                  <div className="rounded-xl border border-[var(--border)] p-3"><p className="text-xs text-[var(--muted)]">Total Orders</p><p className="font-semibold">{customerDetails.stats.totalOrders}</p></div>
                  <div className="rounded-xl border border-[var(--border)] p-3"><p className="text-xs text-[var(--muted)]">Active Work</p><p className="font-semibold">{customerDetails.stats.activeOrders}</p></div>
                  <div className="rounded-xl border border-[var(--border)] p-3"><p className="text-xs text-[var(--muted)]">Total Spent</p><p className="font-semibold">${Number(customerDetails.stats.totalSpent || 0).toFixed(2)}</p></div>
                </div>

                <div className="rounded-xl border border-[var(--border)] p-3">
                  <p className="mb-2 text-sm font-semibold">Order History</p>
                  <div className="space-y-2 text-sm">
                    {customerDetails.orders.length === 0 && <p className="text-[var(--muted)]">No orders found.</p>}
                    {customerDetails.orders.map((order) => (
                      <div key={order._id} className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2">
                        <div>
                          <span>{order.orderId} - {order.modelName} - {order.material} x {order.quantity || 1}</span>
                          <p className="text-xs text-[var(--muted)]">
                            Post-Processing: {formatPostProcessing(order?.pricingBreakdown?.postProcessing)}
                          </p>
                          <p className="text-xs text-[var(--muted)]">
                            Shipping: {formatShipping(order?.pricingBreakdown?.shipping)}
                          </p>
                        </div>
                        <span>${Number(order.price || 0).toFixed(2)} - {order.status}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-[var(--border)] p-3">
                    <p className="mb-2 text-sm font-semibold">Uploads</p>
                    {customerDetails.uploads.length === 0 && <p className="text-sm text-[var(--muted)]">No uploads found.</p>}
                    {customerDetails.uploads.map((u) => (
                      <p key={u._id} className="text-sm">{u.modelName} ({(u.fileSize / 1024).toFixed(1)} KB) · {u.status}</p>
                    ))}
                  </div>
                  <div className="rounded-xl border border-[var(--border)] p-3">
                    <p className="mb-2 text-sm font-semibold">Quotes</p>
                    {customerDetails.quotes.length === 0 && <p className="text-sm text-[var(--muted)]">No quotes found.</p>}
                    {customerDetails.quotes.map((q) => (
                      <p key={q._id} className="text-sm">{q.quoteId} · ${Number(q.estimatedPrice || 0).toFixed(2)} · {q.status}</p>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-[var(--border)] p-3">
                    <p className="mb-2 text-sm font-semibold">Support Tickets</p>
                    {customerDetails.tickets.length === 0 && <p className="text-sm text-[var(--muted)]">No tickets found.</p>}
                    {customerDetails.tickets.map((t) => (
                      <p key={t._id} className="text-sm">{t.ticketId} · {t.subject} · {t.status}</p>
                    ))}
                  </div>
                  <div className="rounded-xl border border-[var(--border)] p-3">
                    <p className="mb-2 text-sm font-semibold">Reviews</p>
                    {customerDetails.reviews.length === 0 && <p className="text-sm text-[var(--muted)]">No reviews found.</p>}
                    {customerDetails.reviews.map((r) => (
                      <p key={r._id} className="text-sm">"{r.comment}" ({r.rating}/5)</p>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  function renderQuotes() {
    return (
      <Card>
        <CardHeader><CardTitle>Quotes</CardTitle><CardDescription>Approve or reject pending quote requests</CardDescription></CardHeader>
        <CardContent className="space-y-2">
          {summary.quotes.map((quote) => (
            <div key={quote._id} className="flex items-center justify-between rounded border border-[var(--border)] p-2">
              <span>{quote.quoteId} · {quote.customerName} · ${quote.estimatedPrice}</span>
              <select className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs" value={quote.status} onChange={async (e) => { await api(`/api/admin/quotes/${quote._id}`, { method: "PATCH", body: JSON.stringify({ status: e.target.value }) }); await loadSummary(); }}>
                {["Pending", "Approved", "Rejected"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  function renderPayments() {
    return (
      <Card>
        <CardHeader><CardTitle>Payments</CardTitle><CardDescription>Track live payment state including COD advance and remaining due</CardDescription></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Order</TableHead><TableHead>Customer</TableHead><TableHead>Grand Total</TableHead><TableHead>Paid Now</TableHead><TableHead>Due</TableHead><TableHead>Payment</TableHead><TableHead>Updated</TableHead></TableRow></TableHeader>
            <TableBody>
              {summary.orders.map((o) => (
                <TableRow key={o._id}>
                  <TableCell>{o.orderId}</TableCell>
                  <TableCell>{o.customerName}</TableCell>
                  <TableCell>INR {Number(o.price || 0).toFixed(2)}</TableCell>
                  <TableCell>INR {Number(o?.pricingBreakdown?.payableNow || 0).toFixed(2)}</TableCell>
                  <TableCell>INR {Number(o?.pricingBreakdown?.dueOnDelivery || 0).toFixed(2)}</TableCell>
                  <TableCell><Badge status={o.paymentStatus || "Unpaid"}>{o.paymentStatus || "Unpaid"}</Badge></TableCell>
                  <TableCell className="text-xs text-[var(--muted)]">{formatRelativeTime(o.updatedAt || o.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  function renderPrinters() {
    return (
      <Card>
        <CardHeader><CardTitle>Printers</CardTitle><CardDescription>Add printers and set status</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Printer name" value={newPrinter.name} onChange={(e) => setNewPrinter((p) => ({ ...p, name: e.target.value }))} />
            <Input placeholder="Type" value={newPrinter.type} onChange={(e) => setNewPrinter((p) => ({ ...p, type: e.target.value }))} />
            <Input placeholder="Location" value={newPrinter.location} onChange={(e) => setNewPrinter((p) => ({ ...p, location: e.target.value }))} />
          </div>
          <Button onClick={addPrinter}>Add Printer</Button>
          {summary.printers.map((printer) => (
            <div key={printer._id} className="flex items-center justify-between rounded-xl border border-[var(--border)] p-2 text-sm">
              <span>{printer.name}</span>
              <select className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs" value={printer.status} onChange={async (e) => { await api(`/api/admin/printers/${printer._id}`, { method: "PATCH", body: JSON.stringify({ status: e.target.value }) }); await loadSummary(); }}>
                {["Idle", "Printing", "Maintenance"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  function renderMaterials() {
    return (
      <Card>
        <CardHeader><CardTitle>Materials</CardTitle><CardDescription>Manage materials and per-gram pricing</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Name" value={newMaterial.name} onChange={(e) => setNewMaterial((m) => ({ ...m, name: e.target.value }))} />
            <Input placeholder="Price/gram" type="number" value={newMaterial.pricePerGram} onChange={(e) => setNewMaterial((m) => ({ ...m, pricePerGram: e.target.value }))} />
            <Input placeholder="Stock grams" type="number" value={newMaterial.stockGrams} onChange={(e) => setNewMaterial((m) => ({ ...m, stockGrams: e.target.value }))} />
          </div>
          <Button onClick={addMaterial}>Add Material</Button>
          {summary.materials.map((material) => (
            <div key={material._id} className="flex items-center justify-between rounded-xl border border-[var(--border)] px-3 py-2 text-sm">
              <span>{material.name}</span>
              <span>${Number(material.pricePerGram).toFixed(2)}/g</span>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  function renderAnalytics() {
    return renderDashboard();
  }

  function renderReviews() {
    return (
      <Card>
        <CardHeader><CardTitle>Reviews</CardTitle><CardDescription>Latest customer feedback</CardDescription></CardHeader>
        <CardContent className="space-y-2">
          {summary.reviews.map((review) => (
            <div key={review._id} className="rounded border border-[var(--border)] p-2">"{review.comment}" - {review.userName} ({review.rating}/5)</div>
          ))}
        </CardContent>
      </Card>
    );
  }

  function renderTickets() {
    return (
      <Card>
        <CardHeader><CardTitle>Support Tickets</CardTitle><CardDescription>Manage support queue</CardDescription></CardHeader>
        <CardContent className="space-y-2">
          {summary.tickets.map((ticket) => (
            <div key={ticket._id} className="rounded-lg border border-[var(--border)] p-2 text-sm">
              <p className="font-medium">{ticket.subject}</p>
              <p className="text-xs text-[var(--muted)]">{ticket.customerName}</p>
              <div className="mt-1 flex gap-2">
                <Badge>{ticket.priority}</Badge>
                <select className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs" value={ticket.status} onChange={async (e) => { await api(`/api/admin/tickets/${ticket._id}`, { method: "PATCH", body: JSON.stringify({ status: e.target.value }) }); await loadSummary(); }}>
                  {["Open", "In Progress", "Resolved"].map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  function renderSettings() {
    return (
      <Card>
        <CardHeader><CardTitle>Settings</CardTitle><CardDescription>Pricing configuration</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          <Input type="number" placeholder="Price per gram" value={pricingDraft.pricePerGram} onChange={(e) => setPricingDraft((p) => ({ ...p, pricePerGram: e.target.value }))} />
          <Input type="number" placeholder="Machine cost" value={pricingDraft.machineCost} onChange={(e) => setPricingDraft((p) => ({ ...p, machineCost: e.target.value }))} />
          <Input type="number" placeholder="Shipping cost" value={pricingDraft.shippingCost} onChange={(e) => setPricingDraft((p) => ({ ...p, shippingCost: e.target.value }))} />
          <Button onClick={savePricing}>Save Pricing</Button>
        </CardContent>
      </Card>
    );
  }

  function renderContactInbox() {
    const contacts = (summary.contacts || [])
      .filter((c) => contactFilter === "All" || c.status === contactFilter)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    const latestContactId = contacts[0]?._id;

    return (
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Contact Chats</CardTitle>
            <CardDescription>Open chats and manage reply status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              {["All", "Open", "Replied", "Closed"].map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={contactFilter === status ? "default" : "outline"}
                  onClick={() => setContactFilter(status)}
                >
                  {status}
                </Button>
              ))}
            </div>
            <div className="space-y-2">
              {contacts.map((contact) => (
                (() => {
                  const isLatest = latestContactId === contact._id;
                  const isFresh = Date.now() - new Date(contact.updatedAt).getTime() < 15 * 60 * 1000;
                  return (
                <button
                  key={contact._id}
                  onClick={() => openContact(contact._id)}
                  className={cn(
                    "w-full rounded-xl border p-3 text-left transition",
                    "hover:border-indigo-300 hover:bg-indigo-50/40 dark:hover:border-indigo-700 dark:hover:bg-indigo-900/20",
                    selectedContactId === contact._id && "border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-900/20",
                    !selectedContactId && isLatest && "border-indigo-300 bg-indigo-50/70 dark:border-indigo-700 dark:bg-indigo-900/25",
                    isFresh && "shadow-[0_0_0_1px_rgba(79,70,229,0.25)]"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{contact.name} ({contact.customerCode})</p>
                    {isLatest && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                        <span className="inline-flex h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                        Latest
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--muted)]">{contact.email}</p>
                  <p className="mt-1 text-xs">{contact.subject}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <Badge>{contact.status}</Badge>
                    <span className="text-xs text-[var(--muted)]">{formatRelativeTime(contact.updatedAt)}</span>
                  </div>
                </button>
                  );
                })()
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Conversation</CardTitle>
            <CardDescription>Reply directly to email and WhatsApp</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedContact && <p className="text-sm text-[var(--muted)]">Select a contact from the left panel.</p>}
            {selectedContact && (
              <>
                <div className="rounded-xl border border-[var(--border)] p-3">
                  <p className="font-semibold">{selectedContact.name} ({selectedContact.customerCode})</p>
                  <p className="text-sm text-[var(--muted)]">{selectedContact.email} · {selectedContact.phone}</p>
                  <p className="mt-2 text-sm"><b>Customer message:</b> {selectedContact.message}</p>
                  {selectedContact.attachment?.url && (
                    <a
                      className="mt-2 inline-block rounded-lg border border-[var(--border)] px-2 py-1 text-xs"
                      href={`${API_BASE}${selectedContact.attachment.url}`}
                      target="_blank"
                    >
                      View Attachment: {selectedContact.attachment.originalName}
                    </a>
                  )}
                </div>

                <div className="rounded-xl border border-[var(--border)] p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-semibold">Replies</p>
                    <select
                      className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs"
                      value={selectedContact.status}
                      onChange={(e) => updateContactStatus(selectedContact._id, e.target.value)}
                    >
                      {["Open", "Replied", "Closed"].map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    {selectedContact.replies?.length === 0 && (
                      <p className="text-sm text-[var(--muted)]">No replies yet.</p>
                    )}
                    {selectedContact.replies?.map((reply) => (
                      <div key={reply._id} className="rounded-lg border border-[var(--border)] p-2 text-sm">
                        <p>{reply.message}</p>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          Email: {reply.emailSent ? "Sent" : `Failed (${reply.emailError || "n/a"})`} · WhatsApp: {reply.whatsappSent ? "Sent" : `Failed (${reply.whatsappError || "n/a"})`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <textarea
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-sm"
                    rows={4}
                    placeholder="Type your reply. This will be sent to email and WhatsApp."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <Button onClick={sendContactReply} disabled={sendingReply || !replyText.trim()}>
                    {sendingReply ? "Sending..." : "Send Reply (Email + WhatsApp)"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  function renderOrderDetailsDrawer() {
    if (!selectedOrderDetails) return null;
    const order = selectedOrderDetails;
    const shipping = order?.pricingBreakdown?.shipping || {};
    const pricing = order?.pricingBreakdown || {};
    return (
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]">
        <div className="absolute inset-y-0 right-0 w-full max-w-xl overflow-y-auto border-l border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Order Details</h2>
              <p className="text-xs text-[var(--muted)]">{order.orderId} - {order.customerName}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setSelectedOrderDetails(null)}>Close</Button>
          </div>

          <div className="space-y-4 text-sm">
            <div className="rounded-xl border border-[var(--border)] p-3">
              <p><b>Model:</b> {order.modelName}</p>
              <p><b>Material:</b> {order.material}</p>
              <p><b>Quantity:</b> {order.quantity || 1}</p>
              <p><b>Weight:</b> {Number(order.weight || 0).toFixed(2)} g</p>
              <p><b>Status:</b> {order.status}</p>
              <p><b>Payment Status:</b> {order.paymentStatus || "Unpaid"}</p>
            </div>

            <div className="rounded-xl border border-[var(--border)] p-3">
              <p className="mb-1 font-semibold">Post-Processing</p>
              <p>{formatPostProcessing(pricing.postProcessing)}</p>
            </div>

            <div className="rounded-xl border border-[var(--border)] p-3">
              <p className="mb-1 font-semibold">Shipping Details</p>
              <p><b>Method:</b> {shipping.method === "express" ? "Express" : "Standard"}</p>
              <p><b>Name:</b> {shipping.fullName || "-"}</p>
              <p><b>Address:</b> {[shipping.streetAddress, shipping.city, shipping.postalCode].filter(Boolean).join(", ") || "-"}</p>
            </div>

            <div className="rounded-xl border border-[var(--border)] p-3">
              <p className="mb-1 font-semibold">Payment Breakdown</p>
              <p><b>Material Cost:</b> {inr(pricing.materialCost)}</p>
              <p><b>Post-Processing:</b> {inr(pricing.postProcessingCost)}</p>
              <p><b>Shipping:</b> {inr(pricing.shippingCost)}</p>
              <p><b>Subtotal:</b> {inr(pricing.subtotal)}</p>
              <p><b>Discount:</b> {inr(pricing.discount)}</p>
              <p><b>Tax:</b> {inr(pricing.tax)}</p>
              <p><b>Grand Total:</b> {inr(pricing.grandTotal || order.price)}</p>
              <p><b>Payment Option:</b> {pricing.paymentOption === "cod" ? "COD" : "Online"}</p>
              <p><b>Paid Now:</b> {inr(pricing.payableNow)}</p>
              <p><b>Due:</b> {inr(pricing.dueOnDelivery)}</p>
            </div>

            <div className="rounded-xl border border-[var(--border)] p-3 text-xs text-[var(--muted)]">
              <p>Created: {order.createdAt ? new Date(order.createdAt).toLocaleString() : "-"}</p>
              <p>Updated: {order.updatedAt ? new Date(order.updatedAt).toLocaleString() : "-"}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderMainContent() {
    switch (activeItem) {
      case "Dashboard":
        return renderDashboard();
      case "Orders":
        return renderOrders();
      case "Upload Models":
        return renderUploads();
      case "Customers":
        return renderCustomers();
      case "Quotes":
        return renderQuotes();
      case "Payments":
        return renderPayments();
      case "Printers":
        return renderPrinters();
      case "Materials":
        return renderMaterials();
      case "Analytics":
        return renderAnalytics();
      case "Reviews":
        return renderReviews();
      case "Support Tickets":
        return renderTickets();
      case "Contact Inbox":
        return renderContactInbox();
      case "Settings":
        return renderSettings();
      default:
        return renderDashboard();
    }
  }

  const showQuickPanel = ["Dashboard", "Analytics"].includes(activeItem);

  if (loading) return <div className="p-10 text-sm text-[var(--muted)]">Loading live dashboard...</div>;

  return (
    <div className={isDark ? "dark" : ""}>
      <div className="dashboard-grid-bg min-h-screen bg-[var(--bg)] text-[var(--text)]">
        <div className="flex min-h-screen">
          <aside
            className={cn(
              "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-[var(--border)] bg-[var(--surface)] p-4 transition-all duration-300 lg:static",
              sidebarCollapsed ? "w-20" : "w-72",
              mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}
          >
            <div className="mb-6 flex items-center justify-between">
              <div className={cn("flex items-center gap-2", sidebarCollapsed && "justify-center")}>
                <div className="h-9 w-9 rounded-xl bg-indigo-600" />
                {!sidebarCollapsed && <span className="text-sm font-semibold">Nexus3D Admin</span>}
              </div>
              <button className="hidden rounded-lg p-2 hover:bg-[var(--primary-soft)] lg:block" onClick={() => setSidebarCollapsed((prev) => !prev)}>
                {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>
            </div>
            <nav className="flex-1 space-y-1">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const active = activeItem === item.label;
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      setActiveItem(item.label);
                      setMobileSidebarOpen(false);
                    }}
                    className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition hover:bg-[var(--primary-soft)]", active && "bg-[var(--primary-soft)] text-indigo-600 dark:text-indigo-300")}
                  >
                    <Icon size={18} />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </button>
                );
              })}
            </nav>
            <div className="rounded-xl border border-[var(--border)] p-3 text-xs text-[var(--muted)]">Active section: {activeItem}</div>
          </aside>

          <main className="min-w-0 flex-1">
            <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg)]/90 backdrop-blur">
              <div className="flex items-center gap-3 px-4 py-3 lg:px-8">
                <Button variant="outline" size="icon" className="lg:hidden" onClick={() => setMobileSidebarOpen((p) => !p)}>
                  <Menu size={16} />
                </Button>
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <h1 className="text-lg font-semibold">{activeItem}</h1>
                  <div className="relative hidden w-full max-w-lg sm:block">
                    <Search size={16} className="absolute left-3 top-3 text-[var(--muted)]" />
                    <Input value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" placeholder="Search orders, models, customers..." />
                  </div>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <Button
                    variant={alertsEnabled ? "default" : "outline"}
                    size="sm"
                    onClick={enableDesktopAlerts}
                    title="Enable browser notifications for live events"
                  >
                    <Bell size={14} className={cn("mr-2", alertsEnabled && "animate-pulse")} />
                    Alerts {alertsEnabled ? "On" : "Off"}
                  </Button>
                  <Button
                    variant={playSound ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPlaySound((prev) => !prev)}
                    title="Toggle alert sound"
                  >
                    Sound {playSound ? "On" : "Off"}
                  </Button>
                  <Button
                    variant={autoRefresh ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAutoRefresh((prev) => !prev)}
                    title={`Auto refresh every ${LIVE_REFRESH_MS / 1000}s`}
                  >
                    <Radio size={14} className={cn("mr-2", autoRefresh && "animate-pulse")} />
                    Live {autoRefresh ? "On" : "Off"}
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => loadSummary()} disabled={refreshing} title="Refresh now">
                    <RefreshCw size={16} className={cn(refreshing && "animate-spin")} />
                  </Button>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell size={16} />
                    <span className="absolute -right-1 -top-1 rounded-full bg-indigo-600 px-1.5 text-[10px] text-white">{unreadNotifications}</span>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setActiveItem("Contact Inbox")}>
                    <MessageSquare size={16} />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => setIsDark((prev) => !prev)}>{isDark ? <Sun size={16} /> : <Moon size={16} />}</Button>
                </div>
              </div>
            </header>

            <div className={cn("grid gap-6 px-4 py-6 lg:px-8", showQuickPanel ? "lg:grid-cols-12" : "")}>
              {lastAlertMessage && (
                <div className="lg:col-span-12 rounded-xl border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm text-indigo-700 dark:border-indigo-700 dark:bg-indigo-900/25 dark:text-indigo-200">
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                    {lastAlertMessage}
                  </span>
                </div>
              )}
              <div className={cn("space-y-6", showQuickPanel ? "lg:col-span-9" : "lg:col-span-12")}>{renderMainContent()}</div>

              {showQuickPanel && (
                <aside className="space-y-4 lg:col-span-3">
                  <Card>
                    <CardHeader><CardTitle>Quick Stats</CardTitle><CardDescription>Live summary panel</CardDescription></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Top Customers</p>
                        {summary.topCustomers.map((customer) => (
                          <div key={customer.name} className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2">
                            <span className="text-sm">{customer.name}</span>
                            <span className="text-sm font-semibold">${customer.spend.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                      <div className="h-44">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Popular Materials</p>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={summary.popularMaterials} dataKey="value" nameKey="name" innerRadius={40} outerRadius={64} paddingAngle={2}>
                              {(summary.popularMaterials || []).map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="rounded-xl border border-[var(--border)] p-3">
                        <p className="text-xs text-[var(--muted)]">Average Order Value</p>
                        <p className="text-2xl font-semibold">${Number(summary.kpis.averageOrderValue || 0).toFixed(2)}</p>
                      </div>
                    </CardContent>
                  </Card>
                </aside>
              )}
            </div>
            {renderOrderDetailsDrawer()}
          </main>
        </div>
      </div>
    </div>
  );
}

