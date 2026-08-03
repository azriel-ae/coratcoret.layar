/* Corat Coret Layar — Premium JS */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// Smooth scroll (CSS already, but keep navbar behavior nice)
$$('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const href = a.getAttribute('href');
    if (!href || href === '#') return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.pushState(null, '', href);
  });
});

// Header solid on scroll + active nav link
(function initHeader() {
  const header = $('#site-header');
  const links = $$('[data-nav]');
  const sections = links
    .map(l => document.querySelector(l.getAttribute('href') || l.getAttribute('data-nav')))
    .filter(Boolean);

  const setActive = () => {
    let bestId = '#home';
    let bestTop = -Infinity;

    sections.forEach(sec => {
      const rect = sec.getBoundingClientRect();
      // consider when section top is near the header
      const top = -rect.top;
      if (top <= window.innerHeight && top > bestTop) {
        bestTop = top;
        bestId = `#${sec.id}`;
      }
    });

    links.forEach(l => {
      const href = l.getAttribute('href');
      l.classList.toggle('is-active', href === bestId);
    });
  };

  const onScroll = () => {
    if (!header) return;
    header.classList.toggle('is-solid', window.scrollY > 24);
    setActive();
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

// Mobile menu
(function initMobileMenu() {
  const toggle = $('.nav__toggle');
  const mobile = $('#mobile-menu');
  if (!toggle || !mobile) return;

  const close = () => {
    mobile.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  };

  const open = () => {
    mobile.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
  };

  toggle.addEventListener('click', () => {
    const isOpen = mobile.classList.contains('is-open');
    isOpen ? close() : open();
  });

  $$('#mobile-menu [data-mobile-nav]').forEach(a => {
    a.addEventListener('click', close);
  });

  document.addEventListener('click', (e) => {
    if (!mobile.classList.contains('is-open')) return;
    if (mobile.contains(e.target) || toggle.contains(e.target)) return;
    close();
  });
})();

// Ripple effect
(function initRipple() {
  $$('[data-ripple]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      btn.style.setProperty('--ripple-x', `${x}px`);
      btn.style.setProperty('--ripple-y', `${y}px`);

      btn.classList.remove('is-rippling');
      // trigger reflow
      void btn.offsetWidth;
      btn.classList.add('is-rippling');
      setTimeout(() => btn.classList.remove('is-rippling'), 550);
    });
  });

  // adjust ripple pseudo positioning for current button
  const style = document.createElement('style');
  style.textContent = `.ripple::after{left: var(--ripple-x, 50%); top: var(--ripple-y, 50%);}`;
  document.head.appendChild(style);
})();

// Loading overlay
(function initLoading() {
  const overlay = $('#loading');
  if (!overlay) return;

  const done = () => {
    overlay.classList.add('is-hidden');
    setTimeout(() => overlay.remove(), 450);
  };

  window.addEventListener('load', () => {
    // keep a minimum time for nicer effect
    setTimeout(done, 450);
  });

  // fallback
  setTimeout(done, 4000);
})();

// Typing effect
(function initTyping() {
  const el = document.querySelector('[data-typing]');
  if (!el) return;
  const words = (el.getAttribute('data-typing') || '').split(',').map(s => s.trim()).filter(Boolean);

  let i = 0;
  let cur = '';
  let deleting = false;
  let speed = 55;
  let pause = 900;

  const tick = () => {
    const word = words[i % words.length] || '';

    if (!deleting) {
      cur = word.slice(0, cur.length + 1);
      el.textContent = cur;
      speed = 55 + Math.random() * 40;
      if (cur.length === word.length) {
        deleting = true;
        speed = pause;
      }
    } else {
      cur = word.slice(0, Math.max(0, cur.length - 1));
      el.textContent = cur;
      speed = 22 + Math.random() * 20;
      if (cur.length === 0) {
        deleting = false;
        i++;
        speed = 250;
      }
    }

    setTimeout(tick, speed);
  };

  tick();
})();

// Scroll reveal
(function initScrollReveal() {
  const nodes = $$('.reveal-up, .reveal-left, .reveal-right');
  if (!nodes.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('reveal-show');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.18 });

  nodes.forEach(n => io.observe(n));
})();

// Testimonial slider
(function initTestimonial() {
  const track = $('#testimonialTrack');
  if (!track) return;

  const cards = $$('[data-testimonial]', track);
  const prev = $('#tPrev');
  const next = $('#tNext');
  const dotsWrap = $('#tDots');
  if (!cards.length) return;

  let index = 0;
  let timer = null;

  // create dots
  const dots = cards.map((_, idx) => {
    const d = document.createElement('span');
    d.className = 'dot';
    d.setAttribute('role', 'button');
    d.setAttribute('aria-label', `Testimoni ${idx + 1}`);
    d.addEventListener('click', () => go(idx, true));
    dotsWrap.appendChild(d);
    return d;
  });

  const updateDots = () => {
    dots.forEach((d, i) => d.classList.toggle('is-active', i === index));
  };

  const width = () => cards[0].getBoundingClientRect().width + 14; // gap

  const go = (i, resetTimer = false) => {
    index = (i + cards.length) % cards.length;
    track.style.transform = `translateX(${-index * width()}px)`;
    updateDots();
    if (resetTimer) start();
  };

  const start = () => {
    stop();
    timer = setInterval(() => go(index + 1), 4200);
  };

  const stop = () => {
    if (timer) clearInterval(timer);
    timer = null;
  };

  prev?.addEventListener('click', () => go(index - 1));
  next?.addEventListener('click', () => go(index + 1));

  window.addEventListener('resize', () => {
    track.style.transform = `translateX(${-index * width()}px)`;
  });

  updateDots();
  start();

  track.addEventListener('mouseenter', stop);
  track.addEventListener('mouseleave', start);
})();

// FAQ accordion
(function initFAQ() {
  const acc = $('#faqAccordion');
  if (!acc) return;

  $$('.acc-item', acc).forEach(item => {
    const btn = $('.acc-trigger', item);
    const panel = $('.acc-panel', item);
    if (!btn || !panel) return;

    btn.addEventListener('click', () => {
      const isOpen = btn.getAttribute('aria-expanded') === 'true';

      // close others
      $$('.acc-trigger', acc).forEach(b => b.setAttribute('aria-expanded', 'false'));
      $$('.acc-panel', acc).forEach(p => p.hidden = true);

      if (!isOpen) {
        btn.setAttribute('aria-expanded', 'true');
        panel.hidden = false;
      }
    });
  });
})();

// Counter animation (optional)
(function initCounters() {
  const nodes = $$('[data-counter]');
  if (!nodes.length) return;

  const animate = (node) => {
    const target = Number(node.getAttribute('data-counter')) || 0;
    const dur = 950;
    const startVal = 0;
    const t0 = performance.now();

    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const v = Math.floor(startVal + (target - startVal) * (1 - Math.pow(1 - p, 3)));
      node.textContent = v.toLocaleString('id-ID');
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        animate(e.target);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.35 });

  nodes.forEach(n => io.observe(n));
})();

// ============================================================
// Keranjang (Cart) — tambah produk lalu checkout langsung ke WhatsApp
// ============================================================
(function initCart() {
  const WA_PHONE = '6281333385899';

  const addButtons = $$('[data-add-to-cart]');
  const cartFloat = $('#cartFloat');
  const cartBadge = $('#cartBadge');
  const cartOverlay = $('#cartOverlay');
  const cartPanel = $('#cartPanel');
  const cartClose = $('#cartClose');
  const cartItemsWrap = $('#cartItems');
  const cartEmpty = $('#cartEmpty');
  const cartCheckout = $('#cartCheckout');
  const cartCount = $('#cartCount');

  if (!cartFloat || !cartPanel) return;

  /** @type {{id:string, name:string, desc:string, img:string, qty:number, checked:boolean}[]} */
  let cart = [];

  const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const totalQty = () => cart.reduce((sum, i) => sum + i.qty, 0);

  const renderBadge = () => {
    const total = totalQty();
    if (total > 0) {
      cartBadge.hidden = false;
      cartBadge.textContent = String(total);
    } else {
      cartBadge.hidden = true;
    }
  };

  const renderItems = () => {
    cartItemsWrap.innerHTML = '';

    if (!cart.length) {
      cartItemsWrap.appendChild(cartEmpty);
      cartCheckout.disabled = true;
      if (cartCount) cartCount.textContent = '';
      return;
    }

    if (cartCount) {
      const totalItems = cart.length;
      cartCount.textContent = `${totalItems} produk`;
    }

    cart.forEach(item => {
      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `
        <input type="checkbox" class="cart-item__check" ${item.checked ? 'checked' : ''} aria-label="Sertakan ${item.name} saat checkout" />
        <img class="cart-item__thumb" src="${item.img}" alt="${item.name}" loading="lazy" />
        <div class="cart-item__body">
          <div class="cart-item__name">${item.name}</div>
          <div class="cart-item__desc">${item.desc}</div>
          <div class="cart-item__row">
            <div class="cart-item__qty">
              <button type="button" class="qty-btn" data-action="dec" aria-label="Kurangi jumlah">−</button>
              <span class="cart-item__qtyval">${item.qty}</span>
              <button type="button" class="qty-btn" data-action="inc" aria-label="Tambah jumlah">+</button>
            </div>
            <button type="button" class="cart-item__remove" data-action="remove">
              <i class="fa-solid fa-trash"></i> Hapus
            </button>
          </div>
        </div>
      `;

      const checkbox = $('.cart-item__check', row);
      checkbox.addEventListener('change', () => {
        item.checked = checkbox.checked;
        updateCheckoutState();
      });

      $('[data-action="dec"]', row).addEventListener('click', () => {
        item.qty = Math.max(1, item.qty - 1);
        renderAll();
      });

      $('[data-action="inc"]', row).addEventListener('click', () => {
        item.qty += 1;
        renderAll();
      });

      $('[data-action="remove"]', row).addEventListener('click', () => {
        cart = cart.filter(i => i.id !== item.id);
        renderAll();
      });

      cartItemsWrap.appendChild(row);
    });

    updateCheckoutState();
  };

  const updateCheckoutState = () => {
    const anyChecked = cart.some(i => i.checked);
    cartCheckout.disabled = !anyChecked;
  };

  const renderAll = () => {
    renderItems();
    renderBadge();
  };

  const openCart = () => {
    cartOverlay.classList.add('is-open');
    cartPanel.classList.add('is-open');
    cartOverlay.setAttribute('aria-hidden', 'false');
    cartPanel.setAttribute('aria-hidden', 'false');
  };

  const closeCart = () => {
    cartOverlay.classList.remove('is-open');
    cartPanel.classList.remove('is-open');
    cartOverlay.setAttribute('aria-hidden', 'true');
    cartPanel.setAttribute('aria-hidden', 'true');
  };

  const addToCart = (name, desc, img, btn) => {
    const existing = cart.find(i => i.name === name);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ id: uid(), name, desc, img, qty: 1, checked: true });
    }
    renderAll();

    if (btn) {
      const originalHTML = btn.innerHTML;
      btn.classList.add('is-added');
      btn.innerHTML = '<i class="fa-solid fa-check"></i> Ditambahkan';
      setTimeout(() => {
        btn.classList.remove('is-added');
        btn.innerHTML = originalHTML;
      }, 1200);
    }
  };

  addButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.getAttribute('data-name') || 'Produk';
      const desc = btn.getAttribute('data-desc') || '';
      const img = btn.getAttribute('data-img') || '';
      addToCart(name, desc, img, btn);
    });
  });

  cartFloat.addEventListener('click', openCart);
  cartClose.addEventListener('click', closeCart);
  cartOverlay.addEventListener('click', closeCart);

  cartCheckout.addEventListener('click', () => {
    const chosen = cart.filter(i => i.checked);
    if (!chosen.length) return;

    const lines = chosen.map(i => `☑ ${i.name}${i.qty > 1 ? ` x${i.qty}` : ''} - ${i.desc}`);

    const message =
      `Halo Admin Corat Coret Layar 👋\n\n` +
      `Saya ingin memesan produk berikut:\n\n` +
      `${lines.join('\n')}\n\n` +
      `Mohon info lebih lanjut mengenai proses dan harga. Terima kasih 🙏`;

    const url = `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener');
  });

  renderAll();
})();
