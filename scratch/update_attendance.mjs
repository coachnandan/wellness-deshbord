import fs from 'fs';

const filePath = 'c:/Users/swati/Downloads/fixed_dashboard/desh/src/pages/Attendance.jsx';
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Update setPaymentModal in handleRemarkChange
content = content.replace(
  /setPaymentModal\({ customerId, customerName: customer\?\.name \|\| 'Unknown', remark: remarkValue, days, dailyRate, totalAmount: days \* dailyRate }\);/,
  `setPaymentModal({ 
        customerId, 
        customerName: customer?.name || 'Unknown', 
        remark: remarkValue, 
        days, 
        dailyRate,
        plan: '1 Day',
        customDuration: '',
        totalAmount: 173,
        paymentStatus: 'Paid',
        advanceAmount: 173,
        dueAmount: 0,
        paymentMethod: 'Cash'
      });`
);

// 2. Update handlePaymentConfirm to handle the new fields
content = content.replace(
  /const { customerId, remark, days, dailyRate, totalAmount } = paymentModal;/,
  `const { customerId, remark, days, dailyRate, totalAmount, paymentStatus, advanceAmount, dueAmount, paymentMethod, plan, customDuration } = paymentModal;
    const finalDays = plan === 'Custom' && customDuration ? parseInt(customDuration) : 
                     (plan === '1 Day' ? 1 : plan === '3 Days' ? 3 : plan === '10 Days' ? 10 : 30);`
);

// Update logShakePayment call inside handlePaymentConfirm
content = content.replace(
  /await logShakePayment\(customerId, remark, days, totalAmount\);/,
  `await logShakePayment(customerId, remark, finalDays, totalAmount, paymentStatus, advanceAmount, dueAmount, paymentMethod);`
);

// 3. Replace the PaymentModal JSX
const oldModalStart = `{/* Daily Rate Payment Modal */}`;
const oldModalEnd = `  const filteredClients`;
const newModal = `{/* Daily Rate Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 bg-charcoal/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/20 animate-in fade-in slide-in-from-bottom-8 duration-300">
            <div className="px-8 py-6 border-b border-beige flex items-center justify-between bg-offwhite/30">
              <div className="flex items-center gap-4">
                <div className={\`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm \${
                  paymentModal.remark === 'S' ? 'bg-[#D97706]/10 text-[#D97706]' :
                  paymentModal.remark === 'SB' ? 'bg-[#7C3AED]/10 text-[#7C3AED]' : 'bg-[#0891B2]/10 text-[#0891B2]'
                }\`}><DollarSign size={20} /></div>
                <div>
                  <h3 className="text-xl font-extrabold text-forest">{REMARK_LABELS[paymentModal.remark]}</h3>
                  <p className="text-xs text-muted font-bold mt-1">{paymentModal.customerName}</p>
                </div>
              </div>
              <button onClick={() => setPaymentModal(null)} className="p-2 rounded-xl bg-offwhite text-muted hover:bg-beige transition-colors"><X size={20} /></button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); handlePaymentConfirm(); }} className="p-8 space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                <div className={paymentModal.plan === 'Custom' ? 'col-span-1' : 'col-span-2'}>
                  <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1 mb-2">Payment Plan *</label>
                  <select 
                    required
                    value={paymentModal.plan}
                    onChange={(e) => {
                      const plan = e.target.value;
                      const defaultAmount = plan === '1 Day' ? 173 : plan === '3 Days' ? 729 : plan === '10 Days' ? 2500 : plan === '30 Days' ? 7000 : '';
                      setPaymentModal(p => {
                        const newTotal = defaultAmount || p.totalAmount;
                        const adv = p.paymentStatus === 'Paid' ? newTotal : (p.paymentStatus === 'Advance' ? p.advanceAmount : 0);
                        const due = p.paymentStatus === 'Due' ? newTotal : (p.paymentStatus === 'Advance' ? Math.max(0, newTotal - adv) : 0);
                        return { ...p, plan, totalAmount: newTotal, advanceAmount: adv, dueAmount: due };
                      });
                    }}
                    className="w-full h-14 px-6 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all appearance-none"
                  >
                    <option value="1 Day">1 Day (₹173)</option>
                    <option value="3 Days">3 Days (₹729)</option>
                    <option value="10 Days">10 Days (₹2500)</option>
                    <option value="30 Days">30 Days (₹7000)</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
                {paymentModal.plan === 'Custom' && (
                  <div>
                    <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1 mb-2">Days *</label>
                    <input 
                      type="number" required min="1"
                      value={paymentModal.customDuration}
                      onChange={(e) => setPaymentModal(p => ({...p, customDuration: e.target.value}))}
                      className="w-full h-14 px-6 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1 mb-2">Payment Status *</label>
                  <select 
                    required
                    value={paymentModal.paymentStatus}
                    onChange={(e) => {
                      const status = e.target.value;
                      setPaymentModal(p => {
                        const rate = p.totalAmount;
                        if (status === 'Paid') return { ...p, paymentStatus: status, advanceAmount: rate, dueAmount: 0 };
                        if (status === 'Due') return { ...p, paymentStatus: status, advanceAmount: 0, dueAmount: rate };
                        return { ...p, paymentStatus: status, advanceAmount: 0, dueAmount: rate };
                      });
                    }}
                    className="w-full h-14 px-6 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all appearance-none"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Advance">Advance</option>
                    <option value="Due">Due</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1 mb-2">Payment Method *</label>
                  <select 
                    required
                    value={paymentModal.paymentMethod}
                    onChange={(e) => setPaymentModal(p => ({...p, paymentMethod: e.target.value}))}
                    className="w-full h-14 px-6 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all appearance-none"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Online">Online</option>
                  </select>
                </div>
              </div>

              {paymentModal.paymentStatus === 'Advance' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1 mb-2">Advance (₹) *</label>
                    <input 
                      type="number" 
                      required min="0" max={paymentModal.totalAmount}
                      value={paymentModal.advanceAmount}
                      onChange={(e) => {
                        const adv = Number(e.target.value);
                        setPaymentModal(p => ({ ...p, advanceAmount: adv, dueAmount: Math.max(0, p.totalAmount - adv) }));
                      }}
                      className="w-full h-14 px-6 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1 mb-2">Due (₹)</label>
                    <div className="w-full h-14 px-6 bg-beige/30 border border-beige/50 rounded-2xl font-bold text-muted flex items-center cursor-not-allowed">
                      ₹{paymentModal.dueAmount}
                    </div>
                  </div>
                </div>
              )}

              <div className={\`p-6 rounded-3xl border-2 transition-colors \${
                paymentModal.remark === 'S' ? 'bg-[#FEF9C3]/20 border-[#D97706]/20' :
                paymentModal.remark === 'SB' ? 'bg-[#7C3AED]/5 border-[#7C3AED]/20' : 'bg-[#0891B2]/5 border-[#0891B2]/20'
              }\`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-muted uppercase tracking-widest">Total Amount (₹)</p>
                  </div>
                  <input
                    type="number"
                    min="0"
                    required
                    value={paymentModal.totalAmount}
                    onChange={(e) => {
                      const newTotal = Number(e.target.value);
                      setPaymentModal(p => {
                        const adv = p.paymentStatus === 'Paid' ? newTotal : (p.paymentStatus === 'Advance' ? Math.min(p.advanceAmount, newTotal) : 0);
                        const due = p.paymentStatus === 'Due' ? newTotal : (p.paymentStatus === 'Advance' ? Math.max(0, newTotal - adv) : 0);
                        return { ...p, totalAmount: newTotal, advanceAmount: adv, dueAmount: due };
                      });
                    }}
                    className={\`w-32 text-right bg-transparent outline-none text-4xl font-extrabold tracking-tight \${
                      paymentModal.remark === 'S' ? 'text-[#D97706]' : paymentModal.remark === 'SB' ? 'text-[#7C3AED]' : 'text-[#0891B2]'
                    }\`}
                  />
                </div>
              </div>
            
              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setPaymentModal(null)} className="flex-1 px-6 py-4 bg-white text-forest border border-beige rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-offwhite active:scale-95 transition-all shadow-sm">Cancel</button>
                <button type="submit"
                  className={\`flex-[2] px-6 py-4 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-luxury active:scale-95 \${
                    paymentModal.remark === 'S' ? 'bg-gradient-to-br from-[#F59E0B] to-[#D97706] shadow-[#D97706]/30' :
                    paymentModal.remark === 'SB' ? 'bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] shadow-[#7C3AED]/30' : 
                    'bg-gradient-to-br from-[#06B6D4] to-[#0891B2] shadow-[#0891B2]/30'
                  }\`}>Confirm & Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

  const filteredClients`;

const startIdx = content.indexOf(oldModalStart);
const endIdx = content.lastIndexOf(oldModalEnd);
content = content.substring(0, startIdx) + newModal + content.substring(endIdx + oldModalEnd.length);

fs.writeFileSync(filePath, content);
console.log('Attendance.jsx updated successfully.');
