export type PricingInputs = {
  totalFinanced: number;
  downPayment: number;
  acquisitionCostRate: number;
  apr: number;
  termMonths: number;
};

export type PricingResult = {
  acquisitionCost: number;
  amountFinanced: number;
  monthlyPayment: number;
  totalOfPayments: number;
  estimatedInterest: number;
};

function money(value: number) {
  return Math.max(0, Number.isFinite(value) ? value : 0);
}

function cents(value: number) {
  return Math.round(value * 100) / 100;
}

export function calculatePricing(input: PricingInputs): PricingResult {
  const totalFinanced = money(input.totalFinanced);
  const acquisitionCost = cents(totalFinanced * (money(input.acquisitionCostRate) / 100));
  const amountFinanced = cents(Math.max(0, totalFinanced + acquisitionCost - money(input.downPayment)));
  const termMonths = Math.max(1, Math.round(money(input.termMonths)));
  const monthlyRate = money(input.apr) / 100 / 12;
  const monthlyPayment = monthlyRate === 0
    ? amountFinanced / termMonths
    : amountFinanced * monthlyRate / (1 - Math.pow(1 + monthlyRate, -termMonths));
  const totalOfPayments = monthlyPayment * termMonths;

  return {
    acquisitionCost,
    amountFinanced,
    monthlyPayment,
    totalOfPayments,
    estimatedInterest: Math.max(0, totalOfPayments - amountFinanced),
  };
}
