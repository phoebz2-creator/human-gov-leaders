const list = document.getElementById("leader-list");
const detail = document.getElementById("leader-detail");
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

fetch("data/leaders.json")
  .then(response => response.json())
  .then(data => {
    leaders = data.map((item, index) => ({
      id: index + 1,
      ...item
    }));
    renderList();
    showDetail(1);
  });