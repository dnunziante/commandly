"use client";

import { Calculator, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { calculatePricing } from "@/lib/pricing-calculator";
import type { ProductDTO } from "@/lib/products/types";

const terms = [24, 36, 48, 60, 72, 84];
const formatMoney = (value: number) => value.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

export function PricingCalculator({ products }: { products: ProductDTO[] }) {
  const firstProduct = products[0];
  const [productId, setProductId] = useState(firstProduct?.id || "custom");
  const [totalFinanced, setTotalFinanced] = useState(firstProduct?.price || 0);
  const [downPayment, setDownPayment] = useState(0);
  const [acquisitionCostRate, setAcquisitionCostRate] = useState(0);
  const [apr, setApr] = useState(0);
  const [termMonths, setTermMonths] = useState(60);

  const result = useMemo(() => calculatePricing({ totalFinanced, downPayment, acquisitionCostRate, apr, termMonths }), [totalFinanced, downPayment, acquisitionCostRate, apr, termMonths]);

  function chooseProduct(id: string) {
    setProductId(id);
    const product = products.find((item) => item.id === id);
    if (product) setTotalFinanced(product.price);
  }

  function reset() {
    setProductId(firstProduct?.id || "custom"); setTotalFinanced(firstProduct?.price || 0); setDownPayment(0); setAcquisitionCostRate(0); setApr(0); setTermMonths(60);
  }

  const numberProps = { type: "number", min: 0, step: "0.01" } as const;
  return <div className="pricing-layout">
    <section className="card form-stack pricing-inputs">
      <div className="metric-row"><div><h2>Build an estimate</h2><p>Adjust any field to update the figures immediately.</p></div><button className="btn btn-ghost" type="button" onClick={reset}><RotateCcw size={15}/> Reset</button></div>
      <div><label className="label" htmlFor="pricing-product">Product or configuration</label><select className="input" id="pricing-product" value={productId} onChange={(event) => chooseProduct(event.target.value)}>{products.map((product) => <option value={product.id} key={product.id}>{product.name} · {product.model || "Standard"} · ${product.price.toLocaleString()}</option>)}<option value="custom">Total Delivered</option></select></div>
      <div><label className="label" htmlFor="total-financed">Total Financed</label><input className="input" id="total-financed" {...numberProps} value={totalFinanced} onChange={(event) => { setTotalFinanced(Number(event.target.value)); setProductId("custom"); }}/></div>
      <div className="grid grid-2"><div><label className="label" htmlFor="down-payment">Down payment</label><input className="input" id="down-payment" {...numberProps} value={downPayment} onChange={(event) => setDownPayment(Number(event.target.value))}/></div><div><label className="label" htmlFor="acquisition-cost-rate">Acq. Cost rate</label><div className="input-suffix"><input className="input" id="acquisition-cost-rate" {...numberProps} value={acquisitionCostRate} onChange={(event) => setAcquisitionCostRate(Number(event.target.value))}/><span>%</span></div></div></div>
      <div className="grid grid-2"><div><label className="label" htmlFor="apr">Estimated APR</label><div className="input-suffix"><input className="input" id="apr" {...numberProps} value={apr} onChange={(event) => setApr(Number(event.target.value))}/><span>%</span></div></div><div><label className="label" htmlFor="term">Loan term</label><select className="input" id="term" value={termMonths} onChange={(event) => setTermMonths(Number(event.target.value))}>{terms.map((term) => <option value={term} key={term}>{term} months</option>)}</select></div></div>
    </section>
    <aside className="card pricing-results">
      <div className="pricing-payment"><span className="metric-icon"><Calculator size={20}/></span><small>Estimated monthly payment</small><strong>{formatMoney(result.monthlyPayment)}</strong><span>for {termMonths} months at {apr.toFixed(2)}% APR</span></div>
      <dl className="pricing-breakdown"><div><dt>Total Financed</dt><dd>{formatMoney(totalFinanced)}</dd></div><div><dt>Acq. Cost ({acquisitionCostRate.toFixed(2)}%)</dt><dd>{formatMoney(result.acquisitionCost)}</dd></div><div><dt>Down payment</dt><dd>{formatMoney(downPayment)}</dd></div><div className="total"><dt>Amount financed</dt><dd>{formatMoney(result.amountFinanced)}</dd></div><div><dt>Estimated interest</dt><dd>{formatMoney(result.estimatedInterest)}</dd></div><div><dt>Total of payments</dt><dd>{formatMoney(result.totalOfPayments)}</dd></div></dl>
      <div className="pricing-disclaimer"><strong>Estimate only</strong><p>Taxes, fees, trade treatment, rates, terms, credit approval, and final payment may differ. Confirm the final figures with an approved lender and current dealership policy.</p></div>
    </aside>
  </div>;
}
