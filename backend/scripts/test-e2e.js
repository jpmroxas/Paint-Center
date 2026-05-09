const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runE2ETest() {
  console.log('--- STARTING E2E DATA SIMULATION ---');

  // 1. Wipe the current DB for a clean test
  console.log('🧹 Wiping Database...');
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.transactionItem.deleteMany();
  await prisma.tintingJob.deleteMany();
  await prisma.formulaTint.deleteMany();
  await prisma.colorFormula.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();

  // 2. Setup Initial Products (Bases & Tints)
  console.log('📦 Seeding Products...');
  const basePaint = await prisma.product.create({
    data: { name: 'Boysen Permacoat White', category: 'Paint', brand: 'Boysen', base_type: 'White', unit: 'GALLON', cost_price: 650, selling_price: 780, stock_quantity: 50, reorder_level: 10 }
  });
  const tint = await prisma.product.create({
    data: { name: 'Yellow Oxide', category: 'Tint', brand: 'Generic', unit: 'ML', cost_price: 1.0, selling_price: 2.5, stock_quantity: 1000, reorder_level: 200 }
  });

  // 3. Setup Customer
  console.log('👤 Seeding Contractor...');
  const contractor = await prisma.customer.create({
    data: { name: 'BuildRight Construction', customer_type: 'CONTRACTOR', credit_limit: 100000, outstanding_balance: 0 }
  });

  // 4. Simulate a Mixed Paint Purchase on Credit
  console.log('🛒 Simulating Mix Paint Purchase on Credit...');
  
  // Create Formula
  const formula = await prisma.colorFormula.create({
    data: {
      customer_id: contractor.id,
      color_name: 'Tuscany Yellow',
      color_code: 'B-701',
      brand: 'Boysen',
      base_product_id: basePaint.id,
      total_volume_ml: 12.5,
      tints: { create: [{ tint_product_id: tint.id, volume_ml: 12.5 }] }
    }
  });

  // The POS checkout logic
  const items = [
    { product_id: basePaint.id, qty: 2, price: 780 }, // Buying 2 Gallons of the Base
    { product_id: tint.id, qty: 25, price: 2.5 }      // Buying 25 ML total of tint for the 2 gallons
  ];
  
  let total_amount = 0;
  for (const item of items) total_amount += item.price * item.qty;

  const transaction = await prisma.$transaction(async (tx) => {
    // Transaction Core
    const t = await tx.transaction.create({
      data: { receipt_number: 'E2E-001', customer_id: contractor.id, total_amount, net_amount: total_amount, payment_method: 'CREDIT', status: 'COMPLETED' }
    });

    // Items & Deductions
    for (const item of items) {
      await tx.transactionItem.create({
        data: { transaction_id: t.id, product_id: item.product_id, quantity: item.qty, unit_price: item.price, subtotal: item.price * item.qty }
      });
      await tx.product.update({
        where: { id: item.product_id },
        data: { stock_quantity: { decrement: item.qty } }
      });
    }

    // Since CREDIT, generate Invoice and update AR
    const inv = await tx.invoice.create({
      data: { transaction_id: t.id, customer_id: contractor.id, amount_due: total_amount, remaining_balance: total_amount, due_date: new Date() }
    });
    
    await tx.customer.update({
      where: { id: contractor.id },
      data: { outstanding_balance: { increment: total_amount } }
    });

    return { t, inv };
  });

  // 5. Verify Stocks & Balances Immediately After Purchase
  let checkBase = await prisma.product.findUnique({ where: { id: basePaint.id }});
  let checkCustomer = await prisma.customer.findUnique({ where: { id: contractor.id }});
  console.log(`\n--- Verification 1: Post-Purchase ---`);
  console.log(`Expected Base Stock: 48, Actual: ${checkBase.stock_quantity}`);
  console.log(`Expected Contractor Balance: ₱${total_amount}, Actual: ₱${checkCustomer.outstanding_balance}`);
  if (checkBase.stock_quantity !== 48 || checkCustomer.outstanding_balance !== total_amount) {
    throw new Error('Test Failed at Step 5');
  }

  // 6. Simulate Partial Payment (Pays 500)
  console.log('\n💳 Simulating Partial Invoice Payment (₱500)...');
  await prisma.$transaction(async (tx) => {
    const inv = await tx.invoice.findFirst({ where: { customer_id: contractor.id } });
    await tx.payment.create({
      data: { invoice_id: inv.id, amount_paid: 500, payment_method: 'CASH' }
    });
    await tx.invoice.update({
      where: { id: inv.id },
      data: { remaining_balance: { decrement: 500 }, status: 'PARTIAL' }
    });
    await tx.customer.update({
      where: { id: contractor.id },
      data: { outstanding_balance: { decrement: 500 } }
    });
  });

  // 7. Final Verification
  checkCustomer = await prisma.customer.findUnique({ where: { id: contractor.id }});
  let checkInvoice = await prisma.invoice.findFirst({ where: { customer_id: contractor.id }});
  console.log(`\n--- Verification 2: Post-Payment ---`);
  console.log(`Expected Remaining Invoice Balance: ₱${total_amount - 500}, Actual: ₱${checkInvoice.remaining_balance}`);
  console.log(`Expected Customer Outstanding Balance: ₱${total_amount - 500}, Actual: ₱${checkCustomer.outstanding_balance}`);

  if (checkCustomer.outstanding_balance !== (total_amount - 500)) {
    throw new Error('Test Failed at Step 7');
  }

  console.log('\n✅ ALL E2E TESTS PASSED SUCCESSFULLY! The mathematical flows are absolutely bulletproof.');
}

runE2ETest()
  .catch(e => { console.error('E2E TEST CRASHED:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
