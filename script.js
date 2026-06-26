let leaders = [];

let currentLevel = "home";   // home / central / local / province
let isInitialized = false;
const list = document.getElementById("leaderList");
const detail = document.getElementById("leaderDetail");
const searchInput = document.getElementById("searchInput");

function renderList(data = leaders) {
  list.innerHTML = "";

  const groups = [
    { title: "省政府领导", match: person => person.category.includes("省政府领导") },
    { title: "重点部门负责人", match: person => person.category === "重点部门负责人" }
  ];

  groups.forEach(group => {
    const groupData = data.filter(person => group.match(person));

    if (groupData.length > 0) {
      list.innerHTML += `<div class="group-title">${group.title}</div>`;

      groupData.forEach(person => {
        list.innerHTML += `
          <div class="card" onclick="showDetail(${person.id})" id="card-${person.id}">
            <div class="avatar">${person.name.slice(0,1)}</div>
            <div>
              <h3>${person.name}</h3>
              <p>${person.position}</p>
            </div>
          </div>
        `;
      });
    }
  });
}

function showDetail(id) {
  const person = leaders.find(item => item.id === id);

  document.querySelectorAll(".card").forEach(card => card.classList.remove("active"));
  const activeCard = document.getElementById(`card-${id}`);
  if (activeCard) activeCard.classList.add("active");

  detail.innerHTML = `
    <div class="detail-header">
      <h2>${person.name}</h2>
      <p>${person.position}</p>
      <span>${person.category}</span>
    </div>

    <h3>一、基本信息</h3>
    <table>
      ${person.basic.map(row => `
        <tr>
          <th>${row[0]}</th>
          <td>${row[1]}</td>
        </tr>
      `).join("")}
    </table>

    <h3>二、工作经历</h3>
    <ul class="timeline">
      ${person.career.map(item => `<li>${item}</li>`).join("")}
    </ul>

    <h3>三、任免信息</h3>
    <ul class="info-list">
      ${person.appointments.map(item => `<li>${item}</li>`).join("")}
    </ul>

    <h3>四、信息来源</h3>
    <ul class="source-list">
      ${person.sources.map(item => `<li>${item}</li>`).join("")}
    </ul>
  `;
}

searchInput.addEventListener("input", function() {
  const keyword = searchInput.value.trim();

  const result = leaders.filter(person =>
    person.name.includes(keyword) ||
    person.position.includes(keyword) ||
    person.category.includes(keyword)
  );

  renderList(result);

  if (result.length > 0) {
    showDetail(result[0].id);
  } else {
    detail.innerHTML = `<h2>未找到相关人员</h2><p>请尝试搜索姓名、职务或类别。</p>`;
  }
});

function loadProvince(province) {
    fetch("./data/${province}.json")
      .then(res => res.json())
      .then(data => {
  
        leaders = data.map((item, index) => ({
          id: index + 1,
          ...item
        }));
  
        renderList();
  
        // 🔥 强制刷新 UI
        document.querySelectorAll(".card")
          .forEach(c => c.classList.remove("active"));
  
        if (leaders.length > 0) {
          showDetail(leaders[0].id);
        }
      })
      .catch(err => console.error(err));
  }
  
  // 初始化加载
  let currentProvince = "hunan";
loadProvince(currentProvince);
  
  // =======================
  // 顶部菜单切换
  // =======================
  
  const tabs = document.querySelectorAll(".top-tab");
  const sections = document.querySelectorAll(".main-section");
  
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
  
      tabs.forEach(t => t.classList.remove("active"));
      sections.forEach(s => s.classList.remove("active"));
  
      tab.classList.add("active");
  
      document
        .getElementById(tab.dataset.section + "-section")
        .classList.add("active");
    });
  });
  
  // =======================
  // 省份按钮
  // =======================
  
  function initProvinces() {
    if (isInitialized) return;
    isInitialized = true;
    fetch("data/index.json")
      .then(res => res.json())
      .then(list => {
  
        const container = document.querySelector(".sidebar");
        container.innerHTML = ""; // 防止重复
  
        list.forEach(p => {
          const btn = document.createElement("div");
          btn.className = "province-btn";
          btn.textContent = p.name;
  
          btn.addEventListener("click", () => {
  
            document.querySelectorAll(".province-btn")
              .forEach(b => b.classList.remove("active"));
  
            btn.classList.add("active");
  
            loadProvince(p.file);
          });
  
          container.appendChild(btn);
        });
  
        if (list.length > 0) {
          loadProvince(list[0].file);
        }
      });
  }
    
  document.querySelectorAll(".province-btn").forEach(btn => {
    btn.addEventListener("click", () => {
  
      const province = btn.dataset.province;
  
      if (!province) return;
  
      document.querySelectorAll(".province-btn")
        .forEach(b => b.classList.remove("active"));
  
      btn.classList.add("active");
  
      currentProvince = province;
      loadProvince(province);
    });
  });

  function toggleRegion() {
    const list = document.getElementById("provinceList");
    list.style.display = list.style.display === "none" ? "block" : "none";
  }

  function openCentral() {
    fetch("data/central.json")
      .then(res => res.json())
      .then(data => {
        leaders = data;
        renderList();
        showDetail(1);
      });
  }

  function openLocal() {
    const list = [
      { name: "湖南", file: "hunan" },
      { name: "湖北", file: "hubei" }
    ];
  
    const container = document.querySelector(".sidebar");
  
    container.innerHTML = `<div class="group-title">地方省份</div>`;
  
    list.forEach(p => {
      const btn = document.createElement("div");
      btn.className = "card";
      btn.innerHTML = `<h3>${p.name}</h3>`;
  
      btn.onclick = () => loadProvince(p.file);
  
      container.appendChild(btn);
    });
  }