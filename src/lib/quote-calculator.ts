export type QuoteInputs = {
  vehiclePrice: number;
  accessories: number;
  docFees: number;
  tradeIn: number;
  discount: number;
  salesTax: number;
  extendedWarranties: number;
  tagTitleDmvFee: number;
  destination: number;
  delivery: number;
};

const amount = (value: number) => Math.max(0, Number.isFinite(value) ? value : 0);
const cents = (value: number) => Math.round(value * 100) / 100;

export function calculateQuote(input: QuoteInputs) {
  const subtotal = cents(Math.max(0, amount(input.vehiclePrice) + amount(input.accessories) + amount(input.docFees) - amount(input.tradeIn) - amount(input.discount)));
  const totalDelivered = cents(subtotal + amount(input.salesTax) + amount(input.extendedWarranties) + amount(input.tagTitleDmvFee) + amount(input.destination) + amount(input.delivery));
  return { subtotal, totalDelivered };
}
