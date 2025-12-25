"use client";
import React, { useState } from "react";
import { Plus, Trash2, Download, RefreshCw } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Props {
  client: any;
  settings: any;
  onClose: () => void;
}

export default function InvoiceGenerator({ client, settings, onClose }: Props) {
  const [items, setItems] = useState([
    {
      desc: client.service || "Consulting Service",
      qty: 1,
      rate: client.price || 0,
    },
  ]);
  const [invoiceNum, setInvoiceNum] = useState(
    `INV-${client.id}-${new Date().getFullYear()}`
  );
  const [taxRate, setTaxRate] = useState(0);

  // Calc Totals
  const subtotal = items.reduce((sum, item) => sum + item.qty * item.rate, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const addItem = () => setItems([...items, { desc: "", qty: 1, rate: 0 }]);
  const removeItem = (index: number) =>
    setItems(items.filter((_, i) => i !== index));
  const updateItem = (index: number, field: string, val: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: val };
    setItems(newItems);
  };

  const generatePDF = () => {
    const doc = new jsPDF();

    // 1. Header
    doc.setFontSize(24);
    doc.setTextColor(40);
    doc.text("INVOICE", 160, 20);

    // 2. Company Info (From)
    doc.setFontSize(10);
    doc.text(settings.company_name, 14, 20);
    doc.text(settings.full_name, 14, 25);

    // 3. Client Info (To) - USA Standard Format
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Bill To:", 14, 45);
    doc.setFont("helvetica", "normal");
    doc.text(client.name, 14, 52);
    doc.text(client.address || "", 14, 57);
    doc.text(
      `${client.city || ""}, ${client.state || ""} ${client.zip || ""}`,
      14,
      62
    );

    // 4. Invoice Details
    doc.text(`Invoice #: ${invoiceNum}`, 140, 45);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 140, 50);
    doc.text(`Due Date: ${client.due_date || "On Receipt"}`, 140, 55);

    // 5. Line Items Table
    autoTable(doc, {
      startY: 75,
      head: [["Description", "Qty", "Rate", "Amount"]],
      body: items.map((item) => [
        item.desc,
        item.qty,
        `$${item.rate}`,
        `$${(item.qty * item.rate).toFixed(2)}`,
      ]),
      theme: "grid",
      headStyles: { fillColor: [66, 66, 66] },
    });

    // 6. Totals
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.text(`Subtotal: $${subtotal.toFixed(2)}`, 140, finalY);
    doc.text(`Tax (${taxRate}%): $${taxAmount.toFixed(2)}`, 140, finalY + 6);
    doc.setFont("helvetica", "bold");
    doc.text(`Total: $${total.toFixed(2)}`, 140, finalY + 14);

    // 7. Footer
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.text("Thank you for your business!", 105, 280, { align: "center" });

    doc.save(`${invoiceNum}.pdf`);
  };

  return (
    <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700">
      <h2 className="text-xl font-bold mb-4">Invoice Builder</h2>

      {/* Settings Row */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <label className="text-xs text-gray-500">Invoice #</label>
          <input
            className="w-full p-2 border rounded"
            value={invoiceNum}
            onChange={(e) => setInvoiceNum(e.target.value)}
          />
        </div>
        <div className="w-24">
          <label className="text-xs text-gray-500">Tax %</label>
          <input
            type="number"
            className="w-full p-2 border rounded"
            value={taxRate}
            onChange={(e) => setTaxRate(Number(e.target.value))}
          />
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-4">
        <div className="grid grid-cols-12 gap-2 text-xs font-bold text-gray-500 mb-2">
          <div className="col-span-6">Description</div>
          <div className="col-span-2">Qty</div>
          <div className="col-span-2">Rate</div>
          <div className="col-span-2">Total</div>
        </div>
        {items.map((item, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 mb-2 items-center">
            <div className="col-span-6">
              <input
                className="w-full p-2 border rounded text-sm"
                value={item.desc}
                onChange={(e) => updateItem(i, "desc", e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <input
                type="number"
                className="w-full p-2 border rounded text-sm"
                value={item.qty}
                onChange={(e) => updateItem(i, "qty", Number(e.target.value))}
              />
            </div>
            <div className="col-span-2">
              <input
                type="number"
                className="w-full p-2 border rounded text-sm"
                value={item.rate}
                onChange={(e) => updateItem(i, "rate", Number(e.target.value))}
              />
            </div>
            <div className="col-span-1 text-sm font-bold">
              ${(item.qty * item.rate).toFixed(2)}
            </div>
            <div className="col-span-1">
              <button
                onClick={() => removeItem(i)}
                className="text-red-500 hover:bg-red-50 p-1 rounded"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        <button
          onClick={addItem}
          className="text-blue-600 text-sm flex items-center gap-1 mt-2 hover:underline"
        >
          <Plus size={16} /> Add Line Item
        </button>
      </div>

      {/* Footer Actions */}
      <div className="flex justify-between items-center border-t pt-4">
        <div className="text-lg font-bold">Total: ${total.toFixed(2)}</div>
        <button
          onClick={generatePDF}
          className="bg-purple-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700 shadow-lg"
        >
          <Download size={18} /> Download PDF
        </button>
      </div>
    </div>
  );
}
