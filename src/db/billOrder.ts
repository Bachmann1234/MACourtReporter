// Oldest-first ordering for the NEW queue, by the numeric part of the bill
// number. postBill.ts drains the queue in this order and queueStatus.ts reports
// it; the two MUST agree, so the comparator lives here and both import it rather
// than each carrying its own copy.
//
// Note this sorts purely on the numeric part — chamber and courtNumber are
// ignored. In steady state only the current court has NEW rows, so a plain
// numeric sort is the intended "oldest filing first" across both chambers.
export function compareByBillNumberAsc(
  a: { billNumber: string },
  b: { billNumber: string }
): number {
  const aDigits = a.billNumber.match(/\d+/);
  const bDigits = b.billNumber.match(/\d+/);
  if (aDigits === null || bDigits === null) {
    throw new Error(`Could not match bill numbers: ${a.billNumber} ${b.billNumber}`);
  }
  return Number.parseInt(aDigits[0], 10) - Number.parseInt(bDigits[0], 10);
}
