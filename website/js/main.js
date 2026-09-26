/**
 * Signage - Clean & Concise Landing Page Logic
 * Features:
 * 1. Mobile navigation toggle
 * 2. Currency Switcher (BZD ↔ USD, $1 USD = $2 BZD)
 * 3. Annual Billing Toggle (2 Months Free)
 * 4. Interactive Quote Calculator
 * 5. Form submission (AJAX to contact.php) + WhatsApp direct connect
 * 6. Accessible FAQ accordion
 * 7. Smooth scrolling
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initPricingCalculator();
  initQuoteEstimator();
  initFaqAccordion();
  initContactForm();
  initSmoothScroll();
});

/* --------------------------------------------------------------------------
   1. Mobile Menu
   -------------------------------------------------------------------------- */
function initMobileMenu() {
  const toggleBtn = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');

  if (!toggleBtn || !navMenu) return;

  toggleBtn.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('open');
    toggleBtn.setAttribute('aria-expanded', isOpen);
    toggleBtn.innerHTML = isOpen
      ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
      : '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';
  });

  navMenu.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('open');
      toggleBtn.setAttribute('aria-expanded', 'false');
      toggleBtn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';
    });
  });
}

/* --------------------------------------------------------------------------
   2. Pricing Calculator (BZD / USD Toggle & Annual Discount)
   -------------------------------------------------------------------------- */
const PRICING_DATA = {
  bzd: {
    standard: { monthly: 30, annual: 300 }, // 10 months (2 free)
    fleet: { monthly: 25, annual: 250 },    // 10 months (2 free)
    setupByod: 100,
    setupStick: 250
  },
  usd: {
    standard: { monthly: 15, annual: 150 },
    fleet: { monthly: 12.5, annual: 125 },
    setupByod: 50,
    setupStick: 125
  }
};

let currentCurrency = 'bzd';
let isAnnualBilling = false;

function initPricingCalculator() {
  const btnBzd = document.getElementById('currencyBzd');
  const btnUsd = document.getElementById('currencyUsd');
  const billingToggle = document.getElementById('billingPeriodToggle');

  if (!btnBzd || !btnUsd || !billingToggle) return;

  btnBzd.addEventListener('click', () => {
    currentCurrency = 'bzd';
    btnBzd.classList.add('active');
    btnUsd.classList.remove('active');
    updatePricingCards();
    updateQuoteCalculation();
  });

  btnUsd.addEventListener('click', () => {
    currentCurrency = 'usd';
    btnUsd.classList.add('active');
    btnBzd.classList.remove('active');
    updatePricingCards();
    updateQuoteCalculation();
  });

  billingToggle.addEventListener('change', () => {
    isAnnualBilling = billingToggle.checked;
    const calcBilling = document.getElementById('calcBillingCycle');
    if (calcBilling) {
      calcBilling.value = isAnnualBilling ? 'annual' : 'monthly';
    }
    updatePricingCards();
    updateQuoteCalculation();
  });

  // Connect "Configure" buttons on cards to quote estimator & form
  document.querySelectorAll('.select-plan-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const planName = btn.getAttribute('data-plan');
      const calcPlanSelect = document.getElementById('calcPlanSelect');
      const rangeInput = document.getElementById('calcScreensRange');
      const countDisplay = document.getElementById('calcScreenCountDisplay');
      const contactPlan = document.getElementById('contactPlan');
      const contactScreens = document.getElementById('contactScreens');

      if (planName === 'Standard') {
        if (calcPlanSelect) calcPlanSelect.value = 'standard';
        if (rangeInput) {
          rangeInput.value = 1;
          if (countDisplay) countDisplay.textContent = '1 Screen';
        }
        if (contactPlan) contactPlan.value = 'Standard (1-2 Screens)';
        if (contactScreens) contactScreens.value = '1 Screen';
      } else if (planName === 'Fleet') {
        if (calcPlanSelect) calcPlanSelect.value = 'fleet';
        if (rangeInput) {
          rangeInput.value = 3;
          if (countDisplay) countDisplay.textContent = '3 Screens';
        }
        if (contactPlan) contactPlan.value = 'Fleet Volume (3+ Screens)';
        if (contactScreens) contactScreens.value = '3 Screens';
      } else if (planName === 'Setup') {
        if (calcPlanSelect) calcPlanSelect.value = 'auto';
      }

      updateQuoteCalculation();

      const quoteSection = document.getElementById('quote');
      if (quoteSection) {
        quoteSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  updatePricingCards();
}

function updatePricingCards() {
  const sym = currentCurrency === 'bzd' ? '$' : 'US $';
  const currTag = currentCurrency === 'bzd' ? 'BZD' : 'USD';
  const data = PRICING_DATA[currentCurrency];

  const pStandard = isAnnualBilling ? data.standard.annual : data.standard.monthly;
  const pFleet = isAnnualBilling ? data.fleet.annual : data.fleet.monthly;
  const periodStandard = isAnnualBilling ? '/ screen/yr' : '/ screen/mo';
  const periodFleet = isAnnualBilling ? '/ screen/yr' : '/ screen/mo';

  const elStandard = document.getElementById('priceStandard');
  const perStandard = document.getElementById('periodStandard');
  const subStandard = document.getElementById('subtextStandard');

  const elFleet = document.getElementById('priceFleet');
  const perFleet = document.getElementById('periodFleet');
  const subFleet = document.getElementById('subtextFleet');

  const elSetup = document.getElementById('priceSetup');
  const perSetup = document.getElementById('periodSetup');
  const subSetup = document.getElementById('subtextSetup');

  if (elStandard) elStandard.textContent = `${sym}${pStandard}`;
  if (perStandard) perStandard.textContent = periodStandard;
  if (subStandard) {
    subStandard.textContent = isAnnualBilling 
      ? `Includes 2 mos free (${sym}${data.standard.monthly * 2} ${currTag} saved)`
      : '1 to 2 screens • Cancel anytime';
  }

  if (elFleet) elFleet.textContent = `${sym}${pFleet}`;
  if (perFleet) perFleet.textContent = periodFleet;
  if (subFleet) {
    subFleet.textContent = isAnnualBilling
      ? `Includes 2 mos free + FREE setup! (${sym}${data.fleet.monthly * 2} ${currTag} saved)`
      : 'Automatic savings for 3 or more screens';
  }

  if (elSetup) {
    elSetup.textContent = `${sym}${data.setupByod}`;
  }
  if (perSetup) perSetup.textContent = '/ screen one-time';
  if (subSetup) {
    subSetup.textContent = isAnnualBilling
      ? '100% FREE with Annual Pre-Paid!'
      : 'Or FREE with annual or 3+ screens!';
  }
}

/* --------------------------------------------------------------------------
   3. Quote Estimator
   -------------------------------------------------------------------------- */
function initQuoteEstimator() {
  const rangeInput = document.getElementById('calcScreensRange');
  const planSelect = document.getElementById('calcPlanSelect');
  const hardwareSelect = document.getElementById('calcHardwareSelect');
  const billingSelect = document.getElementById('calcBillingCycle');
  const applyBtn = document.getElementById('applyQuoteToForm');

  if (!rangeInput || !planSelect || !hardwareSelect || !billingSelect) return;

  rangeInput.addEventListener('input', () => {
    const countDisplay = document.getElementById('calcScreenCountDisplay');
    const val = parseInt(rangeInput.value, 10);
    if (countDisplay) {
      countDisplay.textContent = val === 1 ? '1 Screen' : `${val} Screens`;
    }
    updateQuoteCalculation();
  });

  planSelect.addEventListener('change', updateQuoteCalculation);
  hardwareSelect.addEventListener('change', updateQuoteCalculation);
  
  billingSelect.addEventListener('change', () => {
    isAnnualBilling = billingSelect.value === 'annual';
    const billingToggle = document.getElementById('billingPeriodToggle');
    if (billingToggle) {
      billingToggle.checked = isAnnualBilling;
    }
    updatePricingCards();
    updateQuoteCalculation();
  });

  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      const screensVal = parseInt(rangeInput.value, 10);
      const planVal = planSelect.value;
      const contactScreens = document.getElementById('contactScreens');
      const contactPlan = document.getElementById('contactPlan');
      const contactMsg = document.getElementById('contactMessage');

      if (contactScreens) {
        if (screensVal === 1) contactScreens.value = '1 Screen';
        else if (screensVal === 2) contactScreens.value = '2 Screens';
        else if (screensVal === 3) contactScreens.value = '3 Screens';
        else if (screensVal === 4) contactScreens.value = '4 Screens';
        else if (screensVal <= 9) contactScreens.value = '5-9 Screens';
        else contactScreens.value = '10+ Screens';
      }

      if (contactPlan) {
        if (planVal === 'standard' || (planVal === 'auto' && screensVal < 3)) {
          contactPlan.value = 'Standard (1-2 Screens)';
        } else {
          contactPlan.value = 'Fleet Volume (3+ Screens)';
        }
      }

      const totalMonthly = document.getElementById('calcMonthlyTotal')?.textContent || '';
      const totalSetup = document.getElementById('calcSetupTotal')?.textContent || '';
      if (contactMsg) {
        contactMsg.value = `Inquiry for ${screensVal} screen(s). Estimated Software: ${totalMonthly}, Setup: ${totalSetup}. Please contact me to schedule a demo.`;
      }

      const inquiryForm = document.getElementById('inquiryForm');
      if (inquiryForm) {
        inquiryForm.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  updateQuoteCalculation();
}

function updateQuoteCalculation() {
  const rangeInput = document.getElementById('calcScreensRange');
  const planSelect = document.getElementById('calcPlanSelect');
  const hardwareSelect = document.getElementById('calcHardwareSelect');
  const billingSelect = document.getElementById('calcBillingCycle');

  if (!rangeInput || !planSelect || !hardwareSelect || !billingSelect) return;

  const screens = parseInt(rangeInput.value, 10);
  const planOption = planSelect.value;
  const hardware = hardwareSelect.value;
  const isAnnual = billingSelect.value === 'annual';

  // Determine monthly rate per screen in BZD
  let monthlyPerScreenBzd = 30; // standard default
  if (planOption === 'fleet' || (planOption === 'auto' && screens >= 3)) {
    monthlyPerScreenBzd = 25; // volume discount
  } else if (planOption === 'standard') {
    monthlyPerScreenBzd = 30;
  }

  // Calculate software subscription (annual = 10 months, 2 months free)
  let softwareTotalBzd = screens * monthlyPerScreenBzd;
  if (isAnnual) {
    softwareTotalBzd = screens * (monthlyPerScreenBzd * 10);
  }

  // Calculate one-time setup fee
  // Perk: On-site BYOD setup is 100% FREE if annual billing OR if screens >= 3!
  let setupTotalBzd = 0;
  let isFreeSetupPromo = false;

  if (hardware === 'byod') {
    if (isAnnual || screens >= 3) {
      setupTotalBzd = 0;
      isFreeSetupPromo = true;
    } else {
      setupTotalBzd = screens * 100;
    }
  } else if (hardware === 'stick') {
    // 4K Stick includes hardware
    setupTotalBzd = screens * 250;
  } else if (hardware === 'none') {
    setupTotalBzd = 0;
  }

  const mult = currentCurrency === 'usd' ? 0.5 : 1;
  const sym = currentCurrency === 'usd' ? 'US $' : '$';
  const currTag = currentCurrency === 'usd' ? 'USD' : 'BZD';

  const monthlyEl = document.getElementById('calcMonthlyTotal');
  const setupEl = document.getElementById('calcSetupTotal');
  const savingsEl = document.getElementById('calcAnnualSavings');

  if (monthlyEl) {
    const val = (softwareTotalBzd * mult).toFixed(0);
    const period = isAnnual ? '/yr' : '/mo';
    monthlyEl.innerHTML = `${sym}${val} ${currTag}<small style="font-size:13px; font-weight:600; color:var(--text-muted);">${period}</small>`;
  }

  if (setupEl) {
    if (isFreeSetupPromo) {
      const originalSetupVal = (screens * 100 * mult).toFixed(0);
      setupEl.innerHTML = `<span style="color:var(--success); font-weight:800;">FREE</span> <span style="text-decoration:line-through; font-size:13px; color:var(--text-muted);">${sym}${originalSetupVal} ${currTag}</span>`;
    } else {
      const val = (setupTotalBzd * mult).toFixed(0);
      setupEl.textContent = `${sym}${val} ${currTag}`;
    }
  }

  if (savingsEl) {
    let perks = [];
    if (screens >= 3) {
      const volSave = ((screens * 5) * (isAnnual ? 10 : 1) * mult).toFixed(0);
      perks.push(`Volume rate applied (${sym}${volSave} ${currTag} savings)`);
    }
    if (isAnnual) {
      const annualSave = ((screens * monthlyPerScreenBzd * 2) * mult).toFixed(0);
      perks.push(`2 months free software (${sym}${annualSave} ${currTag} saved)`);
    }
    if (isFreeSetupPromo) {
      const setupSave = (screens * 100 * mult).toFixed(0);
      perks.push(`FREE on-site setup (${sym}${setupSave} ${currTag} value)`);
    }

    if (perks.length > 0) {
      savingsEl.style.display = 'block';
      savingsEl.innerHTML = `✓ ` + perks.join('<br>✓ ');
    } else {
      savingsEl.style.display = 'none';
    }
  }
}

/* --------------------------------------------------------------------------
   4. FAQ Accordion
   -------------------------------------------------------------------------- */
function initFaqAccordion() {
  // Support semantic HTML5 <details class="faq-card"> elements
  const faqDetails = document.querySelectorAll('details.faq-card');
  if (faqDetails.length) {
    faqDetails.forEach(detail => {
      detail.addEventListener('toggle', () => {
        if (detail.open) {
          faqDetails.forEach(other => {
            if (other !== detail && other.open) {
              other.open = false;
            }
          });
        }
      });
    });
    return;
  }

  // Fallback for non-details markup if present
  const faqCards = document.querySelectorAll('.faq-card');
  if (!faqCards.length) return;

  faqCards.forEach(card => {
    const questionBtn = card.querySelector('.faq-question');
    const answer = card.querySelector('.faq-answer');
    if (!questionBtn || !answer) return;

    questionBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const isOpen = card.classList.contains('active') || card.classList.contains('open');

      // Close all other cards
      faqCards.forEach(other => {
        if (other !== card) {
          other.classList.remove('active', 'open');
          const otherBtn = other.querySelector('.faq-question');
          if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
        }
      });

      if (!isOpen) {
        card.classList.add('active', 'open');
        questionBtn.setAttribute('aria-expanded', 'true');
      } else {
        card.classList.remove('active', 'open');
        questionBtn.setAttribute('aria-expanded', 'false');
      }
    });
  });
}

/* --------------------------------------------------------------------------
   5. Contact Form Validation & WhatsApp Connect
   -------------------------------------------------------------------------- */
function initContactForm() {
  const form = document.getElementById('inquiryForm');
  const statusBox = document.getElementById('formStatus');
  const waBtn = document.getElementById('waDirectBtn');

  const contactPhone = '5016086328';

  if (waBtn) {
    waBtn.addEventListener('click', () => {
      const name = document.getElementById('contactName')?.value.trim() || 'Owner';
      const business = document.getElementById('contactBusiness')?.value.trim() || '';
      const plan = document.getElementById('contactPlan')?.value || 'Standard (1-2 Screens)';
      const screens = document.getElementById('contactScreens')?.value || '1 Screen';
      const location = document.getElementById('contactLocation')?.value || 'San Pedro';
      const totalMonthly = document.getElementById('calcMonthlyTotal')?.textContent || '';
      const totalSetup = document.getElementById('calcSetupTotal')?.textContent || '';

      const text = encodeURIComponent(
        `Hello! I would like to request a demo of Signage:\n\n` +
        `Name: ${name}\n` +
        (business ? `Business: ${business}\n` : '') +
        `Location: ${location}\n` +
        `Screens: ${screens}\n` +
        `Selected Option: ${plan}\n` +
        (totalMonthly ? `Est. Software: ${totalMonthly}\n` : '') +
        (totalSetup ? `Est. Setup: ${totalSetup}\n` : '')
      );

      window.open(`https://wa.me/${contactPhone}?text=${text}`, '_blank');
    });
  }

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('contactName')?.value.trim();
    const phone = document.getElementById('contactPhone')?.value.trim();
    const business = document.getElementById('contactBusiness')?.value.trim();
    const email = document.getElementById('contactEmail')?.value.trim();
    const location = document.getElementById('contactLocation')?.value;
    const plan = document.getElementById('contactPlan')?.value;
    const screens = document.getElementById('contactScreens')?.value;
    const message = document.getElementById('contactMessage')?.value.trim();

    if (!name || !phone) {
      showFormStatus('Please enter your name and phone/WhatsApp number.', 'error');
      return;
    }

    const payload = {
      name,
      phone,
      business,
      email,
      location,
      plan,
      screens,
      message
    };

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>Sending...</span>`;
    }

    const recipientEmail = 'info@vvstechnologies.bz';
    let emailSent = false;

    try {
      // 1. Primary: Hostinger PHP mailer endpoint
      const response = await fetch('contact.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        if (result && result.success) {
          emailSent = true;
        }
      }
    } catch (phpErr) {
      // Not hosted on PHP or network glitch; proceed to static fallback
    }

    if (!emailSent) {
      try {
        // 2. Secondary: Cloud FormSubmit API directly to info@vvstechnologies.bz (for static hosts like Vercel)
        const cloudRes = await fetch(`https://formsubmit.co/ajax/${recipientEmail}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            _subject: `New Signage Demo Inquiry: ${business ? business + ' - ' + name : name}`,
            _template: 'table',
            'Contact Name': name,
            'WhatsApp / Phone': phone,
            'Business / Venue': business || 'Not specified',
            'Email Address': email || 'Not provided',
            'Location in Belize': location,
            'Setup Option': plan,
            'Number of Screens': screens,
            'Notes / Requirements': message || 'None'
          })
        });

        if (cloudRes.ok) {
          emailSent = true;
        }
      } catch (cloudErr) {
        // Static cloud API also unavailable
      }
    }

    if (emailSent) {
      showFormStatus(
        `✓ Thank you! Your demo request has been sent directly to ${recipientEmail}. Our technician will reach out on WhatsApp shortly.`,
        'success'
      );
      form.reset();
    } else {
      // 3. Resilient Fallback: Mailto directly to info@vvstechnologies.bz + WhatsApp connect
      showFormStatus(
        `Inquiry ready! Connecting to ${recipientEmail} and WhatsApp...`,
        'success'
      );

      const mailtoSub = encodeURIComponent(`Signage Demo Request: ${business ? business + ' (' + name + ')' : name}`);
      const mailtoBody = encodeURIComponent(
        `Name: ${name}\n` +
        `Phone / WhatsApp: ${phone}\n` +
        (business ? `Business: ${business}\n` : '') +
        (email ? `Email: ${email}\n` : '') +
        `Location: ${location}\n` +
        `Plan: ${plan}\n` +
        `Screens: ${screens}\n` +
        (message ? `Notes: ${message}\n` : '')
      );

      // Trigger mailto so client's mail app opens directly to info@vvstechnologies.bz
      window.location.href = `mailto:${recipientEmail}?subject=${mailtoSub}&body=${mailtoBody}`;

      setTimeout(() => {
        const text = encodeURIComponent(
          `Hi! I submitted a demo inquiry for Signage:\n\n` +
          `Name: ${name}\n` +
          (business ? `Business: ${business}\n` : '') +
          `Screens: ${screens}\n` +
          `Plan: ${plan}`
        );
        window.open(`https://wa.me/${contactPhone}?text=${text}`, '_blank');
      }, 1200);
    }

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  });

  function showFormStatus(msg, type) {
    if (!statusBox) return;
    statusBox.className = `form-status ${type}`;
    statusBox.textContent = msg;
    statusBox.style.display = 'block';
    statusBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

/* --------------------------------------------------------------------------
   6. Smooth Scrolling for Anchor Links
   -------------------------------------------------------------------------- */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}
