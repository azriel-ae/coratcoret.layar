      document.getElementById("year").textContent = new Date().getFullYear();

      const DEFAULT_PRODUCTS = [
        {
          id: "p1",
          name: "Custom Design T-Shirt",
          desc: "Cotton Combed Premium Custom Design",
          subDesc: "Cotton combed berkualitas dengan sablon tajam & lembut.",
          img: "assets/gambar/t-shirt.png",
          price: 0,
        },
        {
          id: "p2",
          name: "Custom Design Hoodie",
          desc: "Fleece Premium Custom Design",
          subDesc: "Bahan tebal hangat dengan hasil print detail & awet.",
          img: "assets/gambar/hoodie.png",
          price: 0,
        },
        {
          id: "p3",
          name: "Custom Design Flag",
          desc: "Bahan Kain Satin/Satinet Custom Design",
          subDesc: "Bendera komunitas / event dengan warna tajam anti pudar.",
          img: "assets/gambar/flag.png",
          price: 0,
        },
        {
          id: "p4",
          name: "Custom Design Sticker",
          desc: "Stiker Vinyl Waterproof Custom Design",
          subDesc: "Vinyl waterproof, die-cut/kiss-cut siap tempel.",
          img: "assets/gambar/sticker.png",
          price: 0,
        },
        {
          id: "p5",
          name: "Custom Design Tote Bag",
          desc: "Kanvas Premium Custom Design",
          subDesc: "Kanvas tebal kuat untuk kebutuhan harian & hobi.",
          img: "assets/gambar/totebag.png",
          price: 0,
        },
        {
          id: "p6",
          name: "Custom Design Jersey",
          desc: "Dryfit Sublimation Custom Design",
          subDesc: "Sublimasi full print untuk tim olahraga atau esport.",
          img: "assets/gambar/jersey.png",
          price: 0,
        },
        {
          id: "p7",
          name: "Custom Design Lainnya",
          desc: "Request Khusus Custom Design Customer",
          subDesc: "Punya ide unik lain? Konsultasikan langsung dengan kami.",
          img: "assets/gambar/lainyya.png",
          price: 0,
        },
      ];

      const DEFAULT_ACCOUNTS = [{ username: "admin", pass: "123", role: "Owner" }];

      function getStoredProducts() {
        const stored = localStorage.getItem("ccl_products");
        if (!stored) {
          localStorage.setItem("ccl_products", JSON.stringify(DEFAULT_PRODUCTS));
          return DEFAULT_PRODUCTS;
        }

        let products = JSON.parse(stored);

        // Migrasi data lama: kalau produk yang sudah tersimpan di browser
        // belum punya field "price" (dibuat sebelum fitur harga ada),
        // tambahkan otomatis dengan nilai 0 supaya tidak error/undefined.
        let needsMigration = false;
        products = products.map((p) => {
          if (typeof p.price === "undefined") {
            needsMigration = true;
            return { ...p, price: 0 };
          }
          return p;
        });

        if (needsMigration) {
          localStorage.setItem("ccl_products", JSON.stringify(products));
        }

        return products;
      }

      function saveStoredProducts(products) {
        localStorage.setItem("ccl_products", JSON.stringify(products));
        renderProducts();
      }

      function getStoredAccounts() {
        const stored = localStorage.getItem("ccl_accounts");
        if (!stored) {
          localStorage.setItem("ccl_accounts", JSON.stringify(DEFAULT_ACCOUNTS));
          return DEFAULT_ACCOUNTS;
        }
        return JSON.parse(stored);
      }

      function saveStoredAccounts(accounts) {
        localStorage.setItem("ccl_accounts", JSON.stringify(accounts));
      }

      let activeUserSession = JSON.parse(sessionStorage.getItem("ccl_session")) || null;

      function renderProducts() {
        const products = getStoredProducts();
        const container = document.getElementById("productGridContainer");
        container.innerHTML = "";

        products.forEach((p) => {
          const card = document.createElement("article");
          card.className = "product-card glass-box";
          card.innerHTML = `
          <div class="product-img-wrapper">
            <img src="${p.img}" alt="${p.name}" onerror="this.src='https://placehold.co/400x300/181528/fff?text=${encodeURIComponent(p.name)}'" />
          </div>
          <div class="product-content">
            <h3 class="product-title">${p.name}</h3>
            <p class="product-desc">${p.subDesc || p.desc}</p>
            ${Number(p.price) > 0 ? `<p class="product-price" style="font-weight:700; color:var(--primary); margin: 4px 0 8px;">Rp ${Number(p.price).toLocaleString("id-ID")}</p>` : ""}
            <button class="product-btn" onclick="addToCart('${p.id}', '${p.name.replace(/'/g, "\\'")}', '${p.desc.replace(/'/g, "\\'")}', '${p.img.replace(/'/g, "\\'")}', ${Number(p.price) || 0}, this)">
              <i class="fa-solid fa-plus"></i> Tambah ke Keranjang
            </button>
          </div>
        `;
          container.appendChild(card);
        });
      }

      renderProducts();

      // Update navbar session indicator
      function updateAdminNavState() {
        const btnText = document.getElementById("adminNavText");
        if (activeUserSession) {
          btnText.textContent = activeUserSession.username;
        } else {
          btnText.textContent = "Admin";
        }
      }
      updateAdminNavState();

      function openAdminModal() {
        if (activeUserSession) {
          openAdminDashboard();
        } else {
          document.getElementById("loginAlert").style.display = "none";
          document.getElementById("adminLoginModal").classList.add("active");
        }
      }

      function closeAdminModal() {
        document.getElementById("adminLoginModal").classList.remove("active");
      }

      function handleAdminLogin(e) {
        e.preventDefault();
        const userVal = document.getElementById("adminUsername").value.trim();
        const passVal = document.getElementById("adminPassword").value.trim();
        const alertBox = document.getElementById("loginAlert");

        const accounts = getStoredAccounts();
        const match = accounts.find((a) => a.username === userVal && a.pass === passVal);

        if (match) {
          activeUserSession = match;
          sessionStorage.setItem("ccl_session", JSON.stringify(match));
          closeAdminModal();
          updateAdminNavState();
          openAdminDashboard();
        } else {
          alertBox.textContent = "Username atau password salah!";
          alertBox.style.display = "block";
        }
      }

      function handleAdminLogout() {
        activeUserSession = null;
        sessionStorage.removeItem("ccl_session");
        closeAdminDashboard();
        updateAdminNavState();
      }

      function openAdminDashboard() {
        if (!activeUserSession) return;
        document.getElementById("dashboardGreeting").textContent =
          `Dashboard Admin: ${activeUserSession.username}`;
        document.getElementById("userRoleBadge").textContent =
          `Role Hak Akses: ${activeUserSession.role}`;
        document.getElementById("adminDashboardModal").classList.add("active");

        switchAdminTab("products");
        renderAdminProductTable();
        renderAdminAccountTable();
      }

      function closeAdminDashboard() {
        document.getElementById("adminDashboardModal").classList.remove("active");
      }

      function switchAdminTab(tab) {
        const tabProdBtn = document.getElementById("tabProductBtn");
        const tabAccBtn = document.getElementById("tabAccountBtn");
        const viewProd = document.getElementById("adminTabProducts");
        const viewAcc = document.getElementById("adminTabAccounts");

        if (tab === "products") {
          tabProdBtn.classList.add("active");
          tabAccBtn.classList.remove("active");
          viewProd.style.display = "block";
          viewAcc.style.display = "none";
        } else {
          tabProdBtn.classList.remove("active");
          tabAccBtn.classList.add("active");
          viewProd.style.display = "none";
          viewAcc.style.display = "block";
        }
      }

      function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (evt) {
          const base64Img = evt.target.result;
          document.getElementById("pImgUrl").value = base64Img;
          document.getElementById("pImgPreview").src = base64Img;
          document.getElementById("pImgPreviewContainer").style.display = "block";
        };
        reader.readAsDataURL(file);
      }

      function saveProduct() {
        const editId = document.getElementById("editProductId").value;
        const name = document.getElementById("pName").value.trim();
        const desc = document.getElementById("pDesc").value.trim();
        const subDesc = document.getElementById("pSubDesc").value.trim();
        const price = Number(document.getElementById("pPrice").value) || 0;
        let img = document.getElementById("pImgUrl").value.trim();

        if (!name || !desc) {
          alert("Mohon isi nama produk dan deskripsi bahan!");
          return;
        }

        if (!img) {
          img = "https://placehold.co/400x300/181528/fff?text=" + encodeURIComponent(name);
        }

        let products = getStoredProducts();

        if (editId) {
          // Update Existing Product
          products = products.map((p) => {
            if (p.id === editId) {
              return { ...p, name, desc, subDesc, img, price };
            }
            return p;
          });
        } else {
          // Add New Product
          const newId = "p_" + Date.now();
          products.push({ id: newId, name, desc, subDesc, img, price });
        }

        saveStoredProducts(products);
        resetProductForm();
        renderAdminProductTable();
      }

      function editProduct(id) {
        const products = getStoredProducts();
        const target = products.find((p) => p.id === id);
        if (!target) return;

        document.getElementById("editProductId").value = target.id;
        document.getElementById("pName").value = target.name;
        document.getElementById("pDesc").value = target.desc;
        document.getElementById("pSubDesc").value = target.subDesc || "";
        document.getElementById("pPrice").value = target.price || 0;
        document.getElementById("pImgUrl").value = target.img;
        document.getElementById("pImgPreview").src = target.img;
        document.getElementById("pImgPreviewContainer").style.display = "block";
        document.getElementById("productFormTitle").textContent = "Edit Produk: " + target.name;
      }

      function deleteProduct(id) {
        if (!confirm("Apakah kamu yakin ingin menghapus produk ini?")) return;
        let products = getStoredProducts();
        products = products.filter((p) => p.id !== id);
        saveStoredProducts(products);
        renderAdminProductTable();
      }

      function resetProductForm() {
        document.getElementById("editProductId").value = "";
        document.getElementById("pName").value = "";
        document.getElementById("pDesc").value = "";
        document.getElementById("pSubDesc").value = "";
        document.getElementById("pPrice").value = "";
        document.getElementById("pImgUrl").value = "";
        document.getElementById("pImgFile").value = "";
        document.getElementById("pImgPreviewContainer").style.display = "none";
        document.getElementById("productFormTitle").textContent = "Tambah / Edit Produk Baru";
      }

      function renderAdminProductTable() {
        const products = getStoredProducts();
        const tbody = document.getElementById("adminProductTableBody");
        tbody.innerHTML = "";

        products.forEach((p) => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
          <td><img src="${p.img}" class="admin-p-img" onerror="this.src='https://placehold.co/100x100/181528/fff?text=IMG'" /></td>
          <td style="font-weight:600;">${p.name}</td>
          <td style="color:var(--text-muted);">${p.desc}</td>
          <td style="white-space:nowrap; color:var(--text-muted);">Rp ${Number(p.price || 0).toLocaleString("id-ID")}</td>
          <td style="white-space:nowrap;">
            <button class="btn btn-ghost" style="padding:5px 10px; font-size:11px; margin-right:4px;" onclick="editProduct('${p.id}')">
              <i class="fa-solid fa-pen"></i> Edit
            </button>
            <button class="btn btn-ghost" style="padding:5px 10px; font-size:11px; color:#ff8b94; border-color:rgba(225,29,42,0.3);" onclick="deleteProduct('${p.id}')">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        `;
          tbody.appendChild(tr);
        });
      }

      function createNewAdminAccount() {
        const u = document.getElementById("newAdminUser").value.trim();
        const p = document.getElementById("newAdminPass").value.trim();

        if (!u || !p) {
          alert("Isi username dan password untuk akun admin baru!");
          return;
        }

        const accounts = getStoredAccounts();
        if (accounts.some((a) => a.username === u)) {
          alert("Username ini sudah ada!");
          return;
        }

        accounts.push({ username: u, pass: p, role: "Admin" });
        saveStoredAccounts(accounts);

        document.getElementById("newAdminUser").value = "";
        document.getElementById("newAdminPass").value = "";
        alert('Akun admin baru "' + u + '" berhasil dibuat!');
        renderAdminAccountTable();
      }

      function deleteAdminAccount(username) {
        if (username === "admin") {
          alert("Akun Owner utama tidak dapat dihapus!");
          return;
        }
        if (!confirm('Hapus akun admin "' + username + '"?')) return;

        let accounts = getStoredAccounts();
        accounts = accounts.filter((a) => a.username !== username);
        saveStoredAccounts(accounts);
        renderAdminAccountTable();
      }

      function renderAdminAccountTable() {
        const accounts = getStoredAccounts();
        const tbody = document.getElementById("adminUserTableBody");
        tbody.innerHTML = "";

        accounts.forEach((a) => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
          <td style="font-weight:600;">${a.username}</td>
          <td><span style="padding:2px 8px; border-radius:10px; font-size:11px; background:${a.role === "Owner" ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.1)"}; color:${a.role === "Owner" ? "var(--accent-gold)" : "var(--text-main)"}">${a.role}</span></td>
          <td style="white-space:nowrap;">
            ${a.role !== "Owner" ? `<button class="btn btn-ghost" style="padding:5px 10px; font-size:11px; color:#ff8b94;" onclick="deleteAdminAccount('${a.username}')"><i class="fa-solid fa-user-minus"></i> Hapus</button>` : '<span style="font-size:11px; color:var(--text-muted);">Protected</span>'}
          </td>
        `;
          tbody.appendChild(tr);
        });
      }

      // 1. Theme Toggle Logic (Light / Dark Mode)
      const themeToggleBtn = document.getElementById("themeToggleBtn");
      const mobileThemeToggleBtn = document.getElementById("mobileThemeToggleBtn");
      const themeIcon = document.getElementById("themeIcon");
      const mobileThemeIcon = document.getElementById("mobileThemeIcon");
      const htmlTag = document.documentElement;

      function setTheme(mode) {
        htmlTag.setAttribute("data-theme", mode);
        localStorage.setItem("theme", mode);
        if (mode === "light") {
          themeIcon.className = "fa-solid fa-sun";
          mobileThemeIcon.className = "fa-solid fa-sun";
        } else {
          themeIcon.className = "fa-solid fa-moon";
          mobileThemeIcon.className = "fa-solid fa-moon";
        }
      }

      const savedTheme = localStorage.getItem("theme") || "dark";
      setTheme(savedTheme);

      function toggleTheme() {
        const currentTheme = htmlTag.getAttribute("data-theme");
        setTheme(currentTheme === "dark" ? "light" : "dark");
      }

      themeToggleBtn.addEventListener("click", toggleTheme);
      mobileThemeToggleBtn.addEventListener("click", toggleTheme);

      // 2. Mobile Menu Navigation Logic
      const navToggle = document.getElementById("navToggle");
      const mobileMenuDrawer = document.getElementById("mobileMenuDrawer");
      const mobileMenuOverlay = document.getElementById("mobileMenuOverlay");
      const mobileNavItems = document.querySelectorAll(".mobile-nav-item");

      function toggleMobileMenu() {
        const isOpen = mobileMenuDrawer.classList.contains("active");
        if (isOpen) {
          mobileMenuDrawer.classList.remove("active");
          mobileMenuOverlay.classList.remove("active");
          navToggle.classList.remove("active");
        } else {
          mobileMenuDrawer.classList.add("active");
          mobileMenuOverlay.classList.add("active");
          navToggle.classList.add("active");
        }
      }

      navToggle.addEventListener("click", toggleMobileMenu);
      mobileMenuOverlay.addEventListener("click", toggleMobileMenu);
      mobileNavItems.forEach((item) => {
        item.addEventListener("click", () => {
          mobileMenuDrawer.classList.remove("active");
          mobileMenuOverlay.classList.remove("active");
          navToggle.classList.remove("active");
        });
      });

      // 3. Navbar scroll effect
      window.addEventListener("scroll", () => {
        const navbar = document.getElementById("navbar");
        if (window.scrollY > 30) {
          navbar.classList.add("scrolled");
        } else {
          navbar.classList.remove("scrolled");
        }
      });

      // 4. Typing Effect Logic
      const typingText = document.getElementById("typingText");
      const words = [
        "Custom Design T-Shirt",
        "Custom Design Hoodie",
        "Custom Design Flag",
        "Custom Design Sticker",
        "Custom Design Tote Bag",
        "Custom Design Jersey",
      ];
      let wordIndex = 0;
      let charIndex = 0;
      let isDeleting = false;

      function typeEffect() {
        const currentWord = words[wordIndex];

        if (isDeleting) {
          typingText.textContent = currentWord.substring(0, charIndex - 1);
          charIndex--;
        } else {
          typingText.textContent = currentWord.substring(0, charIndex + 1);
          charIndex++;
        }

        let speed = isDeleting ? 40 : 80;

        if (!isDeleting && charIndex === currentWord.length) {
          speed = 1800; // Pause at end of word
          isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
          isDeleting = false;
          wordIndex = (wordIndex + 1) % words.length;
          speed = 400;
        }

        setTimeout(typeEffect, speed);
      }

      typeEffect();

      // 5. Shopping Cart System
      let cart = [];
      const cartOverlay = document.getElementById("cartOverlay");
      const cartPanel = document.getElementById("cartPanel");
      const openCartBtn = document.getElementById("openCartBtn");
      const closeCartBtn = document.getElementById("closeCartBtn");
      const cartBadgeCount = document.getElementById("cartBadgeCount");
      const cartItemsContainer = document.getElementById("cartItemsContainer");
      const cartEmptyMsg = document.getElementById("cartEmptyMsg");
      const checkoutWaBtn = document.getElementById("checkoutWaBtn");

      function openCart() {
        cartOverlay.classList.add("active");
        cartPanel.classList.add("active");
      }

      function closeCart() {
        cartOverlay.classList.remove("active");
        cartPanel.classList.remove("active");
      }

      openCartBtn.addEventListener("click", openCart);
      closeCartBtn.addEventListener("click", closeCart);
      cartOverlay.addEventListener("click", closeCart);

      function addToCart(id, name, desc, img, price, btn) {
        const existing = cart.find((item) => item.name === name);
        if (existing) {
          existing.qty += 1;
        } else {
          cart.push({ id, name, desc, img, price: Number(price) || 0, qty: 1 });
        }

        if (btn) {
          const originalText = btn.innerHTML;
          btn.classList.add("added");
          btn.innerHTML = '<i class="fa-solid fa-check"></i> Ditambahkan!';
          setTimeout(() => {
            btn.classList.remove("added");
            btn.innerHTML = originalText;
          }, 1200);
        }

        renderCart();
      }

      function updateQty(name, delta) {
        const item = cart.find((i) => i.name === name);
        if (!item) return;
        item.qty += delta;
        if (item.qty <= 0) {
          cart = cart.filter((i) => i.name !== name);
        }
        renderCart();
      }

      function renderCart() {
        const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
        const totalPrice = cart.reduce((sum, item) => sum + item.qty * (Number(item.price) || 0), 0);
        const cartTotalRow = document.getElementById("cartTotalRow");
        const cartTotalValue = document.getElementById("cartTotalValue");

        if (totalItems > 0) {
          cartBadgeCount.style.display = "flex";
          cartBadgeCount.textContent = totalItems;
          cartEmptyMsg.style.display = "none";
          checkoutWaBtn.disabled = false;
          if (cartTotalRow) cartTotalRow.style.display = "flex";
          if (cartTotalValue) cartTotalValue.textContent = "Rp " + totalPrice.toLocaleString("id-ID");
        } else {
          cartBadgeCount.style.display = "none";
          cartEmptyMsg.style.display = "block";
          checkoutWaBtn.disabled = true;
          if (cartTotalRow) cartTotalRow.style.display = "none";
        }

        // Render cart DOM items
        const itemElements = cartItemsContainer.querySelectorAll(".cart-item-row");
        itemElements.forEach((el) => el.remove());

        cart.forEach((item) => {
          const row = document.createElement("div");
          row.className = "cart-item-row";
          row.innerHTML = `
          <img src="${item.img}" class="cart-item-img" alt="${item.name}" onerror="this.src='https://placehold.co/100x100/181528/fff?text=Product'" />
          <div class="cart-item-info">
            <div class="cart-item-title">${item.name}</div>
            <div class="cart-item-desc">${item.desc}</div>
            <div class="cart-item-controls">
              <button class="qty-btn" onclick="updateQty('${item.name}', -1)">-</button>
              <span style="font-size: 12px; font-weight: 700; padding: 0 4px;">${item.qty}</span>
              <button class="qty-btn" onclick="updateQty('${item.name}', 1)">+</button>
            </div>
          </div>
        `;
          cartItemsContainer.appendChild(row);
        });
      }

      function checkoutToWhatsApp() {
        if (!cart.length) return;

        const lines = cart.map((item) => `• ${item.name} (x${item.qty}) - ${item.desc}`);
        const text = `Halo Admin Corat Coret Layar 👋\n\nSaya ingin memesan produk berikut:\n${lines.join("\n")}\n\nMohon info mengenai estimasi pengerjaan & pembayarannya. Terima kasih!`;

        // Catat transaksi ke dashboard /penjualan lewat API (tidak menghambat
        // proses checkout — kalau gagal/lambat, redirect WhatsApp tetap jalan).
        kirimTransaksiKeDashboard();

        const url = `https://wa.me/6281333385899?text=${encodeURIComponent(text)}`;
        window.open(url, "_blank");
      }

      // Kirim ringkasan keranjang saat ini sebagai 1 transaksi ke dashboard
      // penjualan (/api/v1/sales). Karena landing page & dashboard berada di
      // satu domain Vercel yang sama, cukup panggil path relatif ini.
      async function kirimTransaksiKeDashboard() {
        try {
          const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
          const totalHarga = cart.reduce((sum, item) => sum + item.qty * (Number(item.price) || 0), 0);
          const productSummary = cart.map((item) => `${item.name} (x${item.qty})`).join(", ");

          const res = await fetch("/api/v1/sales", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              customer: "Pelanggan WhatsApp",
              product: productSummary,
              qty: totalQty,
              total: totalHarga,
              payment_method: "WhatsApp Order",
              status: "Pending",
            }),
          });

          const data = await res.json();
          if (!data.success) {
            console.error("Gagal mencatat transaksi ke dashboard:", data.error);
          }
        } catch (err) {
          // Jangan sampai kegagalan pencatatan menghentikan proses checkout
          // pelanggan — redirect ke WhatsApp tetap harus jalan.
          console.error("Gagal mencatat transaksi ke dashboard:", err);
        }
      }
