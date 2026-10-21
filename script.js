/**
 * Dream Home Decor - Client Side Script
 * Fast, Interactive Order Checkout & WhatsApp Integration
 */

document.addEventListener('DOMContentLoaded', () => {
  // Current State
  let currentProduct = {
    title: 'প্রিমিয়াম কাঠের চুড়ির আলমারি (লাইটিংসহ)',
    unitPrice: 699,
    img: 'assets/product-1.jpg',
    qty: 1
  };
  let currentShipping = 150;
  let currentZoneName = 'সারা বাংলাদেশ';

  // DOM Elements
  const summaryTitle = document.getElementById('summaryTitle');
  const summaryImg = document.getElementById('summaryImg');
  const summaryUnitPrice = document.getElementById('summaryUnitPrice');
  const qtyVal = document.getElementById('qtyVal');
  const qtyMinus = document.getElementById('qtyMinus');
  const qtyPlus = document.getElementById('qtyPlus');
  const subTotal = document.getElementById('subTotal');
  const deliveryCharge = document.getElementById('deliveryCharge');
  const deliveryLabel = document.getElementById('deliveryLabel');
  const grandTotal = document.getElementById('grandTotal');
  const submitTotal = document.getElementById('submitTotal');
  const mobileStickyTotal = document.getElementById('mobileStickyTotal');
  const orderForm = document.getElementById('orderForm');
  const shippingCards = document.querySelectorAll('.shipping-card');
  const successModal = document.getElementById('successModal');
  const closeModalBtn = document.getElementById('closeModalBtn');

  // Convert numbers to Bengali digits
  const toBengaliNumber = (num) => {
    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/\d/g, (d) => banglaDigits[d]);
  };

  // Update Summary Calculation
  const updateSummary = () => {
    const prodSub = currentProduct.unitPrice * currentProduct.qty;
    const total = prodSub + currentShipping;

    if (summaryTitle) summaryTitle.textContent = currentProduct.title;
    if (summaryImg) summaryImg.src = currentProduct.img;
    if (summaryUnitPrice) summaryUnitPrice.textContent = toBengaliNumber(currentProduct.unitPrice);
    if (qtyVal) qtyVal.textContent = currentProduct.qty;
    if (subTotal) subTotal.textContent = toBengaliNumber(prodSub);
    if (deliveryCharge) deliveryCharge.textContent = toBengaliNumber(currentShipping);
    if (deliveryLabel) deliveryLabel.textContent = currentZoneName;
    if (grandTotal) grandTotal.textContent = toBengaliNumber(total);
    if (submitTotal) submitTotal.textContent = toBengaliNumber(total);
    if (mobileStickyTotal) mobileStickyTotal.textContent = toBengaliNumber(total);
  };

  // Quantity Change Events
  if (qtyMinus && qtyPlus) {
    qtyMinus.addEventListener('click', () => {
      if (currentProduct.qty > 1) {
        currentProduct.qty--;
        updateSummary();
      }
    });

    qtyPlus.addEventListener('click', () => {
      if (currentProduct.qty < 20) {
        currentProduct.qty++;
        updateSummary();
      }
    });
  }

  // Shipping Selection Event
  shippingCards.forEach((card) => {
    card.addEventListener('click', () => {
      shippingCards.forEach((c) => c.classList.remove('selected'));
      card.classList.add('selected');
      const radio = card.querySelector('input[type="radio"]');
      if (radio) {
        radio.checked = true;
        currentShipping = parseInt(radio.value, 10);
        currentZoneName = radio.getAttribute('data-zone') || 'হোম ডেলিভারি';
        updateSummary();
      }
    });
  });

  // Product Select Buttons
  const selectButtons = document.querySelectorAll('.select-product-btn, .quick-order-trigger');
  selectButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const title = btn.getAttribute('data-product');
      const price = parseInt(btn.getAttribute('data-price'), 10);
      const img = btn.getAttribute('data-img');

      if (title && price) {
        currentProduct.title = title;
        currentProduct.unitPrice = price;
        currentProduct.img = img || 'assets/product-1.jpg';
        currentProduct.qty = 1;
        updateSummary();

        // Smooth scroll to order section
        const targetSection = document.getElementById('order-section');
        if (targetSection) {
          targetSection.scrollIntoView({ behavior: 'smooth' });
          const nameInput = document.getElementById('custName');
          if (nameInput) {
            setTimeout(() => nameInput.focus(), 600);
          }
        }
      }
    });
  });

  // Countdown Timer
  const hoursEl = document.getElementById('hours');
  const minutesEl = document.getElementById('minutes');
  const secondsEl = document.getElementById('seconds');

  if (hoursEl && minutesEl && secondsEl) {
    let timeLeft = 14 * 3600 + 42 * 60 + 18;
    setInterval(() => {
      if (timeLeft > 0) {
        timeLeft--;
        const h = Math.floor(timeLeft / 3600);
        const m = Math.floor((timeLeft % 3600) / 60);
        const s = timeLeft % 60;
        hoursEl.textContent = toBengaliNumber(h < 10 ? '0' + h : h);
        minutesEl.textContent = toBengaliNumber(m < 10 ? '0' + m : m);
        secondsEl.textContent = toBengaliNumber(s < 10 ? '0' + s : s);
      }
    }, 1000);
  }

  // Order Form Submission
  if (orderForm) {
    orderForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('custName').value.trim();
      const phone = document.getElementById('custPhone').value.trim();
      const address = document.getElementById('custAddress').value.trim();
      const note = document.getElementById('custNote') ? document.getElementById('custNote').value.trim() : '';

      // Validate inputs
      if (!name) {
        alert('অনুগ্রহ করে আপনার পুরো নাম লিখুন।');
        document.getElementById('custName').focus();
        return;
      }
      if (!phone || phone.length < 11) {
        alert('অনুগ্রহ করে ১১ ডিজিটের সঠিক মোবাইল নম্বর দিন।');
        document.getElementById('custPhone').focus();
        return;
      }
      if (!address || address.length < 8) {
        alert('অনুগ্রহ করে সম্পূর্ণ বিস্তারিত ঠিকানা লিখুন।');
        document.getElementById('custAddress').focus();
        return;
      }

      const totalBill = currentProduct.unitPrice * currentProduct.qty + currentShipping;
      const orderNumber = 'DHD-' + Math.floor(1000 + Math.random() * 9000);

      // Populate Modal
      const modalCustName = document.getElementById('modalCustName');
      const modalOrderNum = document.getElementById('modalOrderNum');
      const modalProdTitle = document.getElementById('modalProdTitle');
      const modalTotalBill = document.getElementById('modalTotalBill');
      const modalWhatsAppBtn = document.getElementById('modalWhatsAppBtn');

      if (modalCustName) modalCustName.textContent = name;
      if (modalOrderNum) modalOrderNum.textContent = '#' + orderNumber;
      if (modalProdTitle) modalProdTitle.textContent = `${currentProduct.title} (পরিমাণ: ${currentProduct.qty}টি)`;
      if (modalTotalBill) modalTotalBill.textContent = '৳' + toBengaliNumber(totalBill);

      // Build WhatsApp message
      const waText = encodeURIComponent(
        `*নতুন অর্ডার (${orderNumber}) - Dream Home Decor*\n\n` +
        `👤 *কাস্টমার:* ${name}\n` +
        `📞 *ফোন:* ${phone}\n` +
        `📍 *ঠিকানা:* ${address}\n` +
        `📦 *প্রোডাক্ট:* ${currentProduct.title}\n` +
        `🔢 *পরিমাণ:* ${currentProduct.qty} টি\n` +
        `🚚 *ডেলিভারি এরিয়া:* ${currentZoneName} (৳${currentShipping})\n` +
        `💵 *সর্বমোট প্রদেয়:* ৳${totalBill}\n` +
        (note ? `📝 *বিশেষ নোট:* ${note}\n` : '') +
        `\n_ক্যাশ অন ডেলিভারিতে অর্ডারটি কনফার্ম করুন।_`
      );

      if (modalWhatsAppBtn) {
        modalWhatsAppBtn.href = `https://wa.me/8801883132344?text=${waText}`;
      }

      // Show Native <dialog> Modal
      if (successModal && typeof successModal.showModal === 'function') {
        successModal.showModal();
      } else {
        alert(`ধন্যবাদ ${name}! আপনার অর্ডারটি (#${orderNumber}) সফলভাবে নেওয়া হয়েছে। মোট বিল: ৳${totalBill}।`);
      }

      // Reset form
      orderForm.reset();
      currentProduct.qty = 1;
      updateSummary();
    });
  }

  // Close Modal
  if (closeModalBtn && successModal) {
    closeModalBtn.addEventListener('click', () => {
      successModal.close();
    });

    // Close when clicking outside modal box
    successModal.addEventListener('click', (e) => {
      const rect = successModal.getBoundingClientRect();
      const isInDialog = (
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width
      );
      if (!isInDialog) {
        successModal.close();
      }
    });
  }

  // Initial Summary Render
  updateSummary();
});
