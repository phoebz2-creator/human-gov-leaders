let leaders = [];

const provinces = [
    { name: "北京", file: "beijing" },
    { name: "上海", file: "shanghai" },
    { name: "天津", file: "tianjin" },
    { name: "重庆", file: "chongqing" },
  
    { name: "河北", file: "hebei" },
    { name: "山西", file: "shanxi" },
    { name: "辽宁", file: "liaoning" },
    { name: "吉林", file: "jilin" },
    { name: "黑龙江", file: "heilongjiang" },
  
    { name: "江苏", file: "jiangsu" },
    { name: "浙江", file: "zhejiang" },
    { name: "安徽", file: "anhui" },
    { name: "福建", file: "fujian" },
    { name: "江西", file: "jiangxi" },
    { name: "山东", file: "shandong" },
  
    { name: "河南", file: "henan" },
    { name: "湖北", file: "hubei" },
    { name: "湖南", file: "hunan" },
    { name: "广东", file: "guangdong" },
  
    { name: "海南", file: "hainan" },
    { name: "四川", file: "sichuan" },
    { name: "贵州", file: "guizhou" },
    { name: "云南", file: "yunnan" },
    { name: "陕西", file: "shaanxi" },
  
    { name: "甘肃", file: "gansu" },
    { name: "青海", file: "qinghai" },
    { name: "台湾", file: "taiwan" },
  
    { name: "内蒙古", file: "inner_mongolia" },
    { name: "广西", file: "guangxi" },
    { name: "西藏", file: "xizang" },
    { name: "宁夏", file: "ningxia" },
    { name: "新疆", file: "xinjiang" },
  
    { name: "香港", file: "hongkong" },
    { name: "澳门", file: "macau" }
  ];

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
    fetch("./data/all_leaders_combined.json")
      .then(res => res.json())
      .then(allData => {
        
        // 💡 核心修复行：如果是对象格式，用 Object.values 把它强制转换成数组
        const dataArray = Array.isArray(allData) ? allData : Object.values(allData).flat();
  
        // 使用转换后的标准数组进行过滤
        const provinceData = dataArray.filter(item => item.province === province);
  
        leaders = provinceData.map((item, index) => ({
          id: index + 1,
          ...item
        }));
  
        renderList();
  
        document.querySelectorAll(".card")
          .forEach(c => c.classList.remove("active"));
  
        if (leaders.length > 0) {
          showDetail(leaders[0].id);
        } else {
          document.getElementById("leaderDetail").innerHTML = `<h2>暂无数据</h2><p>该省份数据正在对齐中。</p>`;
        }
      })
      .catch(err => console.error("数据加载失败:", err));
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
    const container = document.querySelector(".sidebar");
  
    container.innerHTML = `<div class="group-title">地方省份</div>`;
  
    provinces.forEach(p => {
      const btn = document.createElement("div");
      btn.className = "province-btn";   // ⚠️ 关键：统一样式
      btn.textContent = p.name;
  
      btn.onclick = () => loadProvince(p.file);
  
      container.appendChild(btn);
    });
  }
  
